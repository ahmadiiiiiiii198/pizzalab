/**
 * Local Print Server for Epson TM-T70II
 * Receives print jobs from web app and sends to COM32 port
 */

const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');

const app = express();
const PORT = 3001;

// Enable CORS for your web app
app.use(cors());
app.use(express.json());

// ESC/POS control characters
const ESC = '\x1B';
const GS = '\x1D';

/**
 * Generate ESC/POS receipt
 */
function generateReceipt(order) {
  let receipt = '';
  
  // Initialize printer
  receipt += ESC + '@';
  
  // Header - centered, double size
  receipt += ESC + 'a' + '\x01'; // Center align
  receipt += GS + '!' + '\x11'; // Double size
  receipt += 'RURAL PIZZA\n';
  receipt += GS + '!' + '\x00'; // Normal size
  receipt += 'Laboratorio di Pizza Italiana\n';
  receipt += '================================\n';
  receipt += '\n';
  
  // Order info - left align
  receipt += ESC + 'a' + '\x00';
  receipt += 'ORDINE #' + order.orderNumber + '\n';
  receipt += 'Data: ' + new Date(order.timestamp).toLocaleString('it-IT') + '\n';
  receipt += 'Tipo: ' + (order.orderType === 'delivery' ? 'CONSEGNA' : 'RITIRO') + '\n';
  receipt += 'Pagamento: ' + order.paymentMethod + '\n';
  receipt += '\n';
  
  // Customer info
  receipt += '--------------------------------\n';
  receipt += 'CLIENTE:\n';
  receipt += order.customerName + '\n';
  receipt += 'Tel: ' + order.customerPhone + '\n';
  if (order.customerAddress) {
    receipt += 'Indirizzo: ' + order.customerAddress + '\n';
  }
  receipt += '--------------------------------\n';
  receipt += '\n';
  
  // Items
  order.items.forEach(item => {
    const itemLine = item.quantity + 'x ' + item.name;
    const price = 'EUR ' + item.price.toFixed(2);
    const spaces = 32 - itemLine.length - price.length;
    receipt += itemLine + ' '.repeat(Math.max(1, spaces)) + price + '\n';
    
    if (item.notes) {
      receipt += '  Note: ' + item.notes + '\n';
    }
  });
  
  receipt += '--------------------------------\n';
  
  // Totals
  if (order.deliveryFee) {
    receipt += 'Subtotale:' + ' '.repeat(15) + 'EUR ' + order.subtotal.toFixed(2) + '\n';
    receipt += 'Consegna:' + ' '.repeat(16) + 'EUR ' + order.deliveryFee.toFixed(2) + '\n';
  }
  
  receipt += GS + '!' + '\x11'; // Double size
  receipt += 'TOTALE:' + ' '.repeat(10) + 'EUR ' + order.total.toFixed(2) + '\n';
  receipt += GS + '!' + '\x00'; // Normal size
  
  // Notes
  if (order.notes) {
    receipt += '\n';
    receipt += '--------------------------------\n';
    receipt += 'Note: ' + order.notes + '\n';
  }
  
  // Footer
  receipt += '\n';
  receipt += ESC + 'a' + '\x01'; // Center
  receipt += 'Grazie per il tuo ordine!\n';
  receipt += 'www.ruralpizza.it\n';
  receipt += '================================\n';
  
  // Feed and cut
  receipt += '\n\n\n';
  receipt += GS + 'V' + '\x41' + '\x03'; // Partial cut
  
  return receipt;
}

/**
 * Print to COM32
 */
async function printToCOM32(receiptData) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: 'COM32',
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    });

    port.on('open', () => {
      console.log('✅ COM32 port opened');
      port.write(receiptData, (err) => {
        if (err) {
          console.error('❌ Write error:', err);
          port.close();
          reject(err);
        } else {
          console.log('✅ Data sent to printer');
          setTimeout(() => {
            port.close();
            resolve(true);
          }, 1000);
        }
      });
    });

    port.on('error', (err) => {
      console.error('❌ Port error:', err);
      reject(err);
    });
  });
}

/**
 * API Endpoints
 */

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', printer: 'COM32', ip: '192.168.1.32' });
});

// Print order
app.post('/print', async (req, res) => {
  try {
    console.log('📥 Received print request');
    const order = req.body;
    
    // Validate order data
    if (!order.orderNumber || !order.items) {
      return res.status(400).json({ error: 'Invalid order data' });
    }
    
    // Generate receipt
    const receiptData = generateReceipt(order);
    
    // Print
    await printToCOM32(receiptData);
    
    console.log('✅ Print successful');
    res.json({ success: true, message: 'Print sent to COM32' });
    
  } catch (error) {
    console.error('❌ Print error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test print
app.post('/test', async (req, res) => {
  try {
    console.log('🧪 Test print requested');
    
    const testOrder = {
      orderNumber: 'TEST-' + Date.now(),
      customerName: 'Test Cliente',
      customerPhone: '+39 123 456 7890',
      items: [
        { name: 'Pizza Margherita', quantity: 1, price: 8.00 },
        { name: 'Coca Cola', quantity: 1, price: 3.00 }
      ],
      subtotal: 11.00,
      total: 11.00,
      paymentMethod: 'Contanti',
      orderType: 'pickup',
      timestamp: new Date().toISOString()
    };
    
    const receiptData = generateReceipt(testOrder);
    await printToCOM32(receiptData);
    
    console.log('✅ Test print successful');
    res.json({ success: true, message: 'Test print sent' });
    
  } catch (error) {
    console.error('❌ Test print error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🖨️  Print Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log('🖨️  Printer: Epson TM-T70II');
  console.log('🔌 Port: COM32 (192.168.1.32)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /health - Check server status`);
  console.log(`  POST /print  - Print order`);
  console.log(`  POST /test   - Test print`);
  console.log('');
  console.log('✅ Ready to receive print jobs!');
});
