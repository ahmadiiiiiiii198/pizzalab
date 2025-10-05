-- Migration: Add SatisPay QR Code Settings Table
-- This allows admins to manage the SatisPay QR code image shown during payment

-- Create the SatisPay QR settings table
CREATE TABLE IF NOT EXISTS satispay_qr_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_image_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  title TEXT DEFAULT 'Paga con SatisPay',
  description TEXT DEFAULT 'Scansiona il QR code per pagare con SatisPay',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO satispay_qr_settings (title, description, is_enabled)
VALUES (
  'Paga con SatisPay',
  'Scansiona il QR code per pagare con SatisPay',
  true
)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE satispay_qr_settings IS 'Settings for SatisPay QR code payment system';
COMMENT ON COLUMN satispay_qr_settings.qr_code_image_url IS 'URL of the SatisPay QR code image';
COMMENT ON COLUMN satispay_qr_settings.is_enabled IS 'Enable/disable SatisPay payment option';
COMMENT ON COLUMN satispay_qr_settings.title IS 'Title shown in payment modal';
COMMENT ON COLUMN satispay_qr_settings.description IS 'Description shown in payment modal';
