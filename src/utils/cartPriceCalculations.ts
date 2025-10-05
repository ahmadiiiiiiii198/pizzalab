/**
 * Centralized cart price calculation utilities
 * This ensures all features (current and future) are properly included in price calculations
 */

import { CartItem } from '@/hooks/use-simple-cart';

/**
 * Safely parse a price value that could be string or number
 */
export const parsePrice = (price: string | number | undefined): number => {
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  return price || 0;
};

/**
 * Calculate the total price for a single cart item including all features
 * This function should be updated whenever new features are added
 */
export const calculateItemTotal = (item: CartItem): number => {
  // Base product price
  const productPrice = parsePrice(item.product.price) * item.quantity;

  // Impasta (dough) price
  const impastaPrice = item.impastaType ? 
    parsePrice(item.impastaType.price) * item.quantity : 0;

  // Base del pizze price
  const baseDelPizzePrice = item.baseDelPizzeType ? 
    parsePrice(item.baseDelPizzeType.price) * item.quantity : 0;

  // Extras price
  const extrasPrice = item.extras ? 
    item.extras.reduce((total, extra) => {
      const extraPrice = parsePrice(extra.price);
      return total + (extraPrice * extra.quantity * item.quantity);
    }, 0) : 0;

  // TODO: Add future features here
  // Example for future features:
  // const futureFeaturePrice = item.futureFeature ? 
  //   parsePrice(item.futureFeature.price) * item.quantity : 0;

  const total = productPrice + impastaPrice + baseDelPizzePrice + extrasPrice;

  console.log(`🧮 Item total calculation for ${item.product.name}:`, {
    productPrice,
    impastaPrice,
    baseDelPizzePrice: baseDelPizzePrice, // ← DEBUG: This should be > 0 if base del pizze is selected
    extrasPrice,
    total,
    quantity: item.quantity,
    hasBaseDelPizze: !!item.baseDelPizzeType,
    baseDelPizzeData: item.baseDelPizzeType
  });

  return total;
};

/**
 * Calculate the total price for all items in the cart
 */
export const calculateCartTotal = (items: CartItem[]): number => {
  const total = items.reduce((cartTotal, item) => {
    return cartTotal + calculateItemTotal(item);
  }, 0);

  console.log('💰 Cart total calculation:', {
    itemCount: items.length,
    total,
    items: items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      itemTotal: calculateItemTotal(item)
    }))
  });

  return total;
};

/**
 * Get a breakdown of prices for a cart item (useful for debugging and display)
 */
export const getItemPriceBreakdown = (item: CartItem) => {
  return {
    productPrice: parsePrice(item.product.price) * item.quantity,
    impastaPrice: item.impastaType ? parsePrice(item.impastaType.price) * item.quantity : 0,
    baseDelPizzePrice: item.baseDelPizzeType ? parsePrice(item.baseDelPizzeType.price) * item.quantity : 0,
    extrasPrice: item.extras ? 
      item.extras.reduce((total, extra) => {
        const extraPrice = parsePrice(extra.price);
        return total + (extraPrice * extra.quantity * item.quantity);
      }, 0) : 0,
    // Add future features here as needed
  };
};

/**
 * Validate that all price calculations are consistent across the app
 * This function can be used in tests to ensure price calculation consistency
 */
export const validatePriceCalculations = (items: CartItem[]): boolean => {
  try {
    // Test that all calculations return valid numbers
    for (const item of items) {
      const itemTotal = calculateItemTotal(item);
      if (isNaN(itemTotal) || itemTotal < 0) {
        console.error('❌ Invalid item total:', itemTotal, 'for item:', item);
        return false;
      }
    }

    const cartTotal = calculateCartTotal(items);
    if (isNaN(cartTotal) || cartTotal < 0) {
      console.error('❌ Invalid cart total:', cartTotal);
      return false;
    }

    console.log('✅ Price calculations validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Price calculation validation failed:', error);
    return false;
  }
};
