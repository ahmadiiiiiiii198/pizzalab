-- Database Investigation Scripts for Impasto Issue
-- Run these queries in Supabase SQL Editor to check impasto data

-- 1. Check recent order_items with metadata
SELECT 
    id,
    product_name,
    quantity,
    subtotal,
    metadata,
    created_at
FROM order_items 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check specific order from screenshot (order #04d3aafa)
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.total_amount,
    oi.product_name,
    oi.quantity,
    oi.subtotal,
    oi.metadata
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number LIKE '%04d3aafa%'
   OR o.id LIKE '%04d3aafa%';

-- 3. Check all orders with metadata containing impasto information
SELECT 
    o.order_number,
    oi.product_name,
    oi.metadata
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE oi.metadata IS NOT NULL
  AND oi.metadata::text LIKE '%impasta%'
ORDER BY o.created_at DESC;

-- 4. Check metadata structure for any order items
SELECT 
    product_name,
    metadata,
    jsonb_pretty(metadata) as formatted_metadata
FROM order_items 
WHERE metadata IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check if there are any impasto-related fields in metadata
SELECT 
    product_name,
    metadata -> 'impasta_type' as impasta_type,
    metadata -> 'impasta_price' as impasta_price,
    metadata -> 'base_price' as base_price,
    metadata -> 'total_breakdown' as total_breakdown
FROM order_items 
WHERE metadata IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check the structure of orders table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 7. Check the structure of order_items table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 8. Check if citofono_nome column exists in orders
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name = 'citofono_nome';
