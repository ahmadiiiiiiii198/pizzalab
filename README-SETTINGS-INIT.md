# 🔧 Database Settings Initialization Guide

## Problem
Background images and some settings are not showing because the database is missing required settings entries.

## Quick Fix - Run the Script

### Option 1: Using npm script (Recommended)
```bash
npm run init-settings
```

or

```bash
npm run fix-db
```

### Option 2: Direct execution
```bash
node initialize-settings.js
```

## What the Script Does

The script will automatically create all missing settings in your Supabase database:

### Settings Created:
- ✅ `flegreaPizzaContent` - Flegrea Pizza section settings
- ✅ `servicesContent` - Services section settings
- ✅ `chiSiamoContent` - About Us section settings
- ✅ `whyChooseUsContent` - Why Choose Us section settings
- ✅ `productsContent` - Products/Menu section settings
- ✅ `aboutContent` - About section settings
- ✅ `galleryContent` - Gallery section settings
- ✅ `contactContent` - Contact section settings
- ✅ `youtubeSectionContent` - YouTube section settings
- ✅ `pizzeriaDisplayHours` - Display hours settings
- ✅ `shippingZoneSettings` - Shipping zone settings
- ✅ `deliveryZones` - Delivery zones settings

Each setting is created with:
- Default heading and subheading
- Empty `backgroundImage` field (ready for upload)
- Appropriate default values

## Prerequisites

Make sure you have a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## After Running the Script

1. **Go to Admin Panel** → Backgrounds tab
2. **Upload background images** for each section
3. **Hard refresh the frontend** (Ctrl+Shift+R or Cmd+Shift+R)
4. **Verify backgrounds are visible**

## Troubleshooting

### Script fails with "Missing Supabase credentials"
- Check your `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Script shows "already exists" for all settings
- Settings are already initialized
- Go directly to Admin Panel to upload backgrounds

### Background images still not showing after upload
1. Run diagnostic test in Admin Panel → Backgrounds → "Run Diagnostic Test"
2. Click "Fix URLs" if needed
3. Click "Fix MIME Types" in Section Background Manager
4. Hard refresh browser

## Manual Alternative

If you prefer to use the admin panel:
1. Go to **Admin Panel** → **Backgrounds** tab
2. Click **"Initialize Missing Settings"** (green button)
3. Wait for completion
4. Upload backgrounds

## Script Output Example

```
🚀 Starting settings initialization...

🔍 Checking flegreaPizzaContent...
   ➕ Creating flegreaPizzaContent...
   ✅ Created flegreaPizzaContent

🔍 Checking servicesContent...
   ➕ Creating servicesContent...
   ✅ Created servicesContent

...

============================================================
📊 INITIALIZATION SUMMARY
============================================================
✅ Created: 12
   - flegreaPizzaContent
   - servicesContent
   - chiSiamoContent
   ...

ℹ️  Already existed: 0

❌ Errors: 0

============================================================
✅ Initialization completed successfully!

📝 Next steps:
   1. Go to Admin Panel → Backgrounds tab
   2. Upload background images for each section
   3. Hard refresh the frontend (Ctrl+Shift+R)
```

## Support

If you encounter any issues:
1. Check the console output for specific errors
2. Verify Supabase connection
3. Check database permissions
4. Review the error messages in the script output
