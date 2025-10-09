import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { fixReservationRLS } from '@/utils/fix-reservation-rls';

const DatabaseFixPanel = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [needsFix, setNeedsFix] = useState<boolean | null>(null);

  const sqlFix = `-- Fix RLS policies for reservation system
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;

CREATE POLICY "Public can view reservation history" ON reservation_status_history 
  FOR SELECT USING (true);

CREATE POLICY "System can insert reservation history" ON reservation_status_history 
  FOR INSERT WITH CHECK (true);

GRANT INSERT ON reservation_status_history TO anon, authenticated;
GRANT UPDATE ON reservations TO anon, authenticated;

-- Verify the fix
SELECT 'RLS policies updated successfully' as status;`;

  const checkRLSStatus = async () => {
    setIsChecking(true);
    try {
      const isFixed = await fixReservationRLS();
      setNeedsFix(!isFixed);
      
      if (isFixed) {
        toast.success('✅ Database RLS policies are working correctly!');
      } else {
        toast.error('❌ RLS policies need to be fixed manually');
      }
    } catch (error) {
      console.error('Error checking RLS:', error);
      toast.error('Error checking database status');
      setNeedsFix(true);
    } finally {
      setIsChecking(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(sqlFix);
    toast.success('SQL copied to clipboard!');
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl border-b border-red-200">
        <CardTitle className="flex items-center text-red-800">
          <div className="bg-red-500 p-2 rounded-lg mr-3">
            <Database className="h-6 w-6 text-white" />
          </div>
          Database Fix Panel
        </CardTitle>
        <CardDescription className="text-red-600">
          Fix RLS policy issues for reservation system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Status Check */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Reservation System Status</h3>
            <Button
              onClick={checkRLSStatus}
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? 'Checking...' : 'Check Status'}
            </Button>
          </div>
          
          {needsFix === false && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">Database policies are working correctly</span>
            </div>
          )}
          
          {needsFix === true && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">RLS policies need to be fixed</span>
            </div>
          )}
        </div>

        {/* Fix Instructions */}
        {needsFix === true && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Fix Required</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-4">
                To fix the reservation system RLS policies:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Go to your <strong>Supabase Dashboard</strong></li>
                <li>Navigate to <strong>SQL Editor</strong></li>
                <li>Copy the SQL below and paste it in the editor</li>
                <li>Click <strong>Run</strong> to execute the fix</li>
                <li>Come back here and click <strong>Check Status</strong> again</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">SQL Fix Script:</label>
                <Button
                  onClick={copySQL}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy SQL
                </Button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{sqlFix}
              </pre>
            </div>
          </div>
        )}

        {/* Common Issues */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Common Issues This Fixes</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>401 Unauthorized errors when updating reservations</li>
            <li>"new row violates row-level security policy" errors</li>
            <li>Reservation status updates failing</li>
            <li>History tracking not working</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseFixPanel;
