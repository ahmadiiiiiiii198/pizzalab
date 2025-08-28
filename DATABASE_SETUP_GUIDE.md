# Pizzeria Regina 2000 - Database Setup Guide

This guide provides step-by-step instructions to recreate the complete database structure for Pizzeria Regina 2000 in a new Supabase project.

## Prerequisites

1. **New Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Project Access**: Ensure you have admin access to the Supabase dashboard
3. **SQL Editor Access**: You'll need access to the SQL Editor in Supabase

## Setup Files Overview

This setup consists of 4 main files that must be executed in order:

1. **`DATABASE_SETUP_SCRIPT.sql`** - Core tables, indexes, and RLS enablement
2. **`DATABASE_POLICIES_AND_FUNCTIONS.sql`** - RLS policies and database functions
3. **`DATABASE_STORAGE_AND_DATA.sql`** - Storage buckets, triggers, and initial data
4. **`DATABASE_DOCUMENTATION.md`** - Complete reference documentation

## Step-by-Step Setup Instructions

### Step 1: Prepare Your Supabase Project

1. **Create New Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: "pizzeria-regina-2000"
   - Choose a region close to your users
   - Generate a strong database password
   - Click "Create new project"

2. **Wait for Project Initialization**:
   - Wait for the project to be fully created (usually 2-3 minutes)
   - Note down your project URL and anon key for later use

### Step 2: Execute Database Setup Scripts

#### 2.1 Run Core Database Setup

1. **Open SQL Editor**:
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Execute Main Setup Script**:
   - Copy the entire contents of `DATABASE_SETUP_SCRIPT.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute
   - **Expected result**: All tables, indexes, and enums created successfully

#### 2.2 Run Policies and Functions Setup

1. **Create New Query**:
   - Click "New query" in SQL Editor

2. **Execute Policies Script**:
   - Copy the entire contents of `DATABASE_POLICIES_AND_FUNCTIONS.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute
   - **Expected result**: All RLS policies and database functions created

#### 2.3 Run Storage and Data Setup

1. **Create New Query**:
   - Click "New query" in SQL Editor

2. **Execute Storage Script**:
   - Copy the entire contents of `DATABASE_STORAGE_AND_DATA.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute
   - **Expected result**: Storage buckets created, triggers set up, initial data inserted

### Step 3: Verify Setup

#### 3.1 Check Tables
Run this query to verify all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables** (18 total):
- admin_activity_log
- admin_sessions
- categories
- category_sections
- comments
- content_sections
- gallery_images
- order_items
- order_notifications
- order_status_history
- orders
- products
- profiles
- settings
- site_content
- user_profiles
- user_roles
- youtube_videos

#### 3.2 Check Storage Buckets
1. Go to "Storage" in your Supabase dashboard
2. Verify these buckets exist:
   - uploads
   - admin-uploads
   - gallery
   - specialties

#### 3.3 Check Settings Data
Run this query to verify initial settings were inserted:
```sql
SELECT key, jsonb_pretty(value) as value 
FROM settings 
ORDER BY key;
```

**Expected settings** (15+ entries):
- aboutContent
- adminSecuritySettings
- adminUISettings
- businessHours
- contactContent
- deliverySettings
- galleryContent
- galleryImages
- heroContent
- logoSettings
- menuSettings
- paymentSettings
- popups
- reservations
- restaurantSettings
- weOfferContent

#### 3.4 Check Functions
Run this query to verify functions were created:
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

**Expected functions**:
- cleanup_expired_admin_sessions
- create_admin_session
- create_user_profile
- delete_order_cascade
- has_role
- invalidate_admin_session
- log_admin_activity
- trigger_cleanup_sessions
- update_content_sections_updated_at
- update_order_status
- update_settings_updated_at
- update_user_profiles_updated_at
- validate_admin_session

### Step 4: Configure Application Connection

#### 4.1 Get Connection Details
1. Go to "Settings" → "API" in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **Anon Key**: Your public anonymous key
   - **Service Role Key**: Your service role key (keep this secret)

#### 4.2 Update Application Configuration
Update your application's Supabase configuration:

```typescript
// src/lib/supabase.ts or similar
const SUPABASE_URL = 'https://[your-project-id].supabase.co';
const SUPABASE_ANON_KEY = '[your-anon-key]';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

### Step 5: Test the Setup

#### 5.1 Test Database Connection
Create a simple test to verify the connection:

```typescript
// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('Database connection successful!');
    return true;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
};
```

#### 5.2 Test Storage Access
Test file upload to verify storage buckets:

```typescript
// Test storage upload
const testStorage = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('uploads')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('Storage access failed:', error);
      return false;
    }
    
    console.log('Storage access successful!');
    return true;
  } catch (err) {
    console.error('Storage test failed:', err);
    return false;
  }
};
```

## Troubleshooting

### Common Issues

1. **"relation does not exist" errors**:
   - Ensure you ran all scripts in the correct order
   - Check that the script executed without errors

2. **RLS policy errors**:
   - Verify that RLS is enabled on all tables
   - Check that policies were created correctly

3. **Storage bucket access issues**:
   - Verify buckets were created in the Storage section
   - Check that storage policies are in place

4. **Function execution errors**:
   - Ensure all functions were created successfully
   - Check function permissions and security settings

### Verification Queries

If you encounter issues, use these queries to diagnose:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Next Steps

After successful setup:

1. **Configure Authentication**: Set up your authentication providers in Supabase Auth settings
2. **Add Sample Data**: Insert sample categories and products for testing
3. **Test Application**: Run your application and verify all features work
4. **Set Up Monitoring**: Configure logging and monitoring for production use
5. **Backup Strategy**: Set up regular database backups

## Support

If you encounter issues during setup:

1. Check the `DATABASE_DOCUMENTATION.md` file for detailed schema information
2. Review the SQL scripts for any syntax errors
3. Verify your Supabase project has the latest features enabled
4. Check Supabase documentation for any recent changes

## Security Notes

- **Never commit your service role key** to version control
- **Use environment variables** for all sensitive configuration
- **Regularly rotate your API keys** for production environments
- **Monitor admin activity logs** for security auditing
- **Keep your Supabase project updated** with the latest security patches

This setup provides a complete, production-ready database structure for the Pizzeria Regina 2000 application with proper security, performance optimizations, and comprehensive functionality.
