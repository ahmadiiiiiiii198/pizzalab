import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  Eye,
  Check,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Euro,
  User,
  MapPin,
  Phone,
  Calendar,
  Trash2,
  Printer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ensureAdminAuth } from '@/utils/adminDatabaseUtils';
import { useLogoSettings, useNavbarLogoSettings, useReceiptSettings } from '@/hooks/use-settings';
import { useAutoPrint } from '@/hooks/use-auto-print';
import { printerService, OrderPrintData } from '@/services/printerService';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price?: number;
  product_price: number;
  price?: number; // For backward compatibility
  subtotal: number;
  special_requests?: string;
  toppings?: string | string[];
  size?: string;
  metadata?: any;
  products?: {
    id: string;
    name: string;
    description?: string;
    ingredients?: string[];
    price: number;
  };
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  citofono_nome?: string;
  delivery_type?: string;
  delivery_fee?: number;
  pickup_time?: string;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  total_amount: number;
  notes?: string;
  special_instructions?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const OrdersAdmin = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Get settings for print receipt
  const [logoSettings] = useLogoSettings();
  const [navbarLogoSettings] = useNavbarLogoSettings();
  const [receiptSettings] = useReceiptSettings();
  
  // Enable auto-print for new orders
  useAutoPrint();

  const orderStatuses = [
    { value: 'confirmed', label: 'In Lavorazione', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'preparing', label: 'In Lavorazione', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'ready', label: 'In Lavorazione', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'arrived', label: 'In Lavorazione', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'delivered', label: 'In Lavorazione', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'fatto', label: 'Fatto', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    { value: 'cancelled', label: 'Annullato', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  // Load orders from database
  const loadOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            product_price,
            price,
            subtotal,
            special_requests,
            toppings,
            size,
            metadata,
            products (
              id,
              name,
              description,
              ingredients,
              price,
              categories (
                id,
                name,
                slug
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli ordini",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create notification for status change
      await supabase
        .from('order_notifications')
        .insert([{
          order_id: orderId,
          notification_type: 'order_update',
          title: 'Ordine Completato',
          message: `Ordine #${orders.find(o => o.id === orderId)?.order_number || orderId.slice(-8)} marcato come: Fatto`,
          is_read: false
        }]);

      // Update local state immediately
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, order_status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, order_status: newStatus } : null);
      }

      toast({
        title: "✅ Ordine Completato",
        description: `Ordine #${orders.find(o => o.id === orderId)?.order_number || orderId.slice(-8)} marcato come: Fatto`,
      });

      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ordine",
        variant: "destructive",
      });
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return;

    try {
      // Try to ensure admin authentication for deletion operations
      // If authentication fails, continue anyway since we have public RLS policies
      try {
        const authSuccess = await ensureAdminAuth();
        if (authSuccess) {
          console.log('✅ Admin authentication successful');
        } else {
          console.log('⚠️ Admin authentication failed, continuing with public access');
        }
      } catch (authError) {
        console.log('⚠️ Authentication error, continuing with public access:', authError);
      }

      // Try using the database function first for safer deletion
      const { error: functionError } = await supabase.rpc('delete_order_cascade', {
        order_uuid: orderId
      });

      if (functionError) {
        console.log('Database function failed, trying direct deletion:', functionError.message);

        // Fallback to direct deletion (now that RLS policies allow it)
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;
      }

      toast({
        title: "Successo",
        description: "Ordine eliminato con successo",
      });

      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Errore",
        description: `Impossibile eliminare l'ordine: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Function to convert image to base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
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

  // Helper function to check if an item is a drink
  const isDrinkItem = (item: any) => {
    const productName = (item.product_name || '').toLowerCase();

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

    // Debug logging for print receipt
    if (isDrink) {
      console.log(`🍹 DRINK DETECTED: "${item.product_name}" (Category: ${categoryName || 'none'})`);
    }

    return isDrink;
  };

  // Helper function to detect if an item is a dolci (dessert)
  const isDolciItem = (item: any) => {
    const productName = (item.product_name || '').toLowerCase();

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

  // Print order function
  const printOrder = async (order: Order) => {
    // Debug: Log order items to understand structure
    console.log('🖨️ Print Order - Order Items:', order.order_items);
    order.order_items?.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        product_name: item.product_name,
        products: item.products,
        category_info: item.products?.categories,
        is_drink: isDrinkItem(item)
      });
    });

    // Show loading toast
    const loadingToast = toast({
      title: "🖨️ Preparazione Stampa",
      description: "Caricamento logo e preparazione scontrino...",
      duration: 10000,
    });

    // Mobile-friendly print window handling
    const isMobile = window.innerWidth < 768;
    const printWindow = window.open('', isMobile ? '_self' : '_blank');
    if (!printWindow) {
      // Fallback for mobile devices that block popups
      if (isMobile) {
        toast({
          title: "Stampa Mobile",
          description: "Usa il menu del browser per stampare questa pagina",
          variant: "default",
        });
        // Create a temporary print-friendly page
        const printContent = document.createElement('div');
        printContent.innerHTML = `
          <div style="font-family: monospace; padding: 20px;">
            <h2>Ordine #${order.id.slice(-8)}</h2>
            <p>Cliente: ${order.customer_name}</p>
            <p>Telefono: ${order.customer_phone}</p>
            <p>Totale: €${order.total_amount}</p>
          </div>
        `;
        document.body.appendChild(printContent);
        window.print();
        document.body.removeChild(printContent);
        return;
      } else {
        toast({
          title: "Errore",
          description: "Impossibile aprire la finestra di stampa",
          variant: "destructive",
        });
        return;
      }
    }

    // Get logo URL with fallback - prioritize navbar logo (actual pizzeria logo)
    const logoUrl = navbarLogoSettings?.logoUrl ||
                   logoSettings?.logoUrl ||
                   "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png";

    // Get receipt settings
    const footerMessage = receiptSettings?.footerMessage || "Grazie per aver scelto Ruràl Pizza!";
    const customMessage = receiptSettings?.customMessage || "";
    const showTimestamp = receiptSettings?.showTimestamp ?? true;

    console.log('🖨️ Print: Navbar logo settings:', navbarLogoSettings);
    console.log('🖨️ Print: Logo settings:', logoSettings);
    console.log('🖨️ Print: Receipt settings:', receiptSettings);
    console.log('🖨️ Print: Using logo URL for both top and background:', logoUrl);

    // Debug order data
    console.log('🖨️ Print: Order data:', {
      id: order.id,
      order_number: order.order_number,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      delivery_type: order.delivery_type,
      delivery_fee: order.delivery_fee,
      order_status: order.order_status,
      total_amount: order.total_amount,
      metadata: order.metadata
    });

    // Convert logo to base64 for print window compatibility
    let logoBase64 = '';
    try {
      console.log('🔄 Converting logo to base64 for print compatibility...');
      logoBase64 = await imageToBase64(logoUrl);
      console.log('✅ Logo converted to base64 successfully');
    } catch (error) {
      console.error('❌ Failed to convert logo to base64:', error);
      console.log('📝 Will use fallback emoji logo');
      // Fallback to emoji if conversion fails
      try {
        logoBase64 = await imageToBase64("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png");
      } catch (fallbackError) {
        console.error('❌ Fallback logo also failed:', fallbackError);
      }
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ordine #${order.id.slice(-8)} - Ruràl Pizza</title>
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
            /* Debug mode - make background logo more visible on screen */
            @media screen {
              body::before {
                opacity: 0.15;
                border: 1px dashed rgba(255, 0, 0, 0.3);
              }
            }
            /* Print mode - subtle background logo */
            @media print {
              body::before {
                opacity: 0.08;
              }
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
            <div><strong>ORDINE #${order.order_number || order.id.slice(-8)}</strong></div>
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
            ${order.order_status ? `<div><strong>Stato Ordine:</strong> ${
              order.order_status === 'pending' ? 'In Attesa' :
              order.order_status === 'confirmed' ? 'Confermato' :
              order.order_status === 'preparing' ? 'In Preparazione' :
              order.order_status === 'ready' ? 'Pronto' :
              order.order_status === 'delivered' ? 'Consegnato' :
              order.order_status === 'cancelled' ? 'Annullato' :
              order.order_status
            }</div>` : ''}
          </div>

          <div class="section-title">Articoli Ordinati</div>
          <div class="items-container">
            ${order.order_items?.filter(item => !isDrinkItem(item) && !isDolciItem(item)).map(item => `
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
                  (item.toppings && item.toppings.length > 0) ? `<div class="extras">Aggiunti: ${item.toppings.join(', ')}</div>` : ''
                }
                ${item.metadata?.base_del_pizze_type ? `<div class="base-del-pizze">Base del pizze: ${item.metadata.base_del_pizze_type.name}${item.metadata.base_del_pizze_price > 0 ? ` (+€${item.metadata.base_del_pizze_price.toFixed(2)})` : ''}</div>` : ''}
                ${item.special_requests ? `<div class="special-requests">Richieste: ${item.special_requests}</div>` : ''}
              </div>
            `).join('') || ''}
          </div>

          ${(() => {
            // Collect all drinks: both standalone drink items and drink extras
            const standaloneDrinks = order.order_items?.filter(item => isDrinkItem(item)) || [];
            const drinkExtras = [];

            // Extract drink extras from all items
            order.order_items?.forEach(item => {
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
          })()}

          ${(() => {
            // Collect all dolci: both standalone dolci items and dolci extras
            const standaloneDolci = order.order_items?.filter(item => isDolciItem(item)) || [];
            const dolciExtras = [];

            // Extract dolci extras from all items
            order.order_items?.forEach(item => {
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
          })()}

          <div class="payment-section-title">INFORMAZIONI PAGAMENTO</div>
          <div class="payment-info">
            <div><strong>Metodo:</strong> ${
              order.payment_method === 'satispay' ? '💳 SatisPay' :
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
            ${order.payment_method === 'pos' && order.metadata?.posFee ? `<div><strong>Spesa POS:</strong> €${order.metadata.posFee.toFixed(2)}</div>` : ''}
          </div>

          ${(order.notes || order.special_instructions) ? `
          <div class="section-title">Note Aggiuntive</div>
          <div class="payment-info">
            ${order.notes ? `<div><strong>Note:</strong> ${order.notes}</div>` : ''}
            ${order.special_instructions ? `<div><strong>Istruzioni Speciali:</strong> ${order.special_instructions}</div>` : ''}
          </div>
          ` : ''}

          <div class="total">
            TOTALE: €${(order.total_amount || 0).toFixed(2)}
          </div>

          <div class="footer">
            <div>${footerMessage}</div>
            ${customMessage ? `<div class="custom-message">${customMessage}</div>` : ''}
            ${showTimestamp ? `<div>Stampato: ${new Date().toLocaleString('it-IT')}</div>` : ''}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      console.log('🖨️ Print window loaded, starting print...');
      printWindow.print();
      printWindow.close();
    };

    // Dismiss loading toast and show success
    loadingToast.dismiss?.();
    toast({
      title: "✅ Stampa Avviata",
      description: logoBase64 ?
        `Ordine #${order.id.slice(-8)} con logo inviato alla stampante` :
        `Ordine #${order.id.slice(-8)} inviato alla stampante (logo non disponibile)`,
    });
  };

  // Delete all orders
  const deleteAllOrders = async () => {
    if (orders.length === 0) {
      toast({
        title: "Nessun Ordine",
        description: "Non ci sono ordini da eliminare",
        variant: "destructive",
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ELIMINA TUTTI GLI ORDINI?\n\nQuesta azione eliminerà permanentemente TUTTI i ${orders.length} ordini.\nQuesta azione NON PUÒ essere annullata!\n\nClicca OK per eliminare tutti gli ordini, o Annulla per interrompere.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      console.log('🗑️ Starting delete all orders process...');
      console.log('📊 Orders to delete:', orders.length);
      console.log('🔍 Order IDs:', orders.map(o => o.id));

      // Try to ensure admin authentication for bulk deletion operations
      // If authentication fails, continue anyway since we have public RLS policies
      try {
        const authSuccess = await ensureAdminAuth();
        if (authSuccess) {
          console.log('✅ Admin authentication successful');
        } else {
          console.log('⚠️ Admin authentication failed, continuing with public access');
        }
      } catch (authError) {
        console.log('⚠️ Authentication error, continuing with public access:', authError);
      }

      const orderCount = orders.length;
      let deletedCount = 0;

      // Use the database function to safely delete each order
      // This approach respects RLS policies and handles foreign key constraints properly
      for (const order of orders) {
        try {
          console.log(`🗑️ Deleting order ${order.id}...`);

          // Try using the database function first
          const { error: functionError } = await supabase.rpc('delete_order_cascade', {
            order_uuid: order.id
          });

          if (functionError) {
            console.log(`⚠️ Database function failed for order ${order.id}, trying manual deletion:`, functionError.message);

            // Fallback to manual deletion
            // Delete order items first
            await supabase
              .from('order_items')
              .delete()
              .eq('order_id', order.id);

            // Delete order notifications
            await supabase
              .from('order_notifications')
              .delete()
              .eq('order_id', order.id);

            // Delete the order
            const { error: orderError } = await supabase
              .from('orders')
              .delete()
              .eq('id', order.id);

            if (orderError) {
              console.error(`❌ Failed to delete order ${order.id}:`, orderError.message);
              throw orderError;
            }
          }

          deletedCount++;
          console.log(`✅ Order ${order.id} deleted successfully (${deletedCount}/${orderCount})`);

        } catch (error) {
          console.error(`❌ Failed to delete order ${order.id}:`, error);
          console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          // Continue with other orders even if one fails
        }
      }

      console.log(`✅ Deletion process completed. ${deletedCount}/${orderCount} orders deleted.`);

      toast({
        title: "🗑️ Ordini Eliminati",
        description: `Eliminati con successo ${deletedCount} di ${orderCount} ordini`,
        duration: 3000,
      });

      // Refresh the orders list
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('❌ Error deleting all orders:', error);
      toast({
        title: "Errore",
        description: `Errore durante l'eliminazione degli ordini: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get status info - simplified to show only "In Lavorazione" or "Fatto"
  const getStatusInfo = (status: string) => {
    if (status === 'fatto') {
      return { value: 'fatto', label: 'Fatto', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
    }
    // All other statuses show as "In Lavorazione"
    return { value: 'active', label: 'In Lavorazione', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
  };

  // Get order counts by status - simplified to only show active and completed
  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      active: orders.filter(o => o.order_status !== 'fatto' && o.order_status !== 'cancelled').length,
      fatto: orders.filter(o => o.order_status === 'fatto').length,
      cancelled: orders.filter(o => o.order_status === 'cancelled').length
    };
    return counts;
  };

  useEffect(() => {
    console.log('🔄 [OrdersAdmin] Setting up real-time subscriptions...');

    // Check authentication status
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔐 [OrdersAdmin] Auth status:', session ? 'authenticated' : 'anonymous');
      if (error) {
        console.warn('🔐 [OrdersAdmin] Auth check error:', error);
      }
    };

    checkAuth();
    loadOrders();

    // Check Supabase real-time connection status
    console.log('🔌 [OrdersAdmin] Supabase client status:', {
      supabaseUrl: supabase.supabaseUrl,
      supabaseKey: supabase.supabaseKey ? 'configured' : 'missing',
      realtime: supabase.realtime ? 'available' : 'unavailable'
    });

    // Set up real-time subscription for orders with unique channel name
    const channelName = `orders_admin_${Date.now()}`;
    console.log('📡 [OrdersAdmin] Creating channel:', channelName);

    const ordersSubscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🚨 [OrdersAdmin] NEW ORDER DETECTED!', payload);
          console.log('🚨 [OrdersAdmin] Order details:', JSON.stringify(payload.new, null, 2));
          console.log('🚨 [OrdersAdmin] Event type:', payload.eventType);
          console.log('🚨 [OrdersAdmin] Timestamp:', new Date().toLocaleString('it-IT'));

          loadOrders(); // Reload orders when new order is added
          setLastRefresh(new Date());

          // Show toast for new orders
          toast({
            title: "🔔 Nuovo Ordine!",
            description: `Ordine ricevuto da ${payload.new.customer_name}`,
            duration: 3000,
          });

          // Audio notification is handled by OrderNotificationSystem component
          console.log('🔊 [OrdersAdmin] New order detected - OrderNotificationSystem will handle audio');

          // Trigger a custom event that OrderNotificationSystem can listen to
          window.dispatchEvent(new CustomEvent('newOrderReceived', {
            detail: {
              orderNumber: payload.new.order_number,
              customerName: payload.new.customer_name,
              totalAmount: payload.new.total_amount
            }
          }));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order updated:', payload);
          // Update specific order in state instead of reloading all
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            )
          );
          setLastRefresh(new Date());
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order deleted:', payload);
          // Remove deleted order from state instead of reloading all
          setOrders(prevOrders =>
            prevOrders.filter(order => order.id !== payload.old.id)
          );
          setLastRefresh(new Date());
        }
      )
      .subscribe((status) => {
        console.log('📡 [OrdersAdmin] Orders subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [OrdersAdmin] Orders real-time subscription ACTIVE');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [OrdersAdmin] Orders subscription ERROR');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ [OrdersAdmin] Orders subscription TIMED OUT');
        } else if (status === 'CLOSED') {
          console.warn('🔒 [OrdersAdmin] Orders subscription CLOSED');
        }
      });

    // Set up real-time subscription for order items
    const orderItemsChannelName = `order_items_admin_${Date.now()}`;
    console.log('📡 [OrdersAdmin] Creating order items channel:', orderItemsChannelName);

    const orderItemsSubscription = supabase
      .channel(orderItemsChannelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          console.log('📦 [OrdersAdmin] Order items change detected:', payload);
          // Only reload orders if it's a new item or significant change
          // For deletions during order deletion, don't reload
          if (payload.eventType === 'INSERT') {
            console.log('📦 [OrdersAdmin] New order item added, reloading orders...');
            loadOrders(); // Reload orders when new items are added
          }
        }
      )
      .subscribe((status) => {
        console.log('📦 [OrdersAdmin] Order items subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [OrdersAdmin] Order items real-time subscription ACTIVE');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [OrdersAdmin] Order items subscription ERROR');
        }
      });

    // Auto-refresh every 30 seconds as backup for testing real-time issues
    const refreshInterval = setInterval(() => {
      console.log('🔄 [OrdersAdmin] Backup refresh: Reloading orders...');
      loadOrders();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds backup refresh for testing

    return () => {
      ordersSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [statusFilter]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  const counts = getOrderCounts();

  return (
    <div className="space-y-6">
      {/* Mobile-Optimized Header with filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Gestione Ordini</h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Visualizza e gestisci tutti gli ordini
            <span className="block sm:inline sm:ml-2 text-xs text-green-600">
              🔄 Ultimo aggiornamento: {lastRefresh.toLocaleTimeString('it-IT')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={deleteAllOrders}
            variant="outline"
            size="sm"
            className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200 shadow-lg border-2 rounded-full text-xs flex-shrink-0"
            disabled={orders.length === 0 || isLoading}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">🗑️ Elimina Tutti</span>
            <span className="sm:hidden">🗑️</span>
          </Button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 sm:px-3 py-1 sm:py-2 border rounded-md text-xs sm:text-sm min-w-0 flex-1 sm:flex-initial"
          >
            <option value="all">Tutti ({counts.all})</option>
            <option value="active">In Lavorazione ({counts.active})</option>
            <option value="fatto">Fatto ({counts.fatto})</option>
            <option value="cancelled">Annullati ({counts.cancelled})</option>
          </select>
        </div>
      </div>

      {/* Simplified Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-600">Tutti</p>
                <p className="text-lg sm:text-xl font-bold">{counts.all}</p>
              </div>
              <ShoppingCart size={16} className="text-gray-500 mx-auto sm:mx-0 sm:ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="text-center sm:text-left">
                <p className="text-xs text-blue-600">In Lavorazione</p>
                <p className="text-lg sm:text-xl font-bold text-blue-700">{counts.active}</p>
              </div>
              <Clock size={16} className="text-blue-500 mx-auto sm:mx-0 sm:ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="text-center sm:text-left">
                <p className="text-xs text-green-600">Fatto</p>
                <p className="text-lg sm:text-xl font-bold text-green-700">{counts.fatto}</p>
              </div>
              <CheckCircle size={16} className="text-green-500 mx-auto sm:mx-0 sm:ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="text-center sm:text-left">
                <p className="text-xs text-red-600">Annullati</p>
                <p className="text-lg sm:text-xl font-bold text-red-700">{counts.cancelled}</p>
              </div>
              <XCircle size={16} className="text-red-500 mx-auto sm:mx-0 sm:ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-Optimized Orders Layout */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-sm sm:text-base font-semibold">Lista Ordini</h4>
          {orders.filter((order) => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'active') return order.order_status !== 'fatto' && order.order_status !== 'cancelled';
            if (statusFilter === 'fatto') return order.order_status === 'fatto';
            if (statusFilter === 'cancelled') return order.order_status === 'cancelled';
            return true;
          }).map((order) => {
            const statusInfo = getStatusInfo(order.order_status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card
                key={order.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-red-500' : ''
                }`}
                onClick={() => {
                  setSelectedOrder(order);
                  // Auto-scroll to order details section on mobile
                  setTimeout(() => {
                    const orderDetailsSection = document.querySelector('.lg\\:sticky');
                    if (orderDetailsSection && window.innerWidth < 1024) {
                      orderDetailsSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  }, 100);
                }}
              >
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xs sm:text-sm font-semibold">
                        Ordine #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-1 text-xs">
                        <User size={12} />
                        <span className="truncate">{order.customer_name}</span>
                      </CardDescription>
                    </div>
                    <Badge className={`${statusInfo.color} text-xs px-1 py-0.5 flex-shrink-0`}>
                      <StatusIcon size={10} className="mr-1" />
                      <span className="hidden sm:inline">{statusInfo.label}</span>
                      <span className="sm:hidden">{statusInfo.label.slice(0, 3)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Totale:</span>
                      <span className="font-semibold">€{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Articoli:</span>
                      <span>{order.order_items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <span className={`text-xs sm:text-sm font-medium ${
                        order.delivery_type === 'pickup' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {order.delivery_type === 'delivery' ? '🚚 Consegna' :
                         order.delivery_type === 'pickup' ? '🏪 Ritiro' :
                         order.delivery_type || 'Non specificato'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span className="text-xs sm:text-sm font-medium text-green-600">{new Date(order.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ora:</span>
                      <span className="text-xs sm:text-sm font-medium text-blue-600">{new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-xs text-gray-500">Ricevuto:</span>
                      <span className="text-xs font-semibold text-purple-600">
                        {new Date(order.created_at).toLocaleDateString('it-IT', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short'
                        })} alle {new Date(order.created_at).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {orders.length === 0 && (
            <Card>
              <CardContent className="text-center py-6 sm:py-8">
                <ShoppingCart className="mx-auto mb-3 sm:mb-4 text-gray-400" size={36} />
                <p className="text-gray-500 text-sm">Nessun ordine trovato</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mobile-Optimized Order Details */}
        <div className="lg:sticky lg:top-4">
          {selectedOrder ? (
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                  <span>Dettagli Ordine #{selectedOrder.id.slice(-8)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printOrder(selectedOrder)}
                      className="text-blue-600 hover:text-blue-700 p-1 sm:p-2"
                      title="Stampa Ordine"
                    >
                      <Printer size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteOrder(selectedOrder.id)}
                      className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                      title="Elimina Ordine"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                {/* Customer Info */}
                <div>
                  <h5 className="text-sm sm:text-base font-semibold mb-2">Informazioni Cliente</h5>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2">
                      <User size={12} />
                      <span className="truncate">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📧</span>
                      <span className="truncate text-xs">{selectedOrder.customer_email}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={12} />
                        <span>{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                    {(selectedOrder.delivery_address || selectedOrder.customer_address) && (
                      <div className="flex items-start space-x-2">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-tight">
                          {selectedOrder.delivery_address || selectedOrder.customer_address}
                        </span>
                      </div>
                    )}
                    {selectedOrder.citofono_nome && (
                      <div className="flex items-center space-x-2">
                        <User size={12} />
                        <span className="text-xs">Citofono: {selectedOrder.citofono_nome}</span>
                      </div>
                    )}
                    {selectedOrder.pickup_time && selectedOrder.delivery_type === 'pickup' && (
                      <div className="flex items-center space-x-2">
                        <Clock size={12} />
                        <span className="text-xs font-medium text-orange-600">Orario Ritiro: {selectedOrder.pickup_time}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_type === 'pickup' && selectedOrder.metadata?.pickup_method === 'asap' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-green-600">🚀 APPENA POSSIBILE (entro 30 min)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h5 className="text-sm sm:text-base font-semibold mb-2">Informazioni Pagamento</h5>
                  <div className="space-y-1 text-xs sm:text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-700">Metodo di Pagamento:</span>
                      <span className="text-blue-800 font-semibold">
                        {selectedOrder.payment_method === 'satispay' && '💳 SatisPay'}
                        {selectedOrder.payment_method === 'cash' && '💵 Contanti alla Consegna'}
                        {selectedOrder.payment_method === 'pos' && '💳 POS alla Consegna'}
                        {selectedOrder.payment_method === 'stripe' && '💳 Carta di Credito'}
                        {selectedOrder.payment_method === 'pickup' && '🏪 Ritiro in Negozio'}
                        {!selectedOrder.payment_method && '❓ Non specificato'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-700">Stato Pagamento:</span>
                      <span className={`font-semibold ${
                        selectedOrder.payment_status === 'paid' ? 'text-green-600' :
                        selectedOrder.payment_status === 'pending' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {selectedOrder.payment_status === 'paid' && '✅ Pagato'}
                        {selectedOrder.payment_status === 'pending' && '⏳ In Attesa'}
                        {selectedOrder.payment_status === 'failed' && '❌ Fallito'}
                        {!selectedOrder.payment_status && '❓ Non specificato'}
                      </span>
                    </div>
                    {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-blue-700">Spesa di Consegna:</span>
                        <span className="text-blue-800 font-semibold">€{selectedOrder.delivery_fee.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.payment_method === 'pos' && selectedOrder.metadata?.posFee && (
                      <div className="flex justify-between">
                        <span className="font-medium text-blue-700">Spesa POS a Domicilio:</span>
                        <span className="text-blue-800 font-semibold">€{selectedOrder.metadata.posFee.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h5 className="text-sm sm:text-base font-semibold mb-2">Articoli Ordinati</h5>
                  <div className="space-y-3 sm:space-y-4">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                        {/* Product Name and Price */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h6 className="font-semibold text-sm text-gray-900">
                              {item.quantity}x {item.product_name}
                            </h6>
                            <div className="text-xs text-gray-600">
                              €{(item.product_price || 0).toFixed(2)} cad.
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-green-600">
                              €{((item.subtotal || (item.product_price * item.quantity)) || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>



                        {/* Extras - Show metadata extras with prices, or toppings if no metadata */}
                        {(item.metadata?.extras && item.metadata.extras.length > 0) ? (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-orange-700">Extra: </span>
                            <div className="text-xs text-orange-600">
                              {item.metadata.extras.map((extra: any, index: number) => (
                                <span key={index}>
                                  {extra.name} (+€{extra.price?.toFixed(2) || '0.00'})
                                  {index < item.metadata.extras.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (item.toppings && item.toppings.length > 0) && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-orange-700">Extra: </span>
                            <span className="text-xs text-orange-600">
                              {item.toppings.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Impasto Type */}
                        {item.metadata?.impasta_type && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-purple-700">Impasto: </span>
                            <span className="text-xs text-purple-600">
                              {item.metadata.impasta_type.name}
                              {item.metadata.impasta_price > 0 && (
                                <span> (+€{item.metadata.impasta_price.toFixed(2)})</span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Base del Pizze Type */}
                        {item.metadata?.base_del_pizze_type && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-indigo-700">Base del pizze: </span>
                            <span className="text-xs text-indigo-600">
                              {item.metadata.base_del_pizze_type.name}
                              {item.metadata.base_del_pizze_price > 0 && (
                                <span> (+€{item.metadata.base_del_pizze_price.toFixed(2)})</span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Special Requests */}
                        {item.special_requests && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-blue-700">Richieste Speciali: </span>
                            <span className="text-xs text-blue-600">{item.special_requests}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="border-t pt-2 flex justify-between font-semibold text-sm bg-green-50 p-2 rounded">
                      <span>Totale Ordine:</span>
                      <span className="text-green-700">€{(selectedOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Fatto Button */}
                <div>
                  <h5 className="text-sm sm:text-base font-semibold mb-3">Stato Ordine</h5>
                  {selectedOrder.order_status === 'fatto' ? (
                    <div className="flex items-center justify-center p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      <span className="text-lg font-semibold text-green-700">Ordine Completato</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'fatto')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Segna come Fatto
                    </Button>
                  )}
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h5 className="text-sm sm:text-base font-semibold mb-2">Note</h5>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Enhanced Timestamps */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">📅 Informazioni Temporali</h5>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar size={12} className="text-green-600" />
                        <span className="text-xs font-medium">Ordine Ricevuto:</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-green-600">
                          {new Date(selectedOrder.created_at).toLocaleDateString('it-IT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs font-bold text-blue-600">
                          alle {new Date(selectedOrder.created_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2">
                      <div className="flex items-center space-x-2">
                        <Calendar size={12} className="text-orange-600" />
                        <span className="text-xs font-medium">Ultimo Aggiornamento:</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-orange-600">
                          {new Date(selectedOrder.updated_at).toLocaleDateString('it-IT')} alle {new Date(selectedOrder.updated_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:block hidden">
              <CardContent className="text-center py-6 sm:py-8">
                <Eye className="mx-auto mb-3 sm:mb-4 text-gray-400" size={36} />
                <p className="text-gray-500 text-sm">Seleziona un ordine per vedere i dettagli</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersAdmin;
