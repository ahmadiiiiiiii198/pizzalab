# 🌾 Table Reservation System - Complete Setup Guide

## 📋 Overview
This reservation system allows customers to book tables online with admin confirmation and automatic email notifications.

## 🗄️ Database Setup

### Step 1: Run the SQL Script in Supabase

1. **Open your Supabase Dashboard**
   - Go to: https://jncuwwavffepnajxvjxq.supabase.co
   - Navigate to **SQL Editor**

2. **Execute the Reservation System Script**
   - Open the file: `database_scripts/create_reservations_system.sql`
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created**
   - Check that these tables exist:
     - `reservations` - Main reservation data
     - `reservation_status_history` - Status change tracking
     - `reservation_notifications` - Email notification queue
     - `table_configuration` - Restaurant table setup

### Step 2: Generate TypeScript Types

After creating the database tables, regenerate TypeScript types:

```bash
# Option 1: Using Supabase CLI (if installed)
npx supabase gen types typescript --project-id jncuwwavffepnajxvjxq > src/integrations/supabase/types.ts

# Option 2: Manual update
# Go to Supabase Dashboard > API Docs > TypeScript
# Copy the generated types and update src/integrations/supabase/types.ts
```

## 🎨 Frontend Components Created

### 1. Customer-Facing Components

#### `TableReservationForm.tsx`
- **Location**: `src/components/TableReservationForm.tsx`
- **Purpose**: Customer reservation form
- **Features**:
  - Date and time selection
  - Guest count (1-20 people)
  - Table preference (indoor/outdoor/window/private)
  - Special occasion selection
  - Special requests textarea
  - Real-time validation
  - Wheat-themed styling

#### `ReservationsPage.tsx`
- **Location**: `src/pages/ReservationsPage.tsx`
- **Purpose**: Full reservation page with form and info
- **Features**:
  - Hero section with wheat theme
  - Reservation form integration
  - Information cards
  - Contact options for urgent bookings

### 2. Admin Components

#### `ReservationsAdmin.tsx`
- **Location**: `src/components/admin/ReservationsAdmin.tsx`
- **Purpose**: Admin panel for managing reservations
- **Features**:
  - View all reservations with filters
  - Pending/Confirmed/Rejected status filtering
  - Real-time updates via Supabase subscriptions
  - Confirm/Reject reservations
  - Add admin notes
  - Automatic email notifications
  - Status badges and visual indicators

## 🔧 Integration Steps

### Step 3: Add Reservations to Admin Panel

The `PizzeriaAdminPanel.tsx` has been updated to include Calendar icon import. Now add the reservations section:

1. Find the `adminSections` array in `PizzeriaAdminPanel.tsx`
2. Add this entry after the 'stock' section:

```typescript
{
  id: 'reservations',
  label: 'Prenotazioni',
  icon: Calendar,
  description: 'Gestione prenotazioni tavoli',
  category: 'core'
},
```

3. Add the TabsContent section:

```typescript
<TabsContent value="reservations" id="admin-section-reservations">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        Gestione Prenotazioni Tavoli
      </CardTitle>
      <CardDescription>
        Visualizza e gestisci le richieste di prenotazione tavoli
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Suspense fallback={<LoadingSpinner />}>
        <ReservationsAdmin />
      </Suspense>
    </CardContent>
  </Card>
</TabsContent>
```

### Step 4: Add Reservation Route

Add the reservation page route to your routing configuration:

```typescript
// In your router file (e.g., App.tsx or routes.tsx)
import { ReservationsPage } from '@/pages/ReservationsPage';

// Add route:
<Route path="/prenota" element={<ReservationsPage />} />
<Route path="/reservations" element={<ReservationsPage />} />
```

### Step 5: Add Navigation Link

Add a link to the reservation page in your Header or navigation:

```typescript
<a href="/prenota" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--country-dark)'}}>
  Prenota Tavolo
  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
</a>
```

## 📧 Email Notification System

### How It Works

1. **Customer Submits Reservation**
   - Form creates reservation with status='pending'
   - Notification record created with delivery_status='pending'

2. **Admin Reviews Reservation**
   - Admin sees reservation in admin panel
   - Can confirm or reject with optional notes

3. **Automatic Email Notification**
   - When admin confirms/rejects, notification record is created
   - Email includes:
     - Reservation number
     - Date, time, guest count
     - Confirmation or rejection message
     - Admin notes (if any)

4. **Email Integration Options**

You need to set up one of these email services:

#### Option A: Supabase Email (Recommended)
```sql
-- Enable Supabase Auth emails
-- Go to Supabase Dashboard > Authentication > Email Templates
-- Configure SMTP settings
```

