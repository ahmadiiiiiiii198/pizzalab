import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Clock, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { businessHoursService } from '@/services/businessHoursService';
import { adminUpsertSetting } from '@/utils/adminDatabaseUtils';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const BusinessHoursManager = () => {
  const { toast } = useToast();
  const [hours, setHours] = useState<WeeklyHours>({
    monday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    tuesday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    wednesday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    thursday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    friday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    saturday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    sunday: { isOpen: true, openTime: '18:30', closeTime: '22:30' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Lunedì' },
    { key: 'tuesday', label: 'Martedì' },
    { key: 'wednesday', label: 'Mercoledì' },
    { key: 'thursday', label: 'Giovedì' },
    { key: 'friday', label: 'Venerdì' },
    { key: 'saturday', label: 'Sabato' },
    { key: 'sunday', label: 'Domenica' }
  ];

  // Load business hours
  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      setIsLoading(true);
      const businessHours = await businessHoursService.getBusinessHours();
      setHours(businessHours);
      console.log('✅ Business hours loaded:', businessHours);
    } catch (error) {
      console.error('❌ Error loading business hours:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli orari di apertura",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDayHours = (day: keyof WeeklyHours, field: keyof DayHours, value: any) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const saveBusinessHours = async () => {
    try {
      setIsSaving(true);

      // Use the admin database utility to handle authentication automatically
      const result = await adminUpsertSetting('businessHours', hours);

      if (!result.success) {
        throw new Error(result.error || 'Errore sconosciuto durante il salvataggio');
      }

      // Force complete refresh to verify changes immediately
      console.log('🔄 [BusinessHoursManager] Forcing complete refresh...');
      const updatedHours = await businessHoursService.forceRefresh();
      console.log('✅ [BusinessHoursManager] Verified updated hours:', updatedHours);

      // Update local state to reflect changes immediately
      setHours(updatedHours);

      toast({
        title: "Successo",
        description: "Orari di apertura salvati con successo. Le modifiche sono attive immediatamente.",
      });

      console.log('✅ Business hours saved successfully');
    } catch (error) {
      console.error('❌ Error saving business hours:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare gli orari di apertura",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const setAllDaysSame = () => {
    const mondayHours = hours.monday;
    const newHours = { ...hours };
    
    Object.keys(newHours).forEach(day => {
      newHours[day as keyof WeeklyHours] = { ...mondayHours };
    });
    
    setHours(newHours);
    toast({
      title: "Orari copiati",
      description: "Gli orari del lunedì sono stati applicati a tutti i giorni",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Caricamento orari...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={setAllDaysSame}
          variant="outline"
          className="flex items-center"
        >
          <Clock className="h-4 w-4 mr-2" />
          Applica orari lunedì a tutti i giorni
        </Button>
        <Button 
          onClick={loadBusinessHours}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Ricarica
        </Button>
      </div>

      {/* Days Configuration */}
      <div className="grid gap-4">
        {daysOfWeek.map(({ key, label }) => (
          <Card key={key} className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{label}</span>
                <Switch
                  checked={hours[key as keyof WeeklyHours].isOpen}
                  onCheckedChange={(checked) => updateDayHours(key as keyof WeeklyHours, 'isOpen', checked)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hours[key as keyof WeeklyHours].isOpen ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${key}-open`}>Apertura</Label>
                    <Input
                      id={`${key}-open`}
                      type="time"
                      value={hours[key as keyof WeeklyHours].openTime}
                      onChange={(e) => updateDayHours(key as keyof WeeklyHours, 'openTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-close`}>Chiusura</Label>
                    <Input
                      id={`${key}-close`}
                      type="time"
                      value={hours[key as keyof WeeklyHours].closeTime}
                      onChange={(e) => updateDayHours(key as keyof WeeklyHours, 'closeTime', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Chiuso</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={saveBusinessHours}
          disabled={isSaving}
          className="flex items-center"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Salvataggio...' : 'Salva Orari'}
        </Button>
      </div>
    </div>
  );
};

export default BusinessHoursManager;
