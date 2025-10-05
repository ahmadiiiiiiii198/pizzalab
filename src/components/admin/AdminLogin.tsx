
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getSetting } from "@/lib/supabase";
import { useNavbarLogoSettings } from "@/hooks/use-settings";

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [defaultCredentials, setDefaultCredentials] = useState<{username: string, password: string}>({
    username: "admin",
    password: "persian123"
  });
  const { toast } = useToast();
  const [navbarLogoSettings, , isNavbarLogoLoading] = useNavbarLogoSettings();

  // Debug: Log navbar logo settings
  useEffect(() => {
    console.log('🔍 [AdminLogin] Logo settings changed:', {
      logoUrl: navbarLogoSettings.logoUrl,
      altText: navbarLogoSettings.altText,
      showLogo: navbarLogoSettings.showLogo,
      logoSize: navbarLogoSettings.logoSize,
      isLoading: isNavbarLogoLoading
    });
  }, [navbarLogoSettings, isNavbarLogoLoading]);

  // Get default credentials when component mounts
  useEffect(() => {
    const fetchDefaultCredentials = async () => {
      try {
        const adminCredentials = await getSetting('adminCredentials') as { username: string, password: string } | null;
        
        if (adminCredentials) {
          console.log("Admin credentials found:", { username: adminCredentials.username, password: "***" });
          setDefaultCredentials(adminCredentials);
        } else {
          console.log("Using fallback admin credentials");
        }
      } catch (error) {
        console.error("Error fetching admin credentials:", error);
      }
    };
    
    fetchDefaultCredentials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with username:", username);
      
      // Try to verify credentials
      const success = await onLogin(username, password);
      
      if (success) {
        toast({
          title: "Successo",
          description: "Benvenuto nel pannello admin!",
        });
      } else {
        toast({
          title: "Autenticazione fallita",
          description: "Nome utente o password non validi.",
          variant: "destructive",
        });
        
        // Log default credentials to help with debugging
        console.log("Default credentials are:", { 
          username: defaultCredentials.username, 
          password: "***" 
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'accesso. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 overflow-hidden rounded-2xl">
        <div className="relative p-8 pt-12 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
          <div className="text-center">
            {/* Pizzeria Logo - Same as navbar */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-400 bg-white flex items-center justify-center overflow-hidden">
              {navbarLogoSettings.showLogo && !isNavbarLogoLoading && (
                <img
                  src={navbarLogoSettings.logoUrl}
                  alt={navbarLogoSettings.altText}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if logo fails to load
                    e.currentTarget.style.display = 'none';
                    const placeholder = e.currentTarget.parentElement?.querySelector('.logo-placeholder');
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  }}
                />
              )}
              {/* Loading placeholder */}
              {isNavbarLogoLoading && (
                <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-full"></div>
              )}
              {/* Fallback placeholder (hidden by default) */}
              <div className="logo-placeholder w-16 h-16 rounded-full border border-yellow-400/50 bg-slate-600 flex items-center justify-center text-yellow-400 text-xl font-bold" style={{ display: 'none' }}>
                🍕
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Pizzeria <span className="text-yellow-400">Admin</span>
            </h1>
            <p className="text-gray-300 text-sm">
              Accedi per gestire il tuo sito web della pizzeria
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nome utente</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-yellow-500" />
                </div>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Predefinito: admin"
                  className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-yellow-500" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Predefinito: persian123"
                  className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-lg"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accesso in corso...
                </span>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Credenziali predefinite: admin / persian123</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
