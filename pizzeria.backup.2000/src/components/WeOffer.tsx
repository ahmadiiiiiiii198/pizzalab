import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Star, Utensils } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import VideoBackground from './VideoBackground';

const WeOffer = () => {
  const { t } = useLanguage();

  console.log('🍕 [WeOffer] Component rendering...');

  // Default fallback content (only used if database fails)
  const defaultOfferContent = {
    heading: 'Offriamo',
    subheading: 'Scopri le nostre autentiche specialità italiane',
    offers: [
      {
        id: 1,
        title: 'Pizza Metro Finchi 5 Gusti',
        description: 'Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un\'unica creazione straordinaria. Perfetta da condividere con famiglia e amici.',
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: 'Specialità'
      },
      {
        id: 2,
        title: 'Usiamo la Farina 5 Stagioni Gusti, Alta Qualità',
        description: 'Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto per pizza leggero, digeribile e incredibilmente saporito.',
        image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: 'Qualità'
      },
      {
        id: 3,
        title: 'Creiamo Tutti i Tipi di Pizza Italiana di Alta Qualità',
        description: 'Dalla classica Margherita alle specialità gourmet, prepariamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un\'autentica esperienza italiana.',
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: 'Autentica'
      }
    ]
  };

  const [offerContent, setOfferContent] = useState(defaultOfferContent);
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const setupContentAndRealtime = async () => {
      try {
        console.log('🔄 [WeOffer] Starting content load...');
        // Initialize We Offer content in database if it doesn't exist
        const { initializeWeOfferContent } = await import('@/utils/initializeWeOfferContent');
        const loadedContent = await initializeWeOfferContent();

        if (loadedContent && loadedContent.offers && Array.isArray(loadedContent.offers)) {
          setOfferContent(loadedContent);

          // Load background image if available
          if (loadedContent.backgroundImage) {
            setBackgroundImage(loadedContent.backgroundImage);
          }

          // Initialize imagesLoaded state for all offers
          const initialImagesLoaded = {};
          loadedContent.offers.forEach(offer => {
            initialImagesLoaded[offer.id] = false;
          });
          setImagesLoaded(initialImagesLoaded);
          console.log('✅ [WeOffer] Content loaded successfully:', loadedContent);
        } else {
          console.warn('⚠️ [WeOffer] Invalid content structure, using defaults');
          // Keep default content and initialize imagesLoaded
          const initialImagesLoaded = {};
          defaultOfferContent.offers.forEach(offer => {
            initialImagesLoaded[offer.id] = false;
          });
          setImagesLoaded(initialImagesLoaded);
        }

        // Set up real-time listener for admin changes
        const { supabase } = await import('@/integrations/supabase/client');
        const timestamp = Date.now();
        const channelName = `we-offer-updates-${timestamp}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'settings',
            filter: 'key=eq.weOfferContent'
          }, async (payload) => {
            console.log('🔔 [WeOffer] Real-time update received from admin');
            if (payload.new?.value) {
              setOfferContent(payload.new.value);
              // Update imagesLoaded state for new offers
              const newImagesLoaded = {};
              payload.new.value.offers.forEach(offer => {
                newImagesLoaded[offer.id] = false;
              });
              setImagesLoaded(newImagesLoaded);
              console.log('✅ [WeOffer] Content updated from real-time change');
            }
          })
          .subscribe();

        return channel;
      } catch (error) {
        console.error('❌ [WeOffer] Failed to load content, using defaults:', error);
        // Fallback to default content if database fails
        return null;
      }
    };

    let channel: any = null;
    setupContentAndRealtime().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const handleImageLoad = (offerId: number) => {
    setImagesLoaded(prev => ({ ...prev, [offerId]: true }));
  };

  console.log('🍕 [WeOffer] Rendering with content:', offerContent);

  // Create section style with background image if available
  const sectionStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <div
      className="py-20 relative"
      style={sectionStyle}
    >
      {/* Background overlay when using custom background */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/30"></div>
      )}

      {/* Video background when no custom background */}
      {!backgroundImage && (
        <VideoBackground
          videoSrc="/video_preview_h264.mp4"
          className="absolute inset-0"
          overlay={true}
          overlayOpacity={0.2}
          overlayColor="rgba(0, 0, 0, 0.3)"
        />
      )}
      <section id="weoffer" className="relative">
        {/* Pizza-themed background decorations */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pizza-red rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pizza-orange rounded-full blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pizza-green rounded-full blur-xl animate-pulse animation-delay-4000"></div>
        </div>

      {/* Floating pizza icons */}
      <div className="absolute top-20 right-20 text-pizza-orange/20 animate-float">
        <Pizza size={60} />
      </div>
      <div className="absolute bottom-20 left-20 text-pizza-red/20 animate-float animation-delay-2000">
        <ChefHat size={50} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Pizza className="text-pizza-red animate-pizza-spin" size={48} />
            <Star className="text-pizza-orange animate-pulse" size={32} />
            <Utensils className="text-pizza-orange animate-tomato-bounce" size={48} />
            <Star className="text-pizza-green animate-pulse animation-delay-1000" size={32} />
            <Pizza className="text-pizza-green animate-pizza-spin animation-delay-2000" size={48} />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-pizza-dark mb-6 font-fredoka">
            🍕 {offerContent.heading}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-roboto">
            {offerContent.subheading}
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {(offerContent.offers || []).map((offer, index) => (
            <div
              key={offer.id}
              className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover-lift animate-fade-in-up`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                {!imagesLoaded[offer.id] && (
                  <div className="absolute inset-0 bg-gradient-to-br from-flegrea-gold-accent/20 to-flegrea-burgundy/20 animate-pulse flex items-center justify-center">
                    <Pizza className="text-flegrea-gold-accent animate-pizza-spin" size={48} />
                  </div>
                )}

                <img
                  src={offer.image}
                  alt={offer.title}
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                    imagesLoaded[offer.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(offer.id)}
                  onError={(e) => {
                    console.error(`❌ [WeOffer] Image failed to load for offer ${offer.id}`);
                    handleImageLoad(offer.id);
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                {/* Badge */}
                <div className="absolute top-4 left-4 bg-pizza-red text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg animate-bounce-gentle">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>{offer.badge}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-pizza-dark mb-3 font-pacifico group-hover:text-pizza-red transition-colors duration-300">
                  {offer.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-roboto">
                  {offer.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>
    </div>
  );
};

export default WeOffer;
