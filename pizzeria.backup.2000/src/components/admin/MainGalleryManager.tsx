import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, GripVertical, Plus, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import MultipleImageUploader from './MultipleImageUploader';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  featured: boolean;
  order: number;
}

const MainGalleryManager = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🚀 [MainGallery] Component mounted, loading images...');
    loadImages();
  }, []);

  // Debug log for images state changes
  useEffect(() => {
    console.log('📊 [MainGallery] Images state changed:', {
      count: images.length,
      images: images.map(img => ({ id: img.id, src: img.src?.substring(0, 50) + '...' }))
    });
  }, [images]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      console.log('[MainGallery] Loading main gallery images from gallery_images table...');

      // Load from gallery_images table first
      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (galleryError) {
        console.warn('[MainGallery] Error loading from gallery_images table:', galleryError);
        // Fallback to settings table
        return await loadImagesFromSettings();
      }

      if (galleryData && galleryData.length > 0) {
        console.log('🔍 [MainGallery] Raw gallery data:', galleryData);

        const galleryImages: GalleryImage[] = galleryData.map((item, index) => {
          const image = {
            id: String(item.id || `img-${index}`),
            src: String(item.image_url || ''),
            alt: String(item.title || 'Gallery Image'),
            featured: Boolean(item.is_featured || false),
            order: item.sort_order || index
          };
          console.log('🖼️ [MainGallery] Processed image:', image);
          return image;
        });

        console.log('✅ [MainGallery] Setting images:', galleryImages);
        setImages(galleryImages);
        console.log('✅ [MainGallery] Loaded images from gallery_images table:', galleryImages.length);
      } else {
        console.log('⚠️ [MainGallery] No images found in gallery_images table, trying settings table...');
        await loadImagesFromSettings();
      }
    } catch (error) {
      console.error('[MainGallery] Error loading gallery:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gallery images',
        variant: 'destructive'
      });
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback function to load from settings table
  const loadImagesFromSettings = async () => {
    try {
      console.log('[MainGallery] Loading from settings table as fallback...');

      const { data, error } = await supabase
        .from('settings')
        .select('value, updated_at')
        .eq('key', 'gallery_images')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[MainGallery] Settings table error:', error);
        setImages([]);
        return;
      }

      if (data?.value) {
        try {
          const parsedData = Array.isArray(data.value) ? data.value : [];
          console.log('[MainGallery] Loaded data from settings:', parsedData);

          const galleryImages: GalleryImage[] = parsedData
            .filter(item =>
              typeof item === 'object' &&
              item !== null &&
              (item.src || item.url) &&
              item.id
            )
            .map((item, index) => ({
              id: String(item.id || `img-${index}`),
              src: String(item.src || item.url || ''),
              alt: String(item.alt || item.title || 'Gallery Image'),
              featured: Boolean(item.featured || item.is_featured || false),
              order: typeof item.order === 'number' ? item.order : index
            }))
            .sort((a, b) => a.order - b.order);

          setImages(galleryImages);
          console.log('[MainGallery] Loaded images from settings:', galleryImages.length);
        } catch (parseError) {
          console.error('[MainGallery] Error parsing settings data:', parseError);
          setImages([]);
        }
      } else {
        console.log('[MainGallery] No gallery data found in settings, starting with empty gallery');
        setImages([]);
      }
    } catch (error) {
      console.error('[MainGallery] Error loading from settings:', error);
      setImages([]);
    }
  };

  const saveImages = async (newImages: GalleryImage[]) => {
    try {
      setIsSaving(true);
      const imageData = newImages
        .filter(img => img.src) // Only include images with URLs
        .sort((a, b) => a.order - b.order)
        .map(img => ({
          id: img.id,
          src: img.src,
          alt: img.alt,
          featured: img.featured,
          order: img.order
        }));

      console.log('[MainGallery] Saving gallery images to gallery_images table:', imageData);

      // First, clear existing gallery images
      const { error: deleteError } = await supabase
        .from('gallery_images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) {
        console.warn('[MainGallery] Error clearing existing gallery images:', deleteError);
      }

      // Insert new images to gallery_images table
      if (imageData.length > 0) {
        const galleryRecords = imageData.map((image, index) => ({
          id: crypto.randomUUID(),
          title: image.alt || `Gallery Image ${index + 1}`,
          description: image.alt || '',
          image_url: image.src,
          category: 'main',
          sort_order: index + 1,
          is_active: true,
          created_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('gallery_images')
          .insert(galleryRecords);

        if (insertError) {
          console.error('[MainGallery] Error inserting gallery images:', insertError);
          throw insertError;
        }

        console.log('[MainGallery] Successfully saved to gallery_images table');
      }

      // Also save to settings table for backward compatibility
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          key: 'gallery_images',
          value: imageData,
          updated_at: new Date().toISOString()
        });

      if (settingsError) {
        console.warn('[MainGallery] Error saving to settings table:', settingsError);
      }

      console.log('[MainGallery] Gallery images saved successfully');
      toast({
        title: 'Success',
        description: 'Gallery images saved successfully'
      });
    } catch (error) {
      console.error('[MainGallery] Error saving gallery:', error);
      toast({
        title: 'Error',
        description: 'Failed to save gallery images',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingIndex(index);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const newImages = [...images];
      newImages[index] = {
        ...newImages[index],
        src: publicUrl
      };

      setImages(newImages);
      await saveImages(newImages);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const addImageSlot = () => {
    const newImage: GalleryImage = {
      id: Date.now().toString(),
      src: '',
      alt: 'Gallery Image',
      featured: false,
      order: images.length
    };
    setImages([...images, newImage]);
  };

  const removeImage = async (index: number) => {
    try {
      const newImages = images.filter((_, i) => i !== index);
      // Update order for remaining images
      const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
      
      setImages(reorderedImages);
      await saveImages(reorderedImages);
      
      toast({
        title: 'Success',
        description: 'Image removed successfully'
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image',
        variant: 'destructive'
      });
    }
  };

  const updateImageAlt = (index: number, alt: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], alt };
    setImages(newImages);
  };

  const toggleFeatured = (index: number) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], featured: !newImages[index].featured };
    setImages(newImages);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const newImages = Array.from(images);
    const [reorderedItem] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const reorderedImages = newImages.map((img, index) => ({ ...img, order: index }));
    
    setImages(reorderedImages);
    await saveImages(reorderedImages);
  };

  const handleMultipleUpload = async (imagesWithLabels: Array<{url: string, label: string}>) => {
    try {
      const newImages = imagesWithLabels.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        src: item.url,
        alt: item.label || 'Gallery Image',
        featured: false,
        order: images.length + index
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      await saveImages(updatedImages);

      toast({
        title: 'Success',
        description: `${newImages.length} images uploaded successfully`
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive'
      });
    }
  };

  // Function to sync existing storage images to gallery_images table
  const syncStorageToDatabase = async () => {
    try {
      console.log('[MainGallery] Syncing storage images to database...');

      // Get all images from gallery storage bucket
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('gallery')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        console.error('Error listing storage files:', storageError);
        return;
      }

      if (!storageFiles || storageFiles.length === 0) {
        console.log('No files found in gallery storage');
        return;
      }

      // Create gallery records for storage files
      const galleryRecords = storageFiles.map((file, index) => {
        const { data } = supabase.storage.from('gallery').getPublicUrl(file.name);
        return {
          id: crypto.randomUUID(),
          title: file.name.split('.')[0] || `Gallery Image ${index + 1}`,
          description: `Uploaded image: ${file.name}`,
          image_url: data.publicUrl,
          category: 'main',
          sort_order: index + 1,
          is_active: true,
          created_at: new Date().toISOString()
        };
      });

      // Clear existing and insert new records
      const { error: deleteError } = await supabase
        .from('gallery_images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.warn('Error clearing existing gallery images:', deleteError);
      }

      const { error: insertError } = await supabase
        .from('gallery_images')
        .insert(galleryRecords);

      if (insertError) {
        console.error('Error inserting synced gallery images:', insertError);
        throw insertError;
      }

      console.log(`[MainGallery] Successfully synced ${galleryRecords.length} images to database`);

      // Reload images to reflect changes
      await loadImages();

      toast({
        title: 'Sync Complete',
        description: `${galleryRecords.length} images synced from storage to database`
      });

    } catch (error) {
      console.error('Error syncing storage to database:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync storage images to database',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento galleria principale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-teal-800">🖼️ Gestione Galleria Principale</h2>
            <p className="text-gray-600">Gestisci le immagini che appaiono nella sezione "La Nostra Galleria" del sito web</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadImages} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Ricarica
            </Button>
            <div className="text-sm text-gray-500">
              <p>Immagini: {images.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Galleria Principale
            <div className="flex gap-2">
              <Button onClick={syncStorageToDatabase} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Storage
              </Button>
              <Button onClick={addImageSlot} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Immagine
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Multiple Image Upload Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Caricamento Multiplo</h3>
            <MultipleImageUploader
              onImagesSelected={(imageUrls) => {
                // Handle simple image URLs (fallback)
                const imagesWithLabels = imageUrls.map(url => ({ url, label: '' }));
                handleMultipleUpload(imagesWithLabels);
              }}
              onImagesWithLabelsSelected={handleMultipleUpload}
              bucketName="gallery"
              folderPath=""
              enableLabels={true}
            />
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">Nessuna immagine nella galleria. Aggiungi alcune immagini per iniziare.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="gallery-images">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {images.map((image, index) => (
                      <Draggable key={image.id} draggableId={image.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg p-4 bg-white ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps} className="cursor-move">
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              
                              <div className="flex-shrink-0">
                                {image.src ? (
                                  <img 
                                    src={image.src} 
                                    alt={image.alt}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-2">
                                <Input
                                  value={image.alt}
                                  onChange={(e) => updateImageAlt(index, e.target.value)}
                                  placeholder="Descrizione immagine..."
                                  className="text-sm"
                                />
                                
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={image.featured}
                                      onChange={() => toggleFeatured(index)}
                                      className="rounded"
                                    />
                                    In evidenza
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(index, file);
                                  }}
                                  className="hidden"
                                  id={`upload-${index}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById(`upload-${index}`)?.click()}
                                  disabled={uploadingIndex === index}
                                >
                                  {uploadingIndex === index ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {images.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => saveImages(images)}
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva Modifiche
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainGalleryManager;
