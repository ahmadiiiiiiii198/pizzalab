import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { useNavbarLogoSettings } from "@/hooks/use-settings";

const NavbarLogoEditor = () => {
  const [navbarLogoSettings, updateNavbarLogoSettings, isLoading] = useNavbarLogoSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image states when logo URL changes
  useEffect(() => {
    if (navbarLogoSettings?.logoUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [navbarLogoSettings?.logoUrl]);

  const handleSaveSettings = async () => {
    if (!navbarLogoSettings) return;

    setIsSaving(true);
    try {
      const success = await updateNavbarLogoSettings(navbarLogoSettings);
      if (success) {
        toast({
          title: "✅ Logo Navbar Salvato",
          description: "Le impostazioni del logo della navbar sono state aggiornate con successo.",
          variant: "default",
        });
      } else {
        throw new Error("Aggiornamento fallito");
      }
    } catch (error) {
      console.error('❌ NavbarLogoEditor: Save failed:', error);
      toast({
        title: "❌ Errore di Salvataggio",
        description: "Non è stato possibile salvare le impostazioni del logo della navbar. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    console.log('📤 NavbarLogoEditor: Received new image URL:', imageUrl);
    const newSettings = { ...navbarLogoSettings, logoUrl: imageUrl };
    updateNavbarLogoSettings(newSettings);
  };

  const resetToDefault = async () => {
    const defaultSettings = {
      logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
      altText: "Pizzeria Regina 2000 Navbar Logo",
      showLogo: true,
      logoSize: "medium" as "small" | "medium" | "large",
    };

    setIsSaving(true);
    try {
      const success = await updateNavbarLogoSettings(defaultSettings);
      if (success) {
        toast({
          title: "✅ Ripristino Completato",
          description: "Il logo della navbar è stato ripristinato alle impostazioni predefinite.",
          variant: "default",
        });
      } else {
        throw new Error("Ripristino fallito");
      }
    } catch (error) {
      console.error('❌ NavbarLogoEditor: Reset failed:', error);
      toast({
        title: "❌ Errore di Ripristino",
        description: "Non è stato possibile ripristinare le impostazioni predefinite. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Caricamento impostazioni logo navbar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestione Logo Navbar</h3>
          <p className="text-sm text-gray-600">Configura il logo che appare nella barra di navigazione</p>
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
          <CardTitle>Logo della Navbar</CardTitle>
          <CardDescription>
            Personalizza il logo che appare nella barra di navigazione superiore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Visibility Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Mostra Logo</Label>
              <p className="text-xs text-gray-500">
                Attiva o disattiva la visualizzazione del logo nella navbar
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {navbarLogoSettings?.showLogo ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <Switch
                checked={navbarLogoSettings?.showLogo || false}
                onCheckedChange={(checked) => 
                  updateNavbarLogoSettings({ ...navbarLogoSettings, showLogo: checked })
                }
              />
            </div>
          </div>

          {/* Logo Size Selection */}
          <div className="space-y-2">
            <Label>Dimensione Logo</Label>
            <Select
              value={navbarLogoSettings?.logoSize || "medium"}
              onValueChange={(value: "small" | "medium" | "large") =>
                updateNavbarLogoSettings({ ...navbarLogoSettings, logoSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona dimensione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Piccolo (32x32 / 40x40)</SelectItem>
                <SelectItem value="medium">Medio (40x40 / 56x56)</SelectItem>
                <SelectItem value="large">Grande (48x48 / 64x64)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le dimensioni sono in pixel (mobile / desktop)
            </p>
          </div>

          {/* Logo Preview and Upload */}
          <div className="space-y-4">
            <div className="border rounded-md p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
              {!imageLoaded && !imageError && navbarLogoSettings?.logoUrl && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                  <p className="text-sm text-gray-500">Caricamento logo navbar...</p>
                </div>
              )}

              {navbarLogoSettings?.logoUrl && !imageError && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={navbarLogoSettings.logoUrl}
                      alt={navbarLogoSettings.altText}
                      className={`rounded-full shadow-md border-2 border-persian-gold/30 ${
                        navbarLogoSettings.logoSize === 'small' ? 'h-10 w-10' :
                        navbarLogoSettings.logoSize === 'large' ? 'h-16 w-16' :
                        'h-14 w-14'
                      }`}
                      onLoad={() => {
                        setImageLoaded(true);
                        setImageError(false);
                      }}
                      onError={() => {
                        setImageError(true);
                        setImageLoaded(false);
                      }}
                    />
                    <div className="absolute -inset-1 rounded-full bg-persian-gold/20 blur-sm -z-10"></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Anteprima del logo navbar (dimensione: {navbarLogoSettings.logoSize})
                  </p>
                </div>
              )}

              {imageError && (
                <div className="flex flex-col items-center space-y-2 text-red-500">
                  <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                  <p className="text-sm">Errore nel caricamento del logo</p>
                  <p className="text-xs text-gray-500">Verifica l'URL o carica una nuova immagine</p>
                </div>
              )}
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="navbar-logo-url">URL Logo Navbar</Label>
              <Input
                id="navbar-logo-url"
                value={navbarLogoSettings?.logoUrl || ''}
                onChange={(e) => updateNavbarLogoSettings({ ...navbarLogoSettings, logoUrl: e.target.value })}
                placeholder="https://esempio.com/logo-navbar.png"
              />
              <p className="text-xs text-muted-foreground">
                Inserisci l'URL diretto dell'immagine del logo per la navbar
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Oppure Carica Nuovo Logo Navbar</Label>
              <ImageUploader
                currentImage={navbarLogoSettings?.logoUrl}
                onImageSelected={handleImageUploaded}
                buttonLabel="Scegli Immagine Logo Navbar"
                bucketName="uploads"
                folderPath="navbar-logos"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Raccomandato: Immagine quadrata, almeno 64x64 pixel, PNG o SVG con sfondo trasparente
              </p>
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="navbar-logo-alt-text">Testo Alternativo</Label>
              <Input
                id="navbar-logo-alt-text"
                value={navbarLogoSettings?.altText || ''}
                onChange={(e) => updateNavbarLogoSettings({ ...navbarLogoSettings, altText: e.target.value })}
                placeholder="Descrivi il logo navbar per screen reader e SEO"
              />
              <p className="text-xs text-muted-foreground">
                Aiuta l'accessibilità e il SEO descrivendo il contenuto del logo navbar
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

export default NavbarLogoEditor;
