import React, { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, User, Mail, Phone, MapPin, Loader2, AlertCircle, QrCode, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CartItem, useSimpleCart } from '@/hooks/use-simple-cart';
import { supabase } from '@/integrations/supabase/client';
import CartIcon from '@/components/icons/CartIcon';
import shippingZoneService from '@/services/shippingZoneService';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';

import { getOrCreateClientIdentity } from '@/utils/clientIdentification';
import SatisPayModal from '@/components/SatisPayModal';
import { useSatisPaySettings } from '@/hooks/useSatisPaySettings';
import { calculateItemTotal, getItemPriceBreakdown } from '@/utils/cartPriceCalculations';
import OrderCompletionModal from '@/components/OrderCompletionModal';
import { ReceiptData } from '@/utils/receiptGenerator';


interface SimpleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
}

const SimpleCheckoutModal: React.FC<SimpleCheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount
}) => {
  const { toast } = useToast();
  const { validateOrderTime, isOpen: businessIsOpen, message: businessMessage } = useBusinessHoursContext();
  const { clearCart } = useSimpleCart();
  const { settings: satisPaySettings } = useSatisPaySettings();
  // Customer authentication removed - orders work without accounts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSatisPayModalOpen, setIsSatisPayModalOpen] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<any>(null);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'contanti' | 'pos'>('contanti');
  const [pickupPaymentMethod, setPickupPaymentMethod] = useState<'satispay' | 'negozio'>('negozio');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | null>(null);

  // Order completion modal state
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionReceiptData, setCompletionReceiptData] = useState<ReceiptData | null>(null);

  // POS fee constant
  const POS_FEE = 0.30; // €0.30 for POS payment at delivery

  // Generate pickup time options from 18:00 to 22:30
  const generatePickupTimeOptions = () => {
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

  const pickupTimeOptions = generatePickupTimeOptions();
  const [customerData, setCustomerData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    citofonoNome: '',
    pickupTime: '',
    pickupMethod: 'specific', // 'specific' or 'asap'
    deliveryTime: '',
    deliveryMethod: 'specific' // 'specific' or 'asap'
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
        pickupTime: '',
        pickupMethod: 'specific',
        deliveryTime: '',
        deliveryMethod: 'specific'
      });
      setAddressValidation(null);
      setOrderType(null);
      setPickupPaymentMethod('negozio');

      // Force reload shipping zones from database
      shippingZoneService.reloadFromDatabase();
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));

    // Handle automatic address validation with debouncing
    if (field === 'deliveryAddress') {
      setAddressValidation(null);

      // Clear existing timeout
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }

      // Set new timeout for automatic validation (2 seconds after user stops typing)
      if (value.trim().length >= 5) {
        const timeout = setTimeout(() => {
          validateAddressAutomatically(value);
        }, 2000);
        setValidationTimeout(timeout);
      }
    }
  };

  const validateAddress = async (address: string) => {
    if (!address.trim()) {
      toast({
        title: 'Indirizzo Richiesto',
        description: 'Inserisci un indirizzo di consegna per continuare.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🔍 Validating address:', address);
    console.log('💰 Order amount:', totalAmount);

    setIsValidatingAddress(true);
    try {
      const result = await shippingZoneService.validateDeliveryAddress(address, totalAmount);
      console.log('✅ Validation result:', result);
      setAddressValidation(result);

      if (result.isValid && result.isWithinZone) {
        toast({
          title: 'Indirizzo Validato ✅',
          description: `Consegna disponibile - Distanza: ${result.distance?.toFixed(1)}km`,
        });
      } else {
        toast({
          title: 'Consegna Non Disponibile',
          description: result.error || 'Non possiamo consegnare a questo indirizzo.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Address validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nella validazione dell\'indirizzo';

      setAddressValidation({
        isValid: false,
        isWithinZone: false,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 },
        error: errorMessage
      });

      toast({
        title: 'Errore di Validazione',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  // Automatic address validation with debouncing
  const validateAddressAutomatically = useCallback(async (address: string) => {
    if (!address.trim() || address.length < 5) {
      setAddressValidation(null);
      return;
    }

    console.log('🔄 Auto-validating address:', address);
    setIsValidatingAddress(true);

    try {
      const result = await shippingZoneService.validateDeliveryAddress(address, totalAmount);
      console.log('✅ Auto-validation result:', result);
      setAddressValidation(result);

      // Don't show toast notifications for automatic validation
      // Only visual feedback through the UI
    } catch (error) {
      console.error('❌ Auto-validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nella validazione dell\'indirizzo';

      setAddressValidation({
        isValid: false,
        isWithinZone: false,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 },
        error: errorMessage
      });
    } finally {
      setIsValidatingAddress(false);
    }
  }, [totalAmount]);

  const isFormValid = () => {
    const basicInfo = customerData.customerName.trim() &&
                     customerData.customerEmail.trim() &&
                     customerData.customerPhone.trim();

    if (orderType === 'delivery') {
      const deliveryFormValid = basicInfo &&
                               customerData.deliveryAddress.trim() &&
                               addressValidation?.isValid &&
                               customerData.deliveryMethod &&
                               (customerData.deliveryMethod === 'asap' ||
                                (customerData.deliveryMethod === 'specific' && customerData.deliveryTime.trim()));
      return deliveryFormValid && businessIsOpen;
    } else if (orderType === 'pickup') {
      const pickupFormValid = basicInfo &&
                             customerData.pickupMethod &&
                             (customerData.pickupMethod === 'asap' ||
                              (customerData.pickupMethod === 'specific' && customerData.pickupTime.trim()));
      return pickupFormValid && businessIsOpen;
    }

    return false;
  };

  const calculateTotal = () => {
    const deliveryFee = addressValidation?.deliveryFee || 0;
    const subtotal = totalAmount || 0;
    const posFee = deliveryPaymentMethod === 'pos' ? POS_FEE : 0;
    const total = subtotal + deliveryFee + posFee;
    console.log('💰 calculateTotal - subtotal:', subtotal, 'deliveryFee:', deliveryFee, 'posFee:', posFee, 'total:', total);
    return total;
  };

  const createStripeOrder = async () => {
    // Validate business hours
    const timeValidation = await validateOrderTime();
    if (!timeValidation.valid) {
      toast({
        title: 'Ordini non disponibili',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get client identity for order tracking
      const clientIdentity = await getOrCreateClientIdentity();
      console.log('🆔 Creating Simple Stripe order with client ID:', clientIdentity.clientId.slice(-12));

      // Create order in database with client identification and user authentication
      const orderData = {
        order_number: generateOrderNumber(),
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        citofono_nome: customerData.citofonoNome || null,
        delivery_type: 'delivery',
        total_amount: calculateTotal(),
        delivery_fee: addressValidation?.deliveryFee || 0,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'stripe',
        user_id: null, // 🎯 No authentication required for orders
        metadata: {
          // 🎯 CLIENT IDENTIFICATION FOR ORDER TRACKING
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

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
          special_requests: item.specialRequests || null,
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

      console.log('🔍 SimpleCheckout: Inserting order items:', orderItems);
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ SimpleCheckout: Order items insertion failed:', itemsError);
        console.error('❌ SimpleCheckout: Order items data that failed:', orderItems);
        throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
      }
      console.log('✅ SimpleCheckout: Order items created successfully');

      // Create standardized notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          message: `Nuovo Ordine! New order from ${customerData.customerName} - ${cartItems.length} items - €${calculateTotal().toFixed(2)}`,
          is_read: false
        });

      if (notificationError) {
        console.error('❌ Failed to create notification:', notificationError);
      } else {
        console.log('✅ Simple checkout notification created successfully');
      }

      // Prepare Stripe line items
      const stripeItems = cartItems.map(item => {
        const extrasPrice = item.extras ?
          item.extras.reduce((total, extra) => total + (extra.price * extra.quantity), 0) : 0;
        const itemTotalPrice = item.product.price + extrasPrice;

        let description = item.product.description || `${item.product.name} - Pizzeria Regina 2000`;
        if (item.extras && item.extras.length > 0) {
          const extrasText = item.extras.map(extra => `${extra.name} x${extra.quantity}`).join(', ');
          description += ` | Extra: ${extrasText}`;
        }
        if (item.specialRequests) {
          description += ` | Note: ${item.specialRequests}`;
        }

        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.product.name,
              description: description,
            },
            unit_amount: Math.round(itemTotalPrice * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      });

      // Add delivery fee as separate line item if applicable
      if (addressValidation?.deliveryFee && addressValidation.deliveryFee > 0) {
        stripeItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Costo di Consegna',
              description: `Consegna a ${customerData.deliveryAddress}`,
            },
            unit_amount: Math.round(addressValidation.deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      // Prepare Stripe checkout session data
      const stripeData = {
        payment_method_types: ['card'],
        line_items: stripeItems,
        mode: 'payment',
        customer_email: customerData.customerEmail,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
        },
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${window.location.origin}/payment/cancel?order_id=${order.id}`,
        metadata: {
          order_id: order.id,
          customer_name: customerData.customerName,
          customer_phone: customerData.customerPhone || 'Non fornito',
          source: 'francesco_fiori_website',
          order_type: 'cart_order',
        }
      };

      console.log('📤 Creating Stripe checkout session...');
      console.log('📋 Stripe data:', JSON.stringify(stripeData, null, 2));

      // Use Netlify function for production, localhost for development
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3003/create-checkout-session'
        : '/.netlify/functions/create-checkout-session';

      console.log('🌐 Using API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeData),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Stripe server error response:', errorText);
        throw new Error(`Stripe error: ${response.status} - ${errorText}`);
      }

      const session = await response.json();
      console.log('✅ Stripe session created:', session.id);

      // Update order with Stripe session ID
      await supabase
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', order.id);

      // ✅ Order saved to database - tracking handled by UnifiedOrderTracker
      console.log('✅ Order created and will be tracked via database-only system');
      console.log('✅ Simple Stripe order automatically saved for tracking:', order.order_number);

      // Redirect to Stripe
      console.log('🚀 Redirecting to Stripe...');
      window.location.href = session.url;

    } catch (error) {
      console.error('Stripe order error:', error);
      toast({
        title: 'Errore nel pagamento',
        description: error instanceof Error ? error.message : 'Si è verificato un errore',
        variant: 'destructive'
      });
    }
  };

  const createSatisPayOrder = async () => {
    // Validate business hours
    const timeValidation = await validateOrderTime();
    if (!timeValidation.valid) {
      toast({
        title: 'Ordini non disponibili',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get client identity for order tracking
      const clientIdentity = await getOrCreateClientIdentity();
      console.log('🆔 Creating SatisPay order with client ID:', clientIdentity.clientId.slice(-12));

      // Create order in database with SatisPay payment method
      const orderData = {
        order_number: generateOrderNumber(),
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        citofono_nome: customerData.citofonoNome || null,
        delivery_type: 'delivery',
        total_amount: calculateTotal(),
        delivery_fee: addressValidation?.deliveryFee || 0,
        status: 'confirmed',
        payment_status: 'paid', // Mark as paid since user confirmed payment
        payment_method: 'satispay',
        user_id: null,
        special_instructions: customerData.deliveryMethod === 'asap'
          ? 'Ordine per consegna a domicilio - APPENA POSSIBILE (entro 30 minuti) - PAGATO CON SATISPAY'
          : `Ordine per consegna a domicilio - Orario richiesto: ${customerData.deliveryTime} - PAGATO CON SATISPAY`,
        metadata: {
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false,
          paymentConfirmedAt: new Date().toISOString(),
          deliveryFee: addressValidation?.deliveryFee || 0,
          estimatedTime: addressValidation?.estimatedTime,
          coordinates: addressValidation?.coordinates,
          formattedAddress: addressValidation?.formattedAddress,
          deliveryMethod: customerData.deliveryMethod,
          deliveryTime: customerData.deliveryMethod === 'specific' ? customerData.deliveryTime : null
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

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
          special_requests: item.specialRequests || null,
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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
      }

      // Create notification for SatisPay order
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          title: 'Nuovo Ordine SatisPay!',
          message: `New SatisPay order from ${customerData.customerName} - ${cartItems.length} items - €${calculateTotal().toFixed(2)} - PAID`,
          is_read: false
        });

      if (notificationError) {
        console.error('❌ Failed to create SatisPay notification:', notificationError);
      }

      return order;

    } catch (error) {
      console.error('SatisPay order error:', error);
      throw error;
    }
  };

  const createCashOrder = async () => {
    // Validate business hours
    const timeValidation = await validateOrderTime();
    if (!timeValidation.valid) {
      toast({
        title: 'Ordini non disponibili',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get client identity for order tracking
      const clientIdentity = await getOrCreateClientIdentity();
      console.log('🆔 Creating Simple PayLater order with client ID:', clientIdentity.clientId.slice(-12));

      // Create order in database with client identification and user authentication
      const orderData = {
        order_number: generateOrderNumber(),
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone || 'Non fornito',
        customer_address: customerData.deliveryAddress,
        citofono_nome: customerData.citofonoNome || null,
        delivery_type: 'delivery',
        total_amount: calculateTotal(),
        delivery_fee: addressValidation?.deliveryFee || 0,
        status: 'confirmed',
        payment_status: 'pending',
        payment_method: 'cash_on_delivery',
        user_id: null, // 🎯 No authentication required for orders
        special_instructions: customerData.deliveryMethod === 'asap'
          ? 'Ordine per consegna a domicilio - APPENA POSSIBILE (entro 30 minuti)'
          : `Ordine per consegna a domicilio - Orario richiesto: ${customerData.deliveryTime}`,
        metadata: {
          // 🎯 CLIENT IDENTIFICATION FOR ORDER TRACKING
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false,
          deliveryFee: addressValidation?.deliveryFee || 0,
          estimatedTime: addressValidation?.estimatedTime,
          coordinates: addressValidation?.coordinates,
          formattedAddress: addressValidation?.formattedAddress,
          deliveryMethod: customerData.deliveryMethod,
          deliveryTime: customerData.deliveryMethod === 'specific' ? customerData.deliveryTime : null
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

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
          special_requests: item.specialRequests || null,
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

      console.log('🔍 SimpleCheckout PayLater: Inserting order items:', orderItems);
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ SimpleCheckout PayLater: Order items insertion failed:', itemsError);
        console.error('❌ SimpleCheckout PayLater: Order items data that failed:', orderItems);
        throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
      }
      console.log('✅ SimpleCheckout PayLater: Order items created successfully');

      // Create standardized notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          title: 'Nuovo Ordine!',
          message: `New pay-later order from ${customerData.customerName} - ${cartItems.length} items - €${calculateTotal().toFixed(2)}`,
          is_read: false
        });

      if (notificationError) {
        console.error('❌ Failed to create pay-later notification:', notificationError);
      } else {
        console.log('✅ Pay-later simple checkout notification created successfully');
      }

      // ✅ Order saved to database - tracking handled by UnifiedOrderTracker
      console.log('✅ PayLater order created and will be tracked via database-only system');
      console.log('✅ Simple PayLater order automatically saved for tracking:', order.order_number);

      return order;

    } catch (error) {
      console.error('Cash order error:', error);
      throw error;
    }
  };

  const createPosOrder = async () => {
    // Validate business hours
    const timeValidation = await validateOrderTime();
    if (!timeValidation.valid) {
      toast({
        title: 'Ordini non disponibili',
        description: timeValidation.message,
        variant: 'destructive',
      });
      throw new Error(timeValidation.message);
    }

    try {
      // Get client identity for order tracking
      const clientIdentity = await getOrCreateClientIdentity();
      console.log('🆔 Creating POS order with client ID:', clientIdentity.clientId.slice(-12));

      const orderNumber = generateOrderNumber();
      const deliveryFee = addressValidation?.deliveryFee || 0;
      const subtotal = totalAmount || 0;
      const posFee = POS_FEE; // Add POS fee for POS orders
      const finalTotal = subtotal + deliveryFee + posFee;

      // Create order in database with POS payment method
      const orderData = {
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
        user_id: null,
        metadata: {
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          deliveryFee,
          posFee: POS_FEE,
          estimatedTime: addressValidation?.estimatedTime,
          coordinates: addressValidation?.coordinates,
          formattedAddress: addressValidation?.formattedAddress,
          deliveryMethod: customerData.deliveryMethod,
          deliveryTime: customerData.deliveryMethod === 'specific' ? customerData.deliveryTime : null,
          cartItems: cartItems.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            specialRequests: item.specialRequests
          })),
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false
        },
        special_instructions: customerData.deliveryMethod === 'asap'
          ? `Ordine per consegna a domicilio - APPENA POSSIBILE (entro 30 minuti) - POS Fee: €${POS_FEE.toFixed(2)}`
          : `Ordine per consegna a domicilio - Orario richiesto: ${customerData.deliveryTime} - POS Fee: €${POS_FEE.toFixed(2)}`
      };

      console.log('🔍 Creating POS order with data:', orderData);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('❌ POS Order creation failed:', orderError);
        throw new Error(`Errore nella creazione dell'ordine: ${orderError.message}`);
      }

      console.log('✅ POS Order created successfully:', order);

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
        console.error('❌ POS Order items creation failed:', itemsError);
        throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
      }

      console.log('✅ POS Order items created successfully');

      // Create notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          title: 'Nuovo Ordine POS!',
          message: `New POS order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)} (incl. €${POS_FEE.toFixed(2)} POS fee)`,
          is_read: false
        });

      if (notificationError) {
        console.error('❌ Failed to create POS notification:', notificationError);
      } else {
        console.log('✅ POS Notification created successfully');
      }

      // Force trigger notification system
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceNotificationCheck'));
      }, 500);

      console.log('✅ POS order created and will be tracked via database-only system');
      console.log('✅ Simple POS order automatically saved for tracking:', order.order_number);

      return order;

    } catch (error) {
      console.error('POS order error:', error);
      throw error;
    }
  };

  // Create pickup order (payment at store)
  const createPickupOrder = async () => {
    try {
      // Validate business hours
      const timeValidation = await validateOrderTime();
      if (!timeValidation.valid) {
        toast({
          title: 'Ordini Chiusi',
          description: timeValidation.message,
          variant: 'destructive',
        });
        return;
      }

      // Validate required fields for pickup
      if (!customerData.customerName.trim() || !customerData.customerEmail.trim() || !customerData.customerPhone.trim()) {
        toast({
          title: 'Campi Richiesti',
          description: 'Nome, email e telefono sono obbligatori per il ritiro.',
          variant: 'destructive',
        });
        return;
      }

      // Validate pickup method and time
      if (!customerData.pickupMethod) {
        toast({
          title: 'Modalità di Ritiro Richiesta',
          description: 'Seleziona una modalità di ritiro.',
          variant: 'destructive',
        });
        return;
      }

      if (customerData.pickupMethod === 'specific' && !customerData.pickupTime.trim()) {
        toast({
          title: 'Orario Richiesto',
          description: 'Seleziona un orario specifico per il ritiro.',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);

      // Create order with pickup method details
      const pickupNotes = customerData.pickupMethod === 'asap'
        ? 'Ordine per ritiro in negozio - APPENA POSSIBILE (entro 30 minuti)'
        : `Ordine per ritiro in negozio - Orario specifico: ${customerData.pickupTime}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: generateOrderNumber(),
          customer_name: customerData.customerName,
          customer_email: customerData.customerEmail,
          customer_phone: customerData.customerPhone,
          customer_address: 'RITIRO IN NEGOZIO',
          delivery_type: 'pickup',
          total_amount: totalAmount,
          delivery_fee: 0,
          status: 'confirmed',
          payment_status: 'pending',
          payment_method: 'pickup_store',
          pickup_time: customerData.pickupMethod === 'specific' ? customerData.pickupTime : null,
          notes: pickupNotes,
          metadata: {
            pickup_method: customerData.pickupMethod
          }
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Pickup order creation failed:', orderError);
        throw new Error(`Errore nella creazione dell'ordine: ${orderError.message}`);
      }

      console.log('✅ Pickup order created:', order);

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
          special_requests: item.specialRequests || null,
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

      console.log('🔍 Inserting pickup order items:', orderItems);
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Pickup order items creation failed:', itemsError);
        throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
      }

      console.log('✅ Pickup order items created successfully');

      // Create notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          message: `Nuovo ordine per RITIRO ${customerData.pickupMethod === 'asap' ? '(APPENA POSSIBILE)' : `(${customerData.pickupTime})`}: ${order.order_number}`,
          is_read: false
        });

      if (notificationError) {
        console.error('❌ Notification creation failed:', notificationError);
      }

      setIsSubmitting(false);
      clearCart();
      setCompletionReceiptData({
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          customer_address: 'Ritiro in negozio',
          total_amount: order.total_amount,
          delivery_fee: 0,
          payment_method: 'pickup',
          payment_status: 'pending',
          delivery_type: 'pickup',
          pickup_time: order.pickup_time,
          created_at: order.created_at,
          special_instructions: order.special_instructions,
          order_status: 'confirmed',
          metadata: {
            pickup_method: order.metadata?.pickup_method
          }
        },
        cartItems: cartItems
      });
      setIsCompletionModalOpen(true);

      return order;

    } catch (error) {
      console.error('Pickup order error:', error);
      setIsSubmitting(false);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la creazione dell\'ordine. Riprova.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Create pickup order with SatisPay payment
  const createPickupSatisPayOrder = async () => {
    try {
      // Validate business hours
      const timeValidation = await validateOrderTime();
      if (!timeValidation.valid) {
        toast({
          title: 'Ordini non disponibili',
          description: timeValidation.message,
          variant: 'destructive',
        });
        return;
      }

      // Validate required fields for pickup
      if (!customerData.customerName.trim() || !customerData.customerEmail.trim() || !customerData.customerPhone.trim()) {
        toast({
          title: 'Campi Richiesti',
          description: 'Nome, email e telefono sono obbligatori per il ritiro.',
          variant: 'destructive',
        });
        return;
      }

      // Validate pickup method and time
      if (!customerData.pickupMethod) {
        toast({
          title: 'Modalità di Ritiro Richiesta',
          description: 'Seleziona una modalità di ritiro.',
          variant: 'destructive',
        });
        return;
      }

      if (customerData.pickupMethod === 'specific' && !customerData.pickupTime.trim()) {
        toast({
          title: 'Orario Richiesto',
          description: 'Seleziona un orario specifico per il ritiro.',
          variant: 'destructive',
        });
        return;
      }

      const totalAmount = calculateTotal();

      // Create order with pickup method details
      const pickupNotes = customerData.pickupMethod === 'asap'
        ? 'Ordine per ritiro in negozio - APPENA POSSIBILE (entro 30 minuti) - PAGATO CON SATISPAY'
        : `Ordine per ritiro in negozio - Orario specifico: ${customerData.pickupTime} - PAGATO CON SATISPAY`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: generateOrderNumber(),
          customer_name: customerData.customerName,
          customer_email: customerData.customerEmail,
          customer_phone: customerData.customerPhone,
          customer_address: 'RITIRO IN NEGOZIO',
          delivery_type: 'pickup',
          total_amount: totalAmount,
          delivery_fee: 0,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'satispay',
          pickup_time: customerData.pickupMethod === 'specific' ? customerData.pickupTime : null,
          notes: pickupNotes,
          metadata: {
            pickup_method: customerData.pickupMethod
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
          special_requests: item.specialRequests || null,
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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Order items creation failed:', itemsError);
        throw new Error(`Errore nella creazione degli articoli: ${itemsError.message}`);
      }

      // Create notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          message: `Nuovo ordine per RITIRO ${customerData.pickupMethod === 'asap' ? '(APPENA POSSIBILE)' : `(${customerData.pickupTime})`} - PAGATO SATISPAY: ${order.order_number}`,
          is_read: false
        });

      if (notificationError) {
        console.error('❌ Notification creation failed:', notificationError);
      }

      setIsSubmitting(false);
      clearCart();
      setCompletionReceiptData({
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          customer_address: 'Ritiro in negozio',
          total_amount: order.total_amount,
          delivery_fee: 0,
          payment_method: 'satispay',
          payment_status: 'paid',
          delivery_type: 'pickup',
          pickup_time: order.pickup_time,
          created_at: order.created_at,
          special_instructions: order.special_instructions,
          order_status: 'confirmed',
          metadata: {
            pickup_method: order.metadata?.pickup_method
          }
        },
        cartItems: cartItems
      });
      setIsCompletionModalOpen(true);

      return order;
    } catch (error) {
      console.error('Pickup SatisPay order error:', error);
      setIsSubmitting(false);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la creazione dell\'ordine. Riprova.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotale:</span>
                  <span>€{(totalAmount || 0).toFixed(2)}</span>
                </div>
                {addressValidation?.deliveryFee && (
                  <div className="flex justify-between text-blue-600">
                    <span>Costo consegna ({addressValidation.zone}):</span>
                    <span>€{(addressValidation.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                )}
                {deliveryPaymentMethod === 'pos' && (
                  <div className="flex justify-between text-blue-600">
                    <span>Spesa POS a domicilio:</span>
                    <span>€{POS_FEE.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-1">
                  <span>Totale:</span>
                  <span>€{(calculateTotal() || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Tipo di Ordine</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setOrderType('delivery')}
                className={`p-3 sm:p-4 border rounded-lg text-center transition-colors min-h-[60px] sm:min-h-[80px] admin-touch-target ${
                  orderType === 'delivery'
                    ? 'border-pizza-orange bg-orange-50 text-pizza-orange'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium text-sm sm:text-base">🚚 Consegna</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Consegna a domicilio
                </div>
              </button>

              <button
                onClick={() => setOrderType('pickup')}
                className={`p-3 sm:p-4 border rounded-lg text-center transition-colors min-h-[60px] sm:min-h-[80px] admin-touch-target ${
                  orderType === 'pickup'
                    ? 'border-pizza-orange bg-orange-50 text-pizza-orange'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium text-sm sm:text-base">🏪 Ritiro</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Ritiro in negozio
                </div>
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Informazioni Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerName"
                    value={customerData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="pl-10 mobile-input min-h-[44px]"
                    placeholder="Il tuo nome completo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    className="pl-10 mobile-input min-h-[44px]"
                    placeholder="la-tua-email@esempio.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerPhone">Telefono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerPhone"
                    value={customerData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className="pl-10 mobile-input min-h-[44px]"
                    placeholder="+39 123 456 7890"
                  />
                </div>
              </div>

              {/* Pickup Options - Only show for pickup orders */}
              {orderType === 'pickup' && (
                <div className="md:col-span-2 space-y-4">
                  <Label className="text-base font-medium">Modalità di Ritiro *</Label>

                  <RadioGroup
                    value={customerData.pickupMethod}
                    onValueChange={(value) => handleInputChange('pickupMethod', value)}
                    className="space-y-3"
                  >
                    {/* Appena Possibile Option */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="asap" id="asap" className="mt-1" />
                      <Label htmlFor="asap" className="cursor-pointer flex-1">
                        <div className="font-medium text-green-700">🚀 Appena Possibile</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Il tuo ordine sarà pronto entro 30 minuti. Ti chiameremo quando è pronto per il ritiro.
                        </div>
                      </Label>
                    </div>

                    {/* Specific Time Option */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="specific" id="specific" className="mt-1" />
                      <Label htmlFor="specific" className="cursor-pointer flex-1">
                        <div className="font-medium text-blue-700">🕐 Orario Specifico</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Scegli un orario specifico per il ritiro (18:00 - 22:30)
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Time Selection - Only show when specific time is selected */}
                  {customerData.pickupMethod === 'specific' && (
                    <div className="mt-4">
                      <Label htmlFor="pickupTime">Seleziona Orario di Ritiro *</Label>
                      <Select
                        value={customerData.pickupTime}
                        onValueChange={(value) => handleInputChange('pickupTime', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Scegli un orario..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupTimeOptions.map((option) => (
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
              )}

              {/* Delivery Address - Only show for delivery orders */}
              {orderType === 'delivery' && (
                <div className="md:col-span-2">
                  <Label htmlFor="deliveryAddress">Indirizzo di Consegna *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="deliveryAddress"
                      value={customerData.deliveryAddress}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      className={`pl-10 ${
                        addressValidation?.isValid === false ? 'border-red-500' :
                        addressValidation?.isValid === true ? 'border-green-500' : ''
                      }`}
                      placeholder="Via, Città, CAP"
                    />
                    {isValidatingAddress && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => validateAddress(customerData.deliveryAddress)}
                    disabled={!customerData.deliveryAddress.trim() || isValidatingAddress}
                    className="px-4"
                    title="Rivalidare manualmente l'indirizzo"
                  >
                    {isValidatingAddress ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Rivalidare'
                    )}
                  </Button>
                </div>

                {/* Helper text */}
                {!addressValidation && !isValidatingAddress && (
                  <p className="text-sm text-gray-500 mt-1">
                    Inserisci il tuo indirizzo - la validazione avverrà automaticamente
                  </p>
                )}

                {isValidatingAddress && !addressValidation && (
                  <p className="text-sm text-blue-600 mt-1 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Validazione automatica in corso...
                  </p>
                )}

                {/* Address Validation Status */}
                {addressValidation && (
                  <div className="mt-2 text-sm">
                    {addressValidation.isValid && addressValidation.isWithinZone ? (
                      <div className="text-green-600 bg-green-50 p-2 rounded">
                        ✓ Indirizzo valido - Distanza: {addressValidation.distance?.toFixed(1)}km
                        {addressValidation.deliveryFee > 0 && (
                          <span> - Costo consegna: €{addressValidation.deliveryFee.toFixed(2)}</span>
                        )}
                        <br />
                        <small className="text-green-500">
                          Tempo stimato: {addressValidation.estimatedTime}
                        </small>
                      </div>
                    ) : (
                      <div className="text-red-600 bg-red-50 p-2 rounded">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {addressValidation.error || 'Indirizzo non valido o fuori zona di consegna'}
                        </div>
                        {addressValidation.distance && (
                          <small className="text-red-500 mt-1 block">
                            Distanza: {addressValidation.distance.toFixed(1)}km
                            {addressValidation.distance > 15 && ' (oltre il limite di 15km)'}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                )}
                </div>
              )}

              {/* Citofono Nome - Only show for delivery orders */}
              {orderType === 'delivery' && (
                <div className="md:col-span-2">
                <Label htmlFor="citofonoNome">Nome Citofono</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="citofonoNome"
                    value={customerData.citofonoNome}
                    onChange={(e) => handleInputChange('citofonoNome', e.target.value)}
                    className="pl-10"
                    placeholder="Nome sul citofono (se diverso dal tuo)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inserisci il nome da suonare al citofono se diverso dal tuo nome
                </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Options */}
          {orderType && (
            <div className="space-y-4">
              <h3 className="font-medium">
                {orderType === 'delivery' ? 'Opzioni di Pagamento' : 'Conferma Ordine'}
              </h3>

              {/* Business Hours Warning */}
              {!businessIsOpen && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <h4 className="font-semibold text-amber-800">Ordini non disponibili</h4>
                      <p className="text-amber-700 text-sm">{businessMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Order - Show payment options */}
              {orderType === 'pickup' && (

            <Tabs defaultValue="negozio" className="w-full payment-tabs">
              <TabsList className={`grid w-full ${satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url && (
                  <TabsTrigger value="satispay" className="flex items-center gap-1">
                    <QrCode className="h-4 w-4" />
                    Paga ora con SatisPay
                  </TabsTrigger>
                )}
                <TabsTrigger value="negozio">Paga al Negozio</TabsTrigger>
              </TabsList>

              {/* SatisPay Payment for Pickup */}
              {satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url && (
                <TabsContent value="satispay" className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">🏪 Ritiro + Pagamento SatisPay</h4>
                    <p className="text-yellow-700 text-sm">
                      Paga subito con SatisPay e ritira il tuo ordine quando è pronto. Veloce e sicuro.
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

              <TabsContent value="negozio" className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🏪 Ritiro + Pagamento al Negozio</h4>
                  <p className="text-green-700 text-sm">
                    Il tuo ordine sarà preparato per il ritiro. Pagherai direttamente al negozio quando ritiri l'ordine.
                  </p>
                </div>

                {/* Total Display */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Totale da pagare al negozio:</span>
                    <span className="text-green-600">€{(calculateTotal() || 0).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      const order = await createPickupOrder();
                      // Completion modal is handled inside createPickupOrder
                    } catch (error) {
                      console.error('Pickup order error:', error);
                      // Error handling is done inside createPickupOrder
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting || !businessIsOpen || !customerData.customerName.trim() || !customerData.customerEmail.trim() || !customerData.customerPhone.trim() || !customerData.pickupMethod || (customerData.pickupMethod === 'specific' && !customerData.pickupTime.trim())}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creazione ordine...
                    </>
                  ) : (
                    <>
                      <CartIcon className="h-4 w-4" />
                      Conferma Ordine per Ritiro
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
              )}

              {/* Delivery Order - Show delivery method and payment options */}
              {orderType === 'delivery' && (
                <div className="space-y-6">
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
                        <RadioGroupItem value="asap" id="delivery-asap" className="mt-1" />
                        <Label htmlFor="delivery-asap" className="cursor-pointer flex-1">
                          <div className="font-medium text-green-700">🚀 Appena Possibile</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Il tuo ordine sarà consegnato entro 30 minuti. Ti chiameremo quando è pronto per la consegna.
                          </div>
                        </Label>
                      </div>

                      {/* Specific Time Option */}
                      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="specific" id="delivery-specific" className="mt-1" />
                        <Label htmlFor="delivery-specific" className="cursor-pointer flex-1">
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
                        <Label htmlFor="deliveryTime">Seleziona Orario di Consegna *</Label>
                        <Select
                          value={customerData.deliveryTime}
                          onValueChange={(value) => handleInputChange('deliveryTime', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Scegli un orario..." />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupTimeOptions.map((option) => (
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

            <Tabs defaultValue={satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url ? "satispay" : "later"} className="w-full payment-tabs">
              <TabsList className={`grid w-full ${satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {satisPaySettings?.is_enabled && satisPaySettings?.qr_code_image_url && (
                  <TabsTrigger value="satispay" className="flex items-center gap-1">
                    <QrCode className="h-4 w-4" />
                    SatisPay
                  </TabsTrigger>
                )}
                <TabsTrigger value="later" className="flex items-center gap-1">
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
                    setIsSubmitting(true);
                    try {
                      let order;
                      if (deliveryPaymentMethod === 'contanti') {
                        order = await createCashOrder();
                      } else {
                        order = await createPosOrder();
                      }

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
                            payment_method: deliveryPaymentMethod === 'contanti' ? 'cash_on_delivery' : 'pos_on_delivery',
                            payment_status: 'pending',
                            delivery_type: 'delivery',
                            created_at: order.created_at,
                            special_instructions: order.special_instructions,
                            citofono_nome: order.citofono_nome,
                            order_status: 'confirmed',
                            metadata: deliveryPaymentMethod === 'pos' ? { posFee: POS_FEE } : undefined
                          },
                          cartItems: cartItems
                        });
                        setIsCompletionModalOpen(true);
                      }
                    } catch (error) {
                      console.error('Order error:', error);
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
              )}
            </div>
          )}
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
            let order;
            if (orderType === 'delivery') {
              order = await createSatisPayOrder();
            } else if (orderType === 'pickup') {
              order = await createPickupSatisPayOrder();
            }

            if (order) {
              clearCart();
              setCompletionReceiptData({
                order: {
                  id: order.id,
                  order_number: order.order_number,
                  customer_name: order.customer_name,
                  customer_email: order.customer_email,
                  customer_phone: order.customer_phone,
                  customer_address: orderType === 'delivery' ? order.customer_address : 'Ritiro in negozio',
                  total_amount: order.total_amount,
                  delivery_fee: orderType === 'delivery' ? (addressValidation?.deliveryFee || 0) : 0,
                  payment_method: 'satispay',
                  payment_status: 'paid',
                  delivery_type: orderType,
                  pickup_time: orderType === 'pickup' ? order.pickup_time : undefined,
                  created_at: order.created_at,
                  special_instructions: order.special_instructions,
                  citofono_nome: orderType === 'delivery' ? order.citofono_nome : undefined,
                  order_status: 'confirmed',
                  metadata: orderType === 'pickup' ? { pickup_method: order.metadata?.pickup_method } : undefined
                },
                cartItems: cartItems
              });
              setIsCompletionModalOpen(true);
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

export default SimpleCheckoutModal;
