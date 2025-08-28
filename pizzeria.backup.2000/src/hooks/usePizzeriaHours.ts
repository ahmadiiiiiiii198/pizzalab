import { useState, useEffect } from 'react';
import { pizzeriaHoursService } from '@/services/pizzeriaHoursService';

interface UsePizzeriaHoursResult {
  isOpen: boolean;
  displayText: string;
  isLoading: boolean;
  allHours: string;
  refreshHours: () => void;
}

/**
 * Hook for pizzeria display hours (different from order hours)
 * This shows the actual opening/closing times of the pizzeria for display purposes
 */
export const usePizzeriaHours = (): UsePizzeriaHoursResult => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayText, setDisplayText] = useState('12:00 - 24:00');
  const [allHours, setAllHours] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadPizzeriaHours = async () => {
    try {
      setIsLoading(true);
      
      // Get current status and display text
      const status = await pizzeriaHoursService.getPizzeriaStatus();
      setIsOpen(status.isOpen);
      setDisplayText(status.displayText);
      
      // Get all formatted hours
      const formatted = await pizzeriaHoursService.getAllFormattedHours();
      setAllHours(formatted);
      
      console.log('📅 [usePizzeriaHours] Loaded:', {
        isOpen: status.isOpen,
        displayText: status.displayText
      });
    } catch (error) {
      console.error('❌ [usePizzeriaHours] Error loading hours:', error);
      // Keep default values on error
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHours = () => {
    loadPizzeriaHours();
  };

  useEffect(() => {
    loadPizzeriaHours();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadPizzeriaHours, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isOpen,
    displayText,
    isLoading,
    allHours,
    refreshHours
  };
};
