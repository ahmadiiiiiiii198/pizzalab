interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  specialRequests?: string;
  // Current cart structure
  extras?: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    quantity: number;
  }>;
  impastaType?: {
    id: string;
    name: string;
    price: number;
  };
  baseDelPizzeType?: {
    id: string;
    name: string;
    price: number;
  };
  // Legacy structure for backward compatibility
  selectedImpasto?: string;
  selectedBase?: string;
  selectedAggiunti?: Array<{ name: string; price: number }>;
  selectedBevande?: Array<{ name: string; price: number }>;
  selectedBirre?: Array<{ name: string; price: number }>;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  delivery_fee?: number;
  payment_method: string;
  payment_status?: string;
  created_at: string;
  notes?: string;
  special_instructions?: string;
  delivery_type?: string;
  pickup_time?: string;
  citofono_nome?: string;
  order_status?: string;
  metadata?: {
    pickup_method?: string;
    posFee?: number;
    [key: string]: any;
  };
}

interface ReceiptSettings {
  footerMessage?: string;
  customMessage?: string;
  showTimestamp?: boolean;
}

interface LogoSettings {
  logoUrl?: string;
}

export interface ReceiptData {
  order: OrderData;
  cartItems: CartItem[];
  receiptSettings?: ReceiptSettings;
  logoSettings?: LogoSettings;
  navbarLogoSettings?: LogoSettings;
}

// Helper function to detect if an item is a drink (EXACT copy from OrdersAdmin.tsx)
const isDrinkItem = (item: any): boolean => {
  const productName = (item.product_name || item.product?.name || '').toLowerCase();

  // Exclude food items that should never be drinks
  const foodExclusions = ['farinata', 'pizza', 'calzone', 'focaccia', 'dolci', 'fritti'];
  if (foodExclusions.some(food => productName.includes(food))) {
    return false;
  }

  // First check: Category-based detection (most reliable)
  // Check multiple possible locations for category information
  const categoryName = item.products?.categories?.name ||
                      item.category_name ||
                      item.products?.category_name ||
                      item.metadata?.category_name;

  if (categoryName) {
    const categoryLower = categoryName.toLowerCase();
    const drinkCategories = ['birre', 'bevande', 'drinks', 'bibite'];
    if (drinkCategories.includes(categoryLower)) {
      return true;
    }

    // Exclude non-drink categories
    const foodCategories = ['farinate', 'pizza', 'calzoni', 'focacce', 'dolci', 'fritti'];
    if (foodCategories.some(cat => categoryLower.includes(cat))) {
      return false;
    }
  }

  // Second check: Enhanced keyword-based detection (fallback)
  const drinkKeywords = [
    'bevanda', 'bibita', 'acqua', 'coca', 'cola', 'sprite',
    'birra', 'vino', 'succo', 'tè', 'thè', 'caffè', 'cappuccino',
    'espresso', 'aranciata', 'limonata', 'limone', 'chinotto', 'gassosa',
    'moretti', 'peroni', 'heineken', 'naturale', 'frizzante',
    'drink', 'beverage', 'zero', 'pet', 'ml', 'litro', 'benedetto',
    'messina', 'sleek'
  ];

  // Special patterns that need word boundary or specific context
  const specificPatterns = [
    /\bcl\b/i,  // 'cl' only as whole word (e.g., "33cl")
    /\d+\s*cl/i // number followed by cl (e.g., "33 cl", "33cl")
  ];

  // Special handling for 'fanta' to avoid matching 'farinata'
  const hasFanta = productName.includes('fanta') && !productName.includes('farinata');
  const hasOtherDrinkKeywords = drinkKeywords.some(keyword => productName.includes(keyword));
  const hasSpecificPatterns = specificPatterns.some(pattern => pattern.test(productName));

  // Additional specific product name checks for known drinks
  const specificDrinks = [
    'coca cola', 'coca-cola', 'thè san benedetto', 'birra moretti', 'birra peroni',
    'acqua frizzante', 'acqua naturale', 'messina 33cl'
  ];
  const isSpecificDrink = specificDrinks.some(drink => productName.includes(drink));

  const isDrink = hasFanta || hasOtherDrinkKeywords || hasSpecificPatterns || isSpecificDrink;

  return isDrink;
};

