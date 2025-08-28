import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, User, Mail, Phone, MapPin, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/hooks/use-simple-cart';
import { useSimpleCart } from '@/hooks/use-simple-cart';
import shippingZoneService from '@/services/shippingZoneService';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';
import { saveClientOrder } from '@/utils/clientSpecificOrderTracking';
import { getOrCreateClientIdentity } from '@/utils/clientIdentification';


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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<any>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        deliveryAddress: ''
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

  const createOrder = async () => {
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
        special_instructions: `Cart Order - ${cartItems.length} items\n${cartItems.map(item =>
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

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      unit_price: item.product.price,
      special_requests: item.specialRequests
    }));

    // Add delivery fee as separate item if applicable
    if (deliveryFee > 0) {
      orderItems.push({
        order_id: order.id,
        product_id: null, // No product ID for delivery fee
        product_name: 'Delivery Fee',
        product_price: deliveryFee,
        quantity: 1,
        subtotal: deliveryFee,
        unit_price: deliveryFee,
        special_requests: `Delivery to: ${addressValidation.formattedAddress}`
      });
    }

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

    // Create standardized notification
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: order.id,
        notification_type: 'new_order',
        title: 'Nuovo Ordine!',
        message: `New cart order from ${customerData.customerName} - ${cartItems.length} items - €${finalTotal.toFixed(2)}`,
        is_read: false,
        is_acknowledged: false
      });

    if (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    } else {
      console.log('✅ Cart order notification created successfully');
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

    // Show success message
    toast({
      title: "Order Placed Successfully! 🎉",
      description: `Your order #${order.order_number} has been received. You can pay upon delivery.`,
    });
  };



  const isFormValid = () => {
    return customerData.customerName.trim() &&
           customerData.customerEmail.trim() &&
           customerData.deliveryAddress.trim() &&
           addressValidation?.isValid &&
           addressValidation?.isWithinZone;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
              {addressValidation?.deliveryFee > 0 && (
                <div className="border-t pt-2 font-bold flex justify-between">
                  <span>Totale:</span>
                  <span>€{((totalAmount || 0) + (addressValidation.deliveryFee || 0)).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Informazioni Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome Completo *</Label>
                <Input
                  id="customerName"
                  value={customerData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Il tuo nome completo"
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
          </div>

          {/* Order Confirmation */}
          <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Paga alla Consegna</h4>
                <p className="text-amber-700 text-sm">
                  Conferma l'ordine ora e paga quando ricevi i prodotti. Ti contatteremo per confermare i dettagli.
                </p>
              </div>
              
              <Button
                onClick={async () => {
                  console.log('🔄 Conferma Ordine clicked!');
                  console.log('📋 Customer data:', customerData);
                  console.log('📍 Address validation:', addressValidation);
                  console.log('🛒 Cart items:', cartItems);

                  setIsSubmitting(true);
                  try {
                    await createOrder();
                    clearCart();
                    toast({
                      title: 'Ordine Confermato! ✅',
                      description: 'Ti contatteremo presto per confermare i dettagli.',
                    });
                    onClose();
                  } catch (error) {
                    console.error('❌ Pay later order error:', error);
                    console.error('❌ Error details:', {
                      message: error instanceof Error ? error.message : 'Unknown error',
                      stack: error instanceof Error ? error.stack : undefined,
                      customerData,
                      addressValidation,
                      cartItems
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
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione ordine...
                  </>
                ) : (
                  'Conferma Ordine'
                )}
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckoutModal;
