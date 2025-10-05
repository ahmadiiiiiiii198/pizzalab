import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utility functions for gallery database operations
 * Ensures consistent handling of gallery images across all upload components
 */

export interface GalleryImageData {
  id?: string;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

/**
 * Save an uploaded image to the gallery_images table
 * This ensures images appear in both admin and frontend
 */
export const saveImageToGalleryDatabase = async (imageData: GalleryImageData): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const imageId = imageData.id || uuidv4();
    
    const galleryRecord = {
      id: imageId,
      title: imageData.title || 'Gallery Image',
      description: imageData.description || '',
      image_url: imageData.image_url,
      category: imageData.category || 'main',
      sort_order: imageData.sort_order || 999,
      is_active: imageData.is_active !== false, // Default to true
      is_featured: imageData.is_featured || false,
      created_at: new Date().toISOString()
    };

    console.log('💾 Saving image to gallery database:', galleryRecord);

    const { error } = await supabase
      .from('gallery_images')
      .insert(galleryRecord);

    if (error) {
      console.error('❌ Failed to save image to gallery database:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Image saved to gallery database successfully:', imageId);
    return { success: true, id: imageId };
  } catch (error) {
    console.error('❌ Error saving image to gallery database:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Update an existing gallery image in the database
 */
export const updateGalleryImageInDatabase = async (id: string, updates: Partial<GalleryImageData>): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Updating gallery image in database:', id, updates);

    const { error } = await supabase
      .from('gallery_images')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Failed to update gallery image:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Gallery image updated successfully:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating gallery image:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Delete a gallery image from the database
 */
export const deleteGalleryImageFromDatabase = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ Deleting gallery image from database:', id);

    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Failed to delete gallery image:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Gallery image deleted successfully:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting gallery image:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Load all active gallery images from the database
 */
export const loadGalleryImagesFromDatabase = async (): Promise<{ success: boolean; images?: any[]; error?: string }> => {
  try {
    console.log('📥 Loading gallery images from database...');

    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ Failed to load gallery images:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Loaded ${data?.length || 0} gallery images from database`);
    return { success: true, images: data || [] };
  } catch (error) {
    console.error('❌ Error loading gallery images:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Update sort order for multiple gallery images
 */
export const updateGalleryImageOrder = async (imageIds: string[]): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔢 Updating gallery image order:', imageIds);

    // Update each image with its new sort order
    const updates = imageIds.map((id, index) => 
      supabase
        .from('gallery_images')
        .update({ sort_order: index + 1 })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    
    // Check if any updates failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Some gallery image order updates failed:', errors);
      return { success: false, error: 'Failed to update some image orders' };
    }

    console.log('✅ Gallery image order updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating gallery image order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
