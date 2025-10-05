import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import shippingZoneService from '@/services/shippingZoneService';

interface TestResult {
  address: string;
  success: boolean;
  formattedAddress?: string;
  coordinates?: { lat: number; lng: number };
  distance?: number;
  error?: string;
}

const GoogleMapsApiTest: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'present' | 'missing'>('loading');
  const [testAddress, setTestAddress] = useState('Via Roma 1, Torino, Italy');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      await shippingZoneService.reloadFromDatabase();
      const settings = shippingZoneService.getSettings();
      setApiKeyStatus(settings.googleMapsApiKey ? 'present' : 'missing');
    } catch (error) {
      console.error('Failed to check API key status:', error);
      setApiKeyStatus('missing');
    }
  };

  const testAddress = async () => {
    if (!testAddress.trim()) return;

    setIsLoading(true);
    try {
      const result = await shippingZoneService.validateDeliveryAddress(testAddress, 25);
      
      const testResult: TestResult = {
        address: testAddress,
        success: !result.error,
        formattedAddress: result.formattedAddress,
        coordinates: result.coordinates,
        distance: result.distance,
        error: result.error
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 4)]); // Keep last 5 results
    } catch (error) {
      const testResult: TestResult = {
        address: testAddress,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => [testResult, ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  const testPredefinedAddresses = async () => {
    const addresses = [
      'Via Roma 1, Torino, Italy',
      'Corso Principe Oddone 82, Torino, Italy',
      'Piazza della Repubblica, Torino, Italy',
      'Via Po 25, Torino, Italy'
    ];

    setIsLoading(true);
    const results: TestResult[] = [];

    for (const addr of addresses) {
      try {
        const result = await shippingZoneService.validateDeliveryAddress(addr, 25);
        results.push({
          address: addr,
          success: !result.error,
          formattedAddress: result.formattedAddress,
          coordinates: result.coordinates,
          distance: result.distance,
          error: result.error
        });
      } catch (error) {
        results.push({
          address: addr,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Google Maps API Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Status */}
        <div className="flex items-center gap-2">
          <span className="font-medium">API Key Status:</span>
          {apiKeyStatus === 'loading' ? (
            <Badge variant="secondary">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading...
            </Badge>
          ) : apiKeyStatus === 'present' ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              Missing
            </Badge>
          )}
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Enter address to test"
              className="flex-1"
            />
            <Button 
              onClick={testAddress}
              disabled={isLoading || apiKeyStatus !== 'present'}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
          
          <Button 
            onClick={testPredefinedAddresses}
            disabled={isLoading || apiKeyStatus !== 'present'}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Multiple Addresses...
              </>
            ) : (
              'Test Multiple Turin Addresses'
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Test Results:</h3>
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{result.address}</div>
                    {result.success ? (
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>📍 {result.formattedAddress}</div>
                        {result.coordinates && (
                          <div>🗺️ {result.coordinates.lat.toFixed(6)}, {result.coordinates.lng.toFixed(6)}</div>
                        )}
                        {result.distance !== undefined && (
                          <div>📏 {result.distance.toFixed(2)} km from restaurant</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">❌ {result.error}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="space-y-1 text-xs">
            <li>• The API key should be automatically loaded from the database</li>
            <li>• Test individual addresses or use the bulk test for multiple Turin locations</li>
            <li>• Successful tests show formatted addresses, coordinates, and distance calculations</li>
            <li>• If tests fail, check the browser console for detailed error messages</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleMapsApiTest;
