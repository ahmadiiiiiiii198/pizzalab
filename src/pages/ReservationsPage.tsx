import { TableReservationForm } from '@/components/TableReservationForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const ReservationsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="container mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 py-12 rounded-2xl wheat-field-pattern" style={{backgroundColor: 'var(--wheat-light)'}}>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 italian-heading wheat-sway" style={{color: 'var(--country-dark)'}}>
              Prenota il Tuo Tavolo
            </h1>
            <p className="text-xl md:text-2xl mb-6 italian-body" style={{color: 'var(--wheat-harvest)'}}>
              Un'esperienza culinaria indimenticabile ti aspetta
            </p>
            <div className="flex items-center justify-center gap-8 text-sm" style={{color: 'var(--country-brown)'}}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍕</span>
                <span>Pizza Autentica</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <span>Ingredienti Freschi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏡</span>
                <span>Atmosfera Familiare</span>
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <TableReservationForm />

          {/* Additional Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl text-center" style={{backgroundColor: 'var(--wheat-light)', border: '2px solid var(--wheat-amber)'}}>
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="text-lg font-bold mb-2 italian-heading" style={{color: 'var(--country-dark)'}}>
                Conferma Rapida
              </h3>
              <p className="text-sm italian-body" style={{color: 'var(--country-brown)'}}>
                Riceverai conferma entro 24 ore via email
              </p>
            </div>

            <div className="p-6 rounded-xl text-center" style={{backgroundColor: 'var(--wheat-light)', border: '2px solid var(--wheat-amber)'}}>
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-lg font-bold mb-2 italian-heading" style={{color: 'var(--country-dark)'}}>
                Notifiche Email
              </h3>
              <p className="text-sm italian-body" style={{color: 'var(--country-brown)'}}>
                Ti terremo aggiornato sullo stato della prenotazione
              </p>
            </div>

            <div className="p-6 rounded-xl text-center" style={{backgroundColor: 'var(--wheat-light)', border: '2px solid var(--wheat-amber)'}}>
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold mb-2 italian-heading" style={{color: 'var(--country-dark)'}}>
                Occasioni Speciali
              </h3>
              <p className="text-sm italian-body" style={{color: 'var(--country-brown)'}}>
                Facci sapere se è un'occasione speciale!
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-12 p-8 rounded-2xl text-center" style={{backgroundColor: 'var(--country-cream)', border: '2px solid var(--wheat-golden)'}}>
            <h3 className="text-2xl font-bold mb-4 italian-heading" style={{color: 'var(--country-dark)'}}>
              Hai Bisogno di Aiuto?
            </h3>
            <p className="text-lg mb-4 italian-body" style={{color: 'var(--country-brown)'}}>
              Per prenotazioni urgenti o gruppi superiori a 20 persone, contattaci direttamente:
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a 
                href="tel:+393713707741" 
                className="wheat-btn-primary px-8 py-3 text-lg font-bold inline-flex items-center gap-2"
              >
                📞 Chiama Ora
              </a>
              <a 
                href="mailto:info@ruralpizza.it" 
                className="wheat-btn-secondary px-8 py-3 text-lg font-bold inline-flex items-center gap-2"
              >
                📧 Invia Email
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
