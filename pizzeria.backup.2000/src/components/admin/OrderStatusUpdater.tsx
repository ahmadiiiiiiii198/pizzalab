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

  // Order status configuration - NO PENDING STATES
  const orderStatuses = [
    {
      value: 'confirmed',
      label: 'Confermato',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CheckCircle,
      description: 'Ordine confermato, verrà preparato'
    },
    {
      value: 'preparing',
      label: 'In preparazione',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Package,
      description: 'Ordine in preparazione in cucina'
    },
    {
      value: 'ready',
      label: 'Pronto',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      description: 'Ordine pronto per la consegna'
    },
    {
      value: 'arrived',
      label: 'Arrivato',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: MapPin,
      description: 'Ordine arrivato alla porta del cliente'
    },
    {
      value: 'delivered',
      label: 'Consegnato',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Truck,
      description: 'Ordine consegnato al cliente'
    },
    {
      value: 'cancelled',
      label: 'Annullato',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      description: 'Ordine annullato'
    }
  ];

  // FIXED: Prioritize 'status' over 'order_status' based on MCP database analysis
  const currentStatus = order.status || order.order_status || 'confirmed';

  // Get current status info
  const getCurrentStatusInfo = () => {
    return orderStatuses.find(s => s.value === currentStatus) || orderStatuses[0];
  };

  // Get next logical status
  const getNextStatus = () => {
    const statusOrder = ['confirmed', 'preparing', 'ready', 'arrived', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  // Update order status
  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true);
    
    try {
      // Update both status fields to ensure compatibility
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          order_status: newStatus,
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
          title: 'Stato Ordine Aggiornato',
          message: `Ordine #${order.order_number} aggiornato a: ${orderStatuses.find(s => s.value === newStatus)?.label}`,
          is_read: false
        }]);

      toast({
        title: "✅ Stato Aggiornato",
        description: `Ordine #${order.order_number} aggiornato a: ${orderStatuses.find(s => s.value === newStatus)?.label}`,
      });

      // Update local order object to reflect changes immediately
      order.status = newStatus;
      order.order_status = newStatus;

      // Call callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(order.id, newStatus);
      }

      // Force component re-render by updating state
      setUpdating(false);
      setUpdating(false); // Double call to ensure re-render

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
  const nextStatus = getNextStatus();
  const nextStatusInfo = nextStatus ? orderStatuses.find(s => s.value === nextStatus) : null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Aggiorna Stato - Ordine #{order.order_number}
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
              <span className="font-medium">Stato Attuale:</span>
              <Badge className={`${currentStatusInfo.color} border`}>
                {currentStatusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {currentStatusInfo.description}
            </p>
          </div>
        </div>

        {/* Quick Next Status Update */}
        {nextStatusInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Prossimo stato:</span>
              <Badge className={`${nextStatusInfo.color} border`}>
                {nextStatusInfo.label}
              </Badge>
            </div>
            
            <Button
              onClick={() => updateOrderStatus(nextStatus!)}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                <>
                  Avanza a: {nextStatusInfo.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* All Status Options */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Oppure scegli uno stato specifico:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {orderStatuses.map((status) => {
              const StatusIcon = status.icon;
              const isCurrentStatus = status.value === currentStatus;
              
              return (
                <Button
                  key={status.value}
                  variant={isCurrentStatus ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateOrderStatus(status.value)}
                  disabled={updating || isCurrentStatus}
                  className={`text-xs p-2 h-auto transition-all duration-200 ${
                    isCurrentStatus
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md cursor-not-allowed'
                      : 'hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">{status.label}</span>
                  {isCurrentStatus && <span className="ml-1">✓</span>}
                </Button>
              );
            })}
          </div>
        </div>

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
