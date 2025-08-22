/*
  # Add Files Column to Posts Tables

  1. Schema Updates
    - Add `files` column to `posts` table (text array for file URLs)
    - Add `files` column to `community_posts` table (text array for file URLs)

  2. Notes
    - Files column will store URLs to uploaded files in Supabase Storage
    - Anonymous posts will not support file uploads (only text content)
    - File uploads are limited to specific types: PDF, Word, Excel, PowerPoint, text, ZIP
    - Maximum file size: 10MB per file
    - Maximum 3 files per post
*/

-- Add files column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'files'
  ) THEN
    ALTER TABLE posts ADD COLUMN files text[] DEFAULT '{}';
  END IF;
END $$;

-- Add files column to community_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'files'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN files text[] DEFAULT '{}';
  END IF;
END $$;
