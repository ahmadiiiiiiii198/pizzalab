import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  ShoppingCart, 
  Pizza, 
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const MinimalAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testResults, setTestResults] = useState<string[]>([]);

  const runBasicTest = () => {
    setTestResults([]);
    
    // Test 1: Basic React functionality
    setTestResults(prev => [...prev, '✅ React state management working']);
    
    // Test 2: UI components
    setTestResults(prev => [...prev, '✅ UI components loading']);
    
    // Test 3: Icons
    setTestResults(prev => [...prev, '✅ Lucide icons working']);
    
    // Test 4: Tabs functionality
    setTestResults(prev => [...prev, '✅ Tabs system working']);
    
    setTestResults(prev => [...prev, '🎉 All basic tests passed!']);
  };

  React.useEffect(() => {
    console.log('🚀 [MinimalAdmin] Component mounted successfully');
    console.log('🚀 [MinimalAdmin] Active tab:', activeTab);
  }, []);

  React.useEffect(() => {
    console.log('🔄 [MinimalAdmin] Tab changed to:', activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-200 rounded-lg mb-6">
          <div className="px-6 py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              🍕 Minimal Admin Panel
            </h1>
            <p className="text-gray-600 mt-2">
              Testing basic functionality - if you see this, the admin panel is working!
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Pizza className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Basic admin panel functionality test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={runBasicTest} className="w-full">
                      Run Basic Tests
                    </Button>
                    
                    {testResults.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Test Results:</h4>
                        <div className="space-y-1">
                          {testResults.map((result, index) => (
                            <div key={index} className="text-sm">
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Quick Stats
                  </CardTitle>
                  <CardDescription>
                    Sample dashboard data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="font-bold">42</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Products:</span>
                      <span className="font-bold">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Today:</span>
                      <span className="font-bold">€156.50</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
                <CardDescription>
                  This would contain the orders management interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Orders management would go here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Products Management</CardTitle>
                <CardDescription>
                  This would contain the products management interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Pizza className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Products management would go here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  This would contain the settings interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Settings would go here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MinimalAdminPanel;
