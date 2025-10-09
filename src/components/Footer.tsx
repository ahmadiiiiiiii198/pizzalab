
import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { useBusinessHoursContext } from '@/contexts/BusinessHoursContext';
import { useLanguage } from '@/hooks/use-language';
import { usePizzeriaHours } from '@/hooks/usePizzeriaHours';
import { supabase } from '@/integrations/supabase/client';

interface ContactContent {
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  hours: string;
  backgroundImage?: string;
}

const Footer = () => {
  const { formattedHours } = useBusinessHoursContext();
  const { allHours } = usePizzeriaHours();
  const { t } = useLanguage();
  const [contactContent, setContactContent] = useState<ContactContent>({
    address: "Via Vigone 40c, 10127 Torino TO",
    phone: "379 145 6967",
    email: "info.pizzatimeout@gmail.com",
    mapUrl: "https://maps.google.com",
    hours: ""
  });

  // Load contact content from database
  useEffect(() => {
    const loadContactContent = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'contactContent')
          .single();

        if (data?.value && typeof data.value === 'object') {
          const value = data.value as Partial<ContactContent>;
          setContactContent(prev => ({
            ...prev,
            ...value
          }));
        }
      } catch (error) {
        console.error('Failed to load contact content:', error);
      }
    };

    loadContactContent();

    // Set up real-time listener for contact content changes
    const timestamp = Date.now();
    const channelName = `footer-contact-updates-${timestamp}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.contactContent'
      }, async (payload) => {
        console.log('🔔 [Footer] Real-time contact content update received from admin');
        if (payload.new?.value && typeof payload.new.value === 'object') {
          const value = payload.new.value as Partial<ContactContent>;
          setContactContent(prev => ({
            ...prev,
            ...value
          }));
          console.log('✅ [Footer] Contact content updated from real-time change');
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Create footer style with background image if available
  const footerStyle = contactContent.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(254, 247, 205, 0.95), rgba(254, 247, 205, 0.95)), url(${contactContent.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderColor: 'var(--wheat-golden)'
      }
    : {
        backgroundColor: 'var(--wheat-cream)',
        borderColor: 'var(--wheat-golden)'
      };

  return (
    <footer className="py-16 border-t-2 wheat-texture" style={footerStyle}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-full border-2 wheat-glow" style={{ borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--wheat-light)' }}>
                <Pizza className="h-8 w-8" />
              </div>
              <div>
                <h3 className="italian-heading font-bold text-xl" style={{ color: 'var(--country-dark)' }}>RURÀL PIZZA</h3>
                <p className="italian-script" style={{ color: 'var(--wheat-harvest)' }}>Laboratorio di Pizza Italiana</p>
              </div>
            </div>
            <p className="italian-body mb-6 max-w-md" style={{ color: 'var(--country-brown)' }}>
              Laboratorio di pizza italiana innovativa nel cuore di Torino.
              Tradizione, innovazione e passione in ogni pizza.
            </p>
            <div className="space-y-2 text-sm italian-body">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="" />
                <p>{contactContent.address}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="" />
                <p>Tel: {contactContent.phone}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="" />
                <p>Email: {contactContent.email}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="italian-subheading font-semibold mb-4" style={{ color: 'var(--country-dark)' }}>Menu</h3>
            <ul className="space-y-2 italian-body">
              <li><a href="#home" className="transition-colors" style={{ color: 'var(--country-brown)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--wheat-harvest)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--country-brown)'}>Home</a></li>
              <li><a href="#products" className="transition-colors" style={{ color: 'var(--country-brown)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--wheat-harvest)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--country-brown)'}>Le Nostre Pizze</a></li>
              <li><a href="#categories" className="transition-colors" style={{ color: 'var(--country-brown)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--wheat-harvest)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--country-brown)'}>Categorie</a></li>
              <li><a href="#about" className="transition-colors" style={{ color: 'var(--country-brown)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--wheat-harvest)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--country-brown)'}>Chi Siamo</a></li>
              <li><a href="#contact" className="transition-colors" style={{ color: 'var(--country-brown)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--wheat-harvest)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--country-brown)'}>Contatti</a></li>
            </ul>
          </div>

          <div>
            <h3 className="italian-subheading font-semibold mb-4" style={{ color: 'var(--country-dark)' }}>{t('ourServices')}</h3>
            <ul className="space-y-2 italian-body">
              <li>{t('homeDelivery')}</li>
              <li>{t('takeAway')}</li>
            </ul>
          </div>

          <div>
            <h3 className="italian-subheading font-semibold mb-4" style={{ color: 'var(--country-dark)' }}>{t('openingHours')}</h3>
            <div className="italian-body text-sm leading-relaxed whitespace-pre-line">
              {contactContent.hours || allHours || formattedHours || t('defaultHours')}
            </div>
          </div>
        </div>
        <div className="border-t-2 mt-8 pt-8 text-center italian-body" style={{ borderColor: 'var(--wheat-amber)' }}>
          <p style={{ color: 'var(--country-brown)' }}>&copy; 2024 Ruràl Pizza - Laboratorio di Pizza Italiana. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
