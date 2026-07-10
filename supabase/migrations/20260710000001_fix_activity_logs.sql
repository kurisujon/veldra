-- Add foreign key constraint to activity_logs user_id
ALTER TABLE public.activity_logs
ADD CONSTRAINT activity_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.user_roles(user_id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for activity_logs
CREATE POLICY "Reviewers can read activity logs"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can insert activity logs"
    ON public.activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));
