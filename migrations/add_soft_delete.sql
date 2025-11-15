-- Migration: Add soft delete (deletedAt) column to projects and expenses tables
-- Run this SQL script on your database to add the deletedAt column

-- Add deletedAt column to projects table
ALTER TABLE projects 
ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL;

-- Add deletedAt column to expenses table
ALTER TABLE expenses 
ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL;

-- Create index on deletedAt for better query performance
CREATE INDEX idx_projects_deletedAt ON projects(deletedAt);
CREATE INDEX idx_expenses_deletedAt ON expenses(deletedAt);

