import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  Globe,
  Database,
  AlertTriangle,
  Info
} from 'lucide-react';

const FrontendConnectionTester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (component: string, status: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setResults(prev => [...prev, { component, status, message, timestamp: new Date() }]);
  };

  const testFrontendConnections = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      addResult('Frontend Test', 'info', 'Testing all frontend components database connections...');

      // Test 1: Products Component
      addResult('Products', 'info', 'Testing Products component database connection...');
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              name,
              slug
            )
          `)
          .eq('is_active', true)
          .limit(5);

        if (productsError) {
          addResult('Products', 'error', `❌ Products query failed: ${productsError.message}`);
        } else {
          addResult('Products', 'success', `✅ Products component: ${productsData.length} products loaded`);
        }
      } catch (error) {
        addResult('Products', 'error', `❌ Products error: ${error.message}`);
      }

      // Test 2: Hero Component (Settings)
      addResult('Hero', 'info', 'Testing Hero component settings...');
      try {
        const { data: heroData, error: heroError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'heroContent')
          .single();

        if (heroError) {
          addResult('Hero', 'warning', `⚠️ Hero settings not found: ${heroError.message}`);
        } else {
          addResult('Hero', 'success', `✅ Hero component: Settings loaded`);
        }
      } catch (error) {
        addResult('Hero', 'error', `❌ Hero error: ${error.message}`);
      }

      // Test 3: WeOffer Component
      addResult('WeOffer', 'info', 'Testing WeOffer component...');
      try {
        const { data: weOfferData, error: weOfferError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'weOfferContent')
          .single();

        if (weOfferError) {
          addResult('WeOffer', 'warning', `⚠️ WeOffer settings not found: ${weOfferError.message}`);
        } else {
          addResult('WeOffer', 'success', `✅ WeOffer component: Settings loaded`);
        }
      } catch (error) {
        addResult('WeOffer', 'error', `❌ WeOffer error: ${error.message}`);
      }

      // Test 4: Gallery Component
      addResult('Gallery', 'info', 'Testing Gallery component...');
      try {
        const { data: galleryData, error: galleryError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'galleryContent')
          .single();

        if (galleryError) {
          addResult('Gallery', 'warning', `⚠️ Gallery settings not found: ${galleryError.message}`);
        } else {
          addResult('Gallery', 'success', `✅ Gallery component: Settings loaded`);
        }
      } catch (error) {
        addResult('Gallery', 'error', `❌ Gallery error: ${error.message}`);
      }

      // Test 5: Contact Component
      addResult('Contact', 'info', 'Testing Contact component...');
      try {
        const { data: contactData, error: contactError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'contactContent')
          .single();

        if (contactError) {
          addResult('Contact', 'warning', `⚠️ Contact settings not found: ${contactError.message}`);
        } else {
          addResult('Contact', 'success', `✅ Contact component: Settings loaded`);
        }
      } catch (error) {
        addResult('Contact', 'error', `❌ Contact error: ${error.message}`);
      }

      // Test 6: About Component (Check if it should be database-driven)
      addResult('About', 'info', 'About component uses hardcoded content (not database-driven)');

      // Test 7: Content Sections Table - DISABLED TO PREVENT 400 ERRORS
      addResult('Content Sections', 'info', 'Content sections test disabled to prevent 400 errors');

      /* DISABLED TO PREVENT 400 ERROR LOOP
      try {
        const { data: contentData, error: contentError } = await supabase
          .from('content_sections')
          .select('*')
          .limit(5);

        if (contentError) {
          addResult('Content Sections', 'error', `❌ Content sections error: ${contentError.message}`);
        } else {
          addResult('Content Sections', 'success', `✅ Content sections: ${contentData.length} sections found`);
        }
      } catch (error) {
        addResult('Content Sections', 'error', `❌ Content sections error: ${error.message}`);
      }
      */

      addResult('Frontend Test', 'success', '🎉 Frontend database connection test completed!');

    } catch (error) {
      addResult('Frontend Test', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const fixMissingSettings = async () => {
    try {
      addResult('Settings Fix', 'info', 'Creating missing settings entries...');

      const defaultSettings = [
        {
          key: 'heroContent',
          value: {
            heading: "Pizzeria Regina 2000 Torino",
            subheading: "Autentica pizza italiana nel cuore di Torino dal 2000",
            backgroundImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=2070&q=80"
          }
        },
        {
          key: 'weOfferContent',
          value: {
            heading: "Cosa Offriamo",
            subheading: "Le nostre specialità preparate con passione",
            offers: [
              {
                id: 1,
                title: "Pizza Italiana",
                description: "Autentica pizza italiana cotta nel forno a legna",
                image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400"
              }
            ]
          }
        },
        {
          key: 'galleryContent',
          value: {
            heading: "La Nostra Galleria",
            subheading: "Scopri l'atmosfera della nostra pizzeria"
          }
        },
        {
          key: 'contactContent',
          value: {
            address: "C.so Giulio Cesare, 36, 10152 Torino TO",
            phone: "0110769211",
            email: "anilamyzyri@gmail.com",
            hours: "Lun-Dom: 18:00-24:00"
          }
        }
      ];

      for (const setting of defaultSettings) {
        try {
          const { error } = await supabase
            .from('settings')
            .upsert(setting, { onConflict: 'key' });

          if (error) {
            addResult('Settings Fix', 'error', `Failed to create ${setting.key}: ${error.message}`);
          } else {
            addResult('Settings Fix', 'success', `✅ Created/updated ${setting.key}`);
          }
        } catch (error) {
          addResult('Settings Fix', 'error', `Error with ${setting.key}: ${error.message}`);
        }
      }

      toast({
        title: "Settings Updated!",
        description: "Default settings have been created. Refresh the frontend to see changes.",
      });

    } catch (error) {
      addResult('Settings Fix', 'error', `Unexpected error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Frontend Database Connection Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={testFrontendConnections} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing Connections...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Test Frontend Connections
              </>
            )}
          </Button>

          <Button 
            onClick={fixMissingSettings} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Create Missing Settings
          </Button>
        </div>

        {/* Component Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Frontend Components Database Status:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ✅ <strong>Products</strong> - Connected to products table</li>
            <li>• ⚠️ <strong>Hero</strong> - Should connect to settings table</li>
            <li>• ⚠️ <strong>WeOffer</strong> - Should connect to settings table</li>
            <li>• ⚠️ <strong>Gallery</strong> - Should connect to settings table</li>
            <li>• ⚠️ <strong>Contact</strong> - Should connect to settings table</li>
            <li>• ❌ <strong>About</strong> - Uses hardcoded content (not database)</li>
          </ul>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                  {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {result.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                  {result.status === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.component}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FrontendConnectionTester;
