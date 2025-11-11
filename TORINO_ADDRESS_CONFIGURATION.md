# 🇮🇹 Torino Address Configuration

## Overview

All customer addresses are now automatically configured for **Torino, Italy**. When customers enter their delivery address, the system automatically appends ", Torino, Italy" before geocoding and distance calculation.

---

## What Has Been Implemented

### ✅ 1. Automatic Address Normalization

**File**: `address-torino-patch.js`

This script intercepts all address inputs and automatically:
- Appends ", Torino, Italy" to addresses that don't specify a city
- Adds "Italy" to addresses that mention Torino but not the country
- Leaves addresses unchanged if they already contain both Torino and Italy
- Works with all Google Maps API calls (Geocoding, Distance Matrix)

### ✅ 2. Integration in Website

**File**: `index.html` (line 43-44)

The patch script is loaded early in the page lifecycle, before the main application, ensuring all address validations use Torino as the default city.

### ✅ 3. User Experience Enhancements

The script automatically:
- Updates input placeholders to show "(Torino)"
- Adds helper text: "📍 Gli indirizzi sono automaticamente localizzati a Torino, Italia"
- Works with dynamically loaded content (checkout forms, etc.)

---

## How It Works

### Customer Perspective

**What customers enter:**
```
Via Garibaldi 15
```

**What gets geocoded:**
```
Via Garibaldi 15, Torino, Italy
```

### Technical Flow

```
┌─────────────────────────────────────────────────────────────┐
│          Customer enters address in checkout                 │
│                "Via Garibaldi 15"                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         address-torino-patch.js intercepts                   │
│    Normalizes to: "Via Garibaldi 15, Torino, Italy"         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Google Geocoding API                               │
│    Returns coordinates for Torino location                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Google Distance Matrix API                           │
│    Calculates distance from restaurant to customer          │
│              (both in Torino)                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            Delivery validation                               │
│   ✅ Accept if within range                                 │
│   ❌ Reject if outside delivery zone                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Examples

### Example 1: Simple Street Address
**Customer enters**: `Via Roma 10`  
**System geocodes**: `Via Roma 10, Torino, Italy`  
**Result**: ✅ Correctly located in Torino

### Example 2: Address with Building Number
**Customer enters**: `Corso Vittorio Emanuele II 53`  
**System geocodes**: `Corso Vittorio Emanuele II 53, Torino, Italy`  
**Result**: ✅ Correctly located in Torino

### Example 3: Address with Postal Code
**Customer enters**: `Via Po 18, 10123`  
**System geocodes**: `Via Po 18, 10123, Torino, Italy`  
**Result**: ✅ Correctly located in Torino with postal code

### Example 4: Customer Already Includes City
**Customer enters**: `Piazza Castello, Torino`  
**System geocodes**: `Piazza Castello, Torino, Italy`  
**Result**: ✅ Only adds country, keeps Torino

### Example 5: Customer Includes Full Address
**Customer enters**: `Via Nizza 230, Torino, Italia`  
**System geocodes**: `Via Nizza 230, Torino, Italia` (unchanged)  
**Result**: ✅ No modification needed

---

## Configuration

### Default Settings

```javascript
const DEFAULT_CITY = 'Torino';
const DEFAULT_COUNTRY = 'Italy';
```

### To Change the Default City

If you need to change from Torino to another city:

1. Open `address-torino-patch.js`
2. Modify lines 12-13:
   ```javascript
   const DEFAULT_CITY = 'YourCity';
   const DEFAULT_COUNTRY = 'Italy';
   ```
3. Save and reload the website

---

## Testing the Integration

### Test Page Available

**URL**: http://localhost:5173/verify-address-validation.html

This page now defaults to Torino addresses and allows you to test:
- Restaurant address in Torino
- Customer addresses in Torino
- Distance calculations within the city
- Delivery zone validation

### Manual Testing Steps

1. **Open the website** and go to checkout
2. **Add items to cart** and proceed to delivery
3. **Enter a Torino address** without specifying the city:
   - Example: `Via Garibaldi 15`
4. **Check browser console** (F12 → Console tab)
5. **Look for log messages**:
   ```
   🇮🇹 Torino Address Patch: Initializing...
   📍 Normalized address: Via Garibaldi 15, Torino, Italy
   ```
6. **Verify distance calculation** works correctly

### Console Logs to Expect

When the patch is working correctly, you'll see:

```
🇮🇹 Torino Address Patch: Initializing...
✅ Torino Address Patch: Initialized successfully
📍 Default location: Torino, Italy
🗺️ Patching Google Maps Geocoder for Torino...
✅ Geocoder patched successfully
✅ Distance Matrix Service patched successfully
```

When an address is normalized:

```
📍 Normalized address: Via Roma 10, Torino, Italy
🔄 Geocoding request intercepted:
   Original: Via Roma 10
   Modified: Via Roma 10, Torino, Italy
