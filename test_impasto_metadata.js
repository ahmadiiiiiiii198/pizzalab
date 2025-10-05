// Test script to check impasto metadata structure
// Run this in browser console on your pizza ordering page

// Simulate a cart item with impasto
const testCartItem = {
  id: 'test-1',
  product: {
    id: 'pizza-1',
    name: 'Pizza Margherita',
    price: 7.00
  },
  quantity: 1,
  impastaType: {
    id: 'impasto-1',
    name: 'Impasto Integrale',
    price: '1.00'
  },
  extras: [
    {
      id: 'extra-1',
      name: 'Prosciutto',
      price: 2.00,
      quantity: 1
    }
  ]
};

// Test the metadata creation logic from CartCheckoutModal
function createTestMetadata(item) {
  const basePrice = item.product.price * item.quantity;
  const impastaPrice = item.impastaType ? 
    (typeof item.impastaType.price === 'string' ? parseFloat(item.impastaType.price) : (item.impastaType.price || 0)) * item.quantity : 0;
  const extrasPrice = item.extras ? 
    item.extras.reduce((total, extra) => {
      const extraPrice = typeof extra.price === 'string' ? parseFloat(extra.price) : (extra.price || 0);
      return total + (extraPrice * extra.quantity * item.quantity);
    }, 0) : 0;
  const itemTotal = basePrice + impastaPrice + extrasPrice;

  return {
    base_price: basePrice,
    impasta_type: item.impastaType || null,
    impasta_price: impastaPrice,
    extras: item.extras || [],
    extras_price: extrasPrice,
    total_breakdown: {
      base: basePrice,
      impasta: impastaPrice,
      extras: extrasPrice,
      total: itemTotal
    }
  };
}

// Test the metadata creation
console.log('🧪 Testing impasto metadata creation:');
const testMetadata = createTestMetadata(testCartItem);
console.log('📊 Generated metadata:', testMetadata);
console.log('🔍 Impasta type:', testMetadata.impasta_type);
console.log('💰 Impasta price:', testMetadata.impasta_price);

// Test the display logic from OrdersAdmin
function testDisplayLogic(metadata) {
  console.log('🎨 Testing display logic:');
  console.log('Has impasta_type?', !!metadata?.impasta_type);
  console.log('Impasta type name:', metadata?.impasta_type?.name);
  console.log('Impasta price > 0?', metadata?.impasta_price > 0);
  
  if (metadata?.impasta_type) {
    const displayText = `${metadata.impasta_type.name}${metadata.impasta_price > 0 ? ` (+€${metadata.impasta_price.toFixed(2)})` : ''}`;
    console.log('🎯 Display text would be:', displayText);
    return true;
  } else {
    console.log('❌ No impasta type found in metadata');
    return false;
  }
}

testDisplayLogic(testMetadata);

// Instructions for manual testing
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:

1. Copy the SQL scripts from database_check_scripts.sql
2. Run them in your Supabase SQL Editor
3. Look for recent orders and check their metadata structure
4. Pay special attention to the 'impasta_type' and 'impasta_price' fields

5. To test live order creation:
   - Add a pizza to cart with impasto selection
   - Complete the order
   - Check the browser console for metadata logs
   - Check the database immediately after order creation

6. Expected metadata structure:
   {
     "base_price": 7.00,
     "impasta_type": {
       "id": "impasto-1", 
       "name": "Impasto Integrale",
       "price": "1.00"
     },
     "impasta_price": 1.00,
     "extras": [...],
     "extras_price": 2.00,
     "total_breakdown": {
       "base": 7.00,
       "impasta": 1.00, 
       "extras": 2.00,
       "total": 10.00
     }
   }
`);
