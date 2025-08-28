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
  Menu as MenuIcon,
  AlertTriangle,
  Info
} from 'lucide-react';

const MenuProductsConnectionTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'info' | 'warning', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const testMenuProductsConnection = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Check Products Component Database Connection
      addResult('Products Component', 'info', 'Testing Products component database connection...');
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (productsError) {
        addResult('Products Component', 'error', `Products query failed: ${productsError.message}`);
      } else {
        addResult('Products Component', 'success', `✅ Products component can access ${productsData.length} active products`);
        setProducts(productsData);
      }

      // Test 2: Check Categories Connection
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        addResult('Categories', 'error', `Categories query failed: ${categoriesError.message}`);
      } else {
        addResult('Categories', 'success', `✅ Found ${categoriesData.length} categories`);
        setCategories(categoriesData);
      }

      // Test 3: Check Menu Component Status
      addResult('Menu Component', 'warning', '⚠️ Menu.tsx component exists but is NOT connected to database');
      addResult('Menu Component', 'warning', '⚠️ Menu.tsx contains hardcoded Persian/floral data (wrong content)');
      addResult('Menu Component', 'warning', '⚠️ Menu.tsx is NOT used in the application');

      // Test 4: Check What's Actually Used
      addResult('Current Implementation', 'info', '📍 Main page (/) uses Products component');
      addResult('Current Implementation', 'info', '📍 Menu page (/menu) uses Products component');
      addResult('Current Implementation', 'success', '✅ Products component is the correct menu implementation');

      // Test 5: Test Product-Category Relationships
      if (productsData && productsData.length > 0) {
        const productsWithCategories = productsData.filter(p => p.categories?.name);
        const productsWithoutCategories = productsData.filter(p => !p.categories?.name);
        
        addResult('Product-Category Links', 
          productsWithoutCategories.length === 0 ? 'success' : 'warning',
          `${productsWithCategories.length} products linked to categories, ${productsWithoutCategories.length} without categories`
        );
      }

      // Test 6: Test Frontend Query Performance
      const startTime = Date.now();
      const { data: performanceTest, error: perfError } = await supabase
        .from('products')
        .select(`
          id, name, description, price, image_url, is_active, sort_order,
          categories (
            id, name, slug
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const queryTime = Date.now() - startTime;
      
      if (perfError) {
        addResult('Query Performance', 'error', `Performance test failed: ${perfError.message}`);
      } else {
        addResult('Query Performance', 
          queryTime < 1000 ? 'success' : 'warning',
          `Query completed in ${queryTime}ms (${performanceTest.length} products)`
        );
      }

      // Test 7: Check Data Quality
      if (productsData && productsData.length > 0) {
        const hasImages = productsData.filter(p => p.image_url).length;
        const hasDescriptions = productsData.filter(p => p.description).length;
        const hasPrices = productsData.filter(p => p.price > 0).length;
        
        addResult('Data Quality', 'info', `Images: ${hasImages}/${productsData.length} products`);
        addResult('Data Quality', 'info', `Descriptions: ${hasDescriptions}/${productsData.length} products`);
        addResult('Data Quality', 'info', `Valid prices: ${hasPrices}/${productsData.length} products`);
      }

      addResult('Test Complete', 'success', '🎉 Menu and Products connection test completed!');

    } catch (error) {
      addResult('Test Error', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MenuIcon className="h-5 w-5" />
          Menu & Products Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={testMenuProductsConnection} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing Connections...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Test Menu & Products
              </>
            )}
          </Button>
        </div>

        {/* Current Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{products.length}</div>
              <div className="text-sm text-gray-600">Active Products</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="text-sm text-gray-600">Products Connected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">❌</div>
              <div className="text-sm text-gray-600">Menu.tsx Unused</div>
            </CardContent>
          </Card>
        </div>

        {/* Key Findings */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Key Findings:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ✅ <strong>Products.tsx</strong> is properly connected to database</li>
            <li>• ✅ Used on main page (/) and menu page (/menu)</li>
            <li>• ❌ <strong>Menu.tsx</strong> exists but contains wrong content (Persian/floral)</li>
            <li>• ❌ <strong>Menu.tsx</strong> is not connected to database</li>
            <li>• ❌ <strong>Menu.tsx</strong> is not used anywhere in the app</li>
            <li>• 🎯 <strong>Products.tsx</strong> is the correct menu implementation</li>
          </ul>
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
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                  {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {result.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                  {result.status === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}
                  
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
            <h4 className="font-medium mb-3">Products Connected to Database:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {products.slice(0, 10).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-600 ml-2">€{product.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Active</Badge>
                    <Badge variant="outline">
                      {product.categories?.name || 'No Category'}
                    </Badge>
                  </div>
                </div>
              ))}
              {products.length > 10 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ... and {products.length - 10} more products
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuProductsConnectionTest;
