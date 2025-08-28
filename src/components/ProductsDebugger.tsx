import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  Pizza,
  Database,
  Plus
} from 'lucide-react';

const ProductsDebugger = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const checkDatabase = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Check if products table exists and get structure
      addResult('Database Structure', 'info', 'Checking products table structure...');
      
      const { data: tableInfo, error: tableError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

      if (tableError) {
        addResult('Database Structure', 'error', `Products table error: ${tableError.message}`);
      } else {
        addResult('Database Structure', 'success', '✅ Products table exists and accessible');
      }

      // Test 2: Check categories table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        addResult('Categories', 'error', `Categories table error: ${categoriesError.message}`);
      } else {
        addResult('Categories', 'success', `✅ Found ${categoriesData.length} categories`);
        setCategories(categoriesData);
      }

      // Test 3: Get all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) {
        addResult('Products Query', 'error', `Products query error: ${productsError.message}`);
      } else {
        addResult('Products Query', 'success', `✅ Found ${productsData.length} total products`);
        setProducts(productsData);

        // Check active products
        const activeProducts = productsData.filter(p => p.is_active);
        addResult('Active Products', activeProducts.length > 0 ? 'success' : 'error', 
          `${activeProducts.length} active products (visible on frontend)`);
      }

      // Test 4: Test the exact query used by frontend
      const { data: frontendQuery, error: frontendError } = await supabase
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

      if (frontendError) {
        addResult('Frontend Query', 'error', `Frontend query error: ${frontendError.message}`);
      } else {
        addResult('Frontend Query', frontendQuery.length > 0 ? 'success' : 'error', 
          `Frontend query returns ${frontendQuery.length} products`);
      }

    } catch (error) {
      addResult('Database Check', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createSampleProducts = async () => {
    try {
      addResult('Sample Data', 'info', 'Creating sample products...');

      // First, ensure we have a category
      let categoryId = null;
      if (categories.length === 0) {
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: 'Pizze Classiche',
            slug: 'pizze-classiche',
            description: 'Le nostre pizze tradizionali'
          })
          .select()
          .single();

        if (categoryError) {
          addResult('Sample Data', 'error', `Failed to create category: ${categoryError.message}`);
          return;
        }
        categoryId = newCategory.id;
        addResult('Sample Data', 'success', '✅ Created sample category');
      } else {
        categoryId = categories[0].id;
      }

      // Create sample products
      const sampleProducts = [
        {
          name: 'Pizza Margherita',
          description: 'La regina delle pizze: pomodoro San Marzano, mozzarella di bufala, basilico fresco',
          price: 8.50,
          category_id: categoryId,
          is_active: true,
          sort_order: 1,
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
          stock_quantity: 100
        },
        {
          name: 'Pizza Marinara',
          description: 'La più antica: pomodoro San Marzano, aglio, origano, olio extravergine',
          price: 7.00,
          category_id: categoryId,
          is_active: true,
          sort_order: 2,
          image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
          stock_quantity: 100
        },
        {
          name: 'Pizza Napoletana',
          description: 'Pomodoro, mozzarella, acciughe del Cantabrico, capperi di Pantelleria',
          price: 9.50,
          category_id: categoryId,
          is_active: true,
          sort_order: 3,
          image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=600&fit=crop',
          stock_quantity: 100
        },
        {
          name: 'Pizza Diavola',
          description: 'Pomodoro, mozzarella, salame piccante, peperoncino fresco',
          price: 10.00,
          category_id: categoryId,
          is_active: true,
          sort_order: 4,
          image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&h=600&fit=crop',
          stock_quantity: 100
        },
        {
          name: 'Pizza Capricciosa',
          description: 'Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive',
          price: 12.00,
          category_id: categoryId,
          is_active: true,
          sort_order: 5,
          image_url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&h=600&fit=crop',
          stock_quantity: 100
        }
      ];

      const { data: createdProducts, error: productsError } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();

      if (productsError) {
        addResult('Sample Data', 'error', `Failed to create products: ${productsError.message}`);
      } else {
        addResult('Sample Data', 'success', `✅ Created ${createdProducts.length} sample products`);
        toast({
          title: "Sample Products Created!",
          description: "Check the frontend to see the products now.",
        });
        
        // Refresh the data
        checkDatabase();
      }

    } catch (error) {
      addResult('Sample Data', 'error', `Unexpected error: ${error.message}`);
    }
  };

  const clearAllProducts = async () => {
    if (!confirm('Are you sure you want to delete ALL products? This cannot be undone!')) {
      return;
    }

    try {
      addResult('Clear Products', 'info', 'Deleting all products...');

      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        addResult('Clear Products', 'error', `Failed to delete products: ${error.message}`);
      } else {
        addResult('Clear Products', 'success', '✅ All products deleted');
        setProducts([]);
        toast({
          title: "Products Cleared",
          description: "All products have been deleted from the database.",
        });
      }
    } catch (error) {
      addResult('Clear Products', 'error', `Unexpected error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="h-5 w-5" />
          Products Database Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={checkDatabase} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Check Database
              </>
            )}
          </Button>

          <Button
            onClick={createSampleProducts}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Sample Products
          </Button>

          <Button
            onClick={clearAllProducts}
            disabled={isRunning}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Clear All Products
          </Button>
        </div>

        {/* Current Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{products.filter(p => p.is_active).length}</div>
              <div className="text-sm text-gray-600">Active Products</div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                  {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {result.status === 'info' && <Loader2 className="h-4 w-4 text-blue-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.test}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products List */}
        {products.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Current Products in Database:</h4>
            <div className="space-y-2">
              {products.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-600 ml-2">€{product.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {product.categories?.name || 'No Category'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsDebugger;
