import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Bell, Save, RefreshCw, Volume2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { adminUpsertSetting } from '@/utils/adminDatabaseUtils';

interface NotificationSettings {
  // Sound Settings
  soundEnabled: boolean;
  soundVolume: number;
  soundType: string;
  continuousSound: boolean;
  
  // Email Settings
  emailEnabled: boolean;
  emailAddress: string;
  emailSubject: string;
  
  // SMS Settings (future)
  smsEnabled: boolean;
  phoneNumber: string;
  
  // Display Settings
  popupEnabled: boolean;
  browserNotifications: boolean;
  
  // Order Settings
  newOrderSound: boolean;
  orderUpdateSound: boolean;
  paymentConfirmationSound: boolean;
}

const NotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    soundVolume: 80,
    soundType: 'bell',
    continuousSound: true,
    emailEnabled: true,
    emailAddress: 'orders@pizzeriaregina2000.it',
    emailSubject: 'Nuovo Ordine - Pizzeria Regina 2000',
    smsEnabled: false,
    phoneNumber: '',
    popupEnabled: true,
    browserNotifications: true,
    newOrderSound: true,
    orderUpdateSound: true,
    paymentConfirmationSound: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingSound, setTestingSound] = useState(false);

  const soundTypes = [
    { value: 'bell', label: 'Campanello' },
    { value: 'chime', label: 'Carillon' },
    { value: 'notification', label: 'Notifica' },
    { value: 'alert', label: 'Allarme' },
    { value: 'custom', label: 'Personalizzato' }
  ];

  // Load notification settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'notificationSettings')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        setSettings({ ...settings, ...data.value });
        console.log('✅ Notification settings loaded');
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le impostazioni notifiche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      // Use admin database utility to handle authentication automatically
      const result = await adminUpsertSetting('notificationSettings', settings);

      if (!result.success) {
        throw new Error(result.error || 'Errore sconosciuto durante il salvataggio');
      }

      toast({
        title: "Successo",
        description: "Impostazioni notifiche salvate con successo",
      });

      console.log('✅ Notification settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare le impostazioni notifiche",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testSound = async () => {
    setTestingSound(true);
    try {
      // Create audio element for testing
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = settings.soundVolume / 100;
      await audio.play();
      
      toast({
        title: "Test suono",
        description: "Suono di notifica riprodotto",
      });
    } catch (error) {
      console.error('Error playing test sound:', error);
      toast({
        title: "Errore test suono",
        description: "Impossibile riprodurre il suono di test",
        variant: "destructive",
      });
    } finally {
      setTestingSound(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Caricamento impostazioni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sound Settings */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Impostazioni Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled">Abilita suoni</Label>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          {settings.soundEnabled && (
            <>
              <div className="space-y-2">
                <Label>Volume ({settings.soundVolume}%)</Label>
                <Slider
                  value={[settings.soundVolume]}
                  onValueChange={(value) => updateSetting('soundVolume', value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo di suono</Label>
                <Select
                  value={settings.soundType}
                  onValueChange={(value) => updateSetting('soundType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soundTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="continuous-sound">Suono continuo fino a conferma</Label>
                <Switch
                  id="continuous-sound"
                  checked={settings.continuousSound}
                  onCheckedChange={(checked) => updateSetting('continuousSound', checked)}
                />
              </div>

              <Button 
                onClick={testSound}
                disabled={testingSound}
                variant="outline"
                className="w-full"
              >
                {testingSound ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-2" />
                )}
                Testa Suono
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Notifiche Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled">Abilita notifiche email</Label>
            <Switch
              id="email-enabled"
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
            />
          </div>

          {settings.emailEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-address">Indirizzo email</Label>
                <Input
                  id="email-address"
                  type="email"
                  value={settings.emailAddress}
                  onChange={(e) => updateSetting('emailAddress', e.target.value)}
                  placeholder="orders@pizzeriaregina2000.it"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Oggetto email</Label>
                <Input
                  id="email-subject"
                  value={settings.emailSubject}
                  onChange={(e) => updateSetting('emailSubject', e.target.value)}
                  placeholder="Nuovo Ordine - Pizzeria Regina 2000"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Event Settings */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Eventi Ordini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-order-sound">Nuovo ordine</Label>
            <Switch
              id="new-order-sound"
              checked={settings.newOrderSound}
              onCheckedChange={(checked) => updateSetting('newOrderSound', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="order-update-sound">Aggiornamento ordine</Label>
            <Switch
              id="order-update-sound"
              checked={settings.orderUpdateSound}
              onCheckedChange={(checked) => updateSetting('orderUpdateSound', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="payment-confirmation-sound">Conferma pagamento</Label>
            <Switch
              id="payment-confirmation-sound"
              checked={settings.paymentConfirmationSound}
              onCheckedChange={(checked) => updateSetting('paymentConfirmationSound', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
