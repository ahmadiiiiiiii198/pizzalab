
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface PopupData {
  id: string;
  title: string;
  content: string;
  image?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

const WebsitePopup: React.FC = () => {
  const [activePopup, setActivePopup] = useState<PopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if we're on admin page to prevent popup
  useEffect(() => {
    const path = window.location.pathname;
    setIsAdmin(path.includes('/admin'));

    console.log("🚀 [WebsitePopup] Component mounted. Path:", path, "IsAdmin:", path.includes('/admin'));

    // Don't show popups on admin page
    if (path.includes('/admin')) {
      console.log("❌ [WebsitePopup] Skipping popup load - on admin page");
      return;
    }

    // Clear any existing session storage for testing
    console.log("🧹 [WebsitePopup] Clearing session storage for testing...");
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('popup-')) {
        console.log("🗑️ [WebsitePopup] Removing session key:", key);
        sessionStorage.removeItem(key);
      }
    });

    // Load popup after a short delay to prioritize main content rendering
    const timer = setTimeout(() => {
      console.log("⏰ [WebsitePopup] Timer triggered, loading popup...");
      loadActivePopup();
    }, 1000);

    // Listen for storage events to reload popup when admin updates it
    const handleStorageChange = () => {
      loadActivePopup();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleStorageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleStorageChange);
    };
  }, []);
  
  const loadActivePopup = async () => {
    try {
      console.log("🔍 [WebsitePopup] Starting to load popups from database...");

      // Load popups directly from database
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'popups')
        .maybeSingle();

      console.log("🔍 [WebsitePopup] Database query result:", { data, error });

      let allPopups: PopupData[] = [];

      if (data && !error && data.value) {
        // Use proper type assertion to convert the JSON data to PopupData[]
        const popupsValue = data.value as unknown;
        allPopups = Array.isArray(popupsValue) ? popupsValue as PopupData[] : [];
        console.log("✅ [WebsitePopup] Loaded popups from database:", allPopups);
      } else {
        console.log("❌ [WebsitePopup] No data found or error occurred:", { data, error });
      }

      if (allPopups.length === 0) {
        console.log("⚠️ [WebsitePopup] No popups found in database");
        return;
      }

      // Filter active popups
      const today = new Date();
      console.log("🔍 [WebsitePopup] Filtering popups. Today:", today);
      console.log("🔍 [WebsitePopup] All popups before filtering:", allPopups);

      const activePopups = allPopups.filter(popup => {
        console.log(`🔍 [WebsitePopup] Checking popup ${popup.id}:`, {
          isActive: popup.isActive,
          startDate: popup.startDate,
          endDate: popup.endDate
        });

        if (!popup.isActive) {
          console.log(`❌ [WebsitePopup] Popup ${popup.id} is not active`);
          return false;
        }

        let isInDateRange = true;

        // Check start date if it exists
        if (popup.startDate) {
          const startDate = new Date(popup.startDate);
          if (startDate > today) {
            console.log(`❌ [WebsitePopup] Popup ${popup.id} start date is in future`);
            isInDateRange = false;
          }
        }

        // Check end date if it exists
        if (popup.endDate) {
          const endDate = new Date(popup.endDate);
          if (endDate < today) {
            console.log(`❌ [WebsitePopup] Popup ${popup.id} end date is in past`);
            isInDateRange = false;
          }
        }

        const result = isInDateRange;
        console.log(`🔍 [WebsitePopup] Popup ${popup.id} filter result:`, result);
        return result;
      });

      console.log("✅ [WebsitePopup] Active popups after filtering:", activePopups);
      
      // Show the first active popup if there is one
      if (activePopups.length > 0) {
        const popupToShow = activePopups[0];
        console.log("🎯 [WebsitePopup] Found active popup to show:", popupToShow);

        // Check if we've shown this popup already in this session
        const popupShown = sessionStorage.getItem(`popup-shown-${popupToShow.id}`);
        const popupDismissed = sessionStorage.getItem(`popup-dismissed-${popupToShow.id}`);

        console.log("🔍 [WebsitePopup] Session storage check:", {
          popupShown,
          popupDismissed,
          popupId: popupToShow.id
        });

        if (!popupShown && !popupDismissed) {
          console.log("✅ [WebsitePopup] Setting active popup and showing...");
          setActivePopup(popupToShow);
          // Show popup after a short delay for better UX
          setTimeout(() => {
            console.log("🎉 [WebsitePopup] Making popup visible!");
            setIsVisible(true);
            sessionStorage.setItem(`popup-shown-${popupToShow.id}`, 'true');
          }, 1500); // Delay to let page load first
        } else {
          console.log("❌ [WebsitePopup] Popup already shown or dismissed in this session");
        }
      } else {
        console.log("❌ [WebsitePopup] No active popups found after filtering");
      }
    } catch (error) {
      console.error("Error loading popups:", error);
    }
  };
  
  const closePopup = () => {
    setIsVisible(false);
    // Mark as dismissed for this session so it doesn't reappear
    if (activePopup) {
      sessionStorage.setItem(`popup-dismissed-${activePopup.id}`, 'true');
    }
  };

  // Don't show if not active, not visible, on admin page, or if dismissed
  if (!activePopup || !isVisible || isAdmin) {
    return null;
  }

  // Check if popup was dismissed in this session
  const popupDismissed = activePopup ? sessionStorage.getItem(`popup-dismissed-${activePopup.id}`) : null;
  if (popupDismissed) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={closePopup}
      />

      {/* Popup modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{activePopup.title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closePopup}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2"
              aria-label="Chiudi popup"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activePopup.image && (
              <div className="mb-4">
                <img
                  src={activePopup.image}
                  alt={activePopup.title}
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            )}
            <p className="text-gray-700 leading-relaxed">{activePopup.content}</p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button
              onClick={closePopup}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300"
            >
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WebsitePopup;
