# Category Features Toggle Implementation

## Overview
This implementation adds the ability to enable/disable "impasto" (dough type), "aggiunti" (extras) and "bevande" (drinks) features for each product category. This allows fine-grained control over which categories can have impasto selection, extras and drinks added during the ordering process.

## Features Implemented

### 1. Database Schema Updates
- **File**: `DATABASE_SETUP_SCRIPT.sql`
- **Migration**: `migrations/add_category_features_toggle.sql`
- **Changes**:
  - Added `impasto_enabled` BOOLEAN column (default: true)
  - Added `aggiunti_enabled` BOOLEAN column (default: true)
  - Added `bevande_enabled` BOOLEAN column (default: true)
  - Added indexes for performance
  - Added column documentation

### 2. TypeScript Type Updates
- **File**: `src/types/category.ts`
- **Changes**:
  - Updated `Category` interface with new optional fields
  - Updated `CategoryFormData` interface for admin forms
  - Maintained backward compatibility

### 3. Backend Service Updates
- **File**: `src/services/categoryService.ts`
- **Changes**:
  - Updated `saveCategory()` to handle new fields
  - Added default values for new categories
  - Updated both insert and update operations

### 4. Admin Interface Updates
- **File**: `src/components/admin/CategoriesEditor.tsx`
- **Changes**:
  - Added toggle checkboxes for "Aggiunti" and "Bevande"
  - Updated form layout with responsive grid
  - Added default values for new categories
  - Integrated with existing save functionality

### 5. Frontend Product Display Updates
- **File**: `src/components/ProductCard.tsx`
- **Changes**:
  - Added category settings state management
  - Added useEffect to fetch category settings
  - Updated PizzaCustomizationModal props
  - Added error handling for settings fetch

### 6. Pizza Customization Modal Updates
- **File**: `src/components/PizzaCustomizationModal.tsx`
- **Changes**:
  - Added `categorySettings` prop to interface
  - Updated step navigation logic to skip disabled features
  - Conditional rendering of extras and bevande sections
  - Smart special requests placement based on enabled features
  - Updated loading logic to respect category settings

## How It Works

### Admin Workflow
1. Admin goes to Categories management in admin panel
2. For each category, they can toggle:
   - **Aggiunti**: Enable/disable extras for this category
   - **Bevande**: Enable/disable drinks for this category
3. Settings are saved to database immediately

### Customer Workflow
1. Customer selects a product from a category
2. If it's a pizza, the customization modal opens
3. Modal steps are dynamically determined by category settings:
   - **Always shown**: Impasta selection
   - **Conditionally shown**: Extras (if aggiunti_enabled)
   - **Conditionally shown**: Bevande (if bevande_enabled)
4. Navigation automatically skips disabled steps
5. Special requests appear on the final step

### Technical Flow
1. ProductCard fetches category settings when product loads
2. Settings are passed to PizzaCustomizationModal
3. Modal uses settings to:
   - Conditionally load extras/bevande data
   - Show/hide relevant sections
   - Adjust step navigation logic
   - Place special requests appropriately

## Database Migration

To apply the database changes, run the migration script:

```sql
-- Run this in your Supabase SQL editor or via psql
\i migrations/add_category_features_toggle.sql
```

Or manually execute:
```sql
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS aggiunti_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bevande_enabled BOOLEAN DEFAULT true;

UPDATE categories 
SET aggiunti_enabled = true, bevande_enabled = true 
WHERE aggiunti_enabled IS NULL OR bevande_enabled IS NULL;
```

## Testing

Use the provided test file to verify the implementation:
1. Open `test-category-features.html` in a browser
2. Run the database schema test
3. Load categories to see current settings
4. Test updating category settings

## Configuration Examples

### Example 1: Pizza Category (Full Features)
- aggiunti_enabled: `true`
- bevande_enabled: `true`
- Result: Shows impasta → extras → bevande → cart

### Example 2: Dessert Category (Drinks Only)
- aggiunti_enabled: `false`
- bevande_enabled: `true`
- Result: Shows impasta → bevande → cart

### Example 3: Simple Category (No Customization)
- aggiunti_enabled: `false`
- bevande_enabled: `false`
- Result: Shows impasta → cart (or direct add to cart)

## Backward Compatibility

- All existing categories default to `true` for both settings
- Existing code continues to work without modification
- Optional fields in TypeScript interfaces
- Graceful fallbacks if settings can't be loaded

## Error Handling

- Database connection errors: Falls back to default settings (both enabled)
- Missing category data: Uses default settings
- Invalid settings: Logs error and continues with defaults
- Network issues: Cached settings or defaults used

## Performance Considerations

- Category settings are fetched once per product load
- Settings are cached in component state
- Database queries use indexes on new columns
- Minimal impact on existing functionality

## Future Enhancements

Potential future improvements:
1. Global default settings for new categories
2. Bulk category settings update
3. Category-specific extras lists
4. Time-based feature toggles
5. A/B testing for feature availability
