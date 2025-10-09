import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Users, Mail, Phone, MapPin, MessageSquare, Gift, UserPlus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export const AdminReservationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    numberOfGuests: 2,
    tablePreference: 'any',
    occasion: 'other',
    specialRequests: '',
    adminNotes: '',
    autoConfirm: true
  });

  useEffect(() => {
    fetchExistingCustomers();
  }, []);

  const fetchExistingCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('customer_name, customer_email, customer_phone')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Remove duplicates based on email
      const uniqueCustomers = Array.from(
        new Map(data?.map(item => [item.customer_email, item])).values()
      );

      setExistingCustomers(uniqueCustomers as Customer[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.customer_name,
      customerEmail: customer.customer_email,
      customerPhone: customer.customer_phone
    }));
    setSearchTerm(customer.customer_name);
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = existingCustomers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_phone.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const adminUsername = localStorage.getItem('admin_username') || 'admin';
      const reservationNumber = `RES-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Insert reservation
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
            table_preference: formData.tablePreference,
            occasion: formData.occasion,
            special_requests: formData.specialRequests,
            notes: formData.adminNotes,
            status: formData.autoConfirm ? 'confirmed' : 'pending',
            confirmed_by: formData.autoConfirm ? adminUsername : null,
            confirmed_at: formData.autoConfirm ? new Date().toISOString() : null,
            source: 'admin'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create notification if auto-confirmed
      if (formData.autoConfirm && data) {
        await supabase.from('reservation_notifications').insert([
          {
            reservation_id: data.id,
            notification_type: 'confirmation',
            recipient_email: formData.customerEmail,
            subject: `✅ Prenotazione Confermata - ${reservationNumber}`,
            message: `Gentile ${formData.customerName}, la tua prenotazione per ${formData.numberOfGuests} persone il ${new Date(formData.reservationDate).toLocaleDateString('it-IT')} alle ${formData.reservationTime} è stata CONFERMATA! Ti aspettiamo! 🍕`,
            delivery_status: 'pending'
          }
        ]);
      }

      toast({
        title: '🎉 Prenotazione Creata!',
        description: `Prenotazione ${reservationNumber} ${formData.autoConfirm ? 'confermata' : 'in attesa di conferma'}.`,
        duration: 5000
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
        occasion: 'other',
        specialRequests: '',
        adminNotes: '',
        autoConfirm: true
      });
      setSearchTerm('');

      // Refresh customer list
      fetchExistingCustomers();

      // Call success callback
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: '❌ Errore',
        description: 'Si è verificato un errore durante la creazione della prenotazione.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'numberOfGuests' ? parseInt(value) || 1 : value)
    }));
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get maximum date (6 months from now)
  const maxDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto p-6 rounded-2xl" style={{backgroundColor: 'var(--wheat-cream)', border: '2px solid var(--wheat-golden)', boxShadow: '0 8px 30px rgba(193, 154, 107, 0.2)'}}>
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold mb-2 italian-heading flex items-center justify-center gap-3" style={{color: 'var(--country-dark)'}}>
          <UserPlus size={32} style={{color: 'var(--wheat-harvest)'}} />
          Crea Prenotazione per Cliente
        </h3>
        <p className="text-sm italian-body" style={{color: 'var(--country-brown)'}}>
          Registra una nuova prenotazione per un cliente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Search/Select */}
        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--wheat-light)', border: '1px solid var(--wheat-amber)'}}>
          <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
            <Search size={18} style={{color: 'var(--wheat-harvest)'}} />
            Cerca Cliente Esistente (Opzionale)
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              placeholder="Cerca per nome, email o telefono..."
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            />
            
            {showCustomerDropdown && searchTerm && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-2 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{backgroundColor: 'var(--country-white)', border: '2px solid var(--wheat-amber)'}}>
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={index}
                    onClick={() => handleCustomerSelect(customer)}
                    className="p-3 cursor-pointer hover:bg-opacity-80 transition-colors"
                    style={{backgroundColor: index % 2 === 0 ? 'var(--wheat-light)' : 'var(--country-white)'}}
                  >
                    <div className="font-semibold" style={{color: 'var(--country-dark)'}}>{customer.customer_name}</div>
                    <div className="text-sm" style={{color: 'var(--country-brown)'}}>{customer.customer_email}</div>
                    <div className="text-sm" style={{color: 'var(--country-brown)'}}>{customer.customer_phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs mt-2 italic" style={{color: 'var(--country-brown)'}}>
            💡 Inizia a digitare per cercare clienti esistenti o compila manualmente i campi sotto
          </p>
        </div>

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

        <div className="grid md:grid-cols-2 gap-6">
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
              <MapPin size={18} style={{color: 'var(--wheat-harvest)'}} />
              Preferenza Tavolo
            </label>
            <select
              name="tablePreference"
              value={formData.tablePreference}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            >
              <option value="any">Qualsiasi</option>
              <option value="indoor">Interno</option>
              <option value="outdoor">Esterno</option>
              <option value="window">Vista Finestra</option>
              <option value="private">Sala Privata</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
            <Gift size={18} style={{color: 'var(--wheat-harvest)'}} />
            Occasione
          </label>
          <select
            name="occasion"
            value={formData.occasion}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
          >
            <option value="other">Altro</option>
            <option value="birthday">Compleanno 🎂</option>
            <option value="anniversary">Anniversario 💑</option>
            <option value="business">Lavoro 💼</option>
            <option value="date">Appuntamento Romantico 💕</option>
            <option value="family">Famiglia 👨‍👩‍👧‍👦</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
            <MessageSquare size={18} style={{color: 'var(--wheat-harvest)'}} />
            Richieste Cliente
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            placeholder="Allergie, seggiolone, decorazioni..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 italian-body flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
            <MessageSquare size={18} style={{color: 'var(--wheat-harvest)'}} />
            Note Admin (Private)
          </label>
          <textarea
            name="adminNotes"
            value={formData.adminNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
            placeholder="Note interne (non visibili al cliente)..."
          />
        </div>

        {/* Auto-confirm checkbox */}
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{backgroundColor: 'var(--wheat-light)', border: '1px solid var(--wheat-amber)'}}>
          <input
            type="checkbox"
            name="autoConfirm"
            id="autoConfirm"
            checked={formData.autoConfirm}
            onChange={handleChange}
            className="w-5 h-5 rounded border-2 cursor-pointer"
            style={{accentColor: 'var(--wheat-harvest)'}}
          />
          <label htmlFor="autoConfirm" className="text-sm font-semibold cursor-pointer" style={{color: 'var(--country-dark)'}}>
            ✅ Conferma automaticamente questa prenotazione
          </label>
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
              Creazione in corso...
            </>
          ) : (
            <>
              <UserPlus size={24} />
              Crea Prenotazione
            </>
          )}
        </button>
      </form>
    </div>
  );
};
