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
      <section className="relative w-full overflow-hidden" style={{ marginTop: '100px', marginRight: 0, marginBottom: 0, marginLeft: 0, padding: 0, minHeight: 'calc(100vh - 100px)' }}>

        
        {/* Loading skeleton */}
        <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24 h-full flex items-center justify-center">{/* Removed pt-20 since we have marginTop */}
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
      className="hero-section relative w-full overflow-hidden"
      style={{
        margin: 0,
        padding: 0,
        paddingTop: '130px',
        minHeight: '100vh',
        backgroundImage: heroContent.backgroundImage ?
          `url('${heroContent.backgroundImage}')` :
          'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >




      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center min-h-[calc(100vh-100px)]">{/* Removed pt-20 since we have marginTop */}
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center">
            
            {/* Main Content - Text Content */}
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Welcome Message */}
              <div className="flex justify-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide leading-tight font-montserrat text-center" style={{ textShadow: '3px 3px 10px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.5)' }}>
                  {heroContent.welcomeMessage || 'BENVENUTI DA RURÀL PIZZA'}
                </h1>
              </div>

              {/* Subtitle */}
              <div className="flex justify-center">
                <p className="text-lg md:text-xl lg:text-2xl text-white max-w-2xl leading-relaxed font-inter text-center" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.5)' }}>
                  Laboratorio di pizza italiana innovativa nel cuore di Torino
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
                  className="bg-white text-gray-800 px-12 py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 border-4 border-amber-400 hover:border-amber-500 hover:bg-amber-50"
                  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(251,191,36,0.5)' }}
                >
                  🍕 ORDINA ORA
                </button>
                <button
                  onClick={() => {
                    window.open('tel:+393713707741', '_self');
                  }}
                  className="bg-amber-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-2xl hover:bg-amber-600 border-4 border-white"
                  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(251,191,36,0.5)' }}
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
