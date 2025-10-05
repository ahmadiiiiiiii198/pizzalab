import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import {
  Pizza,
  Settings,
  Image,
  Video,
  MessageSquare,
  Bell,
  Users,
  ShoppingCart,
  BarChart3,
  MapPin,
  Palette,
  Globe,
  Menu as MenuIcon,
  Wrench,
  Database,
  Plus,
  Eye,
  Clock,
  CreditCard,
  Loader2,
  Package,
  Volume2,
  FileText,
  Upload,
  QrCode,
  Receipt
} from 'lucide-react';

// Import UnifiedNotificationSystem for admin panel notifications
import UnifiedNotificationSystem from '../UnifiedNotificationSystem';

// Lazy load admin components to prevent initialization errors
const ProductsAdmin = lazy(() => import('./ProductsAdmin').catch(() => ({ default: () => <div>Error loading ProductsAdmin</div> })));
const CategoriesEditor = lazy(() => import('./CategoriesEditor').catch(() => ({ default: () => <div>Error loading CategoriesEditor</div> })));
// OrdersAdmin removed - only available in separate ordini section
const ContentEditor = lazy(() => import('./ContentEditor').catch(() => ({ default: () => <div>Error loading ContentEditor</div> })));
const HeroContentEditor = lazy(() => import('./HeroContentEditor').catch(() => ({ default: () => <div>Error loading HeroContentEditor</div> })));
const LogoEditor = lazy(() => import('./LogoEditor').catch(() => ({ default: () => <div>Error loading LogoEditor</div> })));
const NavbarLogoEditor = lazy(() => import('./NavbarLogoEditor').catch(() => ({ default: () => <div>Error loading NavbarLogoEditor</div> })));
const GalleryManager = lazy(() => import('./GalleryManager').catch(() => ({ default: () => <div>Error loading GalleryManager</div> })));
const FlegreaSectionManager = lazy(() => import('./FlegreaSectionManager').catch(() => ({ default: () => <div>Error loading FlegreaSectionManager</div> })));
const PopupManager = lazy(() => import('./PopupManager').catch(() => ({ default: () => <div>Error loading PopupManager</div> })));
const SatisPayQRManager = lazy(() => import('./SatisPayQRManager').catch(() => ({ default: () => <div>Error loading SatisPayQRManager</div> })));
const SatisPayMigration = lazy(() => import('./SatisPayMigration').catch(() => ({ default: () => <div>Error loading SatisPayMigration</div> })));
const SettingsManager = lazy(() => import('./SettingsManager').catch(() => ({ default: () => <div>Error loading SettingsManager</div> })));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').catch(() => ({ default: () => <div>Error loading AnalyticsDashboard</div> })));

const WhyChooseUsManager = lazy(() => import('./WhyChooseUsManager').catch(() => ({ default: () => <div>Error loading WhyChooseUsManager</div> })));
const ChiSiamoImageManager = lazy(() => import('./ChiSiamoImageManager').catch(() => ({ default: () => <div>Error loading ChiSiamoImageManager</div> })));
const ChiSiamoContentManager = lazy(() => import('./ChiSiamoContentManager').catch(() => ({ default: () => <div>Error loading ChiSiamoContentManager</div> })));
const SectionBackgroundManager = lazy(() => import('./SectionBackgroundManager').catch(() => ({ default: () => <div>Error loading SectionBackgroundManager</div> })));
const SystemTest = lazy(() => import('./SystemTest').catch(() => ({ default: () => <div>Error loading SystemTest</div> })));
const DatabaseTest = lazy(() => import('./DatabaseTest').catch(() => ({ default: () => <div>Error loading DatabaseTest</div> })));
const FileDebugInfo = lazy(() => import('./FileDebugInfo').catch(() => ({ default: () => <div>Error loading FileDebugInfo</div> })));
const SystemConnectionTest = lazy(() => import('../SystemConnectionTest').catch(() => ({ default: () => <div>Error loading SystemConnectionTest</div> })));

