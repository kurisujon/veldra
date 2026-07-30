-- Add missing middle_name column to applicants table
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS middle_name TEXT;
