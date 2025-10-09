import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users, Mail, Phone, MapPin, CheckCircle, XCircle, AlertCircle, Eye, MessageSquare, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminReservationForm } from './AdminReservationForm';

interface Reservation {
  id: string;
  reservation_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  table_preference: string;
  occasion: string;
  special_requests: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
}

const ReservationsAdmin = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchReservations();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('reservations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const fetchReservations = async () => {
    try {
      let query = supabase
        .from('reservations' as any)
        .select('*')
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReservations((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: '❌ Errore',
        description: 'Impossibile caricare le prenotazioni',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: 'confirmed' | 'rejected',
    notes: string = ''
  ) => {
    try {
      const adminUsername = localStorage.getItem('admin_username') || 'admin';

      // Update reservation status
      const { error: updateError } = await supabase
        .from('reservations' as any)
        .update({
          status: newStatus,
          confirmed_by: adminUsername,
          confirmed_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', reservationId);

      if (updateError) throw updateError;

      // Get reservation details for notification
      const { data: reservation } = await supabase
        .from('reservations' as any)
        .select('*')
        .eq('id', reservationId)
        .single();

      if (reservation) {
        const res = reservation as any;
        // Create notification record
        const notificationType = newStatus === 'confirmed' ? 'confirmation' : 'rejection';
        const subject = newStatus === 'confirmed' 
          ? `✅ Prenotazione Confermata - ${res.reservation_number}`
          : `❌ Prenotazione Non Disponibile - ${res.reservation_number}`;
        
        const message = newStatus === 'confirmed'
          ? `Gentile ${res.customer_name}, la tua prenotazione per ${res.number_of_guests} persone il ${new Date(res.reservation_date).toLocaleDateString('it-IT')} alle ${res.reservation_time} è stata CONFERMATA! Ti aspettiamo! 🍕`
          : `Gentile ${res.customer_name}, ci dispiace ma non possiamo confermare la tua prenotazione per il ${new Date(res.reservation_date).toLocaleDateString('it-IT')} alle ${res.reservation_time}. ${notes || 'Ti preghiamo di contattarci per trovare un\'alternativa.'}`;

        await supabase.from('reservation_notifications' as any).insert([
          {
            reservation_id: reservationId,
            notification_type: notificationType,
            recipient_email: reservation.customer_email,
            subject: subject,
            message: message,
            delivery_status: 'pending'
          }
        ]);

        // Update confirmation email sent flag
        await supabase
          .from('reservations' as any)
          .update({
            confirmation_email_sent: true,
            confirmation_email_sent_at: new Date().toISOString()
          })
          .eq('id', reservationId);
      }

      toast({
        title: newStatus === 'confirmed' ? '✅ Confermata!' : '❌ Rifiutata',
        description: `Prenotazione ${newStatus === 'confirmed' ? 'confermata' : 'rifiutata'} con successo. Email inviata al cliente.`,
      });

      fetchReservations();
      setSelectedReservation(null);
      setAdminNotes('');

    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({
        title: '❌ Errore',
        description: 'Impossibile aggiornare la prenotazione',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'var(--wheat-amber)', bg: 'var(--wheat-light)', icon: AlertCircle, text: 'In Attesa' },
      confirmed: { color: '#10b981', bg: '#d1fae5', icon: CheckCircle, text: 'Confermata' },
      rejected: { color: '#ef4444', bg: '#fee2e2', icon: XCircle, text: 'Rifiutata' },
      cancelled: { color: '#6b7280', bg: '#f3f4f6', icon: XCircle, text: 'Cancellata' },
      completed: { color: '#3b82f6', bg: '#dbeafe', icon: CheckCircle, text: 'Completata' },
      no_show: { color: '#f59e0b', bg: '#fef3c7', icon: AlertCircle, text: 'No Show' }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span 
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
        style={{backgroundColor: badge.bg, color: badge.color}}
      >
        <Icon size={16} />
        {badge.text}
      </span>
    );
  };

  const filteredReservations = reservations.filter(res => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold italian-heading" style={{color: 'var(--country-dark)'}}>
            🌾 Gestione Prenotazioni Tavoli
          </h2>
          <p className="text-sm mt-1 italian-body" style={{color: 'var(--country-brown)'}}>
            Gestisci le richieste di prenotazione e conferma i tavoli
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg text-center" style={{backgroundColor: 'var(--wheat-light)', border: '2px solid var(--wheat-amber)'}}>
            <div className="text-2xl font-bold" style={{color: 'var(--wheat-harvest)'}}>{pendingCount}</div>
            <div className="text-xs" style={{color: 'var(--country-brown)'}}>In Attesa</div>
          </div>
          <div className="px-4 py-2 rounded-lg text-center" style={{backgroundColor: '#d1fae5', border: '2px solid #10b981'}}>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <div className="text-xs text-green-700">Confermate</div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="wheat-btn-primary px-8 py-4 text-lg font-bold flex items-center gap-3"
        >
          <Plus size={24} />
          {showCreateForm ? 'Mostra Lista Prenotazioni' : 'Crea Nuova Prenotazione'}
        </button>
      </div>

      {showCreateForm ? (
        /* Admin Create Form */
        <AdminReservationForm onSuccess={() => {
          setShowCreateForm(false);
          fetchReservations();
        }} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            {['all', 'pending', 'confirmed', 'rejected'].map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  filter === filterOption ? 'wheat-btn-primary' : 'wheat-btn-secondary'
                }`}
              >
                {filterOption === 'all' ? 'Tutte' : 
                 filterOption === 'pending' ? 'In Attesa' :
                 filterOption === 'confirmed' ? 'Confermate' : 'Rifiutate'}
              </button>
            ))}
          </div>

          {/* Reservations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: 'var(--wheat-harvest)'}}></div>
          <p className="mt-4" style={{color: 'var(--country-brown)'}}>Caricamento prenotazioni...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-12 rounded-lg" style={{backgroundColor: 'var(--wheat-light)'}}>
          <Calendar size={48} className="mx-auto mb-4" style={{color: 'var(--wheat-amber)'}} />
          <p className="text-lg font-semibold" style={{color: 'var(--country-dark)'}}>
            Nessuna prenotazione trovata
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReservations.map((reservation: any) => (
            <div
              key={reservation.id}
              className="p-6 rounded-xl border-2 transition-all hover:shadow-lg"
              style={{
                backgroundColor: 'var(--country-white)',
                borderColor: reservation.status === 'pending' ? 'var(--wheat-amber)' : 
                             reservation.status === 'confirmed' ? '#10b981' : '#e5e7eb'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold italian-heading" style={{color: 'var(--country-dark)'}}>
                      {reservation.customer_name}
                    </h3>
                    {getStatusBadge(reservation.status)}
                  </div>
                  <p className="text-sm font-mono" style={{color: 'var(--country-brown)'}}>{reservation.reservation_number}</p>
                </div>
                <button
                  onClick={() => setSelectedReservation(reservation)}
                  className="wheat-btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Eye size={16} />
                  Dettagli
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={18} style={{color: 'var(--wheat-harvest)'}} />
                  <span className="font-semibold">{new Date(reservation.reservation_date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} style={{color: 'var(--wheat-harvest)'}} />
                  <span className="font-semibold">{reservation.reservation_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} style={{color: 'var(--wheat-harvest)'}} />
                  <span>{reservation.number_of_guests} {reservation.number_of_guests === 1 ? 'persona' : 'persone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} style={{color: 'var(--wheat-harvest)'}} />
                  <span className="capitalize">{reservation.table_preference === 'any' ? 'Qualsiasi' : reservation.table_preference}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} style={{color: 'var(--country-brown)'}} />
                  <a href={`mailto:${reservation.customer_email}`} className="hover:underline">{reservation.customer_email}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} style={{color: 'var(--country-brown)'}} />
                  <a href={`tel:${reservation.customer_phone}`} className="hover:underline">{reservation.customer_phone}</a>
                </div>
              </div>

              {reservation.special_requests && (
                <div className="mb-4 p-3 rounded-lg" style={{backgroundColor: 'var(--wheat-light)'}}>
                  <p className="text-sm font-semibold mb-1" style={{color: 'var(--country-dark)'}}>Richieste Speciali:</p>
                  <p className="text-sm" style={{color: 'var(--country-brown)'}}>{reservation.special_requests}</p>
                </div>
              )}

              {reservation.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setAdminNotes('');
                    }}
                    className="flex-1 wheat-btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Conferma
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setAdminNotes('');
                    }}
                    className="flex-1 wheat-btn-secondary py-3 flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Rifiuta
                  </button>
                </div>
              )}

              {reservation.confirmed_at && (
                <div className="mt-3 text-xs italic" style={{color: 'var(--country-brown)'}}>
                  {reservation.status === 'confirmed' ? 'Confermata' : 'Gestita'} da {reservation.confirmed_by} il {new Date(reservation.confirmed_at).toLocaleString('it-IT')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReservation(null)}>
          <div 
            className="max-w-2xl w-full p-8 rounded-2xl max-h-[90vh] overflow-y-auto"
            style={{backgroundColor: 'var(--wheat-cream)', border: '3px solid var(--wheat-golden)'}}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-6 italian-heading" style={{color: 'var(--country-dark)'}}>
              Gestisci Prenotazione
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{backgroundColor: 'var(--wheat-light)'}}>
                <div>
                  <p className="text-sm font-semibold" style={{color: 'var(--country-brown)'}}>Cliente</p>
                  <p className="text-lg font-bold" style={{color: 'var(--country-dark)'}}>{selectedReservation.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color: 'var(--country-brown)'}}>Numero</p>
                  <p className="text-lg font-mono font-bold" style={{color: 'var(--wheat-harvest)'}}>{selectedReservation.reservation_number}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color: 'var(--country-brown)'}}>Data & Ora</p>
                  <p className="font-bold" style={{color: 'var(--country-dark)'}}>
                    {new Date(selectedReservation.reservation_date).toLocaleDateString('it-IT')} - {selectedReservation.reservation_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color: 'var(--country-brown)'}}>Ospiti</p>
                  <p className="font-bold" style={{color: 'var(--country-dark)'}}>{selectedReservation.number_of_guests} persone</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{color: 'var(--country-dark)'}}>
                  <MessageSquare size={18} style={{color: 'var(--wheat-harvest)'}} />
                  Note Admin (opzionale)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  style={{borderColor: 'var(--wheat-amber)', backgroundColor: 'var(--country-white)'}}
                  placeholder="Aggiungi note per il cliente (es: tavolo assegnato, istruzioni speciali...)"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateReservationStatus(selectedReservation.id, 'confirmed', adminNotes)}
                className="flex-1 wheat-btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} />
                Conferma Prenotazione
              </button>
              <button
                onClick={() => updateReservationStatus(selectedReservation.id, 'rejected', adminNotes)}
                className="flex-1 wheat-btn-secondary py-4 text-lg font-bold flex items-center justify-center gap-2"
              >
                <XCircle size={24} />
                Rifiuta
              </button>
            </div>

            <button
              onClick={() => setSelectedReservation(null)}
              className="w-full mt-3 px-6 py-2 rounded-lg border-2 font-semibold transition-all"
              style={{borderColor: 'var(--wheat-amber)', color: 'var(--country-brown)'}}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ReservationsAdmin;
