import { useCallback } from 'react';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that provides business hours validation for cart operations
 * This centralizes business hours validation logic
 */
export const useBusinessHoursValidation = () => {
  const { isOpen, message, validateOrderTime } = useBusinessHoursContext();
  const { toast } = useToast();

  /**
   * Validate if orders can be placed right now
   */
  const validateCanOrder = useCallback(async (): Promise<boolean> => {
    // First check the current state
    if (!isOpen) {
      toast({
        title: 'Ordini non disponibili 🕒',
        description: message || 'Siamo attualmente chiusi. Gli ordini possono essere effettuati solo durante gli orari di apertura.',
        variant: 'destructive'
      });
      return false;
    }

    // Double-check with real-time validation
    try {
      const timeValidation = await validateOrderTime();
      if (!timeValidation.valid) {
        toast({
          title: 'Ordini non disponibili 🕒',
          description: timeValidation.message,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error validating order time:', error);
      toast({
        title: 'Errore di validazione',
        description: 'Impossibile verificare gli orari di apertura. Riprova.',
        variant: 'destructive'
      });
      return false;
    }
  }, [isOpen, message, validateOrderTime, toast]);

  /**
   * Wrapper function for cart operations that need business hours validation
   */
  const withBusinessHoursValidation = useCallback(
    <T extends any[], R>(
      operation: (...args: T) => R,
      operationName: string = 'operazione'
    ) => {
      return async (...args: T): Promise<R | null> => {
        const canOrder = await validateCanOrder();
        if (!canOrder) {
          console.log(`🚫 ${operationName} blocked - business is closed`);
          return null;
        }
        
        console.log(`✅ ${operationName} allowed - business is open`);
        return operation(...args);
      };
    },
    [validateCanOrder]
  );

  return {
    isOpen,
    message,
    validateCanOrder,
    withBusinessHoursValidation
  };
};
