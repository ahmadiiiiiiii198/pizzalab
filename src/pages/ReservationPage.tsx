import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Mail, User, MessageSquare, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReservationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  numberOfGuests: number;
  tablePreference: string;
  occasion: string;
  specialRequests: string;
}

const ReservationPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    numberOfGuests: 2,
    tablePreference: 'any',
    occasion: '',
    specialRequests: ''
  });

  // Get today's date for minimum date selection
  const today = new Date().toISOString().split('T')[0];
  
  // Available time slots
  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  // Table preferences
  const tablePreferences = [
    { value: 'any', label: 'Qualsiasi tavolo' },
    { value: 'window', label: 'Vicino alla finestra' },
    { value: 'outdoor', label: 'Esterno (se disponibile)' },
    { value: 'indoor', label: 'Interno' },
    { value: 'private', label: 'Zona riservata' },
    { value: 'quiet', label: 'Zona tranquilla' }
  ];

  // Common occasions
  const occasions = [
    'Cena romantica', 'Compleanno', 'Anniversario', 'Business dinner',
    'Famiglia', 'Amici', 'Celebrazione', 'Appuntamento', 'Altro'
  ];

  const handleInputChange = (field: keyof ReservationFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateReservationNumber = () => {
    return 'RES' + Date.now().toString().slice(-8);
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      toast({
        title: '❌ Nome richiesto',
        description: 'Inserisci il tuo nome per continuare',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.customerEmail.trim() || !formData.customerEmail.includes('@')) {
      toast({
        title: '❌ Email non valida',
        description: 'Inserisci un indirizzo email valido',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        title: '❌ Telefono richiesto',
        description: 'Inserisci il tuo numero di telefono',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.reservationDate) {
      toast({
        title: '❌ Data richiesta',
        description: 'Seleziona la data della prenotazione',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.reservationTime) {
      toast({
        title: '❌ Orario richiesto',
        description: 'Seleziona l\'orario della prenotazione',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.numberOfGuests < 1 || formData.numberOfGuests > 20) {
      toast({
        title: '❌ Numero ospiti non valido',
        description: 'Il numero di ospiti deve essere tra 1 e 20',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const reservationData = {
        reservation_number: generateReservationNumber(),
        customer_name: formData.customerName.trim(),
        customer_email: formData.customerEmail.trim().toLowerCase(),
        customer_phone: formData.customerPhone.trim(),
        reservation_date: formData.reservationDate,
        reservation_time: formData.reservationTime,
        number_of_guests: formData.numberOfGuests,
        table_preference: formData.tablePreference,
        occasion: formData.occasion || null,
        special_requests: formData.specialRequests.trim() || null,
        status: 'pending',
        source: 'website',
        ip_address: null, // Could be populated client-side if needed
        user_agent: navigator.userAgent
      };

      const { data, error } = await supabase
        .from('reservations' as any)
        .insert([reservationData])
        .select()
        .single();

      if (error) {
        console.error('Reservation error:', error);
        toast({
          title: '❌ Errore nella prenotazione',
          description: 'Si è verificato un errore. Riprova o contattaci direttamente.',
          variant: 'destructive'
        });
        return;
      }

      // Success
      toast({
        title: '🎉 Prenotazione inviata!',
        description: `La tua prenotazione ${(data as any)?.reservation_number || 'numero generato'} è stata ricevuta. Ti contatteremo presto per la conferma.`,
      });

      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        reservationDate: '',
        reservationTime: '',
        numberOfGuests: 2,
        tablePreference: 'any',
        occasion: '',
        specialRequests: ''
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: '❌ Errore imprevisto',
        description: 'Si è verificato un errore imprevisto. Riprova più tardi.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🍕 Prenota il tuo tavolo
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
            Vieni a gustare le nostre pizze autentiche in un'atmosfera accogliente
          </p>
          <div className="flex items-center justify-center mt-6 space-x-6 text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Via Roma 123, Milano
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              +39 02 1234567
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Reservation Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-t-lg">
                  <CardTitle className="text-2xl text-orange-800 flex items-center">
                    <Calendar className="w-6 h-6 mr-3" />
                    Dettagli Prenotazione
                  </CardTitle>
                  <CardDescription className="text-orange-600">
                    Compila tutti i campi per prenotare il tuo tavolo
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        👤 Informazioni Personali
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerName" className="flex items-center mb-2">
                            <User className="w-4 h-4 mr-2" />
                            Nome Completo *
                          </Label>
                          <Input
                            id="customerName"
                            type="text"
                            value={formData.customerName}
                            onChange={(e) => handleInputChange('customerName', e.target.value)}
                            placeholder="Il tuo nome e cognome"
                            className="border-orange-200 focus:border-orange-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="customerPhone" className="flex items-center mb-2">
                            <Phone className="w-4 h-4 mr-2" />
                            Telefono *
                          </Label>
                          <Input
                            id="customerPhone"
                            type="tel"
                            value={formData.customerPhone}
                            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                            placeholder="+39 123 456 7890"
                            className="border-orange-200 focus:border-orange-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="customerEmail" className="flex items-center mb-2">
                          <Mail className="w-4 h-4 mr-2" />
                          Email *
                        </Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                          placeholder="tua@email.com"
                          className="border-orange-200 focus:border-orange-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        📅 Dettagli Prenotazione
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="reservationDate" className="flex items-center mb-2">
                            <Calendar className="w-4 h-4 mr-2" />
                            Data *
                          </Label>
                          <Input
                            id="reservationDate"
                            type="date"
                            value={formData.reservationDate}
                            onChange={(e) => handleInputChange('reservationDate', e.target.value)}
                            min={today}
                            className="border-orange-200 focus:border-orange-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="reservationTime" className="flex items-center mb-2">
                            <Clock className="w-4 h-4 mr-2" />
                            Orario *
                          </Label>
                          <Select
                            value={formData.reservationTime}
                            onValueChange={(value) => handleInputChange('reservationTime', value)}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500">
                              <SelectValue placeholder="Seleziona orario" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="numberOfGuests" className="flex items-center mb-2">
                            <Users className="w-4 h-4 mr-2" />
                            Ospiti *
                          </Label>
                          <Select
                            value={formData.numberOfGuests.toString()}
                            onValueChange={(value) => handleInputChange('numberOfGuests', parseInt(value))}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} {num === 1 ? 'persona' : 'persone'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        ⭐ Preferenze
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tablePreference" className="flex items-center mb-2">
                            <MapPin className="w-4 h-4 mr-2" />
                            Preferenza Tavolo
                          </Label>
                          <Select
                            value={formData.tablePreference}
                            onValueChange={(value) => handleInputChange('tablePreference', value)}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tablePreferences.map((pref) => (
                                <SelectItem key={pref.value} value={pref.value}>
                                  {pref.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="occasion" className="flex items-center mb-2">
                            <Star className="w-4 h-4 mr-2" />
                            Occasione
                          </Label>
                          <Select
                            value={formData.occasion}
                            onValueChange={(value) => handleInputChange('occasion', value)}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500">
                              <SelectValue placeholder="Seleziona occasione" />
                            </SelectTrigger>
                            <SelectContent>
                              {occasions.map((occasion) => (
                                <SelectItem key={occasion} value={occasion}>
                                  {occasion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="specialRequests" className="flex items-center mb-2">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Richieste Speciali
                        </Label>
                        <Textarea
                          id="specialRequests"
                          value={formData.specialRequests}
                          onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                          placeholder="Allergie, esigenze particolari, note aggiuntive..."
                          className="border-orange-200 focus:border-orange-500 min-h-[100px]"
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Invio in corso...
                          </>
                        ) : (
                          <>
                            🍕 Prenota Ora
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              
              {/* Restaurant Info */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-t-lg">
                  <CardTitle className="text-green-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Informazioni
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📍 Indirizzo</h4>
                    <p className="text-gray-600">Via Roma 123<br />20121 Milano, MI</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📞 Contatti</h4>
                    <p className="text-gray-600">
                      Tel: +39 02 1234567<br />
                      Email: info@ruralpizza.it
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🕒 Orari</h4>
                    <div className="text-gray-600 space-y-1">
                      <p><strong>Pranzo:</strong> 12:00 - 15:00</p>
                      <p><strong>Cena:</strong> 18:00 - 23:00</p>
                      <p className="text-sm text-orange-600">Chiuso il lunedì</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-t-lg">
                  <CardTitle className="text-blue-800 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Note Importanti
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Le prenotazioni sono confermate entro 2 ore
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Per gruppi oltre 10 persone, chiamaci direttamente
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Cancellazioni gratuite fino a 2 ore prima
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Tavoli esterni soggetti a condizioni meteo
                    </li>
                  </ul>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
