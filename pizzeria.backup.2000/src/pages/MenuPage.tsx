
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from '@/integrations/supabase/client';
import { Pizza, ChevronDown, ChevronUp } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  sort_order: number;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  items: MenuItem[];
}

// Create a wrapper component that uses the hooks inside the LanguageProvider
const MenuPageContent = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMenuData();
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const loadMenuData = async () => {
    try {
      console.log('🍕 Loading menu data from database...');

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        return;
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (productsError) {
        console.error('Error loading products:', productsError);
        return;
      }

      // Group products by category
      const categoriesWithItems: MenuCategory[] = categoriesData?.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        sort_order: category.sort_order,
        items: productsData?.filter(product => product.category_id === category.id) || []
      })) || [];

      // Filter out categories with no items
      const categoriesWithProducts = categoriesWithItems.filter(category => category.items.length > 0);

      setCategories(categoriesWithProducts);
      console.log('🍕 Menu data loaded:', categoriesWithProducts);
    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-600">
        <Header />
        <main className="pt-20">
          <section className="py-16 bg-red-600">
            <div className="container mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-2 text-white">
                <Pizza className="animate-spin h-8 w-8" />
                <span className="text-xl">Caricamento menu...</span>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-600">
      <Header />
      <main className="pt-20">
        {/* Menu Section with Red Background */}
        <section className="py-16 bg-red-600">
          <div className="container mx-auto px-4">
            {categories.length === 0 ? (
              <div className="text-center text-white">
                <Pizza className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Nessun prodotto disponibile al momento.</p>
              </div>
            ) : (
              categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                return (
                  <div key={category.id} className="mb-8">
                    {/* Clickable Category Title */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full text-left group hover:bg-red-700 transition-colors duration-200 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-yellow-400 font-bold text-3xl uppercase tracking-wide group-hover:text-yellow-300 transition-colors">
                          {category.name}
                        </h2>
                        <div className="text-yellow-400 group-hover:text-yellow-300 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-8 w-8" />
                          ) : (
                            <ChevronDown className="h-8 w-8" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expandable Products Section */}
                    {isExpanded && (
                      <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                        {/* Products Grid - 3 columns layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                          {category.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="text-white animate-in fade-in-50 duration-300"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              {/* Product Title in Yellow/Gold */}
                              <h3 className="text-yellow-400 font-bold text-xl mb-4 uppercase tracking-wide">
                                {item.name}
                              </h3>
                              {/* Product Description in White */}
                              <p className="text-white text-sm leading-relaxed uppercase mb-2">
                                {item.description || 'Descrizione non disponibile'}
                              </p>
                              {/* Price */}
                              <p className="text-yellow-300 font-semibold text-lg">
                                €{item.price.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

// Main component - LanguageProvider is now in App.tsx
const MenuPage = () => {
  return <MenuPageContent />;
};

export default MenuPage;
