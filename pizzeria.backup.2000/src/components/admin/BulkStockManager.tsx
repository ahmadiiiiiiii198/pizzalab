import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, Settings, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  category_name: string;
}

interface IndividualProductCardProps {
  product: Product;
  onUpdateStock: (productId: string, quantity: number) => void;
  isUpdating: boolean;
}

const IndividualProductCard: React.FC<IndividualProductCardProps> = ({
  product,
  onUpdateStock,
  isUpdating
}) => {
  const [localQuantity, setLocalQuantity] = useState(product.stock_quantity);

  // Update local quantity when product changes
  React.useEffect(() => {
    setLocalQuantity(product.stock_quantity);
  }, [product.stock_quantity]);

  const handleUpdate = () => {
    if (localQuantity !== product.stock_quantity) {
      onUpdateStock(product.id, localQuantity);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdate();
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{product.name}</h4>
          <p className="text-xs text-gray-600">{product.category_name}</p>
        </div>
        <Badge
          variant={product.stock_quantity > 10 ? "default" : product.stock_quantity > 0 ? "secondary" : "destructive"}
        >
          {product.stock_quantity}
        </Badge>
      </div>

      <div className="flex items-center gap-1 text-xs">
        {product.stock_quantity > 10 ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : product.stock_quantity > 0 ? (
          <AlertCircle className="h-3 w-3 text-yellow-500" />
        ) : (
          <AlertCircle className="h-3 w-3 text-red-500" />
        )}
        <span className="text-gray-600">
          {product.stock_quantity > 10 ? 'Disponibile' :
           product.stock_quantity > 0 ? 'Scorte basse' : 'Esaurito'}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          min="0"
          value={localQuantity}
          onChange={(e) => setLocalQuantity(parseInt(e.target.value) || 0)}
          onKeyPress={handleKeyPress}
          disabled={isUpdating}
          className="flex-1 h-8 text-sm"
          placeholder="Quantità"
        />
        <Button
          onClick={handleUpdate}
          disabled={isUpdating || localQuantity === product.stock_quantity}
          size="sm"
          className="h-8 px-3"
        >
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Aggiorna'
          )}
        </Button>
      </div>
    </div>
  );
};

const BulkStockManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockManagementEnabled, setStockManagementEnabled] = useState(false);
  const [defaultStockQuantity, setDefaultStockQuantity] = useState(100);
  const [bulkStockQuantity, setBulkStockQuantity] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load products with stock info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          categories (
            name
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;

      const formattedProducts: Product[] = productsData.map(product => ({
        id: product.id,
        name: product.name,
        stock_quantity: product.stock_quantity || 0,
        category_name: product.categories?.name || 'Uncategorized'
      }));

      setProducts(formattedProducts);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['stock_management_enabled', 'default_stock_quantity']);

      if (settingsError) throw settingsError;

      settingsData.forEach(setting => {
        if (setting.key === 'stock_management_enabled') {
          // Handle both old double-encoded and new single-encoded values
          let enabled = false;
          try {
            const parsed = JSON.parse(setting.value);
            enabled = parsed === true || parsed === 'true';
          } catch {
            enabled = setting.value === 'true';
          }
          setStockManagementEnabled(enabled);
          console.log('📦 Stock management loaded:', enabled);
        } else if (setting.key === 'default_stock_quantity') {
          let quantity = 100;
          try {
            const parsed = JSON.parse(setting.value);
            quantity = parseInt(typeof parsed === 'string' ? parsed : parsed.toString());
          } catch {
            quantity = parseInt(setting.value) || 100;
          }
          setDefaultStockQuantity(quantity);
          setBulkStockQuantity(quantity);
          console.log('📦 Default stock quantity loaded:', quantity);
        }
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati di stock.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStockManagement = async (enabled: boolean) => {
    try {
      setIsSaving(true);

      console.log('🔄 Toggling stock management to:', enabled);

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'stock_management_enabled',
          value: JSON.stringify(enabled) // Store as boolean, not string
        });

      if (error) {
        console.error('❌ Error updating stock management:', error);
        throw error;
      }

      setStockManagementEnabled(enabled);

      console.log('✅ Stock management updated successfully:', enabled);

      toast({
        title: enabled ? 'Stock Management Abilitato' : 'Stock Management Disabilitato',
        description: enabled
          ? 'La gestione dello stock è ora attiva per tutti i prodotti.'
          : 'La gestione dello stock è stata disattivata.',
      });

    } catch (error) {
      console.error('Error updating stock management setting:', error);
      toast({
        title: 'Errore',
        description: `Impossibile aggiornare le impostazioni di stock: ${error.message || 'Errore sconosciuto'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateDefaultStockQuantity = async () => {
    try {
      setIsSaving(true);

      console.log('🔄 Updating default stock quantity to:', defaultStockQuantity);

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'default_stock_quantity',
          value: JSON.stringify(defaultStockQuantity) // Store as number, not string
        });

      if (error) {
        console.error('❌ Error updating default stock quantity:', error);
        throw error;
      }

      console.log('✅ Default stock quantity updated successfully:', defaultStockQuantity);

      toast({
        title: 'Quantità Default Aggiornata',
        description: `La quantità di stock predefinita è ora ${defaultStockQuantity}.`,
      });

    } catch (error) {
      console.error('Error updating default stock quantity:', error);
      toast({
        title: 'Errore',
        description: `Impossibile aggiornare la quantità predefinita: ${error.message || 'Errore sconosciuto'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyBulkStockUpdate = async () => {
    try {
      setIsSaving(true);

      console.log('🔄 Starting bulk stock update...', {
        quantity: bulkStockQuantity,
        productsCount: products.length
      });

      // Use a simple update query instead of upsert for bulk operations
      const { data, error, count } = await supabase
        .from('products')
        .update({ stock_quantity: bulkStockQuantity })
        .eq('is_active', true)
        .select('id, name, stock_quantity');

      if (error) {
        console.error('❌ Supabase error details:', error);
        throw error;
      }

      console.log('✅ Bulk update successful:', {
        updatedCount: data?.length || count,
        sampleData: data?.slice(0, 3)
      });

      // Update local state
      setProducts(prev => prev.map(product => ({
        ...product,
        stock_quantity: bulkStockQuantity
      })));

      toast({
        title: 'Stock Aggiornato',
        description: `Stock di ${data?.length || products.length} prodotti aggiornato a ${bulkStockQuantity} unità.`,
      });

    } catch (error) {
      console.error('❌ Error updating bulk stock:', error);
      toast({
        title: 'Errore',
        description: `Impossibile aggiornare lo stock in massa: ${error.message || 'Errore sconosciuto'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetAllStock = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: 0 })
        .eq('is_active', true);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Update local state
      setProducts(prev => prev.map(product => ({
        ...product,
        stock_quantity: 0
      })));

      toast({
        title: 'Stock Azzerato',
        description: 'Lo stock di tutti i prodotti è stato azzerato.',
      });

    } catch (error) {
      console.error('Error resetting stock:', error);
      toast({
        title: 'Errore',
        description: `Impossibile azzerare lo stock: ${error.message || 'Errore sconosciuto'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateIndividualStock = async (productId: string, newQuantity: number) => {
    try {
      setUpdatingProducts(prev => new Set([...prev, productId]));

      console.log('🔄 Updating individual stock:', { productId, newQuantity });

      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);

      if (error) {
        console.error('❌ Error updating individual stock:', error);
        throw error;
      }

      // Update local state
      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, stock_quantity: newQuantity }
          : product
      ));

      console.log('✅ Individual stock updated successfully:', { productId, newQuantity });

      toast({
        title: 'Stock Aggiornato',
        description: `Stock aggiornato a ${newQuantity} unità.`,
      });

    } catch (error) {
      console.error('Error updating individual stock:', error);
      toast({
        title: 'Errore',
        description: `Impossibile aggiornare lo stock: ${error.message || 'Errore sconosciuto'}`,
        variant: 'destructive'
      });
    } finally {
      setUpdatingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Caricamento gestione stock...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Gestione Stock Prodotti</h2>
      </div>

      {/* Global Stock Management Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Impostazioni Globali Stock
          </CardTitle>
          <CardDescription>
            Abilita o disabilita la gestione dello stock per tutti i prodotti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="stock-management">Gestione Stock Attiva</Label>
              <p className="text-sm text-gray-600">
                {stockManagementEnabled 
                  ? 'La gestione dello stock è attualmente attiva' 
                  : 'La gestione dello stock è attualmente disattivata'}
              </p>
            </div>
            <Switch
              id="stock-management"
              checked={stockManagementEnabled}
              onCheckedChange={toggleStockManagement}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-stock">Quantità Stock Predefinita</Label>
              <div className="flex gap-2">
                <Input
                  id="default-stock"
                  type="number"
                  min="0"
                  value={defaultStockQuantity}
                  onChange={(e) => setDefaultStockQuantity(parseInt(e.target.value) || 0)}
                  disabled={isSaving}
                />
                <Button 
                  onClick={updateDefaultStockQuantity}
                  disabled={isSaving}
                  size="sm"
                >
                  Salva
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Stock Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Operazioni Stock in Massa</CardTitle>
          <CardDescription>
            Applica modifiche allo stock di tutti i prodotti contemporaneamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-stock">Quantità da Applicare</Label>
              <Input
                id="bulk-stock"
                type="number"
                min="0"
                value={bulkStockQuantity}
                onChange={(e) => setBulkStockQuantity(parseInt(e.target.value) || 0)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={applyBulkStockUpdate}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Applica a Tutti
              </Button>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={resetAllStock}
                disabled={isSaving}
                variant="destructive"
                className="w-full"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Azzera Tutto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Stock Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Panoramica Stock Prodotti ({products.length})</CardTitle>
          <CardDescription>
            Visualizzazione dello stock attuale per tutti i prodotti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <IndividualProductCard
                key={product.id}
                product={product}
                onUpdateStock={updateIndividualStock}
                isUpdating={updatingProducts.has(product.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkStockManager;
