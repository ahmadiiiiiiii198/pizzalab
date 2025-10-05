import React from 'react';
import { Clock, AlertCircle, Info } from 'lucide-react';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';

const BusinessHoursBanner: React.FC = () => {
  const { isOpen, isLoading, message, nextOpenTime, todayHours } = useBusinessHoursContext();

  // Don't show banner while loading
  if (isLoading) {
    return null;
  }

  // Only show banner when business is closed
  if (isOpen) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center space-x-3">
        <Clock className="h-5 w-5 animate-pulse" />
        <div className="text-center">
          <p className="font-semibold text-sm md:text-base">
            🍕 Siamo attualmente chiusi
          </p>
          <p className="text-xs md:text-sm opacity-90">
            {message}
          </p>
          {nextOpenTime && (
            <p className="text-xs opacity-80">
              Prossima apertura: {nextOpenTime}
            </p>
          )}
        </div>
        <AlertCircle className="h-5 w-5" />
      </div>
    </div>
  );
};

export default BusinessHoursBanner;
