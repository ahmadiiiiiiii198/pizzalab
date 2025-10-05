import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Star, Heart } from 'lucide-react';

const TwoImageSection = () => {
  const [sectionContent, setSectionContent] = useState({
    leftImage: {
      url: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Tradizione Italiana",
      description: "Da 14 anni serviamo la migliore pizza italiana nel cuore di Torino. La nostra passione per la tradizione culinaria italiana si riflette in ogni pizza che prepariamo con ingredienti freschi e di qualità."
    },
    rightImage: {
      url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Ingredienti Freschi",
      description: "Utilizziamo solo ingredienti freschi e di prima qualità. La nostra mozzarella viene preparata quotidianamente, i pomodori sono selezionati dalle migliori coltivazioni italiane e l'impasto viene lavorato a mano ogni giorno."
    }
  });

  const [imagesLoaded, setImagesLoaded] = useState({
    left: false,
    right: false
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { settingsService } = await import('@/services/settingsService');
        await settingsService.initialize();
        
        const loadedContent = await settingsService.getSetting('twoImageSection', sectionContent);
        setSectionContent(loadedContent);
      } catch (error) {
        console.log('Using default two-image section content');
      }
    };

    loadContent();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-800 mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
              La Nostra Storia
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Scopri la passione e la dedizione che mettiamo in ogni pizza
          </p>
        </div>

        {/* Two Image Grid */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Image Section */}
          <div className="animate-fade-in-left">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-red-100 to-orange-100">
                {!imagesLoaded.left && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 animate-pulse flex items-center justify-center">
                    <ChefHat className="text-red-400 animate-bounce" size={48} />
                  </div>
                )}
                <img
                  src={sectionContent.leftImage.url}
                  alt={sectionContent.leftImage.title}
                  className={`w-full h-80 md:h-96 object-cover transition-all duration-700 group-hover:scale-105 ${
                    imagesLoaded.left ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImagesLoaded(prev => ({ ...prev, left: true }))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                
                {/* Floating Badge */}
                <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce-gentle">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>Tradizione</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Left Content */}
            <div className="mt-8 animate-fade-in-up animate-stagger-1">
              <h3 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-4">
                {sectionContent.leftImage.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {sectionContent.leftImage.description}
              </p>
              
              {/* Stats */}
              <div className="flex items-center space-x-6 mt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">14 Anni</span>
                </div>
                <div className="flex items-center space-x-2 text-orange-500">
                  <Heart className="w-5 h-5" />
                  <span className="font-semibold">1000+ Clienti</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image Section */}
          <div className="animate-fade-in-right animate-stagger-1">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-orange-100 to-red-100">
                {!imagesLoaded.right && (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 animate-pulse flex items-center justify-center">
                    <Star className="text-orange-400 animate-spin" size={48} />
                  </div>
                )}
                <img
                  src={sectionContent.rightImage.url}
                  alt={sectionContent.rightImage.title}
                  className={`w-full h-80 md:h-96 object-cover transition-all duration-700 group-hover:scale-105 ${
                    imagesLoaded.right ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImagesLoaded(prev => ({ ...prev, right: true }))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                
                {/* Floating Badge */}
                <div className="absolute top-6 right-6 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse-glow">
                  <div className="flex items-center space-x-2">
                    <ChefHat className="w-4 h-4" />
                    <span>Qualità</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Content */}
            <div className="mt-8 animate-fade-in-up animate-stagger-2">
              <h3 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-4">
                {sectionContent.rightImage.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {sectionContent.rightImage.description}
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Ingredienti Freschi</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Impasto Fatto a Mano</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Ricette Tradizionali</span>
                </div>
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Forno a Legna</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwoImageSection;
