import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { usePizzeriaHours } from '@/hooks/usePizzeriaHours';

import { useHeroContent } from '@/hooks/use-settings';

const HeroNew = () => {
  const { t } = useLanguage();
  const { displayText, allHours, isLoading: hoursLoading } = usePizzeriaHours();
  // Customer authentication removed
  
  // Use the proper hooks to load content from database
  const [heroContent, updateHeroContent, heroLoading] = useHeroContent();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  // Listen for hero content updates from admin panel
  useEffect(() => {
    const handleHeroContentUpdate = (event: CustomEvent) => {
      console.log('🍕 [Hero] Received hero content update event:', event.detail);
      // Clear localStorage cache to force refresh
      try {
        localStorage.removeItem('heroContent_cache');
        localStorage.removeItem('heroContent_cache_timestamp');
        console.log('🧹 [Hero] Cleared hero content cache');
      } catch (e) {
        console.warn('⚠️ [Hero] Failed to clear cache:', e);
      }
      // Force a page refresh to show new background image
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    window.addEventListener('heroContentUpdated', handleHeroContentUpdate as EventListener);

    return () => {
      window.removeEventListener('heroContentUpdated', handleHeroContentUpdate as EventListener);
    };
  }, []);

  // Combine loading states
  const isLoading = heroLoading || hoursLoading;

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <section className="relative w-full h-screen overflow-hidden" style={{ margin: 0, padding: 0 }}>

        
        {/* Loading skeleton */}
        <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24 h-full flex items-center justify-center">
          <div className="text-center">
            <Pizza className="text-efes-gold animate-spin mx-auto mb-4" size={64} />
            <div className="text-2xl font-bold text-efes-gold">Caricamento...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="hero-section relative w-full h-screen overflow-hidden"
      style={{
        margin: 0,
        padding: 0,
        backgroundImage: heroContent.backgroundImage ? `url('${heroContent.backgroundImage}')` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >




      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center" style={{ paddingTop: 0 }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 items-center justify-center">
            
            {/* Main Content - Text Content */}
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              {/* Welcome Message */}
              <div>
                <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide leading-tight font-montserrat drop-shadow-2xl`}>
                  {heroContent.welcomeMessage || 'BENVENUTI DA EFES KEBAP'}
                </h1>
              </div>

              {/* Subtitle */}
              <div>
                <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-2xl mx-auto leading-relaxed font-inter drop-shadow-lg">
                  Autentico kebap turco e pizza italiana nel cuore di Torino
                </p>
              </div>







              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={() => {
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-12 py-5 rounded-xl font-bold text-xl shadow-2xl hover:from-yellow-600 hover:to-yellow-700 hover:shadow-3xl hover:scale-110 transition-all duration-300 border-2 border-yellow-400 animate-pulse"
                >
                  🍕 ORDINA ORA
                </button>
                <button
                  onClick={() => {
                    window.open('tel:379 145 6967', '_self');
                  }}
                  className="border-3 border-yellow-500 text-yellow-500 bg-white/10 backdrop-blur-sm px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-500 hover:text-white hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  📞 Chiama Ora
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroNew;
