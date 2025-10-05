import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  ArrowRight,
  Loader2,
  MapPin
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  order_status?: string;
  total_amount: number;
  created_at: string;
}

interface OrderStatusUpdaterProps {
  order: Order;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

const OrderStatusUpdater: React.FC<OrderStatusUpdaterProps> = ({ 
  order, 
  onStatusUpdate 
}) => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Simple order status - only two states: active or done
  const orderStatuses = {
    active: {
      value: 'confirmed',
      label: 'In Lavorazione',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Package,
      description: 'Ordine in lavorazione'
    },
    done: {
      value: 'fatto',
      label: 'Fatto',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      description: 'Ordine completato'
    }
  };

  // Simple status logic - either active or done
  const currentStatus = order.status || order.order_status || 'confirmed';
  const isDone = currentStatus === 'fatto';

  // Get current status info
  const getCurrentStatusInfo = () => {
    return isDone ? orderStatuses.done : orderStatuses.active;
  };

  // Mark order as done
  const markOrderAsDone = async () => {
    setUpdating(true);

    try {
      // Update both status fields to ensure compatibility
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'fatto',
          order_status: 'fatto',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      // Create notification for status change
      await supabase
        .from('order_notifications')
        .insert([{
          order_id: order.id,
          notification_type: 'order_update',
          title: 'Ordine Completato',
          message: `Ordine #${order.order_number} marcato come: Fatto`,
          is_read: false
        }]);

      toast({
        title: "✅ Ordine Completato",
        description: `Ordine #${order.order_number} marcato come: Fatto`,
        duration: 3000,
      });

      // Update local order object to reflect changes immediately
      order.status = 'fatto';
      order.order_status = 'fatto';

      // Call callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(order.id, 'fatto');
      }

    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile aggiornare lo stato dell'ordine",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const currentStatusInfo = getCurrentStatusInfo();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Ordine #{order.order_number}
        </CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{order.customer_name}</span>
          <span className="font-semibold">€{order.total_amount.toFixed(2)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {React.createElement(currentStatusInfo.icon, {
            className: "h-5 w-5 text-gray-600"
          })}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Stato:</span>
              <Badge className={`${currentStatusInfo.color} border`}>
                {currentStatusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {currentStatusInfo.description}
            </p>
          </div>
        </div>

        {/* Fatto Button - Only show if not already done */}
        {!isDone && (
          <Button
            onClick={markOrderAsDone}
            disabled={updating}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
          >
            {updating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Aggiornamento...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Fatto
              </>
            )}
          </Button>
        )}

        {/* Show completion message if done */}
        {isDone && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Ordine Completato!</p>
            <p className="text-green-600 text-sm">Questo ordine è stato marcato come fatto.</p>
          </div>
        )}

        {/* Order Info */}
        <div className="pt-2 border-t text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Ordinato: {new Date(order.created_at).toLocaleString('it-IT')}</span>
            <span>ID: {order.id.slice(-8)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusUpdater;
