import React from 'react';
import { ArrowLeft, Pizza } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdiniHeaderProps {
  onBackToAdmin: () => void;
  onBackToHome: () => void;
}

const OrdiniHeader: React.FC<OrdiniHeaderProps> = ({ onBackToAdmin, onBackToHome }) => {
  return (
    <div className="bg-gradient-to-r from-white via-gray-50 to-white shadow-xl border-b border-gray-200 relative z-30">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center space-x-6">
            <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <Pizza className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                Gestione Ordini
              </h1>
              <p className="text-xl text-gray-600 font-semibold">Pizzeria Regina 2000</p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Sistema ordini attivo e funzionante
              </p>
            </div>
          </div>

          {/* Right Side - Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBackToAdmin}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Pannello Admin
            </Button>
            <Button
              onClick={onBackToHome}
              variant="outline"
              className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Torna al Sito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdiniHeader;
