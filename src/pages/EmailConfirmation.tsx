import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token and type from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        console.log('🔐 [EMAIL-CONFIRM] Token:', token, 'Type:', type);

        if (!token || !type) {
          setStatus('error');
          setMessage('Link di conferma non valido. Parametri mancanti.');
          return;
        }

        if (type === 'signup') {
          // Verify the email confirmation token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });

          console.log('🔐 [EMAIL-CONFIRM] Verification result:', { data, error });

          if (error) {
            console.error('🔐 [EMAIL-CONFIRM] Verification error:', error);
            
            if (error.message.includes('expired')) {
              setStatus('expired');
              setMessage('Il link di conferma è scaduto. Richiedi un nuovo link di conferma.');
            } else {
              setStatus('error');
              setMessage(error.message || 'Errore durante la conferma dell\'email.');
            }
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email confermata con successo! Il tuo account è ora attivo.');
            
            toast({
              title: 'Email Confermata!',
              description: 'Il tuo account è stato attivato con successo.',
            });

            // Redirect to home page after 3 seconds
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Errore durante la conferma dell\'email.');
          }
        } else {
          setStatus('error');
          setMessage('Tipo di conferma non supportato.');
        }
      } catch (error) {
        console.error('🔐 [EMAIL-CONFIRM] Unexpected error:', error);
        setStatus('error');
        setMessage('Si è verificato un errore imprevisto.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleResendConfirmation = async () => {
    try {
      // This would require the user's email, which we don't have here
      // In a real app, you might want to redirect to a resend confirmation page
      toast({
        title: 'Richiedi nuovo link',
        description: 'Torna alla pagina di registrazione per richiedere un nuovo link di conferma.',
      });
      navigate('/');
    } catch (error) {
      console.error('Error resending confirmation:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Conferma in corso...';
      case 'success':
        return 'Email Confermata!';
      case 'expired':
        return 'Link Scaduto';
      case 'error':
        return 'Errore di Conferma';
      default:
        return 'Conferma Email';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          {getStatusIcon()}
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {getStatusTitle()}
            </h1>
            <p className="text-gray-600">
              {message || 'Stiamo verificando il tuo link di conferma...'}
            </p>
          </div>

          <div className="space-y-3 w-full">
            {status === 'success' && (
              <div className="text-sm text-gray-500">
                Verrai reindirizzato alla homepage tra pochi secondi...
              </div>
            )}

            {status === 'expired' && (
              <Button 
                onClick={handleResendConfirmation}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Richiedi Nuovo Link
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Torna alla Homepage
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
