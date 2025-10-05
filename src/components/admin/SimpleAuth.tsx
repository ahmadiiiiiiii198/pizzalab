import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimpleAuthProps {
  onAuthenticated: () => void;
}

const SimpleAuth: React.FC<SimpleAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple password check (in production, use proper authentication)
    if (password === 'admin123' || password === 'pizzeria2024') {
      localStorage.setItem('admin_authenticated', 'true');
      onAuthenticated();
    } else {
      setError('Password non corretto');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pizza-red/10 to-pizza-orange/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-pizza-dark">
            🍕 Admin Panel
          </CardTitle>
          <p className="text-gray-600">Inserisci la password per accedere</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-pizza-red hover:bg-pizza-red/90"
              disabled={isLoading}
            >
              {isLoading ? 'Accesso...' : 'Accedi'}
            </Button>
            
            <div className="text-xs text-gray-500 text-center mt-4">
              Password predefinite: admin123 o pizzeria2024
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAuth;
