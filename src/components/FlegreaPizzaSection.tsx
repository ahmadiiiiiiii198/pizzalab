import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContentSection {
  id: string;
  section_key: string;
  section_name: string;
  title: string;
  content: string;
  content_type: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  metadata: any;
}

const FlegreaPizzaSection = () => {
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('content_sections')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) {
          console.error('Error loading content sections:', error);
        } else {
          console.log('Frontend: Loaded content sections:', data);
          setContentSections(data || []);
        }
      } catch (error) {
        console.error('Error loading content sections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();

    // Set up real-time subscription for content_sections changes
    const subscription = supabase
      .channel('content_sections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_sections'
        },
        (payload) => {
          console.log('Frontend: Real-time update received:', payload);
          // Reload content when any change occurs
          loadContent();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-300 rounded-lg"></div>
              <div className="h-64 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const mainSection = contentSections.find(section => section.section_key === 'flegrea_section');
  const restaurantImage = contentSections.find(section => section.section_key === 'flegrea_image_1');
  const pizzaImage = contentSections.find(section => section.section_key === 'flegrea_image_2');
  const pizzaBoxImage = contentSections.find(section => section.section_key === 'flegrea_image_3');

  if (!mainSection) {
    return null;
  }

  const metadata = mainSection.metadata || {};

  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-400 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-400 rounded-full blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left side - Restaurant Interior Image */}
          <div className="lg:col-span-4 relative">
            {restaurantImage && (
              <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                <img
                  src={restaurantImage.image_url}
                  alt={restaurantImage.metadata?.alt_text || "Restaurant interior"}
                  className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            )}
          </div>

          {/* Middle - Pizza Images Column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Top Pizza Image */}
            {pizzaImage && (
              <div className="relative overflow-hidden rounded-xl shadow-lg group">
                <img
                  src={pizzaImage.image_url}
                  alt={pizzaImage.metadata?.alt_text || "Neapolitan pizza"}
                  className="w-full h-60 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            )}

            {/* Bottom Pizza Box Image */}
            {pizzaBoxImage && (
              <div className="relative overflow-hidden rounded-xl shadow-lg group">
                <img
                  src={pizzaBoxImage.image_url}
                  alt={pizzaBoxImage.metadata?.alt_text || "Pizza presentation"}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            )}
          </div>

          {/* Right side - Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header */}
            <div className="text-left">
              <p className="text-sm font-medium text-orange-600 mb-3 tracking-wider uppercase">
                {mainSection.title}
              </p>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-800 mb-6 leading-tight">
                <span className="italic">Gusta la nostra pizza in stile</span>
                <br />
                <span className="italic">napoletano dall'ottimo</span>
                <br />
                <span className="italic">cornicione alveolato.</span>
              </h2>
            </div>

            {/* Content */}
            <div className="space-y-4 text-gray-700">
              <p className="text-base leading-relaxed">
                {metadata.subtitle}
              </p>
              <p className="leading-relaxed">
                Le <strong>materie prime utilizzate sono di assoluta qualità</strong> con <strong>prodotti DOP, IGP e Slow Food</strong> provenienti dai migliori produttori e artigiani campani (e non).
              </p>
              <p className="leading-relaxed">
                {metadata.description_2}
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                className="bg-amber-800 hover:bg-amber-900 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: metadata.button_color || '#8B4513' }}
              >
                {metadata.button_text || 'SCOPRI DI PIÙ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlegreaPizzaSection;