#### Option B: SendGrid Integration
```typescript
// Install SendGrid
npm install @sendgrid/mail

// Create email service
// src/lib/email-service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendReservationEmail = async (to: string, subject: string, html: string) => {
  await sgMail.send({
    to,
    from: 'noreply@pizzalab.it',
    subject,
    html
  });
};
```

#### Option C: Resend (Modern Alternative)
```typescript
// Install Resend
npm install resend

// Create email service
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

## 🎯 Features Implemented

### Customer Features
- ✅ **Online Reservation Form** - Easy booking interface
- ✅ **Date & Time Selection** - Up to 3 months in advance
- ✅ **Guest Count** - 1-20 people
- ✅ **Table Preferences** - Indoor/Outdoor/Window/Private
- ✅ **Special Occasions** - Birthday, Anniversary, etc.
- ✅ **Special Requests** - Allergies, high chairs, decorations
- ✅ **Reservation Number** - Unique tracking number
- ✅ **Email Confirmation** - Automatic notification

### Admin Features
- ✅ **Reservation Dashboard** - View all reservations
- ✅ **Status Filtering** - Pending/Confirmed/Rejected
- ✅ **Real-time Updates** - Live reservation feed
- ✅ **Quick Actions** - Confirm/Reject buttons
- ✅ **Admin Notes** - Add notes for customers
- ✅ **Email Notifications** - Automatic on status change
- ✅ **Status History** - Track all changes
- ✅ **Statistics** - Pending and confirmed counts

### Database Features
- ✅ **Unique Reservation Numbers** - Auto-generated
- ✅ **Status Tracking** - Complete lifecycle
- ✅ **Audit Trail** - Status history logging
- ✅ **Email Queue** - Notification management
- ✅ **Table Management** - Configure available tables
- ✅ **Availability Check** - Function to check table availability
- ✅ **RLS Policies** - Secure data access
- ✅ **Indexes** - Optimized queries

## 🚀 Quick Start

### For Customers:
1. Visit `/prenota` or `/reservations`
2. Fill out the reservation form
3. Submit and receive reservation number
4. Wait for email confirmation (within 24 hours)

### For Admins:
1. Go to Admin Panel
2. Click "Prenotazioni" tab
3. View pending reservations
4. Click "Dettagli" to review
5. Confirm or Reject with optional notes
6. Customer receives automatic email notification

## 📊 Database Schema

### Reservations Table
```sql
- id (UUID, PK)
- reservation_number (TEXT, UNIQUE)
- customer_name, customer_email, customer_phone
- reservation_date, reservation_time
- number_of_guests (1-20)
- table_preference (indoor/outdoor/window/private/any)
- status (pending/confirmed/rejected/cancelled/completed/no_show)
- special_requests, occasion, notes
- Email tracking fields
- Timestamps
```

### Reservation Status History
```sql
- Tracks all status changes
- Records who made the change
- Includes reason and notes
```

### Reservation Notifications
```sql
- Email notification queue
- Tracks delivery status
- Stores email content
```

### Table Configuration
```sql
- Manage restaurant tables
- Capacity and location
- Active/inactive status
```

## 🎨 Styling

All components use the wheat countryside theme:
- **Primary Buttons**: `wheat-btn-primary` - Golden wheat gradients
- **Secondary Buttons**: `wheat-btn-secondary` - Cream wheat gradients
- **Form Inputs**: Wheat-themed borders and focus states
- **Status Badges**: Color-coded for each status
- **Cards**: Wheat cream backgrounds with golden borders

## 🔔 Notification Flow

```
Customer Submits → Pending Status → Admin Reviews → Confirm/Reject
                                                           ↓
                                                    Email Sent
                                                           ↓
                                                    Customer Notified
```

## 🛠️ Customization

### Modify Time Slots
Edit `TableReservationForm.tsx` line ~210 to add/remove time slots

### Modify Table Configuration
Update `create_reservations_system.sql` initial data section or use admin panel (future feature)

### Customize Email Templates
Modify email messages in `ReservationsAdmin.tsx` updateReservationStatus function

## ⚠️ Important Notes

1. **Run SQL Script First** - Database tables must exist before using components
2. **Regenerate Types** - After running SQL, regenerate TypeScript types
3. **Email Service** - Configure email service for notifications to work
4. **Admin Access** - Only authenticated admins can manage reservations
5. **RLS Policies** - Ensure proper security policies are in place

## 🎯 Next Steps

1. ✅ Run `create_reservations_system.sql` in Supabase
2. ✅ Regenerate TypeScript types
3. ✅ Add reservations tab to admin panel
4. ✅ Add route for `/prenota` page
5. ✅ Configure email service
6. ✅ Test complete flow
7. ✅ Add navigation link to header

## 📞 Support

For issues or questions:
- Check Supabase logs for database errors
- Check browser console for frontend errors
- Verify email service configuration
- Ensure RLS policies are correct

---

**System Status**: ✅ Ready for deployment after database setup and type regeneration
