import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Pizza, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const OrderLookup: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = () => {
    setError(null);

    if (!orderNumber.trim()) {
      setError('Inserisci il numero ordine');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Inserisci la tua email');
      return;
    }

    if (!customerEmail.includes('@')) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    // Navigate to order tracking page with parameters
    navigate(`/track-order?order=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(customerEmail.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Status examples for display
  const statusExamples = [
    { 
      icon: Clock, 
      label: 'In attesa', 
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Ordine ricevuto'
    },
    { 
      icon: CheckCircle, 
      label: 'Confermato', 
      color: 'bg-blue-100 text-blue-800',
      description: 'Ordine confermato'
    },
    { 
      icon: Package, 
      label: 'In preparazione', 
      color: 'bg-orange-100 text-orange-800',
      description: 'In cucina'
    },
    { 
      icon: CheckCircle, 
      label: 'Pronto', 
      color: 'bg-green-100 text-green-800',
      description: 'Pronto per consegna'
    },
    { 
      icon: Truck, 
      label: 'Consegnato', 
      color: 'bg-emerald-100 text-emerald-800',
      description: 'Ordine completato'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-pizza-orange p-4 rounded-full shadow-lg">
                <Pizza className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Traccia il tuo Ordine
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Segui lo stato del tuo ordine in tempo reale. Inserisci i tuoi dati per vedere 
              quando la tua pizza sarà pronta!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Search Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-pizza-orange" />
                  Cerca il tuo Ordine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero Ordine *
                    </label>
                    <Input
                      placeholder="es. ORD-2024-001"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Trovi il numero ordine nella email di conferma
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="la-tua-email@esempio.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      L'email utilizzata per l'ordine
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button 
                  onClick={handleSearch}
                  className="w-full bg-pizza-orange hover:bg-pizza-red text-white font-semibold py-3 text-lg"
                  size="lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Traccia Ordine
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Non hai ancora ordinato?{' '}
                    <button 
                      onClick={() => navigate('/#products')}
                      className="text-pizza-orange hover:text-pizza-red font-medium underline"
                    >
                      Ordina ora
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Preview */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">
                  Stati dell'Ordine
                </CardTitle>
                <p className="text-gray-600">
                  Ecco come seguiamo il tuo ordine dal momento della conferma alla consegna
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusExamples.map((status, index) => {
                    const StatusIcon = status.icon;
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="p-2 rounded-full bg-white shadow-sm">
                          <StatusIcon className="h-5 w-5 text-pizza-orange" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${status.color} text-xs`}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {status.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        Aggiornamenti in Tempo Reale
                      </h4>
                      <p className="text-sm text-blue-700">
                        Riceverai notifiche automatiche via email ad ogni cambio di stato. 
                        La pagina si aggiorna automaticamente!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Aggiornamenti Real-time
              </h3>
              <p className="text-sm text-gray-600">
                Segui il progresso del tuo ordine in tempo reale senza dover ricaricare la pagina
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Dettagli Completi
              </h3>
              <p className="text-sm text-gray-600">
                Visualizza tutti i dettagli del tuo ordine, ingredienti e richieste speciali
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Tempi di Consegna
              </h3>
              <p className="text-sm text-gray-600">
                Stime accurate sui tempi di preparazione e consegna del tuo ordine
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderLookup;
