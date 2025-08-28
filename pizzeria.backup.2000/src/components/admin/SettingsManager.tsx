import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Palette,
  Globe,
  CreditCard,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { adminBatchUpsertSettings, adminUpsertSetting } from '@/utils/adminDatabaseUtils';

interface PizzeriaSettings {
  // Contact Info
  restaurant_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;

  // Delivery Settings
  delivery_fee: number;
  minimum_order: number;
  delivery_radius: number;

  // Payment Settings
  stripe_enabled: boolean;
  cash_on_delivery: boolean;

  // Notification Settings
  notification_sound: boolean;
  notification_email: string;

  // SEO Settings
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

const SettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PizzeriaSettings>({
    restaurant_name: 'Pizzeria Senza Cipolla Torino',
    address: 'C.so Giulio Cesare, 36, 10152 Torino TO',
    phone: '+393479190907',
    email: 'info@pizzeriasenzacipolla.it',
    website: 'https://pizzeriasenzacipolla.it',
    delivery_fee: 3.50,
    minimum_order: 15.00,
    delivery_radius: 5,
    stripe_enabled: true,
    cash_on_delivery: true,
    notification_sound: true,
    notification_email: 'orders@pizzeriasenzacipolla.it',
    meta_title: 'Pizzeria Senza Cipolla Torino - Autentica Pizza Italiana',
    meta_description: 'Pizzeria Senza Cipolla a Torino offre autentica pizza italiana. Ordina online per consegna a domicilio o ritiro.',
    meta_keywords: 'pizza, pizzeria, torino, consegna, italiana, regina 2000'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      // Convert settings array to object
      const settingsObj = data?.reduce((acc, setting) => {
        try {
          // Since value_type column doesn't exist, try to parse as JSON first
          // If it fails, use the raw value
          acc[setting.key] = typeof setting.value === 'object'
            ? setting.value
            : (typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value);
        } catch (e) {
          // If JSON parsing fails, use the raw value
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {} as any);

      if (settingsObj) {
        // CRITICAL FIX: Load contact info from contactContent if available
        if (settingsObj.contactContent) {
          const contactContent = settingsObj.contactContent;
          settingsObj.address = contactContent.address || settingsObj.address;
          settingsObj.phone = contactContent.phone || settingsObj.phone;
          settingsObj.email = contactContent.email || settingsObj.email;
        }

        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);

      // Convert settings object to array format for batch upsert
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? value : value // Store objects directly, strings as-is
      }));

      // Use admin batch upsert utility
      const batchResult = await adminBatchUpsertSettings(settingsArray);

      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Errore durante il salvataggio delle impostazioni');
      }

      // CRITICAL FIX: Also update the contactContent key that frontend components use
      const contactContent = {
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        hours: "Lun-Dom: 18:30 - 22:30", // Default hours, can be made configurable later
        mapUrl: "https://maps.google.com"
      };

      const contactResult = await adminUpsertSetting('contactContent', contactContent);

      if (!contactResult.success) {
        console.error('Error updating contactContent:', contactResult.error);
        throw new Error(contactResult.error || 'Errore durante l\'aggiornamento delle informazioni di contatto');
      }

      console.log('✅ Settings saved and contactContent updated for frontend compatibility');

      toast({
        title: "Successo",
        description: "Impostazioni salvate con successo",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare le impostazioni",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };



  useEffect(() => {
    loadSettings();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Impostazioni Generali</h3>
          <p className="text-sm text-gray-600">Configura le impostazioni della pizzeria</p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          <Save className="mr-2" size={16} />
          {isSaving ? 'Salvando...' : 'Salva Tutto'}
        </Button>
      </div>

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contact">Contatti</TabsTrigger>
          <TabsTrigger value="delivery">Consegne</TabsTrigger>
          <TabsTrigger value="payments">Pagamenti</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Contact Information */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2" />
                Informazioni di Contatto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurant_name">Nome Ristorante</Label>
                  <Input
                    id="restaurant_name"
                    value={settings.restaurant_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, restaurant_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Indirizzo</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Sito Web</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Consegna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="delivery_fee">Costo Consegna (€)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.50"
                    value={settings.delivery_fee}
                    onChange={(e) => setSettings(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="minimum_order">Ordine Minimo (€)</Label>
                  <Input
                    id="minimum_order"
                    type="number"
                    step="0.50"
                    value={settings.minimum_order}
                    onChange={(e) => setSettings(prev => ({ ...prev, minimum_order: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_radius">Raggio Consegna (km)</Label>
                  <Input
                    id="delivery_radius"
                    type="number"
                    value={settings.delivery_radius}
                    onChange={(e) => setSettings(prev => ({ ...prev, delivery_radius: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2" />
                Metodi di Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.stripe_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, stripe_enabled: e.target.checked }))}
                  className="rounded"
                />
                <Label>Abilita pagamenti con carta (Stripe)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.cash_on_delivery}
                  onChange={(e) => setSettings(prev => ({ ...prev, cash_on_delivery: e.target.checked }))}
                  className="rounded"
                />
                <Label>Abilita pagamento alla consegna</Label>
              </div>
              
              <div>
                <Label htmlFor="notification_email">Email per notifiche ordini</Label>
                <Input
                  id="notification_email"
                  type="email"
                  value={settings.notification_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, notification_email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2" />
                Impostazioni SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Titolo Meta</Label>
                <Input
                  id="meta_title"
                  value={settings.meta_title}
                  onChange={(e) => setSettings(prev => ({ ...prev, meta_title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="meta_description">Descrizione Meta</Label>
                <Textarea
                  id="meta_description"
                  value={settings.meta_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, meta_description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="meta_keywords">Parole Chiave (separate da virgola)</Label>
                <Input
                  id="meta_keywords"
                  value={settings.meta_keywords}
                  onChange={(e) => setSettings(prev => ({ ...prev, meta_keywords: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManager;
