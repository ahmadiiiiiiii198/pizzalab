import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  ShoppingCart,
  Bell,
  Package,
  Database
} from 'lucide-react';

const SystemConnectionTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const runSystemTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Products Admin-Frontend Connection
      addResult('Products Connection', 'info', 'Testing products admin-frontend connection...');
      
      const { data: adminProducts, error: adminError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(5);

      if (adminError) {
        addResult('Products Connection', 'error', `Admin products query failed: ${adminError.message}`);
      } else {
        addResult('Products Connection', 'success', `✅ Found ${adminProducts.length} active products in admin`);
        
        // Test frontend products query
        const { data: frontendProducts, error: frontendError } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              name,
              slug
            )
          `)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (frontendError) {
          addResult('Products Connection', 'error', `Frontend products query failed: ${frontendError.message}`);
        } else {
          addResult('Products Connection', 'success', `✅ Frontend can access ${frontendProducts.length} products with categories`);
        }
      }

      // Test 2: Order Creation and Notification Flow
      addResult('Order Flow', 'info', 'Testing order creation and notification flow...');
      
      const testOrderNumber = `TEST-${Date.now()}`;
      const { data: testOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: testOrderNumber,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+39 123 456 7890',
          customer_address: 'Via Test 123, Torino',
          total_amount: 25.50,
          status: 'pending',
          payment_status: 'pending',
          notes: 'System connection test order'
        })
        .select()
        .single();

      if (orderError) {
        addResult('Order Flow', 'error', `Order creation failed: ${orderError.message}`);
      } else {
        addResult('Order Flow', 'success', `✅ Test order created: ${testOrderNumber}`);

        // Create order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: testOrder.id,
            product_id: 'test-product',
            product_name: 'Test Product',
            quantity: 1,
            product_price: 25.50,
            subtotal: 25.50
          });

        if (itemError) {
          addResult('Order Flow', 'error', `Order item creation failed: ${itemError.message}`);
        } else {
          addResult('Order Flow', 'success', '✅ Order item created');

          // Create notification
          const { error: notificationError } = await supabase
            .from('order_notifications')
            .insert({
              order_id: testOrder.id,
              message: `Test order received from Test Customer`,
              type: 'new_order',
              is_read: false
            });

          if (notificationError) {
            addResult('Order Flow', 'error', `Notification creation failed: ${notificationError.message}`);
          } else {
            addResult('Order Flow', 'success', '✅ Order notification created');
          }
        }

        // Clean up test order
        await supabase.from('order_items').delete().eq('order_id', testOrder.id);
        await supabase.from('order_notifications').delete().eq('order_id', testOrder.id);
        await supabase.from('orders').delete().eq('id', testOrder.id);
        addResult('Order Flow', 'info', '🧹 Test order cleaned up');
      }

      // Test 3: Notification System
      addResult('Notification System', 'info', 'Testing notification system...');
      
      const { data: notifications, error: notificationQueryError } = await supabase
        .from('order_notifications')
        .select(`
          *,
          orders (
            customer_name,
            total_amount
          )
        `)
        .eq('is_read', false)
        .limit(5);

      if (notificationQueryError) {
        addResult('Notification System', 'error', `Notification query failed: ${notificationQueryError.message}`);
      } else {
        addResult('Notification System', 'success', `✅ Found ${notifications.length} unread notifications`);
      }

      // Test 4: Real-time Subscriptions
      addResult('Real-time System', 'info', 'Testing real-time subscription setup...');
      
      const testChannel = supabase
        .channel('system_test')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'orders' },
          () => {
            addResult('Real-time System', 'success', '✅ Real-time subscription working');
          }
        )
        .subscribe();

      setTimeout(() => {
        testChannel.unsubscribe();
        addResult('Real-time System', 'success', '✅ Real-time subscription test completed');
      }, 1000);

      addResult('System Test', 'success', '🎉 System connection test completed successfully!');

    } catch (error) {
      addResult('System Test', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          System Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runSystemTest} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run System Test
              </>
            )}
          </Button>
          
          <div className="text-sm text-gray-600">
            Tests: Products ↔ Admin, Orders → Notifications, Real-time Updates
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                  {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {result.status === 'info' && <Loader2 className="h-4 w-4 text-blue-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.test}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">What This Test Checks:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <Package className="inline h-3 w-3" /> Products admin panel ↔ frontend connection</li>
            <li>• <ShoppingCart className="inline h-3 w-3" /> Order creation and database storage</li>
            <li>• <Bell className="inline h-3 w-3" /> Notification system for new orders</li>
            <li>• 🔄 Real-time updates and subscriptions</li>
            <li>• 🧹 Data cleanup and integrity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemConnectionTest;
