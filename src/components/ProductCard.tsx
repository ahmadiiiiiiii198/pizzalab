
import React, { useState } from 'react';
import { ShoppingCart, Eye, Tag, Plus, Minus } from 'lucide-react';
import { Product } from '@/types/category';

import { useToast } from '@/hooks/use-toast';
import { useSimpleCart, PizzaExtra } from '@/hooks/use-simple-cart';
import { Badge } from '@/components/ui/badge';
import PizzaCustomizationModal from './PizzaCustomizationModal';
import { formatPrice } from '@/utils/priceUtils';
import { useStockManagement } from '@/hooks/useStockManagement';

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
  validateOrderTime
}) => {
  const { toast } = useToast();
  const { addItem } = useSimpleCart();
  const { isProductAvailable, getStockStatus, getStockMessage, isStockManagementEnabled } = useStockManagement();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Use product data if available, otherwise fall back to legacy props
  const productName = product?.name || name || '';
  const productPrice = product ? formatPrice(product.price) : price || '';
  const productImage = product?.image_url || image || '';
  const productDescription = product?.description || description || '';
  const stockQuantity = product?.stock_quantity || 0;

  // Use stock management logic to determine availability
  const isAvailable = isProductAvailable(stockQuantity);
  const stockStatus = getStockStatus(stockQuantity);
  const stockMessage = getStockMessage(stockQuantity);

  // Check if this is a pizza that can be customized (pizza categories)
  const isPizza = product?.category_slug === 'pizza-classiche' ||
                  product?.category_slug === 'pizze-gourmet' ||
                  product?.category_slug === 'pizze-speciale' ||
                  product?.category_slug === 'pizze-vegane' ||
                  product?.category_slug === 'crea-la-tua-pizza';
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
      // For pizzas, open customization modal
      if (isPizza) {
        console.log('🍕 Opening pizza customization modal for:', product.name);
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

  const handlePizzaCustomization = async (pizza: Product, pizzaQuantity: number, extras: PizzaExtra[], specialRequests?: string, impastaType?: any) => {
    try {
      const result = await addItem(pizza, pizzaQuantity, extras, specialRequests, impastaType);
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden group product-card-hover hover:shadow-lg transition-all duration-300 border border-gray-200">
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-[4/3] product-image-container">
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
              title={isAvailable ? (isPizza ? 'Personalizza pizza' : 'Aggiungi al carrello') : 'Non disponibile'}
              aria-label={isAvailable ? (isPizza ? `Personalizza ${product.name}` : `Aggiungi ${product.name} al carrello`) : 'Prodotto non disponibile'}
            >
              <ShoppingCart size={18} className="mx-auto" />
            </button>
          ) : (
            <button
              type="button"
              className="w-12 h-12 rounded-full add-button"
              onClick={() => console.log('Legacy button clicked - no product data')}
              aria-label="Aggiungi al carrello"
            >
              <ShoppingCart size={18} className="mx-auto" />
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
          <span className="text-xl font-bold whitespace-nowrap text-orange-600">
            {productPrice}
          </span>
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
                title={isAvailable ? (isPizza ? 'Personalizza pizza' : 'Aggiungi al carrello') : 'Non disponibile'}
              >
                <ShoppingCart size={14} />
                {isPizza ? 'Personalizza' : 'Aggiungi'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pizza Customization Modal */}
      {product && isPizza && (
        <PizzaCustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          pizza={product}
          onAddToCart={handlePizzaCustomization}
          initialQuantity={quantity}
        />
      )}
    </div>
  );
};

export default ProductCard;
