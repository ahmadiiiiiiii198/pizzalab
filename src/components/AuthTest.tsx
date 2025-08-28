import React, { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Shield, LogOut } from 'lucide-react';

const AuthTest = () => {
  const { isAuthenticated, isLoading, handleLogin, handleLogout } = useAdminAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testLogin = async () => {
    addTestResult('Testing login with correct credentials...');
    const success = await handleLogin('admin', 'persian123');
    addTestResult(success ? '✅ Login successful' : '❌ Login failed');
  };

  const testWrongLogin = async () => {
    addTestResult('Testing login with wrong credentials...');
    const success = await handleLogin('wrong', 'wrong');
    addTestResult(success ? '❌ Login should have failed' : '✅ Login correctly rejected');
  };

  const testLogout = async () => {
    addTestResult('Testing logout...');
    await handleLogout();
    addTestResult('✅ Logout completed');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Authentication System Test
          </CardTitle>
          <CardDescription>
            Test the authentication functionality for admin panel access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Status: {isLoading ? 'Checking...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
            {isAuthenticated && (
              <Button onClick={testLogout} variant="outline" size="sm" className="ml-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={testLogin} disabled={isLoading}>
              Test Correct Login
            </Button>
            <Button onClick={testWrongLogin} disabled={isLoading} variant="outline">
              Test Wrong Login
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Test Results:</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Test Instructions:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Default credentials: username = "admin", password = "persian123"</li>
              <li>• Test correct login to verify authentication works</li>
              <li>• Test wrong login to verify rejection works</li>
              <li>• Test logout to verify session clearing</li>
              <li>• Try accessing /admin and /ordini routes directly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthTest;
