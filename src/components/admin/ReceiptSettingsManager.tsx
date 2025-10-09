import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useReceiptSettings } from '@/hooks/use-settings';
import { Save, Receipt, MessageSquare } from 'lucide-react';

export default function ReceiptSettingsManager() {
  const { toast } = useToast();
  const [receiptSettings, updateReceiptSettings] = useReceiptSettings();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for form
  const [formData, setFormData] = useState({
    footerMessage: receiptSettings?.footerMessage || "Grazie per aver scelto Ruràl Pizza!",
    showTimestamp: receiptSettings?.showTimestamp ?? true,
    customMessage: receiptSettings?.customMessage || ""
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateReceiptSettings(formData);
      
      if (success) {
        toast({
          title: "✅ Impostazioni Scontrino Salvate",
          description: "Le impostazioni dello scontrino sono state aggiornate con successo.",
        });
      } else {
        toast({
          title: "⚠️ Salvato Localmente",
          description: "Impostazioni salvate localmente. Si sincronizzeranno quando la connessione sarà ripristinata.",
        });
      }
    } catch (error) {
      console.error('❌ Receipt settings save error:', error);
      toast({
        title: "❌ Errore di Salvataggio",
        description: "Non è stato possibile salvare le impostazioni. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    const defaultData = {
      footerMessage: "Grazie per aver scelto Ruràl Pizza!",
      showTimestamp: true,
      customMessage: ""
    };
    setFormData(defaultData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Impostazioni Scontrino
        </CardTitle>
        <CardDescription>
          Personalizza il messaggio e le impostazioni che appaiono negli scontrini stampati
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Footer Message */}
        <div className="space-y-2">
          <Label htmlFor="footerMessage" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messaggio di Ringraziamento
          </Label>
          <Input
            id="footerMessage"
            value={formData.footerMessage}
            onChange={(e) => setFormData(prev => ({ ...prev, footerMessage: e.target.value }))}
            placeholder="Grazie per aver scelto Ruràl Pizza!"
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Messaggio principale che appare alla fine dello scontrino
          </p>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <Label htmlFor="customMessage">
            Messaggio Personalizzato (Opzionale)
          </Label>
          <Textarea
            id="customMessage"
            value={formData.customMessage}
            onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
            placeholder="Aggiungi un messaggio personalizzato, promozioni, orari speciali..."
            rows={3}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Messaggio aggiuntivo per promozioni, orari speciali o altre informazioni
          </p>
        </div>

        {/* Show Timestamp */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showTimestamp">
              Mostra Data e Ora di Stampa
            </Label>
            <p className="text-sm text-muted-foreground">
              Visualizza quando lo scontrino è stato stampato
            </p>
          </div>
          <Switch
            id="showTimestamp"
            checked={formData.showTimestamp}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showTimestamp: checked }))}
          />
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-2">Anteprima Footer Scontrino:</h4>
          <div className="text-sm font-mono bg-white p-3 rounded border">
            <div className="text-center">
              <div className="border-t border-dashed border-gray-400 mb-2"></div>
              <div className="mb-1">{formData.footerMessage}</div>
              {formData.customMessage && (
                <div className="mb-1 text-xs">{formData.customMessage}</div>
              )}
              {formData.showTimestamp && (
                <div className="text-xs text-gray-500">
                  Stampato: {new Date().toLocaleString('it-IT')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            disabled={isSaving}
          >
            Ripristina Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
