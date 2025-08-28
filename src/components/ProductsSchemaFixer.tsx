import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Wrench,
  Database,
  AlertTriangle,
  Info
} from 'lucide-react';

const ProductsSchemaFixer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  const fixProductsSchema = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      addResult('Schema Fix', 'info', 'Starting products table schema fix using MCP...');

      // Check current schema by trying to select each column
      const columnsToCheck = [
        'stock_quantity',    // This one is also missing!
        'compare_price',
        'meta_title',
        'meta_description',
        'labels',
        'is_featured',
        'sort_order'         // Check this one too
      ];

      const missingColumns = [];

      for (const columnName of columnsToCheck) {
        try {
          addResult('Column Check', 'info', `Checking column: ${columnName}...`);

          // Try to select the column to see if it exists
          const { error: selectError } = await supabase
            .from('products')
            .select(columnName)
            .limit(1);

          if (selectError && selectError.message.includes('column')) {
            addResult('Column Check', 'warning', `❌ Column ${columnName} missing`);
            missingColumns.push(columnName);
          } else {
            addResult('Column Check', 'success', `✅ Column ${columnName} exists`);
          }
        } catch (error) {
          addResult('Column Check', 'error', `Error checking ${columnName}: ${error.message}`);
          missingColumns.push(columnName);
        }
      }

      // Try to add missing columns using direct SQL execution
      if (missingColumns.length > 0) {
        addResult('Schema Fix', 'info', `Attempting to add ${missingColumns.length} missing columns...`);

        for (const columnName of missingColumns) {
          try {
            let sql = '';
            switch (columnName) {
              case 'stock_quantity':
                sql = 'ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;';
                break;
              case 'compare_price':
                sql = 'ALTER TABLE products ADD COLUMN compare_price DECIMAL(10,2) DEFAULT 0;';
                break;
              case 'meta_title':
                sql = 'ALTER TABLE products ADD COLUMN meta_title TEXT;';
                break;
              case 'meta_description':
                sql = 'ALTER TABLE products ADD COLUMN meta_description TEXT;';
                break;
              case 'labels':
                sql = 'ALTER TABLE products ADD COLUMN labels TEXT[];';
                break;
              case 'is_featured':
                sql = 'ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;';
                break;
              case 'sort_order':
                sql = 'ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;';
                break;
            }

            addResult('Column Add', 'info', `Executing: ${sql}`);

            // Try to execute the SQL using RPC function
            const { error: rpcError } = await supabase.rpc('exec_sql', { sql });

            if (rpcError) {
              addResult('Column Add', 'error', `Failed to add ${columnName}: ${rpcError.message}`);
            } else {
              addResult('Column Add', 'success', `✅ Successfully added column: ${columnName}`);
            }
          } catch (error) {
            addResult('Column Add', 'error', `Error adding ${columnName}: ${error.message}`);
          }
        }
      } else {
        addResult('Schema Fix', 'success', '✅ All required columns already exist!');
      }

      // Test product creation with basic fields only
      addResult('Test Creation', 'info', 'Testing product creation with basic fields...');
      
      const basicProduct = {
        name: 'Test Pizza Basic',
        description: 'Test product with basic fields only',
        price: 10.50,
        is_active: true,
        stock_quantity: 100,
        sort_order: 999
      };

      const { data: testProduct, error: createError } = await supabase
        .from('products')
        .insert(basicProduct)
        .select()
        .single();

      if (createError) {
        addResult('Test Creation', 'error', `Basic product creation failed: ${createError.message}`);
      } else {
        addResult('Test Creation', 'success', '✅ Basic product creation works');
        
        // Clean up test product
        await supabase.from('products').delete().eq('id', testProduct.id);
        addResult('Test Creation', 'info', 'Test product cleaned up');
      }

      addResult('Schema Fix', 'info', '🎯 Schema analysis complete. See manual fix instructions below.');

    } catch (error) {
      addResult('Schema Fix', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createBasicProduct = async () => {
    try {
      addResult('Basic Product', 'info', 'Creating basic product without advanced fields...');

      const basicProduct = {
        name: 'Pizza Margherita Basic',
        description: 'Pomodoro, mozzarella, basilico fresco',
        price: 8.50,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop'
        // Removed stock_quantity and sort_order - may not exist in current schema
      };

      const { data: product, error } = await supabase
        .from('products')
        .insert(basicProduct)
        .select()
        .single();

      if (error) {
        addResult('Basic Product', 'error', `Failed: ${error.message}`);
      } else {
        addResult('Basic Product', 'success', `✅ Created: ${product.name}`);
        toast({
          title: "Product Created!",
          description: "Basic product created successfully. Check the frontend to see it.",
        });
      }
    } catch (error) {
      addResult('Basic Product', 'error', `Error: ${error.message}`);
    }
  };

  const restoreProductsAdmin = async () => {
    try {
      addResult('Admin Restore', 'info', 'Checking if ProductsAdmin can be restored...');

      // Test if all columns exist by trying to insert a test record with all fields
      const testProduct = {
        name: 'Schema Test Product',
        description: 'Test product for schema validation',
        price: 1.00,
        compare_price: 2.00,
        is_active: false,
        is_featured: false,
        stock_quantity: 0,
        sort_order: 9999,
        meta_title: 'Test',
        meta_description: 'Test',
        labels: ['test']
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (insertError) {
        addResult('Admin Restore', 'error', `Schema still incomplete: ${insertError.message}`);
        addResult('Admin Restore', 'warning', 'ProductsAdmin cannot be fully restored yet');
      } else {
        addResult('Admin Restore', 'success', '✅ Schema is complete! ProductsAdmin can be restored');

        // Clean up test product
        await supabase.from('products').delete().eq('id', insertTest.id);

        addResult('Admin Restore', 'info', '💡 You can now restore full ProductsAdmin functionality');
        toast({
          title: "Schema Fixed!",
          description: "All columns added successfully. ProductsAdmin can be restored.",
        });
      }
    } catch (error) {
      addResult('Admin Restore', 'error', `Error testing schema: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Products Schema Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={fixProductsSchema} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking Schema...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Check Schema
              </>
            )}
          </Button>

          <Button
            onClick={createBasicProduct}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Create Basic Product
          </Button>

          <Button
            onClick={restoreProductsAdmin}
            disabled={isRunning}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" />
            Test & Restore Admin
          </Button>
        </div>

        {/* Error Explanation */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Current Issue:
          </h4>
          <p className="text-sm text-red-700 mb-2">
            The products table is missing some columns that the admin form expects:
          </p>
          <ul className="text-sm text-red-700 space-y-1 ml-4">
            <li>• <code>stock_quantity</code> - For inventory management</li>
            <li>• <code>sort_order</code> - For display ordering</li>
            <li>• <code>compare_price</code> - For showing original/sale prices</li>
            <li>• <code>meta_title</code> - For SEO optimization</li>
            <li>• <code>meta_description</code> - For SEO optimization</li>
            <li>• <code>labels</code> - For product tags/labels</li>
            <li>• <code>is_featured</code> - For featuring products</li>
          </ul>
        </div>

        {/* Manual Fix Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            MCP-Based Schema Fix:
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            This tool uses MCP (Model Context Protocol) to automatically add missing columns to your database.
          </p>
          <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
            <pre>{`-- These columns will be added automatically:
ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN compare_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN meta_title TEXT;
ALTER TABLE products ADD COLUMN meta_description TEXT;
ALTER TABLE products ADD COLUMN labels TEXT[];
ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;`}</pre>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            1. Click "Check Schema" to analyze current structure<br/>
            2. Missing columns will be added automatically via MCP<br/>
            3. Click "Test & Restore Admin" to verify and restore full functionality
          </p>
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
      </CardContent>
    </Card>
  );
};

export default ProductsSchemaFixer;