// Helper function to detect if an item is a dolci (dessert)
const isDolciItem = (item: any): boolean => {
  const productName = (item.product_name || item.product?.name || '').toLowerCase();

  // Category-based detection
  const categoryName = item.products?.categories?.name ||
                      item.category_name ||
                      item.products?.category_name ||
                      item.metadata?.category_name;

  if (categoryName) {
    const categoryLower = categoryName.toLowerCase();
    if (categoryLower.includes('dolci') || categoryLower.includes('dessert')) {
      return true;
    }
  }

  // Keyword-based detection for dolci
  const dolciKeywords = [
    'dolci', 'dolce', 'dessert', 'gelato', 'tiramisu', 'panna cotta',
    'cannoli', 'biscotti', 'torta', 'cake', 'cioccolato', 'nutella',
    'fragola', 'vaniglia', 'pistacchio', 'limone', 'crema'
  ];

  return dolciKeywords.some(keyword => productName.includes(keyword));
};

// Convert image URL to base64
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

export const generateReceiptHTML = async (data: ReceiptData): Promise<string> => {
  const { order, cartItems, receiptSettings, logoSettings, navbarLogoSettings } = data;

  // Debug: Log cart items structure
  console.log('🧾 Receipt Generator - Cart Items:', cartItems);
  cartItems.forEach((item, index) => {
    console.log(`🧾 Item ${index}:`, {
      name: item.product.name,
      quantity: item.quantity,
      extras: item.extras,
      impastaType: item.impastaType,
      baseDelPizzeType: item.baseDelPizzeType,
      specialRequests: item.specialRequests,
      // Legacy fields
      selectedAggiunti: item.selectedAggiunti,
      selectedImpasto: item.selectedImpasto,
      selectedBase: item.selectedBase
    });
  });

  // Get logo URL with fallback - prioritize navbar logo
  const logoUrl = navbarLogoSettings?.logoUrl ||
                 logoSettings?.logoUrl ||
                 "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png";

  // Get receipt settings
  const footerMessage = receiptSettings?.footerMessage || "Grazie per aver scelto Ruràl Pizza!";
  const customMessage = receiptSettings?.customMessage || "";
  const showTimestamp = receiptSettings?.showTimestamp ?? true;

  // Convert logo to base64
  let logoBase64 = '';
  try {
    logoBase64 = await imageToBase64(logoUrl);
  } catch (error) {
    console.warn('Failed to load logo for receipt:', error);
  }

  // Separate drinks from other items (using the same logic as admin print)
  const drinkItems = cartItems.filter(isDrinkItem);
  const foodItems = cartItems.filter(item => !isDrinkItem(item));

  // Convert CartItem to order item format for filtering
  const convertCartItemToOrderItem = (item: CartItem) => ({
    product_name: item.product.name,
    quantity: item.quantity,
    product_price: item.product.price,
    subtotal: calculateCartItemTotal(item),
    special_requests: item.specialRequests,
    metadata: {
      impasta_type: item.impastaType ? { name: item.impastaType.name } : null,
      impasta_price: item.impastaType?.price || 0,
      base_del_pizze_type: item.baseDelPizzeType ? { name: item.baseDelPizzeType.name } : null,
      base_del_pizze_price: item.baseDelPizzeType?.price || 0,
      extras: item.extras?.map(extra => ({
        name: extra.name,
        price: extra.price,
        quantity: extra.quantity
      })) || []
    }
  });

  // Calculate total price for a cart item including all extras
  const calculateCartItemTotal = (item: CartItem): number => {
    let total = item.product.price * item.quantity;

    if (item.impastaType) {
      total += item.impastaType.price * item.quantity;
    }

    if (item.baseDelPizzeType) {
      total += item.baseDelPizzeType.price * item.quantity;
    }

    if (item.extras) {
      item.extras.forEach(extra => {
        total += extra.price * extra.quantity * item.quantity;
      });
    }

    return total;
  };

  // Convert cart items to order item format
  const orderItems = cartItems.map(convertCartItemToOrderItem);

  // Generate food items section (EXACT copy from admin print logic)
  const generateFoodItemsHTML = () => {
    const foodItems = orderItems.filter(item => !isDrinkItem(item) && !isDolciItem(item));

    if (foodItems.length === 0) return '';

    return `
      <div class="section-title">Articoli Ordinati</div>
      <div class="items-container">
        ${foodItems.map(item => `
          <div class="item">
            <div class="item-header">
              <span>${item.quantity}x ${item.product_name}</span>
              <span>€${((item.subtotal || (item.product_price * item.quantity)) || 0).toFixed(2)}</span>
            </div>

            ${item.metadata?.impasta_type ? `<div class="impasto">Impasto: ${item.metadata.impasta_type.name}${item.metadata.impasta_price > 0 ? ` (+€${item.metadata.impasta_price.toFixed(2)})` : ''}</div>` : ''}
            ${(item.metadata?.extras && item.metadata.extras.length > 0) ?
              (() => {
                const nonDrinkNonDolciExtras = item.metadata.extras.filter((extra: any) =>
                  !isDrinkItem({product_name: extra.name}) && !isDolciItem({product_name: extra.name})
                );
                return nonDrinkNonDolciExtras.length > 0 ?
                  `<div class="extras">Aggiunti: ${nonDrinkNonDolciExtras.map((extra: any) => `${extra.name} (+€${extra.price?.toFixed(2) || '0.00'})`).join(', ')}</div>` : '';
              })() :
              ''
            }
            ${item.metadata?.base_del_pizze_type ? `<div class="base-del-pizze">Base del pizze: ${item.metadata.base_del_pizze_type.name}${item.metadata.base_del_pizze_price > 0 ? ` (+€${item.metadata.base_del_pizze_price.toFixed(2)})` : ''}</div>` : ''}
            ${item.special_requests ? `<div class="special-requests">Richieste: ${item.special_requests}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  // Generate drinks section (EXACT copy from admin print logic)
  const generateDrinksHTML = () => {
    // Collect all drinks: both standalone drink items and drink extras
    const standaloneDrinks = orderItems.filter(item => isDrinkItem(item));
    const drinkExtras: any[] = [];

    // Extract drink extras from all items
    orderItems.forEach(item => {
      if (item.metadata?.extras) {
        item.metadata.extras.forEach((extra: any) => {
          if (isDrinkItem({product_name: extra.name})) {
            drinkExtras.push({
              product_name: extra.name,
              quantity: extra.quantity || 1,
              price: extra.price || 0
            });
          }
        });
      }
    });

    const allDrinks = [...standaloneDrinks, ...drinkExtras];

    return allDrinks.length > 0 ? `
      <div class="section-title">Bevande</div>
      <div class="items-container">
        ${standaloneDrinks.map(item => `
          <div class="item">
            <div class="item-header">
              <span>${item.quantity}x ${item.product_name}</span>
              <span>€${((item.subtotal || (item.product_price * item.quantity)) || 0).toFixed(2)}</span>
            </div>
            ${item.special_requests ? `<div class="special-requests">Richieste: ${item.special_requests}</div>` : ''}
          </div>
        `).join('')}
        ${drinkExtras.map(extra => `
          <div class="item">
            <div class="item-header">
              <span>${extra.quantity}x ${extra.product_name}</span>
              <span>€${(extra.price * extra.quantity).toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';
  };

  // Generate dolci section
  const generateDolciHTML = () => {
    // Collect all dolci: both standalone dolci items and dolci extras
    const standaloneDolci = orderItems.filter(item => isDolciItem(item));
    const dolciExtras: any[] = [];

    // Extract dolci extras from all items
    orderItems.forEach(item => {
      if (item.metadata?.extras) {
        item.metadata.extras.forEach((extra: any) => {
          if (isDolciItem({product_name: extra.name})) {
            dolciExtras.push({
              product_name: extra.name,
              quantity: extra.quantity || 1,
              price: extra.price || 0
            });
          }
        });
      }
    });

    const allDolci = [...standaloneDolci, ...dolciExtras];

    return allDolci.length > 0 ? `
      <div class="section-title">Dolci</div>
      <div class="items-container">
        ${standaloneDolci.map(item => `
          <div class="item">
            <div class="item-header">
              <span>${item.quantity}x ${item.product_name}</span>
              <span>€${((item.subtotal || (item.product_price * item.quantity)) || 0).toFixed(2)}</span>
            </div>
            ${item.special_requests ? `<div class="special-requests">Richieste: ${item.special_requests}</div>` : ''}
          </div>
        `).join('')}
        ${dolciExtras.map(extra => `
          <div class="item">
            <div class="item-header">
              <span>${extra.quantity}x ${extra.product_name}</span>
              <span>€${(extra.price * extra.quantity).toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';
  };

  // Generate all sections
  const foodItemsHTML = generateFoodItemsHTML();
  const drinkItemsHTML = generateDrinksHTML();
  const dolciItemsHTML = generateDolciHTML();

  return `
    <!DOCTYPE html>
    <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordine #${order.order_number} - Ruràl Pizza</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            position: relative;
            padding: 20px;
            max-width: 80mm;
            margin: 0 auto;
          }
          /* Large background logo watermark */
          body::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            background-image: url('${logoBase64}');
            background-repeat: no-repeat;
            background-position: center center;
            background-size: contain;
            opacity: 0.08;
            z-index: 0;
            pointer-events: none;
          }
          /* Small visible logo at top */
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
          }
          .logo-img {
            max-width: 60px;
            max-height: 60px;
            opacity: 0.8;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            padding: 10px;
            border-radius: 3px;
          }
          .restaurant-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .order-info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding: 10px;
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 3px;
          }
          .section-title {
            font-weight: bold;
            margin: 10px 0 5px 0;
            text-transform: uppercase;
            position: relative;
            z-index: 2;
          }
          .payment-section-title {
            font-weight: bold;
            margin: 10px 0 5px 0;
            text-transform: uppercase;
            position: relative;
            z-index: 2;
            color: #1e40af;
          }
          .items-container {
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 15px;
          }
          .item {
            margin-bottom: 8px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 5px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-details {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }
          .extras {
            font-size: 11px;
            color: #333;
            margin-top: 2px;
          }
          .impasto {
            font-size: 11px;
            color: #7c3aed;
            margin-top: 2px;
            font-weight: bold;
          }
          .base-del-pizze {
            font-size: 11px;
            color: #4f46e5;
            margin-top: 2px;
            font-weight: bold;
          }
          .special-requests {
            font-size: 11px;
            color: #000;
            font-weight: bold;
            margin-top: 2px;
          }
          .customer-info {
            margin: 15px 0;
            font-size: 11px;
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            padding: 10px;
            border-radius: 3px;
          }
          .payment-info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding: 10px;
            font-size: 12px;
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 3px;
          }
          .payment-info div {
            margin-bottom: 3px;
          }
          .total {
            border-top: 2px solid #000;
            padding: 15px 10px 10px 10px;
            margin-top: 15px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 3px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px dashed #000;
            padding: 15px 10px 10px 10px;
            font-size: 10px;
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 3px;
          }
          .custom-message {
            font-size: 9px;
            margin: 5px 0;
            font-style: italic;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="logo-container">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo-img" />` : ''}
        </div>
        <div class="header">
          <div class="restaurant-name">RURÀL PIZZA</div>
          <div>Laboratorio di Pizza Italiana</div>
        </div>

        <div class="order-info">
          <div><strong>ORDINE #${order.order_number}</strong></div>
          <div>Data: ${new Date(order.created_at).toLocaleDateString('it-IT')}</div>
          <div>Ora: ${new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
          <div>Cliente: ${order.customer_name}</div>
          ${order.customer_phone ? `<div>Tel: ${order.customer_phone}</div>` : ''}
          ${order.customer_email ? `<div>Email: ${order.customer_email}</div>` : ''}
          ${order.customer_address ? `<div>Indirizzo: ${order.customer_address}</div>` : ''}
          ${order.citofono_nome ? `<div>Citofono: ${order.citofono_nome}</div>` : ''}
          ${order.delivery_type ? `<div><strong>Tipo:</strong> ${
            order.delivery_type === 'delivery' ? 'Consegna a Domicilio' :
            order.delivery_type === 'pickup' ? 'Ritiro in Negozio' :
            order.delivery_type
          }</div>` : ''}
          ${order.pickup_time && order.delivery_type === 'pickup' ? `<div><strong>Orario Ritiro:</strong> ${order.pickup_time}</div>` : ''}
          ${order.delivery_type === 'pickup' && order.metadata?.pickup_method === 'asap' ? `<div><strong>Modalità:</strong> 🚀 APPENA POSSIBILE (entro 30 min)</div>` : ''}
        </div>

        ${foodItemsHTML}
        ${drinkItemsHTML}
        ${dolciItemsHTML}

        <div class="payment-section-title">INFORMAZIONI PAGAMENTO</div>
        <div class="payment-info">
          <div><strong>Metodo:</strong> ${
            order.payment_method === 'satispay' ? '💳 SatisPay' :
            order.payment_method === 'cash_on_delivery' ? '💵 Contanti alla Consegna' :
            order.payment_method === 'pos_on_delivery' ? '💳 POS alla Consegna' :
            order.payment_method === 'cash' ? '💵 Contanti alla Consegna' :
            order.payment_method === 'pos' ? '💳 POS alla Consegna' :
            order.payment_method === 'stripe' ? '💳 Carta di Credito' :
            order.payment_method === 'card' ? '💳 Carta di Credito' :
            order.payment_method === 'pickup' ? '🏪 Ritiro in Negozio' :
            order.payment_method ? `${order.payment_method}` : 'Non specificato'
          }</div>
          <div><strong>Stato Pagamento:</strong> ${
            order.payment_status === 'paid' ? '✅ Pagato' :
            order.payment_status === 'pending' ? '⏳ In Attesa' :
            order.payment_status === 'failed' ? '❌ Fallito' :
            order.payment_status === 'refunded' ? '↩️ Rimborsato' :
            order.payment_status ? `${order.payment_status}` : 'Non specificato'
          }</div>
          ${order.delivery_fee && order.delivery_fee > 0 ? `<div><strong>Spesa Consegna:</strong> €${order.delivery_fee.toFixed(2)}</div>` : ''}
          ${order.payment_method === 'pos_on_delivery' && order.metadata?.posFee ? `<div><strong>Spesa POS:</strong> €${order.metadata.posFee.toFixed(2)}</div>` : ''}
        </div>

        ${(order.notes || order.special_instructions) ? `
        <div class="section-title">Note Aggiuntive</div>
        <div class="payment-info">
          ${order.notes ? `<div><strong>Note:</strong> ${order.notes}</div>` : ''}
          ${order.special_instructions ? `<div><strong>Istruzioni Speciali:</strong> ${order.special_instructions}</div>` : ''}
        </div>
        ` : ''}

        <div class="total">
          TOTALE: €${order.total_amount.toFixed(2)}
        </div>

        <div class="footer">
          <div>${footerMessage}</div>
          ${customMessage ? `<div class="custom-message">${customMessage}</div>` : ''}
          ${showTimestamp ? `<div>Stampato: ${new Date().toLocaleString('it-IT')}</div>` : ''}
        </div>
      </body>
    </html>
  `;
};

export const downloadReceipt = (htmlContent: string, orderNumber: string) => {
  // Add BOM (Byte Order Mark) for proper UTF-8 encoding
  const bom = '\uFEFF';
  const content = bom + htmlContent;
  const blob = new Blob([content], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ricevuta-ordine-${orderNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
