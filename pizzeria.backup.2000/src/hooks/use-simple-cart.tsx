import React, { createContext, useContext, useState } from 'react';
import { Product } from '@/types/category';
import { useBusinessHoursValidation } from '@/hooks/useBusinessHoursValidation';

export interface PizzaExtra {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
}

export interface ImpastaType {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  specialRequests?: string;
  extras?: PizzaExtra[];
  impastaType?: ImpastaType;
}

interface SimpleCartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, extras?: PizzaExtra[], specialRequests?: string, impastaType?: ImpastaType) => Promise<void | null>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  openCart: () => void;
  closeCart: () => void;
}

const SimpleCartContext = createContext<SimpleCartContextType | null>(null);

export const useSimpleCart = () => {
  const context = useContext(SimpleCartContext);
  if (!context) {
    throw new Error('useSimpleCart must be used within a SimpleCartProvider');
  }
  return context;
};

interface SimpleCartProviderProps {
  children: React.ReactNode;
}

export const SimpleCartProvider: React.FC<SimpleCartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { withBusinessHoursValidation } = useBusinessHoursValidation();

  // Original addItem function (internal use only)
  const addItemInternal = (product: Product, quantity = 1, extras: PizzaExtra[] = [], specialRequests = '', impastaType?: ImpastaType) => {
    setItems(prev => {
      // For pizzas with extras, impasta, or special requests, always create a new cart item (don't merge)
      // This allows customers to have the same pizza with different customizations
      if (extras.length > 0 || specialRequests || impastaType) {
        return [...prev, {
          id: `${product.id}-${Date.now()}-${Math.random()}`,
          product,
          quantity,
          extras,
          specialRequests,
          impastaType
        }];
      }

      // For simple products without extras, merge with existing items
      const existing = prev.find(item =>
        item.product.id === product.id &&
        (!item.extras || item.extras.length === 0) &&
        !item.specialRequests &&
        !item.impastaType
      );

      if (existing) {
        return prev.map(item =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity,
        extras,
        specialRequests,
        impastaType
      }];
    });
  };

  // Public addItem function with business hours validation
  const addItem = async (product: Product, quantity = 1, extras: PizzaExtra[] = [], specialRequests = '', impastaType?: ImpastaType): Promise<void | null> => {
    const validatedOperation = withBusinessHoursValidation(
      addItemInternal,
      'Aggiunta al carrello'
    );

    const result = await validatedOperation(product, quantity, extras, specialRequests, impastaType);
    return result === null ? null : undefined; // Convert void to undefined, keep null as null
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const total = items.reduce((total, item) => {
      const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : (item.product.price || 0);
      const productPrice = price * item.quantity;

      const impastaPrice = item.impastaType ?
        (typeof item.impastaType.price === 'string' ? parseFloat(item.impastaType.price) : (item.impastaType.price || 0)) * item.quantity : 0;

      const extrasPrice = item.extras ?
        item.extras.reduce((extrasTotal, extra) => {
          const extraPrice = typeof extra.price === 'string' ? parseFloat(extra.price) : (extra.price || 0);
          return extrasTotal + (extraPrice * extra.quantity * item.quantity);
        }, 0) : 0;

      return total + productPrice + impastaPrice + extrasPrice;
    }, 0);
    console.log('💰 SimpleCart getTotalPrice:', total, 'items:', items.length);
    return total;
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const contextValue: SimpleCartContextType = {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    openCart,
    closeCart
  };

  return (
    <SimpleCartContext.Provider value={contextValue}>
      {children}
    </SimpleCartContext.Provider>
  );
};
