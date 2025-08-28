import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface WhyChooseUsData {
  title: string;
  subtitle: string;
  centralImage: string;
  features: Feature[];
}

const WhyChooseUsManager = () => {
  const [data, setData] = useState<WhyChooseUsData>({
    title: "Perché scegliere EFES KEBAP?",
    subtitle: "Autentico sapore turco e pizza italiana dal 2020",
    centralImage: "/placeholder-kebab.jpg",
    features: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'whyChooseUsContent')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settingsData?.value) {
        const value = settingsData.value as any;
        setData({
          title: value.title || data.title,
          subtitle: value.subtitle || data.subtitle,
          centralImage: value.centralImage || data.centralImage,
          features: value.features || []
        });
      }
    } catch (error) {
      console.error('Error loading why choose us data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'whyChooseUsContent',
          value: data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Dati salvati con successo!');
    } catch (error) {
      console.error('Error saving why choose us data:', error);
      toast.error('Errore nel salvataggio dei dati');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `why-choose-us-${Date.now()}.${fileExt}`;
      const filePath = `why-choose-us/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setData(prev => ({ ...prev, centralImage: publicUrl }));
      toast.success('Immagine caricata con successo!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Errore nel caricamento dell\'immagine');
    } finally {
      setUploadingImage(false);
    }
  };

  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      icon: "⭐",
      title: "Nuova Caratteristica",
      description: "Descrizione della caratteristica"
    };
    setData(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setData(prev => ({
      ...prev,
      features: prev.features.map(feature =>
        feature.id === id ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const removeFeature = (id: string) => {
    setData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature.id !== id)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Caricamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Sticky for better UX */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Gestione "Perché Sceglierci"</h2>
          <p className="text-gray-600">Personalizza la sezione che spiega perché i clienti dovrebbero scegliere il tuo ristorante</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{previewMode ? 'Modifica' : 'Anteprima'}</span>
          </Button>
          <Button
            onClick={saveData}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2 whitespace-nowrap"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Salvataggio...' : 'Salva'}</span>
          </Button>
        </div>
        </div>
      </div>

      {!previewMode ? (
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Informazioni Principali</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titolo Principale</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Es: Perché scegliere EFES KEBAP?"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Sottotitolo</Label>
                <Input
                  id="subtitle"
                  value={data.subtitle}
                  onChange={(e) => setData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Es: Autentico sapore turco e pizza italiana dal 2020"
                />
              </div>
            </CardContent>
          </Card>

          {/* Central Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <span>Immagine Centrale</span>
              </CardTitle>
              <CardDescription>
                L'immagine che appare al centro della sezione (consigliato: 400x400px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                  {data.centralImage ? (
                    <img
                      src={data.centralImage}
                      alt="Anteprima"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImage}
                    className="w-full"
                  >
                    {uploadingImage ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Caricamento...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Carica Immagine
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Caratteristiche ({data.features.length}/6)</span>
                </div>
                <Button
                  onClick={addFeature}
                  size="sm"
                  disabled={data.features.length >= 6}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Aggiungi</span>
                </Button>
              </CardTitle>
              <CardDescription>
                Aggiungi fino a 6 caratteristiche che distinguono il tuo ristorante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.features.map((feature, index) => (
                  <Card key={feature.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Badge variant="secondary" className="mt-1">
                          {index < 3 ? 'Sinistra' : 'Destra'} {((index % 3) + 1)}
                        </Badge>
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Emoji/Icona</Label>
                              <Input
                                value={feature.icon}
                                onChange={(e) => updateFeature(feature.id, 'icon', e.target.value)}
                                placeholder="🥙"
                                className="text-center text-lg"
                              />
                            </div>
                            <div>
                              <Label>Titolo</Label>
                              <Input
                                value={feature.title}
                                onChange={(e) => updateFeature(feature.id, 'title', e.target.value)}
                                placeholder="Kebab Autentico"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Descrizione</Label>
                            <Textarea
                              value={feature.description}
                              onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                              placeholder="Ricette tradizionali turche"
                              rows={2}
                            />
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFeature(feature.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {data.features.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nessuna caratteristica aggiunta</p>
                    <p className="text-sm">Clicca "Aggiungi" per iniziare</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Preview Mode
        <Card>
          <CardHeader>
            <CardTitle>Anteprima Sezione</CardTitle>
            <CardDescription>
              Ecco come apparirà la sezione sul sito web
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-efes-cream to-efes-warm-white p-8 rounded-lg">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-efes-dark-navy mb-2">
                  {data.title}
                </h2>
                <p className="text-lg text-efes-charcoal">
                  {data.subtitle}
                </p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6 items-center max-w-5xl mx-auto">
                {/* Left Features */}
                <div className="space-y-4">
                  {data.features.slice(0, 3).map((feature) => (
                    <div key={feature.id} className="bg-white/80 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                      <div className="text-2xl">{feature.icon}</div>
                      <div>
                        <h3 className="font-semibold text-efes-dark-navy">{feature.title}</h3>
                        <p className="text-sm text-efes-charcoal">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Central Image */}
                <div className="flex justify-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-efes-gold/30">
                    {data.centralImage ? (
                      <img
                        src={data.centralImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-4xl">🥙</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Features */}
                <div className="space-y-4">
                  {data.features.slice(3, 6).map((feature) => (
                    <div key={feature.id} className="bg-white/80 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                      <div className="text-2xl">{feature.icon}</div>
                      <div>
                        <h3 className="font-semibold text-efes-dark-navy">{feature.title}</h3>
                        <p className="text-sm text-efes-charcoal">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhyChooseUsManager;
