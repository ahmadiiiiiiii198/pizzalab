
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
  const [isDismissed, setIsDismissed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);

  // Calculate header height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);
        console.log("📏 [WebsitePopup] Header height:", height);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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

    // Load popup immediately
    console.log("⏰ [WebsitePopup] Loading popup...");
    loadActivePopup();

    // Listen for storage events to reload popup when admin updates it
    const handleStorageChange = () => {
      loadActivePopup();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleStorageChange);

    return () => {
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
          // Show popup immediately
          console.log("🎉 [WebsitePopup] Making popup visible!");
          setIsVisible(true);
          sessionStorage.setItem(`popup-shown-${popupToShow.id}`, 'true');
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
    setIsDismissed(true);
    // Mark as dismissed for this session so it doesn't reappear
    if (activePopup) {
      sessionStorage.setItem(`popup-dismissed-${activePopup.id}`, 'true');
    }
  };

  // Don't show if not active, not visible, on admin page, or if dismissed
  if (!activePopup || !isVisible || isAdmin || isDismissed) {
    return null;
  }

  // Check if popup was dismissed in this session
  const popupDismissed = activePopup ? sessionStorage.getItem(`popup-dismissed-${activePopup.id}`) : null;
  if (popupDismissed) {
    return null;
  }

  return (
    <>
      {/* Overlay background */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Panel container */}
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform animate-in slide-in-from-bottom-4 duration-300">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white p-6 rounded-t-xl relative">
            <h2 className="text-xl font-bold mb-2 pr-8">
              🎉 {activePopup.title}
            </h2>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closePopup}
              className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/20 rounded-full p-2"
              aria-label="Chiudi popup"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content area */}
          <div className="p-6">
            {/* Image if available */}
            {activePopup.image && (
              <div className="mb-4">
                <img
                  src={activePopup.image}
                  alt={activePopup.title}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Content text */}
            <div className="text-gray-700 leading-relaxed mb-6">
              {activePopup.content}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={closePopup}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Capito!
              </Button>
              <Button
                variant="outline"
                onClick={closePopup}
                className="px-6 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes slide-in-from-bottom {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-bottom-4 {
          animation: slide-in-from-bottom 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default WebsitePopup;
