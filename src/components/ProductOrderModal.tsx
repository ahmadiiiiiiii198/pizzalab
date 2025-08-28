import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Plus, Minus, User, Mail, Phone, MapPin, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/category';
import shippingZoneService from '@/services/shippingZoneService';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';
import BusinessHoursStatus from './BusinessHoursStatus';
import { businessHoursService } from '@/services/businessHoursService';

// Customer authentication removed - orders work without accounts




interface ProductOrderModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  specialRequests: string;
  deliveryAddress: string;
}

const ProductOrderModal: React.FC<ProductOrderModalProps> = ({ product, isOpen, onClose }) => {
  const { toast } = useToast();
  const { validateOrderTime } = useBusinessHoursContext();
  // Customer authentication removed - orders work without accounts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  // Auth requirement removed
  const [addressValidation, setAddressValidation] = useState<any>(null);
  const [addressValidationTimeout, setAddressValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [orderData, setOrderData] = useState<OrderData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    specialRequests: '',
    deliveryAddress: ''
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (addressValidationTimeout) {
        clearTimeout(addressValidationTimeout);
      }
    };
  }, [addressValidationTimeout]);

  const handleInputChange = (field: keyof OrderData, value: string | number) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-validate address when it changes
    if (field === 'deliveryAddress') {
      setAddressValidation(null);

      // Debounce validation - validate after user stops typing for 1 second
      if (addressValidationTimeout) {
        clearTimeout(addressValidationTimeout);
      }

      const timeout = setTimeout(() => {
        if (typeof value === 'string' && value.trim().length > 10) {
          validateDeliveryAddress(value.trim());
        }
      }, 1000);

      setAddressValidationTimeout(timeout);
    }
  };

  const validateDeliveryAddress = async (addressToValidate?: string) => {
    const address = addressToValidate || orderData.deliveryAddress;

    if (!address.trim()) {
      if (!addressToValidate) {
        toast({
          title: 'Indirizzo Richiesto',
          description: 'Inserisci un indirizzo di consegna per continuare.',
          variant: 'destructive',
        });
      }
      return false;
    }

    setIsValidatingAddress(true);
    try {
      const result = await shippingZoneService.validateDeliveryAddress(
        address,
        calculateTotal()
      );

      setAddressValidation(result);

      if (!result.isValid || !result.isWithinZone) {
        // Only show error toast if this was a manual validation (not auto)
        if (!addressToValidate) {
          toast({
            title: 'Consegna Non Disponibile',
            description: result.error || 'Non possiamo consegnare a questo indirizzo.',
            variant: 'destructive',
          });
        }
        return false;
      }

      // Only show success toast if this was a manual validation (not auto)
      if (!addressToValidate) {
        toast({
          title: 'Indirizzo Validato ✅',
          description: 'Consegna disponibile',
        });
      }
      return true;
    } catch (error) {
      // Only show error toast if this was a manual validation (not auto)
      if (!addressToValidate) {
        toast({
          title: 'Errore Validazione',
          description: 'Impossibile validare l\'indirizzo. Riprova.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleQuantityChange = (increment: boolean) => {
    setOrderData(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + (increment ? 1 : -1))
    }));
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const subtotal = product.price * orderData.quantity;
    const deliveryFee = addressValidation?.deliveryFee || 0;
    return subtotal + deliveryFee;
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  };

  // Create order function for "pay later" option
  const createOrder = async () => {
    // ⏰ FIRST: Check business hours (should be visible to all users)
    const businessHoursValidation = await validateOrderTime();
    if (!businessHoursValidation.valid) {
      throw new Error(businessHoursValidation.message);
    }

    // 🔓 Authentication removed - orders work without accounts

    if (!product || !addressValidation?.isValid) {
      throw new Error('Product or address validation missing');
    }

    console.log('🆔 Creating Product PayLater order for authenticated user');

    const orderNumber = generateOrderNumber();
    const subtotal = (product.price || 0) * (orderData.quantity || 1);
    const deliveryFee = addressValidation.deliveryFee || 0;
    const totalAmount = subtotal + deliveryFee;
    console.log('💰 ProductOrder PayLater - price:', product.price, 'quantity:', orderData.quantity, 'subtotal:', subtotal, 'deliveryFee:', deliveryFee, 'totalAmount:', totalAmount);

    // Create order with client identification and user authentication
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone || 'Non fornito',
        customer_address: orderData.deliveryAddress, // Use customer_address column
        delivery_type: 'delivery',
        total_amount: totalAmount,
        delivery_fee: addressValidation.deliveryFee || 0,
        status: 'confirmed', // Orders are automatically confirmed
        payment_status: 'pending',
        payment_method: 'cash_on_delivery',
        user_id: null, // 🔓 No authentication required for orders
        metadata: {
          deliveryFee: addressValidation.deliveryFee,
          estimatedTime: addressValidation.estimatedTime,
          coordinates: addressValidation.coordinates,
          formattedAddress: addressValidation.formattedAddress,
          // 🎯 CLIENT IDENTIFICATION FOR ORDER TRACKING
          clientId: clientIdentity.clientId,
          deviceFingerprint: clientIdentity.deviceFingerprint,
          sessionId: clientIdentity.sessionId,
          orderCreatedAt: new Date().toISOString(),
          isAuthenticatedOrder: false
        },
        special_instructions: `Pay Later Order - Product: ${product.name}\nQuantity: ${orderData.quantity}\nSpecial Requests: ${orderData.specialRequests}`
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    // Create order item
    const orderItemData = {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity: orderData.quantity,
      product_price: product.price,
      subtotal: product.price * orderData.quantity,
      unit_price: product.price,
      special_requests: orderData.specialRequests
    };

    console.log('🔍 ProductOrder PayLater: Inserting order item:', orderItemData);
    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItemData);

    if (itemError) {
      console.error('❌ ProductOrder PayLater: Order item creation failed:', itemError);
      console.error('❌ ProductOrder PayLater: Order item data that failed:', orderItemData);
      throw new Error(`Order item creation failed: ${itemError.message}`);
    }
    console.log('✅ ProductOrder PayLater: Order item created successfully');

    // Create standardized notification
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: order.id,
        notification_type: 'new_order',
        title: 'Nuovo Ordine!',
        message: `New pay-later product order from ${orderData.customerName} - ${product.name} x${orderData.quantity} - €${totalAmount.toFixed(2)}`,
        is_read: false,
        is_acknowledged: false
      });

    if (notificationError) {
      console.error('❌ Failed to create pay-later notification:', notificationError);
    } else {
      console.log('✅ Pay-later product order notification created successfully');
    }

    // ✅ Order saved to database - tracking handled by UnifiedOrderTracker
    console.log('✅ PayLater order created and will be tracked via database-only system');
    console.log('✅ Product Pay Later order automatically saved for tracking:', order.order_number);

    return order;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This will be handled by the payment tabs
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Ordina: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Hours Status */}
          <BusinessHoursStatus variant="banner" />

          {/* Product Summary */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-600 text-sm">{product.description}</p>
              <p className="text-xl font-bold text-emerald-600 mt-2">€{product.price.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="customerName"
                  value={orderData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Il tuo nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={orderData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="la-tua-email@esempio.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefono *
              </Label>
              <Input
                id="customerPhone"
                value={orderData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="+39 123 456 7890"
                required
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantità</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(false)}
                  disabled={orderData.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{orderData.quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Indirizzo di Consegna *
                {isValidatingAddress && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
                {addressValidation && addressValidation.isValid && addressValidation.isWithinZone && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {addressValidation && (!addressValidation.isValid || !addressValidation.isWithinZone) && (
                  <AlertCircle className="h-3 w-3 text-red-500" />
                )}
              </Label>
              <Input
                id="deliveryAddress"
                value={orderData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                placeholder="Via, Città, CAP (validazione automatica)"
                required
                className={`${
                  addressValidation
                    ? addressValidation.isValid && addressValidation.isWithinZone
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-red-300 focus:border-red-500'
                    : ''
                }`}
              />

              {/* Address Validation Result */}
              {addressValidation && (
                <div className={`p-3 rounded-lg text-sm ${
                  addressValidation.isValid && addressValidation.isWithinZone
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {addressValidation.isValid && addressValidation.isWithinZone ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <div>
                        <div className="font-medium">✅ Consegna Disponibile</div>
                        {addressValidation.deliveryFee > 0 && (
                          <div>Costo consegna: €{addressValidation.deliveryFee.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <div>
                        <div className="font-medium">❌ Consegna Non Disponibile</div>
                        <div>{addressValidation.error || 'Indirizzo fuori dalla zona di consegna'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Richieste Speciali</Label>
              <Textarea
                id="specialRequests"
                value={orderData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Eventuali richieste particolari o personalizzazioni..."
                rows={3}
              />
            </div>

            {/* Total */}
            <div className="bg-emerald-50 p-4 rounded-lg">
              {addressValidation && addressValidation.isValid && addressValidation.isWithinZone ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotale:</span>
                    <span>€{((typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)) * orderData.quantity).toFixed(2)}</span>
                  </div>
                  {addressValidation.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Consegna:</span>
                      <span>€{(addressValidation.deliveryFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                    <span>Totale:</span>
                    <span className="text-emerald-600">€{(calculateTotal() || 0).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Subtotale:</span>
                  <span className="text-emerald-600">€{((typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)) * orderData.quantity).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Scegli il metodo di pagamento</h3>

              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Form valid: {orderData.customerName && orderData.customerEmail && orderData.customerPhone && orderData.deliveryAddress ? 'Yes' : 'No'} |
                Address validated: {addressValidation?.isValid && addressValidation?.isWithinZone ? 'Yes' : 'No'}
              </div>

              <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Ordina Ora, Paga Dopo</h4>
                    <p className="text-gray-700 text-sm">
                      Il tuo ordine sarà salvato e ti contatteremo per confermare i dettagli e il pagamento.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting || !orderData.customerName || !orderData.customerEmail || !orderData.deliveryAddress ||
                               !addressValidation?.isValid || !addressValidation?.isWithinZone}
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          const order = await createOrder();
                          if (order) {
                            // Create notification for pay-later orders
                            await supabase
                              .from('order_notifications')
                              .insert({
                                order_id: order.id,
                                message: `New order received from ${orderData.customerName}`,
                                is_read: false
                              });

                            toast({
                              title: 'Ordine Inviato con Successo! 🎉',
                              description: `Il tuo ordine #${order.order_number} è stato ricevuto. Ti contatteremo presto per confermare i dettagli.`,
                            });

                            // Reset form and close modal
                            setOrderData({
                              customerName: '',
                              customerEmail: '',
                              customerPhone: '',
                              quantity: 1,
                              specialRequests: '',
                              deliveryAddress: ''
                            });
                            onClose();
                          }
                        } catch (error) {
                          toast({
                            title: 'Errore nell\'invio dell\'ordine',
                            description: error.message || 'Riprova o contattaci direttamente.',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Conferma Ordine
                        </>
                      )}
                    </Button>
                  </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>


    </Dialog>
  );
};

export default ProductOrderModal;
