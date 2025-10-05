import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash, Save, X, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DynamicTableService from '@/services/dynamicTableService';

interface GenericFeatureManagerProps {
  featureType: {
    id: string;
    name: string;
    slug: string;
    description: string;
    table_name: string;
    has_categories: boolean;
    has_price: boolean;
    has_size: boolean;
    custom_fields: any;
  };
}

interface FeatureItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  category?: string;
  size?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  size: string;
  is_active: boolean;
  sort_order: number;
}

const GenericFeatureManager: React.FC<GenericFeatureManagerProps> = ({ featureType }) => {
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    category: '',
    size: '',
    is_active: true,
    sort_order: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, [featureType.table_name]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      
      // Check if table exists by trying to query it
      const { data, error } = await supabase
        .from(featureType.table_name)
        .select('*')
        .order('sort_order');

      if (error) {
        console.log(`Table ${featureType.table_name} doesn't exist yet:`, error.message);

        // 🚀 AUTOMATIC TABLE CREATION
        toast({
          title: '🔧 Creazione Automatica',
          description: `Creando tabella "${featureType.table_name}"...`,
          variant: 'default'
        });

        try {
          console.log('🔧 Attempting automatic table creation...');
          const tableCreated = await DynamicTableService.createTableForFeature(featureType);

          if (tableCreated) {
            toast({
              title: '✅ Tabella Creata!',
              description: `Tabella "${featureType.table_name}" creata automaticamente!`,
              variant: 'default'
            });

            // Retry loading items
            setTimeout(() => {
              loadItems();
            }, 1000);
          } else {
            toast({
              title: '⚠️ Creazione Manuale Richiesta',
              description: `Impossibile creare automaticamente la tabella "${featureType.table_name}".`,
              variant: 'default'
            });
          }
        } catch (tableError) {
          console.error('Automatic table creation failed:', tableError);
          toast({
            title: '⚠️ Errore Creazione',
            description: `Errore nella creazione automatica della tabella.`,
            variant: 'destructive'
          });
        }

        setItems([]);
      } else {
        console.log(`✅ Loaded ${data.length} items from ${featureType.table_name}`);
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: 'Errore',
        description: `Errore nel caricamento di ${featureType.name}`,
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
      .trim();
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      category: featureType.custom_fields?.categories?.[0] || '',
      size: '',
      is_active: true,
      sort_order: Math.max(...items.map(item => item.sort_order), 0) + 1
    });
  };

  const handleEdit = (item: FeatureItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      price: item.price || 0,
      category: item.category || '',
      size: item.size || '',
      is_active: item.is_active,
      sort_order: item.sort_order
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Errore',
          description: 'Il nome è obbligatorio',
          variant: 'destructive'
        });
        return;
      }

      const slug = formData.slug || generateSlug(formData.name);
      const itemData = {
        name: formData.name,
        slug,
        description: formData.description,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
        ...(featureType.has_price && { price: formData.price }),
        ...(featureType.has_categories && formData.category && { category: formData.category }),
        ...(featureType.has_size && formData.size && { size: formData.size })
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from(featureType.table_name)
          .insert([itemData])
          .select()
          .single();

        if (error) {
          console.error('Create error:', error);
          toast({
            title: 'Errore',
            description: `Errore nella creazione: ${error.message}`,
            variant: 'destructive'
          });
          return;
        }

        setItems(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
        toast({
          title: '✅ Successo',
          description: `${featureType.name} creato con successo`,
        });
      } else if (editingId) {
        const { data, error } = await supabase
          .from(featureType.table_name)
          .update(itemData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          toast({
            title: 'Errore',
            description: `Errore nell'aggiornamento: ${error.message}`,
            variant: 'destructive'
          });
          return;
        }

        setItems(prev => 
          prev.map(item => item.id === editingId ? data : item)
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        toast({
          title: '✅ Successo',
          description: `${featureType.name} aggiornato con successo`,
        });
      }

      handleCancel();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante il salvataggio',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;

    try {
      const { error } = await supabase
        .from(featureType.table_name)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Errore',
          description: `Errore nell'eliminazione: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: '✅ Successo',
        description: `${featureType.name} eliminato con successo`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante l\'eliminazione',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      category: '',
      size: '',
      is_active: true,
      sort_order: 0
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gestione {featureType.name}
            </CardTitle>
            <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi {featureType.name}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-4">
                {isCreating ? `Nuovo ${featureType.name}` : `Modifica ${featureType.name}`}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      }));
                    }}
                    placeholder={`Nome del ${featureType.name.toLowerCase()}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-automatico"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Descrizione</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrizione opzionale"
                    rows={2}
                  />
                </div>
                {featureType.has_price && (
                  <div>
                    <label className="text-sm font-medium">Prezzo (€)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                )}
                {featureType.has_categories && featureType.custom_fields?.categories && (
                  <div>
                    <label className="text-sm font-medium">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Seleziona categoria</option>
                      {featureType.custom_fields.categories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
                {featureType.has_size && (
                  <div>
                    <label className="text-sm font-medium">Dimensione</label>
                    <Input
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      placeholder="es. piccola, media, grande"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Ordine</label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">Attivo</label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Annulla
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nessun {featureType.name.toLowerCase()} trovato</p>
                <p className="text-sm">Clicca "Aggiungi {featureType.name}" per iniziare</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      {featureType.has_price && (
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          €{item.price?.toFixed(2)}
                        </span>
                      )}
                      {item.category && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      )}
                      {item.size && (
                        <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {item.size}
                        </span>
                      )}
                      {!item.is_active && (
                        <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          Inattivo
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                    <p className="text-xs text-gray-400">Slug: {item.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      disabled={isCreating || editingId !== null}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={isCreating || editingId !== null}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenericFeatureManager;
