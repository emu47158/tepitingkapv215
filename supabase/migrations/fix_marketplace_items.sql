/*
  # Fix Marketplace Items Table

  1. Updates
    - Update marketplace_items table structure to match interface
    - Change status column to use 'available' instead of is_sold boolean
    - Add location column with default value
    - Update RLS policies to show all available items

  2. Security
    - Update RLS policies to allow viewing all available items
    - Keep seller management policies intact
*/

-- Update marketplace items table structure
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_items' AND column_name = 'status'
  ) THEN
    ALTER TABLE marketplace_items ADD COLUMN status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending'));
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_items' AND column_name = 'location'
  ) THEN
    ALTER TABLE marketplace_items ADD COLUMN location text DEFAULT 'Local';
  END IF;
END $$;

-- Update existing records to have proper status
UPDATE marketplace_items 
SET status = CASE 
  WHEN is_sold = true THEN 'sold'
  ELSE 'available'
END
WHERE status IS NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Anyone can view unsold items" ON marketplace_items;
DROP POLICY IF EXISTS "Sellers can view their own items" ON marketplace_items;

-- Create new RLS policies
CREATE POLICY "Anyone can view available items"
  ON marketplace_items
  FOR SELECT
  TO authenticated
  USING (status = 'available');

CREATE POLICY "Sellers can view all their items"
  ON marketplace_items
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Add index for status column
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
