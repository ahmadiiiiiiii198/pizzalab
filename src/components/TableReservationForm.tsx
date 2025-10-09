import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReservationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  numberOfGuests: number;
  specialRequests: string;
}

export const TableReservationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    numberOfGuests: 2,
    specialRequests: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate reservation number
      const reservationNumber = `RES-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Insert reservation into database
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            reservation_number: reservationNumber,
            customer_name: formData.customerName,
            customer_email: formData.customerEmail,
            customer_phone: formData.customerPhone,
            reservation_date: formData.reservationDate,
            reservation_time: formData.reservationTime,
            number_of_guests: formData.numberOfGuests,
            special_requests: formData.specialRequests,
            status: 'pending',
            source: 'website'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create initial notification record
      await supabase.from('reservation_notifications').insert([
        {
          reservation_id: data.id,
          notification_type: 'confirmation',
          recipient_email: formData.customerEmail,
          subject: `Richiesta Prenotazione Ricevuta - ${reservationNumber}`,
          message: `Gentile ${formData.customerName}, abbiamo ricevuto la tua richiesta di prenotazione per ${formData.numberOfGuests} persone il ${formData.reservationDate} alle ${formData.reservationTime}. Ti confermeremo a breve!`,
          delivery_status: 'pending'
        }
      ]);

      toast({
        title: '🎉 Richiesta Inviata!',
        description: `La tua prenotazione (${reservationNumber}) è in attesa di conferma. Riceverai un'email a breve.`,
        duration: 6000
      });

      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        reservationDate: '',
        reservationTime: '',
        numberOfGuests: 2,
        specialRequests: ''
      });

    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: '❌ Errore',
        description: 'Si è verificato un errore durante l\'invio della prenotazione. Riprova.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value
    }));
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get maximum date (3 months from now)
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-2xl wheat-texture" style={{backgroundColor: 'var(--wheat-cream)', border: '2px solid var(--wheat-golden)', boxShadow: '0 8px 30px rgba(193, 154, 107, 0.2)'}}>
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-3 italian-heading" style={{color: 'var(--country-dark)'}}>
          🌾 Prenota un Tavolo
        </h2>
        <p className="text-lg italian-body" style={{color: 'var(--country-brown)'}}>
          Riserva il tuo posto nella nostra trattoria. Ti confermeremo la prenotazione via email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 italian-body" style={{color: 'var(--country-dark)'}}>
              Nome Completo *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
              placeholder="Mario Rossi"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 italian-body" style={{color: 'var(--country-dark)'}}>
              Email *
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
              placeholder="mario.rossi@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 italian-body" style={{color: 'var(--country-dark)'}}>
            Telefono *
          </label>
          <input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            placeholder="+39 123 456 7890"
          />
        </div>

        {/* Reservation Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
              <Calendar size={18} style={{color: 'var(--wheat-harvest)'}} />
              Data *
            </label>
            <input
              type="date"
              name="reservationDate"
              value={formData.reservationDate}
              onChange={handleChange}
              required
              min={minDate}
              max={maxDate}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
              <Clock size={18} style={{color: 'var(--wheat-harvest)'}} />
              Ora *
            </label>
            <select
              name="reservationTime"
              value={formData.reservationTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            >
              <option value="">Seleziona orario</option>
              <option value="12:00">12:00 - Pranzo</option>
              <option value="12:30">12:30 - Pranzo</option>
              <option value="13:00">13:00 - Pranzo</option>
              <option value="13:30">13:30 - Pranzo</option>
              <option value="19:00">19:00 - Cena</option>
              <option value="19:30">19:30 - Cena</option>
              <option value="20:00">20:00 - Cena</option>
              <option value="20:30">20:30 - Cena</option>
              <option value="21:00">21:00 - Cena</option>
              <option value="21:30">21:30 - Cena</option>
              <option value="22:00">22:00 - Cena</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
            <Users size={18} style={{color: 'var(--wheat-harvest)'}} />
            Numero Ospiti *
          </label>
          <select
            name="numberOfGuests"
            value={formData.numberOfGuests}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'persone'}</option>
            ))}
          </select>
        </div>


        <div>
          <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
            <MessageSquare size={18} style={{color: 'var(--wheat-harvest)'}} />
            Richieste Speciali
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            placeholder="Allergie, seggiolone per bambini, decorazioni speciali, ecc..."
          />
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--wheat-light)', border: '1px solid var(--wheat-amber)'}}>
          <p className="text-sm italian-body" style={{color: 'var(--country-brown)'}}>
            ℹ️ <strong>Nota:</strong> La tua prenotazione sarà confermata dal nostro staff entro 24 ore. 
            Riceverai un'email di conferma all'indirizzo fornito.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full wheat-btn-primary py-4 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Invio in corso...
            </>
          ) : (
            <>
              <Calendar size={24} />
              Invia Richiesta di Prenotazione
            </>
          )}
        </button>

        <p className="text-center text-sm italic" style={{color: 'var(--country-brown)'}}>
          * Campi obbligatori
        </p>
      </form>
    </div>
  );
};
