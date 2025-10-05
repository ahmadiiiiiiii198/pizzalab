import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SatisPayMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const sqlScript = `-- SatisPay QR Settings Table
CREATE TABLE IF NOT EXISTS satispay_qr_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_image_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  title TEXT DEFAULT 'Paga con SatisPay',
  description TEXT DEFAULT 'Scansiona il QR code per pagare con SatisPay',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO satispay_qr_settings (title, description, is_enabled)
VALUES (
  'Paga con SatisPay',
  'Scansiona il QR code per pagare con SatisPay',
  true
)
ON CONFLICT DO NOTHING;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      toast({
        title: 'Copied!',
        description: 'SQL script copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const testTable = async () => {
    setIsRunning(true);
    setMigrationStatus('idle');
    setErrorMessage('');

    try {
      // Check if table exists and works
      const { data, error } = await supabase
        .from('satispay_qr_settings')
        .select('*')
        .limit(1);

      if (error) {
        throw new Error(`Table test failed: ${error.message}`);
      }

      setMigrationStatus('success');
      toast({
        title: 'Table Test Successful',
        description: 'SatisPay QR settings table is working correctly',
      });

    } catch (error) {
      console.error('Table test error:', error);
      setMigrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Table Test Failed',
        description: 'Please run the SQL script in your Supabase dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          SatisPay Database Migration
        </CardTitle>
        <CardDescription>
          Run this migration to create the SatisPay QR settings table in your database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">What this migration does:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Creates the <code>satispay_qr_settings</code> table</li>
            <li>• Adds columns for QR image URL, title, description, and enable/disable toggle</li>
            <li>• Inserts default settings</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Manual Setup Required:</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Due to Supabase security restrictions, you need to run this SQL script manually in your Supabase dashboard.
          </p>
          <ol className="text-sm text-yellow-700 space-y-1 mb-3">
            <li>1. Copy the SQL script below</li>
            <li>2. Go to your Supabase dashboard → SQL Editor</li>
            <li>3. Paste and run the script</li>
            <li>4. Come back and test the table</li>
          </ol>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">SQL Script:</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            <code>{sqlScript}</code>
          </pre>
        </div>

        {migrationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Migration Completed Successfully</h4>
              <p className="text-sm text-green-700">
                The SatisPay QR settings table is now ready to use.
              </p>
            </div>
          </div>
        )}

        {migrationStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Migration Failed</h4>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <Button
          onClick={testTable}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing Table...
            </>
          ) : migrationStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Table Working ✓
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Test Table
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SatisPayMigration;
