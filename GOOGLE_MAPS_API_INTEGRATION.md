# Google Maps API Integration for Address Validation

## Current Status

✅ **API Key is configured**: `AIzaSyBkHCjFa0GKD7lJThAyFnSaeCXFDsBtJhs`

The API key is already integrated in the shipping zone manager (`shippingzonemanager-czataj91.js`).

## What the API Key is Used For

1. **Restaurant Location Geocoding** - Converting restaurant address to coordinates
2. **Distance Calculation** - Calculating distance between restaurant and delivery address
3. **Delivery Zone Validation** - Checking if customer address is within delivery range
4. **Address Validation** - Verifying customer addresses are valid and deliverable

## Current Implementation

The system uses the Google Maps API in the following ways:

### 1. Distance Matrix API
- Calculates actual driving distance between restaurant and customer
- Used for delivery fee calculation
- Validates if address is within maximum delivery distance

### 2. Geocoding API
- Converts text addresses to latitude/longitude coordinates
- Validates address format and existence
- Ensures accurate location data

### 3. Address Validation
When a customer enters a delivery address during checkout:
- The address is geocoded to get coordinates
- Distance is calculated from restaurant to customer
- System checks if distance is within configured delivery zones
- Delivery fee is calculated based on distance
- Order is accepted or rejected based on delivery area

## Configuration in Shipping Zone Manager

The shipping zone settings include:
- `restaurantAddress`: Base location for distance calculations
- `restaurantLat` & `restaurantLng`: Restaurant coordinates
- `maxDeliveryDistance`: Maximum delivery radius (in km)
- `deliveryFee`: Base delivery fee
- `freeDeliveryThreshold`: Minimum order for free delivery
- `googleMapsApiKey`: The API key for Google Maps services

## Required Google Cloud APIs

Ensure these APIs are enabled in your Google Cloud Console:
1. ✅ **Distance Matrix API** - For distance calculations
2. ✅ **Geocoding API** - For address validation
3. ✅ **Maps JavaScript API** - For interactive maps (if used)
4. ✅ **Places API** - For address autocomplete (optional)

## Testing the Integration

Use the test page created: `test-google-maps-api.html`

This page will:
- Load the Google Maps API with your key
- Test distance calculation between two addresses
- Verify API key validity and quota
- Display detailed error messages if issues exist

## API Key Security Notes

⚠️ **IMPORTANT**: The API key is currently exposed in client-side code. For production:

1. **Add API Key Restrictions** in Google Cloud Console:
   - HTTP referrers (websites): Add your domain
   - Example: `*.yourdomain.com/*`, `localhost:*`

2. **Enable only required APIs**:
   - Distance Matrix API
   - Geocoding API
   - Maps JavaScript API

3. **Set Usage Quotas** to prevent unexpected charges

4. **Monitor Usage** regularly in Google Cloud Console

## How Address Validation Works in Checkout

```
Customer enters address
        ↓
Address sent to Google Geocoding API
        ↓
Coordinates returned (lat, lng)
        ↓
Distance calculated using Distance Matrix API
        ↓
Check if distance ≤ maxDeliveryDistance
        ↓
If YES: Calculate delivery fee, allow order
If NO: Show "Address outside delivery area" error
```

## Troubleshooting

### If address validation fails:
1. Check API key is valid (use test page)
2. Verify Distance Matrix API is enabled
3. Check API key restrictions allow your domain
4. Verify restaurant address is set correctly
5. Check browser console for API errors

### Common Error Messages:
- `REQUEST_DENIED`: API key invalid or API not enabled
- `OVER_QUERY_LIMIT`: Exceeded daily quota
- `INVALID_REQUEST`: Malformed request
- `ZERO_RESULTS`: Address not found

## Next Steps

To verify everything is working:
1. ✅ Open `test-google-maps-api.html` in browser
2. ✅ Test with real addresses
3. ✅ Check admin panel → Shipping Zones
4. ✅ Verify restaurant address is set
5. ✅ Test checkout with delivery address
6. ✅ Confirm distance calculation works

## API Usage Costs

Google Maps Platform pricing (as of 2024):
- Distance Matrix API: $5 per 1,000 requests
- Geocoding API: $5 per 1,000 requests
- First $200/month is FREE (covers ~40,000 requests)

Monitor usage at: https://console.cloud.google.com/google/maps-apis/metrics
