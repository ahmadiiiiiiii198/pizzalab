import { supabase } from '@/integrations/supabase/client';
import { Category, CategoryContent } from '@/types/category';

// Default categories with fallback data (pizza-themed)
const defaultCategories: Category[] = [
  {
    id: "default-1",
    name: "Pizza Classiche",
    slug: "pizza-classiche",
    description: "Le nostre pizze tradizionali preparate con ingredienti freschi",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Da PizzaLab, troverai le nostre pizze classiche preparate con ingredienti freschi e ricette tradizionali.",
    features: [
      "Ingredienti freschi di qualità",
      "Impasto fatto in casa",
      "Cottura in forno a legna",
      "Ricette tradizionali",
      "Consegna veloce"
    ],
    color: "from-orange-400 to-red-500",
    is_active: true,
    sort_order: 1
  },
  {
    id: "default-2",
    name: "Pizze Speciali",
    slug: "pizze-speciali",
    description: "Le nostre pizze speciali con ingredienti unici e ricercati",
    image_url: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Per chi desidera sapori unici, proponiamo una selezione curata di pizze speciali con ingredienti ricercati.",
    features: [
      "Ingredienti di alta qualità",
      "Combinazioni innovative",
      "Preparazione artigianale",
      "Sapori autentici",
      "Ricette esclusive",
      "Perfette per ogni occasione"
    ],
    color: "from-amber-400 to-peach-500",
    is_active: true,
    sort_order: 2
  },
  {
    id: "default-3",
    name: "Bevande",
    slug: "bevande",
    description: "Bevande fresche e dissetanti per accompagnare la pizza",
    image_url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1437418747212-8d9709afab22?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Completa la tua esperienza PizzaLab con la nostra selezione di bevande fresche e dissetanti.",
    features: [
      "Bibite fresche",
      "Succhi di frutta naturali",
      "Acqua minerale",
      "Bevande calde",
      "Selezione per tutti i gusti",
      "Perfette con la pizza"
    ],
    color: "from-blue-400 to-cyan-500",
    is_active: true,
    sort_order: 3
  },
  {
    id: "default-4",
    name: "Dolci",
    slug: "dolci",
    description: "Dolci per concludere in bellezza il tuo pasto",
    image_url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Concludi il tuo pasto con i nostri dolci artigianali, preparati con ingredienti di qualità.",
    features: [
      "Dolci artigianali",
      "Ingredienti di qualità",
      "Ricette tradizionali",
      "Preparazione giornaliera",
      "Varietà di sapori",
      "Perfetti per ogni occasione"
    ],
    color: "from-sage-400 to-emerald-500",
    is_active: true,
    sort_order: 4
  }
];

const defaultContent: CategoryContent = {
  categories: defaultCategories,
  heading: "Le Nostre Categorie",
  subheading: "Scopri il gusto autentico di PizzaLab: dalle pizze classiche alle specialità gourmet"
};

class CategoryService {
  private cachedContent: CategoryContent | null = null;
  private isFetching = false;

  // Fetch categories from database
  async fetchCategories(includeInactive: boolean = false): Promise<Category[]> {
    try {
      console.log('[CategoryService] Fetching categories from Supabase...');

      let query = supabase
        .from('categories')
        .select('*');

      // Only filter by is_active if we don't want inactive categories
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (error) {
        console.error('[CategoryService] Error fetching categories:', error);
        console.error('[CategoryService] Error details:', error.message, error.details);
        return defaultCategories;
      }

      if (!data || data.length === 0) {
        console.log('[CategoryService] No categories found in database, using defaults');
        console.log('[CategoryService] This might mean the categories table is empty or the query failed');
        return defaultCategories;
      }

      console.log('[CategoryService] Successfully fetched categories from database:', data);
      const mappedCategories = data.map(cat => ({
        ...cat,
        images: cat.image_url ? [cat.image_url] : [],
        features: []
      }));
      console.log('[CategoryService] Mapped categories:', mappedCategories);
      return mappedCategories;
    } catch (error) {
      console.error('[CategoryService] Error in fetchCategories:', error);
      return defaultCategories;
    }
  }

