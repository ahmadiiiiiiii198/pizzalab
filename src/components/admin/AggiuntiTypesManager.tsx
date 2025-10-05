import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Eye,
  EyeOff,
  Euro,
  Tag
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { aggiuntiService, AggiuntiType, AggiuntiTypeFormData, AGGIUNTI_CATEGORIES } from '@/services/aggiuntiService';

const AggiuntiTypesManager: React.FC = () => {
  const [aggiuntiTypes, setAggiuntiTypes] = useState<AggiuntiType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AggiuntiTypeFormData>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    is_active: true,
    sort_order: 0,
    category: 'general'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAggiuntiTypes();
  }, []);

  const loadAggiuntiTypes = async () => {
    try {
      setIsLoading(true);
      const types = await aggiuntiService.getAggiuntiTypes();
      setAggiuntiTypes(types);
    } catch (error) {
      console.error('Error loading aggiunti types:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i tipi di aggiunti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (aggiuntiType: AggiuntiType) => {
    setEditingId(aggiuntiType.id);
    setFormData({
      name: aggiuntiType.name,
      slug: aggiuntiType.slug,
      description: aggiuntiType.description || '',
      price: aggiuntiType.price,
      is_active: aggiuntiType.is_active,
      sort_order: aggiuntiType.sort_order,
      category: aggiuntiType.category
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      is_active: true,
      sort_order: Math.max(...aggiuntiTypes.map(t => t.sort_order), 0) + 1,
      category: 'general'
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Errore",
          description: "Il nome è obbligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!formData.slug.trim()) {
        setFormData(prev => ({ ...prev, slug: aggiuntiService.generateSlug(formData.name) }));
      }

      if (isCreating) {
        const newType = await aggiuntiService.createAggiuntiType(formData);
        if (newType) {
          setAggiuntiTypes(prev => [...prev, newType].sort((a, b) => a.sort_order - b.sort_order));
          toast({
            title: "✅ Successo",
            description: "Tipo di aggiunto creato con successo",
          });
        }
      } else if (editingId) {
        const updatedType = await aggiuntiService.updateAggiuntiType(editingId, formData);
        if (updatedType) {
          setAggiuntiTypes(prev => 
            prev.map(t => t.id === editingId ? updatedType : t)
              .sort((a, b) => a.sort_order - b.sort_order)
          );
          toast({
            title: "✅ Successo",
            description: "Tipo di aggiunto aggiornato con successo",
          });
        }
      }

      handleCancel();
    } catch (error) {
      console.error('Error saving aggiunti type:', error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      is_active: true,
      sort_order: 0,
      category: 'general'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo tipo di aggiunto?')) {
      return;
    }

    try {
      const success = await aggiuntiService.deleteAggiuntiType(id);
      if (success) {
        setAggiuntiTypes(prev => prev.filter(t => t.id !== id));
        toast({
          title: "✅ Successo",
          description: "Tipo di aggiunto eliminato con successo",
        });
      }
    } catch (error) {
      console.error('Error deleting aggiunti type:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const filteredItems = getFilteredAggiuntiTypes();
    const items = Array.from(filteredItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort orders
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index + 1
    }));

    // Update local state
    const updatedTypes = aggiuntiTypes.map(type => {
      const update = updates.find(u => u.id === type.id);
      return update ? { ...type, sort_order: update.sort_order } : type;
    });
    setAggiuntiTypes(updatedTypes);

    try {
      await aggiuntiService.updateSortOrders(updates);
      toast({
        title: "✅ Successo",
        description: "Ordine aggiornato con successo",
      });
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento dell'ordine",
        variant: "destructive",
      });
      // Reload to get correct order
      loadAggiuntiTypes();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const updatedType = await aggiuntiService.updateAggiuntiType(id, { is_active: !currentActive });
      if (updatedType) {
        setAggiuntiTypes(prev => 
          prev.map(t => t.id === id ? updatedType : t)
        );
        toast({
          title: "✅ Successo",
          description: `Tipo di aggiunto ${!currentActive ? 'attivato' : 'disattivato'}`,
        });
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento dello stato",
        variant: "destructive",
      });
    }
  };

  const getFilteredAggiuntiTypes = () => {
    if (filterCategory === 'all') {
      return aggiuntiTypes;
    }
    return aggiuntiTypes.filter(type => type.category === filterCategory);
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = { all: aggiuntiTypes.length };
    AGGIUNTI_CATEGORIES.forEach(cat => {
      stats[cat.value] = aggiuntiTypes.filter(type => type.category === cat.value).length;
    });
    return stats;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Caricamento tipi di aggiunti...</div>
        </CardContent>
      </Card>
    );
  }

  const filteredTypes = getFilteredAggiuntiTypes();
  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestione Aggiunti (Extras)</CardTitle>
            <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Extra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Filtra per Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Tutte le categorie ({categoryStats.all})</option>
              {AGGIUNTI_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label} ({categoryStats[category.value] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Create Form */}
          {isCreating && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-4">Nuovo Aggiunto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: aggiuntiService.generateSlug(e.target.value)
                      }));
                    }}
                    placeholder="Nome dell'aggiunto"
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
                <div>
                  <label className="text-sm font-medium">Prezzo (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    {AGGIUNTI_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="create-active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="create-active" className="text-sm font-medium">
                    Attivo
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">Descrizione</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrizione dell'aggiunto"
                  rows={2}
                />
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

          {/* Aggiunti Types List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="aggiunti-types">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {filteredTypes.map((aggiuntiType, index) => (
                    <Draggable key={aggiuntiType.id} draggableId={aggiuntiType.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-lg p-4 bg-white shadow-sm"
                        >
                          {editingId === aggiuntiType.id ? (
                            // Edit Form (similar to create form but with existing data)
                            <div>
                              <h4 className="font-semibold mb-4">Modifica Aggiunto</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Nome *</label>
                                  <Input
                                    value={formData.name}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        name: e.target.value,
                                        slug: aggiuntiService.generateSlug(e.target.value)
                                      }));
                                    }}
                                    placeholder="Nome dell'aggiunto"
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
                                <div>
                                  <label className="text-sm font-medium">Prezzo (€)</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Categoria</label>
                                  <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                  >
                                    {AGGIUNTI_CATEGORIES.map(category => (
                                      <option key={category.value} value={category.value}>
                                        {category.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                  <input
                                    type="checkbox"
                                    id={`edit-active-${aggiuntiType.id}`}
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    className="rounded"
                                  />
                                  <label htmlFor={`edit-active-${aggiuntiType.id}`} className="text-sm font-medium">
                                    Attivo
                                  </label>
                                </div>
                              </div>
                              <div className="mt-4">
                                <label className="text-sm font-medium">Descrizione</label>
                                <Textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Descrizione dell'aggiunto"
                                  rows={2}
                                />
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
                          ) : (
                            // Display Mode
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps} className="cursor-move">
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold">{aggiuntiType.name}</h4>
                                  <span className="text-sm text-gray-500">({aggiuntiType.slug})</span>
                                  <span className="text-sm font-medium text-blue-600 flex items-center">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {aggiuntiService.getCategoryLabel(aggiuntiType.category)}
                                  </span>
                                  <span className="text-sm font-medium text-green-600 flex items-center">
                                    <Euro className="w-3 h-3 mr-1" />
                                    {aggiuntiType.price.toFixed(2)}
                                  </span>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    aggiuntiType.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {aggiuntiType.is_active ? 'Attivo' : 'Inattivo'}
                                  </div>
                                </div>
                                {aggiuntiType.description && (
                                  <p className="text-sm text-gray-600">{aggiuntiType.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleActive(aggiuntiType.id, aggiuntiType.is_active)}
                                  title={aggiuntiType.is_active ? 'Disattiva' : 'Attiva'}
                                >
                                  {aggiuntiType.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(aggiuntiType)}
                                  disabled={isCreating || editingId !== null}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(aggiuntiType.id)}
                                  disabled={isCreating || editingId !== null}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {filteredTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {filterCategory === 'all' 
                ? "Nessun aggiunto configurato. Clicca \"Aggiungi Extra\" per iniziare."
                : `Nessun aggiunto nella categoria "${aggiuntiService.getCategoryLabel(filterCategory)}".`
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AggiuntiTypesManager;
