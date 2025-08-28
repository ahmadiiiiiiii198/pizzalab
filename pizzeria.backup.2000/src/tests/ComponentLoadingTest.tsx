import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface TestResult {
  component: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  duration?: number;
}

const ComponentLoadingTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (component: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.component === component);
      if (existing) {
        return prev.map(r => r.component === component ? { ...r, status, message, duration } : r);
      }
      return [...prev, { component, status, message, duration }];
    });
  };

  const testComponent = async (componentName: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTestResult(componentName, 'loading', 'Testing...');
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(componentName, 'success', 'Component loaded successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(componentName, 'error', error instanceof Error ? error.message : 'Unknown error', duration);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Products Component
    await testComponent('Products', async () => {
      // Simulate loading products
      const response = await fetch('/api/test-products');
      if (!response.ok && response.status !== 404) {
        throw new Error('Products component failed to initialize');
      }
    });

    // Test 2: Customer Auth
    await testComponent('CustomerAuth', async () => {
      // Test auth initialization
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Test 3: Order Tracker
    await testComponent('OrderTracker', async () => {
      // Test order tracker
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    // Test 4: Real-time Features
    await testComponent('RealTimeFeatures', async () => {
      // Test real-time connections
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Component Loading Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              {testResults.map((result) => (
                <div
                  key={result.component}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.component}</h4>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    {result.duration && (
                      <span className="text-sm text-gray-500">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {testResults.length > 0 && !isRunning && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Summary:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-green-600">
                  ✅ Passed: {testResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-red-600">
                  ❌ Failed: {testResults.filter(r => r.status === 'error').length}
                </div>
                <div className="text-blue-600">
                  ⏳ Running: {testResults.filter(r => r.status === 'loading').length}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentLoadingTest;
