
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/use-language";
import { SimpleCartProvider } from "@/hooks/use-simple-cart";

import { BusinessHoursProvider } from "@/contexts/BusinessHoursContext";
import { initializeDatabaseOnlyTracking } from "@/utils/clearLocalStorageOrders";

import ErrorBoundary from "./components/ErrorBoundary";
// import DiagnosticInfo from "./components/DiagnosticInfo"; // Removed diagnostic button
import BackgroundInitializer from "./components/BackgroundInitializer";
// import ButtonDebugger from "./components/ButtonDebugger"; // Removed debug component
// OrderNotificationSystem moved to admin panel only to prevent conflicts
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminMinimal from "./pages/AdminMinimal";
import Ordini from "./pages/ordini";

import OrderDashboardPro from "./pages/OrderDashboardPro";

import MenuPage from "./pages/MenuPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

// DatabaseSetup component removed to prevent accidental initialization
import SimpleStripeTest from "./components/SimpleStripeTest";
import AuthTest from "./components/AuthTest";
import AuthTestHelper from "./components/AuthTestHelper";
// Customer authentication components removed
import ComponentLoadingTest from "./tests/ComponentLoadingTest";
import LogoTest from "./pages/LogoTest";
import EmailConfirmation from "./pages/EmailConfirmation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once instead of 3 times
      retryDelay: 1000, // Wait 1 second before retry
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
    },
  },
});

// Initialize database-only order tracking (clear localStorage/cookies)
initializeDatabaseOnlyTracking();

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
            <BusinessHoursProvider>
              <SimpleCartProvider>
              <BackgroundInitializer />
            {/* OrderNotificationSystem now only loads in admin panel */}
            {/* ButtonDebugger removed - no more debug overlays */}
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ErrorBoundary componentName="Index">
                  <Index />
                </ErrorBoundary>
              } />
              <Route path="/admin" element={
                <ErrorBoundary componentName="Admin">
                  <Admin />
                </ErrorBoundary>
              } />

              <Route path="/ordini" element={
                <ErrorBoundary componentName="Ordini">
                  <Ordini />
                </ErrorBoundary>
              } />

              <Route path="/orders" element={
                <ErrorBoundary componentName="OrderDashboard">
                  <OrderDashboardPro />
                </ErrorBoundary>
              } />



              <Route path="/menu" element={
                <ErrorBoundary componentName="MenuPage">
                  <MenuPage />
                </ErrorBoundary>
              } />
              <Route path="/payment/success" element={
                <ErrorBoundary componentName="PaymentSuccess">
                  <PaymentSuccess />
                </ErrorBoundary>
              } />
              <Route path="/payment/cancel" element={
                <ErrorBoundary componentName="PaymentCancel">
                  <PaymentCancel />
                </ErrorBoundary>
              } />
              {/* Database setup route removed to prevent accidental initialization */}
              <Route path="/stripe-test" element={
                <div className="min-h-screen bg-gray-50 py-12">
                  <ErrorBoundary componentName="SimpleStripeTest">
                    <SimpleStripeTest />
                  </ErrorBoundary>
                </div>
              } />

              <Route path="/auth-test" element={
                <ErrorBoundary componentName="AuthTest">
                  <AuthTest />
                </ErrorBoundary>
              } />
              <Route path="/auth-helper" element={
                <ErrorBoundary componentName="AuthTestHelper">
                  <AuthTestHelper />
                </ErrorBoundary>
              } />


              <Route path="/auth/confirm" element={
                <ErrorBoundary componentName="EmailConfirmation">
                  <EmailConfirmation />
                </ErrorBoundary>
              } />
              <Route path="/test-components" element={
                <ErrorBoundary componentName="ComponentLoadingTest">
                  <ComponentLoadingTest />
                </ErrorBoundary>
              } />
              <Route path="/logo-test" element={
                <ErrorBoundary componentName="LogoTest">
                  <LogoTest />
                </ErrorBoundary>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global Order Tracker removed - order tracking works in hero section */}

          </BrowserRouter>
          {/* <DiagnosticInfo /> */}
              </SimpleCartProvider>
            </BusinessHoursProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
