import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  hours: string;
  backgroundImage?: string;
}

const ContactSection = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: 'Via Vigone 40c, Torino',
    phone: '379 145 6967',
    email: 'info.pizzatimeout@gmail.com',
    hours: 'lunedì: Chiuso\nmartedì: 12:00-14:30 / 18:30-22:30\nmercoledì: 12:00-14:30 / 18:30-22:30\ngiovedì: 12:00-14:30 / 18:30-22:30\nvenerdì: 12:00-14:30 / 18:30-22:30\nsabato: 18:00-23:00\ndomenica: 18:00-23:00'
  });

  // Load contact info from database
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        console.log('📞 [ContactSection] Loading contact info from database...');
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'contactContent')
          .single();

        if (!error && data?.value) {
          console.log('✅ [ContactSection] Contact info loaded:', data.value);
          setContactInfo(prev => ({
            ...prev,
            ...data.value
          }));
        } else {
          console.log('⚠️ [ContactSection] No contact info found, using defaults');
        }
      } catch (error) {
        console.error('❌ [ContactSection] Error loading contact info:', error);
      }
    };

    loadContactInfo();

    // Set up real-time listener for contact info changes
    const channel = supabase
      .channel('contact-info-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.contactContent'
      }, (payload) => {
        console.log('🔔 [ContactSection] Real-time contact info update received');
        if (payload.new?.value) {
          setContactInfo(prev => ({
            ...prev,
            ...payload.new.value
          }));
          console.log('✅ [ContactSection] Contact info updated from real-time change');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Create section style with background image if available
  const sectionStyle = contactInfo.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${contactInfo.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <section
      id="contact"
      className="py-20 section-light-warm relative overflow-hidden"
      style={sectionStyle}
    >
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 timeout-heading text-gradient-orange">
            Contatti
          </h2>
          <p className="text-orange-600 text-lg font-medium">
            Vieni a trovarci o ordina direttamente online
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Phone Card */}
          <div className="card-light-elevated rounded-lg p-6 text-center border border-orange-200 hover:border-orange-400 transition-colors">
            <div className="flex justify-center mb-4">
              <Phone className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-gray-800 text-lg font-semibold mb-2">Telefono</h3>
            <p className="text-gray-600 mb-4">{contactInfo.phone}</p>
            <div className="space-y-2">
              <a
                href="#products"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block wheat-btn-primary px-6 py-3 font-semibold"
              >
                Ordina Ora
              </a>
              <a
                href={`tel:${contactInfo.phone}`}
                className="block wheat-btn-secondary px-6 py-3 font-semibold"
              >
                Chiama Ora
              </a>
            </div>
          </div>

          {/* Email Card */}
          <div className="card-light-elevated rounded-lg p-6 text-center border border-orange-200 hover:border-orange-400 transition-colors">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-gray-800 text-lg font-semibold mb-2">Email</h3>
            <p className="text-gray-600 mb-4 text-sm break-all">{contactInfo.email}</p>
            <a
              href={`mailto:${contactInfo.email}`}
              className="block wheat-btn-primary px-6 py-3 font-semibold"
            >
              Invia Email
            </a>
          </div>

          {/* Hours Card */}
          <div className="card-light-elevated rounded-lg p-6 text-center border border-orange-200 hover:border-orange-400 transition-colors">
            <div className="flex justify-center mb-4">
              <Clock className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-gray-800 text-lg font-semibold mb-2">Orari</h3>
            <div className="text-gray-600 text-sm space-y-1">
              {contactInfo.hours.split('\n').map((line, index) => {
                const [day, hours] = line.split(': ');
                return (
                  <div key={index} className="flex justify-between">
                    <span>{day.toUpperCase()}:</span>
                    <span>{hours}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Address Card */}
          <div className="card-light-elevated rounded-lg p-6 text-center border border-orange-200 hover:border-orange-400 transition-colors">
            <div className="flex justify-center mb-4">
              <MapPin className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-gray-800 text-lg font-semibold mb-2">Indirizzo</h3>
            <p className="text-gray-600 mb-2 text-sm">{contactInfo.address}</p>
            <p className="text-gray-500 text-xs mb-4 italic">Se ti perdi, segui il profumo della pizza! 🍕</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block wheat-btn-primary px-6 py-3 font-semibold"
            >
              Visualizza Mappa
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
