import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ServicesSection = () => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'servicesContent')
          .single();

        if (!error && data?.value?.backgroundImage) {
          setBackgroundImage(data.value.backgroundImage);
        }
      } catch (error) {
        console.error('Error loading Services section background:', error);
      }
    };

    loadBackgroundImage();
  }, []);

  const services = [
    {
      icon: <Truck className="w-12 h-12 timeout-text-accent" />,
      title: "Consegna a Domicilio",
      description: "Consegniamo le nostre pizze leggendarie direttamente a casa tua"
    },
    {
      icon: <ShoppingBag className="w-12 h-12 timeout-text-accent" />,
      title: "Take Away",
      description: "Ordina e ritira le tue pizze da campione da asporto"
    }
  ];

  // Create section style with background image if available
  const sectionStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <section className="py-16 section-light-warm relative overflow-hidden" style={sectionStyle}>
      {/* Pizza-themed decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-timeout-orange"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-timeout-orange rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold timeout-text-primary mb-4 timeout-heading">
            <span className="timeout-text-accent italic">I Nostri Servizi</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-timeout-orange to-timeout-orange-hover mx-auto mb-6"></div>
          <p className="text-lg timeout-text-secondary max-w-2xl mx-auto font-roboto">
            Scopri tutti i servizi che offriamo per rendere la tua esperienza da campione indimenticabile
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto justify-items-center">
          {services.map((service, index) => (
            <div
              key={index}
              className="timeout-bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group hover:shadow-timeout-orange/20"
            >
              {/* Icon Container */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-timeout-medium-gray to-timeout-dark-gray rounded-2xl group-hover:from-timeout-orange/20 group-hover:to-timeout-orange-hover/20 transition-all duration-300">
                  {service.icon}
                </div>
              </div>

              {/* Service Title */}
              <h3 className="text-lg font-semibold timeout-text-primary text-center mb-3 timeout-heading leading-tight">
                {service.title}
              </h3>

              {/* Service Description */}
              <p className="timeout-text-secondary text-center text-sm leading-relaxed font-roboto">
                {service.description}
              </p>

              {/* Decorative Element */}
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-0.5 bg-gradient-to-r from-timeout-orange to-timeout-orange-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 timeout-bg-secondary px-6 py-3 rounded-full shadow-md border border-timeout-orange/30">
            <span className="text-2xl">🍕</span>
            <span className="timeout-text-primary font-medium font-roboto">
              Vieni a scoprire il nostro laboratorio del gusto!
            </span>
            <span className="timeout-text-accent text-2xl">👨‍🍳</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
