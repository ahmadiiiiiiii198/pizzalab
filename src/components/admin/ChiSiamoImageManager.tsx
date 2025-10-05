import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface ChiSiamoImageContent {
  image: string;
  alt: string;
}

const ChiSiamoImageManager = () => {
  const [content, setContent] = useState<ChiSiamoImageContent>({
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    alt: "PIZZALAB - La nostra storia"
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [imagePreviewLoaded, setImagePreviewLoaded] = useState(false);

  // Load current content from database
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      console.log('📥 [ChiSiamoImageManager] Loading content from database...');

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'chiSiamoImage')
        .single();

      if (!error && data?.value) {
        const loadedContent = data.value as ChiSiamoImageContent;
        console.log('✅ [ChiSiamoImageManager] Content loaded:', loadedContent);
        setContent(loadedContent);
      } else {
        console.log('⚠️ [ChiSiamoImageManager] No content found, using defaults');
      }
    } catch (error) {
      console.error('❌ [ChiSiamoImageManager] Error loading content:', error);
      toast.error('Errore nel caricamento del contenuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChiSiamoImageContent, value: string) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Reset image preview when URL changes
    if (field === 'image') {
      setImagePreviewLoaded(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 [ChiSiamoImageManager] Saving content:', content);

      // Validate required fields
      if (!content.image.trim()) {
        toast.error('Immagine è obbligatoria');
        return;
      }

      if (!content.alt.trim()) {
        toast.error('Testo alternativo è obbligatorio');
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'chiSiamoImage',
          value: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [ChiSiamoImageManager] Save error:', error);
        toast.error('Errore nel salvataggio: ' + error.message);
        return;
      }

      console.log('✅ [ChiSiamoImageManager] Content saved successfully');
      toast.success('Immagine Chi Siamo salvata con successo!');
      setHasChanges(false);

    } catch (error) {
      console.error('❌ [ChiSiamoImageManager] Unexpected error:', error);
      toast.error('Errore imprevisto durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleImagePreviewLoad = () => {
    setImagePreviewLoaded(true);
  };

  const handleImagePreviewError = () => {
    setImagePreviewLoaded(false);
    toast.error('Impossibile caricare l\'anteprima dell\'immagine');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gestione Immagine Chi Siamo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-pizza-orange" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-pizza-orange" />
            <span>Gestione Immagine Chi Siamo</span>
          </CardTitle>
          <CardDescription>
            Gestisci l'immagine che appare sul lato destro della sezione "Chi Siamo" (About Us)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Immagine Chi Siamo *
            </Label>
            <ImageUploader
              currentImage={content.image}
              onImageSelected={(imageUrl) => handleInputChange('image', imageUrl)}
              bucketName="uploads"
              folderPath="chi-siamo"
              buttonLabel="Carica Immagine"
            />
            <p className="text-xs text-gray-500">
              Carica un'immagine per la sezione Chi Siamo. Dimensioni consigliate: 800x600px o superiori.
            </p>
          </div>

          {/* Alt Text Input */}
          <div className="space-y-2">
            <Label htmlFor="alt-text" className="text-sm font-medium">
              Testo Alternativo *
            </Label>
            <Textarea
              id="alt-text"
              placeholder="Descrizione dell'immagine per accessibilità"
              value={content.alt}
              onChange={(e) => handleInputChange('alt', e.target.value)}
              rows={2}
            />
          </div>

          {/* Image Preview */}
          {content.image && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Anteprima</Label>
              <div className="relative rounded-lg overflow-hidden border bg-gray-50 max-w-md">
                {!imagePreviewLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
                <img
                  src={content.image}
                  alt={content.alt}
                  className={`w-full h-auto max-h-64 object-cover transition-opacity duration-300 ${
                    imagePreviewLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={handleImagePreviewLoad}
                  onError={handleImagePreviewError}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadContent}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Ricarica
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {hasChanges && (
                <div className="flex items-center text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Modifiche non salvate
                </div>
              )}
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={hasChanges ? "bg-pizza-orange hover:bg-pizza-orange/90" : "bg-gray-600 hover:bg-gray-700"}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {hasChanges ? "Salva Immagine" : "Salva Stato Corrente"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiSiamoImageManager;
