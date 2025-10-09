/**
 * Printer Service for Automatic Order Printing
 * Supports Epson TM-T20III and other thermal printers
 */

export interface OrderPrintData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  deliveryFee?: number;
  total: number;
  paymentMethod: string;
  orderType: 'delivery' | 'pickup';
  timestamp: string;
  notes?: string;
}

class PrinterService {
  private printerName: string = 'POS-80(copy of 2)'; // Default printer name - WiFi Epson TM-T70II
  private autoPrintEnabled: boolean = true; // Auto-enabled by default

  constructor() {
    this.loadSettings();
  }

  /**
   * Load printer settings from localStorage
   */
  private loadSettings() {
    const settings = localStorage.getItem('printerSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.printerName = parsed.printerName || this.printerName;
      this.autoPrintEnabled = parsed.autoPrintEnabled || false;
    }
  }

  /**
   * Save printer settings to localStorage
   */
  saveSettings(printerName: string, autoPrintEnabled: boolean) {
    this.printerName = printerName;
    this.autoPrintEnabled = autoPrintEnabled;
    localStorage.setItem('printerSettings', JSON.stringify({
      printerName,
      autoPrintEnabled
    }));
  }

  /**
   * Check if auto-print is enabled
   */
  isAutoPrintEnabled(): boolean {
    return this.autoPrintEnabled;
  }

  /**
   * Generate HTML receipt for printing
   */
  private generateReceiptHTML(order: OrderPrintData): string {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td>${item.quantity}x ${item.name}</td>
        <td style="text-align: right;">€${item.price.toFixed(2)}</td>
      </tr>
      ${item.notes ? `<tr><td colspan="2" style="font-size: 10px; padding-left: 20px;">Note: ${item.notes}</td></tr>` : ''}
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ordine #${order.orderNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 10px;
            width: 80mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
          }
          .header p {
            margin: 2px 0;
            font-size: 10px;
          }
          .order-info {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .order-info p {
            margin: 3px 0;
            font-size: 11px;
          }
          .order-info strong {
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          td {
            padding: 3px 0;
            font-size: 11px;
          }
          .totals {
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .totals tr td {
            padding: 2px 0;
          }
          .totals .total-line {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 2px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          .customer-info {
            background: #f0f0f0;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #000;
          }
          .customer-info p {
            margin: 2px 0;
            font-size: 11px;
          }
          @media print {
            body {
              width: 80mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍕 RURÀL PIZZA</h1>
          <p>Laboratorio di Pizza Italiana</p>
          <p>Tel: +39 XXX XXX XXXX</p>
        </div>

        <div class="order-info">
          <p><strong>ORDINE #${order.orderNumber}</strong></p>
          <p>Data: ${new Date(order.timestamp).toLocaleString('it-IT')}</p>
          <p>Tipo: ${order.orderType === 'delivery' ? '🚗 CONSEGNA' : '🏪 RITIRO'}</p>
          <p>Pagamento: ${order.paymentMethod}</p>
        </div>

        <div class="customer-info">
          <p><strong>CLIENTE:</strong></p>
          <p>Nome: ${order.customerName}</p>
          <p>Tel: ${order.customerPhone}</p>
          ${order.customerAddress ? `<p>Indirizzo: ${order.customerAddress}</p>` : ''}
        </div>

        <table>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <table class="totals">
          <tr>
            <td>Subtotale:</td>
            <td style="text-align: right;">€${order.subtotal.toFixed(2)}</td>
          </tr>
          ${order.deliveryFee ? `
          <tr>
            <td>Consegna:</td>
            <td style="text-align: right;">€${order.deliveryFee.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-line">
            <td>TOTALE:</td>
            <td style="text-align: right;">€${order.total.toFixed(2)}</td>
          </tr>
        </table>

        ${order.notes ? `
        <div style="margin-top: 10px; padding: 5px; border: 1px solid #000;">
          <p style="margin: 0; font-size: 10px;"><strong>Note:</strong></p>
          <p style="margin: 3px 0; font-size: 10px;">${order.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Grazie per il tuo ordine!</p>
          <p>www.ruralpizza.it</p>
          <p>━━━━━━━━━━━━━━━━━━━━</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Print order receipt via local print server
   */
  async printOrder(order: OrderPrintData): Promise<boolean> {
    try {
      console.log('🖨️ Printing order:', order.orderNumber);

      // Send to local print server (COM32)
      const response = await fetch('http://localhost:3001/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error(`Print server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Print job sent successfully:', result);
      return true;

    } catch (error) {
      console.error('❌ Print error:', error);
      console.error('Make sure print server is running: npm run print-server');
      return false;
    }
  }

  /**
   * Test print to verify printer connection
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

  /**
   * Get printer name
   */
  getPrinterName(): string {
    return this.printerName;
  }
}

// Export singleton instance
export const printerService = new PrinterService();
