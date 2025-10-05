/**
 * Optimized Products Component
 * Maintains ALL real-time functionality while fixing rendering performance issues
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Pizza, Sparkles, ChefHat, Users, ShoppingBag, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import OrderOptionsModal from './OrderOptionsModal';

import { Product, ProductsByCategory } from '@/types/category';
import { useStockManagement } from '@/hooks/useStockManagement';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';

// Memoized ProductCard to prevent unnecessary re-renders
const MemoizedProductCard = memo(ProductCard);

// Memoized category section to prevent re-renders
const CategorySection = memo(({
  categorySlug,
  categoryProducts,
  isExpanded,
  onToggleExpansion,
  getIconForCategory,
  getColorForCategory,
  getCategoryDisplayName,
  getCategoryPricingInfo,
  businessIsOpen,
  businessMessage,
  validateOrderTime
}: {
  categorySlug: string;
  categoryProducts: Product[];
  isExpanded: boolean;
  onToggleExpansion: (slug: string) => void;
  getIconForCategory: (slug: string) => JSX.Element;
  getColorForCategory: (slug: string) => string;
  getCategoryDisplayName: (slug: string) => string;
  getCategoryPricingInfo: (slug: string) => string;
  businessIsOpen: boolean;
  businessMessage: string;
  validateOrderTime: () => Promise<{ valid: boolean; message: string }>;
}) => {
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onToggleExpansion(categorySlug);
  }, [categorySlug, onToggleExpansion]);

  return (
    <div className="mb-16 animate-fade-in-up animate-stagger-1">
      {/* Category Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className={`p-4 rounded-full bg-gradient-to-r ${getColorForCategory(categorySlug)} shadow-lg`}>
            {getIconForCategory(categorySlug)}
          </div>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-playfair font-bold text-pizza-dark mb-3">
          {getCategoryDisplayName(categorySlug)}
        </h3>
        
        <p className="text-pizza-brown/80 mb-4 max-w-2xl mx-auto">
          {getCategoryPricingInfo(categorySlug)}
        </p>
        
        <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto rounded-full animate-shimmer"></div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {(isExpanded ? categoryProducts : categoryProducts.slice(0, 4)).map((product, productIndex) => (
          <div
            key={product.id}
            className={`animate-scale-in animate-stagger-${Math.min(productIndex + 1, 5)} hover-lift`}
          >
            <MemoizedProductCard
              product={product}
              businessIsOpen={businessIsOpen}
              businessMessage={businessMessage}
              validateOrderTime={validateOrderTime}
            />
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {categoryProducts.length > 4 && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={handleToggle}
            className="bg-gradient-to-r from-pizza-orange to-pizza-red text-white px-8 py-3 rounded-full hover:from-pizza-red hover:to-pizza-tomato transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-fredoka font-bold"
          >
            {isExpanded ? (
              <>
                <Users className="inline mr-2" size={20} />
                Mostra Meno
              </>
            ) : (
              <>
                <ShoppingBag className="inline mr-2" size={20} />
                Mostra Tutti ({categoryProducts.length})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

const OptimizedProducts = () => {
  const [products, setProducts] = useState<ProductsByCategory>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [heading, setHeading] = useState("Le Nostre Pizze");
  const [subheading, setSubheading] = useState("Autentica pizza italiana preparata con ingredienti freschi e forno a legna tradizionale");
  const [searchTerm, setSearchTerm] = useState("");
  const { isProductAvailable } = useStockManagement();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Get business hours for all product cards
  const { isOpen: businessIsOpen, message: businessMessage, validateOrderTime } = useBusinessHoursContext();

  // Memoized load functions to prevent recreation
  const loadProducts = useCallback(async () => {
    try {
      console.log('🍕 Loading products with optimized query...');
      
      // Optimized query with proper indexing
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          is_active,
          image_url,
          gallery,
          stock_quantity,
          categories!inner (
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!productsError && productsData) {
        // Optimized data transformation
        const groupedProducts: ProductsByCategory = {};

        productsData.forEach((product) => {
          const categorySlug = product.categories?.slug || 'uncategorized';
          if (!groupedProducts[categorySlug]) {
            groupedProducts[categorySlug] = [];
          }

          const transformedProduct: Product = {
            ...product,
            category: product.categories?.name || 'Uncategorized',
            category_slug: categorySlug,
            is_available: product.is_active && isProductAvailable(product.stock_quantity),
            images: product.gallery ? 
              (Array.isArray(product.gallery) ? product.gallery : [product.image_url].filter(Boolean)) : 
              [product.image_url].filter(Boolean)
          };

          groupedProducts[categorySlug].push(transformedProduct);
        });

        setProducts(groupedProducts);
        console.log('✅ Products loaded successfully:', Object.keys(groupedProducts).length, 'categories');
      } else if (productsError) {
        console.error('[OptimizedProducts] Error loading products:', productsError);
      }
    } catch (error) {
      console.error('[OptimizedProducts] Could not load products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isProductAvailable]);

  const loadContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'productsContent')
        .single();

      if (!error && data?.value) {
        const content = data.value;
        if (content.heading) setHeading(content.heading);
        if (content.subheading) setSubheading(content.subheading);
      }
    } catch (error) {
      console.error('[OptimizedProducts] Could not load content:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadContent();
  }, [loadProducts, loadContent]);

  // Memoized filtered products to prevent unnecessary re-calculations
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const filtered: ProductsByCategory = {};
    const searchLower = searchTerm.toLowerCase();

    Object.entries(products).forEach(([categorySlug, categoryProducts]) => {
      const matchingProducts = categoryProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );

      if (matchingProducts.length > 0) {
        filtered[categorySlug] = matchingProducts;
      }
    });

    return filtered;
  }, [searchTerm, products]);

  // Update search active state when filtered products change
  useEffect(() => {
    setIsSearchActive(searchTerm.trim().length > 0);
  }, [searchTerm]);

  // Memoized event handlers to prevent unnecessary re-renders
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

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized utility functions
  const getIconForCategory = useCallback((categorySlug: string) => {
    switch (categorySlug) {
      case 'semplici':
        return <Pizza className="text-white" size={28} />;
      case 'speciali':
        return <ChefHat className="text-white" size={28} />;
      case 'extra':
        return <Sparkles className="text-white" size={28} />;
      default:
        return <Pizza className="text-white" size={28} />;
    }
  }, []);

  const getColorForCategory = useCallback((categorySlug: string) => {
    switch (categorySlug) {
      case 'semplici':
        return 'from-flegrea-gold-accent to-flegrea-burgundy';
      case 'speciali':
        return 'from-flegrea-burgundy to-flegrea-deep-red';
      case 'extra':
        return 'from-flegrea-deep-red to-flegrea-burgundy';
      default:
        return 'from-flegrea-gold-accent to-flegrea-burgundy';
    }
  }, []);

  const getCategoryDisplayName = useCallback((categorySlug: string) => {
    switch (categorySlug) {
      case 'semplici':
        return 'SEMPLICI - Classic Pizzas & Focacce';
      case 'speciali':
        return 'SPECIALI - Signature & Gourmet';
      case 'extra':
        return 'EXTRA - Toppings';
      case 'pizze-al-metro-per-4-5-persone':
        return 'Pizze al metro per 4-5 persone';
      default:
        return categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace('-', ' ');
    }
  }, []);

  const getCategoryPricingInfo = useCallback((categorySlug: string) => {
    switch (categorySlug) {
      case 'pizze-al-metro-per-4-5-persone':
        return 'Pizze al metro ideali per gruppi di 4-5 persone';
      default:
        return 'Preparate con ingredienti freschi e forno a legna tradizionale';
    }
  }, []);

  // Memoized category list to prevent recalculation
  const categoriesWithProducts = useMemo(() => {
    const categoryOrder = ['semplici', 'speciali'];
    return Object.keys(filteredProducts)
      .filter(slug => 
        filteredProducts[slug] && 
        filteredProducts[slug].length > 0 && 
        !slug.includes('extra')
      )
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flegrea-gold-accent mb-4"></div>
        <p className="text-flegrea-soft-gray">Caricamento prodotti...</p>
      </div>
    );
  }

  return (
    <section id="products" className="py-24 bg-gradient-to-br from-flegrea-cream to-flegrea-warm-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-flegrea-gold-accent">
          <Pizza size={120} />
        </div>
        <div className="absolute top-32 right-20 text-flegrea-burgundy">
          <ChefHat size={80} />
        </div>
        <div className="absolute bottom-20 left-1/4 text-flegrea-gold-accent">
          <Sparkles size={60} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-4 text-pizza-dark">
            {heading.split(' ').map((word, i, arr) => 
              i === arr.length - 1 ? 
                <span key={i} className="text-pizza-orange">{word}</span> : 
                <span key={i}>{word} </span>
            )}
          </h2>
          <p className="text-lg text-pizza-brown/80 mb-8 max-w-3xl mx-auto">
            {subheading}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-pizza-brown/60" size={20} />
            </div>
            <input
              type="text"
              placeholder="Cerca pizze, bevande, dolci... 🔍"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-12 py-4 bg-white/90 backdrop-blur-sm border-2 border-pizza-orange/20 rounded-2xl text-pizza-dark placeholder-pizza-brown/60 focus:outline-none focus:border-pizza-orange focus:ring-4 focus:ring-pizza-orange/20 transition-all duration-300 shadow-lg hover:shadow-xl font-roboto text-lg"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-pizza-brown/60 hover:text-pizza-red transition-colors"
                aria-label="Clear search"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        {categoriesWithProducts.length > 0 ? (
          categoriesWithProducts.map((categorySlug) => (
            <CategorySection
              key={categorySlug}
              categorySlug={categorySlug}
              categoryProducts={filteredProducts[categorySlug]}
              isExpanded={expandedCategories.has(categorySlug)}
              onToggleExpansion={toggleCategoryExpansion}
              getIconForCategory={getIconForCategory}
              getColorForCategory={getColorForCategory}
              getCategoryDisplayName={getCategoryDisplayName}
              getCategoryPricingInfo={getCategoryPricingInfo}
              businessIsOpen={businessIsOpen}
              businessMessage={businessMessage}
              validateOrderTime={validateOrderTime}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="text-pizza-brown/60 mb-4">
              <Search size={64} className="mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-playfair font-bold text-pizza-dark mb-2">
              Nessun prodotto trovato
            </h3>
            <p className="text-pizza-brown/80 mb-6">
              Prova a cercare con termini diversi o{' '}
              <button 
                onClick={clearSearch}
                className="text-pizza-orange hover:text-pizza-red underline"
              >
                cancella la ricerca
              </button>
            </p>
          </div>
        )}

        {/* Order Modal */}
        {isOrderModalOpen && (
          <OrderOptionsModal 
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
          />
        )}
      </div>
    </section>
  );
};

export default memo(OptimizedProducts);
