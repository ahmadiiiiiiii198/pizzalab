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
import { impastaService, ImpastaType as DatabaseImpastaType } from '@/services/impastaService';
import { aggiuntiService, AggiuntiType } from '@/services/aggiuntiService';
import { baseDelPizzeService, BaseDelPizzeType } from '@/services/baseDelPizzeService';
import { useScrollToTop } from '@/hooks/useScrollToTop';

// Type aliases for cart compatibility
type ImpastaType = DatabaseImpastaType;

// Use the database AggiuntiType for PizzaExtra
interface PizzaExtra {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface SelectedExtra extends PizzaExtra {
  quantity: number;
}

interface PizzaCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pizza: Product | null; // Renamed to 'product' would be better, but keeping for compatibility
  onAddToCart: (product: Product, quantity: number, extras: SelectedExtra[], specialRequests?: string, impastaType?: ImpastaType, baseDelPizzeType?: BaseDelPizzeType) => void;
  initialQuantity?: number;
  categorySettings?: {
    impasto_enabled?: boolean;
    aggiunti_enabled?: boolean;
    bevande_enabled?: boolean;
    birre_enabled?: boolean;
    base_del_pizze_enabled?: boolean;
    dolci_enabled?: boolean;
  };
}

const PizzaCustomizationModal: React.FC<PizzaCustomizationModalProps> = ({
  isOpen,
  onClose,
  pizza,
  onAddToCart,
  initialQuantity = 1,
  categorySettings = { impasto_enabled: true, aggiunti_enabled: true, bevande_enabled: true, birre_enabled: true, base_del_pizze_enabled: true, dolci_enabled: true }
}) => {
  const [availableExtras, setAvailableExtras] = useState<PizzaExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'impasta' | 'base_del_pizze' | 'extras' | 'bevande' | 'dolci'>('base_del_pizze');

  // Scroll functionality
  const { scrollToTopOfElement } = useScrollToTop();
  const [selectedImpasta, setSelectedImpasta] = useState<ImpastaType | null>(null);
  const [availableBevande, setAvailableBevande] = useState<PizzaExtra[]>([]);
  const [selectedBevande, setSelectedBevande] = useState<SelectedExtra[]>([]);
  const [availableDolci, setAvailableDolci] = useState<PizzaExtra[]>([]);
  const [selectedDolci, setSelectedDolci] = useState<SelectedExtra[]>([]);
  const [impastaTypes, setImpastaTypes] = useState<ImpastaType[]>([]);
  const [isLoadingImpasta, setIsLoadingImpasta] = useState(false);
  const [isLoadingAggiunti, setIsLoadingAggiunti] = useState(false);
  const [baseDelPizzeTypes, setBaseDelPizzeTypes] = useState<BaseDelPizzeType[]>([]);
  const [selectedBaseDelPizze, setSelectedBaseDelPizze] = useState<BaseDelPizzeType | null>(null);
  const [isLoadingBaseDelPizze, setIsLoadingBaseDelPizze] = useState(false);
  const { toast } = useToast();

  // Load impasta types
  const loadImpastaTypes = async () => {
    try {
      setIsLoadingImpasta(true);
      const types = await impastaService.getActiveImpastaTypes();
      setImpastaTypes(types);

      // Set default selection to first active type
      if (types.length > 0 && !selectedImpasta) {
        setSelectedImpasta(types[0]);
      }
    } catch (error) {
      console.error('Error loading impasta types:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i tipi di impasto",
        variant: "destructive",
      });
    } finally {
      setIsLoadingImpasta(false);
    }
  };

  // Load aggiunti types
  const loadAggiuntiTypes = async () => {
    try {
      setIsLoadingAggiunti(true);
      const types = await aggiuntiService.getActiveAggiuntiTypes();

      // Convert AggiuntiType to PizzaExtra format
      const extras: PizzaExtra[] = types.map(type => ({
        id: type.id,
        name: type.name,
        price: type.price,
        description: type.description || ''
      }));

      setAvailableExtras(extras);
    } catch (error) {
      console.error('Error loading aggiunti types:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli aggiunti",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAggiunti(false);
    }
  };

  // Load base del pizze types
  const loadBaseDelPizzeTypes = async () => {
    try {
      setIsLoadingBaseDelPizze(true);
      console.log('🍕 Loading base del pizze types...');
      const types = await baseDelPizzeService.getActiveBaseDelPizzeTypes();
      console.log('🍕 Loaded base del pizze types:', types.length, types.map(t => t.name));
      setBaseDelPizzeTypes(types);

      // Set default selection to first active type
      if (types.length > 0) {
        setSelectedBaseDelPizze(types[0]);
        console.log('🍕 Auto-selected base del pizze:', types[0].name);
      } else {
        console.warn('⚠️ No active base del pizze types found');
      }
    } catch (error) {
      console.error('❌ Error loading base del pizze types:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le basi del pizze",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBaseDelPizze(false);
    }
  };

  // Load available extras when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🍕 Pizza customization modal opened for:', pizza?.name);
      console.log('🍕 Category settings:', categorySettings);
      console.log('🍕 Current step:', currentStep);

      // Load impasta types if enabled for this category
      if (categorySettings.impasto_enabled) {
        loadImpastaTypes();
      }

      // Load base del pizze types if enabled for this category
      if (categorySettings.base_del_pizze_enabled) {
        loadBaseDelPizzeTypes();
      }

      // Only load extras and bevande if enabled for this category
      if (categorySettings.aggiunti_enabled) {
        loadAggiuntiTypes();
      }
      if (categorySettings.bevande_enabled || categorySettings.birre_enabled) {
        loadBevandeAndBirre();
      }
      if (categorySettings.dolci_enabled) {
        loadDolci();
      }

      // Reset state when modal opens
      setSelectedExtras([]);
      setSelectedBevande([]);
      setSelectedDolci([]);
      setQuantity(initialQuantity);
      setSpecialRequests('');
      setSelectedBaseDelPizze(null); // Reset base del pizze selection

      // Set initial step based on what's enabled - base_del_pizze comes first
      if (categorySettings.base_del_pizze_enabled) {
        setCurrentStep('base_del_pizze');
      } else if (categorySettings.impasto_enabled) {
        setCurrentStep('impasta');
      } else if (categorySettings.aggiunti_enabled) {
        setCurrentStep('extras');
      } else if (categorySettings.bevande_enabled || categorySettings.birre_enabled) {
        setCurrentStep('bevande');
      } else if (categorySettings.dolci_enabled) {
        setCurrentStep('dolci');
      } else {
        // If nothing is enabled, we'll handle this in the UI
        setCurrentStep('base_del_pizze');
      }
    }
  }, [isOpen, initialQuantity, categorySettings]);



  const loadBevandeAndBirre = async () => {
    try {
      // Get category IDs for 'bevande' and 'birre'
      const categorySlugs = [];
      if (categorySettings.bevande_enabled) categorySlugs.push('bevande');
      if (categorySettings.birre_enabled) categorySlugs.push('birre');

      if (categorySlugs.length === 0) {
        setAvailableBevande([]);
        return;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, slug')
        .in('slug', categorySlugs);

      if (categoriesError) throw categoriesError;

      const categoryIds = categoriesData.map(cat => cat.id);

      // Then get products from both categories
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, name, price, description, category_id')
        .eq('is_active', true)
        .in('category_id', categoryIds)
        .order('name');

      if (error) throw error;

      const beverages: PizzaExtra[] = productsData.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || ''
      }));

      setAvailableBevande(beverages);
    } catch (error) {
      console.error('Error loading bevande and birre:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le bevande disponibili.',
        variant: 'destructive'
      });
    }
  };

  const loadDolci = async () => {
    try {
      // Load dolci types from dolci_types table
      const { data: dolciData, error: dolciError } = await supabase
        .from('dolci_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (dolciError) throw dolciError;

      // Convert to PizzaExtra format
      const dolci: PizzaExtra[] = dolciData.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || ''
      }));

      setAvailableDolci(dolci);
    } catch (error) {
      console.error('Error loading dolci:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dolci disponibili.',
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
    const baseDelPizzePrice = selectedBaseDelPizze ? calculateTotal(selectedBaseDelPizze.price, quantity) : 0;
    const extrasPrice = selectedExtras.reduce((total, extra) =>
      addPrices(total, calculateTotal(extra.price * extra.quantity, quantity)), 0
    );
    const bevandePrice = selectedBevande.reduce((total, bevanda) =>
      addPrices(total, calculateTotal(bevanda.price * bevanda.quantity, quantity)), 0
    );
    const dolciPrice = selectedDolci.reduce((total, dolce) =>
      addPrices(total, calculateTotal(dolce.price * dolce.quantity, quantity)), 0
    );

    return addPrices(addPrices(addPrices(addPrices(addPrices(pizzaPrice, impastaPrice), baseDelPizzePrice), extrasPrice), bevandePrice), dolciPrice);
  };

  const handleAddToCart = () => {
    console.log('🛒 handleAddToCart called:', {
      pizza: pizza?.name,
      selectedBaseDelPizze: selectedBaseDelPizze?.name,
      hasBaseDelPizzeEnabled: categorySettings.base_del_pizze_enabled,
      baseDelPizzeTypesLength: baseDelPizzeTypes.length
    });

    // Only require base del pizze selection if the feature is enabled for this category
    if (!pizza) {
      console.error('❌ Cannot add to cart - missing pizza');
      return;
    }

    if (categorySettings.base_del_pizze_enabled && !selectedBaseDelPizze) {
      console.error('❌ Cannot add to cart - base del pizze required but not selected:', {
        base_del_pizze_enabled: categorySettings.base_del_pizze_enabled,
        selectedBaseDelPizze: !!selectedBaseDelPizze,
        availableTypes: baseDelPizzeTypes.length
      });
      return;
    }

    // Combine extras, bevande, and dolci into one array for the cart
    const allExtras = [...selectedExtras, ...selectedBevande, ...selectedDolci];

    // DEBUG: Log what we're adding to cart
    console.log('🍕 Adding to cart:', {
      pizza: pizza.name,
      quantity,
      selectedImpasta: selectedImpasta?.name,
      selectedBaseDelPizze: selectedBaseDelPizze?.name,
      baseDelPizzePrice: selectedBaseDelPizze?.price,
      allExtras: allExtras.map(e => e.name),
      specialRequests
    });

    onAddToCart(pizza, quantity, allExtras, specialRequests, selectedImpasta, selectedBaseDelPizze || undefined);
    onClose();

    const totalItems = selectedExtras.length + selectedBevande.length + selectedDolci.length;
    toast({
      title: 'Pizza aggiunta al carrello! 🍕',
      description: `${pizza.name}${selectedBaseDelPizze ? ` con ${selectedBaseDelPizze.name}` : ''}${selectedImpasta ? `, ${selectedImpasta.name}` : ''}, ${selectedExtras.length} extra, ${selectedBevande.length} bevande e ${selectedDolci.length} dolci è stata aggiunta al carrello.`,
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

  const addDolce = (dolce: PizzaExtra) => {
    setSelectedDolci(prev => {
      const existing = prev.find(item => item.id === dolce.id);
      if (existing) {
        return prev.map(item =>
          item.id === dolce.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dolce, quantity: 1 }];
    });
  };

  const removeDolce = (dolceId: string) => {
    setSelectedDolci(prev => prev.filter(item => item.id !== dolceId));
  };

  const updateDolceQuantity = (dolceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeDolce(dolceId);
      return;
    }
    setSelectedDolci(prev =>
      prev.map(item =>
        item.id === dolceId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Scroll to top of modal content
  const scrollToTopOfModal = () => {
    console.log('🔄 Scrolling to top of modal...');

    // Try multiple selectors to ensure we find the scrollable element
    const selectors = [
      '[role="dialog"] .overflow-y-auto',
      '[data-radix-dialog-content]',
      '.max-h-\\[90vh\\]',
      '[role="dialog"] > div'
    ];

    let scrolled = false;
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found scrollable element with selector: ${selector}`);
        element.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        scrolled = true;
        break;
      }
    }

    if (!scrolled) {
      console.log('⚠️ No scrollable element found, trying fallback...');
      // Fallback: try to find any dialog content
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        const scrollableChild = dialogContent.querySelector('div');
        if (scrollableChild) {
          scrollableChild.scrollTo({ top: 0, behavior: 'smooth' });
          console.log('✅ Used fallback scroll method');
        }
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'base_del_pizze' && selectedBaseDelPizze) {
      // Skip to next available step - impasta comes after base_del_pizze
      if (categorySettings.impasto_enabled) {
        setCurrentStep('impasta');
      } else if (categorySettings.aggiunti_enabled) {
        setCurrentStep('extras');
      } else if (categorySettings.bevande_enabled || categorySettings.birre_enabled) {
        setCurrentStep('bevande');
      } else if (categorySettings.dolci_enabled) {
        setCurrentStep('dolci');
      } else {
        // If no other steps are enabled, go directly to cart
        handleAddToCart();
        return;
      }
    } else if (currentStep === 'impasta' && selectedImpasta) {
      // Skip to next available step
      if (categorySettings.aggiunti_enabled) {
        setCurrentStep('extras');
      } else if (categorySettings.bevande_enabled || categorySettings.birre_enabled) {
        setCurrentStep('bevande');
      } else if (categorySettings.dolci_enabled) {
        setCurrentStep('dolci');
      } else {
        handleAddToCart();
        return;
      }
    } else if (currentStep === 'extras') {
      // Skip to bevande if enabled, otherwise dolci, otherwise go to cart
      if (categorySettings.bevande_enabled || categorySettings.birre_enabled) {
        setCurrentStep('bevande');
      } else if (categorySettings.dolci_enabled) {
        setCurrentStep('dolci');
      } else {
        handleAddToCart();
        return;
      }
    } else if (currentStep === 'bevande') {
      // Skip to dolci if enabled, otherwise go to cart
      if (categorySettings.dolci_enabled) {
        setCurrentStep('dolci');
      } else {
        handleAddToCart();
        return;
      }
    }

    // Step change completed - no automatic scrolling
  };

  const handleBackStep = () => {
    if (currentStep === 'impasta') {
      // Go back to base_del_pizze if enabled
      if (categorySettings.base_del_pizze_enabled) {
        setCurrentStep('base_del_pizze');
      }
    } else if (currentStep === 'extras') {
      // Go back to impasta if enabled, otherwise base_del_pizze
      if (categorySettings.impasto_enabled) {
        setCurrentStep('impasta');
      } else if (categorySettings.base_del_pizze_enabled) {
        setCurrentStep('base_del_pizze');
      }
    } else if (currentStep === 'bevande') {
      // Go back to extras if enabled, otherwise impasta, otherwise base_del_pizze
      if (categorySettings.aggiunti_enabled) {
        setCurrentStep('extras');
      } else if (categorySettings.impasto_enabled) {
        setCurrentStep('impasta');
      } else if (categorySettings.base_del_pizze_enabled) {
        setCurrentStep('base_del_pizze');
      }
    } else if (currentStep === 'dolci') {
      // Go back to bevande if enabled, otherwise extras, otherwise impasta, otherwise base_del_pizze
      if (categorySettings.bevande_enabled || categorySettings.birre_enabled) {
        setCurrentStep('bevande');
      } else if (categorySettings.aggiunti_enabled) {
        setCurrentStep('extras');
      } else if (categorySettings.impasto_enabled) {
        setCurrentStep('impasta');
      } else if (categorySettings.base_del_pizze_enabled) {
        setCurrentStep('base_del_pizze');
      }
    }

    // Scroll to top after step change
    setTimeout(scrollToTopOfModal, 100);
  };

  if (!pizza) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto pizza-customization-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🍕 Personalizza {pizza.name}
            <span className="text-sm font-normal text-gray-500">
              - Passo {
                currentStep === 'base_del_pizze' ? '1' :
                currentStep === 'impasta' ? '2' :
                currentStep === 'extras' ? '3' :
                currentStep === 'bevande' ? '4' : '5'
              } di 5
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pizza Info */}
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={pizza.image_url}
              alt={pizza.name}
              className="w-24 h-24 sm:w-24 sm:h-24 object-cover rounded-lg mx-auto sm:mx-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <div className="flex-1 text-center sm:text-left">
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

          {/* Step 1: Base del Pizze Selection */}
          {currentStep === 'base_del_pizze' && categorySettings.base_del_pizze_enabled && (
            <div>
              <h4 className="font-semibold mb-3">Scegli la base del pizze:</h4>
              <div className="space-y-3">
                {isLoadingBaseDelPizze ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-orange mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Caricamento basi del pizze...</p>
                  </div>
                ) : baseDelPizzeTypes.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Nessuna base del pizze disponibile</p>
                  </div>
                ) : (
                  baseDelPizzeTypes.map((baseDelPizze) => (
                    <div
                      key={baseDelPizze.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBaseDelPizze?.id === baseDelPizze.id
                          ? 'border-pizza-orange bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedBaseDelPizze(baseDelPizze)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedBaseDelPizze?.id === baseDelPizze.id
                              ? 'border-pizza-orange bg-pizza-orange'
                              : 'border-gray-300'
                          }`} />
                          <div>
                            <h5 className="font-medium">{baseDelPizze.name}</h5>
                            {baseDelPizze.description && (
                              <p className="text-sm text-gray-600">{baseDelPizze.description}</p>
                            )}
                          </div>
                        </div>
                        {baseDelPizze.price > 0 && (
                          <span className="text-sm font-medium text-pizza-orange">
                            +{formatPrice(baseDelPizze.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Impasta Selection */}
          {currentStep === 'impasta' && categorySettings.impasto_enabled && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Base del pizze selezionata:</h4>
                  <Button variant="outline" size="sm" onClick={handleBackStep}>
                    Cambia Base
                  </Button>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{selectedBaseDelPizze?.name}</span>
                  {selectedBaseDelPizze?.price > 0 && (
                    <span className="text-sm text-gray-600 ml-2">
                      (+{formatPrice(selectedBaseDelPizze.price)})
                    </span>
                  )}
                </div>
              </div>

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

          {/* Step 3: Extras Selection */}
          {currentStep === 'extras' && categorySettings.aggiunti_enabled && (
            <div>
              <div className="mb-4 space-y-3">
                {/* Show Base del Pizze selection if enabled */}
                {categorySettings.base_del_pizze_enabled && selectedBaseDelPizze && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Base del pizze selezionata:</h4>
                      <Button variant="outline" size="sm" onClick={handleBackStep}>
                        Cambia
                      </Button>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{selectedBaseDelPizze.name}</span>
                      {selectedBaseDelPizze.price > 0 && (
                        <span className="text-sm text-gray-600 ml-2">
                          (+{formatPrice(selectedBaseDelPizze.price)})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Show Impasta selection if enabled */}
                {categorySettings.impasto_enabled && selectedImpasta && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Impasta selezionata:</h4>
                      <Button variant="outline" size="sm" onClick={handleBackStep}>
                        Cambia
                      </Button>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{selectedImpasta.name}</span>
                      {selectedImpasta.price > 0 && (
                        <span className="text-sm text-gray-600 ml-2">
                          (+{formatPrice(selectedImpasta.price)})
                        </span>
                      )}
                    </div>
                  </div>
                )}
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

          {/* Step 4: Bevande & Birre Selection */}
          {currentStep === 'bevande' && (categorySettings.bevande_enabled || categorySettings.birre_enabled) && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Selezioni precedenti:</h4>
                  <Button variant="outline" size="sm" onClick={handleBackStep}>
                    Cambia
                  </Button>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg space-y-1">
                  {selectedBaseDelPizze && (
                    <span className="text-sm font-medium block">Base del pizze: {selectedBaseDelPizze.name}</span>
                  )}
                  {selectedImpasta && (
                    <span className="text-sm font-medium block">Impasta: {selectedImpasta.name}</span>
                  )}
                  {selectedExtras.length > 0 && (
                    <span className="text-sm block">Extra: {selectedExtras.map(e => e.name).join(', ')}</span>
                  )}
                </div>
              </div>

              <Separator />

              <h4 className="font-semibold mb-3">
                {categorySettings.bevande_enabled && categorySettings.birre_enabled ? 'Scegli Bevande e Birre:' :
                 categorySettings.bevande_enabled ? 'Scegli Bevande:' : 'Scegli Birre:'}
              </h4>
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

          {/* Step 5: Dolci Selection */}
          {currentStep === 'dolci' && categorySettings.dolci_enabled && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Selezioni precedenti:</h4>
                  <Button variant="outline" size="sm" onClick={handleBackStep}>
                    Cambia
                  </Button>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg space-y-1">
                  {selectedBaseDelPizze && (
                    <div className="text-sm">
                      <span className="font-medium">Base: </span>
                      {selectedBaseDelPizze.name} (+{formatPrice(selectedBaseDelPizze.price * quantity)})
                    </div>
                  )}
                  {selectedImpasta && (
                    <div className="text-sm">
                      <span className="font-medium">Impasto: </span>
                      {selectedImpasta.name} (+{formatPrice(selectedImpasta.price * quantity)})
                    </div>
                  )}
                  {selectedExtras.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Extra: </span>
                      {selectedExtras.map(e => e.name).join(', ')}
                    </div>
                  )}
                  {selectedBevande.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Bevande: </span>
                      {selectedBevande.map(b => b.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <h4 className="font-semibold mb-3">🍰 Aggiungi Dolci (Opzionale):</h4>
              {availableDolci.length === 0 ? (
                <div className="text-center py-4">Nessun dolce disponibile al momento.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableDolci.map(dolce => {
                    const selectedDolce = selectedDolci.find(item => item.id === dolce.id);
                    return (
                      <div
                        key={dolce.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{dolce.name}</h5>
                            <p className="text-sm font-semibold text-green-600">+{formatPrice(dolce.price)}</p>
                          </div>
                          {!selectedDolce ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addDolce(dolce)}
                              className="ml-2"
                            >
                              <Plus size={14} />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateDolceQuantity(dolce.id, selectedDolce.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="text-xs w-6 text-center">{selectedDolce.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateDolceQuantity(dolce.id, selectedDolce.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus size={12} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeDolce(dolce.id)}
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
          {currentStep === 'bevande' && (categorySettings.bevande_enabled || categorySettings.birre_enabled) && selectedBevande.length > 0 && (
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

          {/* Selected Dolci Summary - Only show in dolci step */}
          {currentStep === 'dolci' && categorySettings.dolci_enabled && selectedDolci.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Dolci Selezionati:</h4>
                <div className="space-y-2">
                  {selectedDolci.map(dolce => (
                    <div key={dolce.id} className="flex justify-between items-center text-sm">
                      <span>{dolce.name} x{dolce.quantity}</span>
                      <span className="font-medium">+{formatPrice(dolce.price * dolce.quantity * quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Special Requests - Show in final step based on what's enabled */}
          {((currentStep === 'dolci' && categorySettings.dolci_enabled) ||
            (currentStep === 'bevande' && (categorySettings.bevande_enabled || categorySettings.birre_enabled) && !categorySettings.dolci_enabled) ||
            (currentStep === 'extras' && categorySettings.aggiunti_enabled && !categorySettings.bevande_enabled && !categorySettings.birre_enabled && !categorySettings.dolci_enabled) ||
            (currentStep === 'base_del_pizze' && categorySettings.base_del_pizze_enabled && !categorySettings.aggiunti_enabled && !categorySettings.bevande_enabled && !categorySettings.birre_enabled && !categorySettings.dolci_enabled) ||
            (currentStep === 'impasta' && categorySettings.impasto_enabled && !categorySettings.base_del_pizze_enabled && !categorySettings.aggiunti_enabled && !categorySettings.bevande_enabled && !categorySettings.birre_enabled && !categorySettings.dolci_enabled)) && (
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

              {currentStep === 'base_del_pizze' && categorySettings.base_del_pizze_enabled ? (
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-pizza-orange hover:bg-pizza-red"
                  disabled={!selectedBaseDelPizze}
                >
                  {/* Show "Aggiungi al Carrello" if this is the final step, otherwise "Avanti" */}
                  {!categorySettings.impasto_enabled && !categorySettings.aggiunti_enabled && !categorySettings.bevande_enabled && !categorySettings.birre_enabled ? (
                    <>
                      <ShoppingCart size={16} className="mr-2" />
                      Aggiungi al Carrello
                    </>
                  ) : (
                    'Avanti'
                  )}
                </Button>
              ) : currentStep === 'impasta' && categorySettings.impasto_enabled ? (
                <>
                  {categorySettings.base_del_pizze_enabled && (
                    <Button variant="outline" onClick={handleBackStep} className="flex-1">
                      Indietro
                    </Button>
                  )}
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 bg-pizza-orange hover:bg-pizza-red"
                    disabled={!selectedImpasta}
                  >
                    Avanti
                  </Button>
                </>
              ) : currentStep === 'extras' && categorySettings.aggiunti_enabled ? (
                <>
                  {(categorySettings.impasto_enabled || categorySettings.base_del_pizze_enabled) && (
                    <Button variant="outline" onClick={handleBackStep} className="flex-1">
                      Indietro
                    </Button>
                  )}
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 bg-pizza-orange hover:bg-pizza-red"
                  >
                    Avanti
                  </Button>
                </>
              ) : currentStep === 'bevande' && (categorySettings.bevande_enabled || categorySettings.birre_enabled) ? (
                <>
                  {(categorySettings.aggiunti_enabled || categorySettings.impasto_enabled || categorySettings.base_del_pizze_enabled) && (
                    <Button variant="outline" onClick={handleBackStep} className="flex-1">
                      Indietro
                    </Button>
                  )}
                  <Button
                    onClick={categorySettings.dolci_enabled ? handleNextStep : handleAddToCart}
                    className="flex-1 bg-pizza-orange hover:bg-pizza-red"
                  >
                    {categorySettings.dolci_enabled ? (
                      'Avanti'
                    ) : (
                      <>
                        <ShoppingCart size={16} className="mr-2" />
                        Aggiungi al Carrello
                      </>
                    )}
                  </Button>
                </>
              ) : currentStep === 'dolci' && categorySettings.dolci_enabled ? (
                <>
                  {(categorySettings.bevande_enabled || categorySettings.birre_enabled || categorySettings.aggiunti_enabled || categorySettings.impasto_enabled || categorySettings.base_del_pizze_enabled) && (
                    <Button variant="outline" onClick={handleBackStep} className="flex-1">
                      Indietro
                    </Button>
                  )}
                  <Button onClick={handleAddToCart} className="flex-1 bg-pizza-orange hover:bg-pizza-red">
                    <ShoppingCart size={16} className="mr-2" />
                    Aggiungi al Carrello
                  </Button>
                </>
              ) : (
                // Fallback case - if no features are enabled or we're in an unexpected state
                <Button onClick={handleAddToCart} className="flex-1 bg-pizza-orange hover:bg-pizza-red">
                  <ShoppingCart size={16} className="mr-2" />
                  Aggiungi al Carrello
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PizzaCustomizationModal;
