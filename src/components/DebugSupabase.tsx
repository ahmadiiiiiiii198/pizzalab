import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DebugSupabase = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    const testResults: any[] = [];

    try {
      // Test 1: Basic connection
      testResults.push({ test: 'Basic Connection', status: 'starting...' });
      setResults([...testResults]);

      const { data: basicData, error: basicError } = await supabase
        .from('settings')
        .select('count')
        .limit(1);

      testResults[testResults.length - 1] = {
        test: 'Basic Connection',
        status: basicError ? 'failed' : 'success',
        data: basicData,
        error: basicError
      };
      setResults([...testResults]);

      // Test 2: Get all settings
      testResults.push({ test: 'Get All Settings', status: 'starting...' });
      setResults([...testResults]);

      const { data: allSettings, error: allError } = await supabase
        .from('settings')
        .select('*')
        .limit(5);

      testResults[testResults.length - 1] = {
        test: 'Get All Settings',
        status: allError ? 'failed' : 'success',
        data: allSettings,
        error: allError
      };
      setResults([...testResults]);

      // Test 3: Get business hours specifically
      testResults.push({ test: 'Get Business Hours', status: 'starting...' });
      setResults([...testResults]);

      const { data: businessHours, error: businessError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'businessHours');

      testResults[testResults.length - 1] = {
        test: 'Get Business Hours',
        status: businessError ? 'failed' : 'success',
        data: businessHours,
        error: businessError
      };
      setResults([...testResults]);

      // Test 4: Test with single()
      testResults.push({ test: 'Get Business Hours (single)', status: 'starting...' });
      setResults([...testResults]);

      const { data: singleBusinessHours, error: singleError } = await supabase
        .from('settings')
        .select('key, value, updated_at')
        .eq('key', 'businessHours')
        .single();

      testResults[testResults.length - 1] = {
        test: 'Get Business Hours (single)',
        status: singleError ? 'failed' : 'success',
        data: singleBusinessHours,
        error: singleError
      };
      setResults([...testResults]);

      // Test 5: Test business hours service directly
      testResults.push({ test: 'Business Hours Service', status: 'starting...' });
      setResults([...testResults]);

      try {
        const { businessHoursService } = await import('@/services/businessHoursService');
        businessHoursService.clearCache(); // Clear cache first
        const serviceHours = await businessHoursService.forceRefresh();

        testResults[testResults.length - 1] = {
          test: 'Business Hours Service',
          status: 'success',
          data: serviceHours,
          error: null
        };
      } catch (serviceError) {
        testResults[testResults.length - 1] = {
          test: 'Business Hours Service',
          status: 'failed',
          data: null,
          error: serviceError
        };
      }
      setResults([...testResults]);

    } catch (err) {
      testResults.push({
        test: 'Unexpected Error',
        status: 'failed',
        error: err
      });
      setResults([...testResults]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto z-50 border">
      <h3 className="font-bold mb-2">Supabase Debug</h3>
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Tests'}
      </button>
      
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="border p-2 rounded text-xs">
            <div className="font-semibold">
              {result.test}: 
              <span className={`ml-2 ${
                result.status === 'success' ? 'text-green-600' : 
                result.status === 'failed' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {result.status}
              </span>
            </div>
            {result.data && (
              <div className="mt-1">
                <strong>Data:</strong>
                <pre className="text-xs bg-gray-100 p-1 rounded mt-1 overflow-auto max-h-20">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
            {result.error && (
              <div className="mt-1">
                <strong>Error:</strong>
                <pre className="text-xs bg-red-100 p-1 rounded mt-1 overflow-auto max-h-20">
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugSupabase;
