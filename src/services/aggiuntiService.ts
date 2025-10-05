import { supabase } from '@/integrations/supabase/client';

export interface AggiuntiType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface AggiuntiTypeFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  category: string;
}

// Available categories for aggiunti
export const AGGIUNTI_CATEGORIES = [
  { value: 'formaggi', label: 'Formaggi' },
  { value: 'salumi', label: 'Salumi' },
  { value: 'verdure', label: 'Verdure' },
  { value: 'pesce', label: 'Pesce' },
  { value: 'contorni', label: 'Contorni' },
  { value: 'general', label: 'Generale' }
];

class AggiuntiService {
  private cachedAggiuntiTypes: AggiuntiType[] | null = null;

  // Get all aggiunti types
  async getAggiuntiTypes(): Promise<AggiuntiType[]> {
    try {
      console.log('[AggiuntiService] Fetching aggiunti types...');

      const { data, error } = await supabase
        .from('aggiunti_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[AggiuntiService] Error fetching aggiunti types:', error);
        throw error;
      }

      console.log('[AggiuntiService] Fetched aggiunti types:', data?.length || 0);
      this.cachedAggiuntiTypes = data || [];
      return data || [];
    } catch (error) {
      console.error('[AggiuntiService] Error in getAggiuntiTypes:', error);
      return [];
    }
  }

  // Get active aggiunti types only
  async getActiveAggiuntiTypes(): Promise<AggiuntiType[]> {
    try {
      const allTypes = await this.getAggiuntiTypes();
      return allTypes.filter(type => type.is_active);
    } catch (error) {
      console.error('[AggiuntiService] Error in getActiveAggiuntiTypes:', error);
      return [];
    }
  }

  // Get aggiunti types by category
  async getAggiuntiTypesByCategory(category: string): Promise<AggiuntiType[]> {
    try {
      const allTypes = await this.getActiveAggiuntiTypes();
      return allTypes.filter(type => type.category === category);
    } catch (error) {
      console.error('[AggiuntiService] Error in getAggiuntiTypesByCategory:', error);
      return [];
    }
  }

  // Get aggiunti type by ID
  async getAggiuntiTypeById(id: string): Promise<AggiuntiType | null> {
    try {
      const { data, error } = await supabase
        .from('aggiunti_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[AggiuntiService] Error fetching aggiunti type by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[AggiuntiService] Error in getAggiuntiTypeById:', error);
      return null;
    }
  }

  // Get aggiunti type by slug
  async getAggiuntiTypeBySlug(slug: string): Promise<AggiuntiType | null> {
    try {
      const { data, error } = await supabase
        .from('aggiunti_types')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('[AggiuntiService] Error fetching aggiunti type by slug:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[AggiuntiService] Error in getAggiuntiTypeBySlug:', error);
      return null;
    }
  }

  // Create new aggiunti type
  async createAggiuntiType(aggiuntiData: Omit<AggiuntiTypeFormData, 'sort_order'> & { sort_order?: number }): Promise<AggiuntiType | null> {
    try {
      console.log('[AggiuntiService] Creating aggiunti type:', aggiuntiData);

      // Get the next sort order if not provided
      let sortOrder = aggiuntiData.sort_order;
      if (sortOrder === undefined) {
        const existingTypes = await this.getAggiuntiTypes();
        sortOrder = Math.max(...existingTypes.map(t => t.sort_order), 0) + 1;
      }

      const { data, error } = await supabase
        .from('aggiunti_types')
        .insert({
          name: aggiuntiData.name,
          slug: aggiuntiData.slug,
          description: aggiuntiData.description || null,
          price: aggiuntiData.price || 0,
          is_active: aggiuntiData.is_active ?? true,
          category: aggiuntiData.category || 'general',
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        console.error('[AggiuntiService] Error creating aggiunti type:', error);
        throw error;
      }

      // Clear cache
      this.cachedAggiuntiTypes = null;
      
      console.log('[AggiuntiService] Aggiunti type created successfully:', data);
      return data;
    } catch (error) {
      console.error('[AggiuntiService] Error in createAggiuntiType:', error);
      return null;
    }
  }

  // Update aggiunti type
  async updateAggiuntiType(id: string, aggiuntiData: Partial<AggiuntiTypeFormData>): Promise<AggiuntiType | null> {
    try {
      console.log('[AggiuntiService] Updating aggiunti type:', id, aggiuntiData);

      const { data, error } = await supabase
        .from('aggiunti_types')
        .update({
          name: aggiuntiData.name,
          slug: aggiuntiData.slug,
          description: aggiuntiData.description || null,
          price: aggiuntiData.price,
          is_active: aggiuntiData.is_active,
          category: aggiuntiData.category,
          sort_order: aggiuntiData.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[AggiuntiService] Error updating aggiunti type:', error);
        throw error;
      }

      // Clear cache
      this.cachedAggiuntiTypes = null;
      
      console.log('[AggiuntiService] Aggiunti type updated successfully:', data);
      return data;
    } catch (error) {
      console.error('[AggiuntiService] Error in updateAggiuntiType:', error);
      return null;
    }
  }

  // Delete aggiunti type
  async deleteAggiuntiType(id: string): Promise<boolean> {
    try {
      console.log('[AggiuntiService] Deleting aggiunti type:', id);

      const { error } = await supabase
        .from('aggiunti_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[AggiuntiService] Error deleting aggiunti type:', error);
        throw error;
      }

      // Clear cache
      this.cachedAggiuntiTypes = null;
      
      console.log('[AggiuntiService] Aggiunti type deleted successfully');
      return true;
    } catch (error) {
      console.error('[AggiuntiService] Error in deleteAggiuntiType:', error);
      return false;
    }
  }

  // Update sort orders for multiple aggiunti types
  async updateSortOrders(updates: { id: string; sort_order: number }[]): Promise<boolean> {
    try {
      console.log('[AggiuntiService] Updating sort orders:', updates);

      for (const update of updates) {
        const { error } = await supabase
          .from('aggiunti_types')
          .update({ 
            sort_order: update.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (error) {
          console.error('[AggiuntiService] Error updating sort order:', error);
          throw error;
        }
      }

      // Clear cache
      this.cachedAggiuntiTypes = null;
      
      console.log('[AggiuntiService] Sort orders updated successfully');
      return true;
    } catch (error) {
      console.error('[AggiuntiService] Error in updateSortOrders:', error);
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
    this.cachedAggiuntiTypes = null;
  }

  // Get category label by value
  getCategoryLabel(categoryValue: string): string {
    const category = AGGIUNTI_CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  }
}

// Export singleton instance
export const aggiuntiService = new AggiuntiService();
