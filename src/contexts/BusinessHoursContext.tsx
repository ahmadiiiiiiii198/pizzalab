import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { businessHoursService } from '@/services/businessHoursService';
import { supabase } from '@/integrations/supabase/client';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHoursContextType {
  isOpen: boolean;
  isLoading: boolean;
  message: string;
  nextOpenTime?: string;
  todayHours?: DayHours;
  formattedHours: string;
  validateOrderTime: (orderTime?: Date) => Promise<{ valid: boolean; message: string }>;
  refreshHours: () => void;
}

const BusinessHoursContext = createContext<BusinessHoursContextType | null>(null);

export const useBusinessHoursContext = () => {
  const context = useContext(BusinessHoursContext);
  if (!context) {
    throw new Error('useBusinessHoursContext must be used within a BusinessHoursProvider');
  }
  return context;
};

interface BusinessHoursProviderProps {
  children: React.ReactNode;
}

export const BusinessHoursProvider: React.FC<BusinessHoursProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('Caricamento orari...');
  const [nextOpenTime, setNextOpenTime] = useState<string | undefined>();
  const [todayHours, setTodayHours] = useState<DayHours | undefined>();
  const [formattedHours, setFormattedHours] = useState<string>('');
  const subscriptionRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check current business status
   */
  const checkBusinessStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('🕒 [BusinessHoursProvider] Checking business hours status...');

        // Log current auth state to debug authentication interference
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 [BusinessHoursProvider] Current auth state:', {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          timestamp: new Date().toISOString()
        });
      }

      const result = await businessHoursService.isBusinessOpen();
      const formatted = await businessHoursService.getFormattedHours();

      if (process.env.NODE_ENV === 'development') {
        console.log('🕒 [BusinessHoursProvider] Service returned:', {
          isOpen: result.isOpen,
          message: result.message,
          todayHours: result.todayHours,
          formatted
        });
      }

      setIsOpen(result.isOpen);
      setMessage(result.message);
      setNextOpenTime(result.nextOpenTime);
      setTodayHours(result.todayHours);
      setFormattedHours(formatted);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [BusinessHoursProvider] Business status updated:', {
          isOpen: result.isOpen,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ [BusinessHoursProvider] Error checking business status:', error);
      console.error('❌ [BusinessHoursProvider] Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Set realistic defaults on error - don't assume open
      setIsOpen(false); // Default to closed for safety
      setMessage(`Errore nel caricamento degli orari: ${error.message}. Riprova più tardi.`);
      setNextOpenTime(undefined);
      setTodayHours(undefined);
      setFormattedHours('Orari non disponibili');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate order time
   */
  const validateOrderTime = useCallback(async (orderTime?: Date) => {
    try {
      return await businessHoursService.validateOrderTime(orderTime);
    } catch (error) {
      console.error('❌ [BusinessHoursProvider] Error validating order time:', error);
      // Default to allowing orders on validation error
      return {
        valid: true,
        message: 'Validazione orari non disponibile - ordine consentito'
      };
    }
  }, []);

  /**
   * Force refresh business hours
   */
  const refreshHours = useCallback(() => {
    businessHoursService.forceRefresh();
    checkBusinessStatus();
  }, [checkBusinessStatus]);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    // Initial load
    checkBusinessStatus();

    // Set up real-time subscription for business hours changes
    if (process.env.NODE_ENV === 'development') {
      console.log('📡 [BusinessHoursProvider] Setting up real-time subscription...');
    }

    // Generate unique channel name with timestamp to prevent reuse
    const timestamp = Date.now();
    const channelName = `business-hours-global-${timestamp}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.businessHours'
      }, async (payload) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔔 [BusinessHoursProvider] Real-time business hours change received:', payload.eventType);
        }

        // Force refresh and update status
        await businessHoursService.forceRefresh();
        await checkBusinessStatus();
      })
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📡 [BusinessHoursProvider] Subscription status: ${status}`);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [BusinessHoursProvider] Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [BusinessHoursProvider] Real-time subscription failed');
        }
      });

    subscriptionRef.current = channel;

    // Set up auto-refresh every 5 minutes as backup
    refreshIntervalRef.current = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [BusinessHoursProvider] Auto-refresh triggered');
      }
      checkBusinessStatus();
    }, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log('📋 [BusinessHoursProvider] Cleaning up subscription for:', channelName);
        // Unsubscribe first, then remove channel
        subscriptionRef.current.unsubscribe();
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 [BusinessHoursProvider] Cleanup completed');
      }
    };
  }, [checkBusinessStatus]);

  const value: BusinessHoursContextType = {
    isOpen,
    isLoading,
    message,
    nextOpenTime,
    todayHours,
    formattedHours,
    validateOrderTime,
    refreshHours
  };

  return (
    <BusinessHoursContext.Provider value={value}>
      {children}
    </BusinessHoursContext.Provider>
  );
};

export default BusinessHoursProvider;
