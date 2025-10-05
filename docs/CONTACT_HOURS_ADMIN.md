# Contact and Hours Admin Management

## Overview
The new **Contact and Hours Manager** allows administrators to edit contact information and opening hours (orari) directly from the admin panel. This affects both the footer and contact sections of the website.

## Features

### 📞 Contact Information Management
- **Address**: Physical location of the pizzeria
- **Phone**: Contact phone number
- **Email**: Contact email address
- **Map URL**: Google Maps link for location
- **Background Image**: Optional background image for contact section

### 🕐 Business Hours Management
- **Daily Schedule**: Set opening and closing times for each day
- **Open/Closed Toggle**: Mark specific days as closed
- **Automatic Sync**: Hours automatically sync with contact information
- **Real-time Updates**: Changes appear immediately on the website

## How to Access

1. Go to the **Admin Panel** (`/admin`)
2. Navigate to the **"Contatti e Orari"** tab in the content management section
3. Use the two tabs to manage different aspects:
   - **"Informazioni di Contatto"**: Edit contact details
   - **"Orari di Apertura"**: Manage business hours

## Usage Instructions

### Editing Contact Information

1. **Address Field**: Enter the complete address
   ```
   Example: Via Innovation, 1, 10100 Torino TO
   ```

2. **Phone Field**: Include country code
   ```
   Example: +393479190907
   ```

3. **Email Field**: Business email address
   ```
   Example: info@pizzalab.it
   ```

4. **Map URL**: Google Maps link
   ```
   Example: https://maps.google.com/...
   ```

5. **Hours Text**: This field is automatically updated when you change business hours, but can be manually edited if needed.

### Managing Business Hours

1. **Toggle Days**: Use the switch to mark days as open/closed
2. **Set Times**: Use time pickers for opening and closing times
3. **Consistent Format**: Times are in 24-hour format (e.g., 18:30)
4. **Auto-Sync**: Changes automatically update the contact hours text

### Saving Changes

- **Save Contact Info**: Saves only contact information
- **Save Business Hours**: Saves hours and syncs with contact info
- **Save All**: Saves everything at once (recommended)

## Database Structure

### Contact Content (`contactContent`)
```json
{
  "address": "Via Innovation, 1, 10100 Torino TO",
  "phone": "+393479190907", 
  "email": "info@pizzalab.it",
  "mapUrl": "https://maps.google.com",
  "hours": "Formatted hours string",
  "backgroundImage": "Optional image URL"
}
```

### Business Hours (`businessHours`)
```json
{
  "monday": {
    "isOpen": true,
    "openTime": "18:30",
    "closeTime": "22:30"
  },
  "tuesday": {
    "isOpen": true,
    "openTime": "18:30", 
    "closeTime": "22:30"
  },
  // ... for each day of the week
}
```

## Frontend Integration

### Components That Use This Data

1. **Footer Component** (`src/components/Footer.tsx`)
   - Displays contact information
   - Shows formatted business hours
   - Real-time updates via Supabase subscriptions

2. **Contact Section** (`src/components/Contact.tsx`)
   - Shows contact details
   - Displays business hours
   - Uses contact information for forms

3. **Contact Section** (`src/components/ContactSection.tsx`)
   - Alternative contact display
   - Uses same data source

### Real-time Updates

The system uses Supabase real-time subscriptions to automatically update the frontend when administrators make changes. No page refresh is required.

## Technical Implementation

### Files Created/Modified

1. **New Admin Component**: `src/components/admin/ContactHoursManager.tsx`
2. **Admin Panel Integration**: Updated `src/components/admin/PizzeriaAdminPanel.tsx`
3. **Database Setup**: `database_scripts/setup_contact_hours_admin.sql`

### Key Features

- **Dual Management**: Separate tabs for contact info and business hours
- **Automatic Synchronization**: Business hours automatically generate formatted text
- **Real-time Preview**: Changes appear immediately on the website
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Works on all device sizes

## Troubleshooting

### Common Issues

1. **Changes Not Appearing**: Check browser cache, try hard refresh
2. **Save Errors**: Check database connection and permissions
3. **Time Format Issues**: Use 24-hour format (HH:MM)

### Verification

To verify the setup is working:

1. Check the admin panel loads the current data
2. Make a test change and verify it appears on the website
3. Check both footer and contact sections update

## Future Enhancements

Potential improvements for future versions:

- **Holiday Hours**: Special hours for holidays
- **Multiple Locations**: Support for multiple restaurant locations
- **Time Zone Support**: Automatic time zone handling
- **Bulk Operations**: Copy hours across multiple days
- **Templates**: Save and apply hour templates

## Support

For technical support or questions about this feature, refer to the main project documentation or contact the development team.
