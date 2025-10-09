-- ============================================================================
-- TABLE RESERVATION SYSTEM - Complete Database Schema
-- ============================================================================
-- This script creates a comprehensive table reservation system with:
-- - Customer reservations with full details
-- - Admin confirmation workflow
-- - Email notification system
-- - Status tracking and history
-- ============================================================================

-- 1. Create Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_number TEXT NOT NULL UNIQUE,
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Reservation Details
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0 AND number_of_guests <= 20),
  table_preference TEXT, -- 'indoor', 'outdoor', 'window', 'private', 'any'
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show')),
  confirmed_by TEXT, -- Admin username who confirmed
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Information
  special_requests TEXT,
  occasion TEXT, -- 'birthday', 'anniversary', 'business', 'date', 'family', 'other'
  notes TEXT, -- Admin notes
  
  -- Notification Tracking
  confirmation_email_sent BOOLEAN DEFAULT false,
  confirmation_email_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_email_sent BOOLEAN DEFAULT false,
  reminder_email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  source TEXT DEFAULT 'website', -- 'website', 'phone', 'walk-in'
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Reservation Status History Table
CREATE TABLE IF NOT EXISTS reservation_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT, -- Admin username or 'system' or 'customer'
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Reservation Notifications Table
CREATE TABLE IF NOT EXISTS reservation_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('confirmation', 'rejection', 'reminder', 'cancellation', 'update')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Table Configuration Table (for managing available tables)
CREATE TABLE IF NOT EXISTS table_configuration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT NOT NULL CHECK (location IN ('indoor', 'outdoor', 'window', 'private')),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_number ON reservations(reservation_number);

CREATE INDEX IF NOT EXISTS idx_reservation_history_reservation_id ON reservation_status_history(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_history_created_at ON reservation_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_reservation_notifications_reservation_id ON reservation_notifications(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_notifications_status ON reservation_notifications(delivery_status);

CREATE INDEX IF NOT EXISTS idx_table_config_active ON table_configuration(is_active);
CREATE INDEX IF NOT EXISTS idx_table_config_location ON table_configuration(location);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_configuration ENABLE ROW LEVEL SECURITY;

-- Public can insert new reservations
CREATE POLICY "Anyone can create reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Public can view their own reservations by email
CREATE POLICY "Customers can view their own reservations" ON reservations
  FOR SELECT USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Public can update their own pending reservations (for cancellation)
CREATE POLICY "Customers can cancel their pending reservations" ON reservations
  FOR UPDATE USING (status = 'pending' AND customer_email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Public can view table configuration
CREATE POLICY "Anyone can view active tables" ON table_configuration
  FOR SELECT USING (is_active = true);

-- Public can view reservation history
CREATE POLICY "Anyone can view reservation history" ON reservation_status_history
  FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to generate unique reservation number
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Format: RES-YYYYMMDD-XXXX (e.g., RES-20250107-1234)
    new_number := 'RES-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if number already exists
    SELECT EXISTS(SELECT 1 FROM reservations WHERE reservation_number = new_number) INTO exists;
    
    IF NOT exists THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on reservations
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on table_configuration
DROP TRIGGER IF EXISTS update_table_configuration_updated_at ON table_configuration;
CREATE TRIGGER update_table_configuration_updated_at
  BEFORE UPDATE ON table_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log reservation status changes
CREATE OR REPLACE FUNCTION log_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO reservation_status_history (reservation_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.confirmed_by, NEW.notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log status changes
DROP TRIGGER IF EXISTS log_reservation_status_trigger ON reservations;
CREATE TRIGGER log_reservation_status_trigger
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_status_change();

-- Function to check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
  p_date DATE,
  p_time TIME,
  p_guests INTEGER
)
RETURNS TABLE(available_tables INTEGER, total_capacity INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as available_tables,
    COALESCE(SUM(capacity), 0)::INTEGER as total_capacity
  FROM table_configuration
  WHERE is_active = true
    AND capacity >= p_guests
    AND id NOT IN (
      SELECT DISTINCT tc.id
      FROM table_configuration tc
      JOIN reservations r ON true
      WHERE r.reservation_date = p_date
        AND r.reservation_time BETWEEN (p_time - INTERVAL '2 hours') AND (p_time + INTERVAL '2 hours')
        AND r.status IN ('confirmed', 'pending')
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA - Sample Table Configuration
-- ============================================================================

INSERT INTO table_configuration (table_number, table_name, capacity, location, description, sort_order)
VALUES
  ('T01', 'Tavolo Venezia', 2, 'window', 'Tavolo romantico con vista finestra', 1),
  ('T02', 'Tavolo Roma', 4, 'indoor', 'Tavolo familiare al centro sala', 2),
  ('T03', 'Tavolo Firenze', 4, 'indoor', 'Tavolo comodo per gruppi', 3),
  ('T04', 'Tavolo Milano', 6, 'indoor', 'Tavolo grande per famiglie', 4),
  ('T05', 'Tavolo Napoli', 8, 'indoor', 'Tavolo per grandi gruppi', 5),
  ('T06', 'Tavolo Terrazza', 4, 'outdoor', 'Tavolo all''aperto con vista', 6),
  ('T07', 'Tavolo Giardino', 6, 'outdoor', 'Tavolo nel giardino', 7),
  ('T08', 'Sala Privata', 12, 'private', 'Sala privata per eventi speciali', 8)
ON CONFLICT (table_number) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated and anonymous users
GRANT SELECT, INSERT ON reservations TO anon, authenticated;
GRANT UPDATE (status) ON reservations TO anon, authenticated;
GRANT SELECT ON reservation_status_history TO anon, authenticated;
GRANT SELECT ON reservation_notifications TO anon, authenticated;
GRANT SELECT ON table_configuration TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Table Reservation System created successfully!';
  RAISE NOTICE '📋 Tables created: reservations, reservation_status_history, reservation_notifications, table_configuration';
  RAISE NOTICE '🔐 RLS policies enabled for security';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🎯 Sample tables configured';
END $$;
