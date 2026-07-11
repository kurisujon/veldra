'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const DashboardAnalyticsSchema = z.object({
  total_cases: z.number(),
  resolved_cases: z.number(),
  resolved_today_count: z.number(),
  resolution_rate: z.number(),
  average_processing_time_hours: z.number(),
  cases_by_status: z.record(z.string(), z.number()),
  findings_by_severity: z.record(z.string(), z.number()),
  findings_by_category: z.record(z.string(), z.number()),
  recent_activity: z.array(z.object({
    id: z.string().uuid(),
    case_id: z.string().uuid().nullable(),
    action_type: z.string(),
    description: z.string().nullable(),
    timestamp: z.string(),
    applicant_name: z.string().nullable(),
    username: z.string().nullable()
  })),
  employee_stats: z.array(z.object({
    user_id: z.string().uuid(),
    username: z.string().nullable(),
    cases_handled: z.number(),
    actions_performed: z.number()
  }))
});

export type DashboardAnalytics = z.infer<typeof DashboardAnalyticsSchema>;

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_dashboard_analytics')
  
  if (error) {
    console.error('Failed to fetch dashboard analytics:', error)
    throw new Error(`Analytics fetch failed: ${error.message}`)
  }
  
  const parsed = DashboardAnalyticsSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Analytics parsing failed:', parsed.error)
    throw new Error('Analytics response validation failed');
  }
  
  return parsed.data;
}

// Backward compatibility for existing dashboard components
export interface DashboardMetrics {
  activeCasesCount: number
  pendingReviewCount: number
  resolvedTodayCount: number
  avgProcessingTimeMinutes: number
}

export interface RecentActivity {
  id: string
  user: string
  action: string
  time: string
  timestamp: string
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const analytics = await getDashboardAnalytics();
  
  // Calculate active cases (total - Exported - Archived)
  const activeCount = analytics.total_cases - analytics.resolved_cases;
  
  const pendingCount = analytics.cases_by_status['NeedsReview'] || 0;
  
  // Convert average_processing_time_hours to minutes
  const avgProcessingTimeMinutes = Math.round(analytics.average_processing_time_hours * 60);

  return {
    activeCasesCount: activeCount,
    pendingReviewCount: pendingCount,
    resolvedTodayCount: analytics.resolved_today_count,
    avgProcessingTimeMinutes
  }
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const analytics = await getDashboardAnalytics();
  
  return analytics.recent_activity.map((log) => {
    // Basic relative time formatting
    const diffMs = new Date().getTime() - new Date(log.timestamp).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    let timeStr = 'just now'
    if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    else if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`

    return {
      id: log.id,
      user: log.username || 'System',
      action: log.description || log.action_type,
      time: timeStr,
      timestamp: log.timestamp
    }
  })
}
