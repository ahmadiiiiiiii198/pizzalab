import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Pizza,
  Upload,
  Save,
  RefreshCw,
  Eye,
  Edit,
  Image as ImageIcon,
  Type,
  Star,
  AlertCircle,
  Loader2,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface OfferItem {
  id: number;
  title: string;
  description: string;
  image: string;
  badge: string;
}

interface WeOfferContent {
  heading: string;
  subheading: string;
  offers: OfferItem[];
}

const WeOfferManager = () => {
  const [content, setContent] = useState<WeOfferContent>({
    heading: "Offriamo",
    subheading: "Scopri le nostre autentiche specialità italiane",
    offers: [
      {
        id: 1,
        title: "Pizza Metro Finchi 5 Gusti",
        description: "Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un'unica creazione straordinaria. Perfetta da condividere con famiglia e amici.",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "Specialità"
      },
      {
        id: 2,
        title: "Usiamo la Farina 5 Stagioni Gusti, Alta Qualità",
        description: "Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto per pizza leggero, digeribile e incredibilmente saporito.",
        image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "Qualità"
      },
      {
        id: 3,
        title: "Creiamo Tutti i Tipi di Pizza Italiana di Alta Qualità",
        description: "Dalla classica Margherita alle specialità gourmet, prepariamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un'autentica esperienza italiana.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "Autentica"
      }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Initialize We Offer content in database if it doesn't exist
      const { initializeWeOfferContent } = await import('@/utils/initializeWeOfferContent');
      const loadedContent = await initializeWeOfferContent();

      // Ensure loaded content has proper structure
      if (loadedContent && loadedContent.offers && Array.isArray(loadedContent.offers)) {
        setContent(loadedContent);
        console.log('✅ [WeOfferManager] Content loaded successfully');
      } else {
        console.warn('⚠️ [WeOfferManager] Loaded content has invalid structure, using default');
        // Keep the default content if loaded content is invalid
      }
    } catch (error) {
      console.error('❌ [WeOfferManager] Failed to load content:', error);
      toast.error('Failed to load We Offer content');
      // Keep the default content on error
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    try {
      setLoading(true);
      console.log('🔄 [WeOfferManager] Starting save process...');
      console.log('📄 [WeOfferManager] Content to save:', content);

      // Validate content structure
      if (!content || !content.offers || !Array.isArray(content.offers)) {
        throw new Error('Invalid content structure');
      }

      // Ensure content is JSON serializable
      const serializedContent = JSON.parse(JSON.stringify(content));
      console.log('🔄 [WeOfferManager] Serialized content:', serializedContent);

      const { settingsService } = await import('@/services/settingsService');
      await settingsService.initialize();

      // Use updateSetting instead of setSetting (which doesn't exist)
      const success = await settingsService.updateSetting('weOfferContent', serializedContent);

      if (!success) {
        throw new Error('Failed to update setting in database');
      }

      // Verify the save by reading it back
      const savedContent = await settingsService.getSetting('weOfferContent', null);
      console.log('🔍 [WeOfferManager] Verification - content after save:', JSON.stringify(savedContent, null, 2));

      toast.success('We Offer content saved successfully!');
      console.log('✅ [WeOfferManager] Content saved successfully');
    } catch (error) {
      console.error('❌ [WeOfferManager] Failed to save content:', error);
      toast.error(`Failed to save We Offer content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOffer = (offerId: number, field: keyof OfferItem, value: string) => {
    setContent(prev => ({
      ...prev,
      offers: (prev.offers || []).map(offer =>
        offer.id === offerId ? { ...offer, [field]: value } : offer
      )
    }));
  };

  const deleteOffer = (offerId: number) => {
    if (content.offers.length <= 1) {
      toast.error('Cannot delete the last offer. At least one offer must remain.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      setContent(prev => ({
        ...prev,
        offers: prev.offers.filter(offer => offer.id !== offerId)
      }));

      // Switch to general tab if we deleted the current tab
      if (activeTab === `offer${offerId}`) {
        setActiveTab('general');
      }

      toast.success('Offer deleted successfully');
    }
  };

  const addNewOffer = () => {
    const newId = Math.max(...content.offers.map(o => o.id), 0) + 1;
    const newOffer: OfferItem = {
      id: newId,
      title: `New Offer ${newId}`,
      description: 'Enter description for this new offer',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      badge: 'New'
    };

    setContent(prev => ({
      ...prev,
      offers: [...prev.offers, newOffer]
    }));

    // Switch to the new offer tab
    setActiveTab(`offer${newId}`);
    toast.success('New offer added successfully');
  };

  const handleImageUpload = async (offerId: number, file: File) => {
    try {
      setLoading(true);

      // File size validation removed - no size limit

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      console.log(`🔄 [WeOfferManager] Uploading image for offer ${offerId}...`);
      console.log(`📁 [WeOfferManager] File details:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `we-offer-${offerId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `we-offer/${fileName}`;

      console.log(`📂 [WeOfferManager] Upload path: uploads/${filePath}`);

      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');

      // First, let's verify the bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      console.log(`🪣 [WeOfferManager] Available buckets:`, buckets?.map(b => b.name));

      if (listError) {
        console.error('❌ [WeOfferManager] Error listing buckets:', listError);
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const uploadsBucket = buckets?.find(b => b.name === 'uploads');
      if (!uploadsBucket) {
        throw new Error('Uploads bucket not found');
      }

      // Upload to Supabase storage using the existing 'uploads' bucket
      console.log(`⬆️ [WeOfferManager] Starting upload...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [WeOfferManager] Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log(`✅ [WeOfferManager] Upload successful:`, uploadData);

      // Get the public URL
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Update the offer with the new image URL
      updateOffer(offerId, 'image', data.publicUrl);

      toast.success('Image uploaded successfully!');
      console.log('✅ [WeOfferManager] Image uploaded successfully:', data.publicUrl);

    } catch (error) {
      console.error('❌ [WeOfferManager] Failed to upload image:', error);
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-pizza-red/10 to-pizza-orange/10 border-pizza-red/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-pizza-red/20 rounded-lg">
              <Pizza className="w-6 h-6 text-pizza-red" />
            </div>
            <span className="text-pizza-dark">We Offer Section Manager</span>
          </CardTitle>
          <CardDescription>
            Manage the "We Offer" section with 3 customizable offers including images and text content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={saveContent}
              disabled={loading}
              className="bg-pizza-red hover:bg-pizza-red/90"
            >
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
            <Button
              onClick={loadContent}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload
            </Button>
            <Button
              onClick={addNewOffer}
              variant="outline"
              disabled={loading}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Offer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full grid-cols-${Math.min(content.offers.length + 1, 6)}`}>
          <TabsTrigger value="general">General</TabsTrigger>
          {content.offers.map((offer) => (
            <TabsTrigger key={offer.id} value={`offer${offer.id}`}>
              Offer {offer.id}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure the main heading and subheading for the We Offer section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="heading">Main Heading</Label>
                <Input
                  id="heading"
                  value={content.heading}
                  onChange={(e) => setContent(prev => ({ ...prev, heading: e.target.value }))}
                  placeholder="We Offer"
                />
              </div>
              <div>
                <Label htmlFor="subheading">Subheading</Label>
                <Input
                  id="subheading"
                  value={content.subheading}
                  onChange={(e) => setContent(prev => ({ ...prev, subheading: e.target.value }))}
                  placeholder="Discover our authentic Italian specialties"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Offer Tabs */}
        {(content.offers || []).map((offer, index) => (
          <TabsContent key={offer.id} value={`offer${offer.id}`}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pizza className="w-5 h-5" />
                    <CardTitle className="flex items-center gap-2">
                      Offer {offer.id}
                      <Badge variant="secondary">{offer.badge}</Badge>
                    </CardTitle>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteOffer(offer.id)}
                    disabled={loading || content.offers.length <= 1}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <CardDescription>
                  Configure content and image for offer {offer.id}
                  {content.offers.length <= 1 && (
                    <span className="block text-amber-600 text-sm mt-1">
                      ⚠️ Cannot delete the last offer
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </Label>
                  
                  {/* Current Image Preview */}
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(offer.id, file);
                      }}
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button variant="outline" size="sm" disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Image URL Input */}
                  <Input
                    value={offer.image}
                    onChange={(e) => updateOffer(offer.id, 'image', e.target.value)}
                    placeholder="Or paste image URL"
                  />
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${offer.id}`}>Title</Label>
                    <Input
                      id={`title-${offer.id}`}
                      value={offer.title}
                      onChange={(e) => updateOffer(offer.id, 'title', e.target.value)}
                      placeholder="Enter offer title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${offer.id}`}>Description</Label>
                    <Textarea
                      id={`description-${offer.id}`}
                      value={offer.description}
                      onChange={(e) => updateOffer(offer.id, 'description', e.target.value)}
                      placeholder="Enter offer description"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`badge-${offer.id}`}>Badge</Label>
                    <Input
                      id={`badge-${offer.id}`}
                      value={offer.badge}
                      onChange={(e) => updateOffer(offer.id, 'badge', e.target.value)}
                      placeholder="Enter badge text"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default WeOfferManager;
