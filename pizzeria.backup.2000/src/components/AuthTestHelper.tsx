import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RefreshCw, ExternalLink } from 'lucide-react';

const AuthTestHelper = () => {
  const clearAuthData = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminCredentials');
    console.log('🧹 Cleared authentication data from localStorage');
    window.location.reload();
  };

  const checkAuthData = () => {
    const adminAuth = localStorage.getItem('adminAuthenticated');
    const adminCreds = localStorage.getItem('adminCredentials');
    
    console.log('🔍 Authentication Status Check:');
    console.log('adminAuthenticated:', adminAuth);
    console.log('adminCredentials:', adminCreds ? 'Present' : 'Not found');
    
    if (adminCreds) {
      try {
        const parsed = JSON.parse(adminCreds);
        console.log('Credentials:', { username: parsed.username, password: '***' });
      } catch (e) {
        console.log('Error parsing credentials:', e);
      }
    }
  };

  const testRoutes = [
    { path: '/admin', name: 'Admin Panel', description: 'Main admin panel - should require authentication' },
    { path: '/ordini', name: 'Orders Management', description: 'Orders section - should require authentication' },
    { path: '/', name: 'Main Site', description: 'Public site - should work without authentication' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Authentication Test Helper
          </CardTitle>
          <CardDescription>
            Helper tools to test authentication functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={clearAuthData} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Auth Data & Reload
            </Button>
            <Button onClick={checkAuthData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Auth Status (Console)
            </Button>
          </div>

          {/* Route Testing */}
          <div className="space-y-3">
            <h3 className="font-medium">Test Routes:</h3>
            <div className="grid gap-3">
              {testRoutes.map((route) => (
                <div key={route.path} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{route.name}</div>
                    <div className="text-sm text-gray-600">{route.description}</div>
                  </div>
                  <Button
                    onClick={() => window.open(route.path, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Test Scenarios:</h3>
            <ol className="text-blue-800 text-sm space-y-2 list-decimal list-inside">
              <li><strong>Fresh Session Test:</strong> Click "Clear Auth Data" then try accessing /admin or /ordini - should show login form</li>
              <li><strong>Login Test:</strong> Use credentials admin/persian123 - should grant access</li>
              <li><strong>Wrong Credentials Test:</strong> Try wrong credentials - should be rejected</li>
              <li><strong>Logout Test:</strong> After login, click logout button - should return to login form</li>
              <li><strong>Direct Access Test:</strong> Try accessing protected routes directly in new tab</li>
              <li><strong>Session Persistence:</strong> Login, refresh page - should stay logged in</li>
            </ol>
          </div>

          {/* Current Status Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Current Browser State:</h3>
            <div className="text-sm space-y-1">
              <div>Auth Status: {localStorage.getItem('adminAuthenticated') === 'true' ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
              <div>Credentials Stored: {localStorage.getItem('adminCredentials') ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthTestHelper;
