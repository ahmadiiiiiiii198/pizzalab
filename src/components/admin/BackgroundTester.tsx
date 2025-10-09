import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testBackgroundImages, fixBackgroundUrls } from '@/utils/testBackgrounds';
import { initializeMissingSettings } from '@/utils/initializeMissingSettings';
import { RefreshCw, Wrench, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

interface TestResult {
  section: string;
  status: string;
  backgroundImage?: string | null;
  imageAccessible?: boolean;
  error?: string;
  fullValue?: any;
}

const BackgroundTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTest = async () => {
    setTesting(true);
    try {
      const testResults = await testBackgroundImages();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const runFix = async () => {
    setFixing(true);
    try {
      await fixBackgroundUrls();
      // Re-run test after fix
      await runTest();
    } catch (error) {
      console.error('Fix failed:', error);
    } finally {
      setFixing(false);
    }
  };

  const runInitialize = async () => {
    setInitializing(true);
    try {
      await initializeMissingSettings();
      // Re-run test after initialization
      await runTest();
    } catch (error) {
      console.error('Initialize failed:', error);
    } finally {
      setInitializing(false);
    }
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.status === 'error') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (result.status === 'missing') {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    if (result.backgroundImage && result.imageAccessible) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (result.backgroundImage && result.imageAccessible === false) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = (result: TestResult) => {
    if (result.status === 'error') return 'Error';
    if (result.status === 'missing') return 'No setting';
    if (!result.backgroundImage) return 'No background';
    if (result.imageAccessible === true) return 'Working';
    if (result.imageAccessible === false) return 'Image not accessible';
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Background Images Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={runInitialize}
              disabled={initializing}
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className={`h-4 w-4 ${initializing ? 'animate-spin' : ''}`} />
              {initializing ? 'Initializing...' : 'Initialize Missing Settings'}
            </Button>

            <Button
              onClick={runTest}
              disabled={testing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Run Diagnostic Test'}
            </Button>

            <Button
              onClick={runFix}
              disabled={fixing || results.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wrench className={`h-4 w-4 ${fixing ? 'animate-spin' : ''}`} />
              {fixing ? 'Fixing...' : 'Fix URLs'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold text-lg">Test Results:</h3>
              
              <div className="grid gap-3">
                {results.map((result) => (
                  <div
                    key={result.section}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <div>
                          <div className="font-medium">{result.section}</div>
                          <div className="text-sm text-gray-500">
                            {getStatusText(result)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {result.backgroundImage && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                        {result.backgroundImage}
                      </div>
                    )}

                    {result.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                        {result.error}
                      </div>
                    )}

                    {result.backgroundImage && result.imageAccessible && (
                      <div className="mt-2">
                        <img
                          src={result.backgroundImage}
                          alt={`${result.section} background`}
                          className="w-full h-24 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Summary:</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ Working: {results.filter(r => r.imageAccessible === true).length}</li>
                  <li>❌ Broken: {results.filter(r => r.backgroundImage && r.imageAccessible === false).length}</li>
                  <li>⚠️ No background: {results.filter(r => !r.backgroundImage && r.status === 'found').length}</li>
                  <li>📋 Missing settings: {results.filter(r => r.status === 'missing').length}</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Fixes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Common Issues:</h4>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li><strong>Images not showing:</strong> Check if URLs are accessible (run diagnostic)</li>
              <li><strong>CORS errors:</strong> Images might be blocked by browser security</li>
              <li><strong>Cache issues:</strong> Try hard refresh (Ctrl+Shift+R) on frontend</li>
              <li><strong>Wrong MIME type:</strong> Use "Fix MIME Types" button in Section Background Manager</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-2 text-yellow-800">💡 Troubleshooting Steps:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-yellow-700">
              <li>Run diagnostic test above</li>
              <li>If URLs are broken, click "Fix URLs"</li>
              <li>Go to Section Background Manager and click "Fix MIME Types"</li>
              <li>Hard refresh the frontend (Ctrl+Shift+R)</li>
              <li>Check browser console for errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackgroundTester;
