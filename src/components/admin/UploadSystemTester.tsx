import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, XCircle, AlertCircle, Database, Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileUnified } from '@/services/unifiedUploadService';
import { supabase } from '@/integrations/supabase/client';
import { classifyUploadError, getUserFriendlyErrorMessage } from '@/utils/uploadErrorHandler';
import { runAllUploadTests, TestSuite, TestResult } from '@/utils/uploadSystemTests';
import { runAllQuickTests } from '@/utils/quickUploadTest';
import { runImageDiagnostics, regenerateProblematicUrls } from '@/utils/imageUrlDiagnostics';
import { testUploadFix } from '@/utils/testUploadFix';
import { testFallbackImageCreation } from '@/utils/testFallbackImages';
import { debugMimeTypeIssue } from '@/utils/debugMimeType';

/**
 * Upload System Tester Component
 * Tests the complete upload flow: storage → database → frontend display
 */

interface SimpleTestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'running';
  message: string;
  details?: any;
}

interface ComprehensiveTestResults {
  suites: TestSuite[];
  summary: {
    totalSuites: number;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
    successRate: number;
  };
}

const UploadSystemTester: React.FC = () => {
  // Debug logging
  console.log('🧪 UploadSystemTester component loaded and rendering');

  const [testResults, setTestResults] = useState<SimpleTestResult[]>([]);
  const [comprehensiveResults, setComprehensiveResults] = useState<ComprehensiveTestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningComprehensive, setIsRunningComprehensive] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'simple' | 'comprehensive' | 'quick' | 'diagnostics'>('quick');
  const [quickTestResults, setQuickTestResults] = useState<any>(null);
  const [diagnosticsResults, setDiagnosticsResults] = useState<any>(null);
  const [isRunningQuick, setIsRunningQuick] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const { toast } = useToast();

  const updateTestResult = (step: string, status: SimpleTestResult['status'], message: string, details?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { step, status, message, details }];
      }
    });
  };

  const createTestImage = (): File => {
    // Create a small test image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple test pattern
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('TEST', 75, 100);
    ctx.fillText(new Date().toLocaleTimeString(), 50, 130);
    
    // Convert to blob and then to File
    const dataURL = canvas.toDataURL('image/png');
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    return new File([blob], `test-upload-${Date.now()}.png`, { type: 'image/png' });
  };

  const runCompleteTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setUploadedImageUrl('');

    try {
      // Step 1: Create test file
      updateTestResult('create-file', 'running', 'Creating test image file...');
      const testFile = createTestImage();
      updateTestResult('create-file', 'success', `Created test file: ${testFile.name} (${Math.round(testFile.size / 1024)}KB)`);

      // Step 2: Test storage upload
      updateTestResult('storage-upload', 'running', 'Testing storage upload...');
      const uploadResult = await uploadFileUnified(testFile, {
        uploadType: 'gallery',
        saveToDatabase: true,
        metadata: {
          title: 'Upload System Test',
          description: 'Automated test upload',
          category: 'test',
          is_active: true,
          is_featured: false
        },
        maxRetries: 2,
        validateFile: true
      });

      if (!uploadResult.success) {
        const error = classifyUploadError(uploadResult.error);
        updateTestResult('storage-upload', 'error', `Upload failed: ${error.message}`, error);
        return;
      }

      updateTestResult('storage-upload', 'success', `File uploaded successfully`, {
        url: uploadResult.url,
        filePath: uploadResult.filePath
      });

      setUploadedImageUrl(uploadResult.url || '');

      // Step 3: Verify database record
      updateTestResult('database-verify', 'running', 'Verifying database record...');
      
      if (uploadResult.databaseId) {
        const { data: dbRecord, error: dbError } = await supabase
          .from('gallery_images')
          .select('*')
          .eq('id', uploadResult.databaseId)
          .single();

        if (dbError) {
          updateTestResult('database-verify', 'error', `Database verification failed: ${dbError.message}`, dbError);
        } else {
          updateTestResult('database-verify', 'success', 'Database record found and verified', dbRecord);
        }
      } else {
        updateTestResult('database-verify', 'error', 'No database ID returned from upload');
      }

      // Step 4: Test URL accessibility
      updateTestResult('url-access', 'running', 'Testing URL accessibility...');
      
      if (uploadResult.url) {
        try {
          const response = await fetch(uploadResult.url, { method: 'HEAD' });
          if (response.ok) {
            updateTestResult('url-access', 'success', `URL is accessible (Status: ${response.status})`);
          } else {
            updateTestResult('url-access', 'error', `URL returned status: ${response.status}`);
          }
        } catch (error) {
          updateTestResult('url-access', 'error', `URL access failed: ${error}`);
        }
      }

      // Step 5: Test image loading
      updateTestResult('image-load', 'running', 'Testing image loading...');
      
      if (uploadResult.url) {
        const img = new Image();
        img.onload = () => {
          updateTestResult('image-load', 'success', `Image loaded successfully (${img.naturalWidth}x${img.naturalHeight})`);
        };
        img.onerror = () => {
          updateTestResult('image-load', 'error', 'Image failed to load');
        };
        img.src = uploadResult.url;
      }

      toast({
        title: "Upload Test Complete",
        description: "Check the results below for detailed information.",
      });

    } catch (error) {
      console.error('Test failed:', error);
      updateTestResult('test-error', 'error', `Test failed: ${error}`, error);
      
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred during testing.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunningComprehensive(true);
    setComprehensiveResults(null);

    try {
      toast({
        title: "Starting Comprehensive Tests",
        description: "Running extensive upload system tests...",
      });

      const results = await runAllUploadTests();
      setComprehensiveResults(results);

      const { summary } = results;
      toast({
        title: "Comprehensive Tests Complete",
        description: `${summary.totalPassed}/${summary.totalTests} tests passed (${summary.successRate.toFixed(1)}%)`,
        variant: summary.successRate >= 80 ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Comprehensive tests failed:', error);
      toast({
        title: "Comprehensive Tests Failed",
        description: "An error occurred while running comprehensive tests.",
        variant: "destructive",
      });
    } finally {
      setIsRunningComprehensive(false);
    }
  };

  const runQuickTests = async () => {
    setIsRunningQuick(true);
    setQuickTestResults(null);

    try {
      toast({
        title: "Running Quick Tests",
        description: "Testing upload system basics...",
      });

      const results = await runAllQuickTests();
      setQuickTestResults(results);

      toast({
        title: results.overall.success ? "Quick Tests Passed" : "Quick Tests Failed",
        description: results.overall.message,
        variant: results.overall.success ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Quick tests failed:', error);
      toast({
        title: "Quick Tests Failed",
        description: "An error occurred while running quick tests.",
        variant: "destructive",
      });
    } finally {
      setIsRunningQuick(false);
    }
  };

  const runImageDiagnosticsTest = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsResults(null);

    try {
      toast({
        title: "Running Image Diagnostics",
        description: "Analyzing image loading issues...",
      });

      const results = await runImageDiagnostics();
      setDiagnosticsResults(results);

      const { urlTests } = results;
      const successRate = (urlTests.summary.canLoad / urlTests.summary.totalTested) * 100;

      toast({
        title: "Diagnostics Complete",
        description: `${urlTests.summary.canLoad}/${urlTests.summary.totalTested} images loading correctly (${successRate.toFixed(1)}%)`,
        variant: successRate >= 80 ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Image diagnostics failed:', error);
      toast({
        title: "Diagnostics Failed",
        description: "An error occurred while running image diagnostics.",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const fixProblematicUrls = async () => {
    try {
      toast({
        title: "Fixing URLs",
        description: "Attempting to fix problematic image URLs...",
      });

      const results = await regenerateProblematicUrls();

      if (results.fixed.length > 0) {
        toast({
          title: "URLs Fixed",
          description: `Fixed ${results.fixed.length} problematic URLs. Refresh the page to see changes.`,
        });
      } else {
        toast({
          title: "No Fixes Needed",
          description: "No problematic URLs found or all URLs are already correct.",
        });
      }

      if (results.errors.length > 0) {
        console.error('URL fix errors:', results.errors);
      }

    } catch (error) {
      toast({
        title: "Fix Failed",
        description: "An error occurred while fixing URLs.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: SimpleTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: SimpleTestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload System Tester
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">ACTIVE</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test the complete upload flow: file creation → storage upload → database save → URL access → image display
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Type Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'quick' ? 'default' : 'outline'}
            onClick={() => setActiveTab('quick')}
            size="sm"
          >
            Quick Test
          </Button>
          <Button
            variant={activeTab === 'simple' ? 'default' : 'outline'}
            onClick={() => setActiveTab('simple')}
            size="sm"
          >
            Simple Test
          </Button>
          <Button
            variant={activeTab === 'comprehensive' ? 'default' : 'outline'}
            onClick={() => setActiveTab('comprehensive')}
            size="sm"
          >
            Comprehensive Tests
          </Button>
          <Button
            variant={activeTab === 'diagnostics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('diagnostics')}
            size="sm"
          >
            Image Diagnostics
          </Button>
        </div>

        {/* Test Controls */}
        <div className="flex gap-4">
          {activeTab === 'quick' && (
            <Button
              onClick={runQuickTests}
              disabled={isRunning || isRunningComprehensive || isRunningQuick}
              className="flex items-center gap-2"
              variant="default"
            >
              {isRunningQuick ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isRunningQuick ? 'Running Quick Tests...' : 'Run Quick Tests'}
            </Button>
          )}

          {activeTab === 'simple' && (
            <Button
              onClick={runCompleteTest}
              disabled={isRunning || isRunningComprehensive || isRunningQuick}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isRunning ? 'Running Simple Test...' : 'Run Simple Test'}
            </Button>
          )}

          {activeTab === 'comprehensive' && (
            <Button
              onClick={runComprehensiveTests}
              disabled={isRunning || isRunningComprehensive || isRunningQuick || isRunningDiagnostics}
              className="flex items-center gap-2"
              variant="secondary"
            >
              {isRunningComprehensive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isRunningComprehensive ? 'Running Comprehensive Tests...' : 'Run All Tests'}
            </Button>
          )}

          {activeTab === 'diagnostics' && (
            <div className="flex gap-2">
              <Button
                onClick={runImageDiagnosticsTest}
                disabled={isRunning || isRunningComprehensive || isRunningQuick || isRunningDiagnostics}
                className="flex items-center gap-2"
                variant="secondary"
              >
                {isRunningDiagnostics ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {isRunningDiagnostics ? 'Running Diagnostics...' : 'Diagnose Issues'}
              </Button>
              <Button
                onClick={fixProblematicUrls}
                disabled={isRunning || isRunningComprehensive || isRunningQuick || isRunningDiagnostics}
                className="flex items-center gap-2"
                variant="outline"
              >
                <CheckCircle className="h-4 w-4" />
                Fix URLs
              </Button>
              <Button
                onClick={async () => {
                  const result = await testUploadFix();
                  toast({
                    title: result.success ? "Upload Fix Test Passed" : "Upload Fix Test Failed",
                    description: result.message,
                    variant: result.success ? "default" : "destructive",
                  });
                }}
                disabled={isRunning || isRunningComprehensive || isRunningQuick || isRunningDiagnostics}
                className="flex items-center gap-2"
                variant="default"
                size="sm"
              >
                <Upload className="h-4 w-4" />
                Test Fix
              </Button>
              <Button
                onClick={() => {
                  const result = testFallbackImageCreation();
                  toast({
                    title: result.success ? "Image Creation Test Passed" : "Image Creation Test Failed",
                    description: result.message,
                    variant: result.success ? "default" : "destructive",
                  });
                }}
                disabled={isRunning || isRunningComprehensive || isRunningQuick || isRunningDiagnostics}
                className="flex items-center gap-2"
                variant="outline"
                size="sm"
              >
                <Image className="h-4 w-4" />
                Test Images
              </Button>
              <Button
                onClick={() => {
                  const result = debugMimeTypeIssue();
                  toast({
                    title: result.success ? "MIME Debug Complete" : "MIME Debug Failed",
                    description: result.message,
                    variant: result.success ? "default" : "destructive",
                  });
                }}
                disabled={isRunning || isRunningComprehensive || isRunningQuick || isRunningDiagnostics}
                className="flex items-center gap-2"
                variant="outline"
                size="sm"
              >
                <AlertCircle className="h-4 w-4" />
                Debug MIME
              </Button>
            </div>
          )}
        </div>

        {/* Quick Test Results */}
        {activeTab === 'quick' && quickTestResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Test Results</h3>

            {/* Overall Status */}
            <div className={`p-4 rounded-lg border ${quickTestResults.overall.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {quickTestResults.overall.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-semibold">{quickTestResults.overall.message}</span>
              </div>
            </div>

            {/* Upload Test */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {quickTestResults.uploadTest.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">Upload Test</span>
              </div>
              <p className="text-sm text-gray-600">{quickTestResults.uploadTest.message}</p>
              {quickTestResults.uploadTest.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(quickTestResults.uploadTest.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            {/* Display Test */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {quickTestResults.displayTest.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">Gallery Display Test</span>
              </div>
              <p className="text-sm text-gray-600">{quickTestResults.displayTest.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                Found {quickTestResults.displayTest.imageCount} gallery images
              </p>
              {quickTestResults.displayTest.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(quickTestResults.displayTest.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Simple Test Results */}
        {activeTab === 'simple' && testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Simple Test Results</h3>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.step.replace('-', ' ').toUpperCase()}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comprehensive Test Results */}
        {activeTab === 'comprehensive' && comprehensiveResults && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Comprehensive Test Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Suites:</span>
                  <div className="font-semibold">{comprehensiveResults.summary.totalSuites}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Tests:</span>
                  <div className="font-semibold">{comprehensiveResults.summary.totalTests}</div>
                </div>
                <div>
                  <span className="text-gray-600">Success Rate:</span>
                  <div className={`font-semibold ${comprehensiveResults.summary.successRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                    {comprehensiveResults.summary.successRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-semibold">{(comprehensiveResults.summary.totalDuration / 1000).toFixed(1)}s</div>
                </div>
              </div>
            </div>

            {comprehensiveResults.suites.map((suite, suiteIndex) => (
              <div key={suiteIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{suite.suiteName}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={suite.failedTests === 0 ? 'default' : 'destructive'}>
                      {suite.passedTests}/{suite.totalTests} passed
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {(suite.duration / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {suite.results.map((result, resultIndex) => (
                    <div key={resultIndex} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{result.testName}</span>
                          {result.duration && (
                            <span className="text-xs text-gray-500">
                              ({result.duration}ms)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{result.message}</p>
                        {result.details && (
                          <details className="mt-1">
                            <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Diagnostics Results */}
        {activeTab === 'diagnostics' && diagnosticsResults && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Image Diagnostics Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">URLs Tested:</span>
                  <div className="font-semibold">{diagnosticsResults.urlTests.summary.totalTested}</div>
                </div>
                <div>
                  <span className="text-gray-600">Accessible:</span>
                  <div className="font-semibold text-green-600">{diagnosticsResults.urlTests.summary.accessible}</div>
                </div>
                <div>
                  <span className="text-gray-600">Can Load:</span>
                  <div className="font-semibold text-blue-600">{diagnosticsResults.urlTests.summary.canLoad}</div>
                </div>
                <div>
                  <span className="text-gray-600">Issues:</span>
                  <div className="font-semibold text-red-600">{diagnosticsResults.urlTests.summary.commonIssues.length}</div>
                </div>
              </div>
            </div>

            {/* URL Test Results */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">URL Test Results</h4>
              <div className="space-y-3">
                {diagnosticsResults.urlTests.results.map((result: any, index: number) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      {result.fetchTest.accessible && result.imageTest.canLoad ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium text-sm">
                        {result.url.includes('hero-backgrounds') ? 'Hero Image' : 'Section Image'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 break-all">{result.url}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">HTTP Status:</span> {result.fetchTest.httpStatus || 'N/A'}
                        <br />
                        <span className="font-medium">Content Type:</span> {result.fetchTest.contentType || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Can Load:</span> {result.imageTest.canLoad ? 'Yes' : 'No'}
                        <br />
                        <span className="font-medium">Dimensions:</span> {result.imageTest.naturalWidth}x{result.imageTest.naturalHeight || 'N/A'}
                      </div>
                    </div>
                    {(result.fetchTest.error || result.imageTest.error) && (
                      <div className="mt-2 text-xs text-red-600">
                        Error: {result.fetchTest.error || result.imageTest.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bucket Diagnostics */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Storage Bucket Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {diagnosticsResults.bucketDiagnostics.map((bucket: any, index: number) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      {bucket.exists && bucket.isPublic ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{bucket.bucketName}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Exists: {bucket.exists ? 'Yes' : 'No'}</div>
                      <div>Public: {bucket.isPublic ? 'Yes' : 'No'}</div>
                      <div>Files: {bucket.sampleFiles.length}</div>
                      {bucket.error && <div className="text-red-600">Error: {bucket.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Files */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Storage Files Found</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Section Backgrounds ({diagnosticsResults.storageFiles.sectionBackgrounds.length})</h5>
                  <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                    {diagnosticsResults.storageFiles.sectionBackgrounds.map((file: string, index: number) => (
                      <div key={index} className="truncate">{file}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm mb-2">Hero Backgrounds ({diagnosticsResults.storageFiles.heroBackgrounds.length})</h5>
                  <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                    {diagnosticsResults.storageFiles.heroBackgrounds.map((file: string, index: number) => (
                      <div key={index} className="truncate">{file}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Image Preview */}
        {uploadedImageUrl && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Image className="h-5 w-5" />
              Uploaded Image Preview
            </h3>
            <div className="border rounded-lg p-4">
              <img 
                src={uploadedImageUrl} 
                alt="Test upload" 
                className="max-w-xs max-h-48 object-contain border rounded"
                onLoad={() => console.log('✅ Test image loaded successfully')}
                onError={() => console.error('❌ Test image failed to load')}
              />
              <p className="text-xs text-gray-500 mt-2 break-all">
                URL: {uploadedImageUrl}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadSystemTester;
