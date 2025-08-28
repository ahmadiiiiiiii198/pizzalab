/**
 * Utility functions for handling price calculations and formatting
 * to avoid floating-point precision issues
 */

/**
 * Rounds a number to 2 decimal places to avoid floating-point precision issues
 * @param value - The number to round
 * @returns The rounded number with exactly 2 decimal places
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Safely parses a string or number to a price with 2 decimal places
 * @param value - The value to parse (string or number)
 * @returns The parsed price rounded to 2 decimal places, or 0 if invalid
 */
export const parsePrice = (value: string | number): number => {
  if (typeof value === 'string') {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : roundToTwoDecimals(parsed);
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : roundToTwoDecimals(value);
  }
  
  return 0;
};

/**
 * Formats a price for display with currency symbol
 * @param price - The price to format
 * @param currency - The currency symbol (default: '€')
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = '€'): string => {
  const roundedPrice = roundToTwoDecimals(price);
  return `${currency}${roundedPrice.toFixed(2)}`;
};

/**
 * Formats a price for display without currency symbol
 * @param price - The price to format
 * @returns Formatted price string with 2 decimal places
 */
export const formatPriceNumber = (price: number): string => {
  const roundedPrice = roundToTwoDecimals(price);
  return roundedPrice.toFixed(2);
};

/**
 * Calculates the total price for multiple items
 * @param price - Unit price
 * @param quantity - Quantity
 * @returns Total price rounded to 2 decimal places
 */
export const calculateTotal = (price: number, quantity: number): number => {
  return roundToTwoDecimals(price * quantity);
};

/**
 * Validates if a price is valid (positive number)
 * @param price - The price to validate
 * @returns True if the price is valid
 */
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
};

/**
 * Safely converts a price value to a number, handling string inputs from database
 * @param price - The price value (string or number)
 * @returns The price as a number, or 0 if invalid
 */
export const ensureNumber = (price: string | number | null | undefined): number => {
  if (price === null || price === undefined) return 0;
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof price === 'number') {
    return isNaN(price) ? 0 : price;
  }
  return 0;
};

/**
 * Safely formats a price for display, handling string inputs from database
 * @param price - The price value (string or number)
 * @param currency - The currency symbol (default: '€')
 * @returns Formatted price string
 */
export const safeFormatPrice = (price: string | number | null | undefined, currency: string = '€'): string => {
  const numericPrice = ensureNumber(price);
  return formatPrice(numericPrice, currency);
};

/**
 * Converts price from cents to euros (for Stripe integration)
 * @param cents - Price in cents
 * @returns Price in euros rounded to 2 decimal places
 */
export const centsToEuros = (cents: number): number => {
  return roundToTwoDecimals(cents / 100);
};

/**
 * Converts price from euros to cents (for Stripe integration)
 * @param euros - Price in euros
 * @returns Price in cents as integer
 */
export const eurosToCents = (euros: number): number => {
  return Math.round(roundToTwoDecimals(euros) * 100);
};

/**
 * Safely adds two prices together
 * @param price1 - First price
 * @param price2 - Second price
 * @returns Sum of prices rounded to 2 decimal places
 */
export const addPrices = (price1: number, price2: number): number => {
  return roundToTwoDecimals(price1 + price2);
};

/**
 * Safely subtracts one price from another
 * @param price1 - Price to subtract from
 * @param price2 - Price to subtract
 * @returns Difference rounded to 2 decimal places
 */
export const subtractPrices = (price1: number, price2: number): number => {
  return roundToTwoDecimals(price1 - price2);
};

/**
 * Calculates percentage of a price
 * @param price - Base price
 * @param percentage - Percentage (e.g., 20 for 20%)
 * @returns Calculated percentage amount rounded to 2 decimal places
 */
export const calculatePercentage = (price: number, percentage: number): number => {
  return roundToTwoDecimals((price * percentage) / 100);
};

/**
 * Applies a discount to a price
 * @param price - Original price
 * @param discountPercentage - Discount percentage (e.g., 10 for 10% off)
 * @returns Discounted price rounded to 2 decimal places
 */
export const applyDiscount = (price: number, discountPercentage: number): number => {
  const discount = calculatePercentage(price, discountPercentage);
  return subtractPrices(price, discount);
};

/**
 * Calculates tax amount for a price
 * @param price - Base price
 * @param taxRate - Tax rate (e.g., 22 for 22% VAT)
 * @returns Tax amount rounded to 2 decimal places
 */
export const calculateTax = (price: number, taxRate: number): number => {
  return calculatePercentage(price, taxRate);
};

/**
 * Calculates price including tax
 * @param price - Base price (excluding tax)
 * @param taxRate - Tax rate (e.g., 22 for 22% VAT)
 * @returns Price including tax rounded to 2 decimal places
 */
export const addTax = (price: number, taxRate: number): number => {
  const tax = calculateTax(price, taxRate);
  return addPrices(price, tax);
};
