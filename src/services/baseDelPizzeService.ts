import { supabase } from '@/integrations/supabase/client';

export interface BaseDelPizzeType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BaseDelPizzeTypeFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

class BaseDelPizzeService {
  private cachedBaseDelPizzeTypes: BaseDelPizzeType[] | null = null;

  // Get all base del pizze types
  async getBaseDelPizzeTypes(): Promise<BaseDelPizzeType[]> {
    try {
      console.log('[BaseDelPizzeService] Fetching base del pizze types...');

      const { data, error } = await supabase
        .from('base-del-pizze_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[BaseDelPizzeService] Error fetching base del pizze types:', error);
        throw error;
      }

      console.log('[BaseDelPizzeService] Fetched base del pizze types:', data?.length || 0);
      this.cachedBaseDelPizzeTypes = data || [];
      return data || [];
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in getBaseDelPizzeTypes:', error);
      return [];
    }
  }

  // Get active base del pizze types only
  async getActiveBaseDelPizzeTypes(): Promise<BaseDelPizzeType[]> {
    try {
      const allTypes = await this.getBaseDelPizzeTypes();
      return allTypes.filter(type => type.is_active);
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in getActiveBaseDelPizzeTypes:', error);
      return [];
    }
  }

  // Get base del pizze type by ID
  async getBaseDelPizzeTypeById(id: string): Promise<BaseDelPizzeType | null> {
    try {
      const { data, error } = await supabase
        .from('base-del-pizze_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[BaseDelPizzeService] Error fetching base del pizze type by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in getBaseDelPizzeTypeById:', error);
      return null;
    }
  }

  // Get base del pizze type by slug
  async getBaseDelPizzeTypeBySlug(slug: string): Promise<BaseDelPizzeType | null> {
    try {
      const { data, error } = await supabase
        .from('base-del-pizze_types')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('[BaseDelPizzeService] Error fetching base del pizze type by slug:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in getBaseDelPizzeTypeBySlug:', error);
      return null;
    }
  }

  // Create new base del pizze type
  async createBaseDelPizzeType(baseDelPizzeData: Omit<BaseDelPizzeTypeFormData, 'sort_order'> & { sort_order?: number }): Promise<BaseDelPizzeType | null> {
    try {
      console.log('[BaseDelPizzeService] Creating base del pizze type:', baseDelPizzeData);

      // Get the next sort order if not provided
      let sortOrder = baseDelPizzeData.sort_order;
      if (sortOrder === undefined) {
        const existingTypes = await this.getBaseDelPizzeTypes();
        sortOrder = Math.max(...existingTypes.map(t => t.sort_order), 0) + 1;
      }

      const { data, error } = await supabase
        .from('base-del-pizze_types')
        .insert({
          name: baseDelPizzeData.name,
          slug: baseDelPizzeData.slug,
          description: baseDelPizzeData.description || null,
          price: baseDelPizzeData.price || 0,
          is_active: baseDelPizzeData.is_active ?? true,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        console.error('[BaseDelPizzeService] Error creating base del pizze type:', error);
        throw error;
      }

      // Clear cache
      this.cachedBaseDelPizzeTypes = null;
      
      console.log('[BaseDelPizzeService] Base del pizze type created successfully:', data);
      return data;
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in createBaseDelPizzeType:', error);
      return null;
    }
  }

  // Update base del pizze type
  async updateBaseDelPizzeType(id: string, baseDelPizzeData: Partial<BaseDelPizzeTypeFormData>): Promise<BaseDelPizzeType | null> {
    try {
      console.log('[BaseDelPizzeService] Updating base del pizze type:', id, baseDelPizzeData);

      const { data, error } = await supabase
        .from('base-del-pizze_types')
        .update({
          name: baseDelPizzeData.name,
          slug: baseDelPizzeData.slug,
          description: baseDelPizzeData.description || null,
          price: baseDelPizzeData.price,
          is_active: baseDelPizzeData.is_active,
          sort_order: baseDelPizzeData.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[BaseDelPizzeService] Error updating base del pizze type:', error);
        throw error;
      }

      // Clear cache
      this.cachedBaseDelPizzeTypes = null;
      
      console.log('[BaseDelPizzeService] Base del pizze type updated successfully:', data);
      return data;
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in updateBaseDelPizzeType:', error);
      return null;
    }
  }

  // Delete base del pizze type
  async deleteBaseDelPizzeType(id: string): Promise<boolean> {
    try {
      console.log('[BaseDelPizzeService] Deleting base del pizze type:', id);

      const { error } = await supabase
        .from('base-del-pizze_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[BaseDelPizzeService] Error deleting base del pizze type:', error);
        throw error;
      }

      // Clear cache
      this.cachedBaseDelPizzeTypes = null;
      
      console.log('[BaseDelPizzeService] Base del pizze type deleted successfully');
      return true;
    } catch (error) {
      console.error('[BaseDelPizzeService] Error in deleteBaseDelPizzeType:', error);
      return false;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cachedBaseDelPizzeTypes = null;
  }
}

export const baseDelPizzeService = new BaseDelPizzeService();
