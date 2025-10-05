# Pizzeria Regina 2000 - Complete Database Documentation

## Database Configuration
- **Project ID**: foymsziaullphulzhmxy
- **Supabase URL**: https://foymsziaullphulzhmxy.supabase.co
- **Database Type**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth with RLS (Row Level Security)

## Storage Buckets

### 1. uploads
- **ID**: uploads
- **Public**: true
- **File Size Limit**: NULL (unlimited)
- **Allowed MIME Types**: 
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml

### 2. admin-uploads
- **ID**: admin-uploads
- **Public**: true
- **File Size Limit**: NULL (unlimited)
- **Allowed MIME Types**: 
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml

### 3. gallery
- **ID**: gallery
- **Public**: true
- **File Size Limit**: NULL (unlimited)
- **Allowed MIME Types**: 
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml

### 4. specialties
- **ID**: specialties
- **Public**: true
- **File Size Limit**: NULL (unlimited)
- **Allowed MIME Types**: 
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml

## Database Tables

### 1. settings
**Purpose**: Core application settings and configuration
**Columns**:
- key (TEXT, PRIMARY KEY)
- value (JSONB)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indexes**:
- idx_settings_key ON settings(key)
- idx_settings_updated_at ON settings(updated_at)

**RLS Policies**:
- "Allow public read access to settings" (SELECT for all)
- "Allow authenticated users to update settings" (UPDATE for authenticated)
- "Allow authenticated users to insert settings" (INSERT for authenticated)
- "Allow authenticated users to delete settings" (DELETE for authenticated)

**Triggers**:
- update_settings_updated_at (BEFORE UPDATE)

### 2. categories
**Purpose**: Product categories for pizzas and menu items
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- name (TEXT, NOT NULL)
- slug (TEXT, NOT NULL)
- description (TEXT)
- image_url (TEXT)
- is_active (BOOLEAN, DEFAULT true)
- labels (JSONB)
- sort_order (INTEGER)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 3. products
**Purpose**: Menu items (pizzas, drinks, etc.)
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- name (TEXT, NOT NULL)
- slug (TEXT)
- description (TEXT)
- price (DECIMAL(10,2), NOT NULL)
- compare_price (DECIMAL(10,2))
- category_id (UUID, FOREIGN KEY to categories.id)
- image_url (TEXT)
- gallery (JSONB)
- ingredients (TEXT[])
- allergens (TEXT[])
- is_vegetarian (BOOLEAN)
- is_vegan (BOOLEAN)
- is_gluten_free (BOOLEAN)
- is_active (BOOLEAN, DEFAULT true)
- is_featured (BOOLEAN, DEFAULT false)
- labels (TEXT[])
- meta_title (TEXT)
- meta_description (TEXT)
- preparation_time (INTEGER)
- calories (INTEGER)
- stock_quantity (INTEGER, DEFAULT 0)
- sort_order (INTEGER)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Relationships**:
- products.category_id → categories.id

### 4. orders
**Purpose**: Customer orders
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- order_number (TEXT, NOT NULL, UNIQUE)
- customer_name (TEXT, NOT NULL)
- customer_email (TEXT, NOT NULL)
- customer_phone (TEXT)
- customer_address (TEXT)
- user_id (UUID, FOREIGN KEY to auth.users.id)
- total_amount (DECIMAL(10,2), NOT NULL)
- delivery_type (TEXT)
- delivery_fee (DECIMAL(10,2))
- order_type (TEXT)
- order_status (TEXT)
- status (TEXT)
- payment_method (TEXT)
- payment_status (TEXT, DEFAULT 'pending')
- paid_amount (DECIMAL(10,2))
- paid_at (TIMESTAMP WITH TIME ZONE)
- stripe_session_id (TEXT)
- stripe_payment_intent_id (TEXT)
- shipping_address (JSONB)
- billing_address (JSONB)
- special_instructions (TEXT)
- notes (TEXT)
- estimated_delivery_time (TEXT)
- shipped_at (TIMESTAMP WITH TIME ZONE)
- delivered_at (TIMESTAMP WITH TIME ZONE)
- tracking_number (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indexes**:
- idx_orders_stripe_session_id ON orders(stripe_session_id)
- idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id)
- idx_orders_payment_status ON orders(payment_status)

