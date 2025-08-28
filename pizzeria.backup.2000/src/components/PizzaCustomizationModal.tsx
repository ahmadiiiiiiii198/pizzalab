import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { Product } from '@/types/category';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, calculateTotal, addPrices, roundToTwoDecimals } from '@/utils/priceUtils';

interface PizzaExtra {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface SelectedExtra extends PizzaExtra {
  quantity: number;
}

interface ImpastaType {
  id: string;
  name: string;
  price: number;
}

interface PizzaCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pizza: Product | null;
  onAddToCart: (pizza: Product, quantity: number, extras: SelectedExtra[], specialRequests?: string, impastaType?: ImpastaType) => void;
  initialQuantity?: number;
}

const PizzaCustomizationModal: React.FC<PizzaCustomizationModalProps> = ({
  isOpen,
  onClose,
  pizza,
  onAddToCart,
  initialQuantity = 1
}) => {
  const [availableExtras, setAvailableExtras] = useState<PizzaExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'impasta' | 'extras' | 'bevande'>('impasta');
  const [selectedImpasta, setSelectedImpasta] = useState<ImpastaType | null>(null);
  const [availableBevande, setAvailableBevande] = useState<PizzaExtra[]>([]);
  const [selectedBevande, setSelectedBevande] = useState<SelectedExtra[]>([]);
  const { toast } = useToast();

  // Available impasta types
  const impastaTypes: ImpastaType[] = [
    { id: 'normale', name: 'Impasta Normale', price: 0 },
    { id: 'integrata', name: 'Impasta Integrata', price: 0 },
    { id: 'cereali', name: 'Impasta ai Cereali', price: 0 }
  ];

  // Load available extras when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🍕 Pizza customization modal opened for:', pizza?.name);
      console.log('🍕 Current step:', currentStep);
      loadExtras();
      loadBevande();
      // Reset state when modal opens
      setSelectedExtras([]);
      setSelectedBevande([]);
      setQuantity(initialQuantity);
      setSpecialRequests('');
      setCurrentStep('impasta');
      setSelectedImpasta(impastaTypes[0]); // Default to first option
    }
  }, [isOpen, initialQuantity]);

  const loadExtras = async () => {
    try {
      setIsLoading(true);

      // Use predefined extras list instead of loading from database
      const predefinedExtras: PizzaExtra[] = [
        { id: 'stracchino', name: 'Stracchino', price: 2.00, description: '' },
        { id: 'cipolle', name: 'Cipolle', price: 1.00, description: '' },
        { id: 'spianata-calabra', name: 'Spianata calabra piccante', price: 2.00, description: '' },
        { id: 'patatine-fritte', name: 'Patatine fritte', price: 2.00, description: '' },
        { id: 'parmigiano', name: 'Parmigiano grattugiato', price: 1.50, description: '' },
        { id: 'fontina', name: 'Fontina', price: 2.00, description: '' },
        { id: 'pepperoni', name: 'Pepperoni', price: 1.00, description: '' },
        { id: 'zucchine', name: 'Zucchine', price: 1.00, description: '' },
        { id: 'olive', name: 'Olive', price: 1.50, description: '' },
        { id: 'pancetta', name: 'Pancetta', price: 2.00, description: '' },
        { id: 'acciughe', name: 'Acciughe', price: 1.50, description: '' },
        { id: 'mozzarella', name: 'Mozzarella', price: 1.50, description: '' },
        { id: 'crema-pistacchio', name: 'Crema Pistacchio', price: 3.00, description: '' },
        { id: 'granella-pistacchio', name: 'Granella Di Pistacchio', price: 2.00, description: '' },
        { id: 'noci', name: 'Noci', price: 2.00, description: '' },
        { id: 'granella-nocciole', name: 'Granella di nocciole', price: 2.00, description: '' },
        { id: 'speck', name: 'Speck', price: 2.00, description: '' },
        { id: 'lardo', name: 'Lardo', price: 2.00, description: '' },
        { id: 'gorgonzola', name: 'Gorgonzola', price: 2.00, description: '' },
        { id: 'salamino-piccante', name: 'Salamino Piccante', price: 1.50, description: '' },
        { id: 'pasta-tartufo', name: 'Pasta di Tartufo', price: 2.00, description: '' },
        { id: 'mozzarella-bufala', name: 'Mozzarella di Bufala', price: 2.00, description: '' },
        { id: 'burrata', name: 'Burrata', price: 3.00, description: '' },
        { id: 'prosciutto-crudo', name: 'Prosciutto Crudo', price: 2.00, description: '' },
        { id: 'funghi-porcini', name: 'Funghi Porcini', price: 2.50, description: '' },
        { id: 'scaglie-grana', name: 'Scaglie di Grana', price: 2.00, description: '' },
        { id: 'salsiccia-bra', name: 'Salsiccia di Bra', price: 2.50, description: '' },
        { id: 'mortadella', name: 'Mortadella', price: 2.00, description: '' },
        { id: 'olive-taggiasche', name: 'Olive Taggiasche', price: 2.00, description: '' },
        { id: 'tonno', name: 'Tonno', price: 1.50, description: '' }
      ];

      setAvailableExtras(predefinedExtras);
    } catch (error) {
      console.error('Error loading extras:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli extra disponibili.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBevande = async () => {
    try {
      // Get category ID for 'bevande'
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, slug')
        .eq('slug', 'bevande')
        .single();

      if (categoriesError) throw categoriesError;

      // Then get products with that category_id
      const { data: bevandeData, error } = await supabase
        .from('products')
        .select('id, name, price, description')
        .eq('is_active', true)
        .eq('category_id', categoriesData.id)
        .order('name');

      if (error) throw error;

      const bevande: PizzaExtra[] = bevandeData.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || ''
      }));

      setAvailableBevande(bevande);
    } catch (error) {
      console.error('Error loading bevande:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le bevande disponibili.',
        variant: 'destructive'
      });
    }
  };

  const addExtra = (extra: PizzaExtra) => {
    setSelectedExtras(prev => {
      const existing = prev.find(item => item.id === extra.id);
      if (existing) {
        return prev.map(item =>
          item.id === extra.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...extra, quantity: 1 }];
    });
  };

  const removeExtra = (extraId: string) => {
    setSelectedExtras(prev => prev.filter(item => item.id !== extraId));
  };

  const updateExtraQuantity = (extraId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeExtra(extraId);
      return;
    }
    setSelectedExtras(prev =>
      prev.map(item =>
        item.id === extraId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotalPrice = () => {
    if (!pizza) return 0;

    const pizzaPrice = calculateTotal(pizza.price, quantity);
    const impastaPrice = selectedImpasta ? calculateTotal(selectedImpasta.price, quantity) : 0;
    const extrasPrice = selectedExtras.reduce((total, extra) =>
      addPrices(total, calculateTotal(extra.price * extra.quantity, quantity)), 0
    );
    const bevandePrice = selectedBevande.reduce((total, bevanda) =>
      addPrices(total, calculateTotal(bevanda.price * bevanda.quantity, quantity)), 0
    );

    return addPrices(addPrices(addPrices(pizzaPrice, impastaPrice), extrasPrice), bevandePrice);
  };

  const handleAddToCart = () => {
    if (!pizza || !selectedImpasta) return;

    // Combine extras and bevande into one array for the cart
    const allExtras = [...selectedExtras, ...selectedBevande];

    onAddToCart(pizza, quantity, allExtras, specialRequests, selectedImpasta);
    onClose();

    const totalItems = selectedExtras.length + selectedBevande.length;
    toast({
      title: 'Pizza aggiunta al carrello! 🍕',
      description: `${pizza.name} con ${selectedImpasta.name}, ${selectedExtras.length} extra e ${selectedBevande.length} bevande è stata aggiunta al carrello.`,
    });
  };

  const addBevanda = (bevanda: PizzaExtra) => {
    setSelectedBevande(prev => {
      const existing = prev.find(item => item.id === bevanda.id);
      if (existing) {
        return prev.map(item =>
          item.id === bevanda.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...bevanda, quantity: 1 }];
    });
  };

  const removeBevanda = (bevandaId: string) => {
    setSelectedBevande(prev => prev.filter(item => item.id !== bevandaId));
  };

  const updateBevandaQuantity = (bevandaId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeBevanda(bevandaId);
      return;
    }
    setSelectedBevande(prev =>
      prev.map(item =>
        item.id === bevandaId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleNextStep = () => {
    if (currentStep === 'impasta' && selectedImpasta) {
      setCurrentStep('extras');
    } else if (currentStep === 'extras') {
      setCurrentStep('bevande');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'extras') {
      setCurrentStep('impasta');
    } else if (currentStep === 'bevande') {
      setCurrentStep('extras');
    }
  };

  if (!pizza) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🍕 Personalizza la tua {pizza.name}
            <span className="text-sm font-normal text-gray-500">
              - Passo {currentStep === 'impasta' ? '1' : currentStep === 'extras' ? '2' : '3'} di 3
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pizza Info */}
          <div className="flex gap-4">
            <img
              src={pizza.image_url}
              alt={pizza.name}
              className="w-24 h-24 object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{pizza.name}</h3>
              <p className="text-gray-600 text-sm">{pizza.description}</p>
              <p className="text-lg font-bold text-pizza-orange mt-2">{formatPrice(pizza.price)}</p>
            </div>
          </div>

          <Separator />

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantità:</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 p-0"
              >
                <Minus size={14} />
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Step 1: Impasta Selection */}
          {currentStep === 'impasta' && (
            <div>
              <h4 className="font-semibold mb-3">Scegli il tipo di Impasta:</h4>
              <div className="space-y-3">
                {impastaTypes.map((impasta) => (
                  <div
                    key={impasta.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedImpasta?.id === impasta.id
                        ? 'border-pizza-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImpasta(impasta)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedImpasta?.id === impasta.id
                            ? 'border-pizza-orange bg-pizza-orange'
                            : 'border-gray-300'
                        }`} />
                        <span className="font-medium">{impasta.name}</span>
                      </div>
                      {impasta.price > 0 && (
                        <span className="text-pizza-orange font-medium">
                          +{formatPrice(impasta.price)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Extras Selection */}
          {currentStep === 'extras' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Impasta selezionata:</h4>
                  <Button variant="outline" size="sm" onClick={handleBackStep}>
                    Cambia Impasta
                  </Button>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{selectedImpasta?.name}</span>
                </div>
              </div>

              <Separator />

              {isLoading ? (
                <div className="text-center py-4">Caricamento extra...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableExtras.map(extra => {
                    const selectedExtra = selectedExtras.find(item => item.id === extra.id);
                    return (
                      <div
                        key={extra.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{extra.name}</h5>
                            <p className="text-sm font-semibold text-green-600">+{formatPrice(extra.price)}</p>
                          </div>
                          {!selectedExtra ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addExtra(extra)}
                              className="ml-2"
                            >
                              <Plus size={14} />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateExtraQuantity(extra.id, selectedExtra.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="text-xs w-6 text-center">{selectedExtra.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateExtraQuantity(extra.id, selectedExtra.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus size={12} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeExtra(extra.id)}
                                className="h-6 w-6 p-0 ml-1 text-red-500 hover:text-red-700"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Bevande Selection */}
          {currentStep === 'bevande' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Impasta e Extra selezionati:</h4>
                  <Button variant="outline" size="sm" onClick={handleBackStep}>
                    Cambia Extra
                  </Button>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg space-y-1">
                  <span className="text-sm font-medium block">Impasta: {selectedImpasta?.name}</span>
                  {selectedExtras.length > 0 && (
                    <span className="text-sm block">Extra: {selectedExtras.map(e => e.name).join(', ')}</span>
                  )}
                </div>
              </div>

              <Separator />

              <h4 className="font-semibold mb-3">Scegli Bevande:</h4>
              {isLoading ? (
                <div className="text-center py-4">Caricamento bevande...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableBevande.map(bevanda => {
                    const selectedBevanda = selectedBevande.find(item => item.id === bevanda.id);
                    return (
                      <div
                        key={bevanda.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{bevanda.name}</h5>
                            <p className="text-sm font-semibold text-blue-600">+{formatPrice(bevanda.price)}</p>
                          </div>
                          {!selectedBevanda ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addBevanda(bevanda)}
                              className="ml-2"
                            >
                              <Plus size={14} />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBevandaQuantity(bevanda.id, selectedBevanda.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="text-xs w-6 text-center">{selectedBevanda.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBevandaQuantity(bevanda.id, selectedBevanda.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus size={12} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeBevanda(bevanda.id)}
                                className="h-6 w-6 p-0 ml-1 text-red-500 hover:text-red-700"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Selected Extras Summary - Only show in extras step */}
          {currentStep === 'extras' && selectedExtras.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Extra Selezionati:</h4>
                <div className="space-y-2">
                  {selectedExtras.map(extra => (
                    <div key={extra.id} className="flex justify-between items-center text-sm">
                      <span>{extra.name} x{extra.quantity}</span>
                      <span className="font-medium">+{formatPrice(extra.price * extra.quantity * quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Selected Bevande Summary - Only show in bevande step */}
          {currentStep === 'bevande' && selectedBevande.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Bevande Selezionate:</h4>
                <div className="space-y-2">
                  {selectedBevande.map(bevanda => (
                    <div key={bevanda.id} className="flex justify-between items-center text-sm">
                      <span>{bevanda.name} x{bevanda.quantity}</span>
                      <span className="font-medium">+{formatPrice(bevanda.price * bevanda.quantity * quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Special Requests - Only show in bevande step */}
          {currentStep === 'bevande' && (
            <>
              <Separator />
              <div>
                <label className="block font-medium mb-2">Richieste Speciali:</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Es: senza cipolla, cottura ben cotta, ecc..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Total and Buttons */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Totale:</span>
              <span className="text-pizza-orange">{formatPrice(calculateTotalPrice())}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Annulla
              </Button>

              {currentStep === 'impasta' ? (
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-pizza-orange hover:bg-pizza-red"
                  disabled={!selectedImpasta}
                >
                  Avanti
                </Button>
              ) : currentStep === 'extras' ? (
                <>
                  <Button variant="outline" onClick={handleBackStep} className="flex-1">
                    Indietro
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 bg-pizza-orange hover:bg-pizza-red"
                  >
                    Avanti
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleBackStep} className="flex-1">
                    Indietro
                  </Button>
                  <Button onClick={handleAddToCart} className="flex-1 bg-pizza-orange hover:bg-pizza-red">
                    <ShoppingCart size={16} className="mr-2" />
                    Aggiungi al Carrello
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PizzaCustomizationModal;
