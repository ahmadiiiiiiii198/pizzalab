import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface WhyChooseUsData {
  title: string;
  subtitle: string;
  centralImage: string;
  backgroundImage?: string;
  features: {
    id: string;
    icon: string;
    title: string;
    description: string;
  }[];
}

const WhyChooseUsSection = () => {
  const [data, setData] = useState<WhyChooseUsData>({
    title: "Perché scegliere PIZZALAB?",
    subtitle: "Laboratorio di pizza italiana innovativa dal 2020",
    centralImage: "/placeholder-pizza-lab.jpg",
    backgroundImage: "",
    features: [
      {
        id: "1",
        icon: "🏆",
        title: "Qualità garantita",
        description: "Ingredienti freschi e di prima qualità"
      },
      {
        id: "2",
        icon: "🍕",
        title: "Impasto fatto in casa",
        description: "Preparato quotidianamente con ricette tradizionali"
      },
      {
        id: "3",
        icon: "⚡",
        title: "Consegna in 30 minuti",
        description: "Servizio rapido e puntuale"
      },
      {
        id: "4",
        icon: "😊",
        title: "Clienti sempre felici",
        description: "Soddisfazione garantita al 100%"
      },
      {
        id: "5",
        icon: "🔥",
        title: "Cottura in forno elettrico",
        description: "Tecnologia moderna per risultati perfetti"
      },
      {
        id: "6",
        icon: "🌟",
        title: "Lievitazione da 48 a 72 ore",
        description: "Processo di maturazione per massima digeribilità"
      }
    ]
  });

  const [backgroundRefreshKey, setBackgroundRefreshKey] = useState(Date.now());

  // Load data from database
  useEffect(() => {
    const loadWhyChooseUsData = async () => {
      try {
        const { data: settingsData, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'whyChooseUsContent')
          .single();

        if (settingsData?.value) {
          const value = settingsData.value as any;
          setData(prevData => ({
            title: value.title || prevData.title,
            subtitle: value.subtitle || prevData.subtitle,
            centralImage: value.centralImage || prevData.centralImage,
            features: value.features || prevData.features,
            backgroundImage: value.backgroundImage || ''
          }));
        }
      } catch (error) {
        console.error('Error loading why choose us data:', error);
      }
    };

    loadWhyChooseUsData();
  }, []);

  // Central image with cache busting
  const centralImageUrl = data.centralImage
    ? `${data.centralImage}?v=${backgroundRefreshKey}`
    : null;

  // Create section style with background image if available
  const sectionStyle = data.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${data.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <section
      className="py-12 md:py-24 relative overflow-hidden section-light-warm"
      style={{
        ...sectionStyle
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-300 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-playfair" style={{ color: '#8B4513' }}>
            {data.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-inter font-medium">
            {data.subtitle}
          </p>
        </div>

        {/* Main Content - Features around central image */}
        <div className="relative max-w-6xl mx-auto h-[600px] hidden md:block">
          {/* Desktop layout with absolute positioning */}
          {/* Central Image - Positioned absolutely in center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              {/* Glow effect behind central image - made bigger */}
              <div className="absolute inset-0 w-64 h-64 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>

              {/* Central image container - increased from w-44 h-44 to w-60 h-60 */}
              <div className="relative w-60 h-60 rounded-full overflow-hidden shadow-2xl border-6 border-white bg-white">
                {centralImageUrl ? (
                  <img
                    src={centralImageUrl}
                    alt="PIZZALAB Specialità"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-red-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2 drop-shadow-lg">🧪</div>
                      <div className="text-3xl drop-shadow-lg">🍕</div>
                      <div className="text-xs font-bold mt-2 tracking-wider">PIZZALAB</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Left side features - positioned in a curve */}
          {data.features.slice(0, 3).map((feature, index) => {
            const positions = [
              { top: '12%', left: '8%' },   // Top left
              { top: '45%', left: '3%' },    // Middle left
              { top: '78%', left: '8%' }    // Bottom left
            ];

            return (
              <div
                key={feature.id}
                className="absolute"
                style={positions[index]}
              >
                {/* Connecting line to center with gradient - extended for larger central image */}
                <div className="absolute top-1/2 right-0 w-32 h-0.5 bg-gradient-to-r from-orange-300 to-transparent transform translate-x-full -translate-y-1/2 z-0"></div>

                {/* Feature card - enhanced pill shape */}
                <div className="group bg-gradient-to-r from-orange-50 to-orange-100 rounded-full px-4 py-3 shadow-lg border-2 border-orange-200 w-64 h-12 flex items-center relative z-10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-sm font-bold drop-shadow-sm">{feature.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm font-inter leading-tight group-hover:text-red-700 transition-colors duration-300">
                        {feature.title}
                      </h3>
                    </div>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-200 to-red-200 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
              </div>
            );
          })}

          {/* Right side features - positioned in a curve */}
          {data.features.slice(3, 6).map((feature, index) => {
            const positions = [
              { top: '12%', right: '8%' },   // Top right
              { top: '45%', right: '3%' },    // Middle right
              { top: '78%', right: '8%' }    // Bottom right
            ];

            return (
              <div
                key={feature.id}
                className="absolute"
                style={positions[index]}
              >
                {/* Connecting line to center with gradient - extended for larger central image */}
                <div className="absolute top-1/2 left-0 w-32 h-0.5 bg-gradient-to-l from-orange-300 to-transparent transform -translate-x-full -translate-y-1/2 z-0"></div>

                {/* Feature card - enhanced pill shape */}
                <div className="group bg-gradient-to-l from-orange-50 to-orange-100 rounded-full px-4 py-3 shadow-lg border-2 border-orange-200 w-64 h-12 flex items-center relative z-10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-sm font-bold drop-shadow-sm">{feature.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm font-inter leading-tight group-hover:text-red-700 transition-colors duration-300">
                        {feature.title}
                      </h3>
                    </div>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-l from-orange-200 to-red-200 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Layout - Stack vertically */}
        <div className="block md:hidden space-y-8">
          {/* Central Image for Mobile */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Glow effect behind central image */}
              <div className="absolute inset-0 w-48 h-48 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>

              {/* Central image container */}
              <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white bg-white">
                {centralImageUrl ? (
                  <img
                    src={centralImageUrl}
                    alt="PIZZALAB Specialità"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-red-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-3xl mb-2 drop-shadow-lg">🧪</div>
                      <div className="text-2xl drop-shadow-lg">🍕</div>
                      <div className="text-xs font-bold mt-2 tracking-wider">PIZZALAB</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features Grid for Mobile */}
          <div className="grid grid-cols-1 gap-6 px-4">
            {data.features.map((feature) => (
              <div
                key={feature.id}
                className="group cursor-pointer"
              >
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100 hover:border-orange-200">
                  {/* Feature content */}
                  <div className="flex items-center space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>

                    {/* Text content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg font-inter leading-tight group-hover:text-red-700 transition-colors duration-300 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm font-inter leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-200 to-red-200 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA - Enhanced */}
        <div className="text-center mt-12 md:mt-20">
          <div className="relative inline-block">
            {/* Glow effect behind CTA */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-xl opacity-30 animate-pulse"></div>

            {/* Main CTA button */}
            <div className="relative inline-flex items-center space-x-2 md:space-x-3 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-full shadow-2xl hover:from-red-700 hover:to-red-800 hover:scale-105 transition-all duration-300 cursor-pointer group">
              <span className="text-xl md:text-2xl group-hover:animate-bounce">🧪</span>
              <span className="font-bold text-sm md:text-lg font-inter tracking-wide text-center">
                Il laboratorio della pizza italiana innovativa a Torino
              </span>
              <span className="text-xl md:text-2xl group-hover:animate-bounce">🍕</span>

              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
