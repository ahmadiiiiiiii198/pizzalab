import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, User, Mail, Phone, MapPin, AlertCircle, X, QrCode, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/hooks/use-simple-cart';
import { useSimpleCart } from '@/hooks/use-simple-cart';
import shippingZoneService from '@/services/shippingZoneService';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';
import { saveClientOrder } from '@/utils/clientSpecificOrderTracking';
import { getOrCreateClientIdentity } from '@/utils/clientIdentification';
import SatisPayModal from '@/components/SatisPayModal';
import { useSatisPaySettings } from '@/hooks/useSatisPaySettings';
import { calculateItemTotal, getItemPriceBreakdown } from '@/utils/cartPriceCalculations';
import OrderCompletionModal from '@/components/OrderCompletionModal';
import { ReceiptData } from '@/utils/receiptGenerator';


interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
}

interface CustomerData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  citofonoNome: string;
  deliveryTime: string;
  deliveryMethod: string;
}

const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount
}) => {
  const { toast } = useToast();
  const { validateOrderTime } = useBusinessHoursContext();
  // Customer authentication removed - orders work without accounts
  const { clearCart } = useSimpleCart();
  const { settings: satisPaySettings } = useSatisPaySettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSatisPayModalOpen, setIsSatisPayModalOpen] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<any>(null);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'contanti' | 'pos'>('contanti');

  // Order completion modal state
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionReceiptData, setCompletionReceiptData] = useState<ReceiptData | null>(null);

  // POS fee constant
  const POS_FEE = 0.30; // €0.30 for POS payment at delivery

  // Generate delivery time options from 18:00 to 22:30
  const generateDeliveryTimeOptions = () => {
    const options = [];
    const startHour = 18;
    const endHour = 22;
    const endMinute = 30;

    for (let hour = startHour; hour <= endHour; hour++) {
      const maxMinute = hour === endHour ? endMinute : 45;
      for (let minute = 0; minute <= maxMinute; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({
          value: timeString,
          label: timeString
        });
      }
    }
    return options;
  };

  const deliveryTimeOptions = generateDeliveryTimeOptions();

  // Calculate total including POS fee when applicable
  const calculateTotal = () => {
    const subtotal = totalAmount || 0;
    const deliveryFee = addressValidation?.deliveryFee || 0;
    const posFee = deliveryPaymentMethod === 'pos' ? POS_FEE : 0;
    return subtotal + deliveryFee + posFee;
  };

  const [customerData, setCustomerData] = useState<CustomerData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    citofonoNome: '',
    deliveryTime: '',
    deliveryMethod: 'specific'
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        deliveryAddress: '',
        citofonoNome: '',
        deliveryTime: '',
        deliveryMethod: 'specific'
      });
      setAddressValidation(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
    
    // Validate address when it changes
    if (field === 'deliveryAddress' && value.trim()) {
      validateAddress(value);
    }
  };

  const validateAddress = async (address: string) => {
    if (!address.trim()) return;
    
    setIsValidatingAddress(true);
    try {
      const result = await shippingZoneService.validateAddress(address);
      setAddressValidation(result);
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressValidation({
        isValid: false,
        isWithinZone: false,
        message: 'Errore nella validazione dell\'indirizzo'
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  };

  const createSatisPayOrder = async () => {
    // Validate business hours
    const businessHoursValidation = await validateOrderTime();
    if (!businessHoursValidation.valid) {
      throw new Error(businessHoursValidation.message);
    }

    if (!addressValidation?.isValid || !addressValidation?.isWithinZone) {
      throw new Error('Indirizzo non valido o fuori zona di consegna');
    }

    // Get client identity for order tracking
    const clientIdentity = await getOrCreateClientIdentity();
    console.log('🆔 Creating SatisPay order with client ID:', clientIdentity.clientId.slice(-12));

    const orderNumber = generateOrderNumber();
    const deliveryFee = addressValidation.deliveryFee || 0;
    const subtotal = totalAmount || 0;
    const finalTotal = subtotal + deliveryFee;

    // Create SatisPay order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        delivery_type: 'delivery',
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        status: 'confirmed',
        payment_status: 'paid', // Mark as paid since user confirmed payment
        payment_method: 'satispay',
        user_id: null,
        metadata: {
          deliveryFee,
          estimatedTime: addressValidation.estimatedTime,
          coordinates: addressValidation.coordinates,
          formattedAddress: addressValidation.formattedAddress,
          deliveryMethod: customerData.deliveryMethod,
          deliveryTime: customerData.deliveryMethod === 'specific' ? customerData.deliveryTime : null,
          cartItems: cartItems.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            special_requests: item.specialRequests
          })),
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false,
          paymentConfirmedAt: new Date().toISOString()
        },
        special_instructions: customerData.deliveryMethod === 'asap'
          ? `Ordine per consegna a domicilio - APPENA POSSIBILE (entro 30 minuti) - PAGATO CON SATISPAY\n${cartItems.map(item =>
              `${item.product.name} x${item.quantity}${item.specialRequests ? ` (${item.specialRequests})` : ''}`
            ).join('\n')}`
          : `Ordine per consegna a domicilio - Orario richiesto: ${customerData.deliveryTime} - PAGATO CON SATISPAY\n${cartItems.map(item =>
              `${item.product.name} x${item.quantity}${item.specialRequests ? ` (${item.specialRequests})` : ''}`
            ).join('\n')}`
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Errore nella creazione dell'ordine SatisPay: ${orderError.message}`);
    }

    // Create notification for SatisPay order
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: order.id,
        notification_type: 'new_order',
        title: 'Nuovo Ordine SatisPay!',
        message: `New SatisPay cart order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)} - PAID`,
        is_read: false
      });

    if (notificationError) {
      console.error('❌ Failed to create SatisPay notification:', notificationError);
    }

    return order;
  };

  const createCashOrder = async () => {
    // Validate business hours
    const businessHoursValidation = await validateOrderTime();
    if (!businessHoursValidation.valid) {
      throw new Error(businessHoursValidation.message);
    }

    if (!addressValidation?.isValid || !addressValidation?.isWithinZone) {
      throw new Error('Indirizzo non valido o fuori zona di consegna');
    }

    // Get client identity for order tracking
    const clientIdentity = await getOrCreateClientIdentity();
    console.log('🆔 Creating order with client ID:', clientIdentity.clientId.slice(-12));

    const orderNumber = generateOrderNumber();
    const deliveryFee = addressValidation.deliveryFee || 0;
    const subtotal = totalAmount || 0;
    const finalTotal = subtotal + deliveryFee;
    console.log('💰 CartCheckout - subtotal:', subtotal, 'deliveryFee:', deliveryFee, 'finalTotal:', finalTotal);

    // Create order with client identification and user authentication
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        citofono_nome: customerData.citofonoNome || null,
        delivery_type: 'delivery',
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        status: 'confirmed',
        payment_status: 'pending',
        payment_method: 'cash_on_delivery',
        user_id: null, // 🎯 No authentication required for orders
        metadata: {
          deliveryFee,
          estimatedTime: addressValidation.estimatedTime,
          coordinates: addressValidation.coordinates,
          formattedAddress: addressValidation.formattedAddress,
          deliveryMethod: customerData.deliveryMethod,
          deliveryTime: customerData.deliveryMethod === 'specific' ? customerData.deliveryTime : null,
          cartItems: cartItems.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            special_requests: item.specialRequests
          })),
          // 🎯 CLIENT IDENTIFICATION FOR ORDER TRACKING
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false
        },
        special_instructions: customerData.deliveryMethod === 'asap'
          ? `Ordine per consegna a domicilio - APPENA POSSIBILE (entro 30 minuti)\n${cartItems.map(item =>
              `${item.product.name} x${item.quantity}${item.specialRequests ? ` (${item.specialRequests})` : ''}`
            ).join('\n')}`
          : `Ordine per consegna a domicilio - Orario richiesto: ${customerData.deliveryTime}\n${cartItems.map(item =>
              `${item.product.name} x${item.quantity}${item.specialRequests ? ` (${item.specialRequests})` : ''}`
            ).join('\n')}`
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      console.error('Order data that failed:', {
        order_number: orderNumber,
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        delivery_type: 'delivery',
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'cash_on_delivery'
      });
      throw new Error(`Errore nella creazione dell'ordine: ${orderError.message}`);
    }

    // Create order items with proper impasto and extras pricing
    const orderItems = cartItems.map(item => {
      const basePrice = item.product.price * item.quantity;
      const impastaPrice = item.impastaType ?
        (typeof item.impastaType.price === 'string' ? parseFloat(item.impastaType.price) : (item.impastaType.price || 0)) * item.quantity : 0;
      const extrasPrice = item.extras ?
        item.extras.reduce((total, extra) => total + (extra.price * extra.quantity * item.quantity), 0) : 0;
      const itemTotal = basePrice + impastaPrice + extrasPrice;

      return {
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: itemTotal,
        unit_price: item.product.price,
        special_requests: item.specialRequests,
        toppings: item.extras ? item.extras.map(extra => `${extra.name} x${extra.quantity} (+€${extra.price})`) : null,
        metadata: {
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
        }
      };
    });

    // Note: Delivery fee is stored in orders.delivery_fee column

    console.log('🔍 Inserting order items:', orderItems);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Order items insertion failed:', itemsError);
      console.error('❌ Order items data that failed:', orderItems);
      throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
    }
    console.log('✅ Order items created successfully');

    // Create standardized notification using database function
    console.log('🔔 [CartCheckout] Creating notification for order:', order.id);
    try {
      // Try using database function first
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_order_notification', {
          p_order_id: order.id,
          p_notification_type: 'new_order',
          p_message: `Nuovo Ordine! New cart order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)}`
        });

      if (functionError) {
        console.error('❌ [CartCheckout] Database function failed:', functionError);

        // Fallback to direct insert
        console.log('🔄 [CartCheckout] Trying direct insert fallback...');
        const { data: notificationData, error: insertError } = await supabase
          .from('order_notifications')
          .insert({
            order_id: order.id,
            notification_type: 'new_order',
            message: `Nuovo Ordine! New cart order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)}`,
            is_read: false
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ [CartCheckout] Direct insert also failed:', insertError);
          throw insertError;
        } else {
          console.log('✅ [CartCheckout] Notification created via direct insert:', notificationData);
        }
      } else {
        console.log('✅ [CartCheckout] Notification created via database function:', functionResult);
      }

      // Dispatch custom event to trigger notification system
      console.log('📡 [CartCheckout] Dispatching newOrderReceived event');
      window.dispatchEvent(new CustomEvent('newOrderReceived', {
        detail: { orderId: order.id, customerName: customerData.customerName }
      }));

      // Force trigger notification system immediately
      console.log('🚨 [CartCheckout] Force triggering notification system');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceNotificationCheck'));
      }, 500);

    } catch (error) {
      console.error('❌ [CartCheckout] CRITICAL: All notification creation methods failed:', error);
      // Don't throw error - order should still be created even if notification fails
    }

    // 🎯 AUTOMATICALLY SAVE ORDER FOR TRACKING
    console.log('💾 Saving order for tracking:', {
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      created_at: order.created_at
    });

    const trackingSaved = await saveClientOrder({
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      created_at: order.created_at
    });

    console.log('✅ Order tracking save result:', trackingSaved);
    console.log('📦 localStorage after save:', localStorage.getItem('pizzeria_active_order'));

    // Complete order (no payment processing needed)
    console.log('✅ Order completed successfully');

    // Update order status to confirmed
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'pending'
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
    }

    // Show completion modal with receipt
    setCompletionReceiptData({
      order: {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        total_amount: order.total_amount,
        delivery_fee: deliveryFee,
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        delivery_type: 'delivery',
        created_at: order.created_at,
        special_instructions: order.special_instructions,
        citofono_nome: order.citofono_nome,
        order_status: 'confirmed'
      },
      cartItems: cartItems
    });
    setIsCompletionModalOpen(true);
  };

  const createPosOrder = async () => {
    // Validate business hours
    const businessHoursValidation = await validateOrderTime();
    if (!businessHoursValidation.valid) {
      throw new Error(businessHoursValidation.message);
    }

    if (!addressValidation?.isValid || !addressValidation?.isWithinZone) {
      throw new Error('Indirizzo non valido o fuori zona di consegna');
    }

    // Get client identity for order tracking
    const clientIdentity = await getOrCreateClientIdentity();
    console.log('🆔 Creating POS order with client ID:', clientIdentity.clientId.slice(-12));

    const orderNumber = generateOrderNumber();
    const deliveryFee = addressValidation.deliveryFee || 0;
    const subtotal = totalAmount || 0;
    const posFee = POS_FEE; // Add POS fee for POS orders
    const finalTotal = subtotal + deliveryFee + posFee;
    console.log('💰 CartCheckout POS - subtotal:', subtotal, 'deliveryFee:', deliveryFee, 'posFee:', posFee, 'finalTotal:', finalTotal);

    // Create order with client identification and user authentication
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        citofono_nome: customerData.citofonoNome || null,
        delivery_type: 'delivery',
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        status: 'confirmed',
        payment_status: 'pending',
        payment_method: 'pos_on_delivery',
        user_id: null, // 🎯 No authentication required for orders
        metadata: {
          deliveryFee,
          posFee: POS_FEE,
          estimatedTime: addressValidation.estimatedTime,
          coordinates: addressValidation.coordinates,
          formattedAddress: addressValidation.formattedAddress,
          deliveryMethod: customerData.deliveryMethod,
          deliveryTime: customerData.deliveryMethod === 'specific' ? customerData.deliveryTime : null,
          // 🎯 CLIENT IDENTIFICATION FOR ORDER TRACKING
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false,
          cartItems: cartItems.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            specialRequests: item.specialRequests
          }))
        },
        special_instructions: customerData.deliveryMethod === 'asap'
          ? `Ordine per consegna a domicilio - APPENA POSSIBILE (entro 30 minuti) - POS Fee: €${POS_FEE.toFixed(2)}`
          : `Ordine per consegna a domicilio - Orario richiesto: ${customerData.deliveryTime} - POS Fee: €${POS_FEE.toFixed(2)}`
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      const { data: existingOrder, error: existingOrderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerData.customerName,
          customer_email: customerData.customerEmail,
          customer_phone: customerData.customerPhone || 'Non fornito',
          customer_address: customerData.deliveryAddress,
          delivery_type: 'delivery',
          total_amount: finalTotal,
          delivery_fee: deliveryFee,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'pos_on_delivery'
        });
      throw new Error(`Errore nella creazione dell'ordine: ${orderError.message}`);
    }

    // Create order items with proper pricing for all features
    const orderItems = cartItems.map(item => {
      // Use centralized calculation to ensure all features are included
      const itemTotal = calculateItemTotal(item);
      const priceBreakdown = getItemPriceBreakdown(item);

      return {
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: itemTotal,
        unit_price: item.product.price,
        special_requests: item.specialRequests,
        toppings: item.extras ? item.extras.map(extra => `${extra.name} x${extra.quantity} (+€${extra.price})`) : null,
        metadata: {
          base_price: priceBreakdown.productPrice,
          impasta_type: item.impastaType || null,
          impasta_price: priceBreakdown.impastaPrice,
          base_del_pizze_type: item.baseDelPizzeType || null,
          base_del_pizze_price: priceBreakdown.baseDelPizzePrice,
          extras: item.extras || [],
          extras_price: priceBreakdown.extrasPrice,
          total_breakdown: {
            base: priceBreakdown.productPrice,
            impasta: priceBreakdown.impastaPrice,
            base_del_pizze: priceBreakdown.baseDelPizzePrice,
            extras: priceBreakdown.extrasPrice,
            total: itemTotal
          }
        } as any
      };
    });

    // Note: Delivery fee is stored in orders.delivery_fee column
    // Note: POS fee is stored in orders.metadata.posFee

    console.log('🔍 Inserting POS order items:', orderItems);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ POS Order items insertion failed:', itemsError);
      console.error('❌ POS Order items data that failed:', orderItems);
      throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
    }
    console.log('✅ POS Order items created successfully');

    // Create standardized notification using database function
    console.log('🔔 [CartCheckout] Creating notification for POS order:', order.id);
    try {
      // Try using database function first
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_order_notification', {
          p_order_id: order.id,
          p_notification_type: 'new_order',
          p_message: `Nuovo Ordine POS! New POS cart order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)} (incl. €${POS_FEE.toFixed(2)} POS fee)`
        });

      if (functionError) {
        console.error('❌ [CartCheckout] POS Database function failed:', functionError);

        // Fallback to direct insert
        console.log('🔄 [CartCheckout] Trying POS direct insert fallback...');
        const { data: notificationData, error: insertError } = await supabase
          .from('order_notifications')
          .insert({
            order_id: order.id,
            notification_type: 'new_order',
            message: `Nuovo Ordine POS! New POS cart order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)} (incl. €${POS_FEE.toFixed(2)} POS fee)`,
            is_read: false
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ [CartCheckout] POS Direct insert also failed:', insertError);
          throw insertError;
        } else {
          console.log('✅ [CartCheckout] POS Notification created via direct insert:', notificationData);
        }
      } else {
        console.log('✅ [CartCheckout] POS Notification created via database function:', functionResult);
      }

      // Dispatch custom event to trigger notification system
      console.log('📡 [CartCheckout] Dispatching newOrderReceived event for POS order');
      window.dispatchEvent(new CustomEvent('newOrderReceived', {
        detail: { orderId: order.id, customerName: customerData.customerName }
      }));

      // Force trigger notification system immediately
      console.log('🚨 [CartCheckout] Force triggering notification system for POS order');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceNotificationCheck'));
      }, 500);

    } catch (error) {
      console.error('❌ [CartCheckout] CRITICAL: All POS notification creation methods failed:', error);
      // Don't throw error - order should still be created even if notification fails
    }

    // 🎯 AUTOMATICALLY SAVE ORDER FOR TRACKING
    console.log('💾 Saving POS order for tracking:', {
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      created_at: order.created_at
    });

    const trackingSaved = await saveClientOrder({
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      created_at: order.created_at
    });

    console.log('✅ POS Order tracking save result:', trackingSaved);
    console.log('📦 localStorage after POS save:', localStorage.getItem('pizzeria_active_order'));

    // Complete order (no payment processing needed)
    console.log('✅ POS Order completed successfully');

    // Update order status to confirmed
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'pending'
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Error updating POS order status:', updateError);
    }

    // Show completion modal with receipt
    setCompletionReceiptData({
      order: {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        total_amount: order.total_amount,
        delivery_fee: deliveryFee,
        payment_method: 'pos_on_delivery',
        payment_status: 'pending',
        delivery_type: 'delivery',
        created_at: order.created_at,
        special_instructions: order.special_instructions,
        citofono_nome: order.citofono_nome,
        order_status: 'confirmed',
        metadata: {
          posFee: POS_FEE
        }
      },
      cartItems: cartItems
    });
    setIsCompletionModalOpen(true);
  };

  const isFormValid = () => {
    return customerData.customerName.trim() &&
           customerData.customerEmail.trim() &&
           customerData.deliveryAddress.trim() &&
           addressValidation?.isValid &&
           addressValidation?.isWithinZone &&
           customerData.deliveryMethod &&
           (customerData.deliveryMethod === 'asap' ||
            (customerData.deliveryMethod === 'specific' && customerData.deliveryTime.trim()));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Checkout - {cartItems.length} Prodotti</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Riepilogo Ordine</h3>
            <div className="space-y-2 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>€{((typeof item.product.price === 'string' ? parseFloat(item.product.price) : (item.product.price || 0)) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-medium flex justify-between">
                <span>Subtotale:</span>
                <span>€{(totalAmount || 0).toFixed(2)}</span>
              </div>
              {addressValidation?.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Spese di consegna:</span>
                  <span>€{(addressValidation.deliveryFee || 0).toFixed(2)}</span>
                </div>
              )}
              {deliveryPaymentMethod === 'pos' && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Spesa POS a domicilio:</span>
                  <span>€{POS_FEE.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 font-bold flex justify-between">
                <span>Totale:</span>
                <span>€{(calculateTotal() || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Informazioni Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome Completo *</Label>
                <Input
                  id="customerName"
                  value={customerData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Il tuo nome completo"
                  className="mobile-input min-h-[44px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="la-tua-email@esempio.com"
                  className="mobile-input min-h-[44px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefono *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="+39 123 456 7890"
                className="mobile-input min-h-[44px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Indirizzo di Consegna *</Label>
              <Input
                id="deliveryAddress"
                value={customerData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                placeholder="Via Roma 123, Milano, 20100"
                className="mobile-input min-h-[44px]"
                required
              />
              {isValidatingAddress && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 size={14} className="animate-spin" />
                  Validazione indirizzo...
                </div>
              )}
              {addressValidation && (
                <div className={`text-sm p-2 rounded ${
                  addressValidation.isValid && addressValidation.isWithinZone
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {addressValidation.message}
                  {addressValidation.deliveryFee > 0 && (
                    <div className="mt-1">
                      Spese di consegna: €{(addressValidation.deliveryFee || 0).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="citofonoNome">Nome Citofono</Label>
              <Input
                id="citofonoNome"
                value={customerData.citofonoNome}
                onChange={(e) => handleInputChange('citofonoNome', e.target.value)}
                placeholder="Nome sul citofono (se diverso dal tuo)"
              />
              <p className="text-xs text-gray-500">
                Inserisci il nome da suonare al citofono se diverso dal tuo nome
              </p>
            </div>

            {/* Delivery Method Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Modalità di Consegna *</Label>

              <RadioGroup
                value={customerData.deliveryMethod}
                onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                className="space-y-3"
              >
                {/* Appena Possibile Option */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="asap" id="cart-delivery-asap" className="mt-1" />
                  <Label htmlFor="cart-delivery-asap" className="cursor-pointer flex-1">
                    <div className="font-medium text-green-700">🚀 Appena Possibile</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Il tuo ordine sarà consegnato entro 30 minuti. Ti chiameremo quando è pronto per la consegna.
                    </div>
                  </Label>
                </div>

                {/* Specific Time Option */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="specific" id="cart-delivery-specific" className="mt-1" />
                  <Label htmlFor="cart-delivery-specific" className="cursor-pointer flex-1">
                    <div className="font-medium text-blue-700">🕐 Orario Richiesto</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Scegli un orario specifico per la consegna (18:00 - 22:30)
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Time Selection - Only show when specific time is selected */}
              {customerData.deliveryMethod === 'specific' && (
                <div className="mt-4">
                  <Label htmlFor="cartDeliveryTime">Seleziona Orario di Consegna *</Label>
                  <Select
                    value={customerData.deliveryTime}
                    onValueChange={(value) => handleInputChange('deliveryTime', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Scegli un orario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryTimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Orari disponibili dalle 18:00 alle 22:30. Ti contatteremo su WhatsApp per confermare la disponibilità.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Tabs defaultValue={satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url ? "satispay" : "later"} className="w-full payment-tabs">
              <TabsList className="w-full flex gap-2 mb-6">
                {satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url && (
                  <TabsTrigger value="satispay" className="flex items-center justify-center gap-1 flex-1">
                    <QrCode className="h-4 w-4" />
                    SatisPay
                  </TabsTrigger>
                )}
                <TabsTrigger value="later" className="flex items-center justify-center gap-1 flex-1">
                  <Banknote className="h-4 w-4" />
                  Alla Consegna
                </TabsTrigger>
              </TabsList>

              {/* SatisPay Payment */}
              {satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url && (
                <TabsContent value="satispay" className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Pagamento SatisPay</h4>
                    <p className="text-yellow-700 text-sm">
                      Paga subito con SatisPay scansionando il QR code. Veloce e sicuro.
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsSatisPayModalOpen(true)}
                    disabled={!isFormValid()}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Paga €{(calculateTotal() || 0).toFixed(2)} con SatisPay
                  </Button>
                </TabsContent>
              )}

              <TabsContent value="later" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Paga alla Consegna</h4>
                  <p className="text-gray-700 text-sm">
                    Scegli il metodo di pagamento per la consegna. Il tuo ordine sarà confermato e ti contatteremo su WhatsApp per i dettagli.
                  </p>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Metodo di Pagamento:</Label>
                  <RadioGroup
                    value={deliveryPaymentMethod}
                    onValueChange={(value: 'contanti' | 'pos') => setDeliveryPaymentMethod(value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="contanti" id="contanti" />
                      <Label htmlFor="contanti" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Contanti</div>
                          <div className="text-sm text-gray-500">Paga in contanti alla consegna</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="pos" id="pos" />
                      <Label htmlFor="pos" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">POS (Carta)</div>
                          <div className="text-sm text-gray-500">
                            Paga con carta alla consegna (+€{POS_FEE.toFixed(2)} spesa POS a domicilio)
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Total Display */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Totale:</span>
                      <span className="text-blue-600">€{(calculateTotal() || 0).toFixed(2)}</span>
                    </div>
                    {deliveryPaymentMethod === 'pos' && (
                      <div className="text-sm text-blue-600 mt-1">
                        (Include €{POS_FEE.toFixed(2)} spesa POS a domicilio)
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    console.log('🔄 Conferma Ordine clicked!');
                    console.log('📋 Customer data:', customerData);
                    console.log('📍 Address validation:', addressValidation);
                    console.log('🛒 Cart items:', cartItems);
                    console.log('💳 Payment method:', deliveryPaymentMethod);

                    setIsSubmitting(true);
                    try {
                      if (deliveryPaymentMethod === 'contanti') {
                        await createCashOrder();
                      } else {
                        await createPosOrder();
                      }
                      clearCart();
                      // Don't close immediately - completion modal will handle closing
                    } catch (error) {
                      console.error('❌ Order error:', error);
                      console.error('❌ Error details:', {
                        message: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : undefined,
                        customerData,
                        addressValidation,
                        cartItems,
                        paymentMethod: deliveryPaymentMethod
                      });
                      toast({
                        title: 'Errore nell\'ordine',
                        description: error instanceof Error ? error.message : 'Si è verificato un errore',
                        variant: 'destructive'
                      });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione ordine...
                    </>
                  ) : (
                    `Conferma Ordine - €${(calculateTotal() || 0).toFixed(2)}`
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* SatisPay Modal */}
      <SatisPayModal
        isOpen={isSatisPayModalOpen}
        onClose={() => setIsSatisPayModalOpen(false)}
        orderTotal={calculateTotal()}
        onPaymentConfirmed={async () => {
          setIsSubmitting(true);
          try {
            const order = await createSatisPayOrder();
            if (order) {
              clearCart();
              setCompletionReceiptData({
                order: {
                  id: order.id,
                  order_number: order.order_number,
                  customer_name: order.customer_name,
                  customer_email: order.customer_email,
                  customer_phone: order.customer_phone,
                  customer_address: order.customer_address,
                  total_amount: order.total_amount,
                  delivery_fee: addressValidation?.deliveryFee || 0,
                  payment_method: 'satispay',
                  payment_status: 'paid',
                  delivery_type: 'delivery',
                  created_at: order.created_at,
                  special_instructions: order.special_instructions,
                  citofono_nome: order.citofono_nome,
                  order_status: 'confirmed'
                },
                cartItems: cartItems
              });
              setIsCompletionModalOpen(true);
              setIsSatisPayModalOpen(false);
            }
          } catch (error) {
            toast({
              title: 'Errore nell\'ordine',
              description: error.message || 'Riprova o contattaci direttamente.',
              variant: 'destructive',
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Order Completion Modal */}
      <OrderCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setCompletionReceiptData(null);
          onClose(); // Close the main checkout modal
        }}
        receiptData={completionReceiptData}
      />
    </div>
  );
};

export default CartCheckoutModal;
