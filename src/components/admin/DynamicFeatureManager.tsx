import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Settings,
  Database,
  Code,
  Trash2,
  Trash,
  Edit3,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DynamicTableService from '@/services/dynamicTableService';

interface FeatureType {
  id: string;
  name: string;
  slug: string;
  description: string;
  table_name: string;
  is_active: boolean;
  has_categories: boolean;
  has_price: boolean;
  has_size: boolean;
  custom_fields: any;
  created_at: string;
  sort_order?: number;
}

interface NewFeatureType {
  name: string;
  description: string;
  has_categories: boolean;
  has_price: boolean;
  has_size: boolean;
  categories: string[];
  additional_fields: string[];
  sort_order: number;
}

const DynamicFeatureManager: React.FC = () => {
  const [featureTypes, setFeatureTypes] = useState<FeatureType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState<NewFeatureType>({
    name: '',
    description: '',
    has_categories: false,
    has_price: true,
    has_size: false,
    categories: [],
    additional_fields: [],
    sort_order: 0
  });
  const [newCategory, setNewCategory] = useState('');
  const [newField, setNewField] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadFeatureTypes();
  }, []);

  // Debug: Track feature types changes
  useEffect(() => {
    console.log('🔄 Feature types state changed:', featureTypes.length, 'features');
    console.log('📊 Current features:', featureTypes.map(f => ({ id: f.id, name: f.name, created_at: f.created_at })));
  }, [featureTypes]);

  const loadFeatureTypes = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading feature types from database...');

      // Try to load from database first
      const { data, error } = await supabase
        .from('feature_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error loading feature types:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));

        // Only use fallback data if the table doesn't exist (specific error codes)
        const isTableNotFound = error.code === 'PGRST116' ||
                               error.code === '42P01' ||  // PostgreSQL table does not exist
                               error.message.includes('relation "feature_types" does not exist') ||
                               error.message.includes('table "feature_types" does not exist');

        if (isTableNotFound) {
          console.log('📋 Table feature_types does not exist, using fallback data');

          // Fallback to simulated data only when table doesn't exist
          const simulatedFeatureTypes: FeatureType[] = [
            {
              id: '1',
              name: 'Aggiunti',
              slug: 'aggiunti',
              description: 'Extra toppings and ingredients for pizzas',
              table_name: 'aggiunti_types',
              is_active: true,
              has_categories: true,
              has_price: true,
              has_size: false,
              custom_fields: { categories: ['formaggi', 'salumi', 'verdure', 'pesce', 'contorni'] },
              created_at: new Date().toISOString(),
              sort_order: 1
            },
            {
              id: '2',
              name: 'Impasto',
              slug: 'impasto',
              description: 'Different dough types for pizzas',
              table_name: 'impasta_types',
              is_active: true,
              has_categories: false,
              has_price: true,
              has_size: false,
              custom_fields: {},
              created_at: new Date().toISOString(),
              sort_order: 2
            }
          ];

          setFeatureTypes(simulatedFeatureTypes);

          toast({
            title: '⚠️ Database Setup Required',
            description: 'Feature types table not found. Using default data.',
            variant: 'default'
          });
        } else {
          // For other errors (connection, auth, etc.), keep existing state if any, or show empty
          console.error('🚨 Database error (not table missing):', error.message);
          console.error('🚨 This error should NOT cause fallback to hardcoded data!');

          // Don't reset to empty array - keep existing state if we have it
          // This prevents losing newly created features on reload errors

          toast({
            title: 'Errore Database',
            description: `Errore nel caricamento: ${error.message}. Riprova tra qualche secondo.`,
            variant: 'destructive'
          });
        }
      } else {
        console.log('✅ Loaded feature types from database:', data?.length || 0);
        console.log('📊 Feature types data:', data);
        setFeatureTypes(data || []);
      }
    } catch (error) {
      console.error('💥 Unexpected error loading feature types:', error);

      // Don't reset to empty array on unexpected errors either
      toast({
        title: 'Errore',
        description: 'Errore imprevisto nel caricamento. Riprova tra qualche secondo.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateTableName = (slug: string): string => {
    return `${slug}_types`;
  };

  const addCategory = () => {
    if (newCategory.trim() && !newFeature.categories.includes(newCategory.trim())) {
      setNewFeature(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setNewFeature(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const addField = () => {
    if (newField.trim() && !newFeature.additional_fields.includes(newField.trim())) {
      setNewFeature(prev => ({
        ...prev,
        additional_fields: [...prev.additional_fields, newField.trim()]
      }));
      setNewField('');
    }
  };

  const removeField = (field: string) => {
    setNewFeature(prev => ({
      ...prev,
      additional_fields: prev.additional_fields.filter(f => f !== field)
    }));
  };

  const handleDelete = async (featureId: string, featureName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la caratteristica "${featureName}"? Questa azione non può essere annullata.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting feature:', featureId);

      const { error } = await supabase
        .from('feature_types')
        .delete()
        .eq('id', featureId);

      if (error) {
        console.error('❌ Error deleting feature:', error);
        toast({
          title: 'Errore',
          description: `Errore nell'eliminazione: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ Feature deleted successfully');
      toast({
        title: '✅ Eliminato',
        description: `Caratteristica "${featureName}" eliminata con successo`,
        variant: 'default'
      });

      // Reload feature types to reflect changes
      await loadFeatureTypes();
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante l\'eliminazione',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateSortOrder = async (featureId: string, newSortOrder: number) => {
    try {
      const { error } = await supabase
        .from('feature_types')
        .update({ sort_order: newSortOrder })
        .eq('id', featureId);

      if (error) {
        console.error('❌ Error updating sort order:', error);
        toast({
          title: 'Errore',
          description: 'Errore nell\'aggiornamento dell\'ordine',
          variant: 'destructive'
        });
        return;
      }

      // Reload to reflect changes
      await loadFeatureTypes();
    } catch (error) {
      console.error('❌ Sort order update error:', error);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    const nextSortOrder = Math.max(...featureTypes.map(f => f.sort_order || 0), 0) + 1;
    setNewFeature({
      name: '',
      description: '',
      has_categories: false,
      has_price: true,
      has_size: false,
      categories: [],
      additional_fields: [],
      sort_order: nextSortOrder
    });
  };

  const handleCreateFeature = async () => {
    try {
      if (!newFeature.name.trim()) {
        toast({
          title: 'Errore',
          description: 'Il nome è obbligatorio',
          variant: 'destructive'
        });
        return;
      }

      const slug = generateSlug(newFeature.name);
      const tableName = generateTableName(slug);

      // Build custom fields object
      const customFields = {
        categories: newFeature.categories,
        additional_fields: newFeature.additional_fields,
        has_categories: newFeature.has_categories,
        has_price: newFeature.has_price,
        has_size: newFeature.has_size
      };

      const featureType: FeatureType = {
        id: Date.now().toString(),
        name: newFeature.name,
        slug,
        description: newFeature.description,
        table_name: tableName,
        is_active: true,
        has_categories: newFeature.has_categories,
        has_price: newFeature.has_price,
        has_size: newFeature.has_size,
        custom_fields: customFields,
        created_at: new Date().toISOString()
      };

      // Save to database
      console.log('🔧 Creating feature type:', featureType);

      const { data, error } = await supabase
        .from('feature_types')
        .insert([{
          name: featureType.name,
          slug: featureType.slug,
          description: featureType.description,
          table_name: featureType.table_name,
          is_active: featureType.is_active,
          has_categories: featureType.has_categories,
          has_price: featureType.has_price,
          has_size: featureType.has_size,
          custom_fields: featureType.custom_fields,
          sort_order: featureType.sort_order
        }])
        .select();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: 'Salvato Localmente',
          description: `"${newFeature.name}" creato localmente. Tabella feature_types non esiste ancora nel database.`,
          variant: 'default'
        });

        // Add to local state for now
        setFeatureTypes(prev => [...prev, featureType]);
      } else {
        console.log('✅ Feature type saved to database:', data);

        // 🚀 AUTOMATIC TABLE CREATION
        console.log('🔧 Starting automatic table creation...');
        toast({
          title: '🔧 Creazione Automatica',
          description: `Creando tabella per "${newFeature.name}"...`,
          variant: 'default'
        });

        try {
          const tableCreated = await DynamicTableService.createTableForFeature(data[0]);

          if (tableCreated) {
            toast({
              title: '🎉 Successo Completo!',
              description: `"${newFeature.name}" creato con tabella automatica! Pronto per l'uso.`,
              variant: 'default'
            });
          } else {
            toast({
              title: '⚠️ Creazione Parziale',
              description: `"${newFeature.name}" creato. Tabella richiede creazione manuale.`,
              variant: 'default'
            });
          }
        } catch (tableError) {
          console.error('Table creation error:', tableError);
          toast({
            title: '⚠️ Tabella Non Creata',
            description: `"${newFeature.name}" creato ma tabella richiede setup manuale.`,
            variant: 'default'
          });
        }

        // Add the newly created feature to local state immediately
        // This ensures it's visible even if the reload fails
        setFeatureTypes(prev => {
          const newFeatureFromDb = data[0];
          // Check if it's already in the list to avoid duplicates
          const exists = prev.some(f => f.id === newFeatureFromDb.id);
          if (exists) {
            return prev;
          }
          return [...prev, newFeatureFromDb].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        });

        // Try to reload feature types from database to get the latest state
        // If this fails, we still have the feature in local state
        try {
          await loadFeatureTypes();
        } catch (reloadError) {
          console.warn('⚠️ Failed to reload feature types after creation, but feature is saved:', reloadError);
          // Don't show error toast since the feature was created successfully
        }
      }

      setIsCreating(false);
      setNewFeature({
        name: '',
        description: '',
        has_categories: false,
        has_price: true,
        has_size: false,
        categories: [],
        additional_fields: [],
        sort_order: 0
      });
      setNewCategory('');
      setNewField('');

    } catch (error) {
      console.error('Error creating feature type:', error);
      toast({
        title: 'Errore',
        description: 'Errore nella creazione del tipo di caratteristica',
        variant: 'destructive'
      });
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Tipi di Caratteristiche</h2>
          <p className="text-gray-600">Crea e gestisci dinamicamente nuovi tipi di caratteristiche per i prodotti</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Tipo
        </Button>
      </div>

      {/* Warning Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Sistema in Sviluppo</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Questo è un prototipo del sistema di creazione dinamica delle caratteristiche. 
                La funzionalità completa includerà la generazione automatica di tabelle database, 
                servizi e interfacce admin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Feature Types */}
      <div className="grid gap-4">
        {featureTypes.map((featureType) => (
          <Card key={featureType.id} className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{featureType.name}</CardTitle>
                    <CardDescription>{featureType.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={featureType.is_active ? "default" : "secondary"}>
                    {featureType.is_active ? "Attivo" : "Inattivo"}
                  </Badge>
                  <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    Ordine: {featureType.sort_order || 0}
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={featureType.sort_order || 0}
                      onChange={(e) => handleUpdateSortOrder(featureType.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-xs"
                      title="Ordine di visualizzazione"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(featureType.id, featureType.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Tabella:</span>
                  <p className="text-gray-600">{featureType.table_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Categorie:</span>
                  <p className="text-gray-600">{featureType.has_categories ? "Sì" : "No"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Prezzo:</span>
                  <p className="text-gray-600">{featureType.has_price ? "Sì" : "No"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Dimensioni:</span>
                  <p className="text-gray-600">{featureType.has_size ? "Sì" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Feature Type Modal */}
      {isCreating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800">Crea Nuovo Tipo di Caratteristica</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newFeature.name}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="es. Bevande"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Input
                  id="description"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="es. Drinks and beverages for orders"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_categories"
                  checked={newFeature.has_categories}
                  onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, has_categories: checked }))}
                />
                <Label htmlFor="has_categories">Ha Categorie</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_price"
                  checked={newFeature.has_price}
                  onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, has_price: checked }))}
                />
                <Label htmlFor="has_price">Ha Prezzo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_size"
                  checked={newFeature.has_size}
                  onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, has_size: checked }))}
                />
                <Label htmlFor="has_size">Ha Dimensioni</Label>
              </div>
            </div>

            {/* Categories Section */}
            {newFeature.has_categories && (
              <div className="space-y-3">
                <Label>Categorie</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="es. formaggi, salumi, verdure"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <Button
                    type="button"
                    onClick={addCategory}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newFeature.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newFeature.categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Additional Fields Section */}
            <div className="space-y-3">
              <Label>Campi Aggiuntivi (opzionale)</Label>
              <div className="flex gap-2">
                <Input
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  placeholder="es. brand, temperature, alcohol_content"
                  onKeyPress={(e) => e.key === 'Enter' && addField()}
                />
                <Button
                  type="button"
                  onClick={addField}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newFeature.additional_fields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newFeature.additional_fields.map((field, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {field}
                      <button
                        type="button"
                        onClick={() => removeField(field)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500">
                Aggiungi campi personalizzati come brand, temperatura, contenuto alcolico, ecc.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ordine di Visualizzazione</label>
              <Input
                type="number"
                min="0"
                value={newFeature.sort_order}
                onChange={(e) => setNewFeature(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-24"
              />
              <p className="text-xs text-gray-500">Numero più basso = appare prima</p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Annulla
              </Button>
              <Button
                onClick={handleCreateFeature}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Crea Tipo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicFeatureManager;
