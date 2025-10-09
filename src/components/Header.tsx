import React, { useState, useEffect } from 'react';
import { Pizza, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSelector from '@/components/LanguageSelector';
import OrderOptionsModal from './OrderOptionsModal';
import { useSimpleCart } from '@/hooks/use-simple-cart';
import SimpleCart from './SimpleCart';
import ProductSearch from './ProductSearch';
import MobileSearchModal from './MobileSearchModal';
import { useLanguage } from '@/hooks/use-language';
import CartIcon from '@/components/icons/CartIcon';

import logoImage from '@/assets/logo.png';
import { useNavbarLogoSettings } from '@/hooks/use-settings';


const Header = () => {
  const { getTotalItems, openCart } = useSimpleCart();
  const { t } = useLanguage();
  const [navbarLogoSettings, , isNavbarLogoLoading] = useNavbarLogoSettings();

  // DEBUG: Log navbar logo settings
  useEffect(() => {
    console.log('🔍 [Header] Logo settings changed:', {
      logoUrl: navbarLogoSettings.logoUrl,
      altText: navbarLogoSettings.altText,
      showLogo: navbarLogoSettings.showLogo,
      logoSize: navbarLogoSettings.logoSize,
      isLoading: isNavbarLogoLoading
    });
  }, [navbarLogoSettings, isNavbarLogoLoading]);

  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full shadow-sm border-b z-50" style={{backgroundColor: 'var(--wheat-cream)', borderColor: 'var(--wheat-golden)', boxShadow: '0 2px 8px rgba(193, 154, 107, 0.15)'}}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 logo-container hover-scale">
                {/* Database-driven logo display */}
                {navbarLogoSettings.showLogo && !isNavbarLogoLoading && (
                  <img
                    src={navbarLogoSettings.logoUrl}
                    alt={navbarLogoSettings.altText}
                    className={`transition-all duration-300 hover:scale-105 ${
                      navbarLogoSettings.logoSize === 'small' ? 'h-16 w-auto' :
                      navbarLogoSettings.logoSize === 'large' ? 'h-28 w-auto' :
                      'h-24 w-auto'
                    }`}
                    onLoad={() => console.log('✅ Header logo loaded successfully')}
                    onError={(e) => {
                      console.error('❌ Header logo failed to load:', e);
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                )}

                {/* Loading placeholder */}
                {isNavbarLogoLoading && (
                  <div className={`bg-gray-200 animate-pulse rounded ${
                    navbarLogoSettings.logoSize === 'small' ? 'h-16 w-16' :
                    navbarLogoSettings.logoSize === 'large' ? 'h-28 w-28' :
                    'h-24 w-24'
                  }`}></div>
                )}

                {/* Fallback text logo */}
                <div className="h-12 hidden items-center px-4 italian-heading text-2xl" style={{color: 'var(--country-dark)'}}>
                  RURÀL PIZZA
                </div>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="/" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--country-dark)'}}>
                  {t('home')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
                </a>
                <a href="/#products" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--country-dark)'}}>
                  {t('menu')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
                </a>
                <a href="/#gallery" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--country-dark)'}}>
                  {t('gallery')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
                </a>
                <a href="/#about" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--country-dark)'}}>
                  {t('about')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
                </a>
                <a href="/#contact" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--country-dark)'}}>
                  {t('contact')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
                </a>
                <a href="/prenota" className="italian-body font-medium relative group transition-colors" style={{color: 'var(--wheat-harvest)'}}>
                  🌾 Prenota Tavolo
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{backgroundColor: 'var(--wheat-harvest)'}}></span>
                </a>
              </nav>
            </div>

            {/* Search Component - Hidden on mobile */}
            <div className="hidden lg:block flex-1 max-w-md mx-8 animate-fade-in-up animate-stagger-3">
              <ProductSearch
                placeholder="Cerca pizze, bevande..."
                compact={true}
                onProductSelect={(product) => {
                  console.log('🔍 Product selected from search:', product);
                  // Scroll to products section
                  const productsSection = document.getElementById('products');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden p-2 transition-colors rounded-full" style={{backgroundColor: 'var(--wheat-light)', color: 'var(--country-dark)'}}
                aria-label="Cerca prodotti"
                title="Cerca prodotti"
              >
                <Search size={20} />
              </button>


              <div className="animate-scale-in animate-stagger-1">
                <LanguageSelector />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🍕 Order button clicked, opening modal...');
                  try {
                    setIsOrderModalOpen(true);
                  } catch (error) {
                    console.error('❌ Error opening order modal:', error);
                  }
                }}
                className="hidden sm:flex items-center gap-2 wheat-btn-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Ordina ora"
                title="Ordina ora"
              >
                <Pizza size={18} className="animate-wiggle" />
                {t('makeReservation')}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🛒 Cart button clicked, opening cart...');
                  try {
                    openCart();
                  } catch (error) {
                    console.error('❌ Error opening cart:', error);
                  }
                }}
                className="wheat-cart-btn group cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                aria-label={`Apri carrello (${getTotalItems()} articoli)`}
                title={`Carrello (${getTotalItems()} articoli)`}
              >
                <CartIcon size={20} className="group-hover:animate-wiggle text-wheat-dark" />
                <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-inter font-semibold shadow-md animate-heartbeat" style={{background: 'linear-gradient(135deg, var(--wheat-harvest), var(--wheat-amber))'}}>
                  {getTotalItems()}
                </span>
                <Pizza className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce animate-float" style={{color: 'var(--wheat-harvest)'}} size={12} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <OrderOptionsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />
      <SimpleCart />
    </>
  );
};

export default Header;
