/*
  # Create Marketplace Storage Bucket

  1. Storage Setup
    - Create `marketplace-images` bucket for item photos
    - Set up public access for marketplace images
    - Configure RLS policies for image uploads

  2. Security
    - Users can upload images to their own folder
    - Images are publicly readable
    - Only authenticated users can upload
*/

-- Create storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-images');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload marketplace images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = 'marketplace' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update own marketplace images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = 'marketplace' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own marketplace images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = 'marketplace' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