  // Fetch category content (including heading/subheading)
  async fetchContent(includeInactive: boolean = false): Promise<CategoryContent> {
    if (this.isFetching) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isFetching && this.cachedContent) {
            clearInterval(checkInterval);
            resolve(this.cachedContent);
          }
        }, 100);
      });
    }

    this.isFetching = true;

    try {
      // Fetch categories (include inactive for admin)
      const categories = await this.fetchCategories(includeInactive);

      // Fetch content settings from site_content table
      const { data: contentData, error: contentError } = await supabase
        .from('site_content')
        .select('title, subtitle')
        .eq('section', 'categories')
        .single();

      let heading = defaultContent.heading;
      let subheading = defaultContent.subheading;

      if (!contentError && contentData) {
        heading = contentData.title || heading;
        subheading = contentData.subtitle || subheading;
      }

      const content = {
        categories,
        heading,
        subheading
      };

      // Only cache if this is for public view (not admin)
      if (!includeInactive) {
        this.cachedContent = content;
      }

      return content;
    } catch (error) {
      console.error('[CategoryService] Error fetching content:', error);
      return defaultContent;
    } finally {
      this.isFetching = false;
    }
  }

  // Save category
  async saveCategory(category: Partial<Category>): Promise<boolean> {
    try {
      console.log('[CategoryService] 🔄 Saving category:', category);
      console.log('[CategoryService] 📋 Category ID:', category.id);
      console.log('[CategoryService] 📋 Category name:', category.name);

      // Validate required fields
      if (!category.name || !category.name.trim()) {
        throw new Error('Category name is required');
      }
      if (!category.slug || !category.slug.trim()) {
        throw new Error('Category slug is required');
      }

      // Prepare base data - only include defined values
      const baseData: any = {
        name: category.name.trim(),
        slug: category.slug.trim(),
        is_active: category.is_active ?? true,
        sort_order: category.sort_order ?? 0
      };

      // Only add optional fields if they have values
      if (category.description !== undefined && category.description !== null) {
        baseData.description = category.description;
      }
      if (category.image_url !== undefined && category.image_url !== null) {
        baseData.image_url = category.image_url;
      }

      // Add all dynamic feature toggle fields
      const featureToggleFields: any = {};
      Object.keys(category).forEach(key => {
        if (key.endsWith('_enabled')) {
          featureToggleFields[key] = category[key] ?? true;
        }
      });

      console.log('[CategoryService] 🏷️ Feature toggle fields:', featureToggleFields);

      // Check if this is a new category (ID starts with 'new-' or is exactly 'new' or doesn't exist)
      const isNewCategory = !category.id || category.id === 'new' || category.id.startsWith('new-');

      if (!isNewCategory) {
        // Update existing category
        const updateData = { ...baseData, ...featureToggleFields };
        console.log('[CategoryService] 💾 Updating category with data:', updateData);

        const { data, error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', category.id)
          .select();

        console.log('[CategoryService] 📤 Update response:', { data, error });

        if (error) {
          console.error('[CategoryService] ❌ Update error:', error);
          throw error;
        }

        console.log('[CategoryService] ✅ Category updated successfully:', data);
      } else {
        // Insert new category
        const insertData = {
          ...baseData,
          ...featureToggleFields,
          name: category.name!,
          slug: category.slug!,
          sort_order: category.sort_order ?? 0
        };
        console.log('[CategoryService] 💾 Inserting new category with data:', insertData);
        console.log('[CategoryService] 🔍 Insert data keys:', Object.keys(insertData));
        console.log('[CategoryService] 🔍 Insert data values:', Object.values(insertData));

        const { data, error } = await supabase
          .from('categories')
          .insert(insertData)
          .select();

        console.log('[CategoryService] 📤 Insert response:', { data, error });
        if (error) {
          console.error('[CategoryService] 📤 Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }

        if (error) {
          console.error('[CategoryService] ❌ Insert error:', error);
          throw error;
        }

        console.log('[CategoryService] ✅ Category inserted successfully:', data);
      }

      // Clear cache to force refresh
      this.cachedContent = null;

      console.log('[CategoryService] Category saved successfully');
      return true;
    } catch (error) {
      console.error('[CategoryService] Error saving category:', error);
      return false;
    }
  }

  // Delete category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.cachedContent = null;
      
      return true;
    } catch (error) {
      console.error('[CategoryService] Error deleting category:', error);
      return false;
    }
  }

  // Save content settings (heading/subheading)
  async saveContentSettings(heading: string, subheading: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({
          section: 'categories',
          title: heading,
          subtitle: subheading,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update cache
      if (this.cachedContent) {
        this.cachedContent.heading = heading;
        this.cachedContent.subheading = subheading;
      }

      return true;
    } catch (error) {
      console.error('[CategoryService] Error saving content settings:', error);
      return false;
    }
  }

  // Clear cache to force fresh data fetch
  clearCache(): void {
    console.log('[CategoryService] 🗑️ Clearing cache to force fresh data fetch');
    this.cachedContent = null;
  }

  // Force refresh content by clearing cache and fetching fresh data
  async refreshContent(includeInactive: boolean = false): Promise<CategoryContent> {
    console.log('[CategoryService] 🔄 Force refreshing content...');
    this.clearCache();
    return await this.fetchContent(includeInactive);
  }
}

export const categoryService = new CategoryService();
