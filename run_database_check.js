// Database investigation script for impasto issue
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jncuwwavffepnajxvjxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDatabaseChecks() {
  console.log('🔍 Starting database investigation for impasto issue...\n');

  try {
    // 1. Check recent order_items with metadata
    console.log('1️⃣ Checking recent order_items with metadata:');
    const { data: recentItems, error: recentError } = await supabase
      .from('order_items')
      .select('id, product_name, quantity, subtotal, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Error fetching recent items:', recentError);
    } else {
      console.log(`✅ Found ${recentItems.length} recent order items:`);
      recentItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product_name} (${item.quantity}x) - €${item.subtotal}`);
        console.log(`      Metadata: ${item.metadata ? 'Present' : 'None'}`);
        if (item.metadata?.impasta_type) {
          console.log(`      🍕 Impasto: ${item.metadata.impasta_type.name} (+€${item.metadata.impasta_price || 0})`);
        }
        console.log(`      Created: ${new Date(item.created_at).toLocaleString()}\n`);
      });
    }

    // 2. Check specific order from screenshot (order #04d3aafa)
    console.log('2️⃣ Checking specific order #04d3aafa:');
    const { data: specificOrder, error: specificError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        total_amount,
        order_items (
          product_name,
          quantity,
          subtotal,
          metadata
        )
      `)
      .like('id', '%04d3aafa%');

    if (specificError) {
      console.error('❌ Error fetching specific order:', specificError);
    } else if (specificOrder.length === 0) {
      console.log('❌ Order #04d3aafa not found');
    } else {
      console.log(`✅ Found order #04d3aafa:`);
      specificOrder.forEach(order => {
        console.log(`   Order: ${order.order_number} - ${order.customer_name} - €${order.total_amount}`);
        order.order_items.forEach(item => {
          console.log(`   Item: ${item.product_name} (${item.quantity}x) - €${item.subtotal}`);
          console.log(`   Metadata: ${JSON.stringify(item.metadata, null, 2)}`);
        });
      });
    }

    // 3. Check all orders with impasto information
    console.log('\n3️⃣ Checking orders with impasto information:');
    const { data: impastaOrders, error: impastaError } = await supabase
      .from('order_items')
      .select(`
        product_name,
        metadata,
        orders (
          order_number,
          created_at
        )
      `)
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (impastaError) {
      console.error('❌ Error fetching impasta orders:', impastaError);
    } else {
      const itemsWithImpasta = impastaOrders.filter(item =>
        item.metadata && JSON.stringify(item.metadata).includes('impasta')
      );

      console.log(`✅ Found ${itemsWithImpasta.length} items with impasto data out of ${impastaOrders.length} items with metadata:`);
      itemsWithImpasta.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product_name} - Order: ${item.orders?.order_number}`);
        if (item.metadata?.impasta_type) {
          console.log(`      🍕 Impasto: ${item.metadata.impasta_type.name} (+€${item.metadata.impasta_price || 0})`);
        }
      });
    }

    // 4. Check metadata structure for recent items
    console.log('\n4️⃣ Analyzing metadata structure:');
    const { data: metadataItems, error: metadataError } = await supabase
      .from('order_items')
      .select('product_name, metadata')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (metadataError) {
      console.error('❌ Error fetching metadata:', metadataError);
    } else {
      console.log(`✅ Analyzing ${metadataItems.length} items with metadata:`);
      metadataItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product_name}:`);
        console.log(`      Metadata keys: ${Object.keys(item.metadata || {}).join(', ')}`);
        console.log(`      Has impasta_type: ${!!item.metadata?.impasta_type}`);
        console.log(`      Has impasta_price: ${!!item.metadata?.impasta_price}`);
        console.log(`      Full metadata: ${JSON.stringify(item.metadata, null, 2)}\n`);
      });
    }

    // 5. Check database schema
    console.log('5️⃣ Checking database schema:');
    const { data: orderColumns, error: orderSchemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'orders' });

    const { data: itemColumns, error: itemSchemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'order_items' });

    if (!orderSchemaError && orderColumns) {
      console.log('✅ Orders table columns:', orderColumns.map(col => col.column_name).join(', '));
    }
    if (!itemSchemaError && itemColumns) {
      console.log('✅ Order_items table columns:', itemColumns.map(col => col.column_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🏁 Database investigation complete!');
}

// Run the checks
runDatabaseChecks();