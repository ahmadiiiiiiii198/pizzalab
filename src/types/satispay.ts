export interface SatisPayQRSettings {
  id: string;
  qr_code_image_url?: string;
  is_enabled: boolean;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface SatisPayQRFormData {
  qr_code_image_url: string;
  is_enabled: boolean;
  title: string;
  description: string;
}
