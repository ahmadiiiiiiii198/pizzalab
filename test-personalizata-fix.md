# Test Plan for Personalizata "Aggiungi al Carrello" Fix

## Issue Description
The "Aggiungi al Carrello" button was not working for products with "personalizata" (customization) because the validation required a `selectedBaseDelPizze` to be selected, but there were issues with:

1. State reset not clearing `selectedBaseDelPizze` when modal opens
2. Default selection logic only setting if `!selectedBaseDelPizze` 
3. Validation being too strict - requiring base del pizze even when not enabled

## Changes Made

### 1. Fixed State Reset (Line 172)
```typescript
// Added this line to reset base del pizze selection when modal opens
setSelectedBaseDelPizze(null); // Reset base del pizze selection
```

### 2. Improved Default Selection (Lines 126-130)
```typescript
// Changed from conditional to always set default
if (types.length > 0) {
  setSelectedBaseDelPizze(types[0]);
  console.log('🍕 Auto-selected base del pizze:', types[0].name);
}
```

### 3. Enhanced Validation Logic (Lines 286-299)
```typescript
// Only require base del pizze selection if the feature is enabled for this category
if (!pizza) {
  console.error('❌ Cannot add to cart - missing pizza');
  return;
}

if (categorySettings.base_del_pizze_enabled && !selectedBaseDelPizze) {
  console.error('❌ Cannot add to cart - base del pizze required but not selected:', {
    base_del_pizze_enabled: categorySettings.base_del_pizze_enabled,
    selectedBaseDelPizze: !!selectedBaseDelPizze,
    availableTypes: baseDelPizzeTypes.length
  });
  return;
}
```

### 4. Improved Button UX (Lines 856-871)
```typescript
// Show "Aggiungi al Carrello" if this is the final step, otherwise "Avanti"
{!categorySettings.impasto_enabled && !categorySettings.aggiunti_enabled && !categorySettings.bevande_enabled ? (
  <>
    <ShoppingCart size={16} className="mr-2" />
    Aggiungi al Carrello
  </>
) : (
  'Avanti'
)}
```

### 5. Added Debug Logging
- Added console logs to track base del pizze loading
- Added console logs to track add to cart validation
- Added console logs to track auto-selection

## Test Steps

1. **Navigate to a product with personalizata**
   - Go to "Crea la tua pizza" category
   - Click on "Crea la tua pizza" product
   - Click "Personalizza" button

2. **Verify base del pizze selection**
   - Modal should open with base del pizze step
   - Should auto-select first option (margherita, rossa, or bianca)
   - Button should show "Aggiungi al Carrello" if no other features enabled

3. **Test add to cart functionality**
   - Click "Aggiungi al Carrello" button
   - Should successfully add to cart
   - Should show success toast message

4. **Check console logs**
   - Should see "🍕 Loading base del pizze types..."
   - Should see "🍕 Auto-selected base del pizze: [name]"
   - Should see "🛒 handleAddToCart called:" with proper data

## Expected Results

- ✅ "Aggiungi al Carrello" button should work for personalizata products
- ✅ Base del pizze should auto-select when modal opens
- ✅ Validation should only require base del pizze when feature is enabled
- ✅ User experience should be smooth and intuitive
- ✅ Console should show debug information for troubleshooting

## Database State

Base del pizze types available:
- margherita (€0.00)
- rossa (€0.00) 
- bianca (€0.00)

Category with base_del_pizze_enabled:
- "Crea la tua pizza" (slug: crea-la-tua-pizza)

Product to test:
- "Crea la tua pizza" (slug: crea-la-tua-pizza-custom)
