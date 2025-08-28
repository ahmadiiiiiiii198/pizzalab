/**
 * Optimized Products Service with Caching and Pagination
 * Reduces database load by implementing intelligent caching and efficient queries
 */

import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_active: boolean;
  image_url?: string;
  categories?: {
    name: string;
    slug: string;
  };
}

interface ProductsCache {
  products: Product[];
  timestamp: number;
  ttl: number;
  categoryId?: string;
  searchTerm?: string;
}

interface PaginatedProducts {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

class OptimizedProductsService {
  private cache = new Map<string, ProductsCache>();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly PAGE_SIZE = 20;

  /**
   * Get products with caching and pagination
   */
  async getProducts(options: {
    categoryId?: string;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
    forceRefresh?: boolean;
  } = {}): Promise<PaginatedProducts> {
    const {
      categoryId,
      searchTerm,
      page = 1,
      pageSize = this.PAGE_SIZE,
      forceRefresh = false
    } = options;

    const cacheKey = this.generateCacheKey(categoryId, searchTerm, page, pageSize);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCacheItem(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit for products: ${cacheKey}`);
        return {
          products: cached.products,
          totalCount: cached.products.length,
          hasMore: cached.products.length === pageSize,
          page,
          pageSize
        };
      }
    }

    console.log(`🔍 Cache miss for products: ${cacheKey}, fetching from database`);

    try {
      // Build optimized query
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          is_active,
          image_url,
          categories!inner(name, slug)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Add category filter if specified
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Add search filter if specified
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by name for consistent results
      query = query.order('name');

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      const products = data || [];

      // Cache the results
      this.setCacheItem(cacheKey, {
        products,
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL,
        categoryId,
        searchTerm
      });

      return {
        products,
        totalCount: count || 0,
        hasMore: products.length === pageSize,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  /**
   * Get all products for a category (cached)
   */
  async getProductsByCategory(categoryId: string, forceRefresh = false): Promise<Product[]> {
    const result = await this.getProducts({ 
      categoryId, 
      pageSize: 1000, // Large page size to get all products
      forceRefresh 
    });
    return result.products;
  }

  /**
   * Search products with caching
   */
  async searchProducts(searchTerm: string, page = 1, pageSize = this.PAGE_SIZE): Promise<PaginatedProducts> {
    return this.getProducts({ searchTerm, page, pageSize });
  }

  /**
   * Get a single product by ID with caching
   */
  async getProductById(id: string, forceRefresh = false): Promise<Product | null> {
    const cacheKey = `product_${id}`;

    if (!forceRefresh) {
      const cached = this.getCacheItem(cacheKey);
      if (cached && cached.products.length > 0) {
        console.log(`📦 Cache hit for product: ${id}`);
        return cached.products[0];
      }
    }

    console.log(`🔍 Fetching product by ID: ${id}`);

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          is_active,
          image_url,
          categories!inner(name, slug)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Cache the single product
      this.setCacheItem(cacheKey, {
        products: [data],
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL
      });

      return data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  }

  /**
   * Get featured products (cached)
   */
  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    const cacheKey = `featured_products_${limit}`;
    
    const cached = this.getCacheItem(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for featured products`);
      return cached.products;
    }

    console.log(`🔍 Fetching featured products`);

    try {
      // For now, get random products. In the future, add a 'featured' field
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          is_active,
          image_url,
          categories!inner(name, slug)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(limit);

      if (error) {
        throw error;
      }

      const products = data || [];

      // Cache featured products for shorter time (5 minutes)
      this.setCacheItem(cacheKey, {
        products,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000
      });

      return products;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  }

  /**
   * Clear cache for products
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
      console.log(`🗑️ Cleared product cache matching: ${pattern}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all product cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Private helper methods
   */
  private generateCacheKey(categoryId?: string, searchTerm?: string, page = 1, pageSize = this.PAGE_SIZE): string {
    const parts = ['products'];
    if (categoryId) parts.push(`cat_${categoryId}`);
    if (searchTerm) parts.push(`search_${searchTerm}`);
    parts.push(`page_${page}_size_${pageSize}`);
    return parts.join('_');
  }

  private setCacheItem(key: string, value: ProductsCache): void {
    this.cache.set(key, value);
  }

  private getCacheItem(key: string): ProductsCache | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Start periodic cache cleanup
   */
  startCacheCleanup(): void {
    // Clean up expired cache every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }
}

// Export singleton instance
export const optimizedProductsService = new OptimizedProductsService();

// Start cache cleanup
optimizedProductsService.startCacheCleanup();

// Export hook for React components
export function useOptimizedProducts(options: {
  categoryId?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);

  const { categoryId, searchTerm, page = 1, pageSize = 20 } = options;

  React.useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await optimizedProductsService.getProducts({
          categoryId,
          searchTerm,
          page,
          pageSize
        });

        if (isMounted) {
          setProducts(result.products);
          setTotalCount(result.totalCount);
          setHasMore(result.hasMore);
        }
      } catch (err) {
        console.error('Error loading products:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categoryId, searchTerm, page, pageSize]);

  const refresh = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await optimizedProductsService.getProducts({
        categoryId,
        searchTerm,
        page,
        pageSize,
        forceRefresh: true
      });
      setProducts(result.products);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, searchTerm, page, pageSize]);

  return {
    products,
    isLoading,
    error,
    totalCount,
    hasMore,
    refresh
  };
}
