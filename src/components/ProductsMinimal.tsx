import React from 'react';
import { Pizza } from 'lucide-react';

const ProductsMinimal = () => {
  return (
    <section id="products" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Le Nostre Pizze</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Autentica pizza italiana preparata con ingredienti freschi e forno a legna tradizionale
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto rounded-full"></div>
        </div>

        <div className="text-center py-12">
          <Pizza className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Minimal Products Component - Testing</p>
          <p className="text-sm text-gray-500 mt-2">
            This is a simplified version to test if the error persists.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductsMinimal;
