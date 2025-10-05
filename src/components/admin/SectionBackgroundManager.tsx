import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, Trash2, Eye, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateImageFile, createSafeFilename } from '@/utils/fileValidation';

interface SectionConfig {
  key: string;
  name: string;
  description: string;
  currentImage?: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'heroContent',
    name: 'Hero Section',
    description: 'Main banner/hero section background'
  },
  {
    key: 'aboutContent',
    name: 'About Section (Main)',
    description: 'Main about section background'
  },
  {
    key: 'chiSiamoContent',
    name: 'Chi Siamo Section',
    description: 'About us (Chi Siamo) section background'
  },
  {
    key: 'weOfferContent',
    name: 'We Offer Section',
    description: 'Services and offerings section background'
  },
  {
    key: 'whyChooseUsContent',
    name: 'Why Choose Us Section',
    description: 'Why choose us section background'
  },
  {
    key: 'productsContent',
    name: 'Products Section',
    description: 'Menu/products listing section background'
  },
  {
    key: 'galleryContent',
    name: 'Gallery Section',
    description: 'Image gallery section background'
  },
  {
    key: 'contactContent',
    name: 'Contact Section',
    description: 'Contact information section background'
  },
  {
    key: 'youtubeSectionContent',
    name: 'YouTube Section',
    description: 'YouTube videos section background'
  }
];

