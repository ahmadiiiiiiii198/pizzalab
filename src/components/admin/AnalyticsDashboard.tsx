import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  ShoppingCart, 
  Users, 
  Pizza,
  Calendar,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  todayOrders: number;
  todayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer_name: string;
    total_amount: number;
    created_at: string;
    order_status: string;
  }>;
  ordersByHour: Array<{
    hour: number;
    count: number;
  }>;
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    todayOrders: 0,
    todayRevenue: 0,
    weekOrders: 0,
    weekRevenue: 0,
    monthOrders: 0,
    monthRevenue: 0,
    topProducts: [],
    recentOrders: [],
    ordersByHour: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      // Today's stats
      const { data: todayData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today.toISOString())
        .eq('order_status', 'delivered');

      // Week's stats
      const { data: weekData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', weekAgo.toISOString())
        .eq('order_status', 'delivered');

      // Month's stats
      const { data: monthData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', monthAgo.toISOString())
        .eq('order_status', 'delivered');

      // Top products
      const { data: topProductsData } = await supabase
        .from('order_items')
        .select(`
          product_name,
          quantity,
          subtotal,
          orders!inner(order_status)
        `)
        .eq('orders.order_status', 'delivered');

      // Recent orders
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('id, customer_name, total_amount, created_at, order_status')
        .order('created_at', { ascending: false })
        .limit(10);

      // Orders by hour (last 7 days)
      const { data: hourlyData } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', weekAgo.toISOString());

      // Process data
      const todayOrders = todayData?.length || 0;
      const todayRevenue = todayData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      
      const weekOrders = weekData?.length || 0;
      const weekRevenue = weekData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      
      const monthOrders = monthData?.length || 0;
      const monthRevenue = monthData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Process top products
      const productStats = new Map();
      topProductsData?.forEach(item => {
        const existing = productStats.get(item.product_name) || { quantity: 0, revenue: 0 };
        productStats.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.subtotal
        });
      });

      const topProducts = Array.from(productStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Process orders by hour
      const hourlyStats = new Array(24).fill(0);
      hourlyData?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourlyStats[hour]++;
      });

      const ordersByHour = hourlyStats.map((count, hour) => ({ hour, count }));

      setAnalytics({
        todayOrders,
        todayRevenue,
        weekOrders,
        weekRevenue,
        monthOrders,
        monthRevenue,
        topProducts,
        recentOrders: recentOrdersData || [],
        ordersByHour
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento statistiche...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'ready': return 'text-blue-600';
      case 'preparing': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oggi</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{analytics.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.todayOrders} ordini completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questa Settimana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{analytics.weekRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.weekOrders} ordini completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questo Mese</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{analytics.monthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.monthOrders} ordini completati
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pizza className="mr-2" size={20} />
              Prodotti Più Venduti
            </CardTitle>
            <CardDescription>Ultimi 30 giorni</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.quantity} venduti</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {analytics.topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nessun dato disponibile</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              Ordini Recenti
            </CardTitle>
            <CardDescription>Ultimi 10 ordini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{order.total_amount.toFixed(2)}</p>
                    <p className={`text-sm ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </p>
                  </div>
                </div>
              ))}
              {analytics.recentOrders.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nessun ordine recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Hour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2" size={20} />
            Ordini per Ora (Ultimi 7 giorni)
          </CardTitle>
          <CardDescription>Distribuzione degli ordini durante la giornata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2">
            {analytics.ordersByHour.map((data) => (
              <div key={data.hour} className="text-center">
                <div 
                  className="bg-red-200 rounded-t-md mb-1 transition-all duration-300 hover:bg-red-300"
                  style={{ 
                    height: `${Math.max(data.count * 10, 4)}px`,
                    minHeight: '4px'
                  }}
                ></div>
                <div className="text-xs text-gray-600">{data.hour}:00</div>
                <div className="text-xs font-semibold text-red-600">{data.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
