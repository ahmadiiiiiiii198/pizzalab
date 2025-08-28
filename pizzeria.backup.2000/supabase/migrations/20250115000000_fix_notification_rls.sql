-- Fix RLS policies for order_notifications table to allow public insertion
-- This is needed for the notification system to work properly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to order_notifications" ON order_notifications;
DROP POLICY IF EXISTS "Allow public insert access to order_notifications" ON order_notifications;
DROP POLICY IF EXISTS "Allow public update access to order_notifications" ON order_notifications;
DROP POLICY IF EXISTS "Allow public delete access to order_notifications" ON order_notifications;

-- Enable RLS on order_notifications table
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to order_notifications
CREATE POLICY "Allow public read access to order_notifications"
ON order_notifications FOR SELECT
TO public
USING (true);

-- Allow public insert access to order_notifications
CREATE POLICY "Allow public insert access to order_notifications"
ON order_notifications FOR INSERT
TO public
WITH CHECK (true);

-- Allow public update access to order_notifications (for marking as read)
CREATE POLICY "Allow public update access to order_notifications"
ON order_notifications FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public delete access to order_notifications (for cleanup)
CREATE POLICY "Allow public delete access to order_notifications"
ON order_notifications FOR DELETE
TO public
USING (true);

-- Grant necessary permissions to public role
GRANT SELECT, INSERT, UPDATE, DELETE ON order_notifications TO public;
GRANT USAGE ON SEQUENCE order_notifications_id_seq TO public;

-- Enable real-time for order_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE order_notifications;

-- Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_order_notifications_is_read ON order_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_order_notifications_created_at ON order_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);

-- Add comment explaining the policy
COMMENT ON TABLE order_notifications IS 'Order notifications table with public RLS policies for notification system';
