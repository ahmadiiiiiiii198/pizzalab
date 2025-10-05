import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseCheckResult {
  hasSettings: boolean;
  hasZones: boolean;
  hasApiKey: boolean;
  apiKeyLength: number;
  settingsData: any;
  zonesData: any;
  lastUpdated: string;
}

const MCPDatabaseChecker = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DatabaseCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log('🔍 MCP Database Check: Starting...');
      
      // Check shipping zone settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'shippingZoneSettings')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw new Error(`Settings error: ${settingsError.message}`);
      }

      // Check delivery zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'deliveryZones')
        .single();

      if (zonesError && zonesError.code !== 'PGRST116') {
        throw new Error(`Zones error: ${zonesError.message}`);
      }

      const result: DatabaseCheckResult = {
        hasSettings: !!settingsData,
        hasZones: !!zonesData,
        hasApiKey: !!(settingsData?.value?.googleMapsApiKey),
        apiKeyLength: settingsData?.value?.googleMapsApiKey?.length || 0,
        settingsData,
        zonesData,
        lastUpdated: new Date().toISOString()
      };

      setResult(result);
      
      console.log('✅ MCP Database Check: Complete');
      console.log('📊 Settings found:', result.hasSettings);
      console.log('📍 Zones found:', result.hasZones);
      console.log('🔑 API Key found:', result.hasApiKey);
      
      if (result.hasApiKey) {
        console.log('🔑 API Key details:', {
          length: result.apiKeyLength,
          preview: settingsData.value.googleMapsApiKey.substring(0, 20) + '...'
        });
      }

    } catch (error: any) {
      console.error('❌ MCP Database Check failed:', error);
      setError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const formatApiKey = (apiKey: string) => {
    if (!apiKey) return 'Not set';
    return `${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 5)}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          MCP Database Checker
        </CardTitle>
        <p className="text-sm text-gray-600">
          Check the current state of shipping zone settings in the database using MCP
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkDatabase} 
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking Database...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Check Database
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-red-800">Database Check Failed</h4>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Database Status Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.hasSettings)}
                  <span className="text-sm">Shipping Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.hasZones)}
                  <span className="text-sm">Delivery Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.hasApiKey)}
                  <span className="text-sm">Google Maps API</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Last checked: {new Date(result.lastUpdated).toLocaleString()}
              </p>
            </div>

            {/* Shipping Settings Details */}
            {result.hasSettings && result.settingsData ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">Shipping Zone Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Enabled:</strong> {result.settingsData.value.enabled ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Max Distance:</strong> {result.settingsData.value.maxDeliveryDistance}km
                  </div>
                  <div>
                    <strong>Restaurant:</strong> {result.settingsData.value.restaurantAddress}
                  </div>
                  <div>
                    <strong>Delivery Fee:</strong> €{result.settingsData.value.deliveryFee}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Google Maps API Key:</strong> 
                    <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {result.hasApiKey ? formatApiKey(result.settingsData.value.googleMapsApiKey) : 'Not set'}
                    </span>
                    {result.hasApiKey && (
                      <Badge variant="default" className="ml-2">
                        {result.apiKeyLength} chars
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Updated: {new Date(result.settingsData.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">No Shipping Settings Found</h4>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Shipping zone settings are not configured in the database.
                </p>
              </div>
            )}

            {/* Delivery Zones Details */}
            {result.hasZones && result.zonesData ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">
                  Delivery Zones ({result.zonesData.value.length} zones)
                </h4>
                <div className="space-y-2">
                  {result.zonesData.value.map((zone: any, index: number) => (
                    <div key={zone.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>{zone.name}</strong>
                          <span className="text-sm text-gray-600 ml-2">
                            {zone.maxDistance}km • €{zone.deliveryFee} • {zone.estimatedTime}
                          </span>
                        </div>
                        <Badge variant={zone.isActive ? "default" : "secondary"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Updated: {new Date(result.zonesData.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">No Delivery Zones Found</h4>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Delivery zones are not configured in the database.
                </p>
              </div>
            )}

            {/* API Key Analysis */}
            {result.hasApiKey && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">API Key Analysis</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Length:</strong> {result.apiKeyLength} characters
                  </div>
                  <div>
                    <strong>Expected Length:</strong> ~39 characters for Google Maps API keys
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    {result.apiKeyLength < 35 ? (
                      <Badge variant="destructive" className="ml-2">Too Short</Badge>
                    ) : result.apiKeyLength > 45 ? (
                      <Badge variant="destructive" className="ml-2">Too Long</Badge>
                    ) : (
                      <Badge variant="default" className="ml-2">Length OK</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Recommendations</h4>
              <div className="text-sm space-y-2">
                {!result.hasSettings && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Configure shipping zone settings in the admin panel</span>
                  </div>
                )}
                {!result.hasApiKey && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Add Google Maps API key: AIzaSyBkHCjFa0GKD7lJThAyFnSaeCXFDsBtJhs</span>
                  </div>
                )}
                {!result.hasZones && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Configure delivery zones for address validation</span>
                  </div>
                )}
                {result.hasSettings && result.hasApiKey && result.hasZones && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>All shipping zone components are properly configured!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCPDatabaseChecker;
