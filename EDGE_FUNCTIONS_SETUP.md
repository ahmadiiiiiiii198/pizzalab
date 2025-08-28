# Pizzeria Regina 2000 - Edge Functions Setup

This guide covers the setup of Supabase Edge Functions for payment processing integration.

## Overview

The application uses 3 Edge Functions for Stripe payment integration:

1. **create-checkout-session** - Creates Stripe checkout sessions
2. **stripe-webhook** - Handles Stripe webhook events
3. **verify-payment** - Verifies payment status

## Prerequisites

1. **Supabase CLI installed**: [Installation Guide](https://supabase.com/docs/guides/cli)
2. **Stripe Account**: With API keys configured
3. **Database Setup**: Complete database setup from previous scripts

## Environment Variables

Set these environment variables in your Supabase project:

### Required for Edge Functions
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret
```

### Setting Environment Variables

1. **Via Supabase Dashboard**:
   - Go to Project Settings → Edge Functions
   - Add each environment variable

2. **Via Supabase CLI**:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Function 1: create-checkout-session

### Purpose
Creates Stripe checkout sessions for order payments.

### Database Dependencies
- Reads `stripeConfig` from settings table
- Uses database-stored Stripe configuration

### Setup Steps

1. **Create the function directory**:
   ```bash
   mkdir -p supabase/functions/create-checkout-session
   ```

2. **Create index.ts file** with the provided code

3. **Deploy the function**:
   ```bash
   supabase functions deploy create-checkout-session
   ```

### Usage
```typescript
const response = await fetch('/functions/v1/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Pizza Order'
          },
          unit_amount: 2500 // €25.00 in cents
        },
        quantity: 1
      }
    ],
    customer_email: 'customer@example.com',
    success_url: 'https://yoursite.com/success',
    cancel_url: 'https://yoursite.com/cancel',
    metadata: {
      order_id: 'uuid-here'
    }
  })
});
```

## Function 2: stripe-webhook

### Purpose
Handles Stripe webhook events to update order status.

### Database Operations
- Updates orders table on payment completion
- Creates order_status_history entries
- Handles payment failures

### Setup Steps

1. **Create the function directory**:
   ```bash
   mkdir -p supabase/functions/stripe-webhook
   ```

2. **Create index.ts file** with the provided code

3. **Deploy the function**:
   ```bash
   supabase functions deploy stripe-webhook
   ```

4. **Configure Stripe Webhook**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`
   - Copy webhook secret to environment variables

### Events Handled
- **checkout.session.completed**: Updates order to 'paid' status
- **payment_intent.payment_failed**: Updates order to 'payment_failed' status

## Function 3: verify-payment

### Purpose
Verifies payment status by retrieving session details from Stripe.

### Database Dependencies
- Reads `stripeConfig` from settings table

### Setup Steps

1. **Create the function directory**:
   ```bash
   mkdir -p supabase/functions/verify-payment
   ```

2. **Create index.ts file** with the provided code

3. **Deploy the function**:
   ```bash
   supabase functions deploy verify-payment
   ```

### Usage
```typescript
const response = await fetch(`/functions/v1/verify-payment?session_id=${sessionId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
});
```

## Database Configuration

### Stripe Configuration in Settings Table

Add Stripe configuration to your settings table:

```sql
INSERT INTO settings (key, value) VALUES (
  'stripeConfig',
  '{
    "publishableKey": "pk_test_...",
    "secretKey": "sk_test_...",
    "webhookSecret": "whsec_...",
    "currency": "eur",
    "allowedCountries": ["IT", "FR", "DE", "ES", "AT", "CH"]
  }'
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
```

## Testing

### Test Checkout Session Creation
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "line_items": [{
      "price_data": {
        "currency": "eur",
        "product_data": {"name": "Test Pizza"},
        "unit_amount": 1500
      },
      "quantity": 1
    }],
    "customer_email": "test@example.com",
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel",
    "metadata": {"order_id": "test-order-123"}
  }'
```

### Test Payment Verification
```bash
curl "https://your-project-id.supabase.co/functions/v1/verify-payment?session_id=cs_test_..." \
  -H "Authorization: Bearer your-anon-key"
```

### Test Webhook (using Stripe CLI)
```bash
stripe listen --forward-to https://your-project-id.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use different keys for development and production
- Rotate keys regularly

### Webhook Security
- Always verify webhook signatures
- Use HTTPS endpoints only
- Monitor webhook delivery attempts

### Database Access
- Edge Functions use service role key for database access
- Implement proper error handling
- Log security events

## Monitoring and Logging

### Function Logs
View function logs in Supabase Dashboard:
- Go to Edge Functions → Function Name → Logs

### Stripe Dashboard
Monitor payments and webhooks:
- Stripe Dashboard → Payments
- Stripe Dashboard → Webhooks → Endpoint logs

### Database Monitoring
Monitor order status changes:
```sql
SELECT 
  o.order_number,
  o.status,
  o.payment_status,
  osh.status as history_status,
  osh.notes,
  osh.created_at
FROM orders o
LEFT JOIN order_status_history osh ON o.id = osh.order_id
WHERE o.created_at > NOW() - INTERVAL '24 hours'
ORDER BY o.created_at DESC;
```

## Troubleshooting

### Common Issues

1. **Function deployment fails**:
   - Check Supabase CLI is logged in: `supabase auth status`
   - Verify project is linked: `supabase projects list`

2. **Webhook not receiving events**:
   - Verify webhook URL is correct
   - Check webhook secret matches environment variable
   - Ensure endpoint is publicly accessible

3. **Payment verification fails**:
   - Check Stripe API keys are correct
   - Verify session ID format
   - Check function logs for detailed errors

### Debug Commands

```bash
# Check function status
supabase functions list

# View function logs
supabase functions logs create-checkout-session

# Test function locally
supabase functions serve create-checkout-session
```

## Production Deployment

### Before Going Live

1. **Update Stripe Keys**: Replace test keys with live keys
2. **Update Webhook URL**: Point to production function URL
3. **Test Payment Flow**: Complete end-to-end payment test
4. **Monitor Logs**: Set up alerting for function errors
5. **Backup Database**: Ensure order data is backed up

### Production Environment Variables
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

This setup provides a complete payment processing system integrated with your Pizzeria Regina 2000 database, handling the full payment lifecycle from checkout creation to webhook processing and verification.
