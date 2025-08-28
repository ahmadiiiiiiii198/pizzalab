
import React, { useState, useEffect } from "react";
import { Menu, X, Utensils, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/hooks/use-language";
import BackgroundMusic from "@/components/BackgroundMusic";
import { useNavbarLogoSettings } from "@/hooks/use-settings";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const [navbarLogoSettings, , isNavbarLogoLoading] = useNavbarLogoSettings();

  // DEBUG: Log navbar logo settings
  useEffect(() => {
    console.log('🔍 [Navbar] Logo settings changed:', {
      logoUrl: navbarLogoSettings.logoUrl,
      altText: navbarLogoSettings.altText,
      showLogo: navbarLogoSettings.showLogo,
      logoSize: navbarLogoSettings.logoSize,
      isLoading: isNavbarLogoLoading
    });
  }, [navbarLogoSettings, isNavbarLogoLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const scrollToSection = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Left side - Logo */}
        <a href="/" className="flex items-center gap-3 hover:scale-105 transition-all duration-300">
          {navbarLogoSettings.showLogo && (
            <div className="relative logo-container">
              {!isNavbarLogoLoading && (
                <img
                  src={navbarLogoSettings.logoUrl}
                  alt={navbarLogoSettings.altText}
                  className={`logo-smooth-load transition-all duration-300 hover:scale-110 ${
                    navbarLogoSettings.logoSize === 'small' ? 'h-12 w-12 sm:h-14 sm:w-14' :
                    navbarLogoSettings.logoSize === 'large' ? 'h-18 w-18 sm:h-22 sm:w-22' :
                    'h-14 w-14 sm:h-18 sm:w-18'
                  }`}
                  onLoad={(e) => {
                    e.currentTarget.classList.add('loaded');
                  }}
                  onError={(e) => {
                    console.error('❌ Navbar logo failed to load:', e);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              {/* Loading placeholder */}
              {isNavbarLogoLoading && (
                <div className={`rounded-full bg-gray-200 animate-pulse ${
                  navbarLogoSettings.logoSize === 'small' ? 'h-10 w-10 sm:h-12 sm:w-12' :
                  navbarLogoSettings.logoSize === 'large' ? 'h-16 w-16 sm:h-20 sm:w-20' :
                  'h-12 w-12 sm:h-16 sm:w-16'
                }`} />
              )}
              {/* Fallback text logo */}
              <div className={`hidden bg-gradient-to-r from-efes-gold to-efes-dark-gold text-white flex items-center justify-center font-bold rounded-full shadow-lg ${
                navbarLogoSettings.logoSize === 'small' ? 'h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-lg' :
                navbarLogoSettings.logoSize === 'large' ? 'h-16 w-16 sm:h-20 sm:w-20 text-lg sm:text-2xl' :
                'h-12 w-12 sm:h-16 sm:w-16 text-lg sm:text-xl'
              }`}>
                🥙
              </div>
            </div>
          )}
          {/* Updated branding text */}
          <div className="hidden sm:block">
            <span className="text-xl sm:text-2xl font-playfair font-bold text-gray-800">
              EFES KEBAP
            </span>
            <p className="text-xs sm:text-sm font-sans text-gray-600 -mt-1">
              Ristorante - Pizzeria
            </p>
          </div>
        </a>

        {/* Center - Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
          <a href="/" className="text-gray-700 hover:text-efes-gold transition-colors font-medium relative group">
            {t('home')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-efes-gold transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a
            href="/#categories"
            className="text-gray-700 hover:text-efes-gold transition-colors font-medium relative group"
            onClick={(e) => scrollToSection('categories', e)}
          >
            {t('categories')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-efes-gold transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a
            href="/#products"
            className="text-gray-700 hover:text-efes-gold transition-colors font-medium relative group"
            onClick={(e) => scrollToSection('products', e)}
          >
            {t('products')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-efes-gold transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a
            href="/#about"
            className="text-gray-700 hover:text-efes-gold transition-colors font-medium relative group"
            onClick={(e) => scrollToSection('about', e)}
          >
            {t('about')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-efes-gold transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a
            href="/#contact"
            className="text-gray-700 hover:text-efes-gold transition-colors font-medium relative group"
            onClick={(e) => scrollToSection('contact', e)}
          >
            {t('contact')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-efes-gold transition-all duration-300 group-hover:w-full"></span>
          </a>
        </div>

        {/* Right side - Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            className="bg-gradient-to-r from-efes-gold to-efes-dark-gold text-white hover:shadow-lg hover:scale-105 flex items-center gap-2 font-semibold transition-all duration-300"
            onClick={(e) => scrollToSection('contact', e)}
          >
            <Utensils size={16} />
            {t('makeReservation')}
          </Button>
          <BackgroundMusic />
          <LanguageSelector />
        </div>

        {/* Mobile Menu Button - adjusted spacing */}
        <div className="md:hidden flex items-center gap-2">
          <BackgroundMusic />
          <LanguageSelector />
          <button className="text-gray-700 hover:text-efes-gold p-2 transition-colors" onClick={toggleMenu}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 shadow-lg">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <a href="/" className="text-gray-700 hover:text-efes-gold transition-colors font-medium py-2 border-b border-gray-100" onClick={toggleMenu}>
              {t('home')}
            </a>
            <a
              href="/#categories"
              className="text-gray-700 hover:text-efes-gold transition-colors font-medium py-2 border-b border-gray-100"
              onClick={(e) => scrollToSection('categories', e)}
            >
              {t('categories')}
            </a>
            <a
              href="/#products"
              className="text-gray-700 hover:text-efes-gold transition-colors font-medium py-2 border-b border-gray-100"
              onClick={(e) => scrollToSection('products', e)}
            >
              {t('products')}
            </a>
            <a
              href="/#about"
              className="text-gray-700 hover:text-efes-gold transition-colors font-medium py-2 border-b border-gray-100"
              onClick={(e) => scrollToSection('about', e)}
            >
              {t('about')}
            </a>
            <a
              href="/#contact"
              className="text-gray-700 hover:text-efes-gold transition-colors font-medium py-2 border-b border-gray-100"
              onClick={(e) => scrollToSection('contact', e)}
            >
              {t('contact')}
            </a>
            <Button
              className="bg-gradient-to-r from-efes-gold to-efes-dark-gold text-white hover:shadow-lg hover:scale-105 w-full flex items-center justify-center gap-2 font-semibold transition-all duration-300 mt-4"
              onClick={(e) => scrollToSection('contact', e)}
            >
              <Utensils size={16} />
              {t('makeReservation')}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
