import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ReservationButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const ReservationButton: React.FC<ReservationButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  showIcon = true
}) => {
  const navigate = useNavigate();

  const handleReservationClick = () => {
    navigate('/prenota');
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const baseClasses = variant === 'default' 
    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl'
    : variant === 'outline'
    ? 'border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white'
    : 'text-orange-600 hover:bg-orange-50';

  return (
    <Button
      onClick={handleReservationClick}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        font-semibold rounded-lg transition-all duration-300 transform hover:scale-105
        ${className}
      `}
    >
      {showIcon && <Calendar className="w-5 h-5 mr-2" />}
      Prenota Tavolo
    </Button>
  );
};

// Hero Section Reservation CTA
export const ReservationHeroCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-12 px-4 rounded-2xl shadow-2xl">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          🍕 Prenota la tua esperienza
        </h2>
        <p className="text-xl mb-6 opacity-90">
          Assapora le nostre pizze autentiche in un ambiente accogliente
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <div className="flex items-center text-lg">
            <Clock className="w-5 h-5 mr-2" />
            <span>Conferma in 2 ore</span>
          </div>
          <div className="flex items-center text-lg">
            <Users className="w-5 h-5 mr-2" />
            <span>Fino a 20 persone</span>
          </div>
        </div>
        
        <Button
          onClick={() => navigate('/prenota')}
          size="lg"
          className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Calendar className="w-6 h-6 mr-3" />
          Prenota Ora
        </Button>
        
        <p className="text-sm mt-4 opacity-75">
          Cancellazione gratuita fino a 2 ore prima
        </p>
      </div>
    </div>
  );
};

// Floating Reservation Button
export const FloatingReservationButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => navigate('/prenota')}
        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-2xl hover:shadow-3xl rounded-full p-4 transition-all duration-300 transform hover:scale-110"
        size="lg"
      >
        <Calendar className="w-6 h-6 mr-2" />
        Prenota
      </Button>
    </div>
  );
};

export default ReservationButton;
