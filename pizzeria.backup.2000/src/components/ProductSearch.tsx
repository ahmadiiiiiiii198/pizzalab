import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Pizza, Coffee, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/category';

interface ProductSearchProps {
  onProductSelect?: (product: Product) => void;
  placeholder?: string;
  className?: string;
  showResults?: boolean;
  compact?: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onProductSelect,
  placeholder = "Cerca prodotti...",
  className = "",
  showResults = true,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
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
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('name', { ascending: true })
          .limit(10);

        if (!error && productsData) {
          const transformedProducts: Product[] = productsData.map(product => ({
            ...product,
            category: product.categories?.name || 'Uncategorized',
            category_slug: product.categories?.slug || 'uncategorized',
            is_available: product.is_active && (product.stock_quantity === null || product.stock_quantity > 0),
            images: product.gallery ? 
              (Array.isArray(product.gallery) ? product.gallery : [product.image_url].filter(Boolean)) : 
              [product.image_url].filter(Boolean)
          }));

          setSearchResults(transformedProducts);
          setIsOpen(transformedProducts.length > 0 && showResults);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, showResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsOpen(false);
  };

  const handleProductSelect = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const getCategoryIcon = (categorySlug: string) => {
    switch (categorySlug) {
      case 'semplici':
      case 'speciali':
        return <Pizza className="h-4 w-4 text-pizza-red" />;
      case 'bevande':
      case 'birre':
        return <Coffee className="h-4 w-4 text-blue-500" />;
      default:
        return <Utensils className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          className={`
            w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg 
            text-gray-900 placeholder-gray-500 
            focus:outline-none focus:ring-2 focus:ring-pizza-orange focus:border-pizza-orange 
            transition-all duration-200
            ${compact ? 'text-sm' : 'text-base'}
          `}
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className={`${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-5 w-5 animate-spin mx-auto mb-2" />
              Ricerca in corso...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(product.category_slug)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm font-bold text-pizza-red">
                          €{(typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {product.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {product.category}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center text-gray-500">
              <Pizza className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Nessun prodotto trovato per "{searchTerm}"</p>
              <p className="text-xs mt-1">Prova con un termine diverso</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
