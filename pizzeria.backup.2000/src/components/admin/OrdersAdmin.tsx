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
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ensureAdminAuth } from '@/utils/adminDatabaseUtils';

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
  delivery_type?: string;
  delivery_fee?: number;
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

  const orderStatuses = [
    { value: 'confirmed', label: 'Confermato', color: 'bg-blue-100 text-blue-800', icon: Check },
    { value: 'preparing', label: 'In preparazione', color: 'bg-orange-100 text-orange-800', icon: Clock },
    { value: 'ready', label: 'Pronto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'arrived', label: 'Arrivato', color: 'bg-purple-100 text-purple-800', icon: MapPin },
    { value: 'delivered', label: 'Consegnato', color: 'bg-green-100 text-green-800', icon: Truck },
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
              price
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
          title: 'Ordine Aggiornato',
          message: `Ordine aggiornato a: ${orderStatuses.find(s => s.value === newStatus)?.label}`,
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
        title: "✅ Successo",
        description: `Stato aggiornato a: ${orderStatuses.find(s => s.value === newStatus)?.label}`,
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
        duration: 10000,
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

  // Get status info
  const getStatusInfo = (status: string) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  // Get order counts by status
  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      confirmed: orders.filter(o => o.order_status === 'confirmed').length,
      preparing: orders.filter(o => o.order_status === 'preparing').length,
      ready: orders.filter(o => o.order_status === 'ready').length,
      delivered: orders.filter(o => o.order_status === 'delivered').length,
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
            duration: 5000,
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
            {orderStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} ({counts[status.value as keyof typeof counts] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile-Optimized Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
        {orderStatuses.map((status) => {
          const count = counts[status.value as keyof typeof counts] || 0;
          const StatusIcon = status.icon;
          return (
            <Card key={status.value} className="hover:shadow-md transition-shadow">
              <CardContent className="p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-gray-600 truncate">{status.label}</p>
                    <p className="text-lg sm:text-xl font-bold">{count}</p>
                  </div>
                  <StatusIcon size={16} className="text-gray-500 mx-auto sm:mx-0 sm:ml-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile-Optimized Orders Layout */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-sm sm:text-base font-semibold">Lista Ordini</h4>
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.order_status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card
                key={order.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-red-500' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                  >
                    <Trash2 size={14} />
                  </Button>
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

                        {/* Ingredients from description */}
                        {item.products?.description && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-700">Ingredienti: </span>
                            <span className="text-xs text-gray-600">
                              {item.products.description}
                            </span>
                          </div>
                        )}

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

                {/* Status Update */}
                <div>
                  <h5 className="text-sm sm:text-base font-semibold mb-2">Aggiorna Stato</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                    {orderStatuses.map((status) => {
                      const StatusIcon = status.icon;
                      return (
                        <Button
                          key={status.value}
                          size="sm"
                          variant={selectedOrder.order_status === status.value ? "default" : "outline"}
                          onClick={() => updateOrderStatus(selectedOrder.id, status.value)}
                          disabled={selectedOrder.order_status === status.value}
                          className={`text-xs p-1 sm:p-2 h-auto transition-all duration-200 ${
                            selectedOrder.order_status === status.value
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md cursor-not-allowed'
                              : 'hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <StatusIcon size={10} className="mr-1" />
                          <span className="truncate">{status.label}</span>
                          {selectedOrder.order_status === status.value && <span className="ml-1">✓</span>}
                        </Button>
                      );
                    })}
                  </div>
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
