import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Clock, Star, Camera, Phone } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { usePizzeriaHours } from '@/hooks/usePizzeriaHours';
// Customer authentication removed
import { useHeroContent } from '@/hooks/use-settings';
import type { HeroContent } from '@/types/hero';

const Hero = () => {
  const { t } = useLanguage();
  const { displayText, allHours, isLoading: hoursLoading } = usePizzeriaHours();
  // Customer authentication removed

  // Use the proper hooks to load content from database
  const [heroContent, updateHeroContent, heroLoading] = useHeroContent();

  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

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

  // Debug logging for hero content
  useEffect(() => {
    if (heroContent && !heroLoading) {
      console.log('🍕 [Hero] Current hero content:', heroContent);
      console.log('🖼️ [Hero] Background image:', heroContent.backgroundImage);
      console.log('✅ [Hero] Is uploaded image:', heroContent.backgroundImage && heroContent.backgroundImage.includes('supabase.co'));
    }
  }, [heroContent, heroLoading]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <section className="relative h-[70vh] overflow-x-hidden hero-container-mobile">
        {/* Wheat Field Background */}
        <div className="absolute inset-0 wheat-field-pattern opacity-20"></div>

        {/* Loading skeleton */}
        <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[50vh]">

            {/* Left Column Skeleton */}
            <div className="text-center lg:text-left space-y-8">
              {/* Content loading skeleton */}
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="h-32 w-96 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl animate-pulse flex items-center justify-center">
                  <Pizza className="text-red-400 animate-float" size={64} />
                </div>
              </div>

              {/* Text skeleton */}
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-1/2"></div>
              </div>

              {/* Hours skeleton */}
              <div className="bg-gradient-to-br from-pizza-red/90 to-pizza-orange/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="text-center">
                  <div className="text-5xl mb-4">⏰</div>
                  <div className="h-6 bg-white/20 rounded animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="relative">
              <div className="h-96 md:h-[500px] bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl animate-pulse flex items-center justify-center">
                <Pizza className="text-red-400 animate-float" size={64} />
                <div className="ml-4 text-red-600 font-semibold">
                  Caricamento...
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-pizza-red rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pizza-orange rounded-full animate-bounce animation-delay-200"></div>
            <div className="w-2 h-2 bg-pizza-cheese rounded-full animate-bounce animation-delay-400"></div>
            <span className="text-white text-sm ml-2">Caricamento contenuto...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[70vh] overflow-hidden hero-container-mobile countryside-gradient wheat-field-background">
      {/* Pizza background video - Mobile Optimized - Full Screen Frame */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-10" style={{ height: '70vh', position: 'absolute' }}>
        {!videoError && !(heroContent.backgroundImage && heroContent.backgroundImage.includes('supabase.co')) ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }
            /* Mobile-optimized video display */
            object-cover object-center
            /* Apply mobile-specific CSS class */
            hero-video-mobile
            `}
            style={{
              /* Additional mobile optimizations */
              objectPosition: 'center center',
              /* Full screen video frame coverage */
              width: '100vw',
              height: '70vh',
              minWidth: '100%',
              minHeight: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: -10
            }}
            onLoadedData={() => {
              setVideoLoaded(true);
            }}
            onError={(e) => {
              setVideoError(true);
            }}
          >
            <source src="/20250525_141332.mp4" type="video/mp4" />
          </video>
        ) : null}

        {/* Background image - Full screen background frame */}
        {((heroContent.backgroundImage && heroContent.backgroundImage.includes('supabase.co')) || videoError || !videoLoaded) && (
          <div
            key={heroContent.backgroundImage} // Force re-render when image changes
            className="hero-bg-mobile"
            style={{
              backgroundImage: `url('${heroContent.backgroundImage}')`,
              /* Full screen hero background frame */
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: window.innerWidth < 768 ? 'scroll' : 'fixed',
              /* Full viewport coverage - no white space */
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100vw',
              height: '100%',
              zIndex: -10
            }}
          ></div>
        )}

        {/* Overlay removed - clean background image */}
      </div>

      {/* Decorative elements removed for clean look */}

      <div className="container mx-auto px-4 pt-20 relative z-10" style={{ paddingBottom: 0, marginBottom: 0 }}>
        <div className="grid grid-cols-1 gap-8 items-center min-h-[50vh] hero-main-grid">

          {/* Center Column - Content Only */}
          <div className="text-center space-y-8 animate-fade-in-left">
            {/* Content area - hero image removed, background image now handles visual appeal */}
          </div>

          {/* Right Column - Hero Image - HIDDEN when no heroImage */}
          {heroContent.heroImage && heroContent.heroImage.trim() !== '' && (
            <div
              className="relative animate-fade-in-right animate-stagger-1 hero-image-column"
              style={{
                display: 'block',
                visibility: 'visible',
                opacity: 1,
                position: 'relative',
                zIndex: 25
              }}
            >
              <div
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-red-50 to-orange-50 p-8 hover-lift"
                style={{
                  display: 'block',
                  visibility: 'visible',
                  minHeight: '550px'
                }}
              >
                {/* Hero image loading placeholder */}
                {!heroImageLoaded && (
                  <div className="absolute inset-8 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 animate-pulse flex items-center justify-center">
                    <Pizza className="text-red-400 animate-float" size={64} />
                    <div className="ml-4 text-red-600 font-semibold">
                      Caricamento immagine...
                    </div>
                  </div>
                )}
                <img
                  src={heroContent.heroImage}
                  alt="Delicious authentic Italian pizza"
                  className={`w-full h-96 md:h-[500px] lg:h-[600px] object-cover rounded-2xl transition-opacity duration-700 hover-scale hero-main-image ${
                    heroImageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    display: 'block',
                    visibility: 'visible',
                    position: 'relative',
                    zIndex: 10,
                    height: '500px', // Much bigger height for desktop
                    minHeight: '400px', // Much bigger minimum
                    maxWidth: '100%'
                  }}
                  onLoad={(e) => {
                    setHeroImageLoaded(true);
                    console.log('🍕 [Hero Image] Loaded with computed height:', e.currentTarget.offsetHeight);
                    console.log('🍕 [Hero Image] Inline styles:', e.currentTarget.style.height);
                    console.log('🍕 [Hero Image] CSS classes:', e.currentTarget.className);
                  }}
                  onError={(e) => {
                    // Try fallback image
                    const fallbackImage = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                    if (e.currentTarget.src !== fallbackImage) {
                      e.currentTarget.src = fallbackImage;
                    } else {
                      console.warn('⚠️ [Hero] Fallback image also failed, keeping placeholder');
                      setHeroImageLoaded(false);
                    }
                  }}
                />
                <div className="absolute inset-8 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section - Modern Hero Design */}
        <div className="text-center z-10 relative max-w-6xl mx-auto px-4 space-y-12 animate-fade-in-up animate-stagger-2 mt-12">
          {/* Main Title Section */}
          <div className="space-y-8">
            {/* Welcome Message - Dynamic from Admin */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl italian-heading tracking-tight leading-none wheat-sway" style={{color: 'var(--country-dark)'}}>
                {heroContent.welcomeMessage || 'BENVENUTI DA RURÀL PIZZA'}
              </h1>
            </div>

            {/* Pizza Type - Dynamic Elegant Script Typography */}
            <div className="mb-6">
              <h2 className="text-5xl md:text-7xl lg:text-8xl italian-script wheat-glow" style={{ color: 'var(--wheat-harvest)' }}>
                {heroContent.pizzaType || 'la Pizza Napoletana'}
              </h2>
            </div>

            {/* Subtitle - Dynamic */}
            <h3 className="text-xl md:text-2xl lg:text-3xl italian-subheading font-normal tracking-wide mb-8" style={{color: 'var(--country-brown)'}}>
              {heroContent.subtitle || 'ad Alta Digeribilità, anche Gluten Free!'}
            </h3>

            {/* Opening Hours */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-3 rounded-xl px-6 py-3 border wheat-texture" style={{ backgroundColor: 'var(--wheat-light)', borderColor: 'var(--wheat-amber)' }}>
                <div className="text-2xl">🕐</div>
                <p className="text-lg md:text-xl font-medium">
                  {heroContent.openingHours || 'APERTO 7 SU 7 DALLE 19'}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Pills removed */}

          {/* Info Cards removed */}

          {/* Action Buttons - Premium Design */}
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center pt-8 animate-fade-in-up animate-stagger-2">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {/* Primary CTA - Order Pizza */}
              <button
                onClick={() => {
                  const productsSection = document.getElementById('products');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group relative wheat-btn-primary"
              >
                <span className="relative flex items-center justify-center gap-3 z-10">
                  <Pizza className="group-hover:animate-spin" size={32} />
                  <span className="tracking-wide">{heroContent.buttonText || 'ORDINA LA TUA PIZZA'}</span>
                </span>
              </button>

              {/* Secondary CTA - Call Now */}
              <button
                onClick={() => {
                  window.open('tel:+393713707741', '_self');
                }}
                className="group relative wheat-btn-secondary px-12 py-5 text-xl font-bold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-4 z-10">
                  <Phone className="group-hover:animate-bounce" size={32} />
                  <span className="tracking-wide">📞 CHIAMA ORA</span>
                </span>
              </button>

              {/* Tertiary CTA - Gallery */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    const gallerySection = document.getElementById('gallery');
                    if (gallerySection) {
                      gallerySection.scrollIntoView({ behavior: 'smooth' });
                    }
                  } catch (error) {
                    // Handle error silently
                  }
                }}
                className="group relative wheat-btn-secondary px-12 py-5 text-xl font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                aria-label={t('goToGallery')}
                title={t('goToGallery')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-4 z-10">
                  <Camera className="group-hover:animate-pulse" size={32} />
                  <span className="tracking-wide">📸 {t('gallery').toUpperCase()}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
