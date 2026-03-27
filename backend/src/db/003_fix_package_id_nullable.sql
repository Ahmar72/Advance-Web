-- Fix package_id to be nullable for draft ads
-- Run this in Supabase SQL Editor if you already ran 001_init_schema.sql

ALTER TABLE ads 
ALTER COLUMN package_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name = 'package_id';
