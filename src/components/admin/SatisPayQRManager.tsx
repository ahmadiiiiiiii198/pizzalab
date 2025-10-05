import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, Trash2, QrCode, Save, Image as ImageIcon } from 'lucide-react';
import { useSatisPaySettings } from '@/hooks/useSatisPaySettings';
import { useToast } from '@/hooks/use-toast';

const SatisPayQRManager: React.FC = () => {
  const { settings, isLoading, updateSettings, uploadQRImage } = useSatisPaySettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    qr_code_image_url: settings?.qr_code_image_url || '',
    is_enabled: settings?.is_enabled ?? true,
    title: settings?.title || 'Paga con SatisPay',
    description: settings?.description || 'Scansiona il QR code per pagare con SatisPay'
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        qr_code_image_url: settings.qr_code_image_url || '',
        is_enabled: settings.is_enabled,
        title: settings.title,
        description: settings.description
      });
    }
  }, [settings]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Per favore seleziona un file immagine valido',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Errore',
        description: 'Il file è troppo grande. Massimo 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadQRImage(file);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, qr_code_image_url: imageUrl }));
        toast({
          title: 'Successo',
          description: 'Immagine QR caricata con successo'
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante il caricamento dell\'immagine',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        toast({
          title: 'Successo',
          description: 'Impostazioni SatisPay salvate con successo'
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante il salvataggio delle impostazioni',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, qr_code_image_url: '' }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gestione QR Code SatisPay
          </CardTitle>
          <CardDescription>
            Gestisci l'immagine QR code mostrata quando i clienti scelgono "Paga Ora"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_enabled: checked }))
              }
            />
            <Label htmlFor="is_enabled">Abilita pagamento SatisPay</Label>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Paga con SatisPay"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Scansiona il QR code per pagare con SatisPay"
              rows={3}
            />
          </div>

          {/* QR Code Image Upload */}
          <div className="space-y-4">
            <Label>Immagine QR Code</Label>
            
            {/* Current Image Preview */}
            {formData.qr_code_image_url && (
              <div className="relative inline-block">
                <img
                  src={formData.qr_code_image_url}
                  alt="SatisPay QR Code"
                  className="w-48 h-48 object-contain border border-gray-200 rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={removeImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById('qr-upload')?.click()}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Caricamento...' : 'Carica Immagine QR'}
              </Button>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <p className="text-sm text-gray-500">
              Formati supportati: JPG, PNG, GIF. Massimo 5MB.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {formData.is_enabled && formData.qr_code_image_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Anteprima
            </CardTitle>
            <CardDescription>
              Come apparirà ai clienti quando cliccano "Paga Ora"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">{formData.title}</h3>
              <p className="text-gray-600">{formData.description}</p>
              <img
                src={formData.qr_code_image_url}
                alt="SatisPay QR Code Preview"
                className="mx-auto w-64 h-64 object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SatisPayQRManager;
