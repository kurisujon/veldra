'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

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
  const supabase = await createClient()

  // Active cases (anything not completed/exported)
  const { count: activeCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'Exported')

  // Pending Review cases
  const { count: pendingCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'NeedsReview')

  // Resolved Today (findings resolved today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: resolvedToday } = await supabase
    .from('findings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Resolved')
    .gte('updated_at', today.toISOString())

  // Calculate average processing time for cases that have progressed past 'Draft'
  const { data: processedCases } = await supabase
    .from('cases')
    .select('created_at, updated_at, status')
    .in('status', ['NeedsReview', 'Reviewed', 'DraftGenerated', 'ReadyForExport', 'Exported'])
    
  let avgProcessingTimeMinutes = 0;
  if (processedCases && processedCases.length > 0) {
    let totalMinutes = 0;
    let count = 0;
    
    for (const c of processedCases) {
      if (c.created_at && c.updated_at) {
        const start = new Date(c.created_at).getTime();
        const end = new Date(c.updated_at).getTime();
        const diffMinutes = (end - start) / (1000 * 60);
        // Only include if diff is positive and realistic (e.g. less than a year to avoid bad data)
        if (diffMinutes > 0 && diffMinutes < 525600) {
          totalMinutes += diffMinutes;
          count++;
        }
      }
    }
    
    if (count > 0) {
      avgProcessingTimeMinutes = Math.round(totalMinutes / count);
    }
  }

  return {
    activeCasesCount: activeCount || 0,
    pendingReviewCount: pendingCount || 0,
    resolvedTodayCount: resolvedToday || 0,
    avgProcessingTimeMinutes
  }
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      id,
      action_type,
      description,
      timestamp,
      user_roles!inner(role)
    `)
    .order('timestamp', { ascending: false })
    .limit(10)

  if (error || !data) {
    return []
  }

  return data.map((log: any) => {
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
      user: log.user_roles?.role || 'System',
      action: log.description,
      time: timeStr,
      timestamp: log.timestamp
    }
  })
}
