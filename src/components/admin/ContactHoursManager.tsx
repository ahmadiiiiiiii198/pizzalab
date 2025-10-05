import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  RefreshCw,
  Calendar,
  Globe,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { adminUpsertSetting, adminBatchUpsertSettings } from '@/utils/adminDatabaseUtils';
import { businessHoursService } from '@/services/businessHoursService';

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  hours: string;
  backgroundImage?: string;
}

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

const ContactHoursManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const lastSaveTimeRef = useRef<number>(0);
  const contactInfoRef = useRef<ContactInfo>();
  const [showDebugTests, setShowDebugTests] = useState(false);
  const [debugResults, setDebugResults] = useState<string[]>([]);
  
  // Contact Information State
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: '',
    phone: '',
    email: '',
    mapUrl: '',
    hours: '',
    backgroundImage: ''
  });

  // Business Hours State
  const [businessHours, setBusinessHours] = useState<WeeklyHours>({
    monday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    tuesday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    wednesday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    thursday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    friday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    saturday: { isOpen: true, openTime: '18:30', closeTime: '22:30' },
    sunday: { isOpen: true, openTime: '18:30', closeTime: '22:30' }
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Lunedì' },
    { key: 'tuesday', label: 'Martedì' },
    { key: 'wednesday', label: 'Mercoledì' },
    { key: 'thursday', label: 'Giovedì' },
    { key: 'friday', label: 'Venerdì' },
    { key: 'saturday', label: 'Sabato' },
    { key: 'sunday', label: 'Domenica' }
  ];

  // Load data from database
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only load data once on initial mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadData();

      // Debug: Check if admin functions are available
      console.log('🔍 [ContactHoursManager] Initial mount - checking admin function availability...');
      console.log('🔍 [ContactHoursManager] adminUpsertSetting type:', typeof adminUpsertSetting);
      console.log('🔍 [ContactHoursManager] adminBatchUpsertSettings type:', typeof adminBatchUpsertSettings);
      console.log('🔍 [ContactHoursManager] businessHoursService type:', typeof businessHoursService);
    } else {
      console.log('🚫 [ContactHoursManager] Skipping re-initialization - component already initialized');
    }

    // Set up real-time listener to detect external changes (but prevent our own changes from triggering reloads)
    const channel = supabase
      .channel('admin-contact-hours-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=in.(contactContent,businessHours)'
      }, (payload) => {
        console.log('🔔 [ContactHoursManager] Real-time update received:', payload);

        // Check if this update happened recently after our save (within 5 seconds)
        const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
        if (timeSinceLastSave < 5000) {
          console.log('🚫 [ContactHoursManager] Ignoring real-time update - recent save detected');
          return;
        }

        console.log('🔄 [ContactHoursManager] External change detected, reloading data...');
        loadData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array to prevent re-mounting

  // Debug: Log state changes with detailed tracking
  useEffect(() => {
    console.log('🔍 [ContactHoursManager] Contact info state changed:', contactInfo.email, contactInfo.address);
    console.log('🔍 [ContactHoursManager] Full contact info:', contactInfo);
    console.log('🔍 [ContactHoursManager] Stack trace for contact info change:', new Error().stack);
  }, [contactInfo]);

  useEffect(() => {
    console.log('🔍 [ContactHoursManager] Business hours state changed:', businessHours);
  }, [businessHours]);

  // Test function to verify admin functions work
  const testDirectSave = async () => {
    console.log('🧪 [TEST] Starting admin function test...');
    console.log('🧪 [TEST] Current contactInfo:', contactInfo);
    console.log('🧪 [TEST] Current businessHours:', businessHours);

    try {
      // Test 1: Check if admin functions exist
      console.log('🧪 [TEST] Testing admin function availability...');
      if (typeof adminUpsertSetting !== 'function') {
        throw new Error('adminUpsertSetting is not available');
      }
      if (typeof adminBatchUpsertSettings !== 'function') {
        throw new Error('adminBatchUpsertSettings is not available');
      }
      console.log('✅ [TEST] Admin functions are available');

      // Test 2: Try a simple admin upsert
      const timestamp = Date.now();
      const testContactInfo = {
        ...contactInfo,
        address: "TEST ADDRESS - " + timestamp,
        email: "test@pizzalab.it",
        hours: "TEST HOURS - " + timestamp
      };

      console.log('🧪 [TEST] Testing adminUpsertSetting with:', testContactInfo);

      const result = await adminUpsertSetting('contactContent', testContactInfo);

      console.log('🧪 [TEST] Admin upsert result:', result);

      if (!result.success) {
        throw new Error(`Admin upsert failed: ${result.error}`);
      }

      console.log('✅ [TEST] Admin upsert successful');
      toast({
        title: "Test Successful",
        description: "Admin function test passed!",
      });

      // Update local state
      setContactInfo(testContactInfo);
    } catch (error) {
      console.error('🧪 [TEST] Exception during admin test:', error);
      toast({
        title: "Test Failed",
        description: `Admin test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const addDebugResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const result = `[${timestamp}] ${message}`;
    setDebugResults(prev => [...prev, result]);
    console.log(`🧪 [DEBUG] ${message}`);
  };

  const runDebugTests = async () => {
    setDebugResults([]);
    addDebugResult('Starting comprehensive debug tests...');

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase.from('settings').select('key').limit(1);
      if (error) throw error;
      addDebugResult('✅ Database connection: PASS');
    } catch (error) {
      addDebugResult(`❌ Database connection: FAIL - ${error.message}`);
    }

    // Test 2: Admin Functions
    try {
      if (typeof adminUpsertSetting !== 'function') throw new Error('adminUpsertSetting not available');
      if (typeof adminBatchUpsertSettings !== 'function') throw new Error('adminBatchUpsertSettings not available');
      addDebugResult('✅ Admin functions: PASS');
    } catch (error) {
      addDebugResult(`❌ Admin functions: FAIL - ${error.message}`);
    }

    // Test 3: Form State Before Save
    const currentEmail = contactInfo.email;
    addDebugResult(`📝 Current form email: ${currentEmail}`);

    // Test 4: Save Operation
    try {
      const testData = {
        ...contactInfo,
        email: `test-debug-${Date.now()}@pizzalab.it`
      };

      addDebugResult('💾 Testing save operation...');
      const result = await adminUpsertSetting('contactContent', testData);

      if (result.success) {
        addDebugResult('✅ Save operation: PASS');

        // Update local state to simulate what saveAll does
        setContactInfo(testData);
        contactInfoRef.current = testData;

        // Test 5: Check if form state persists
        setTimeout(() => {
          // Check both the ref state and the DOM input value
          const refEmail = contactInfoRef.current?.email || '';
          const emailInput = document.getElementById('email') as HTMLInputElement;
          const domEmail = emailInput?.value || '';

          addDebugResult(`📝 Form email after save (ref): ${refEmail}`);
          addDebugResult(`📝 Form email after save (DOM): ${domEmail}`);

          if (refEmail === testData.email && domEmail === testData.email) {
            addDebugResult('✅ Form state persistence: PASS');
          } else {
            addDebugResult('❌ Form state persistence: FAIL - Form was reset!');
            addDebugResult(`📝 Expected: ${testData.email}`);
            addDebugResult(`📝 Got (ref): ${refEmail}, Got (DOM): ${domEmail}`);
          }
        }, 1000);

      } else {
        addDebugResult(`❌ Save operation: FAIL - ${result.error}`);
      }
    } catch (error) {
      addDebugResult(`❌ Save operation: FAIL - ${error.message}`);
    }
  };

  const loadData = async (forceReload = false) => {
    try {
      // Prevent reload if we just saved (within 5 seconds) unless forced
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      if (!forceReload && timeSinceLastSave < 5000) {
        console.log('🚫 [ContactHoursManager] Skipping reload - recent save detected (time since save: ' + timeSinceLastSave + 'ms)');
        return;
      }

      setIsLoading(true);
      console.log('📥 [ContactHoursManager] Loading data from database...');
      console.log('📥 [ContactHoursManager] STACK TRACE for loadData call:', new Error().stack);

      // Load contact content
      const { data: contactData, error: contactError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contactContent')
        .single();

      if (contactData?.value) {
        const loadedContactInfo = contactData.value as ContactInfo;
        setContactInfo(loadedContactInfo);
        contactInfoRef.current = loadedContactInfo;
        console.log('📋 [ContactHoursManager] Loaded contact info:', contactData.value);
      }

      // Load business hours using the service for consistency
      try {
        const businessHoursData = await businessHoursService.getBusinessHours();
        setBusinessHours(businessHoursData);
        console.log('🕐 [ContactHoursManager] Loaded business hours via service:', businessHoursData);
      } catch (hoursError) {
        console.warn('⚠️ [ContactHoursManager] Failed to load via service, falling back to direct query');
        // Fallback to direct database query
        const { data: hoursData, error: directError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'businessHours')
          .single();

        if (hoursData?.value) {
          setBusinessHours(hoursData.value as WeeklyHours);
          console.log('🕐 [ContactHoursManager] Loaded business hours (fallback):', hoursData.value);
        }
      }

      console.log('✅ [ContactHoursManager] Contact and hours data loaded successfully');
    } catch (error) {
      console.error('❌ [ContactHoursManager] Error loading data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati di contatto e orari",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    console.log(`📝 [ContactHoursManager] Updating ${field}:`, value);
    console.log(`📝 [ContactHoursManager] Stack trace for updateContactInfo:`, new Error().stack);
    setContactInfo(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log(`📝 [ContactHoursManager] New contact info state:`, updated);
      contactInfoRef.current = updated; // Keep ref in sync
      return updated;
    });
  };

  const updateDayHours = (day: keyof WeeklyHours, field: keyof DayHours, value: any) => {
    console.log(`🕐 [ContactHoursManager] Updating ${day}.${field}:`, value);
    setBusinessHours(prev => {
      const updated = {
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value
        }
      };
      console.log(`🕐 [ContactHoursManager] New business hours state:`, updated);
      return updated;
    });
  };

  // Generate formatted hours string from business hours
  const generateFormattedHours = (): string => {
    const dayNames = {
      monday: 'Lunedì',
      tuesday: 'Martedì', 
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica'
    };

    return Object.entries(businessHours)
      .map(([day, hours]) => {
        const dayName = dayNames[day as keyof typeof dayNames];
        if (!hours.isOpen) {
          return `${dayName}: Chiuso`;
        }
        return `${dayName}: ${hours.openTime} - ${hours.closeTime}`;
      })
      .join('\n');
  };

  const saveContactInfo = async () => {
    try {
      setIsSaving(true);

      console.log('💾 [ContactHoursManager] Starting contact info save...');
      console.log('📝 [ContactHoursManager] Contact info to save:', contactInfo);

      // Check if admin functions are available
      if (typeof adminUpsertSetting !== 'function') {
        throw new Error('Admin utility functions not available');
      }

      // Use admin database utility for consistent authentication
      console.log('🔐 [ContactHoursManager] Calling adminUpsertSetting...');
      const result = await adminUpsertSetting('contactContent', contactInfo);

      console.log('📊 [ContactHoursManager] Admin upsert result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Errore durante il salvataggio delle informazioni di contatto');
      }

      // Set last save time to prevent immediate reloads
      const saveTime = Date.now();
      setLastSaveTime(saveTime);
      lastSaveTimeRef.current = saveTime;

      console.log('✅ [ContactHoursManager] Contact info saved successfully with admin method');

      toast({
        title: "Successo",
        description: "Informazioni di contatto salvate nel database con successo",
      });
    } catch (error) {
      console.error('❌ [ContactHoursManager] Error saving contact info:', error);
      console.error('❌ [ContactHoursManager] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare le informazioni di contatto",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveBusinessHours = async () => {
    try {
      setIsSaving(true);

      console.log('💾 [ContactHoursManager] Starting business hours save with admin method...');
      console.log('🕐 [ContactHoursManager] Business hours to save:', businessHours);

      // Generate formatted hours first
      const formattedHours = generateFormattedHours();
      console.log('📄 [ContactHoursManager] Generated formatted hours:', formattedHours);

      // Update local contact info state immediately
      const updatedContactInfo = {
        ...contactInfo,
        hours: formattedHours
      };

      // Use batch admin upsert for atomic operation
      const settingsToUpdate = [
        { key: 'businessHours', value: businessHours },
        { key: 'contactContent', value: updatedContactInfo }
      ];

      console.log('💾 [ContactHoursManager] Batch saving with admin method:', settingsToUpdate);

      const result = await adminBatchUpsertSettings(settingsToUpdate);

      if (!result.success) {
        throw new Error(result.error || 'Errore durante il salvataggio degli orari di apertura');
      }

      // Force refresh the business hours service to sync with our changes
      console.log('🔄 [ContactHoursManager] Forcing business hours service refresh...');
      await businessHoursService.forceRefresh();

      // Update local state to reflect the changes
      setContactInfo(updatedContactInfo);
      contactInfoRef.current = updatedContactInfo;

      // Set last save time to prevent immediate reloads
      const saveTime = Date.now();
      setLastSaveTime(saveTime);
      lastSaveTimeRef.current = saveTime;

      console.log('✅ [ContactHoursManager] Business hours saved and synced with admin method');

      toast({
        title: "Successo",
        description: "Orari di apertura salvati nel database e sincronizzati con successo",
      });
    } catch (error) {
      console.error('❌ [ContactHoursManager] Error saving business hours:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare gli orari di apertura",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAll = async () => {
    try {
      setIsSaving(true);

      console.log('💾 [ContactHoursManager] Starting save all operation...');
      console.log('📝 [ContactHoursManager] Current contact info:', contactInfo);
      console.log('🕐 [ContactHoursManager] Current business hours:', businessHours);

      // Check if admin functions are available
      if (typeof adminBatchUpsertSettings !== 'function') {
        console.error('❌ [ContactHoursManager] adminBatchUpsertSettings is not a function!');
        throw new Error('Admin batch utility functions not available');
      }
      console.log('✅ [ContactHoursManager] Admin functions are available');

      // Generate formatted hours and update contact info
      const formattedHours = generateFormattedHours();
      const updatedContactInfo = {
        ...contactInfo,
        hours: formattedHours
      };

      console.log('📄 [ContactHoursManager] Generated formatted hours:', formattedHours);
      console.log('📋 [ContactHoursManager] Updated contact info to save:', updatedContactInfo);

      // Use batch admin upsert for atomic operation
      const settingsToUpdate = [
        { key: 'contactContent', value: updatedContactInfo },
        { key: 'businessHours', value: businessHours }
      ];

      console.log('💾 [ContactHoursManager] Batch saving all data with admin method:', settingsToUpdate);
      console.log('🔐 [ContactHoursManager] Calling adminBatchUpsertSettings...');

      const result = await adminBatchUpsertSettings(settingsToUpdate);

      console.log('📊 [ContactHoursManager] Batch upsert result:', result);

      if (!result.success) {
        console.error('❌ [ContactHoursManager] Batch upsert failed:', result.error);
        throw new Error(result.error || 'Errore durante il salvataggio delle informazioni');
      }

      console.log('✅ [ContactHoursManager] Successfully saved all data to database with admin method');

      // Force refresh the business hours service to sync with our changes
      console.log('🔄 [ContactHoursManager] Forcing business hours service refresh...');
      await businessHoursService.forceRefresh();

      // Update local state immediately to prevent real-time overrides
      console.log('🔄 [ContactHoursManager] Updating local state with saved data:', updatedContactInfo);
      setContactInfo(updatedContactInfo);
      contactInfoRef.current = updatedContactInfo;

      // Set last save time to prevent immediate reloads
      const saveTime = Date.now();
      setLastSaveTime(saveTime);
      lastSaveTimeRef.current = saveTime;

      console.log('✅ [ContactHoursManager] All data saved and synchronized with admin method');

      // Add a delay and then check if the form fields still have the correct values
      setTimeout(() => {
        console.log('🔍 [ContactHoursManager] Post-save verification - current contactInfo:', contactInfo);
        console.log('🔍 [ContactHoursManager] Post-save verification - current businessHours:', businessHours);
      }, 1000);

      toast({
        title: "Successo",
        description: "Tutte le informazioni sono state salvate nel database con successo",
      });
    } catch (error) {
      console.error('❌ [ContactHoursManager] Error saving all data:', error);
      console.error('❌ [ContactHoursManager] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        error: error
      });
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare le informazioni nel database",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestione Contatti e Orari</h3>
          <p className="text-sm text-gray-600">Modifica le informazioni di contatto e gli orari di apertura</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => loadData(true)} variant="outline" disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Ricarica
          </Button>
          <Button onClick={testDirectSave} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white">
            🧪 Test Save
          </Button>
          <Button
            onClick={() => setShowDebugTests(!showDebugTests)}
            variant="outline"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            🔧 Debug Tests
          </Button>
          <Button
            onClick={() => {
              console.log('🧪 [DEBUG] Current state before save:', { contactInfo, businessHours });
              saveAll();
            }}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salva Tutto'}
          </Button>
        </div>
      </div>

      {/* Debug Tests Section */}
      {showDebugTests && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              🔧 Debug Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={runDebugTests}
                className="bg-orange-600 hover:bg-orange-700"
              >
                🧪 Run Debug Tests
              </Button>
              <Button
                onClick={() => setDebugResults([])}
                variant="outline"
              >
                Clear Results
              </Button>
            </div>

            {debugResults.length > 0 && (
              <div className="bg-white border rounded p-4 max-h-64 overflow-y-auto">
                <h4 className="font-semibold mb-2">Test Results:</h4>
                <div className="space-y-1 text-sm font-mono">
                  {debugResults.map((result, index) => (
                    <div key={index} className={
                      result.includes('✅') ? 'text-green-600' :
                      result.includes('❌') ? 'text-red-600' :
                      result.includes('📝') ? 'text-blue-600' :
                      result.includes('💾') ? 'text-purple-600' :
                      'text-gray-600'
                    }>
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact">Informazioni di Contatto</TabsTrigger>
          <TabsTrigger value="hours">Orari di Apertura</TabsTrigger>
        </TabsList>

        {/* Contact Information Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Informazioni di Contatto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    value={contactInfo.address}
                    onChange={(e) => updateContactInfo('address', e.target.value)}
                    placeholder="Via Example, 123, 10100 Torino TO"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => updateContactInfo('phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => updateContactInfo('email', e.target.value)}
                    placeholder="info@pizzalab.it"
                  />
                </div>

                <div>
                  <Label htmlFor="mapUrl">URL Mappa</Label>
                  <Input
                    id="mapUrl"
                    value={contactInfo.mapUrl}
                    onChange={(e) => updateContactInfo('mapUrl', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hours">Orari (Testo Libero)</Label>
                <Textarea
                  id="hours"
                  value={contactInfo.hours}
                  onChange={(e) => updateContactInfo('hours', e.target.value)}
                  placeholder="Lun-Dom: 18:30 - 22:30"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Questo campo viene automaticamente aggiornato quando modifichi gli orari di apertura nella tab "Orari di Apertura"
                </p>
              </div>

              <div>
                <Label htmlFor="backgroundImage">Immagine di Sfondo (URL)</Label>
                <Input
                  id="backgroundImage"
                  value={contactInfo.backgroundImage || ''}
                  onChange={(e) => updateContactInfo('backgroundImage', e.target.value)}
                  placeholder="https://example.com/background.jpg"
                />
              </div>

              <Button onClick={saveContactInfo} disabled={isSaving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Informazioni di Contatto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Orari di Apertura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-blue-800">Sincronizzazione Automatica</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Gli orari configurati qui verranno automaticamente sincronizzati con le informazioni di contatto
                      e mostrati nel footer e nella sezione contatti del sito.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {daysOfWeek.map(({ key, label }) => (
                  <Card key={key} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{label}</span>
                        <Switch
                          checked={businessHours[key as keyof WeeklyHours].isOpen}
                          onCheckedChange={(checked) => updateDayHours(key as keyof WeeklyHours, 'isOpen', checked)}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {businessHours[key as keyof WeeklyHours].isOpen ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`${key}-open`}>Apertura</Label>
                            <Input
                              id={`${key}-open`}
                              type="time"
                              value={businessHours[key as keyof WeeklyHours].openTime}
                              onChange={(e) => updateDayHours(key as keyof WeeklyHours, 'openTime', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${key}-close`}>Chiusura</Label>
                            <Input
                              id={`${key}-close`}
                              type="time"
                              value={businessHours[key as keyof WeeklyHours].closeTime}
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

              <Button onClick={saveBusinessHours} disabled={isSaving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Orari di Apertura
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactHoursManager;