const BusinessHoursManager = lazy(() => import('./BusinessHoursManager').catch(() => ({ default: () => <div>Error loading BusinessHoursManager</div> })));
const ContactHoursManager = lazy(() => import('./ContactHoursManager').catch(() => ({ default: () => <div>Error loading ContactHoursManager</div> })));

const ShippingZoneManager = lazy(() => import('./ShippingZoneManager').catch(() => ({ default: () => <div>Error loading ShippingZoneManager</div> })));
const IOSAudioTest = lazy(() => import('../IOSAudioTest').catch(() => ({ default: () => <div>Error loading IOSAudioTest</div> })));
// StripeSettings removed - no Stripe integration needed
const NotificationSettings = lazy(() => import('./NotificationSettings').catch(() => ({ default: () => <div>Error loading NotificationSettings</div> })));
const DatabaseSchemaUpdater = lazy(() => import('./DatabaseSchemaUpdater').catch(() => ({ default: () => <div>Error loading DatabaseSchemaUpdater</div> })));
const ReceiptSettingsManager = lazy(() => import('./ReceiptSettingsManager').catch(() => ({ default: () => <div>Error loading ReceiptSettingsManager</div> })));
const ProductsDebugger = lazy(() => import('../ProductsDebugger').catch(() => ({ default: () => <div>Error loading ProductsDebugger</div> })));
const MenuProductsConnectionTest = lazy(() => import('../MenuProductsConnectionTest').catch(() => ({ default: () => <div>Error loading MenuProductsConnectionTest</div> })));
const ProductsSchemaFixer = lazy(() => import('../ProductsSchemaFixer').catch(() => ({ default: () => <div>Error loading ProductsSchemaFixer</div> })));
const FrontendConnectionTester = lazy(() => import('../FrontendConnectionTester').catch(() => ({ default: () => <div>Error loading FrontendConnectionTester</div> })));
const BulkStockManager = lazy(() => import('./BulkStockManager').catch(() => ({ default: () => <div>Error loading BulkStockManager</div> })));
const UploadSystemTester = lazy(() => import('./UploadSystemTester').catch(() => ({ default: () => <div>Error loading UploadSystemTester</div> })));
const DynamicFeatureManager = lazy(() => import('./DynamicFeatureManager').catch(() => ({ default: () => <div>Error loading DynamicFeatureManager</div> })));


// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    <span className="ml-2 text-gray-600">Caricamento...</span>
  </div>
);

const PizzeriaAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReady, setIsReady] = useState(false);

  // Scroll functionality
  const { scrollToElement, scrollToTopWithDelay } = useScrollToTop();

  // Handle tab change with scroll to specific section
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Small delay to ensure the content is rendered before scrolling to the specific section
    setTimeout(() => {
      const targetElement = document.getElementById(`admin-section-${value}`);
      if (targetElement) {
        // Scroll to the specific section with some offset for better visibility
        scrollToElement(`admin-section-${value}`, 'smooth', 100);
      } else {
        // Fallback to scroll to top if section not found
        scrollToTopWithDelay(0);
      }
    }, 150);
  };

  // Add initialization logging with delay
  useEffect(() => {
    console.log('🚀 [AdminPanel] Initializing PizzeriaAdminPanel...');
    console.log('🚀 [AdminPanel] Active tab:', activeTab);
    console.log('🚀 [AdminPanel] Environment check:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing'
    });

    // Add a small delay to ensure all components are ready
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log('🚀 [AdminPanel] Component fully initialized and ready');
      console.log('🚀 [AdminPanel] Notification system available only in separate ordini section');
    }, 200); // Increased delay slightly

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('🔄 [AdminPanel] Active tab changed to:', activeTab);
  }, [activeTab]);

  // Show loading state during initialization
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Caricamento Pannello Admin...</h2>
          <p className="text-gray-500 mt-2">Inizializzazione componenti...</p>
        </div>
      </div>
    );
  }

  // Clean and organized admin sections - each "Impostazioni" section is now separate
  const adminSections = [
    // === CORE BUSINESS ===
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Panoramica generale e statistiche',
      category: 'core'
    },
    {
      id: 'products',
      label: 'Prodotti',
      icon: Pizza,
      description: 'Gestione menu, pizze e prodotti',
      category: 'core'
    },
    {
      id: 'categories',
      label: 'Categorie',
      icon: MenuIcon,
      description: 'Gestione categorie e funzionalità (Impasto, Aggiunti, Bevande)',
      category: 'core'
    },
    {
      id: 'stock',
      label: 'Stock',
      icon: Package,
      description: 'Gestione stock e disponibilità prodotti',
      category: 'core'
    },
    {
      id: 'product-features',
      label: 'Caratteristiche Prodotti',
      icon: Settings,
      description: 'Gestione aggiunti, impasti e bevande',
      category: 'core'
    },

    // === CONTENT MANAGEMENT ===
    {
      id: 'content',
      label: 'Contenuti Sito',
      icon: Globe,
      description: 'Gestione testi e contenuti del sito web',
      category: 'content'
    },
    {
      id: 'gallery',
      label: 'Galleria Immagini',
      icon: Image,
      description: 'Gestione immagini e galleria fotografica',
      category: 'content'
    },
    {
      id: 'backgrounds',
      label: 'Sfondi',
      icon: Palette,
      description: 'Gestione sfondi per tutte le sezioni',
      category: 'content'
    },
    {
      id: 'contact-hours',
      label: 'Contatti e Orari',
      icon: Clock,
      description: 'Gestione informazioni di contatto e orari di apertura',
      category: 'content'
    },

    // === BUSINESS SETTINGS (Previously in "Impostazioni") ===
    {
      id: 'general-settings',
      label: 'Impostazioni Generali',
      icon: Settings,
      description: 'Configurazioni generali del ristorante',
      category: 'business'
    },
    {
      id: 'business-hours',
      label: 'Orari di Apertura',
      icon: Clock,
      description: 'Gestisci gli orari di apertura per ogni giorno',
      category: 'business'
    },
    {
      id: 'delivery-zones',
      label: 'Zone di Consegna',
      icon: MapPin,
      description: 'Configura zone di consegna e tariffe',
      category: 'business'
    },
    {
      id: 'notifications-settings',
      label: 'Impostazioni Notifiche',
      icon: Bell,
      description: 'Configura notifiche audio e sistema',
      category: 'business'
    },
    {
      id: 'receipt-settings',
      label: 'Impostazioni Scontrino',
      icon: Receipt,
      description: 'Personalizza messaggi e footer degli scontrini',
      category: 'business'
    },

    // === NOTIFICATIONS & POPUPS ===
    {
      id: 'popups',
      label: 'Popup & Annunci',
      icon: Bell,
      description: 'Gestione popup e annunci speciali',
      category: 'notifications'
    },

    // === PAYMENT SYSTEMS ===
    {
      id: 'satispay-qr',
      label: 'SatisPay QR',
      icon: QrCode,
      description: 'Gestione QR code SatisPay per pagamenti',
      category: 'payment'
    },

    // === ADVANCED TOOLS (for developers) ===
    {
      id: 'database-test',
      label: 'Test Database',
      icon: Database,
      description: 'Test connessione e schema database',
      category: 'advanced'
    },
    {
      id: 'system-test',
      label: 'Test Sistema',
      icon: Wrench,
      description: 'Diagnostica completa del sistema',
      category: 'advanced'
    },
    {
      id: 'satispay-migration',
      label: 'SatisPay Migration',
      icon: Database,
      description: 'Migrazione database per SatisPay QR',
      category: 'advanced'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* OrderNotificationSystem removed - only available in separate ordini section */}

      {/* Enhanced Modern Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-white via-gray-50 to-white shadow-xl border-b border-gray-200 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-3 sm:p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex-shrink-0">
                <Pizza className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                  Pannello Admin
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-semibold">PIZZALAB - Laboratorio di Pizza Italiana</p>
                <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Sistema attivo e funzionante
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              {/* Ordini Button */}
              <Button
                onClick={() => window.open('/ordini', '_blank')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base w-full sm:w-auto"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Gestione Ordini
              </Button>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString('it-IT', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          {/* Enhanced Modern Navigation - Mobile Optimized */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full mr-4"></div>
                Sezioni di Gestione
              </h2>
              <p className="text-gray-600 text-lg">Seleziona una sezione per iniziare a gestire il tuo sito</p>
            </div>

            {/* Quick Access to Ordini - Mobile Optimized */}
            <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-orange-50 via-orange-100 to-red-50 rounded-2xl border-2 border-orange-200 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-3 sm:p-4 rounded-2xl shadow-xl flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Gestione Ordini</h3>
                    <p className="text-sm sm:text-base text-gray-600">Accesso rapido alla sezione ordini con notifiche audio</p>
                  </div>
                </div>
                <Button
                  onClick={() => window.open('/ordini', '_blank')}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg w-full sm:w-auto"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Apri Ordini
                </Button>
              </div>
            </div>

            {/* Core Business Section */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide mb-6 flex items-center bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-3 animate-pulse"></div>
                🏪 Gestione Principale
              </h3>
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'core').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-3 sm:p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-red-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-50 data-[state=active]:to-red-100 data-[state=active]:border-red-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                      <section.icon size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">{section.label}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Content Management Section */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide mb-6 flex items-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 animate-pulse"></div>
                📝 Gestione Contenuti
              </h3>
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'content').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-3 sm:p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-100 data-[state=active]:border-blue-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                      <section.icon size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">{section.label}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Business Settings Section (Previously in "Impostazioni") */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide mb-6 flex items-center bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-3 animate-pulse"></div>
                ⚙️ Impostazioni Business
              </h3>
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'business').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-3 sm:p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-purple-100 data-[state=active]:border-purple-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                      <section.icon size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">{section.label}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Notifications & Popups Section */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide mb-6 flex items-center bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-3 animate-pulse"></div>
                🔔 Notifiche & Popup
              </h3>
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'notifications').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-3 sm:p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-green-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:to-green-100 data-[state=active]:border-green-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                      <section.icon size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">{section.label}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Payment Systems */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide mb-6 flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full mr-3 animate-pulse"></div>
                💳 Sistemi di Pagamento
              </h3>
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'payment').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-3 sm:p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-yellow-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-50 data-[state=active]:to-yellow-100 data-[state=active]:border-yellow-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                      <section.icon size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">{section.label}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>



            {/* Advanced Tools - Enhanced Collapsible */}
            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-3 animate-pulse"></div>
                  <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                    🔧 Strumenti Sviluppatori
                  </h3>
                </div>
                <div className="text-sm text-orange-600 group-open:hidden font-medium">Solo per sviluppatori</div>
              </summary>
              <div className="mt-4">
                <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-transparent h-auto">
                  {adminSections.filter(s => s.category === 'advanced').map((section) => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="flex items-center p-3 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg hover:shadow-md hover:border-orange-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-50 data-[state=active]:to-orange-100 data-[state=active]:border-orange-400 data-[state=active]:shadow-md transition-all duration-200 h-auto"
                    >
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-lg mr-3 flex-shrink-0">
                        <section.icon size={18} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 text-sm">{section.label}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{section.description}</div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </details>
          </div>

          {/* Tab Contents */}
          <div className="space-y-6">
            {/* Dashboard */}
            <TabsContent value="dashboard" id="admin-section-dashboard" className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-blue-800">Prodotti Attivi</CardTitle>
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <Pizza className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">14</div>
                    <p className="text-sm text-blue-600 flex items-center mt-2">
                      <span className="text-green-600 font-medium">+3</span>
                      <span className="ml-1">nuovi prodotti</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-green-800">Fatturato Oggi</CardTitle>
                    <div className="bg-green-500 p-2 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-900">€245.50</div>
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <span className="text-green-600 font-medium">+15%</span>
                      <span className="ml-1">da ieri</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-orange-800">Prodotti Attivi</CardTitle>
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <Pizza className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-900">14</div>
                    <p className="text-sm text-orange-600 mt-2">Menu completo</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-purple-800">Nuovi Commenti</CardTitle>
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">3</div>
                    <p className="text-sm text-purple-600 mt-2">Da moderare</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Azioni Rapide</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="flex items-center p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                    <Plus className="h-5 w-5 mr-3" />
                    Nuovo Prodotto
                  </button>
                  <button
                    onClick={() => window.open('/ordini', '_blank')}
                    className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <ShoppingCart className="h-5 w-5 mr-3" />
                    Apri Sezione Ordini
                  </button>
                  <button className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                    <Settings className="h-5 w-5 mr-3" />
                    Impostazioni
                  </button>
                </div>
              </div>

              <Suspense fallback={<LoadingSpinner />}>
                <AnalyticsDashboard />
              </Suspense>
            </TabsContent>

            {/* Orders Management removed - only available in separate ordini section */}

            {/* Stock Management */}
            <TabsContent value="stock" id="admin-section-stock">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                  <CardTitle className="flex items-center text-green-800">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    Gestione Stock Prodotti
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Gestisci la disponibilità e le quantità di stock per tutti i prodotti
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <BulkStockManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product Features Management */}
            <TabsContent value="product-features" id="admin-section-product-features">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl border-b border-blue-200">
                  <CardTitle className="flex items-center text-blue-800">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    Gestione Caratteristiche Prodotti
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Gestisci aggiunti (extras) e tipi di impasto per la personalizzazione dei prodotti
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <DynamicFeatureManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Management */}
            <TabsContent value="products" id="admin-section-products">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl border-b border-red-200">
                  <CardTitle className="flex items-center text-red-800">
                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                      <Pizza className="h-6 w-6 text-white" />
                    </div>
                    Gestione Menu e Prodotti
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Aggiungi, modifica o rimuovi pizze e prodotti dal menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProductsAdmin />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Management */}
            <TabsContent value="categories" id="admin-section-categories">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                  <CardTitle className="flex items-center text-green-800">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <MenuIcon className="h-6 w-6 text-white" />
                    </div>
                    Gestione Categorie
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Gestisci le categorie e le funzionalità (Impasto, Aggiunti, Bevande) per ogni categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CategoriesEditor />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Management */}
            <TabsContent value="content" id="admin-section-content">
              <div className="space-y-8">
                {/* Logo Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl border-b border-purple-200">
                    <CardTitle className="flex items-center text-purple-800">
                      <div className="bg-purple-500 p-2 rounded-lg mr-3">
                        <Image className="h-6 w-6 text-white" />
                      </div>
                      Gestione Logo Principale
                    </CardTitle>
                    <CardDescription className="text-purple-600">
                      Carica e modifica il logo principale della pizzeria (hero, footer, ecc.)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <LogoEditor />
                    </Suspense>
                  </CardContent>
                </Card>

                {/* Navbar Logo Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl border-b border-blue-200">
                    <CardTitle className="flex items-center text-blue-800">
                      <div className="bg-blue-500 p-2 rounded-lg mr-3">
                        <Image className="h-6 w-6 text-white" />
                      </div>
                      Gestione Logo Navbar
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Configura il logo che appare nella barra di navigazione superiore
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <NavbarLogoEditor />
                    </Suspense>
                  </CardContent>
                </Card>

                {/* Hero Content Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-t-2xl border-b border-indigo-200">
                    <CardTitle className="flex items-center text-indigo-800">
                      <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      Gestione Hero Section
                    </CardTitle>
                    <CardDescription className="text-indigo-600">
                      Modifica il contenuto e l'immagine hero (immagine destra)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <HeroContentEditor />
                    </Suspense>
                  </CardContent>
                </Card>



                {/* Why Choose Us Section Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-2xl border-b border-yellow-200">
                    <CardTitle className="flex items-center text-yellow-800">
                      <div className="bg-yellow-500 p-2 rounded-lg mr-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      Gestione "Perché Sceglierci"
                    </CardTitle>
                    <CardDescription className="text-yellow-600">
                      Personalizza la sezione che spiega perché i clienti dovrebbero scegliere il tuo ristorante
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <WhyChooseUsManager />
                    </Suspense>
                  </CardContent>
                </Card>

                {/* Chi Siamo Content Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                    <CardTitle className="flex items-center text-green-800">
                      <div className="bg-green-500 p-2 rounded-lg mr-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      Gestione Contenuto "Chi Siamo"
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      Modifica tutti i testi della sezione Chi Siamo (multilingua)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <ChiSiamoContentManager />
                    </Suspense>
                  </CardContent>
                </Card>

                {/* Chi Siamo Image Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl border-b border-blue-200">
                    <CardTitle className="flex items-center text-blue-800">
                      <div className="bg-blue-500 p-2 rounded-lg mr-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      Gestione Immagine "Chi Siamo"
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Gestisci l'immagine sul lato destro della sezione Chi Siamo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <ChiSiamoImageManager />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gallery Management */}
            <TabsContent value="gallery" id="admin-section-gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="mr-2" />
                    Gestione Galleria
                  </CardTitle>
                  <CardDescription>
                    Carica e organizza le immagini della pizzeria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <GalleryManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Section Backgrounds Management */}
            <TabsContent value="backgrounds" id="admin-section-backgrounds">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl border-b border-purple-200">
                  <CardTitle className="flex items-center text-purple-800">
                    <div className="bg-purple-500 p-2 rounded-lg mr-3">
                      <Image className="h-6 w-6 text-white" />
                    </div>
                    Gestione Sfondi Sezioni
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Gestisci le immagini di sfondo per tutte le sezioni del sito web
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SectionBackgroundManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact and Hours Management */}
            <TabsContent value="contact-hours" id="admin-section-contact-hours">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                  <CardTitle className="flex items-center text-green-800">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    Gestione Contatti e Orari
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Modifica informazioni di contatto e orari di apertura per footer e sezione contatti
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ContactHoursManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flegrea Section Management */}
            <TabsContent value="flegrea-section" id="admin-section-flegrea-section">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="mr-2" />
                    Gestione Sezione Flegrea
                  </CardTitle>
                  <CardDescription>
                    Gestisci contenuti e immagini della sezione Flegrea che ha sostituito la sezione video
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <FlegreaSectionManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>





            {/* Popup Management */}
            <TabsContent value="popups" id="admin-section-popups">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2" />
                    Gestione Popup e Annunci
                  </CardTitle>
                  <CardDescription>
                    Crea e gestisci popup per occasioni speciali
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <PopupManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SatisPay QR Management */}
            <TabsContent value="satispay-qr" id="admin-section-satispay-qr">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-2xl border-b border-yellow-200">
                  <CardTitle className="flex items-center text-yellow-800">
                    <div className="bg-yellow-500 p-2 rounded-lg mr-3">
                      <QrCode className="h-6 w-6 text-white" />
                    </div>
                    Gestione QR Code SatisPay
                  </CardTitle>
                  <CardDescription className="text-yellow-600">
                    Gestisci l'immagine QR code mostrata quando i clienti scelgono "Paga Ora"
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SatisPayQRManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === SEPARATE BUSINESS SETTINGS SECTIONS === */}

            {/* General Settings */}
            <TabsContent value="general-settings" id="admin-section-general-settings">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl border-b border-purple-200">
                  <CardTitle className="flex items-center text-purple-800">
                    <div className="bg-purple-500 p-2 rounded-lg mr-3">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    Impostazioni Generali
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Configura le impostazioni principali del ristorante
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SettingsManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Hours Settings */}
            <TabsContent value="business-hours" id="admin-section-business-hours">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl border-b border-blue-200">
                  <CardTitle className="flex items-center text-blue-800">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    Orari di Apertura
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Gestisci gli orari di apertura per ogni giorno della settimana
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <BusinessHoursManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery Zones Settings */}
            <TabsContent value="delivery-zones" id="admin-section-delivery-zones">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                  <CardTitle className="flex items-center text-green-800">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    Zone di Consegna
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Configura zone di consegna, tariffe e metodi di pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ShippingZoneManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications-settings" id="admin-section-notifications-settings">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl border-b border-orange-200">
                  <CardTitle className="flex items-center text-orange-800">
                    <div className="bg-orange-500 p-2 rounded-lg mr-3">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    Impostazioni Notifiche
                  </CardTitle>
                  <CardDescription className="text-orange-600">
                    Configura impostazioni generali di notifica (ordini gestiti in sezione separata)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <NotificationSettings />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipt Settings */}
            <TabsContent value="receipt-settings" id="admin-section-receipt-settings">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                  <CardTitle className="flex items-center text-green-800">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                    Impostazioni Scontrino
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Personalizza messaggi e footer che appaiono negli scontrini stampati
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ReceiptSettingsManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database Test */}
            <TabsContent value="database-test" id="admin-section-database-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2" />
                    Database Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test database connectivity and gallery data loading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <DatabaseTest />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Connection Test */}
            <TabsContent value="system-test" id="admin-section-system-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2" />
                    System Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test complete system: Products ↔ Admin, Content Management, Real-time Updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <SystemConnectionTest />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* File Debug Tool */}
            <TabsContent value="file-debug" id="admin-section-file-debug">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2" />
                    File Upload Debug Tool
                  </CardTitle>
                  <CardDescription>
                    Analyze file properties and debug upload issues with MIME types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <FileDebugInfo />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upload System Test */}
            <TabsContent value="upload-system-test" id="admin-section-upload-system-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="mr-2" />
                    Upload System Tester
                  </CardTitle>
                  <CardDescription>
                    Test complete upload flow: storage → database → frontend display
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <UploadSystemTester />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Debugger */}
            <TabsContent value="products-debug" id="admin-section-products-debug">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pizza className="mr-2" />
                    Products Database Debugger
                  </CardTitle>
                  <CardDescription>
                    Debug products database, check data, and create sample products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProductsDebugger />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menu Products Connection Test */}
            <TabsContent value="menu-products-test" id="admin-section-menu-products-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MenuIcon className="mr-2" />
                    Menu & Products Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test how menu and products sections connect to the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <MenuProductsConnectionTest />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Fixer */}
            <TabsContent value="schema-fixer" id="admin-section-schema-fixer">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="mr-2" />
                    Products Schema Fixer
                  </CardTitle>
                  <CardDescription>
                    Fix database schema issues and missing columns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProductsSchemaFixer />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Updater */}
            <TabsContent value="schema-updater" id="admin-section-schema-updater">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="mr-2" />
                    Database Schema Updater
                  </CardTitle>
                  <CardDescription>
                    Add advanced features to products table including stock management, SEO fields, and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <DatabaseSchemaUpdater />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Frontend Connection Tester */}
            <TabsContent value="frontend-test" id="admin-section-frontend-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2" />
                    Frontend Database Connection Tester
                  </CardTitle>
                  <CardDescription>
                    Test how frontend components connect to the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <FrontendConnectionTester />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* iOS Audio Test */}
            <TabsContent value="ios-audio-test" id="admin-section-ios-audio-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Volume2 className="mr-2" />
                    iOS Audio Notification Test
                  </CardTitle>
                  <CardDescription>
                    Test and debug audio notifications on iOS devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <IOSAudioTest />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SatisPay Migration */}
            <TabsContent value="satispay-migration" id="admin-section-satispay-migration">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2" />
                    SatisPay Database Migration
                  </CardTitle>
                  <CardDescription>
                    Migrazione database per abilitare il sistema SatisPay QR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingSpinner />}>
                    <SatisPayMigration />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>

      {/* Unified Notification System - Global for Admin Panel */}
      <Suspense fallback={
        <div className="fixed top-4 right-4 z-50">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-full shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      }>
        <UnifiedNotificationSystem />
      </Suspense>
    </div>
  );
};

export default PizzeriaAdminPanel;
