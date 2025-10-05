import React, { useState, useEffect } from 'react';
import { Search, X, Pizza } from 'lucide-react';
import ProductSearch from './ProductSearch';
import { Product } from '@/types/category';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleProductSelect = (product: Product) => {
    console.log('🔍 Product selected from mobile search:', product);
    onClose();
    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pizza-red to-pizza-orange">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white font-fredoka">
              Cerca Prodotti
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Chiudi ricerca"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <ProductSearch
              placeholder="Cerca pizze, bevande, dolci..."
              onProductSelect={handleProductSelect}
              showResults={true}
              className="w-full"
            />
            
            {/* Search Tips */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 font-fredoka">
                💡 Suggerimenti di ricerca
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-pizza-cream rounded-lg border border-pizza-orange/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Pizza className="h-4 w-4 text-pizza-red" />
                    <span className="font-medium text-pizza-dark">Pizze</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Prova: "Margherita", "Regina", "Speciali"
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-500">🥤</span>
                    <span className="font-medium text-gray-800">Bevande</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Prova: "Coca Cola", "Birra", "Acqua"
                  </p>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-yellow-600">🍰</span>
                    <span className="font-medium text-gray-800">Dolci</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Prova: "Nutella", "Dolci"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSearchModal;
