import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Edit, Loader2, Image, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ImageUploader from './ImageUploader';

interface ContentSection {
  id: string;
  section_key: string;
  section_name: string;
  title: string;
  content: string;
  content_type: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  metadata: any;
}

const FlegreaSectionManager = () => {
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempImageUrls, setTempImageUrls] = useState<{[key: string]: string}>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadContentSections();
  }, []);

  const loadContentSections = async () => {
    try {
      setIsLoading(true);
      console.log('Loading content sections...');

      const { data, error } = await supabase
        .from('content_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading content sections:', error);
        toast({
          title: "Error",
          description: "Failed to load content sections",
          variant: "destructive",
        });
      } else {
        console.log('Loaded content sections:', data);
        setContentSections(data || []);
        // Clear temporary URLs when fresh data is loaded
        setTempImageUrls({});
      }
    } catch (error) {
      console.error('Error loading content sections:', error);
      toast({
        title: "Error",
        description: "Failed to load content sections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<ContentSection>) => {
    try {
      setIsSaving(true);
      console.log('Updating section:', sectionId, 'with updates:', updates);

      const { data, error } = await supabase
        .from('content_sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', sectionId)
        .select();

      if (error) {
        console.error('Error updating section:', error);
        toast({
          title: "Error",
          description: `Failed to update section: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Section updated successfully:', data);
        toast({
          title: "Success",
          description: "Image updated successfully",
        });
        // Force reload content sections to get fresh data
        console.log('🔄 Forcing content reload...');
        await loadContentSections();
        setEditingSection(null);

        // Force a small delay to ensure state updates
        setTimeout(() => {
          console.log('🔄 Post-update state refresh complete');
          setRefreshKey(prev => prev + 1);
        }, 100);
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUrlUpdate = useCallback(async (sectionId: string, imageUrl: string) => {
    console.log('🔄 handleImageUrlUpdate called with:', { sectionId, imageUrl });

    if (!imageUrl || !sectionId) {
      console.error('❌ Missing imageUrl or sectionId:', { imageUrl, sectionId });
      return;
    }

    if (!imageUrl.startsWith('http')) {
      console.error('❌ Invalid image URL format:', imageUrl);
      return;
    }

    console.log('✅ Calling updateSection...');
    try {
      await updateSection(sectionId, { image_url: imageUrl });
      console.log('✅ updateSection completed successfully');
    } catch (error) {
      console.error('❌ Error in updateSection:', error);
    }
  }, [updateSection]);

  // Direct callback for image uploads
  const handleImageUpload = useCallback((sectionId: string, imageUrl: string) => {
    console.log('🖼️ Direct image upload callback for section:', sectionId, 'with URL:', imageUrl);
    console.log('🖼️ Current section data before update:', contentSections.find(s => s.id === sectionId));
    handleImageUrlUpdate(sectionId, imageUrl);
  }, [handleImageUrlUpdate, contentSections]);

  // Test function to verify callback works
  const testImageUpdate = useCallback((sectionId: string) => {
    const testUrl = 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    console.log('🧪 Testing image update for section:', sectionId);
    handleImageUpload(sectionId, testUrl);
  }, [handleImageUpload]);

  const handleTextUpdate = (sectionId: string, field: string, value: string) => {
    const section = contentSections.find(s => s.id === sectionId);
    if (!section) return;

    if (field === 'title' || field === 'content') {
      updateSection(sectionId, { [field]: value });
    } else {
      // Update metadata
      const newMetadata = { ...section.metadata, [field]: value };
      updateSection(sectionId, { metadata: newMetadata });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Flegrea Section...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const mainSection = contentSections.find(section => section.section_key === 'flegrea_section');
  const imagesSections = contentSections.filter(section => section.section_key.startsWith('flegrea_image_'));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Flegrea Pizza Section Manager
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadContentSections}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Manage the content and images for the Flegrea pizza section that replaced the video section.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Section */}
      {mainSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Main Content
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection(editingSection === mainSection.id ? null : mainSection.id)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {editingSection === mainSection.id ? 'Cancel' : 'Edit'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              {editingSection === mainSection.id ? (
                <Input
                  value={mainSection.title}
                  onChange={(e) => handleTextUpdate(mainSection.id, 'title', e.target.value)}
                  placeholder="Section title"
                />
              ) : (
                <p className="text-gray-700">{mainSection.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Main Content</label>
              {editingSection === mainSection.id ? (
                <Textarea
                  value={mainSection.content}
                  onChange={(e) => handleTextUpdate(mainSection.id, 'content', e.target.value)}
                  placeholder="Main content text"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">{mainSection.content}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              {editingSection === mainSection.id ? (
                <Textarea
                  value={mainSection.metadata?.subtitle || ''}
                  onChange={(e) => handleTextUpdate(mainSection.id, 'subtitle', e.target.value)}
                  placeholder="Subtitle text"
                  rows={2}
                />
              ) : (
                <p className="text-gray-700">{mainSection.metadata?.subtitle}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description 2</label>
              {editingSection === mainSection.id ? (
                <Textarea
                  value={mainSection.metadata?.description_2 || ''}
                  onChange={(e) => handleTextUpdate(mainSection.id, 'description_2', e.target.value)}
                  placeholder="Second description text"
                  rows={2}
                />
              ) : (
                <p className="text-gray-700">{mainSection.metadata?.description_2}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Button Text</label>
              {editingSection === mainSection.id ? (
                <Input
                  value={mainSection.metadata?.button_text || ''}
                  onChange={(e) => handleTextUpdate(mainSection.id, 'button_text', e.target.value)}
                  placeholder="Button text"
                />
              ) : (
                <p className="text-gray-700">{mainSection.metadata?.button_text}</p>
              )}
            </div>

            {editingSection === mainSection.id && (
              <Button
                onClick={() => setEditingSection(null)}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Images Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {imagesSections.map((section) => (
          <Card key={`${section.id}-${section.image_url}-${section.updated_at}`}>
            <CardHeader>
              <CardTitle className="text-lg">{section.section_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <img
                  key={`img-${section.id}-${section.image_url}-${refreshKey}`}
                  src={section.image_url}
                  alt={section.metadata?.alt_text || section.section_name}
                  className="w-full h-32 object-cover rounded-lg"
                  onLoad={() => console.log('✅ Image loaded:', section.image_url)}
                  onError={(e) => {
                    console.error('❌ Failed to load image:', section.image_url);
                    const target = e.target as HTMLImageElement;
                    target.style.backgroundColor = '#f3f4f6';
                    target.style.display = 'flex';
                    target.style.alignItems = 'center';
                    target.style.justifyContent = 'center';
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testImageUpdate(section.id)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  disabled={isSaving}
                >
                  Test
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <ImageUploader
                  currentImage={section.image_url}
                  onImageSelected={(imageUrl) => handleImageUpload(section.id, imageUrl)}
                  buttonLabel="Upload New Image"
                  bucketName="gallery"
                  folderPath="flegrea-section"
                  className="w-full"
                />
              </div>


            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FlegreaSectionManager;
