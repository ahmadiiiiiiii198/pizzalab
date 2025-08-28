import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pizza, Search, X, ChevronDown, ChevronUp, Filter, Cake, Zap, Coffee, Beer, Utensils, Flame, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ProductCard from './ProductCard';
import DebugSupabase from './DebugSupabase';

import { Product, ProductsByCategory } from '@/types/category';
import { useStockManagement } from '@/hooks/useStockManagement';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';
import '../styles/products-enhanced.css';

const ProductsEnhanced = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { isProductAvailable } = useStockManagement();
  const { isOpen: businessIsOpen, message: businessMessage, validateOrderTime, refreshHours } = useBusinessHoursContext();

  // Debug business hours
  useEffect(() => {
    console.log('🕒 [ProductsEnhanced] Business hours state:', {
      businessIsOpen,
      businessMessage,
      timestamp: new Date().toLocaleString()
    });
  }, [businessIsOpen, businessMessage]);

  // Test database connection
  const testDatabaseConnection = useCallback(async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Test 1: Simple query without filters
      console.log('🔍 Test 1: Simple query...');
      const { data: allData, error: allError } = await supabase
        .from('settings')
        .select('*')
        .limit(1);

      console.log('🔍 Simple query result:', {
        hasData: !!allData,
        hasError: !!allError,
        data: allData,
        error: allError
      });

      // Test 2: Specific businessHours query
      console.log('🔍 Test 2: BusinessHours query...');
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, updated_at')
        .eq('key', 'businessHours')
        .single();

      console.log('🔍 BusinessHours query result:', {
        hasData: !!data,
        hasError: !!error,
        data: data,
        error: error
      });

      if (data) {
        console.log('🔍 Current business hours in database:', data.value);
        console.log('🔍 Last updated:', data.updated_at);
      }

      // Test 3: Alternative query method
      console.log('🔍 Test 3: Alternative query method...');
      const { data: altData, error: altError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'businessHours');

      console.log('🔍 Alternative query result:', {
        hasData: !!altData,
        hasError: !!altError,
        data: altData,
        error: altError
      });

    } catch (err) {
      console.error('🔍 Database test failed:', err);
    }
  }, []);

  const [productsContent, setProductsContent] = useState({
    heading: "Il Nostro Menu",
    subheading: "Scopri la nostra selezione di pizze, dolci, bevande e specialità preparate con ingredienti freschi",
    backgroundImage: ""
  });

  // Load products content settings
  useEffect(() => {
    const loadProductsContent = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'productsContent')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading products content:', error);
          return;
        }

        if (data?.value) {
          setProductsContent(prev => ({
            ...prev,
            ...data.value
          }));
        }
      } catch (error) {
        console.error('Error loading products content:', error);
      }
    };

    loadProductsContent();
  }, []);

  // Use React Query for products loading with caching
  const { data: products = {}, isLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<ProductsByCategory> => {
      console.log('🍕 [PRODUCTS-ENHANCED] Loading products...');
      const startTime = Date.now();

      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('🍕 [PRODUCTS-ENHANCED] Error:', error);
        throw error;
      }

      // Group products by category slug
      const groupedProducts: ProductsByCategory = {};

      productsData?.forEach((product) => {
        const categorySlug = product.categories?.slug || 'uncategorized';
        if (!groupedProducts[categorySlug]) {
          groupedProducts[categorySlug] = [];
        }

        // Transform database product to frontend format
        const transformedProduct: Product = {
          ...product,
          category: product.categories?.name || 'Uncategorized',
          category_slug: categorySlug,
          is_available: product.is_active && isProductAvailable(product.stock_quantity),
          images: product.gallery ? (Array.isArray(product.gallery) ? product.gallery : [product.image_url].filter(Boolean)) : [product.image_url].filter(Boolean)
        };

        groupedProducts[categorySlug].push(transformedProduct);
      });

      const queryTime = Date.now() - startTime;
      console.log(`🍕 [PRODUCTS-ENHANCED] Completed in ${queryTime}ms, found ${Object.values(groupedProducts).flat().length} products`);

      return groupedProducts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const filtered: ProductsByCategory = {};

    Object.entries(products).forEach(([categorySlug, categoryProducts]) => {
      const filteredCategoryProducts = categoryProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredCategoryProducts.length > 0) {
        filtered[categorySlug] = filteredCategoryProducts;
      }
    });

    return filtered;
  }, [products, searchTerm]);

  // Get all categories for filter dropdown
  const allCategories = useMemo(() => {
    return Object.keys(products).map(slug => ({
      slug,
      name: products[slug][0]?.category || slug,
      count: products[slug].length
    }));
  }, [products]);

  const toggleCategoryExpansion = useCallback((categorySlug: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const getCategoryDisplayName = useCallback((categorySlug: string) => {
    const categoryMap: { [key: string]: string } = {
      'dolci': 'Dolci',
      'fritti': 'Fritti',
      'calzoni': 'Calzoni',
      'farinate': 'Farinate',
      'focacce': 'Focacce',
      'bevande': 'Bevande',
      'birre': 'Birre',
      'pizze-classiche': 'Pizze Classiche',
      'pizze-gourmet': 'Pizze Gourmet',
      'pizze-speciale': 'Pizze Speciali',
      'pizze-vegane': 'Pizze Vegane',
      'semplici': 'Menu Pranzo - Tutte le Pizze a 7€',
      'speciali': 'Le Nostre Pizze MVP'
    };
    return categoryMap[categorySlug] || categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace('-', ' ');
  }, []);

  const getCategoryDescription = useCallback((categorySlug: string) => {
    const descriptionMap: { [key: string]: string } = {
      'dolci': 'Dolci e dessert artigianali',
      'fritti': 'Deliziosi antipasti fritti per iniziare il match',
      'calzoni': 'Calzoni ripieni con ingredienti freschi',
      'farinate': 'Specialità liguri tradizionali',
      'focacce': 'Focacce calde e fragranti',
      'bevande': 'Bibite e altre artigianali',
      'birre': 'Birre artigianali e commerciali',
      'pizze-classiche': 'Ispirate alle icone dell\'NBA',
      'pizze-gourmet': 'Pizze gourmet di alta qualità',
      'pizze-speciale': 'Pizze speciali della casa',
      'pizze-vegane': 'Pizze vegane per tutti',
      'semplici': 'Disponibile MAR, MER, GIO, VEN dalle 12:00 alle 14:30',
      'speciali': 'Pizza ispirate agli MVP dell\'NBA'
    };
    return descriptionMap[categorySlug] || 'Preparate con ingredienti freschi e forno a legna tradizionale';
  }, []);

  const getCategoryIcon = useCallback((categorySlug: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'dolci': <Cake className="w-6 h-6" />,
      'fritti': <Zap className="w-6 h-6" />,
      'calzoni': <Pizza className="w-6 h-6" />,
      'farinate': <Utensils className="w-6 h-6" />,
      'focacce': <Utensils className="w-6 h-6" />,
      'bevande': <Coffee className="w-6 h-6" />,
      'birre': <Beer className="w-6 h-6" />,
      'pizze-classiche': <Pizza className="w-6 h-6" />,
      'pizze-gourmet': <Flame className="w-6 h-6" />,
      'pizze-speciale': <Pizza className="w-6 h-6" />,
      'pizze-vegane': <Pizza className="w-6 h-6" />,
      'semplici': <Pizza className="w-6 h-6" />,
      'speciali': <Flame className="w-6 h-6" />
    };
    return iconMap[categorySlug] || <Pizza className="w-6 h-6" />;
  }, []);

  // Get sorted categories for accordion display
  const availableCategories = useMemo(() => {
    const categoryOrder = ['semplici', 'speciali', 'dolci', 'fritti', 'calzoni', 'farinate', 'focacce', 'bevande', 'birre', 'pizze-classiche', 'pizze-gourmet', 'pizze-speciale', 'pizze-vegane'];
    return Object.keys(filteredProducts)
      .filter(slug => filteredProducts[slug] && filteredProducts[slug].length > 0)
      .sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a);
        const bIndex = categoryOrder.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [filteredProducts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 flex-col">
        <div className="loading-spinner h-12 w-12 mb-4"></div>
        <p className="text-gray-600">Caricamento menu...</p>
      </div>
    );
  }

  return (
    <section id="products" className="py-16 bg-gray-900 min-h-screen">
      <DebugSupabase />
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-yellow-400">
              <span className="text-sm">⚠️ {businessMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  refreshHours();
                  testDatabaseConnection();
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-full transition-colors"
                title="Aggiorna orari e testa database"
              >
                <RefreshCw size={16} />
              </button>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                businessIsOpen
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}>
                {businessIsOpen ? 'DISPONIBILE' : 'NON DISPONIBILE'}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="Cerca nel menu..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Accordion */}
        {availableCategories.length > 0 ? (
          <div className="space-y-4">
            {availableCategories.map((categorySlug) => {
              const categoryProducts = filteredProducts[categorySlug];
              const isExpanded = expandedCategories.has(categorySlug);

              return (
                <div key={categorySlug} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategoryExpansion(categorySlug)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-orange-500">
                        {getCategoryIcon(categorySlug)}
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white">
                          {getCategoryDisplayName(categorySlug)}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {getCategoryDescription(categorySlug)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">
                        {categoryProducts.length} {categoryProducts.length === 1 ? 'articolo' : 'articoli'}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Products Grid (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 bg-gray-850">
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {categoryProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              businessIsOpen={businessIsOpen}
                              businessMessage={businessMessage}
                              validateOrderTime={validateOrderTime}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search size={64} className="mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Nessun prodotto trovato
            </h3>
            <p className="text-gray-600 mb-6">
              Prova a cercare con termini diversi o{' '}
              <button
                onClick={() => {
                  clearSearch();
                  setExpandedCategories(new Set());
                }}
                className="text-orange-400 hover:text-orange-300 underline"
              >
                cancella i filtri
              </button>
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsEnhanced;
