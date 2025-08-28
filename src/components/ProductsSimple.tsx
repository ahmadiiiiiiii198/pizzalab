import React, { useState, useEffect } from 'react';
import { Pizza, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product, ProductsByCategory } from '@/types/category';

const ProductsSimple = () => {
  const [products, setProducts] = useState<ProductsByCategory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Simple business hours props (no real-time for now)
  const businessIsOpen = true;
  const businessMessage = '';
  const validateOrderTime = async () => ({ valid: true, message: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🍕 [SIMPLE-PRODUCTS] Loading products...');

      const { data: productsData, error: queryError } = await supabase
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

      if (queryError) {
        throw queryError;
      }

      // Group products by category slug
      const groupedProducts: ProductsByCategory = {};

      productsData?.forEach((product) => {
        const categorySlug = product.categories?.slug || 'uncategorized';
        if (!groupedProducts[categorySlug]) {
          groupedProducts[categorySlug] = [];
        }

        // Simple transformation
        const transformedProduct: Product = {
          ...product,
          category: product.categories?.name || 'Uncategorized',
          category_slug: categorySlug,
          is_available: product.is_active,
          images: product.image_url ? [product.image_url] : []
        };

        groupedProducts[categorySlug].push(transformedProduct);
      });

      setProducts(groupedProducts);
      console.log(`🍕 [SIMPLE-PRODUCTS] Loaded ${Object.values(groupedProducts).flat().length} products`);
    } catch (err) {
      console.error('🍕 [SIMPLE-PRODUCTS] Error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <section id="products" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Pizza className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-lg text-gray-600">Caricamento prodotti...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section id="products" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Oops! Qualcosa è andato storto</h2>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <button
              onClick={loadProducts}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </section>
    );
  }

  const sortedCategories = Object.keys(products).sort();

  return (
    <section id="products" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Le Nostre Pizze</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Autentica pizza italiana preparata con ingredienti freschi e forno a legna tradizionale
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto rounded-full"></div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cerca pizze..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-16">
          {sortedCategories.length === 0 ? (
            <div className="text-center py-12">
              <Pizza className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun prodotto disponibile al momento.</p>
            </div>
          ) : (
            sortedCategories.map((categorySlug) => {
              const categoryProducts = products[categorySlug] || [];
              const filteredProducts = searchTerm
                ? categoryProducts.filter(product =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : categoryProducts;

              if (filteredProducts.length === 0 && searchTerm) return null;

              return (
                <div key={categorySlug} className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">
                      {categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}
                    </h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.slice(0, 8).map((product) => (
                      <div key={product.id}>
                        <ProductCard
                          product={product}
                          businessIsOpen={businessIsOpen}
                          businessMessage={businessMessage}
                          validateOrderTime={validateOrderTime}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductsSimple;
