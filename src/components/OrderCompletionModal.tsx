import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, X } from 'lucide-react';
import { generateReceiptHTML, downloadReceipt, ReceiptData } from '@/utils/receiptGenerator';
import { useReceiptSettings, useLogoSettings, useNavbarLogoSettings } from '@/hooks/use-settings';

interface OrderCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

const OrderCompletionModal: React.FC<OrderCompletionModalProps> = ({
  isOpen,
  onClose,
  receiptData
}) => {
  const [receiptHTML, setReceiptHTML] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  
  const [receiptSettings] = useReceiptSettings();
  const [logoSettings] = useLogoSettings();
  const [navbarLogoSettings] = useNavbarLogoSettings();

  // Generate receipt HTML when modal opens
  useEffect(() => {
    if (isOpen && receiptData && !receiptHTML) {
      generateReceipt();
    }
  }, [isOpen, receiptData]);

  // Auto-download receipt after 3 seconds
  useEffect(() => {
    if (receiptHTML && !hasDownloaded) {
      const timer = setTimeout(() => {
        handleDownload();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [receiptHTML, hasDownloaded]);

  const generateReceipt = async () => {
    if (!receiptData) return;

    // Debug: Log receipt data structure
    console.log('🧾 OrderCompletionModal - Receipt Data:', receiptData);
    console.log('🧾 OrderCompletionModal - Cart Items:', receiptData.cartItems);

    setIsGenerating(true);
    try {
      const html = await generateReceiptHTML({
        ...receiptData,
        receiptSettings,
        logoSettings,
        navbarLogoSettings
      });
      setReceiptHTML(html);
    } catch (error) {
      console.error('Failed to generate receipt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (receiptHTML && receiptData) {
      downloadReceipt(receiptHTML, receiptData.order.order_number);
      setHasDownloaded(true);
    }
  };

  const handleClose = () => {
    setReceiptHTML('');
    setHasDownloaded(false);
    onClose();
  };

  if (!isOpen || !receiptData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Grazie per il tuo ordine!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thank You Message */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="space-y-3">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto animate-pulse" />
                <h2 className="text-2xl font-bold text-green-800">
                  Ordine Confermato! 🎉
                </h2>
                <p className="text-green-700 text-lg">
                  Il tuo ordine <strong>#{receiptData.order.order_number}</strong> è stato ricevuto con successo.
                </p>
                <p className="text-green-600">
                  A PRESTO!
                </p>
                {!hasDownloaded && (
                  <p className="text-sm text-green-600 animate-pulse">
                    📄 La ricevuta verrà scaricata automaticamente tra pochi secondi...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receipt Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Anteprima Ricevuta</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={!receiptHTML}
                >
                  <Download className="h-4 w-4" />
                  {hasDownloaded ? 'Scarica di nuovo' : 'Scarica Ricevuta'}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Chiudi
                </Button>
              </div>
            </div>

            {/* Receipt Preview Container */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-0">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600">Generazione ricevuta...</p>
                    </div>
                  </div>
                ) : receiptHTML ? (
                  <div className="h-96 overflow-y-auto border rounded-lg">
                    <iframe
                      srcDoc={receiptHTML}
                      className="w-full h-full border-0"
                      title="Anteprima Ricevuta"
                      style={{ minHeight: '600px' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-gray-500">Errore nella generazione della ricevuta</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Cliente</p>
                  <p>{receiptData.order.customer_name}</p>
                  <p className="text-gray-600">{receiptData.order.customer_email}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Pagamento</p>
                  <p>
                    {receiptData.order.payment_method === 'cash_on_delivery' ? 'Contanti alla consegna' :
                     receiptData.order.payment_method === 'pos_on_delivery' ? 'POS alla consegna' :
                     receiptData.order.payment_method === 'satispay' ? 'SatisPay' :
                     receiptData.order.payment_method}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Totale</p>
                  <p className="text-xl font-bold text-green-600">
                    €{receiptData.order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderCompletionModal;
