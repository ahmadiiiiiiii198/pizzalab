
import React, { useState, useEffect } from 'react';
import { Eye, Tag, Plus, Minus } from 'lucide-react';
import { Product, Category } from '@/types/category';
import CartIcon from '@/components/icons/CartIcon';

import { useToast } from '@/hooks/use-toast';
import { useSimpleCart, PizzaExtra } from '@/hooks/use-simple-cart';
import { Badge } from '@/components/ui/badge';
import PizzaCustomizationModal from './PizzaCustomizationModal';
import { formatPrice } from '@/utils/priceUtils';
import { useStockManagement } from '@/hooks/useStockManagement';
import { validateImageUrl } from '@/utils/urlUtils';
import { supabase } from '@/integrations/supabase/client';

interface ProductCardProps {
  product?: Product;
  // Legacy props for backward compatibility
  name?: string;
  price?: string;
  image?: string;
  description?: string;
  onOrder?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  // Business hours props
  businessIsOpen?: boolean;
  businessMessage?: string;
  validateOrderTime?: () => Promise<{ valid: boolean; message: string }>;
  // Background transparency prop
  hasParentBackground?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  name,
  price,
  image,
  description,
  onOrder,
  onViewDetails,
  businessIsOpen,
  businessMessage,
  validateOrderTime,
  hasParentBackground = false
}) => {
  const { toast } = useToast();
  const { addItem } = useSimpleCart();
  const { isProductAvailable, getStockStatus, getStockMessage, isStockManagementEnabled } = useStockManagement();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [categorySettings, setCategorySettings] = useState<{
    impasto_enabled: boolean;
    aggiunti_enabled: boolean;
    bevande_enabled: boolean;
    birre_enabled: boolean;
    base_del_pizze_enabled: boolean;
    dolci_enabled: boolean;
  }>({ impasto_enabled: true, aggiunti_enabled: true, bevande_enabled: true, birre_enabled: true, base_del_pizze_enabled: true, dolci_enabled: true });

  // Use product data if available, otherwise fall back to legacy props
  const productName = product?.name || name || '';
  const productPrice = product ? formatPrice(product.price) : price || '';
  const productComparePrice = product?.compare_price && product.compare_price > 0 ? formatPrice(product.compare_price) : null;
  const productImage = validateImageUrl(product?.image_url || image || '', '/placeholder.svg');
  const productDescription = product?.description || description || '';
  const stockQuantity = product?.stock_quantity || 0;

  // Use stock management logic to determine availability
  const isAvailable = isProductAvailable(stockQuantity);
  const stockStatus = getStockStatus(stockQuantity);
  const stockMessage = getStockMessage(stockQuantity);

  // Fetch category settings when product changes
  useEffect(() => {
    const fetchCategorySettings = async () => {
      if (product?.category_id) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('impasto_enabled, aggiunti_enabled, bevande_enabled, birre_enabled, base_del_pizze_enabled, dolci_enabled')
            .eq('id', product.category_id)
            .single();

          if (!error && data) {
            setCategorySettings({
              impasto_enabled: data.impasto_enabled ?? true,
              aggiunti_enabled: data.aggiunti_enabled ?? true,
              bevande_enabled: data.bevande_enabled ?? true,
              birre_enabled: data.birre_enabled ?? true,
              base_del_pizze_enabled: data.base_del_pizze_enabled ?? true,
              dolci_enabled: data.dolci_enabled ?? true
            });
          }
        } catch (error) {
          console.error('Error fetching category settings:', error);
          // Keep default settings on error
        }
      }
    };

    fetchCategorySettings();
  }, [product?.category_id]);

  // Check if this is a pizza that can be customized (pizza categories)
  const isPizza = product?.category_slug === 'pizza-classiche' ||
                  product?.category_slug === 'pizze-gourmet' ||
                  product?.category_slug === 'pizze-speciale' ||
                  product?.category_slug === 'pizze-vegane' ||
                  product?.category_slug === 'crea-la-tua-pizza';

  // Check if this product can be customized (has any enabled features)
  const canBeCustomized = isPizza ||
                         categorySettings.bevande_enabled ||
                         categorySettings.birre_enabled ||
                         categorySettings.aggiunti_enabled ||
                         categorySettings.impasto_enabled ||
                         categorySettings.base_del_pizze_enabled ||
                         categorySettings.dolci_enabled;

  const isExtra = product?.category_slug === 'extra';

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleOrderClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    console.log('🛒 Add to cart button clicked', {
      product,
      isAvailable,
      isPizza,
      quantity,
      category_slug: product?.category_slug,
      productName: product?.name
    });

    if (product && isAvailable) {
      // For products that can be customized, open customization modal
      if (canBeCustomized) {
        console.log('🍕 Opening customization modal for:', product.name);
        setIsCustomizationOpen(true);
        return;
      }

      // For non-pizza items (like extras), add directly to cart with selected quantity
      try {
        const result = await addItem(product, quantity);
        if (result !== null) {
          toast({
            title: 'Prodotto aggiunto al carrello! 🛒',
            description: `${quantity}x ${product.name} ${quantity > 1 ? 'sono stati aggiunti' : 'è stato aggiunto'} al tuo carrello.`,
          });
          console.log('✅ Product added to cart successfully');
          // Reset quantity after adding to cart
          setQuantity(1);
        }
        // If result is null, business hours validation failed and user was already notified
      } catch (error) {
        console.error('❌ Error adding product to cart:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile aggiungere il prodotto al carrello.',
          variant: 'destructive'
        });
      }
    } else {
      console.warn('⚠️ Cannot add to cart:', { product: !!product, isAvailable });
      if (!product) {
        toast({
          title: 'Errore',
          description: 'Dati prodotto non disponibili.',
          variant: 'destructive'
        });
      } else if (!isAvailable) {
        toast({
          title: 'Non disponibile',
          description: 'Questo prodotto non è attualmente disponibile.',
          variant: 'destructive'
        });
      }
    }
  };

  const handlePizzaCustomization = async (pizza: Product, pizzaQuantity: number, extras: PizzaExtra[], specialRequests?: string, impastaType?: any, baseDelPizzeType?: any) => {
    try {
      const result = await addItem(pizza, pizzaQuantity, extras, specialRequests, impastaType, baseDelPizzeType);
      if (result !== null) {
        console.log('✅ Customized pizza added to cart successfully');
        toast({
          title: 'Pizza personalizzata aggiunta! 🍕',
          description: `${pizzaQuantity}x ${pizza.name} personalizzata ${pizzaQuantity > 1 ? 'sono state aggiunte' : 'è stata aggiunta'} al tuo carrello.`,
        });
        // Reset quantity after adding to cart
        setQuantity(1);
      }
      // If result is null, business hours validation failed and user was already notified
    } catch (error) {
      console.error('❌ Error adding customized pizza to cart:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiungere la pizza personalizzata al carrello.',
        variant: 'destructive'
      });
    }
  };

  const handleViewDetails = () => {
    if (product && onViewDetails) {
      onViewDetails(product);
    }
  };

  return (
    <div className={`product-card rounded-2xl shadow-sm overflow-hidden group product-card-hover hover:shadow-lg transition-all duration-300 border border-gray-200 w-full max-w-full ${
      hasParentBackground ? '' : 'bg-white'
    }`}>
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-[4/3] sm:aspect-[4/3] product-image-container">
        <img
          src={productImage}
          alt={productName}
          className="w-full h-full object-cover product-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />

        {/* Stock indicator */}
        {product && isStockManagementEnabled && (
          <div className="absolute top-3 left-3">
            {stockStatus === 'out_of_stock' ? (
              <span className="stock-badge stock-out">
                Non Disponibile
              </span>
            ) : stockStatus === 'low' ? (
              <span className="stock-badge stock-low">
                {stockMessage}
              </span>
            ) : stockStatus === 'available' ? (
              <span className="stock-badge stock-available">
                Disponibile
              </span>
            ) : null}
          </div>
        )}

        {/* Product Labels */}
        {product && product.labels && product.labels.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap gap-1">
            {product.labels.map((label, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`text-xs backdrop-blur-sm font-medium ${
                  label === 'Piccante' ? 'spicy-badge' : 'bg-white/95 text-orange-600 border-orange-200'
                }`}
              >
                {label === 'Piccante' && '🌶️'} {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Add to Cart Button Overlay */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          {product ? (
            <button
              type="button"
              onClick={handleOrderClick}
              disabled={!isAvailable}
              className={`w-12 h-12 rounded-full add-button ${
                !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isAvailable}
              title={isAvailable ? (canBeCustomized ? 'Personalizza prodotto' : 'Aggiungi al carrello') : 'Non disponibile'}
              aria-label={isAvailable ? (canBeCustomized ? `Personalizza ${product.name}` : `Aggiungi ${product.name} al carrello`) : 'Prodotto non disponibile'}
            >
              <CartIcon size={18} className="mx-auto" />
            </button>
          ) : (
            <button
              type="button"
              className="w-12 h-12 rounded-full add-button"
              onClick={() => console.log('Legacy button clicked - no product data')}
              aria-label="Aggiungi al carrello"
            >
              <CartIcon size={18} className="mx-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight flex-1 pr-2">
            {productName}
          </h3>
          <div className="flex flex-col items-end gap-1">
            {productComparePrice && (
              <span className="text-sm text-gray-500 line-through whitespace-nowrap">
                {productComparePrice}
              </span>
            )}
            <span className="text-xl font-bold whitespace-nowrap text-orange-600">
              {productPrice}
            </span>
          </div>
        </div>

        {productDescription && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-3">
            {productDescription}
          </p>
        )}

        {/* Quantity Selector and Add Button */}
        {product && (
          <div className="space-y-3">
            {/* Category badge */}
            <div className="flex items-center justify-between">
              <span className="inline-block category-badge">
                {product.category}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <div className="quantity-selector">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="quantity-button"
                  aria-label="Diminuisci quantità"
                >
                  <Minus size={14} />
                </button>
                <span className="quantity-display">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 99}
                  className="quantity-button"
                  aria-label="Aumenta quantità"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleOrderClick}
                disabled={!isAvailable}
                className={`add-to-cart-button ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isAvailable ? (canBeCustomized ? 'Personalizza prodotto' : 'Aggiungi al carrello') : 'Non disponibile'}
              >
                <CartIcon size={14} />
                {canBeCustomized ? 'Personalizza' : 'Aggiungi'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Customization Modal */}
      {product && canBeCustomized && (
        <PizzaCustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          pizza={product}
          onAddToCart={handlePizzaCustomization}
          initialQuantity={quantity}
          categorySettings={categorySettings}
        />
      )}
    </div>
  );
};

export default ProductCard;
