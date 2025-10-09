import React, { useState, useEffect } from 'react';
import { Printer, TestTube, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { printerService } from '@/services/printerService';

const PrinterSettings: React.FC = () => {
  const { toast } = useToast();
  const [printerName, setPrinterName] = useState('POS-80(copy of 2)');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true); // Auto-enabled by default
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setPrinterName(printerService.getPrinterName());
    setAutoPrintEnabled(printerService.isAutoPrintEnabled());
  }, []);

  const handleSave = () => {
    printerService.saveSettings(printerName, autoPrintEnabled);
    toast({
      title: '✅ Impostazioni salvate',
      description: 'Le impostazioni della stampante sono state aggiornate.'
    });
  };

  const handleTestPrint = async () => {
    setTesting(true);
    const success = await printerService.testPrint();
    setTesting(false);

    if (success) {
      toast({
        title: '✅ Test stampante riuscito',
        description: 'La ricevuta di test è stata inviata alla stampante.'
      });
    } else {
      toast({
        title: '❌ Test stampante fallito',
        description: 'Verifica che la stampante sia collegata e accesa.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Impostazioni Stampante
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome Stampante
          </label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="POS-80(copy of 2)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Inserisci il nome esatto della stampante come appare nel sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoPrint"
            checked={autoPrintEnabled}
            onChange={(e) => setAutoPrintEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="autoPrint" className="text-sm font-medium">
            Stampa automatica nuovi ordini
          </label>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Salva Impostazioni
          </Button>
          <Button
            onClick={handleTestPrint}
            variant="outline"
            disabled={testing}
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Stampa in corso...' : 'Test Stampante'}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-semibold text-sm mb-2">📋 Istruzioni:</h4>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            <li>Stampante: Epson TM-T70II (WiFi - 192.168.1.32)</li>
            <li>Nome Windows: POS-80(copy of 2)</li>
            <li>Verifica che la stampante sia accesa e connessa</li>
            <li>Il nome è già configurato correttamente</li>
            <li>Attiva la stampa automatica per gli ordini</li>
            <li>Clicca "Test Stampante" per verificare</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrinterSettings;
