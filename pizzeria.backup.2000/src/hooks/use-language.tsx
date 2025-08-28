import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

type Language = "it" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Pizzeria translations for Italian and English
const translations: Record<Language, Record<string, string>> = {
  it: {
    // Navigation
    "home": "Home",
    "menu": "Menu",
    "gallery": "Galleria",
    "about": "Chi Siamo",
    "contact": "Contatti",
    "orders": "Ordini",
    
    // Main sections
    "ourMenu": "Il Nostro Menu",
    "menuDescription": "Scopri le nostre pizze autentiche preparate con ingredienti freschi",
    "orderNow": "Ordina Ora",
    "makeOrder": "Fai un Ordine",
    "makeReservation": "Ordinare",
    "contactUs": "Contattaci",
    "findUs": "Trovaci",
    
    // Pizza categories
    "pizzeClassiche": "Pizze Classiche",
    "pizzeSpeciali": "Pizze Speciali",
    "pizzeAlMetro": "Pizze al Metro",
    "bevande": "Bevande",
    "extras": "Extra",
    
    // Order form
    "yourName": "Il Tuo Nome",
    "phoneNumber": "Numero di Telefono",
    "address": "Indirizzo",
    "deliveryAddress": "Indirizzo di Consegna",
    "specialRequests": "Richieste Speciali",
    "quantity": "Quantità",
    "submitOrder": "Invia Ordine",
    "processingOrder": "Elaborazione Ordine...",
    
    // Contact info
    "phoneContact": "Telefono",
    "emailContact": "Email",
    "hours": "Orari di Apertura",
    "location": "Posizione",
    
    // Pizza descriptions
    "authenticPizza": "Pizza autentica italiana",
    "freshIngredients": "Ingredienti freschi e di qualità",
    "traditionalOven": "Cotta nel forno a legna tradizionale",
    "handmadeDough": "Impasto fatto a mano quotidianamente",
    "yearsExperience": "Anni di Esperienza",
    "happyCustomers": "Clienti Soddisfatti",
    "pizzaVarieties": "Varietà di Pizza",
    
    // Order tracking
    "trackOrder": "Traccia il tuo Ordine",
    "orderStatus": "Stato Ordine",
    "orderNumber": "Numero Ordine",
    "orderTotal": "Totale Ordine",
    "orderItems": "Articoli Ordinati",
    "orderConfirmed": "Ordine Confermato",
    "orderPreparing": "In Preparazione",
    "orderReady": "Pronto",
    "orderDelivered": "Consegnato",
    "orderCancelled": "Annullato",
    "refreshStatus": "Aggiorna Stato",
    "noActiveOrder": "Nessun ordine attivo",
    "orderUpdated": "Ordine Aggiornato",
    "realTimeActive": "Real-time Attivo",
    
    // Payment
    "paymentMethod": "Metodo di Pagamento",
    "cashOnDelivery": "Contanti alla Consegna",
    "creditCard": "Carta di Credito",
    "paymentCompleted": "Pagamento Completato",
    "paymentPending": "Pagamento in Attesa",
    
    // Admin Panel
    "adminPanel": "Pannello Amministrativo",
    "manageOrders": "Gestione Ordini",
    "manageProducts": "Gestione Prodotti",
    "settings": "Impostazioni",
    "notifications": "Notifiche",
    
    // Common actions
    "save": "Salva",
    "cancel": "Annulla",
    "delete": "Elimina",
    "edit": "Modifica",
    "add": "Aggiungi",
    "search": "Cerca",
    "filter": "Filtra",
    "refresh": "Aggiorna",
    "loading": "Caricamento...",
    "error": "Errore",
    "success": "Successo",
    "confirm": "Conferma",
    "close": "Chiudi",
    "back": "Indietro",
    "next": "Avanti",
    "total": "Totale",
    "all": "Tutti",
    "none": "Nessuno",
    "clear": "Pulisci",
    "apply": "Applica",
    "submit": "Invia",
    "create": "Crea",
    "update": "Aggiorna",
    "view": "Visualizza",
    "details": "Dettagli",
    
    // Order statuses
    "pending": "In Attesa",
    "confirmed": "Confermato",
    "preparing": "In Preparazione",
    "ready": "Pronto",
    "delivered": "Consegnato",
    "cancelled": "Annullato",

    // Hero section
    "pizzeriaName": "Pizzeria Regina 2000",
    "pizzeriaLocation": "Torino",
    "heroSubtitle": "Autentica Pizza Italiana",
    "heroDescription": "Autentica pizza italiana nel cuore di Torino dal 2000",
    "goToGallery": "Vai alla Galleria",

    // Footer services
    "ourServices": "I Nostri Servizi",
    "pizzaAlTaglio": "Pizza al Taglio",
    "homeDelivery": "Consegna a Domicilio",
    "customPizza": "Pizza Personalizzata",
    "beveragesAndDesserts": "Bevande e Dolci",
    "openingHours": "Orari di Apertura",
    "defaultHours": "Lun-Dom: 08:00 - 19:00",

    // Navigation
    "products": "Menu",

    // WeOffer section
    "weOffer": "Offriamo",
    "weOfferSubtitle": "Scopri le nostre autentiche specialità italiane",
    "pizzaMetroTitle": "Pizza Metro Finchi 5 Gusti",
    "pizzaMetroDesc": "Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un'unica creazione straordinaria. Perfetta da condividere con famiglia e amici.",
    "flourQualityTitle": "Usiamo la Farina 5 Stagioni Gusti, Alta Qualità",
    "flourQualityDesc": "Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto leggero, digeribile e incredibilmente saporito.",
    "italianPizzaTitle": "Realizziamo Tutti i Tipi di Pizza Italiana di Alta Qualità e Molto Deliziosa",
    "italianPizzaDesc": "Dalla classica Margherita alle specialità gourmet, realizziamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un'autentica esperienza italiana.",
    "specialtyBadge": "Specialità",
    "qualityBadge": "Qualità",
    "authenticBadge": "Autentico",

    // Store Address
    "storeAddress": "📍 C.so Giulio Cesare, 36, 10152 Torino TO"
  },
  en: {
    // Navigation
    "home": "Home",
    "menu": "Menu",
    "gallery": "Gallery",
    "about": "About Us",
    "contact": "Contact",
    "orders": "Orders",
    
    // Main sections
    "ourMenu": "Our Menu",
    "menuDescription": "Discover our authentic pizzas made with fresh ingredients",
    "orderNow": "Order Now",
    "makeOrder": "Place an Order",
    "makeReservation": "Order Now",
    "contactUs": "Contact Us",
    "findUs": "Find Us",
    
    // Pizza categories
    "pizzeClassiche": "Classic Pizzas",
    "pizzeSpeciali": "Specialty Pizzas",
    "pizzeAlMetro": "Meter Pizzas",
    "bevande": "Beverages",
    "extras": "Extras",
    
    // Order form
    "yourName": "Your Name",
    "phoneNumber": "Phone Number",
    "address": "Address",
    "deliveryAddress": "Delivery Address",
    "specialRequests": "Special Requests",
    "quantity": "Quantity",
    "submitOrder": "Submit Order",
    "processingOrder": "Processing Order...",
    
    // Contact info
    "phoneContact": "Phone",
    "emailContact": "Email",
    "hours": "Opening Hours",
    "location": "Location",
    
    // Pizza descriptions
    "authenticPizza": "Authentic Italian Pizza",
    "freshIngredients": "Fresh and quality ingredients",
    "traditionalOven": "Cooked in traditional wood-fired oven",
    "handmadeDough": "Handmade dough prepared daily",
    "yearsExperience": "Years of Experience",
    "happyCustomers": "Happy Customers",
    "pizzaVarieties": "Pizza Varieties",
    
    // Order tracking
    "trackOrder": "Track Your Order",
    "orderStatus": "Order Status",
    "orderNumber": "Order Number",
    "orderTotal": "Order Total",
    "orderItems": "Ordered Items",
    "orderConfirmed": "Order Confirmed",
    "orderPreparing": "Preparing",
    "orderReady": "Ready",
    "orderDelivered": "Delivered",
    "orderCancelled": "Cancelled",
    "refreshStatus": "Refresh Status",
    "noActiveOrder": "No Active Order",
    "orderUpdated": "Order Updated",
    "realTimeActive": "Real-time Active",
    
    // Payment
    "paymentMethod": "Payment Method",
    "cashOnDelivery": "Cash on Delivery",
    "creditCard": "Credit Card",
    "paymentCompleted": "Payment Completed",
    "paymentPending": "Payment Pending",
    
    // Admin Panel
    "adminPanel": "Admin Panel",
    "manageOrders": "Manage Orders",
    "manageProducts": "Manage Products",
    "settings": "Settings",
    "notifications": "Notifications",
    
    // Common actions
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "filter": "Filter",
    "refresh": "Refresh",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "confirm": "Confirm",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "total": "Total",
    "all": "All",
    "none": "None",
    "clear": "Clear",
    "apply": "Apply",
    "submit": "Submit",
    "create": "Create",
    "update": "Update",
    "view": "View",
    "details": "Details",
    
    // Order statuses
    "pending": "Pending",
    "confirmed": "Confirmed",
    "preparing": "Preparing",
    "ready": "Ready",
    "delivered": "Delivered",
    "cancelled": "Cancelled",

    // Hero section
    "pizzeriaName": "Pizzeria Regina 2000",
    "pizzeriaLocation": "Turin",
    "heroSubtitle": "Authentic Italian Pizza",
    "heroDescription": "Authentic Italian pizza in the heart of Turin since 2000",
    "goToGallery": "Go to Gallery",

    // Footer services
    "ourServices": "Our Services",
    "pizzaAlTaglio": "Pizza by the Slice",
    "homeDelivery": "Home Delivery",
    "customPizza": "Custom Pizza",
    "beveragesAndDesserts": "Beverages and Desserts",
    "openingHours": "Opening Hours",
    "defaultHours": "Mon-Sun: 08:00 - 19:00",

    // Navigation
    "products": "Menu",

    // WeOffer section
    "weOffer": "Offriamo",
    "weOfferSubtitle": "Discover our authentic Italian specialties",
    "pizzaMetroTitle": "Pizza Metro Finchi 5 Gusti",
    "pizzaMetroDesc": "Experience our signature meter-long pizza with up to 5 different flavors in one amazing creation. Perfect for sharing with family and friends.",
    "flourQualityTitle": "We Use 5 Stagioni Flour, High Quality",
    "flourQualityDesc": "We use premium 5 Stagioni flour, the finest quality ingredients that make our pizza dough light, digestible and incredibly flavorful.",
    "italianPizzaTitle": "We Make All Kinds of Italian Pizza with High Quality and Very Delicious",
    "italianPizzaDesc": "From classic Margherita to gourmet specialties, we craft every pizza with passion, using traditional techniques and the finest ingredients for an authentic Italian experience.",
    "specialtyBadge": "Specialty",
    "qualityBadge": "Quality",
    "authenticBadge": "Authentic",

    // Store Address
    "storeAddress": "📍 C.so Giulio Cesare, 36, 10152 Torino TO"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("it"); // Default to Italian
  
  useEffect(() => {
    // Initialize default language settings if they don't exist
    const savedSettings = localStorage.getItem('pizzeriaSettings');
    if (!savedSettings) {
      const defaultSettings = {
        totalSeats: 50,
        reservationDuration: 120,
        openingTime: "11:30",
        closingTime: "22:00",
        languages: ["it", "en"],
        defaultLanguage: "it"
      };
      localStorage.setItem('pizzeriaSettings', JSON.stringify(defaultSettings));
    } else {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.defaultLanguage) {
          setLanguageState(parsedSettings.defaultLanguage as Language);
        }
      } catch (e) {
        console.error('Failed to parse settings for language');
      }
    }
    
    // Set the html lang attribute
    document.documentElement.lang = language;
    
    // No RTL needed for Italian and English
    document.documentElement.dir = "ltr";
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Update settings in localStorage
    const savedSettings = localStorage.getItem('pizzeriaSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.defaultLanguage = lang;
        localStorage.setItem('pizzeriaSettings', JSON.stringify(parsedSettings));
      } catch (e) {
        console.error('Failed to update language setting');
      }
    }
  };

  const t = (key: string) => {
    return translations[language][key] || translations.en[key] || key;
  };

  const value = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
