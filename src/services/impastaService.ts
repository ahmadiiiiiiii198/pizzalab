import { supabase } from '@/integrations/supabase/client';

export interface ImpastaType {
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

export interface ImpastaTypeFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

class ImpastaService {
  private cachedImpastaTypes: ImpastaType[] | null = null;

  // Get all impasta types
  async getImpastaTypes(): Promise<ImpastaType[]> {
    try {
      console.log('[ImpastaService] Fetching impasta types...');

      const { data, error } = await supabase
        .from('impasto_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[ImpastaService] Error fetching impasta types:', error);
        throw error;
      }

      console.log('[ImpastaService] Fetched impasta types:', data?.length || 0);
      this.cachedImpastaTypes = data || [];
      return data || [];
    } catch (error) {
      console.error('[ImpastaService] Error in getImpastaTypes:', error);
      return [];
    }
  }

  // Get active impasta types only
  async getActiveImpastaTypes(): Promise<ImpastaType[]> {
    try {
      const allTypes = await this.getImpastaTypes();
      return allTypes.filter(type => type.is_active);
    } catch (error) {
      console.error('[ImpastaService] Error in getActiveImpastaTypes:', error);
      return [];
    }
  }

  // Get impasta type by ID
  async getImpastaTypeById(id: string): Promise<ImpastaType | null> {
    try {
      const { data, error } = await supabase
        .from('impasto_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[ImpastaService] Error fetching impasta type by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[ImpastaService] Error in getImpastaTypeById:', error);
      return null;
    }
  }

  // Get impasta type by slug
  async getImpastaTypeBySlug(slug: string): Promise<ImpastaType | null> {
    try {
      const { data, error } = await supabase
        .from('impasto_types')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('[ImpastaService] Error fetching impasta type by slug:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[ImpastaService] Error in getImpastaTypeBySlug:', error);
      return null;
    }
  }

  // Create new impasta type
  async createImpastaType(impastaData: Omit<ImpastaTypeFormData, 'sort_order'> & { sort_order?: number }): Promise<ImpastaType | null> {
    try {
      console.log('[ImpastaService] Creating impasta type:', impastaData);

      // Get the next sort order if not provided
      let sortOrder = impastaData.sort_order;
      if (sortOrder === undefined) {
        const existingTypes = await this.getImpastaTypes();
        sortOrder = Math.max(...existingTypes.map(t => t.sort_order), 0) + 1;
      }

      const { data, error } = await supabase
        .from('impasto_types')
        .insert({
          name: impastaData.name,
          slug: impastaData.slug,
          description: impastaData.description || null,
          price: impastaData.price || 0,
          is_active: impastaData.is_active ?? true,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        console.error('[ImpastaService] Error creating impasta type:', error);
        throw error;
      }

      // Clear cache
      this.cachedImpastaTypes = null;
      
      console.log('[ImpastaService] Impasta type created successfully:', data);
      return data;
    } catch (error) {
      console.error('[ImpastaService] Error in createImpastaType:', error);
      return null;
    }
  }

  // Update impasta type
  async updateImpastaType(id: string, impastaData: Partial<ImpastaTypeFormData>): Promise<ImpastaType | null> {
    try {
      console.log('[ImpastaService] Updating impasta type:', id, impastaData);

      const { data, error } = await supabase
        .from('impasto_types')
        .update({
          name: impastaData.name,
          slug: impastaData.slug,
          description: impastaData.description || null,
          price: impastaData.price,
          is_active: impastaData.is_active,
          sort_order: impastaData.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[ImpastaService] Error updating impasta type:', error);
        throw error;
      }

      // Clear cache
      this.cachedImpastaTypes = null;
      
      console.log('[ImpastaService] Impasta type updated successfully:', data);
      return data;
    } catch (error) {
      console.error('[ImpastaService] Error in updateImpastaType:', error);
      return null;
    }
  }

  // Delete impasta type
  async deleteImpastaType(id: string): Promise<boolean> {
    try {
      console.log('[ImpastaService] Deleting impasta type:', id);

      const { error } = await supabase
        .from('impasto_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ImpastaService] Error deleting impasta type:', error);
        throw error;
      }

      // Clear cache
      this.cachedImpastaTypes = null;
      
      console.log('[ImpastaService] Impasta type deleted successfully');
      return true;
    } catch (error) {
      console.error('[ImpastaService] Error in deleteImpastaType:', error);
      return false;
    }
  }

  // Update sort orders for multiple impasta types
  async updateSortOrders(updates: { id: string; sort_order: number }[]): Promise<boolean> {
    try {
      console.log('[ImpastaService] Updating sort orders:', updates);

      for (const update of updates) {
        const { error } = await supabase
          .from('impasto_types')
          .update({ 
            sort_order: update.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (error) {
          console.error('[ImpastaService] Error updating sort order:', error);
          throw error;
        }
      }

      // Clear cache
      this.cachedImpastaTypes = null;
      
      console.log('[ImpastaService] Sort orders updated successfully');
      return true;
    } catch (error) {
      console.error('[ImpastaService] Error in updateSortOrders:', error);
      return false;
    }
  }

  // Generate slug from name
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Clear cache
  clearCache(): void {
    this.cachedImpastaTypes = null;
  }
}

// Export singleton instance
export const impastaService = new ImpastaService();
