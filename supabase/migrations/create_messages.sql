/*
  # Create Messages Table for Trading Communication

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles)
      - `recipient_id` (uuid, foreign key to profiles)
      - `marketplace_item_id` (uuid, foreign key to marketplace_items, optional)
      - `subject` (text, message subject)
      - `content` (text, message content)
      - `is_read` (boolean, read status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on messages table
    - Users can send messages to others
    - Users can view messages they sent or received
    - Users can mark their received messages as read

  3. Indexes
    - Add indexes for efficient querying by sender, recipient, and item
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  marketplace_item_id uuid REFERENCES marketplace_items(id) ON DELETE SET NULL,
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Recipients can update read status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_marketplace_item_id ON messages(marketplace_item_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
