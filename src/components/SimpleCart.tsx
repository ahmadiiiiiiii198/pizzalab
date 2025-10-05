import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useSimpleCart } from '@/hooks/use-simple-cart';
import SimpleCheckoutModal from './SimpleCheckoutModal';
import { safeFormatPrice } from '@/utils/priceUtils';
import { calculateItemTotal } from '@/utils/cartPriceCalculations';
import CartIcon from '@/components/icons/CartIcon';

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

  // Disable body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      console.log('🔒 Cart opened - disabling body scroll');
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Disable body scroll with !important
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('padding-right', '15px', 'important');
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');

      // Also prevent scroll on html element
      document.documentElement.classList.add('cart-open');
      document.body.classList.add('cart-open');

      return () => {
        console.log('🔓 Cart closed - restoring body scroll');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        document.documentElement.style.removeProperty('overflow');
        document.documentElement.classList.remove('cart-open');
        document.body.classList.remove('cart-open');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeCart}>
        <div
          className="fixed right-0 top-0 h-screen w-full sm:w-96 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col max-h-screen"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <CartIcon className="mr-2" size={20} />
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
          <div className="flex-1 overflow-y-auto p-4 min-h-0 cart-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <CartIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Il tuo carrello è vuoto</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  // Use centralized calculation to ensure all features are included
                  const itemTotal = calculateItemTotal(item);
                  
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

                          {/* Show base del pizze type if any */}
                          {item.baseDelPizzeType && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-600">
                                Base del pizze: {item.baseDelPizzeType.name}
                                {item.baseDelPizzeType.price > 0 && ` (+€${item.baseDelPizzeType.price.toFixed(2)})`}
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
            <div className="border-t p-4 space-y-4 bg-white flex-shrink-0">
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
