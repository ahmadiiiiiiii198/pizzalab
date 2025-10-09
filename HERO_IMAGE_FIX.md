# Hero Section Image Persistence Fix

## Problem
When uploading a new hero section background image in the admin panel, the image would disappear after a page refresh and revert to the previous image.

## Root Cause
The issue was in the `useHeroContent` hook (`src/hooks/use-settings.tsx`):

1. **Stale Cache Priority**: The hook was returning `heroContentCache || content` (line 337), which prioritized the localStorage cache over fresh database content
2. **Cache Not Cleared on Update**: When updating hero content, the localStorage cache wasn't being properly invalidated
3. **Preload Using Old Cache**: The `preloadHeroContent()` function would load stale data from localStorage on page load

## Solution Implemented

### Changes to `src/hooks/use-settings.tsx`

1. **Created Cache-Clearing Update Wrapper**:
   - Added `updateContentWithCacheClear` function that:
     - Clears both memory cache (`heroContentCache`) and localStorage cache
     - Updates the database
     - Refreshes the cache with new values after successful update

2. **Prioritize Database Content**:
   - Changed return statement from `[heroContentCache || content, ...]` to `[content, ...]`
   - Now always returns fresh database content, not cached content
   - Cache is only used for initial fast loading, then replaced with database content

3. **Auto-Sync Cache with Database**:
   - Added useEffect that updates the cache whenever fresh database content is loaded
   - Ensures cache stays in sync with database

## How It Works Now

### Upload Flow:
1. User uploads image via ImageUploader → Gets Supabase Storage URL
2. ImageUploader calls `onImageSelected(url)` → Updates local state
3. User clicks "Save" → Calls `updateContentWithCacheClear()`
4. Function clears cache → Saves to database → Updates cache with new value
5. Page refreshes → Loads fresh data from database

### Load Flow:
1. Page loads → `preloadHeroContent()` checks localStorage cache
2. If cache is fresh (< 5 min), uses it for fast initial render
3. `useSetting` hook fetches fresh data from database
4. Fresh database data replaces cache
5. Hero component receives fresh data and displays correct image

## Testing
To verify the fix works:
1. Go to admin panel
2. Upload a new hero background image
3. Click "Save Changes"
4. Refresh the page
5. ✅ New image should persist

## Files Modified
- `src/hooks/use-settings.tsx` - Fixed cache management in `useHeroContent` hook

## Related Components
- `src/components/Hero.tsx` - Displays the hero section with background image
- `src/components/admin/HeroContentEditor.tsx` - Admin interface for editing hero content
- `src/components/admin/ImageUploader.tsx` - Handles image uploads to Supabase Storage
- `src/services/settingsService.ts` - Database operations for settings
