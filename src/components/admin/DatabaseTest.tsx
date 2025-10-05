import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const DatabaseTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runDatabaseTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      console.log('🧪 [DatabaseTest] Starting database connection test...');
      
      // Test 1: Basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('gallery_images')
        .select('count(*)')
        .single();
      
      setTestResults(prev => [...prev, {
        test: 'Database Connection',
        status: connectionError ? 'FAILED' : 'PASSED',
        data: connectionTest,
        error: connectionError
      }]);
      
      // Test 2: Gallery images query
      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      setTestResults(prev => [...prev, {
        test: 'Gallery Images Query',
        status: galleryError ? 'FAILED' : 'PASSED',
        data: galleryData,
        error: galleryError
      }]);
      
      // Test 3: Settings table query
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'galleryImages')
        .single();
      
      setTestResults(prev => [...prev, {
        test: 'Settings Table Query',
        status: settingsError ? 'FAILED' : 'PASSED',
        data: settingsData,
        error: settingsError
      }]);
      
      console.log('🧪 [DatabaseTest] Test results:', testResults);
      
    } catch (error) {
      console.error('🧪 [DatabaseTest] Test failed:', error);
      setTestResults(prev => [...prev, {
        test: 'General Error',
        status: 'FAILED',
        data: null,
        error: error
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDatabaseTest();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Database Connection Test
          <Button onClick={runDatabaseTest} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Run Test'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{result.test}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.status === 'PASSED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              {result.data && (
                <div className="mb-2">
                  <strong>Data:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div>
                  <strong>Error:</strong>
                  <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
          
          {testResults.length === 0 && !isLoading && (
            <p className="text-gray-500 text-center">No test results yet. Click "Run Test" to start.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;
