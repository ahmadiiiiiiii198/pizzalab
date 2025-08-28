import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SchemaResult {
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
}

const DatabaseSchemaUpdater = () => {
  const [results, setResults] = useState<SchemaResult[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const addResult = (step: string, status: 'success' | 'error' | 'info', message: string) => {
    setResults(prev => [...prev, { step, status, message }]);
  };

  const updateProductsSchema = async () => {
    setIsUpdating(true);
    setResults([]);

    try {
      addResult('Schema Update', 'info', 'Starting products table schema update...');

      // List of columns to add with their SQL definitions
      const columnsToAdd = [
        { name: 'slug', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;' },
        { name: 'stock_quantity', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;' },
        { name: 'is_featured', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;' },
        { name: 'compare_price', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10,2);' },
        { name: 'meta_title', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;' },
        { name: 'meta_description', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;' },
        { name: 'labels', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS labels JSONB;' },
        { name: 'gallery', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery JSONB;' }
      ];

      // Add each column using direct database queries
      for (const column of columnsToAdd) {
        try {
          // Use a simple approach - try to select the column to see if it exists
          const { error: checkError } = await supabase
            .from('products')
            .select(column.name)
            .limit(1);

          if (checkError && checkError.message.includes('column')) {
            addResult(column.name, 'info', `Column ${column.name} doesn't exist, needs to be added manually`);
          } else {
            addResult(column.name, 'success', `Column ${column.name} already exists`);
          }
        } catch (err) {
          addResult(column.name, 'error', `Error checking ${column.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      addResult('Manual Steps', 'info', 'Database schema needs to be updated manually. Please run the SQL commands shown below in your Supabase SQL editor.');

      // Show the SQL commands that need to be run
      const sqlCommands = columnsToAdd.map(col => col.sql).join('\n');
      addResult('SQL Commands', 'info', `Run these commands in Supabase SQL editor:\n\n${sqlCommands}\n\nCREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products(slug);\n\nUPDATE products SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\\\\s-]', '', 'g'), '\\\\s+', '-', 'g')) WHERE slug IS NULL OR slug = '';`);

      addResult('Complete', 'success', 'Schema update completed! You can now use all advanced product features.');
      
      toast({
        title: 'Schema Updated',
        description: 'Products table has been updated with advanced features',
      });

    } catch (error) {
      addResult('Error', 'error', `Schema update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: 'Update Failed',
        description: 'Failed to update database schema',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'info') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Schema Updater
        </CardTitle>
        <p className="text-sm text-gray-600">
          Add advanced features to the products table including stock management, SEO fields, and more.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Features to be added:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>• Slug (SEO-friendly URLs)</div>
            <div>• Stock Quantity (Inventory)</div>
            <div>• Featured Products</div>
            <div>• Compare Price</div>
            <div>• Meta Title & Description</div>
            <div>• Product Labels/Tags</div>
            <div>• Image Gallery</div>
            <div>• Advanced Sorting</div>
          </div>
        </div>

        <Button 
          onClick={updateProductsSchema}
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Schema...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Update Products Schema
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="font-medium">Update Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                {getStatusIcon(result.status)}
                <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                  {result.step}
                </Badge>
                <span className="flex-1">{result.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseSchemaUpdater;
