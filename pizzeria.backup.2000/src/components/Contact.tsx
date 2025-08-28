
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import PatternDivider from "./PatternDivider";
import { useToast } from "@/hooks/use-toast";
import OrderOptionsModal from "./OrderOptionsModal";
import BusinessHoursStatus from "./BusinessHoursStatus";
import { useBusinessHoursContext } from "@/contexts/BusinessHoursContext";
import { supabase } from "@/integrations/supabase/client";

interface ContactContent {
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  hours: string;
  backgroundImage?: string;
}

const Contact = () => {
  const { toast } = useToast();
  const { formattedHours } = useBusinessHoursContext();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    message: ""
  });

  const [availableSeats, setAvailableSeats] = useState(50); // Default value
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [contactContent, setContactContent] = useState<ContactContent>({
    address: "C.so Giulio Cesare, 36, 10152 Torino TO",
    phone: "+393479190907",
    email: "anilamyzyri@gmail.com",
    mapUrl: "https://maps.google.com",
    hours: "lunedì: 11-03\nmartedì: 11-03\nmercoledì: 11-03\ngiovedì: 11-03\nvenerdì: 11-03\nsabato: 11-03\ndomenica: 11-03"
  });
  const [backgroundRefreshKey, setBackgroundRefreshKey] = useState(Date.now());
  
  // Load contact content from database
  const loadContactContent = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contactContent')
        .single();

      if (error) {
        console.error('Error loading contact content:', error);
        return;
      }

      if (data?.value) {
        setContactContent(prev => ({
          ...prev,
          ...data.value
        }));
      }
    } catch (error) {
      console.error('Failed to load contact content:', error);
    }
  };

  useEffect(() => {
    // Load contact content from database
    loadContactContent();

    // Get restaurant settings from localStorage if available
    const settings = localStorage.getItem('restaurantSettings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.totalSeats) {
          setAvailableSeats(parsedSettings.totalSeats);
        }
      } catch (e) {
        console.error('Failed to parse restaurant settings');
      }
    }

    // Get today's date for min date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date') as HTMLInputElement;
    if (dateInput) {
      dateInput.min = today;
    }

    // Set up real-time listener for contact content changes
    const timestamp = Date.now();
    const channelName = `contact-updates-${timestamp}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.contactContent'
      }, async (payload) => {
        console.log('🔔 [Contact] Real-time contact content update received from admin');
        if (payload.new?.value) {
          setContactContent(prev => ({
            ...prev,
            ...payload.new.value
          }));
          console.log('✅ [Contact] Contact content updated from real-time change');

          // Force background refresh if backgroundImage changed
          if (payload.new.value.backgroundImage) {
            console.log('🔄 [Contact] Forcing background refresh...');
            setBackgroundRefreshKey(Date.now());
          }
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Form validation
    if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.guests) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Validate guests count
    const guestsCount = parseInt(formData.guests, 10);
    if (isNaN(guestsCount) || guestsCount <= 0) {
      toast({
        title: "Invalid guests count",
        description: "Please enter a valid number of guests",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    if (guestsCount > availableSeats) {
      toast({
        title: "Not enough seats available",
        description: `Sorry, we can only accommodate up to ${availableSeats} guests per reservation`,
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    // In a real app, this would send data to a backend and check actual availability
    // Save reservation to localStorage for demo purposes
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const newReservation = {
      id: Date.now(),
      ...formData,
      status: 'pending'
    };
    
    reservations.push(newReservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
    
    toast({
      title: "Reservation Requested",
      description: `Thank you ${formData.name}! Your reservation for ${formData.guests} guests on ${formData.date} at ${formData.time} has been received.`,
    });
    
    // Reset form
    setFormData({
      name: "",
      phone: "",
      date: "",
      time: "",
      guests: "",
      message: ""
    });
    setIsSubmitting(false);
  };
  
  // Create a style object for the background with cache busting
  const backgroundImageUrl = contactContent.backgroundImage ?
    `${contactContent.backgroundImage}${contactContent.backgroundImage.includes('?') ? '&' : '?'}t=${backgroundRefreshKey}` :
    undefined;

  const sectionStyle = {
    backgroundImage: backgroundImageUrl ?
      `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('${backgroundImageUrl}')` :
      undefined,
    backgroundSize: backgroundImageUrl ? 'cover' : undefined,
    backgroundPosition: backgroundImageUrl ? 'center' : undefined,
  };

  // Debug logging
  console.log('🖼️ [Contact] Background image URL:', contactContent.backgroundImage);
  console.log('🔄 [Contact] Background with cache busting:', backgroundImageUrl);
  console.log('🎨 [Contact] Section style:', sectionStyle);
  
  return (
    <>
      <section
        id="contact"
        className="py-24 timeout-bg-primary relative overflow-hidden"
        style={sectionStyle}
      >
        {/* Basketball court background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 border-2 border-timeout-orange rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 border-2 border-timeout-orange rounded-full"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-timeout-orange"></div>
        </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl text-center timeout-heading font-bold mb-2 timeout-text-primary">
          Contatta <span className="timeout-text-accent">Time Out Pizza</span>
        </h2>
        <p className="text-center timeout-text-secondary mb-10 max-w-3xl mx-auto">
          Ci piacerebbe sentirti e accoglierti nella nostra arena del gusto
        </p>
        
        <PatternDivider className="opacity-70" />
        
        <div className="grid md:grid-cols-2 gap-10">
          <div className="timeout-bg-card p-6 rounded-lg backdrop-blur border border-timeout-orange/20">
            <h3 className="text-2xl timeout-heading timeout-text-accent mb-6">🏀 Fai un Ordine</h3>

            <div className="space-y-4">
              <p className="timeout-text-secondary mb-6">
                Scegli come vuoi ordinare: dalle nostre pizze leggendarie o con una richiesta personalizzata da campione.
              </p>

              <Button
                onClick={() => setIsOrderModalOpen(true)}
                className="timeout-btn-primary w-full py-3 text-lg font-semibold hover:scale-105 transition-transform"
              >
                🍕 Inizia il Tuo Ordine
              </Button>

              {/* Business Hours Status */}
              <div className="mt-4">
                <BusinessHoursStatus variant="banner" />
              </div>
            </div>
          </div>

          <div>
            <div className="timeout-bg-card p-6 rounded-lg backdrop-blur mb-6 border border-timeout-orange/20">
              <h3 className="text-2xl timeout-heading timeout-text-accent mb-6">📍 Trovaci</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="timeout-text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium timeout-text-primary">Indirizzo</h4>
                    <p className="timeout-text-secondary">{contactContent.address}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="timeout-text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium timeout-text-primary">Telefono</h4>
                    <p className="timeout-text-secondary">{contactContent.phone}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="timeout-text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium timeout-text-primary">Email</h4>
                    <p className="timeout-text-secondary">{contactContent.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="timeout-text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium timeout-text-primary">Orari</h4>
                    <p className="timeout-text-secondary whitespace-pre-line">{contactContent.hours || formattedHours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="timeout-bg-card p-6 rounded-lg backdrop-blur border border-timeout-orange/20">
              <h3 className="text-2xl timeout-heading timeout-text-accent mb-4">🏆 Newsletter</h3>
              <p className="timeout-text-secondary mb-4">Iscriviti per ricevere aggiornamenti su eventi speciali e promozioni da campione</p>

              <div className="flex gap-2">
                <Input
                  placeholder="La tua email"
                  className="bg-timeout-medium-gray/50 border-timeout-orange/30 timeout-text-primary placeholder:text-timeout-text-gray"
                />
                <Button
                  className="timeout-btn-primary hover:scale-105 transition-transform"
                  onClick={() => toast({ title: "Iscritto!", description: "Grazie per esserti iscritto alla nostra newsletter da campioni." })}
                >
                  Iscriviti
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      <OrderOptionsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </>
  );
};

export default Contact;