```

---

## Benefits

### ✅ For Customers
- **Simpler checkout**: Just enter street and number
- **Faster ordering**: No need to type full city/country
- **Less errors**: System ensures correct location
- **Better UX**: Clear indication that service is Torino-based

### ✅ For Restaurant
- **Accurate delivery zones**: All addresses correctly located in Torino
- **Reduced errors**: No confusion with same street names in other cities
- **Better distance calculation**: More precise delivery estimates
- **Automatic validation**: System handles address normalization

### ✅ For System
- **Consistent geocoding**: All addresses use same format
- **Reliable API calls**: Reduced geocoding failures
- **Better caching**: Similar addresses normalized the same way
- **Easier debugging**: Clear logs show address transformations

---

## Troubleshooting

### Issue: Addresses Not Being Normalized

**Check:**
1. Browser console for error messages
2. Script is loaded: View page source, look for `address-torino-patch.js`
3. Google Maps API is loading correctly

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Check console for script loading errors

### Issue: Wrong City Being Used

**Check:**
1. Open `address-torino-patch.js`
2. Verify `DEFAULT_CITY = 'Torino'`
3. Check console logs show correct city

**Solution:**
- Edit the configuration in `address-torino-patch.js`
- Save and reload

### Issue: Console Shows Errors

**Common errors:**
```
❌ Google Maps API not loaded
```
**Solution**: Wait for Google Maps to load, or check API key

```
⚠️ Error parsing Google Maps URL
```
**Solution**: Check that addresses are strings, not objects

### Issue: Distance Calculation Fails

**Check:**
1. Restaurant address is set in Admin Panel
2. Restaurant address includes Torino
3. Both addresses are being normalized

**Solution:**
- Set restaurant address: "Your Address, Torino, Italy"
- Test with verify-address-validation.html
- Check console logs for normalization

---

## Restaurant Configuration

### Setting Your Restaurant Address

1. **Go to Admin Panel** → Shipping Zones
2. **Enter restaurant address** in Torino:
   - ✅ Good: `Via Roma 123, Torino, Italia`
   - ✅ Good: `Via Roma 123, 10121 Torino`
   - ❌ Bad: `Via Roma 123` (too vague)
3. **Click "Set Restaurant Location"**
4. **Verify coordinates** are saved (non-zero lat/lng)

### Recommended Settings for Torino

```
Restaurant Address: [Your actual address], Torino, Italia
Maximum Delivery Distance: 10-15 km (covers most of Torino)
Delivery Fee: €3-5 base fee
Free Delivery Threshold: €30-50
```

### Torino Delivery Zones Reference

Typical delivery distances in Torino:
- **City Center**: 0-3 km
- **Near Suburbs**: 3-7 km
- **Far Suburbs**: 7-15 km
- **Outside City**: 15+ km (usually not covered)

---

## Address Format Guidelines

### Recommended Format for Customers

Encourage customers to enter addresses in this format:
```
Via/Corso/Piazza [Name] [Number]
```

Examples:
- `Via Garibaldi 15`
- `Corso Francia 230`
- `Piazza Castello 1`

### Optional Additional Information

Customers can also include:
- Apartment/Floor: `Via Roma 10, Interno 5`
- Postal code: `Via Roma 10, 10121`
- Building name: `Via Roma 10, Palazzo Rossi`

The system will automatically add ", Torino, Italy" to all formats.

---

## API Impact

### Geocoding Requests

**Before Torino patch:**
- Request: `Via Roma 10`
- Result: Could match any "Via Roma 10" in Italy (ambiguous)
- Accuracy: Low

**After Torino patch:**
- Request: `Via Roma 10, Torino, Italy`
- Result: Specifically matches Via Roma 10 in Torino
- Accuracy: High

### Distance Calculations

**Before:**
- Ambiguous addresses could calculate wrong distances
- Possible matches in wrong cities

**After:**
- All distances calculated within Torino
- Accurate delivery estimates
- Consistent delivery zone validation

---

## Maintenance

### Regular Checks

**Monthly:**
- Test address validation with verify-address-validation.html
- Check console logs for errors
- Verify Google Maps API usage/costs

**After Updates:**
- Test checkout flow with Torino addresses
- Verify patch script still loads correctly
- Check console for normalization logs

### Updating the Patch

If you need to modify the patch:

1. Edit `address-torino-patch.js`
2. Test changes with verify-address-validation.html
3. Clear browser cache
4. Test in production checkout

---

## Files Modified

### New Files Created
- ✅ `address-torino-patch.js` - Main patch script
- ✅ `TORINO_ADDRESS_CONFIGURATION.md` - This documentation

### Files Modified
- ✅ `index.html` - Added script tag for patch
- ✅ `verify-address-validation.html` - Updated defaults to Torino

### Files Not Modified
- ✅ `assets/main-*.js` - No changes needed (patch intercepts)
- ✅ `assets/shippingzonemanager-*.js` - No changes needed

---

## Summary

✅ **All addresses are now automatically configured for Torino, Italy**

**What customers see:**
- Simpler address input (just street and number)
- Helper text indicating Torino location
- Faster checkout process

**What happens behind the scenes:**
- Automatic ", Torino, Italy" appended to all addresses
- Accurate geocoding for Torino locations
- Precise distance calculations within the city
- Reliable delivery zone validation

**What you need to do:**
1. Set your restaurant address in Admin Panel (include Torino)
2. Test with verify-address-validation.html
3. Configure delivery zones for Torino area
4. Monitor and adjust as needed

---

**Configuration Date**: November 11, 2025  
**Status**: ✅ Active and Ready  
**Default City**: Torino, Italy  
**Next Action**: Test with verify-address-validation.html
