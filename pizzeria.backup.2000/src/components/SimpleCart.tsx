import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useSimpleCart } from '@/hooks/use-simple-cart';
import SimpleCheckoutModal from './SimpleCheckoutModal';
import { safeFormatPrice } from '@/utils/priceUtils';

const SimpleCart: React.FC = () => {
  const {
    items,
    isOpen,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    closeCart
  } = useSimpleCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeCart}>
        <div 
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              Carrello ({getTotalItems()})
            </h2>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Chiudi carrello"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Il tuo carrello è vuoto</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const itemTotal = item.product.price * item.quantity +
                    (item.impastaType ? item.impastaType.price * item.quantity : 0) +
                    (item.extras?.reduce((total, extra) => total + (extra.price * extra.quantity * item.quantity), 0) || 0);
                  
                  return (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start space-x-3">
                        <img
                          src={item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">€{item.product.price.toFixed(2)} cad.</p>

                          {/* Show impasta type if any */}
                          {item.impastaType && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-600">
                                Impasta: {item.impastaType.name}
                                {item.impastaType.price > 0 && ` (+€${item.impastaType.price.toFixed(2)})`}
                              </p>
                            </div>
                          )}

                          {/* Show extras if any */}
                          {item.extras && item.extras.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500 font-medium">Extra:</p>
                              {item.extras.map(extra => (
                                <p key={extra.id} className="text-xs text-gray-600">
                                  + {extra.name} x{extra.quantity} (+€{(extra.price * extra.quantity).toFixed(2)})
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {/* Show special requests if any */}
                          {item.specialRequests && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500 font-medium">Note:</p>
                              <p className="text-xs text-gray-600">{item.specialRequests}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                updateQuantity(item.id, item.quantity - 1);
                              }}
                              className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                              aria-label="Diminuisci quantità"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-2 font-medium">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                updateQuantity(item.id, item.quantity + 1);
                              }}
                              className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                              aria-label="Aumenta quantità"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm font-medium">Totale: €{itemTotal.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                removeItem(item.id);
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              aria-label={`Rimuovi ${item.product.name} dal carrello`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Totale:</span>
                <span>{safeFormatPrice(getTotalPrice())}</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-pizza-orange text-white py-3 rounded-lg hover:bg-pizza-red transition-colors font-medium"
                >
                  Procedi al Checkout
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Svuota Carrello
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <SimpleCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={items}
          totalAmount={getTotalPrice()}
        />
      )}
    </>
  );
};

export default SimpleCart;
