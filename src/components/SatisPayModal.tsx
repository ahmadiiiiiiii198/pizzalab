import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, QrCode } from 'lucide-react';
import { useSatisPaySettings } from '@/hooks/useSatisPaySettings';

interface SatisPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal?: number;
  onPaymentConfirmed?: () => void;
}

const SatisPayModal: React.FC<SatisPayModalProps> = ({ isOpen, onClose, orderTotal, onPaymentConfirmed }) => {
  const { settings, isLoading } = useSatisPaySettings();

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!settings || !settings.is_enabled || !settings.qr_code_image_url) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Pagamento Non Disponibile
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">
              Il pagamento SatisPay non è attualmente disponibile.
            </p>
            <Button onClick={onClose} className="mt-4">
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <QrCode className="h-6 w-6 text-yellow-600" />
              {settings.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Total */}
          {orderTotal && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Totale da pagare:</span>
                <span className="text-xl font-bold text-yellow-700">
                  €{orderTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">{settings.description}</p>
          </div>

          {/* QR Code Image */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <img
                src={settings.qr_code_image_url}
                alt="SatisPay QR Code"
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  console.error('Error loading QR code image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Come pagare:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Apri l'app SatisPay sul tuo smartphone</li>
              <li>2. Tocca "Scansiona" o l'icona della fotocamera</li>
              <li>3. Inquadra il QR code sopra</li>
              <li>4. Conferma il pagamento nell'app</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (onPaymentConfirmed) {
                  onPaymentConfirmed();
                }
                onClose();
              }}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              Ho Pagato - Conferma Ordine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SatisPayModal;
