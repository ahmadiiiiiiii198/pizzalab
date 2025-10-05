import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash, Edit, GripVertical, ChefHat, Pizza, Settings, Sparkles } from 'lucide-react';
import { categoryService } from '@/services/categoryService';
import { Category, CategoryContent } from '@/types/category';
import ImageUploader from './ImageUploader';
import ImpastaTypesManager from './ImpastaTypesManager';
import AggiuntiTypesManager from './AggiuntiTypesManager';
import GenericFeatureManager from './GenericFeatureManager';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '@/integrations/supabase/client';

const CategoriesEditor = () => {
  const [content, setContent] = useState<CategoryContent>({
    categories: [],
    heading: '',
    subheading: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [featureTypes, setFeatureTypes] = useState<any[]>([]);
  const { toast } = useToast();

  // Load content on mount
  useEffect(() => {
    loadContent();
    loadFeatureTypes();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [CategoriesEditor] Loading content for admin (including inactive)...');
      // Include inactive categories for admin view
      const data = await categoryService.fetchContent(true);
      console.log('✅ [CategoriesEditor] Content loaded:', data);
      setContent(data);
    } catch (error) {
      console.error('❌ [CategoriesEditor] Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeatureTypes = async () => {
    try {
      // Try to load from database
      const { data, error } = await supabase
        .from('feature_types')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) {
        console.log('Using fallback feature types:', error.message);
        // Fallback to default feature types
        setFeatureTypes([
          {
            id: '1',
            name: 'Impasto',
            slug: 'impasto',  // Fixed: was 'impasta', should be 'impasto'
            description: 'Tipi di impasto',
            table_name: 'impasta_types',
            component: 'ImpastaTypesManager',
            icon: 'ChefHat'
          },
          {
            id: '2',
            name: 'Aggiunti',
            slug: 'aggiunti',
            description: 'Extra e aggiunti',
            table_name: 'aggiunti_types',
            component: 'AggiuntiTypesManager',
            icon: 'Pizza'
          }
        ]);
      } else {
        console.log('✅ Loaded feature types from database:', data.length);
        // Map database data to component format
        const mappedFeatures = data.map(feature => ({
          ...feature,
          component: getComponentName(feature.slug),
          icon: getIconName(feature.slug)
        }));
        setFeatureTypes(mappedFeatures);

        // Force re-render of categories to reflect new feature toggles
        if (content.categories.length > 0) {
          setContent(prev => ({ ...prev }));
        }
      }
    } catch (error) {
      console.error('Error loading feature types:', error);
    }
  };

  const getComponentName = (slug: string): string => {
    const componentMap: { [key: string]: string } = {
      'impasta': 'ImpastaTypesManager',
      'aggiunti': 'AggiuntiTypesManager'
    };
    return componentMap[slug] || 'GenericFeatureManager';
  };

  const getIconName = (slug: string): string => {
    const iconMap: { [key: string]: string } = {
      'impasta': 'ChefHat',
      'aggiunti': 'Pizza'
    };
    return iconMap[slug] || 'Settings';
  };

  const updateHeading = (heading: string) => {
    setContent({ ...content, heading });
    setHasChanges(true);
  };

  const updateSubheading = (subheading: string) => {
    setContent({ ...content, subheading });
    setHasChanges(true);
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: 'new-' + Date.now(),
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: content.categories.length
    };

    // Dynamically add feature toggles based on available feature types
    featureTypes.forEach(featureType => {
      // Sanitize field name: replace hyphens with underscores to match database
      const enabledField = `${featureType.slug.replace(/-/g, '_')}_enabled`;
      (newCategory as any)[enabledField] = true;
    });

    setContent({
      ...content,
      categories: [...content.categories, newCategory]
    });
    setEditingCategory(newCategory.id);
    setHasChanges(true);
  };

  const updateCategory = async (id: string, field: keyof Category, value: any) => {
    console.log(`🔄 [CategoriesEditor] updateCategory called:`, { id, field, value });

    const updatedCategories = content.categories.map(cat =>
      cat.id === id ? { ...cat, [field]: value } : cat
    );

    console.log(`📊 [CategoriesEditor] Updated category:`, updatedCategories.find(cat => cat.id === id));

    setContent({ ...content, categories: updatedCategories });
    setHasChanges(true);

    // If this is a feature toggle field, save immediately
    if (typeof field === 'string' && field.endsWith('_enabled')) {
      console.log(`🔄 [CategoriesEditor] Auto-saving feature toggle: ${field} = ${value}`);

      const categoryToSave = updatedCategories.find(cat => cat.id === id);
      console.log(`📋 [CategoriesEditor] Category to save:`, categoryToSave);

      if (categoryToSave && categoryToSave.name.trim()) {
        try {
          console.log(`💾 [CategoriesEditor] Calling categoryService.saveCategory...`);
          const saveResult = await categoryService.saveCategory({
            ...categoryToSave,
            slug: categoryToSave.slug || generateSlug(categoryToSave.name)
          });

          console.log(`📤 [CategoriesEditor] Save result:`, saveResult);

          if (saveResult) {
            console.log(`✅ [CategoriesEditor] Feature toggle saved: ${field} = ${value}`);
            toast({
              title: 'Saved',
              description: `${field.replace('_enabled', '')} setting updated`,
              variant: 'default'
            });

            // Reload to ensure we have the latest data
            console.log(`🔄 [CategoriesEditor] Reloading content...`);
            await loadContent();
            console.log(`✅ [CategoriesEditor] Content reloaded`);
          } else {
            throw new Error('Save operation returned false');
          }
        } catch (error) {
          console.error(`❌ [CategoriesEditor] Error auto-saving feature toggle:`, error);
          console.error(`❌ [CategoriesEditor] Error details:`, {
            message: error.message,
            stack: error.stack,
            categoryToSave,
            field,
            value
          });
          toast({
            title: 'Error',
            description: `Failed to save ${field}: ${error.message || error}`,
            variant: 'destructive'
          });
        }
      } else {
        console.warn(`⚠️ [CategoriesEditor] Cannot save feature toggle - category not found or has no name`);
        console.warn(`⚠️ [CategoriesEditor] Category details:`, { categoryToSave, hasName: categoryToSave?.name?.trim() });
      }
    }
  };

  const deleteCategory = async (id: string) => {
    if (id.startsWith('new-')) {
      // Remove from local state if it's a new category
      const updatedCategories = content.categories.filter(cat => cat.id !== id);
      setContent({ ...content, categories: updatedCategories });
      setHasChanges(true);
    } else {
      // Delete from database
      const success = await categoryService.deleteCategory(id);
      if (success) {
        const updatedCategories = content.categories.filter(cat => cat.id !== id);
        setContent({ ...content, categories: updatedCategories });
        setHasChanges(true);
        toast({
          title: 'Success',
          description: 'Category deleted successfully'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete category',
          variant: 'destructive'
        });
      }
    }
  };

  const handleImageUpload = (categoryId: string, imageUrl: string) => {
    updateCategory(categoryId, 'image_url', imageUrl);
    toast({
      title: 'Image updated',
      description: 'Category image has been updated successfully'
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(content.categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setContent({ ...content, categories: updatedItems });
    setHasChanges(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);
      console.log('🔄 [CategoriesEditor] Starting save process...');

      // Save content settings
      console.log('💾 [CategoriesEditor] Saving content settings...');
      await categoryService.saveContentSettings(content.heading, content.subheading);

      // Save each category
      console.log('💾 [CategoriesEditor] Saving categories...');
      for (const category of content.categories) {
        if (category.name.trim()) {
          console.log('💾 [CategoriesEditor] Saving category:', category.name);
          console.log('💾 [CategoriesEditor] Category data:', category);
          console.log('💾 [CategoriesEditor] Category keys:', Object.keys(category));

          const categoryToSave = {
            ...category,
            slug: category.slug || generateSlug(category.name)
          };

          console.log('💾 [CategoriesEditor] Final category to save:', categoryToSave);

          const saveResult = await categoryService.saveCategory(categoryToSave);

          if (!saveResult) {
            throw new Error(`Failed to save category: ${category.name}`);
          }
        }
      }

      setHasChanges(false);
      setEditingCategory(null);

      toast({
        title: 'Success',
        description: 'Categories saved successfully'
      });

      // Force clear cache and reload content to get fresh data
      console.log('🔄 [CategoriesEditor] Reloading content after save...');
      await loadContent();

      console.log('✅ [CategoriesEditor] Save process completed successfully');
    } catch (error) {
      console.error('❌ [CategoriesEditor] Error saving categories:', error);
      toast({
        title: 'Error',
        description: `Failed to save categories: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
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
      {/* Dynamic Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {/* Categories Tab (Always First) */}
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Edit className="w-4 h-4" />
          Gestione Categorie
        </button>

        {/* Dynamic Feature Type Tabs */}
        {featureTypes.map((featureType) => {
          const IconComponent = featureType.icon === 'ChefHat' ? ChefHat :
                               featureType.icon === 'Pizza' ? Pizza :
                               featureType.icon === 'Settings' ? Settings : Sparkles;

          return (
            <button
              key={featureType.slug}
              onClick={() => setActiveTab(featureType.slug)}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === featureType.slug
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {featureType.name}
            </button>
          );
        })}
      </div>

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <Button
              onClick={saveChanges}
              disabled={isSaving}
              className="flex items-center gap-2"
              variant={hasChanges ? "default" : "secondary"}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : (hasChanges ? 'Save Changes' : 'Save Current State')}
            </Button>
          </div>
        </>
      )}

      {/* Dynamic Feature Type Tab Content */}
      {featureTypes.map((featureType) => (
        activeTab === featureType.slug && (
          <div key={featureType.slug}>
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              Gestione {featureType.name}
            </h2>
            {/* Render appropriate manager based on slug */}
            {featureType.slug === 'impasto' && <ImpastaTypesManager />}
            {featureType.slug === 'aggiunti' && <AggiuntiTypesManager />}
            {featureType.slug !== 'impasto' && featureType.slug !== 'aggiunti' && (
              <GenericFeatureManager featureType={featureType} />
            )}
          </div>
        )
      ))}

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <>
          {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Section Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="heading" className="text-sm font-medium">
              Heading
            </label>
            <Input
              type="text"
              id="heading"
              value={content.heading}
              onChange={(e) => updateHeading(e.target.value)}
              placeholder="Section heading"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subheading" className="text-sm font-medium">
              Subheading
            </label>
            <Textarea
              id="subheading"
              value={content.subheading}
              onChange={(e) => updateSubheading(e.target.value)}
              placeholder="Section subheading"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {content.categories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-lg p-4 bg-white shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            <div {...provided.dragHandleProps} className="mt-2">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Name</label>
                                  <Input
                                    value={category.name}
                                    onChange={(e) => {
                                      updateCategory(category.id, 'name', e.target.value);
                                      if (!category.slug) {
                                        updateCategory(category.id, 'slug', generateSlug(e.target.value));
                                      }
                                    }}
                                    placeholder="Category name"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Slug</label>
                                  <Input
                                    value={category.slug}
                                    onChange={(e) => updateCategory(category.id, 'slug', e.target.value)}
                                    placeholder="category-slug"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                  value={category.description || ''}
                                  onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                                  placeholder="Category description"
                                  rows={2}
                                />
                              </div>

                              {/* Dynamic Feature Toggles */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Always show Active toggle first */}
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`active-${category.id}`}
                                    checked={category.is_active ?? true}
                                    onChange={(e) => updateCategory(category.id, 'is_active', e.target.checked)}
                                    className="rounded"
                                  />
                                  <label htmlFor={`active-${category.id}`} className="text-sm font-medium">
                                    Attiva
                                  </label>
                                </div>

                                {/* Dynamic feature toggles based on feature_types */}
                                {featureTypes.map((featureType) => {
                                  // Sanitize field name: replace hyphens with underscores to match database
                                  const enabledField = `${featureType.slug.replace(/-/g, '_')}_enabled`;
                                  const isEnabled = (category as any)[enabledField] ?? true;

                                  return (
                                    <div key={featureType.slug} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`${featureType.slug}-${category.id}`}
                                        checked={isEnabled}
                                        onChange={(e) => updateCategory(category.id, enabledField, e.target.checked)}
                                        className="rounded"
                                      />
                                      <label htmlFor={`${featureType.slug}-${category.id}`} className="text-sm font-medium">
                                        {featureType.name}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>

                              <div>
                                <label className="text-sm font-medium">Category Image</label>
                                {category.image_url ? (
                                  <div className="relative mt-2">
                                    <img 
                                      src={category.image_url} 
                                      alt={category.name}
                                      className="max-h-32 rounded-md object-cover"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2"
                                      onClick={() => updateCategory(category.id, 'image_url', '')}
                                    >
                                      <Trash size={14} />
                                    </Button>
                                  </div>
                                ) : (
                                  <ImageUploader
                                    onImageSelected={(imageUrl) => handleImageUpload(category.id, imageUrl)}
                                    buttonLabel="Upload Image"
                                    className="w-full mt-2"
                                    bucketName="categories"
                                    folderPath={`category-${category.slug || category.id}`}
                                  />
                                )}
                              </div>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <Button onClick={addCategory} variant="outline" className="w-full mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default CategoriesEditor;
