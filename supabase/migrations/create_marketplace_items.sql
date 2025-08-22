/*
  # Create Marketplace Items Table

  1. New Tables
    - `marketplace_items`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, foreign key to profiles)
      - `title` (text, item title)
      - `description` (text, item description)
      - `price` (decimal, item price)
      - `category` (text, item category)
      - `condition` (text, item condition: 'new', 'like_new', 'good', 'fair', 'poor')
      - `images` (text array, image URLs)
      - `is_sold` (boolean, sold status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on marketplace_items table
    - Add policies for sellers to manage their items
    - Add policies for buyers to view available items
    - Sellers can create, update, and delete their own items
    - All users can view unsold items

  3. Indexes
    - Add indexes for efficient querying by seller, category, and status
*/

-- Create marketplace items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL CHECK (price > 0),
  category text DEFAULT 'other',
  condition text DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  images text[] DEFAULT '{}',
  is_sold boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on marketplace items table
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

-- Marketplace items policies
CREATE POLICY "Anyone can view unsold items"
  ON marketplace_items
  FOR SELECT
  TO authenticated
  USING (is_sold = false);

CREATE POLICY "Sellers can view their own items"
  ON marketplace_items
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Users can create marketplace items"
  ON marketplace_items
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own items"
  ON marketplace_items
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own items"
  ON marketplace_items
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_is_sold ON marketplace_items(is_sold);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_created_at ON marketplace_items(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_marketplace_items_updated_at_trigger ON marketplace_items;
CREATE TRIGGER update_marketplace_items_updated_at_trigger
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_items_updated_at();