### 5. order_items
**Purpose**: Individual items within orders
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- order_id (UUID, NOT NULL, FOREIGN KEY to orders.id)
- product_id (UUID, NOT NULL, FOREIGN KEY to products.id)
- product_name (TEXT, NOT NULL)
- quantity (INTEGER, NOT NULL)
- unit_price (DECIMAL(10,2))
- product_price (DECIMAL(10,2), NOT NULL)
- price (DECIMAL(10,2))
- subtotal (DECIMAL(10,2), NOT NULL)
- size (TEXT)
- toppings (TEXT[])
- special_requests (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Relationships**:
- order_items.order_id → orders.id
- order_items.product_id → products.id

### 6. order_notifications
**Purpose**: Notifications related to orders
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- order_id (UUID, NOT NULL, FOREIGN KEY to orders.id)
- notification_type (TEXT, NOT NULL)
- message (TEXT, NOT NULL)
- is_read (BOOLEAN, DEFAULT false)
- read_at (TIMESTAMP WITH TIME ZONE)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Relationships**:
- order_notifications.order_id → orders.id

### 7. order_status_history
**Purpose**: Track order status changes
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- order_id (UUID, NOT NULL, FOREIGN KEY to orders.id)
- status (TEXT, NOT NULL)
- notes (TEXT)
- created_by (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Relationships**:
- order_status_history.order_id → orders.id

### 8. user_profiles
**Purpose**: Extended user profile information
**Columns**:
- id (UUID, PRIMARY KEY, FOREIGN KEY to auth.users.id)
- email (TEXT, NOT NULL)
- full_name (TEXT)
- phone (TEXT)
- default_address (TEXT)
- preferences (JSONB, DEFAULT '{}')
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indexes**:
- idx_user_profiles_id ON user_profiles(id)
- idx_user_profiles_email ON user_profiles(email)
- idx_user_profiles_created_at ON user_profiles(created_at)
- idx_user_profiles_updated_at ON user_profiles(updated_at)

**RLS Policies**:
- "Users can view own profile" (SELECT for own records)
- "Users can insert own profile" (INSERT for own records)
- "Users can update own profile" (UPDATE for own records)
- "Authenticated users can view all profiles" (SELECT for authenticated)

**Triggers**:
- update_user_profiles_updated_at (BEFORE UPDATE)
- create_user_profile_trigger (AFTER INSERT on auth.users)

### 9. admin_sessions
**Purpose**: Admin authentication session management
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- session_token (TEXT, UNIQUE, NOT NULL)
- username (TEXT, NOT NULL)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- expires_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW() + INTERVAL '24 hours')
- last_activity (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- is_active (BOOLEAN, DEFAULT true)

**Indexes**:
- idx_admin_sessions_token ON admin_sessions(session_token)
- idx_admin_sessions_username ON admin_sessions(username)
- idx_admin_sessions_expires ON admin_sessions(expires_at)
- idx_admin_sessions_active ON admin_sessions(is_active)

**RLS Policies**:
- "Admin sessions are private" (ALL operations denied)

**Triggers**:
- cleanup_sessions_trigger (AFTER INSERT)

### 10. admin_activity_log
**Purpose**: Audit trail for admin activities
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- username (TEXT, NOT NULL)
- action (TEXT, NOT NULL)
- resource (TEXT)
- details (JSONB)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indexes**:
- idx_admin_activity_username ON admin_activity_log(username)
- idx_admin_activity_action ON admin_activity_log(action)
- idx_admin_activity_created ON admin_activity_log(created_at)

**RLS Policies**:
- "Admin activity log is private" (ALL operations denied)

### 11. content_sections
**Purpose**: Dynamic content sections for the website
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- section_key (TEXT, NOT NULL, UNIQUE)
- section_name (TEXT, NOT NULL)
- content_type (TEXT, NOT NULL)
- content_value (TEXT)
- metadata (JSONB)
- is_active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indexes**:
- idx_content_sections_section_key ON content_sections(section_key)
- idx_content_sections_active ON content_sections(is_active)
- idx_content_sections_metadata ON content_sections USING GIN(metadata)

**RLS Policies**:
- "Allow public read access to active content sections" (SELECT for active)
- "Allow authenticated users full access to content sections" (ALL for authenticated)

**Triggers**:
- update_content_sections_updated_at (BEFORE UPDATE)

### 12. category_sections
**Purpose**: Category section management
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- name (TEXT, NOT NULL)
- slug (TEXT, NOT NULL)
- description (TEXT)
- section_type (TEXT, NOT NULL)
- is_active (BOOLEAN, DEFAULT true)
- sort_order (INTEGER, DEFAULT 1)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 13. profiles
**Purpose**: Basic user profiles (legacy table)
**Columns**:
- id (UUID, PRIMARY KEY)
- email (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- phone (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 14. site_content
**Purpose**: General site content management
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- section (TEXT, NOT NULL)
- title (TEXT)
- subtitle (TEXT)
- content (TEXT)
- image_url (TEXT)
- additional_data (JSONB)
- is_active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 15. user_roles
**Purpose**: User role assignments
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- user_id (UUID, NOT NULL)
- role (app_role ENUM, DEFAULT 'customer')
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 16. comments
**Purpose**: Customer reviews and comments
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- customer_name (TEXT, NOT NULL)
- customer_email (TEXT)
- rating (INTEGER)
- comment_text (TEXT, NOT NULL)
- is_approved (BOOLEAN, DEFAULT false)
- is_active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 17. gallery_images
**Purpose**: Gallery image management
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- title (TEXT)
- description (TEXT)
- image_url (TEXT, NOT NULL)
- thumbnail_url (TEXT)
- category (TEXT)
- sort_order (INTEGER)
- is_active (BOOLEAN, DEFAULT true)
- is_featured (BOOLEAN, DEFAULT false)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

### 18. youtube_videos
**Purpose**: YouTube video management
**Columns**:
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- title (TEXT, NOT NULL)
- description (TEXT)
- video_url (TEXT, NOT NULL)
- thumbnail_url (TEXT)
- is_active (BOOLEAN, DEFAULT true)
- sort_order (INTEGER, DEFAULT 1)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**RLS Policies**:
- "Allow public read access" (SELECT for all)
- "Allow authenticated insert" (INSERT for authenticated)
- "Allow authenticated update" (UPDATE for authenticated)
- "Allow authenticated delete" (DELETE for authenticated)

## Database Functions

### 1. delete_order_cascade(order_uuid UUID)
**Purpose**: Safely delete an order and all related records
**Returns**: BOOLEAN
**Security**: DEFINER
**Description**: Deletes order items, notifications, status history, and the order itself in correct order to avoid foreign key violations

### 2. has_role(_user_id TEXT, _role app_role)
**Purpose**: Check if a user has a specific role
**Returns**: BOOLEAN

### 3. update_order_status(order_uuid TEXT, new_status TEXT, status_notes TEXT, tracking_num TEXT)
**Purpose**: Update order status with history tracking
**Returns**: VOID

### 4. create_admin_session(p_username TEXT, p_ip_address INET, p_user_agent TEXT)
**Purpose**: Create a new admin session with security logging
**Returns**: TEXT (session token)
**Security**: DEFINER

### 5. validate_admin_session(p_session_token TEXT)
**Purpose**: Validate admin session and update activity
**Returns**: BOOLEAN
**Security**: DEFINER

### 6. invalidate_admin_session(p_session_token TEXT)
**Purpose**: Invalidate admin session and log logout
**Returns**: VOID
**Security**: DEFINER

### 7. cleanup_expired_admin_sessions()
**Purpose**: Clean up expired admin sessions
**Returns**: INTEGER (count of cleaned sessions)
**Security**: DEFINER

### 8. log_admin_activity(p_username TEXT, p_action TEXT, p_resource TEXT, p_details JSONB, p_ip_address INET, p_user_agent TEXT)
**Purpose**: Log admin activities for audit trail
**Returns**: VOID
**Security**: DEFINER

### 9. create_user_profile()
**Purpose**: Automatically create user profile on signup
**Returns**: TRIGGER
**Trigger**: AFTER INSERT ON auth.users

### 10. update_settings_updated_at()
**Purpose**: Update updated_at timestamp for settings
**Returns**: TRIGGER
**Trigger**: BEFORE UPDATE ON settings

### 11. update_user_profiles_updated_at()
**Purpose**: Update updated_at timestamp for user profiles
**Returns**: TRIGGER
**Trigger**: BEFORE UPDATE ON user_profiles

### 12. update_content_sections_updated_at()
**Purpose**: Update updated_at timestamp for content sections
**Returns**: TRIGGER
**Trigger**: BEFORE UPDATE ON content_sections

### 13. trigger_cleanup_sessions()
**Purpose**: Trigger cleanup of expired sessions
**Returns**: TRIGGER
**Trigger**: AFTER INSERT ON admin_sessions

## Database Enums

### app_role
**Values**: 'admin', 'customer'
**Purpose**: Define user roles in the system

## Storage RLS Policies

### storage.objects
**RLS Enabled**: Yes
**Policies**:
- Public read access for all buckets
- Authenticated users can upload to all buckets
- Authenticated users can update their own uploads
- Authenticated users can delete their own uploads

### storage.buckets
**RLS Enabled**: Yes
**Policies**:
- Public read access to bucket information
- Restricted write access

## Key Settings in Database

The settings table contains critical application configuration:

### Restaurant Settings
- **restaurantSettings**: Total seats, reservation duration, opening/closing times, supported languages
- **contactContent**: Address, phone, email, map URL, business hours
- **businessHours**: Detailed weekly schedule with open/close times

### Content Settings
- **heroContent**: Main hero section content and background image
- **logoSettings**: Logo URL and alt text
- **galleryContent**: Gallery section headings
- **galleryImages**: Array of gallery images
- **weOfferContent**: Services and offerings content

### Admin Settings
- **adminSecuritySettings**: Session timeout, login attempts, security policies
- **adminUISettings**: Admin interface preferences and settings

### Operational Settings
- **popups**: Active popup configurations
- **reservations**: Reservation data
- **shippingZoneSettings**: Delivery zone configurations
- **deliveryZones**: Geographic delivery areas

## Migration History

1. **20250115000000_create_settings_table.sql** - Core settings table
2. **20250115000000_create_category_sections.sql** - Category sections
3. **20250115000000_fix_notification_rls.sql** - Notification policies
4. **20250115000001_create_content_sections.sql** - Content management
5. **20250115120000_create_delete_order_function.sql** - Order deletion function
6. **20250115121000_fix_order_deletion_policies.sql** - Order deletion policies
7. **20250115130000_add_payment_fields.sql** - Payment integration
8. **20250116000000_add_performance_indexes.sql** - Performance optimization
9. **20250117000000_create_user_profiles_table.sql** - User profiles
10. **20250117000001_enhance_admin_authentication.sql** - Admin auth system
11. **20250514151200_add_settings_rls_policy.sql** - Settings RLS policies
12. **20250627000000_create_storage_buckets.sql** - Storage buckets
13. **20250825000000_remove_file_size_limits.sql** - Remove file size limits

## Security Configuration

### Row Level Security (RLS)
- **Enabled on all tables**: Yes
- **Public read access**: Limited to specific tables/conditions
- **Authenticated access**: Full CRUD for admin operations
- **User isolation**: Users can only access their own data where applicable

### Authentication
- **Provider**: Supabase Auth
- **Session management**: Custom admin sessions with expiration
- **Activity logging**: Comprehensive audit trail for admin actions
- **Password policies**: Configurable strength requirements

### Storage Security
- **Public buckets**: All image storage buckets are public for web access
- **Upload restrictions**: MIME type restrictions for security
- **File size limits**: Removed (unlimited uploads)

## Performance Optimizations

### Indexes
- Primary keys on all tables
- Foreign key indexes for relationships
- Composite indexes for common query patterns
- GIN indexes for JSONB columns
- Timestamp indexes for sorting and filtering

### Triggers
- Automatic timestamp updates
- User profile creation on signup
- Session cleanup automation
- Activity logging automation

## Backup and Recovery

### Migration-based Schema
- All schema changes tracked in migration files
- Reproducible database setup
- Version-controlled schema evolution

### Data Integrity
- Foreign key constraints
- Check constraints where applicable
- NOT NULL constraints on critical fields
- Unique constraints on business keys

## Realtime Subscriptions

The application uses Supabase Realtime for live updates across multiple components:

### Settings Realtime
- **Table**: settings
- **Events**: UPDATE
- **Components**: WeOffer, BusinessHours, Contact, Footer, Settings hooks
- **Channels**: Dynamic channel names with timestamps to prevent conflicts

### Order Notifications Realtime
- **Table**: order_notifications
- **Events**: INSERT, UPDATE, DELETE
- **Publication**: supabase_realtime
- **Purpose**: Real-time order status updates for admin dashboard

### Realtime Configuration
- **Events per second**: 10 (configured in client)
- **Channel naming**: Unique timestamps to prevent channel reuse
- **Auto-cleanup**: Channels are unsubscribed on component unmount

## Edge Functions

The database integrates with 3 Supabase Edge Functions for payment processing:

### 1. create-checkout-session
- **Path**: `/functions/v1/create-checkout-session`
- **Purpose**: Create Stripe checkout sessions
- **Database Dependencies**:
  - Reads `stripeConfig` from settings table
  - Uses Stripe secret key from database configuration
- **Allowed Countries**: IT, FR, DE, ES, AT, CH
- **Payment Methods**: Card payments only

### 2. stripe-webhook
- **Path**: `/functions/v1/stripe-webhook`
- **Purpose**: Handle Stripe webhook events
- **Database Operations**:
  - Updates orders table on payment completion
  - Creates order_status_history entries
  - Handles payment failures
- **Events Handled**:
  - `checkout.session.completed`
  - `payment_intent.payment_failed`

### 3. verify-payment
- **Path**: `/functions/v1/verify-payment`
- **Purpose**: Verify payment status
- **Database Dependencies**:
  - Reads `stripeConfig` from settings table
  - Retrieves payment details from Stripe API

## Additional Database Features

### Check Constraints
- **category_sections.section_type**: Must be 'categories' or 'products'

### Unique Constraints
- **orders.order_number**: Unique order numbers
- **category_sections.slug**: Unique slugs for category sections
- **admin_sessions.session_token**: Unique session tokens

### Array Columns
- **products.ingredients**: TEXT[] for ingredient lists
- **products.allergens**: TEXT[] for allergen information
- **products.labels**: TEXT[] for product labels
- **order_items.toppings**: TEXT[] for pizza toppings

### JSONB Columns with Specific Schemas
- **settings.value**: Flexible JSON configuration
- **user_profiles.preferences**: User preference storage
- **orders.shipping_address**: Address information
- **orders.billing_address**: Billing information
- **products.gallery**: Image gallery data
- **order_items.metadata**: Additional order item data

### Performance Features
- **Composite Indexes**: Multi-column indexes for common query patterns
- **Partial Indexes**: Indexes with WHERE clauses for active records only
- **GIN Indexes**: For JSONB column searches
- **Automatic ANALYZE**: Statistics updates after index creation

### Security Features
- **SECURITY DEFINER Functions**: Admin functions with elevated privileges
- **Session Management**: Automatic cleanup of expired admin sessions
- **Activity Logging**: Comprehensive audit trail for admin actions
- **IP Address Tracking**: Security monitoring for admin sessions

## Environment Variables Required

For Edge Functions:
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `STRIPE_SECRET_KEY`: Stripe secret key (also stored in database)
- `STRIPE_WEBHOOK_SECRET`: Webhook endpoint secret

## Database Extensions

The database uses standard PostgreSQL extensions available in Supabase:
- **uuid-ossp**: For UUID generation (gen_random_uuid())
- **pg_stat_statements**: For query performance monitoring
- **pg_cron**: For scheduled tasks (if needed)

## Initial Data Categories

The database includes pre-populated category sections:

### Category Types
1. **SEMPLICI** - Classic Pizzas & Focacce
2. **SPECIALI** - Signature & Gourmet pizzas
3. **Pizze al metro per 4-5 persone** - Large pizzas for groups
4. **BEVANDE** - Drinks and beverages
5. **DOLCI** - Desserts
6. **FARINATE** - Chickpea flour dishes
7. **SCHIACCIATE** - Flatbreads
8. **EXTRA** - Additional toppings and extras

### Product Sections
1. **Featured Pizzas** - Most popular recommendations
2. **New Pizzas** - Latest menu additions
3. **Best Sellers** - Customer favorites
4. **Seasonal Specials** - Limited time offers

This documentation provides a complete overview of the Pizzeria Regina 2000 database structure, including all tables, relationships, security policies, functions, realtime features, edge functions, and configuration settings needed to recreate the database in a new environment.
