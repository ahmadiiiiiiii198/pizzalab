import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Upload,
  Image as ImageIcon,
  XCircle,
  Tag,
  Search,
  Filter
} from 'lucide-react';
import { Product } from '@/types/category';
import { Tables } from '@/integrations/supabase/types';
// initializeProducts and initializeCategories imports removed to prevent accidental initialization
import ImageUpload from '@/components/ImageUpload';
import AdminProductSearch from './AdminProductSearch';
import { parsePrice, roundToTwoDecimals } from '@/utils/priceUtils';
// import LabelsManager from './LabelsManager'; // Temporarily removed - labels column missing from database

type DatabaseProduct = Tables<'products'>;
type DatabaseCategory = Tables<'categories'>;

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  is_active: boolean;
  // Advanced fields (will be included if columns exist in database):
  slug?: string;
  stock_quantity?: number;
  sort_order?: number;
  is_featured?: boolean;
  compare_price?: number;
  meta_title?: string;
  meta_description?: string;
  labels?: string[];
}

const ProductsAdmin = () => {
  const [editingProduct, setEditingProduct] = useState<DatabaseProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priceInputValue, setPriceInputValue] = useState<string>('');
  // isInitializing state removed since initialization button was removed
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: '',
    is_active: true,
    // Advanced fields with default values
    slug: '',
    stock_quantity: 0,
    sort_order: 0,
    is_featured: false,
    compare_price: 0,
    meta_title: '',
    meta_description: '',
    labels: []
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search products"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as (DatabaseProduct & { categories: DatabaseCategory | null })[];
    }
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      console.log('[ProductsAdmin] Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[ProductsAdmin] Categories fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[ProductsAdmin] No categories found, attempting to initialize...');
        const initSuccess = await initializeCategories();
        if (initSuccess) {
          // Retry fetching after initialization
          const { data: retryData, error: retryError } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

          if (retryError) throw retryError;
          return retryData as DatabaseCategory[];
        } else {
          throw new Error('Failed to initialize categories');
        }
      }

      console.log('[ProductsAdmin] Categories loaded:', data);
      return data as DatabaseCategory[];
    }
  });

  // Filter products based on search term, category, and status
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Search filter
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.categories?.name && product.categories.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: 'Successo',
        description: 'Prodotto creato con successo',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: `Impossibile creare il prodotto: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: Partial<DatabaseProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: 'Successo',
        description: 'Prodotto aggiornato con successo',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: `Impossibile aggiornare il prodotto: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[ProductsAdmin] Attempting to delete product with ID:', id);

      // First try to delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ProductsAdmin] Delete error:', error);
        throw error;
      }

      console.log('[ProductsAdmin] Product deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Also invalidate the products service cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Successo',
        description: 'Prodotto eliminato con successo',
      });
    },
    onError: (error) => {
      console.error('[ProductsAdmin] Delete mutation error:', error);
      toast({
        title: 'Errore',
        description: `Impossibile eliminare il prodotto: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: '',
      image_url: '',
      is_active: true,
      slug: '',
      stock_quantity: 0,
      sort_order: 0,
      is_featured: false,
      compare_price: 0,
      meta_title: '',
      meta_description: '',
      labels: []
    });
    setPriceInputValue('');
    setEditingProduct(null);
    setIsCreating(false);
  };

  const startEdit = (product: DatabaseProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
      slug: (product as any).slug || '',
      stock_quantity: (product as any).stock_quantity || 0,
      sort_order: (product as any).sort_order || 0,
      is_featured: (product as any).is_featured || false,
      compare_price: (product as any).compare_price || 0,
      meta_title: (product as any).meta_title || '',
      meta_description: (product as any).meta_description || '',
      labels: (product as any).labels || []
    });
    setPriceInputValue(product.price > 0 ? product.price.toString() : '');
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setPriceInputValue('');
    setIsCreating(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category_id) {
      toast({
        title: 'Errore di Validazione',
        description: 'Compila tutti i campi obbligatori',
        variant: 'destructive',
      });
      return;
    }

    // Create base product data with only guaranteed fields
    const baseProductData = {
      name: formData.name,
      description: formData.description,
      price: roundToTwoDecimals(formData.price), // Ensure 2 decimal places
      category_id: formData.category_id,
      image_url: formData.image_url,
      is_active: formData.is_active
    };

    // Add advanced fields if they have values (will be filtered out if columns don't exist)
    const advancedFields: any = {};
    if (formData.slug) advancedFields.slug = formData.slug;
    if (formData.stock_quantity !== undefined) advancedFields.stock_quantity = Number(formData.stock_quantity);
    if (formData.sort_order !== undefined) advancedFields.sort_order = Number(formData.sort_order);
    if (formData.is_featured !== undefined) advancedFields.is_featured = formData.is_featured;
    if (formData.compare_price) advancedFields.compare_price = roundToTwoDecimals(formData.compare_price);
    if (formData.meta_title) advancedFields.meta_title = formData.meta_title;
    if (formData.meta_description) advancedFields.meta_description = formData.meta_description;
    if (formData.labels && formData.labels.length > 0) advancedFields.labels = formData.labels;

    const productData = { ...baseProductData, ...advancedFields };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const toggleActive = (product: DatabaseProduct) => {
    updateProductMutation.mutate({
      id: product.id,
      is_active: !product.is_active
    });
  };

  // toggleFeatured function temporarily removed - is_featured column missing from database

  // Removed handleInitializeDatabase function to prevent accidental recreation of default content

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {categoriesLoading ? 'Caricamento categorie...' : 'Caricamento prodotti...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if categories failed to load
  if (categoriesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Impossibile caricare le categorie</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-categories'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">Products Management</h2>
          <p className="text-sm md:text-base text-gray-600">Gestisci il catalogo prodotti</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          {/* Initialize Database button removed to prevent accidental recreation of default content */}
          <Button
            onClick={startCreate}
            disabled={isCreating || editingProduct || !categories || categories.length === 0}
            className="w-full md:w-auto text-xs md:text-sm"
            size="sm"
          >
            <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Aggiungi Prodotto</span>
            <span className="sm:hidden">Aggiungi</span>
          </Button>
        </div>
      </div>

      {/* Mobile-optimized Product Form */}
      {(isCreating || editingProduct) && (
        <Card className="mx-1 md:mx-0">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <span>{editingProduct ? 'Modifica Prodotto' : 'Crea Nuovo Prodotto'}</span>
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 md:h-9 md:w-9">
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter product name"
                    required
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="product-slug"
                    className="text-sm md:text-base"
                  />
                  <p className="text-xs text-gray-500">Auto-generated from name, or customize</p>
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                  className="text-sm md:text-base resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Price (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPriceInputValue(value);

                      // Update the form data with parsed price
                      if (value === '') {
                        setFormData(prev => ({ ...prev, price: 0 }));
                      } else {
                        const numericValue = parsePrice(value);
                        setFormData(prev => ({ ...prev, price: numericValue }));
                      }
                    }}
                    onBlur={(e) => {
                      // Clean up the display value when field loses focus
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) <= 0) {
                        setPriceInputValue('');
                        setFormData(prev => ({ ...prev, price: 0 }));
                      } else {
                        const numericValue = parsePrice(value);
                        setPriceInputValue(numericValue.toString());
                        setFormData(prev => ({ ...prev, price: numericValue }));
                      }
                    }}
                    required
                    className="text-sm md:text-base"
                    placeholder="Enter price (e.g., 7.00)"
                  />
                </div>
                {/* Compare Price field temporarily removed - missing from database schema */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="stock_quantity" className="text-sm font-medium">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    className="text-sm md:text-base"
                  />
                  <p className="text-xs text-gray-500">Set to 0 for unlimited stock</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="category_id" className="text-sm font-medium">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id} className="text-sm md:text-base">
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled className="text-sm md:text-base">
                          No categories available - Initialize first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="sort_order" className="text-sm font-medium">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="image_url" className="text-sm font-medium">Product Image</Label>
                <ImageUpload
                  currentValue={formData.image_url}
                  onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  className="w-full"
                />
              </div>

              {/* SEO and Labels fields temporarily removed - missing from database schema */}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-6 md:gap-0">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
                </div>
                {/* Featured toggle temporarily removed - missing from database schema */}
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="w-full md:w-auto text-sm"
                  size="sm"
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      {editingProduct ? 'Aggiornamento...' : 'Creazione...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      {editingProduct ? 'Aggiorna Prodotto' : 'Crea Prodotto'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full md:w-auto text-sm"
                  size="sm"
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mobile-optimized Products List */}
      <Card className="mx-1 md:mx-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Package className="h-4 w-4 md:h-5 md:w-5" />
            Products ({filteredProducts?.length || 0} of {products?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {/* Search and Filter Section */}
          <AdminProductSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categories={categories || []}
            totalProducts={products?.length || 0}
            filteredProducts={filteredProducts.length}
            onClearFilters={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          />
          {filteredProducts && filteredProducts.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 border rounded-lg hover:bg-gray-50 space-y-3 md:space-y-0"
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">{product.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {(product as any).categories?.name || 'No category'}
                      </p>
                      <p className="text-base md:text-lg font-bold text-emerald-600">€{product.price.toFixed(2)}</p>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                        {product.is_active ? (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-red-600">
                            Inactive
                          </Badge>
                        )}
                        {/* Stock quantity badge temporarily removed - column missing from database */}
                      </div>
                      {/* Labels display temporarily removed - labels column missing from database */}
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-1 md:space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(product)}
                      title={product.is_active ? 'Deactivate' : 'Activate'}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      {product.is_active ? (
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      ) : (
                        <EyeOff className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </Button>
                    {/* Featured toggle button temporarily removed - is_featured column missing from database */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(product)}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteProductMutation.isPending}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
              {products && products.length > 0 ? (
                <div>
                  <p className="text-sm md:text-base text-gray-600 mb-2">
                    No products match your current filters
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <p className="text-sm md:text-base text-gray-600">
                  Nessun prodotto trovato. Crea il tuo primo prodotto!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsAdmin;
