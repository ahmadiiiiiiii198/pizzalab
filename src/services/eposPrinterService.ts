/**
 * Epson ePOS Network Printer Service
 * Direct printing to Epson TM-T70II via network (192.168.1.32)
 */

import { OrderPrintData } from './printerService';

class EposPrinterService {
  private printerIp: string = '192.168.1.32';
  private printerPort: number = 9100; // Standard ESC/POS port
  private autoPrintEnabled: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const settings = localStorage.getItem('eposPrinterSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.printerIp = parsed.printerIp || this.printerIp;
      this.autoPrintEnabled = parsed.autoPrintEnabled || false;
    }
  }

  saveSettings(printerIp: string, autoPrintEnabled: boolean) {
    this.printerIp = printerIp;
    this.autoPrintEnabled = autoPrintEnabled;
    localStorage.setItem('eposPrinterSettings', JSON.stringify({
      printerIp,
      autoPrintEnabled
    }));
  }

  isAutoPrintEnabled(): boolean {
    return this.autoPrintEnabled;
  }

  getPrinterIp(): string {
    return this.printerIp;
  }

  /**
   * Generate ESC/POS commands for receipt
   */
  private generateEscPosCommands(order: OrderPrintData): string {
    const ESC = '\x1B';
    const GS = '\x1D';
    
    let commands = '';
    
    // Initialize printer
    commands += ESC + '@'; // Initialize
    
    // Set character size and alignment
    commands += ESC + 'a' + '\x01'; // Center align
    commands += GS + '!' + '\x11'; // Double size
    
    // Header
    commands += 'RURAL PIZZA\n';
    commands += GS + '!' + '\x00'; // Normal size
    commands += 'Laboratorio di Pizza\n';
    commands += '================================\n';
    
    // Order info
    commands += ESC + 'a' + '\x00'; // Left align
    commands += '\n';
    commands += 'ORDINE #' + order.orderNumber + '\n';
    commands += 'Data: ' + new Date(order.timestamp).toLocaleString('it-IT') + '\n';
    commands += 'Tipo: ' + (order.orderType === 'delivery' ? 'CONSEGNA' : 'RITIRO') + '\n';
    commands += 'Pagamento: ' + order.paymentMethod + '\n';
    commands += '\n';
    
    // Customer info
    commands += '--------------------------------\n';
    commands += 'CLIENTE:\n';
    commands += order.customerName + '\n';
    commands += 'Tel: ' + order.customerPhone + '\n';
    if (order.customerAddress) {
      commands += 'Indirizzo: ' + order.customerAddress + '\n';
    }
    commands += '--------------------------------\n';
    commands += '\n';
    
    // Items
    order.items.forEach(item => {
      const itemLine = item.quantity + 'x ' + item.name;
      const price = 'EUR ' + item.price.toFixed(2);
      const spaces = 32 - itemLine.length - price.length;
      commands += itemLine + ' '.repeat(Math.max(1, spaces)) + price + '\n';
      
      if (item.notes) {
        commands += '  Note: ' + item.notes + '\n';
      }
    });
    
    commands += '--------------------------------\n';
    
    // Totals
    if (order.deliveryFee) {
      commands += 'Subtotale:' + ' '.repeat(15) + 'EUR ' + order.subtotal.toFixed(2) + '\n';
      commands += 'Consegna:' + ' '.repeat(16) + 'EUR ' + order.deliveryFee.toFixed(2) + '\n';
    }
    
    commands += GS + '!' + '\x11'; // Double size for total
    commands += 'TOTALE:' + ' '.repeat(10) + 'EUR ' + order.total.toFixed(2) + '\n';
    commands += GS + '!' + '\x00'; // Normal size
    
    // Notes
    if (order.notes) {
      commands += '\n';
      commands += '--------------------------------\n';
      commands += 'Note: ' + order.notes + '\n';
    }
    
    // Footer
    commands += '\n';
    commands += ESC + 'a' + '\x01'; // Center align
    commands += 'Grazie!\n';
    commands += 'www.ruralpizza.it\n';
    commands += '================================\n';
    
    // Cut paper
    commands += '\n\n\n';
    commands += GS + 'V' + '\x41' + '\x03'; // Partial cut
    
    return commands;
  }

  /**
   * Send ESC/POS commands to printer via network
   */
  async printOrder(order: OrderPrintData): Promise<boolean> {
    try {
      console.log('🖨️ Sending to Epson TM-T70II at', this.printerIp);
      
      const escPosData = this.generateEscPosCommands(order);
      
      // Send via fetch to a local proxy or direct socket
      // Since browsers can't open raw TCP sockets, we need a workaround
      
      // Option 1: Use Epson ePOS-Print XML API
      const xmlRequest = this.createEposPrintXml(escPosData);
      
      const response = await fetch(`http://${this.printerIp}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
        },
        body: xmlRequest
      });
      
      if (response.ok) {
        console.log('✅ Print sent successfully');
        return true;
      } else {
        console.error('❌ Print failed:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Print error:', error);
      return false;
    }
  }

  /**
   * Create ePOS-Print XML request
   */
  private createEposPrintXml(escPosData: string): string {
    // Convert to base64 for XML
    const base64Data = btoa(escPosData);
    
    return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text>${escPosData.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`;
  }

  /**
   * Test print
   */
  async testPrint(): Promise<boolean> {
    const testOrder: OrderPrintData = {
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

    return await this.printOrder(testOrder);
  }
}

export const eposPrinterService = new EposPrinterService();
export type { OrderPrintData };
