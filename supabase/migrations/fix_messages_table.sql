/*
  # Fix Messages Table Structure for Contact Seller Functionality

  1. Drop and Recreate Messages Table
    - Remove the problematic table structure
    - Create new table with proper conversation-based messaging
    - Support both direct messages and marketplace item conversations

  2. New Table Structure
    - `id` (uuid, primary key)
    - `conversation_id` (text) - for grouping messages between users
    - `sender_id` (uuid, foreign key to profiles)
    - `receiver_id` (uuid, foreign key to profiles)
    - `content` (text)
    - `item_id` (uuid, optional foreign key to marketplace_items)
    - `created_at` (timestamp)
    - `read_at` (timestamp, nullable)

  3. Security
    - Enable RLS on new messages table
    - Add policies for conversation participants
*/

-- Drop existing messages table if it exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create new messages table with proper structure
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  item_id uuid REFERENCES marketplace_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages in conversations they participate in
CREATE POLICY "Users can read own conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create messages
CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create indexes for efficient querying
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_item_id ON messages(item_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