const SectionBackgroundManager: React.FC = () => {
  const [sections, setSections] = useState<SectionConfig[]>(SECTIONS);
  const [loading, setLoading] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  useEffect(() => {
    loadCurrentBackgrounds();
  }, []);

  const loadCurrentBackgrounds = async () => {
    try {
      setLoading(true);
      const sectionKeys = sections.map(s => s.key);
      
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', sectionKeys);

      if (error) throw error;

      const updatedSections = sections.map(section => {
        const setting = data?.find(d => d.key === section.key);
        const backgroundImage = setting?.value?.backgroundImage || '';

        console.log(`🔍 [SectionBackgroundManager] Loading ${section.key}:`, {
          setting: setting?.value,
          backgroundImage,
          hasImage: !!backgroundImage
        });

        return {
          ...section,
          currentImage: backgroundImage
        };
      });

      setSections(updatedSections);
    } catch (error) {
      console.error('Error loading backgrounds:', error);
      toast.error('Failed to load current backgrounds');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, sectionKey: string) => {
    try {
      console.log('🚀 Starting file upload for section:', sectionKey);
      console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });

      setUploadingSection(sectionKey);

      // Validate file using utility function
      const validation = validateImageFile(file, {
        maxSizeBytes: 50 * 1024 * 1024, // 50MB limit
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file');
      }

      console.log(`🔧 Using MIME type: ${validation.correctedMimeType} (original: ${file.type})`);

      // Create safe filename
      const fileName = createSafeFilename(file.name, 'section-bg');
      const filePath = `section-backgrounds/${fileName}`;

      console.log('📤 Uploading to path:', filePath);

      // Create a new File object with corrected MIME type to ensure proper upload
      const correctedFile = new File([file], file.name, {
        type: validation.correctedMimeType,
        lastModified: file.lastModified
      });

      console.log(`📝 [SectionBackgroundManager] Original file type: ${file.type}, Corrected: ${validation.correctedMimeType}`);

      // Upload to Supabase Storage with corrected content type
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, correctedFile, {
          contentType: validation.correctedMimeType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);

        // Provide more specific error messages
        if (uploadError.message?.includes('mime type')) {
          throw new Error(`File type not supported. Please ensure you're uploading a valid image file. Detected type: ${file.type}`);
        } else if (uploadError.message?.includes('policy')) {
          throw new Error('Upload permission denied. Please check storage policies.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);

      // Test if the URL is accessible
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log('🔍 URL accessibility test:', {
          url: publicUrl,
          status: testResponse.status,
          ok: testResponse.ok,
          headers: Object.fromEntries(testResponse.headers.entries())
        });
      } catch (testError) {
        console.error('❌ URL accessibility test failed:', testError);
      }

      // Update section setting
      await updateSectionBackground(sectionKey, publicUrl);

      // Force reload backgrounds to ensure UI is updated
      await loadCurrentBackgrounds();

      // Force component re-render
      setRefreshKey(Date.now());

      console.log('✅ Background updated successfully');
      toast.success('Background image uploaded successfully!');

    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      const errorMessage = error.message || 'Failed to upload background image';
      toast.error(errorMessage);
    } finally {
      setUploadingSection(null);
    }
  };

  const updateSectionBackground = async (sectionKey: string, imageUrl: string) => {
    try {
      // Get current setting
      const { data: currentSetting, error: fetchError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', sectionKey)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      // Update with new background image
      const updatedValue = {
        ...(currentSetting?.value || {}),
        backgroundImage: imageUrl
      };

      const { error: updateError } = await supabase
        .from('settings')
        .upsert({
          key: sectionKey,
          value: updatedValue
        });

      if (updateError) throw updateError;

      // Update local state
      console.log(`🔄 [SectionBackgroundManager] Updating local state for ${sectionKey} with image:`, imageUrl);
      setSections(prev => {
        const updated = prev.map(section =>
          section.key === sectionKey
            ? { ...section, currentImage: imageUrl }
            : section
        );
        console.log(`✅ [SectionBackgroundManager] Local state updated:`, updated.find(s => s.key === sectionKey));
        return updated;
      });

    } catch (error) {
      console.error('Error updating section background:', error);
      throw error;
    }
  };

  const removeSectionBackground = async (sectionKey: string) => {
    try {
      await updateSectionBackground(sectionKey, '');
      toast.success('Background image removed successfully!');
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background image');
    }
  };

  const previewSection = (imageUrl: string) => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  const fixExistingFiles = async () => {
    try {
      console.log('🔧 Fixing existing files with wrong MIME types...');
      setLoading(true);

      // Get files with wrong MIME types
      const { data: files, error: listError } = await supabase.storage
        .from('uploads')
        .list('section-backgrounds');

      if (listError) {
        console.error('❌ Failed to list files:', listError);
        toast.error(`Failed to list files: ${listError.message}`);
        return;
      }

      let fixedCount = 0;

      for (const file of files || []) {
        try {
          // Download the file
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('uploads')
            .download(`section-backgrounds/${file.name}`);

          if (downloadError) {
            console.error(`❌ Failed to download ${file.name}:`, downloadError);
            continue;
          }

          // Determine correct MIME type based on file extension
          const extension = file.name.split('.').pop()?.toLowerCase();
          const mimeTypeMap: { [key: string]: string } = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
          };

          const correctMimeType = mimeTypeMap[extension || ''] || 'image/jpeg';

          // Create new file with correct MIME type
          const correctedFile = new File([fileData], file.name, {
            type: correctMimeType
          });

          // Re-upload with correct MIME type
          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(`section-backgrounds/${file.name}`, correctedFile, {
              contentType: correctMimeType,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error(`❌ Failed to re-upload ${file.name}:`, uploadError);
          } else {
            console.log(`✅ Fixed MIME type for ${file.name}: ${correctMimeType}`);
            fixedCount++;
          }

        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
        }
      }

      toast.success(`Fixed ${fixedCount} files with correct MIME types`);

      // Reload backgrounds after fixing
      await loadCurrentBackgrounds();
      setRefreshKey(Date.now());

    } catch (error) {
      console.error('❌ Fix files failed:', error);
      toast.error(`Fix failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Section Background Manager</h2>
          <p className="text-gray-600">Manage background images for all website sections</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fixExistingFiles}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            🔧 Fix MIME Types
          </Button>
          <Button
            onClick={loadCurrentBackgrounds}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <SectionCard
                key={`${section.key}-${refreshKey}`}
                section={section}
                onFileUpload={handleFileUpload}
                onRemoveBackground={removeSectionBackground}
                onPreview={previewSection}
                isUploading={uploadingSection === section.key}
                refreshKey={refreshKey}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {sections.map((section) => (
            <SectionListItem
              key={`${section.key}-${refreshKey}`}
              section={section}
              onFileUpload={handleFileUpload}
              onRemoveBackground={removeSectionBackground}
              onPreview={previewSection}
              isUploading={uploadingSection === section.key}
              refreshKey={refreshKey}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SectionCardProps {
  section: SectionConfig;
  onFileUpload: (file: File, sectionKey: string) => void;
  onRemoveBackground: (sectionKey: string) => void;
  onPreview: (imageUrl: string) => void;
  isUploading: boolean;
  refreshKey: number;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  onFileUpload,
  onRemoveBackground,
  onPreview,
  isUploading,
  refreshKey
}) => {
  console.log(`🖼️ [SectionCard] Rendering ${section.key} with currentImage:`, section.currentImage);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed for section:', section.key);
    const file = event.target.files?.[0];
    console.log('📄 Selected file:', file);

    if (file) {
      console.log('✅ File selected, calling onFileUpload');
      onFileUpload(file, section.key);
    } else {
      console.log('⚠️ No file selected');
    }

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-lg">{section.name}</CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Image Preview */}
        {section.currentImage ? (
          <div className="relative">
            {/* Placeholder for failed images */}
            <div className="image-placeholder hidden w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Image failed to load</p>
                <p className="text-xs text-gray-400">Click refresh to retry</p>
              </div>
            </div>
            <img
              src={`${section.currentImage}?t=${refreshKey}`}
              alt={`${section.name} background`}
              className="w-full h-32 object-cover rounded-lg border"
              onLoad={() => console.log(`✅ [SectionCard] Image loaded for ${section.key}:`, section.currentImage)}
              onError={(e) => {
                console.error(`❌ [SectionCard] Image failed to load for ${section.key}:`, section.currentImage);

                // Prevent infinite loop by checking if we already tried to reload
                if (!e.currentTarget.dataset.retried && section.currentImage) {
                  e.currentTarget.dataset.retried = 'true';

                  // Try once more with a different cache buster
                  setTimeout(() => {
                    if (e.currentTarget && section.currentImage) {
                      e.currentTarget.src = `${section.currentImage}?retry=${Date.now()}`;
                    }
                  }, 1000);
                } else {
                  // Show placeholder on final failure
                  console.log(`🚫 [SectionCard] Giving up on ${section.key}, showing placeholder`);
                  if (e.currentTarget) {
                    e.currentTarget.style.display = 'none';
                  }
                  const placeholder = e.currentTarget?.parentElement?.querySelector('.image-placeholder');
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'flex';
                  }
                }
              }}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPreview(section.currentImage!)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveBackground(section.key)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Image className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No background image</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id={`upload-${section.key}`}
          />
          <Label
            htmlFor={`upload-${section.key}`}
            className={`
              cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium
              ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none
              disabled:opacity-50 h-10 px-4 py-2 w-full
              ${section.currentImage
                ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : section.currentImage ? 'Change Image' : 'Upload Image'}
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

interface SectionListItemProps extends SectionCardProps {}

const SectionListItem: React.FC<SectionListItemProps> = ({
  section,
  onFileUpload,
  onRemoveBackground,
  onPreview,
  isUploading,
  refreshKey
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed for section (list view):', section.key);
    const file = event.target.files?.[0];
    console.log('📄 Selected file:', file);

    if (file) {
      console.log('✅ File selected, calling onFileUpload');
      onFileUpload(file, section.key);
    } else {
      console.log('⚠️ No file selected');
    }

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {section.currentImage ? (
              <img
                src={`${section.currentImage}?t=${refreshKey}`}
                alt={`${section.name} background`}
                className="w-16 h-16 object-cover rounded-lg border"
                onError={(e) => {
                  console.error(`❌ [SectionListItem] Image failed to load for ${section.key}:`, section.currentImage);
                  if (e.currentTarget) {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            ) : (
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Image className="h-6 w-6 text-gray-400" />
              </div>
            )}
            
            <div>
              <h3 className="font-semibold">{section.name}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {section.currentImage && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreview(section.currentImage!)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemoveBackground(section.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
                id={`upload-list-${section.key}`}
              />
              <Label
                htmlFor={`upload-list-${section.key}`}
                className={`
                  cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium
                  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none
                  disabled:opacity-50 h-10 px-4 py-2
                  ${section.currentImage
                    ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isUploading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Uploading...' : section.currentImage ? 'Change' : 'Upload'}
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionBackgroundManager;
