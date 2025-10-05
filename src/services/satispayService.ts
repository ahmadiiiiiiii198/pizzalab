import { supabase } from '@/integrations/supabase/client';
import { SatisPayQRSettings, SatisPayQRFormData } from '@/types/satispay';

export class SatisPayService {
  /**
   * Get SatisPay QR settings
   */
  static async getSettings(): Promise<SatisPayQRSettings | null> {
    try {
      const { data, error } = await supabase
        .from('satispay_qr_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching SatisPay settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSettings:', error);
      return null;
    }
  }

  /**
   * Update SatisPay QR settings
   */
  static async updateSettings(settings: SatisPayQRFormData): Promise<boolean> {
    try {
      // First, try to get existing settings
      const existing = await this.getSettings();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('satispay_qr_settings')
          .update({
            qr_code_image_url: settings.qr_code_image_url,
            is_enabled: settings.is_enabled,
            title: settings.title,
            description: settings.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating SatisPay settings:', error);
          return false;
        }
      } else {
        // Create new settings
        const { error } = await supabase
          .from('satispay_qr_settings')
          .insert({
            qr_code_image_url: settings.qr_code_image_url,
            is_enabled: settings.is_enabled,
            title: settings.title,
            description: settings.description
          });

        if (error) {
          console.error('Error creating SatisPay settings:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return false;
    }
  }

  /**
   * Upload QR code image to Supabase Storage
   */
  static async uploadQRImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `satispay-qr-${Date.now()}.${fileExt}`;
      const filePath = `satispay/${fileName}`;
      const bucketName = 'admin-uploads'; // Use admin-uploads bucket instead of images

      // Check if bucket exists, create if not
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (!bucketsError && buckets) {
        const targetBucket = buckets.find(b => b.name === bucketName);
        if (!targetBucket) {
          console.log(`Creating ${bucketName} bucket for SatisPay uploads...`);
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
          if (createError) {
            console.warn('Could not create bucket:', createError);
          }
        }
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading QR image:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadQRImage:', error);
      return null;
    }
  }

  /**
   * Delete QR code image from Supabase Storage
   */
  static async deleteQRImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `satispay/${fileName}`;
      const bucketName = 'admin-uploads'; // Use admin-uploads bucket instead of images

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting QR image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteQRImage:', error);
      return false;
    }
  }
}
