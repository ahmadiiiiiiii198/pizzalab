import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { printerService, OrderPrintData } from '@/services/printerService';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  delivery_type?: string;
  delivery_fee?: number;
  total_amount: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    product_price: number;
    special_requests?: string;
  }>;
}

export function useAutoPrint() {
  const { toast } = useToast();
  const printedOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!printerService.isAutoPrintEnabled()) {
      console.log('🖨️ Auto-print is disabled');
      return;
    }

    console.log('🖨️ Auto-print enabled, listening for new orders...');

    // Subscribe to new orders
    const subscription = supabase
      .channel('new_orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          const newOrder = payload.new as any;
          
          // Avoid duplicate prints
          if (printedOrdersRef.current.has(newOrder.id)) {
            return;
          }

          console.log('🆕 New order detected:', newOrder.order_number);

          // Load full order details with items
          const { data: fullOrder, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                product_name,
                quantity,
                product_price,
                special_requests
              )
            `)
            .eq('id', newOrder.id)
            .single();

          if (error || !fullOrder) {
            console.error('Error loading order details:', error);
            return;
          }

          // Convert to print format
          const printData: OrderPrintData = {
            orderNumber: fullOrder.order_number,
            customerName: fullOrder.customer_name,
            customerPhone: fullOrder.customer_phone || '',
            customerAddress: fullOrder.customer_address,
            items: (fullOrder.order_items || []).map((item: any) => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.product_price,
              notes: item.special_requests
            })),
            subtotal: fullOrder.total_amount - (fullOrder.delivery_fee || 0),
            deliveryFee: fullOrder.delivery_fee,
            total: fullOrder.total_amount,
            paymentMethod: fullOrder.payment_method || 'Contanti',
            orderType: fullOrder.delivery_type === 'delivery' ? 'delivery' : 'pickup',
            timestamp: fullOrder.created_at,
            notes: fullOrder.notes
          };

          // Print the order
          const success = await printerService.printOrder(printData);

          if (success) {
            printedOrdersRef.current.add(newOrder.id);
            toast({
              title: '🖨️ Ordine stampato',
              description: `Ordine #${fullOrder.order_number} inviato alla stampante`,
            });
          } else {
            toast({
              title: '❌ Errore stampa',
              description: `Impossibile stampare ordine #${fullOrder.order_number}`,
              variant: 'destructive'
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);
}
