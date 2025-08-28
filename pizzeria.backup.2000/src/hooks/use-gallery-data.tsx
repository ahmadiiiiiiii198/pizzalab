
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage, GalleryContent } from '@/types/gallery';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function useGalleryData() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Default gallery content
  const [galleryContent, setGalleryContent] = useState<GalleryContent>({
    heading: 'La Nostra Galleria',
    subheading: "",
    backgroundImage: ""
  });

  // Function to load gallery data
  const loadGalleryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to load gallery content settings
      const { data: contentData, error: contentError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'galleryContent')
        .single();
        
      if (!contentError && contentData?.value) {
        // Type-safe conversion of JSON data
        const rawContent = contentData.value as unknown;
        if (
          typeof rawContent === 'object' &&
          rawContent !== null &&
          'heading' in rawContent &&
          'subheading' in rawContent
        ) {
          setGalleryContent({
            heading: String(rawContent.heading || 'Gallery'),
            subheading: String(rawContent.subheading || ""),
            backgroundImage: String((rawContent as any).backgroundImage || "")
          });
        }
      }
      
      // Load gallery images from gallery_images table
      console.log('🔍 [useGalleryData] Loading gallery images from gallery_images table...');
      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      console.log('🔍 [useGalleryData] Raw gallery data:', galleryData);
      console.log('🔍 [useGalleryData] Gallery error:', galleryError);

      if (galleryError) {
        console.warn('❌ [useGalleryData] Error loading from gallery_images table:', galleryError);
        throw galleryError;
      }

      if (galleryData && galleryData.length > 0) {
        const validImages = galleryData.map(item => {
          const image = {
            id: String(item.id || ''),
            src: String(item.image_url || ''),
            alt: String(item.title || 'Gallery Image'),
            featured: Boolean(item.is_active || false)
          };
          console.log('🖼️ [useGalleryData] Processed image:', image);
          return image;
        });

        console.log('✅ [useGalleryData] Setting images:', validImages);
        setImages(validImages);
        setLastUpdated(new Date());
        console.log('✅ [useGalleryData] Loaded gallery images from gallery_images table:', validImages.length);
      } else {
        // No gallery images found in database
        console.log('⚠️ [useGalleryData] No gallery images found in database');
        setImages([]);
      }
    } catch (err) {
      console.error('Error loading gallery data:', err);
      setError('Failed to load gallery images. Please try again later.');
      
      // Try to load from localStorage as last resort
      try {
        const localData = localStorage.getItem('galleryImages');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setImages(parsedData);
            console.log('Loaded gallery images from localStorage:', parsedData.length);
          }
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage bucket changes
  useEffect(() => {
    loadGalleryData();
    
    // Listen for localStorage update events (for cross-tab sync)
    const handleStorageUpdate = (event: StorageEvent | CustomEvent) => {
      if (
        (event as StorageEvent).key === 'galleryImages' || 
        ((event as CustomEvent).detail && (event as CustomEvent).detail.key === 'galleryImages')
      ) {
        console.log('Gallery: Detected gallery update, refreshing data');
        loadGalleryData();
      }
    };

    // Listen for both storage events and custom events
    window.addEventListener('storage', handleStorageUpdate as EventListener);
    window.addEventListener('localStorageUpdated', handleStorageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate as EventListener);
      window.removeEventListener('localStorageUpdated', handleStorageUpdate as EventListener);
    };
  }, [loadGalleryData]);

  // Function to manually refresh gallery data
  const refreshGalleryData = useCallback(() => {
    toast({
      title: 'Refreshing gallery',
      description: 'Loading the latest images...',
    });

    loadGalleryData();
  }, [loadGalleryData]);

  return {
    galleryContent,
    images,
    isLoading,
    error,
    lastUpdated,
    refreshGalleryData
  };
}
