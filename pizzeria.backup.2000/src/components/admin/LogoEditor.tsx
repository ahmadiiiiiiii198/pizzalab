
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, RefreshCw, Loader2 } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { useLogoSettings } from "@/hooks/use-settings";

const LogoEditor = () => {
  const [logoSettings, updateLogoSettings, isLoading] = useLogoSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image loading state when logo URL changes
  useEffect(() => {
    if (logoSettings?.logoUrl) {
      console.log('🔄 Logo URL changed, resetting image state:', logoSettings.logoUrl);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [logoSettings?.logoUrl]);

  // Separate timeout effect that doesn't depend on imageLoaded to avoid loops
  useEffect(() => {
    if (logoSettings?.logoUrl && !imageLoaded && !imageError) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Image loading timeout after 10 seconds:', logoSettings.logoUrl);
        setImageError(true);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [logoSettings?.logoUrl, imageLoaded, imageError]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const success = await updateLogoSettings(logoSettings);

      if (success) {
        toast({
          title: '🍕 Logo Aggiornato!',
          description: 'Il logo della pizzeria è stato aggiornato con successo.',
        });
      } else {
        toast({
          title: '⚠️ Salvato Localmente',
          description: 'Logo salvato localmente. Si sincronizzerà quando la connessione sarà ripristinata.',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Errore',
        description: 'Impossibile salvare il logo. Riprova.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageUploaded = (imageUrl: string) => {
    console.log('📤 LogoEditor: Received new image URL:', imageUrl);
    const newSettings = { ...logoSettings, logoUrl: imageUrl };
    updateLogoSettings(newSettings);
    // Don't manually reset image states here - let the useEffect handle it
  };

  const defaultSettings = {
    logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
    altText: "Pizzeria Regina 2000 Torino Logo",
  };

  const resetToDefault = async () => {
    try {
      setIsSaving(true);
      const success = await updateLogoSettings(defaultSettings);

      if (success) {
        toast({
          title: "🔄 Logo Ripristinato",
          description: "Il logo è stato ripristinato al default della pizzeria",
        });
        setImageLoaded(false);
        setImageError(false);
      } else {
        toast({
          title: "⚠️ Ripristinato Localmente",
          description: "Logo ripristinato localmente. Si sincronizzerà quando la connessione sarà ripristinata.",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile ripristinare il logo. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <p className="text-sm text-gray-600">Caricamento impostazioni logo...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestione Logo</h3>
          <p className="text-sm text-gray-600">Carica e modifica il logo della pizzeria (immagine sinistra)</p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          variant="default"
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} />
              Salva Modifiche
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo della Pizzeria</CardTitle>
          <CardDescription>
            Carica e personalizza il logo di Pizzeria Regina 2000
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-md p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
              {!imageLoaded && !imageError && logoSettings?.logoUrl && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                  <p className="text-sm text-gray-500">Caricamento logo...</p>
                </div>
              )}

              {logoSettings?.logoUrl && !imageError && (
                <div className="bg-slate-100 p-3 rounded-full">
                  <img
                    src={logoSettings.logoUrl}
                    alt={logoSettings.altText || "Logo Pizzeria"}
                    className={`h-32 w-32 object-contain transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={(e) => {
                      console.log('✅ Logo loaded successfully:', logoSettings.logoUrl);
                      console.log('✅ Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
                      setImageLoaded(true);
                      setImageError(false);
                    }}
                    onError={(e) => {
                      console.error('❌ Logo failed to load:', logoSettings.logoUrl);
                      console.error('❌ Error event:', e);
                      setImageError(true);
                      setImageLoaded(false);
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {imageError && (
                <div className="bg-red-50 p-6 rounded-lg text-center">
                  <div className="text-red-500 text-4xl mb-2">🍕</div>
                  <p className="text-sm text-red-600">Errore nel caricamento del logo</p>
                  <p className="text-xs text-gray-500 mt-1">Prova a caricare una nuova immagine</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {imageError ? 'Logo non disponibile' : 'Logo Attuale'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL Logo (Alternativa)</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoSettings.logoUrl || ''}
                  onChange={(e) => updateLogoSettings({ ...logoSettings, logoUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Inserisci l'URL diretto di un'immagine logo già caricata online
                </p>
              </div>

              <div className="space-y-2">
                <Label>Oppure Carica Nuovo Logo</Label>
                <ImageUploader
                  currentImage={logoSettings?.logoUrl}
                  onImageSelected={handleImageUploaded}
                  buttonLabel="Scegli Immagine Logo"
                  bucketName="uploads"
                  folderPath="logos"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Raccomandato: Immagine quadrata, almeno 200x200 pixel, PNG o SVG con sfondo trasparente
                </p>
                <p className="text-xs text-orange-600">
                  ⚠️ Se il caricamento fallisce, usa il campo URL sopra come alternativa
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-alt-text">Testo Alternativo</Label>
              <Input
                id="logo-alt-text"
                value={logoSettings?.altText || ''}
                onChange={(e) => updateLogoSettings({ ...logoSettings, altText: e.target.value })}
                placeholder="Descrivi il logo per screen reader e SEO"
              />
              <p className="text-xs text-muted-foreground">
                Aiuta l'accessibilità e il SEO descrivendo il contenuto del logo
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefault}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ripristinando...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Ripristina Default
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salva Modifiche
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LogoEditor;
