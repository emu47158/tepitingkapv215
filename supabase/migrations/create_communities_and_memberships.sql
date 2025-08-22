/*
  # Create Communities and Community Memberships Tables

  1. New Tables
    - `communities`
      - `id` (uuid, primary key)
      - `name` (text, unique community name)
      - `description` (text, optional description)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `community_memberships`
      - `id` (uuid, primary key)
      - `community_id` (uuid, foreign key to communities)
      - `user_id` (uuid, foreign key to profiles)
      - `role` (text, member role: 'admin', 'member')
      - `joined_at` (timestamp)
    - `community_posts`
      - `id` (uuid, primary key)
      - `community_id` (uuid, foreign key to communities)
      - `user_id` (uuid, foreign key to profiles)
      - `content` (text, post content)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all community tables
    - Add policies for invite-only access
    - Community creators become admins automatically
    - Only members can view community posts
    - Only members can create posts in communities

  3. Indexes
    - Add indexes for efficient querying of memberships and posts
*/

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community memberships table
CREATE TABLE IF NOT EXISTS community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Users can view communities they are members of"
  ON communities
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT community_id 
      FROM community_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communities"
  ON communities
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Community admins can update communities"
  ON communities
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT community_id 
      FROM community_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Community memberships policies
CREATE POLICY "Users can view memberships of their communities"
  ON community_memberships
  FOR SELECT
  TO authenticated
  USING (
    community_id IN (
      SELECT community_id 
      FROM community_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Community admins can manage memberships"
  ON community_memberships
  FOR ALL
  TO authenticated
  USING (
    community_id IN (
      SELECT community_id 
      FROM community_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Community posts policies
CREATE POLICY "Community members can view posts"
  ON community_posts
  FOR SELECT
  TO authenticated
  USING (
    community_id IN (
      SELECT community_id 
      FROM community_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can create posts"
  ON community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    community_id IN (
      SELECT community_id 
      FROM community_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own community posts"
  ON community_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own community posts"
  ON community_posts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id ON community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community_id ON community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- Function to automatically add creator as admin when community is created
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_memberships (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add creator as admin
DROP TRIGGER IF EXISTS add_creator_as_admin_trigger ON communities;
CREATE TRIGGER add_creator_as_admin_trigger
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_admin();
