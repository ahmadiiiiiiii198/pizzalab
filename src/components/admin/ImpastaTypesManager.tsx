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
  Euro
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { impastaService, ImpastaType, ImpastaTypeFormData } from '@/services/impastaService';

const ImpastaTypesManager: React.FC = () => {
  const [impastaTypes, setImpastaTypes] = useState<ImpastaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ImpastaTypeFormData>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    is_active: true,
    sort_order: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadImpastaTypes();
  }, []);

  const loadImpastaTypes = async () => {
    try {
      setIsLoading(true);
      const types = await impastaService.getImpastaTypes();
      setImpastaTypes(types);
    } catch (error) {
      console.error('Error loading impasta types:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i tipi di impasto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (impastaType: ImpastaType) => {
    setEditingId(impastaType.id);
    setFormData({
      name: impastaType.name,
      slug: impastaType.slug,
      description: impastaType.description || '',
      price: impastaType.price,
      is_active: impastaType.is_active,
      sort_order: impastaType.sort_order
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
      sort_order: Math.max(...impastaTypes.map(t => t.sort_order), 0) + 1
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
        setFormData(prev => ({ ...prev, slug: impastaService.generateSlug(formData.name) }));
      }

      if (isCreating) {
        const newType = await impastaService.createImpastaType(formData);
        if (newType) {
          setImpastaTypes(prev => [...prev, newType].sort((a, b) => a.sort_order - b.sort_order));
          toast({
            title: "✅ Successo",
            description: "Tipo di impasto creato con successo",
          });
        }
      } else if (editingId) {
        const updatedType = await impastaService.updateImpastaType(editingId, formData);
        if (updatedType) {
          setImpastaTypes(prev => 
            prev.map(t => t.id === editingId ? updatedType : t)
              .sort((a, b) => a.sort_order - b.sort_order)
          );
          toast({
            title: "✅ Successo",
            description: "Tipo di impasto aggiornato con successo",
          });
        }
      }

      handleCancel();
    } catch (error) {
      console.error('Error saving impasta type:', error);
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
      sort_order: 0
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo tipo di impasto?')) {
      return;
    }

    try {
      const success = await impastaService.deleteImpastaType(id);
      if (success) {
        setImpastaTypes(prev => prev.filter(t => t.id !== id));
        toast({
          title: "✅ Successo",
          description: "Tipo di impasto eliminato con successo",
        });
      }
    } catch (error) {
      console.error('Error deleting impasta type:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(impastaTypes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort orders
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index + 1
    }));

    setImpastaTypes(items);

    try {
      await impastaService.updateSortOrders(updates);
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
      loadImpastaTypes();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const updatedType = await impastaService.updateImpastaType(id, { is_active: !currentActive });
      if (updatedType) {
        setImpastaTypes(prev => 
          prev.map(t => t.id === id ? updatedType : t)
        );
        toast({
          title: "✅ Successo",
          description: `Tipo di impasto ${!currentActive ? 'attivato' : 'disattivato'}`,
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Caricamento tipi di impasto...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestione Tipi di Impasto</CardTitle>
            <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create Form */}
          {isCreating && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-4">Nuovo Tipo di Impasto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: impastaService.generateSlug(e.target.value)
                      }));
                    }}
                    placeholder="Nome del tipo di impasto"
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
                  <label className="text-sm font-medium">Prezzo Extra (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
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
                  placeholder="Descrizione del tipo di impasto"
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

          {/* Impasta Types List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="impasta-types">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {impastaTypes.map((impastaType, index) => (
                    <Draggable key={impastaType.id} draggableId={impastaType.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-lg p-4 bg-white shadow-sm"
                        >
                          {editingId === impastaType.id ? (
                            // Edit Form
                            <div>
                              <h4 className="font-semibold mb-4">Modifica Tipo di Impasto</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Nome *</label>
                                  <Input
                                    value={formData.name}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        name: e.target.value,
                                        slug: impastaService.generateSlug(e.target.value)
                                      }));
                                    }}
                                    placeholder="Nome del tipo di impasto"
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
                                  <label className="text-sm font-medium">Prezzo Extra (€)</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                  <input
                                    type="checkbox"
                                    id={`edit-active-${impastaType.id}`}
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    className="rounded"
                                  />
                                  <label htmlFor={`edit-active-${impastaType.id}`} className="text-sm font-medium">
                                    Attivo
                                  </label>
                                </div>
                              </div>
                              <div className="mt-4">
                                <label className="text-sm font-medium">Descrizione</label>
                                <Textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Descrizione del tipo di impasto"
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
                                  <h4 className="font-semibold">{impastaType.name}</h4>
                                  <span className="text-sm text-gray-500">({impastaType.slug})</span>
                                  {impastaType.price > 0 && (
                                    <span className="text-sm font-medium text-green-600 flex items-center">
                                      <Euro className="w-3 h-3 mr-1" />
                                      +{impastaType.price.toFixed(2)}
                                    </span>
                                  )}
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    impastaType.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {impastaType.is_active ? 'Attivo' : 'Inattivo'}
                                  </div>
                                </div>
                                {impastaType.description && (
                                  <p className="text-sm text-gray-600">{impastaType.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleActive(impastaType.id, impastaType.is_active)}
                                  title={impastaType.is_active ? 'Disattiva' : 'Attiva'}
                                >
                                  {impastaType.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(impastaType)}
                                  disabled={isCreating || editingId !== null}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(impastaType.id)}
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

          {impastaTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nessun tipo di impasto configurato. Clicca "Aggiungi Tipo" per iniziare.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImpastaTypesManager;
