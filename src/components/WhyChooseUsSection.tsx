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
    title: "Perché scegliere TIME OUT PIZZA?",
    subtitle: "Autentica pizza italiana e passione per il basket dal 2025",
    centralImage: "/placeholder-basketball-pizza.jpg",
    backgroundImage: "",
    features: [
      {
        id: "1",
        icon: "🍕",
        title: "Pizza Autentica",
        description: "Ricette tradizionali italiane"
      },
      {
        id: "2",
        icon: "🏀",
        title: "Atmosfera Basket",
        description: "Ambiente unico da arena"
      },
      {
        id: "3",
        icon: "⚡",
        title: "Servizio Veloce",
        description: "Consegna in 30 minuti"
      },
      {
        id: "4",
        icon: "🌟",
        title: "Ingredienti Freschi",
        description: "Qualità da campioni"
      },
      {
        id: "5",
        icon: "🔥",
        title: "Cottura Perfetta",
        description: "Forno a legna tradizionale"
      },
      {
        id: "6",
        icon: "🏆",
        title: "Soddisfazione",
        description: "Clienti sempre felici"
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
      className="py-20 timeout-bg-primary relative overflow-hidden"
      style={sectionStyle}
    >
      {/* Basketball court background decorations */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-40 h-40 bg-timeout-orange rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-timeout-orange-hover rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
        {/* Basketball court center circle */}
        <div className="absolute top-1/2 left-1/2 w-64 h-64 border-2 border-timeout-orange rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-10"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-timeout-orange opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold timeout-text-primary mb-4 timeout-heading">
            {data.title}
          </h2>
          <p className="text-xl timeout-text-secondary max-w-3xl mx-auto font-raleway">
            {data.subtitle}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Features */}
          <div className="space-y-8">
            {data.features.slice(0, 3).map((feature, index) => (
              <div
                key={feature.id}
                className="flex items-center space-x-4"
              >
                {/* Orange circular icon */}
                <div className="w-16 h-16 bg-timeout-orange rounded-full flex items-center justify-center shadow-lg flex-shrink-0 hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">{feature.icon}</span>
                </div>
                {/* Dark themed frame */}
                <div className="timeout-bg-card rounded-full px-6 py-4 shadow-md flex-1 border border-timeout-orange/20">
                  <h3 className="font-bold timeout-text-primary text-lg">
                    {feature.title}
                  </h3>
                  <p className="timeout-text-secondary text-sm mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Central Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl border-4 border-timeout-orange/30">
                {centralImageUrl ? (
                  <img
                    src={centralImageUrl}
                    alt="Time Out Pizza Specialità"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-timeout-dark-gray to-timeout-black flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">🏀</div>
                      <div className="text-4xl">🍕</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Basketball decoration around image */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-timeout-orange rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-timeout-orange-hover rounded-full animate-bounce animation-delay-1000"></div>
            </div>
          </div>

          {/* Right Features */}
          <div className="space-y-8">
            {data.features.slice(3, 6).map((feature, index) => (
              <div
                key={feature.id}
                className="flex items-center space-x-4"
              >
                {/* Dark themed frame */}
                <div className="timeout-bg-card rounded-full px-6 py-4 shadow-md flex-1 border border-timeout-orange/20 text-right">
                  <h3 className="font-bold timeout-text-primary text-lg">
                    {feature.title}
                  </h3>
                  <p className="timeout-text-secondary text-sm mt-1">
                    {feature.description}
                  </p>
                </div>
                {/* Orange circular icon */}
                <div className="w-16 h-16 bg-timeout-orange rounded-full flex items-center justify-center shadow-lg flex-shrink-0 hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">{feature.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 timeout-bg-secondary px-6 py-3 rounded-full border border-timeout-orange/30">
            <span className="text-2xl">🏀</span>
            <span className="timeout-text-primary font-semibold timeout-heading">
              La scelta migliore per pizza e basket a Torino
            </span>
            <span className="text-2xl">🍕</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
