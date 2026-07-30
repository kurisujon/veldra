-- Update create_case_with_applicant to support middle_name
CREATE OR REPLACE FUNCTION public.create_case_with_applicant(
  p_first_name TEXT,
  p_last_name TEXT,
  p_date_of_birth DATE,
  p_middle_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_case_id UUID;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  v_role := get_user_role();

  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO cases (status, created_by) VALUES ('Draft', v_user_id) RETURNING id INTO v_case_id;

  INSERT INTO applicants (case_id, first_name, middle_name, last_name, date_of_birth)
  VALUES (v_case_id, p_first_name, p_middle_name, p_last_name, p_date_of_birth);

  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_case_with_applicant(TEXT, TEXT, DATE, TEXT) TO authenticated;
