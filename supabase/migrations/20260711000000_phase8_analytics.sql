BEGIN;

-- Create RPC for comprehensive dashboard analytics
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_total_cases INT;
  v_resolved_cases INT;
  v_resolved_today_count INT;
  v_avg_processing_time FLOAT;
  v_cases_by_status JSONB;
  v_findings_by_severity JSONB;
  v_findings_by_category JSONB;
  v_recent_activity JSONB;
  v_employee_stats JSONB;
BEGIN
  -- 1. Get role to enforce security
  v_role := public.get_user_role();
  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Total active cases (not soft deleted)
  SELECT COUNT(*) INTO v_total_cases FROM public.cases WHERE deleted_at IS NULL;

  -- 3. Resolved cases
  SELECT COUNT(*) INTO v_resolved_cases 
  FROM public.cases 
  WHERE status IN ('Exported', 'Archived') AND deleted_at IS NULL;

  -- 4. Resolved findings today
  SELECT COUNT(*) INTO v_resolved_today_count
  FROM public.findings
  WHERE status = 'Resolved' AND updated_at >= date_trunc('day', CURRENT_TIMESTAMP);

  -- 5. Cases by status
  SELECT COALESCE(jsonb_object_agg(status::text, count), '{}'::jsonb)
  INTO v_cases_by_status
  FROM (
    SELECT status, COUNT(*) as count 
    FROM public.cases 
    WHERE deleted_at IS NULL 
    GROUP BY status
  ) t;

  -- 6. Average processing time (hours) for resolved cases
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 0)
  INTO v_avg_processing_time
  FROM public.cases
  WHERE status IN ('Exported', 'Archived') AND deleted_at IS NULL;

  -- 7. Findings by severity
  SELECT COALESCE(jsonb_object_agg(severity::text, count), '{}'::jsonb)
  INTO v_findings_by_severity
  FROM (
    SELECT f.severity, COUNT(*) as count 
    FROM public.findings f
    JOIN public.cases c ON c.id = f.case_id
    WHERE c.deleted_at IS NULL
    GROUP BY f.severity
  ) t;

  -- 8. Findings by category
  SELECT COALESCE(jsonb_object_agg(category::text, count), '{}'::jsonb)
  INTO v_findings_by_category
  FROM (
    SELECT f.category, COUNT(*) as count 
    FROM public.findings f
    JOIN public.cases c ON c.id = f.case_id
    WHERE c.deleted_at IS NULL
    GROUP BY f.category
  ) t;

  -- 9. Recent activity (last 10 logs)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', al.id,
      'case_id', al.case_id,
      'action_type', al.action_type,
      'description', al.description,
      'timestamp', al.timestamp,
      'applicant_name', a.first_name || ' ' || a.last_name,
      'username', ur.username
    )
  ), '[]'::jsonb)
  INTO v_recent_activity
  FROM (
    SELECT id, case_id, user_id, action_type, description, timestamp
    FROM public.activity_logs
    ORDER BY timestamp DESC
    LIMIT 10
  ) al
  LEFT JOIN public.applicants a ON a.case_id = al.case_id
  LEFT JOIN public.user_roles ur ON ur.user_id = al.user_id;

  -- 10. Employee Stats (Admin only)
  IF v_role = 'Admin' THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'user_id', t.user_id,
        'username', t.username,
        'cases_handled', t.cases_handled,
        'actions_performed', t.actions_performed
      )
    ), '[]'::jsonb)
    INTO v_employee_stats
    FROM (
      SELECT 
        ur.user_id, 
        ur.username, 
        COUNT(DISTINCT al.case_id) as cases_handled,
        COUNT(al.id) as actions_performed
      FROM public.user_roles ur
      LEFT JOIN public.activity_logs al ON al.user_id = ur.user_id
      WHERE ur.role <> 'Admin'
      GROUP BY ur.user_id, ur.username
    ) t;
  ELSE
    v_employee_stats := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'total_cases', v_total_cases,
    'resolved_cases', v_resolved_cases,
    'resolved_today_count', v_resolved_today_count,
    'resolution_rate', CASE WHEN v_total_cases > 0 THEN (v_resolved_cases::FLOAT / v_total_cases) * 100 ELSE 0 END,
    'average_processing_time_hours', v_avg_processing_time,
    'cases_by_status', v_cases_by_status,
    'findings_by_severity', v_findings_by_severity,
    'findings_by_category', v_findings_by_category,
    'recent_activity', v_recent_activity,
    'employee_stats', v_employee_stats
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics() TO authenticated;

COMMIT;
