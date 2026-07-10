-- Migration: Isolate Drafts and Exports so Reviewers only see those linked to their own Cases
-- Admins retain global access

-- 1. Drop existing permissive policies on generated_drafts
DROP POLICY IF EXISTS "Admins delete drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers delete generated_drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers insert drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers insert generated_drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers select drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers select generated_drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers update drafts" ON generated_drafts;
DROP POLICY IF EXISTS "Reviewers update generated_drafts" ON generated_drafts;

-- 2. Create isolated policies for generated_drafts
CREATE POLICY "Select generated_drafts" ON generated_drafts FOR SELECT TO authenticated
USING (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

CREATE POLICY "Insert generated_drafts" ON generated_drafts FOR INSERT TO authenticated
WITH CHECK (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

CREATE POLICY "Update generated_drafts" ON generated_drafts FOR UPDATE TO authenticated
USING (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

CREATE POLICY "Delete generated_drafts" ON generated_drafts FOR DELETE TO authenticated
USING (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

-- 3. Drop existing permissive policies on export_packages
DROP POLICY IF EXISTS "Admin delete export_packages phase7" ON export_packages;
DROP POLICY IF EXISTS "Reviewers delete export_packages" ON export_packages;
DROP POLICY IF EXISTS "Reviewers insert export_packages phase7" ON export_packages;
DROP POLICY IF EXISTS "Reviewers select export_packages phase7" ON export_packages;
DROP POLICY IF EXISTS "Reviewers update export_packages phase7" ON export_packages;

-- 4. Create isolated policies for export_packages
CREATE POLICY "Select export_packages" ON export_packages FOR SELECT TO authenticated
USING (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

CREATE POLICY "Insert export_packages" ON export_packages FOR INSERT TO authenticated
WITH CHECK (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

CREATE POLICY "Update export_packages" ON export_packages FOR UPDATE TO authenticated
USING (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));

CREATE POLICY "Delete export_packages" ON export_packages FOR DELETE TO authenticated
USING (get_user_role() = 'Admin' OR case_id IN (SELECT id FROM cases WHERE created_by = auth.uid()));
