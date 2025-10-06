
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
    <div
      className="fixed left-0 right-0 w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white shadow-lg overflow-hidden z-40"
      style={{ top: `${headerHeight}px` }}
    >
      <div className="relative flex items-center">
        {/* Scrolling text container */}
        <div className="flex-1 overflow-hidden py-3">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-lg font-semibold mx-8">
              🎉 {activePopup.title} - {activePopup.content}
            </span>
            <span className="text-lg font-semibold mx-8">
              🎉 {activePopup.title} - {activePopup.content}
            </span>
            <span className="text-lg font-semibold mx-8">
              🎉 {activePopup.title} - {activePopup.content}
            </span>
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={closePopup}
          className="absolute right-2 text-white hover:text-white hover:bg-white/20 rounded-full p-2 z-10"
          aria-label="Chiudi banner"
        >
          <X size={20} />
        </Button>
      </div>

      {/* CSS for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default WebsitePopup;
