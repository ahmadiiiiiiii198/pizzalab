import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderNotification {
  id: string;
  order_id: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  title?: string;
  is_acknowledged?: boolean;
  metadata?: any;
  read_at?: string | null;
  order_details?: {
    customer_name: string;
    total_amount: number;
    items_count: number;
  };
}

const OrderNotificationSystem = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Initialize audio system
  useEffect(() => {
    console.log('🔊 [OrderNotification] Initializing notification system...');

    const initializeAudio = () => {
      try {
        // Create simple audio element with beep sound
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.8;

        // Use a simple beep sound data URL
        const beepDataUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        audio.src = beepDataUrl;

        // Populate header controls
        populateHeaderControls();

        // Handle audio load errors - use simple fallback
        audio.onerror = () => {
          console.log('🔊 [OrderNotification] Audio file not found, creating simple beep fallback');

          // Create a simple beep sound using data URL
          const beepDataUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE';

          const fallbackAudio = new Audio(beepDataUrl);
          fallbackAudio.loop = true;
          fallbackAudio.volume = 0.3;

          audioRef.current = fallbackAudio;
          console.log('🔊 [OrderNotification] Fallback beep audio created');
        };

        audioRef.current = audio;
        setIsInitialized(true);
        console.log('🔊 [OrderNotification] Audio system initialized successfully');

        // Force check for notifications immediately after initialization
        setTimeout(() => {
          console.log('🚨 [OrderNotification] FORCE CHECKING NOTIFICATIONS AFTER INIT');
          fetchNotifications();
        }, 500);

      } catch (error) {
        console.error('🔊 [OrderNotification] Audio initialization error:', error);
        setError(`Audio initialization failed: ${error.message}`);
        setIsInitialized(true); // Still mark as initialized to continue
      }
    };

    initializeAudio();

    return () => {
      try {
        // Clean up Web Audio API
        isBeepPlayingRef.current = false;
        if (beepIntervalRef.current) {
          clearInterval(beepIntervalRef.current);
          beepIntervalRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        // Clean up HTML audio
        if (audioRef.current && typeof audioRef.current.pause === 'function') {
          audioRef.current.pause();
        }

        // Clean up intervals
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } catch (error) {
        console.warn('🔊 [OrderNotification] Cleanup error:', error);
      }
    };
  }, []);

  // Memoized fetch notifications function to prevent recreation
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('📡 [OrderNotification] Fetching notifications...');

      // Check if we have a valid supabase client
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Check authentication status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.warn('📡 [OrderNotification] Auth check failed:', authError);
        // Continue without auth for public access
      }

      console.log('📡 [OrderNotification] Auth status:', session ? 'authenticated' : 'anonymous');

      // Try a simple query first to test table access
      const { data, error } = await supabase
        .from('order_notifications')
        .select(`
          id,
          order_id,
          message,
          notification_type,
          title,
          is_read,
          is_acknowledged,
          created_at,
          read_at,
          metadata
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to prevent large queries

      if (error) {
        console.warn('📡 [OrderNotification] Database query error:', error);
        console.warn('📡 [OrderNotification] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Don't throw error, just log it and continue with empty notifications
        setNotifications([]);
        setError(`Database query failed: ${error.message}`);
        return;
      }

      // Process notifications without complex joins for now
      const formattedNotifications = data?.map(notification => ({
        ...notification,
        // We'll fetch order details separately if needed
        order_details: undefined
      })) || [];

      setNotifications(formattedNotifications);
      console.log(`📡 [OrderNotification] Found ${formattedNotifications.length} notifications`);

      // FORCE START SOUND if there are unread notifications
      if (formattedNotifications.length > 0) {
        console.log('🚨 [OrderNotification] UNREAD NOTIFICATIONS FOUND - FORCE STARTING SOUND');
        console.log('🔊 [OrderNotification] Current state before sound start:', {
          isSoundEnabled,
          isPlaying,
          audioRef: !!audioRef.current,
          isInitialized
        });

        if (isSoundEnabled && !isPlaying) {
          console.log('🔊 [OrderNotification] ===== STARTING SOUND NOW =====');
          startNotificationSound();
        } else if (!isSoundEnabled) {
          console.log('🔊 [OrderNotification] Sound is DISABLED - enabling it now');
          setIsSoundEnabled(true);
          setTimeout(() => startNotificationSound(), 100);
        } else if (isPlaying) {
          console.log('🔊 [OrderNotification] Sound already playing - continuing');
        }

        // Always update header controls when notifications are found
        console.log('🔧 [OrderNotification] Updating header controls after notification check');
        populateHeaderControls();
      } else if (formattedNotifications.length === 0 && isPlaying) {
        console.log('🔊 [OrderNotification] No notifications found, but keeping sound playing (manual stop only)');
        // IMPORTANT: DON'T auto-stop sound - let user manually stop it with the stop button
        // This ensures continuous notification until manually stopped
      }
    } catch (error) {
      console.error('📡 [OrderNotification] Error fetching notifications:', error);
      setError(`Failed to fetch notifications: ${error.message}`);
      // Continue with empty notifications instead of crashing
      setNotifications([]);
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Start continuous notification sound
  const startNotificationSound = async () => {
    try {
      console.log('🔊 [OrderNotification] ===== STARTING SOUND =====');
      const iosStatus = iosAudioFix.getStatus();
      console.log('🔊 [OrderNotification] iOS Audio Status:', iosStatus);
      console.log('🔊 [OrderNotification] Mobile check:', {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        userAgent: navigator.userAgent
      });

      if (!isSoundEnabled) {
        console.warn('🔊 [OrderNotification] ⚠️ Sound disabled');
        return;
      }

      if (isPlaying) {
        console.log('🔊 [OrderNotification] ⚠️ Already playing');
        return;
      }

      // Try iOS-specific audio first
      if (iosStatus.isIOS) {
        console.log('🍎 [OrderNotification] Using iOS audio fix...');
        const iosSuccess = await iosAudioFix.playNotificationSound();
        if (iosSuccess) {
          console.log('🍎 [OrderNotification] ✅ iOS audio played successfully');
          setIsPlaying(true);

          // Start looping for iOS
          const stopLoop = await iosAudioFix.playLoopingSound();
          // Store stop function for later use
          (window as any).stopIOSLoop = stopLoop;
          return;
        } else {
          console.log('🍎 [OrderNotification] ❌ iOS audio failed, falling back to standard');
        }
      }

      // Fallback to standard audio for non-iOS or if iOS fails
      if (!audioRef.current) {
        console.error('🔊 [OrderNotification] ❌ No audio reference');
        return;
      }

      console.log('🔊 [OrderNotification] Audio details:', {
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        volume: audioRef.current.volume,
        loop: audioRef.current.loop,
        src: audioRef.current.src,
        readyState: audioRef.current.readyState
      });

      setIsPlaying(true);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.8; // Increase volume for mobile

      // For mobile, try to play with user gesture context
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 [OrderNotification] ✅ Sound started successfully');
            // Update header controls after successful play
            populateHeaderControls();
          })
          .catch(error => {
            console.error('🔊 [OrderNotification] ❌ Play error:', error);
            console.error('🔊 [OrderNotification] Error details:', {
              name: error.name,
              message: error.message,
              code: error.code
            });

            // On mobile, audio might be blocked - show user interaction needed
            if (error.name === 'NotAllowedError' || error.message.includes('user interaction')) {
              console.log('🔊 [OrderNotification] 📱 Mobile audio blocked - need user interaction');
              setError('Tap the notification button to enable sound');
            }

            setIsPlaying(false);
            populateHeaderControls();
          });
      }

    } catch (error) {
      console.error('🔊 [OrderNotification] ❌ Start sound error:', error);
      setIsPlaying(false);
    }
  };

  // Memoized stop notification sound function
  const stopNotificationSound = useCallback(() => {
    try {
      console.log('🔊 [OrderNotification] Stopping notification sound...');

      // Clear interval first
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
        console.log('🔊 [OrderNotification] Sound interval cleared');
      }

      // Stop iOS audio loop if exists
      if ((window as any).stopIOSLoop) {
        console.log('🍎 [OrderNotification] Stopping iOS audio loop...');
        (window as any).stopIOSLoop();
        (window as any).stopIOSLoop = null;
      }

      // Stop and reset standard audio
      if (audioRef.current) {
        audioRef.current.pause();
        if (typeof audioRef.current.currentTime !== 'undefined') {
          audioRef.current.currentTime = 0;
        }
        console.log('🔊 [OrderNotification] Audio stopped and reset');
      }

      // Update state
      setIsPlaying(false);
      console.log('🔊 [OrderNotification] Sound stopped successfully');
    } catch (error) {
      console.error('🔊 [OrderNotification] Stop sound error:', error);
      // Force state update even if there's an error
      setIsPlaying(false);
    }
  }, []);

  // Manual sound trigger for mobile (requires user interaction)
  const triggerSoundWithUserGesture = () => {
    console.log('🔊 [OrderNotification] ===== MANUAL SOUND TRIGGER (USER GESTURE) =====');

    // Enable sound first
    setIsSoundEnabled(true);

    // If there are notifications, start sound
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > 0) {
      console.log('🔊 [OrderNotification] Starting sound with user gesture');
      startNotificationSound();
    } else {
      console.log('🔊 [OrderNotification] No notifications to play sound for');
    }
  };

  // Memoized force stop all sounds function
  const forceStopSound = useCallback(() => {
    console.log('🔇 [OrderNotification] ===== FORCE STOPPING ALL AUDIO SYSTEMS =====');

    try {
      // 0. Stop iOS audio loop first
      if ((window as any).stopIOSLoop) {
        console.log('🔇 [OrderNotification] 🍎 STOPPING iOS AUDIO LOOP');
        (window as any).stopIOSLoop();
        (window as any).stopIOSLoop = null;
        console.log('🔇 [OrderNotification] ✅ iOS audio loop stopped');
      }

      // 1. Stop our own audio system
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
        console.log('🔇 [OrderNotification] ✅ Sound interval cleared');
      }

      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
        console.log('🔇 [OrderNotification] ✅ Beep interval cleared');
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log('🔇 [OrderNotification] ✅ Our audio stopped');
      }

      // 2. Stop the REAL notification system (ContinuousAudioNotifier)
      if ((window as any).audioNotifier) {
        console.log('🔇 [OrderNotification] 🎯 STOPPING REAL AUDIO NOTIFIER');
        (window as any).audioNotifier.stopRinging();
        console.log('🔇 [OrderNotification] ✅ Real audio notifier stopped');
      } else {
        console.log('🔇 [OrderNotification] ⚠️ Real audio notifier not found');
      }

      // 3. Stop background music if playing (using dynamic import with Promise)
      import('@/services/audioService')
        .then(({ default: audioService }) => {
          if (audioService.isPlaying()) {
            audioService.pause();
            console.log('🔇 [OrderNotification] ✅ Background music stopped');
          }
        })
        .catch(() => {
          console.log('🔇 [OrderNotification] ⚠️ Background music service not available');
        });

      // 4. Update our state
      setIsPlaying(false);
      console.log('🔇 [OrderNotification] ✅ isPlaying set to false');

      // 5. Mark notifications as read
      setTimeout(() => {
        console.log('🔇 [OrderNotification] Marking all notifications as read...');
        markAllAsRead(true);
      }, 100);

      console.log('🔇 [OrderNotification] ✅ ALL AUDIO SYSTEMS STOPPED SUCCESSFULLY');
    } catch (error) {
      console.error('🔇 [OrderNotification] ❌ Error during force stop:', error);
      setIsPlaying(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // DON'T auto-stop sound when marking as read - let user manually stop it
      console.log('🔊 [OrderNotification] Notification marked as read, but keeping sound playing (manual stop only)');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async (shouldStopSound = false) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications([]);

      // Only stop sound if explicitly requested (from force stop button)
      if (shouldStopSound) {
        stopNotificationSound();
        console.log('🔊 [OrderNotification] Sound stopped as requested by force stop');
      } else {
        console.log('🔊 [OrderNotification] All notifications marked as read, but keeping sound playing (manual stop only)');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Populate header controls for both mobile and desktop
  const populateHeaderControls = () => {
    const mobileHeaderControls = document.getElementById('header-notification-controls');
    const desktopHeaderControls = document.getElementById('header-notification-controls-desktop');

    console.log('🔧 [OrderNotification] Looking for header controls:', {
      mobile: !!mobileHeaderControls,
      desktop: !!desktopHeaderControls,
      mobileElement: mobileHeaderControls,
      desktopElement: desktopHeaderControls
    });

    // Debug: Check if we're on the right page
    console.log('🔧 [OrderNotification] Current page info:', {
      pathname: window.location.pathname,
      url: window.location.href,
      title: document.title
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;
    console.log('🔧 [OrderNotification] State check:', { isPlaying, unreadCount, isInitialized });

    // Function to create stop button
    const createStopButton = (isMobile = false) => {
      const stopButton = document.createElement('button');

      if (isMobile) {
        // Mobile button - more compact
        stopButton.className = `px-2 py-1 rounded-md shadow-md transition-all duration-300 font-medium text-xs flex items-center space-x-1 ${
          isPlaying ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' :
          unreadCount > 0 ? 'bg-orange-600 text-white hover:bg-orange-700' :
          'bg-gray-600 text-white hover:bg-gray-700'
        }`;

        const buttonText = isPlaying ? 'Stop' :
                          unreadCount > 0 ? `${unreadCount}` :
                          'Stop';

        stopButton.innerHTML = `<span>🔇</span><span>${buttonText}</span>`;
      } else {
        // Desktop button - full size
        stopButton.className = `px-3 py-1 rounded-lg shadow-md transition-all duration-300 font-medium text-sm flex items-center space-x-1 ${
          isPlaying ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' :
          unreadCount > 0 ? 'bg-orange-600 text-white hover:bg-orange-700' :
          'bg-gray-600 text-white hover:bg-gray-700'
        }`;

        const buttonText = isPlaying ? 'Stop Suoni' :
                          unreadCount > 0 ? `Ordini (${unreadCount})` :
                          'Stop Audio';

        stopButton.innerHTML = `<span>🔇</span><span>${buttonText}</span>`;
      }

      stopButton.onclick = () => {
        console.log('🔇 [OrderNotification] Header button clicked');

        // If sound is playing, stop it
        if (isPlaying) {
          console.log('🔇 [OrderNotification] Stopping sound');
          forceStopSound();
        }
        // If there are notifications but no sound, try to start sound (mobile fix)
        else if (unreadCount > 0 && !isPlaying) {
          console.log('🔊 [OrderNotification] Starting sound with user gesture (mobile fix)');
          triggerSoundWithUserGesture();
        }
        // If no notifications, just stop any remaining sounds
        else {
          console.log('🔇 [OrderNotification] Force stopping any remaining sounds');
          forceStopSound();
        }
      };

      return stopButton;
    };

    // Populate mobile header
    if (mobileHeaderControls) {
      mobileHeaderControls.innerHTML = '';
      if (isPlaying || unreadCount > 0 || isInitialized) {
        mobileHeaderControls.appendChild(createStopButton(true));
        console.log('🔧 [OrderNotification] Mobile stop button added');
      }
    }

    // Populate desktop header
    if (desktopHeaderControls) {
      desktopHeaderControls.innerHTML = '';
      if (isPlaying || unreadCount > 0 || isInitialized) {
        desktopHeaderControls.appendChild(createStopButton(false));
        console.log('🔧 [OrderNotification] Desktop stop button added');
      }
    }

    console.log('🔧 [OrderNotification] Header controls updated');
  };

  // Update header controls when state changes
  useEffect(() => {
    populateHeaderControls();
  }, [isPlaying, notifications]);

  // Set up real-time subscription only after initialization
  useEffect(() => {
    console.log('📡 [OrderNotification] ===== SETTING UP REAL-TIME SUBSCRIPTION =====');
    console.log('📡 [OrderNotification] Subscription state:', {
      isInitialized,
      isSoundEnabled,
      currentURL: window.location.href,
      timestamp: new Date().toISOString()
    });

    if (!isInitialized) {
      console.log('📡 [OrderNotification] Waiting for initialization...');
      return;
    }

    console.log('📡 [OrderNotification] Setting up real-time subscription...');

    // Add a small delay to ensure everything is ready
    const initTimer = setTimeout(() => {
      // Initial fetch
      console.log('🚨 [OrderNotification] FORCE FETCHING NOTIFICATIONS ON MOUNT');
      fetchNotifications();

      // Set up real-time subscription
      const subscription = supabase
        .channel('order_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_notifications' },
          () => {
            console.log('📡 [OrderNotification] New notification received via real-time');
            fetchNotifications();
          }
        )
        .subscribe();

      // Listen for custom events from OrdersAdmin
      const handleNewOrderEvent = (event: CustomEvent) => {
        console.log('🚨 [OrderNotification] Custom new order event received:', event.detail);
        // Force fetch notifications and start sound
        fetchNotifications();
        if (isSoundEnabled && !isPlaying) {
          console.log('🔊 [OrderNotification] Starting sound from custom event');
          startNotificationSound();
        }
      };

      window.addEventListener('newOrderReceived', handleNewOrderEvent as EventListener);

      // Poll for notifications every 30 seconds as backup
      intervalRef.current = setInterval(() => {
        console.log('📡 [OrderNotification] Polling for notifications...');
        fetchNotifications();
      }, 30000);

      return () => {
        console.log('📡 [OrderNotification] Cleaning up subscription...');
        subscription.unsubscribe();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, 500); // 500ms delay for initialization

    return () => {
      clearTimeout(initTimer);
    };
  }, [isInitialized, isSoundEnabled]);

  // Add keyboard shortcut to stop sound (ESC key)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPlaying) {
        console.log('🔇 [OrderNotification] ESC key pressed - stopping sound');
        forceStopSound();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying]);

  const unreadCount = notifications.length;

  // Check real audio system state
  const realAudioNotifier = (window as any).audioNotifier;
  const isRealAudioPlaying = realAudioNotifier ? realAudioNotifier.isRinging : false;

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="p-3 bg-blue-100 text-blue-800 rounded-full shadow-lg">
          <Bell className="h-6 w-6 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>


      {/* Error Display (if any) */}
      {error && (
        <div className="fixed top-32 right-4 z-50 max-w-sm">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Notification system warning</span>
            </div>
          </div>
        </div>
      )}


      {/* Fallback Stop Button - Always visible for emergency stop */}
      {isInitialized && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => {
              console.log('🔇 [OrderNotification] Fallback button clicked');

              const unreadCount = notifications.filter(n => !n.is_read).length;

              // If sound is playing, stop it
              if (isPlaying) {
                console.log('🔇 [OrderNotification] Stopping sound');
                forceStopSound();
              }
              // If there are notifications but no sound, try to start sound (mobile fix)
              else if (unreadCount > 0 && !isPlaying) {
                console.log('🔊 [OrderNotification] Starting sound with user gesture (mobile fix)');
                triggerSoundWithUserGesture();
              }
              // If no notifications, just stop any remaining sounds
              else {
                console.log('🔇 [OrderNotification] Force stopping any remaining sounds');
                forceStopSound();
              }
            }}
            className={`px-4 py-2 rounded-xl shadow-lg transition-all duration-300 font-bold text-sm border-2 ${
              isPlaying
                ? 'bg-red-600 text-white animate-pulse border-red-400 hover:bg-red-700'
                : notifications.filter(n => !n.is_read).length > 0
                ? 'bg-orange-600 text-white border-orange-400 hover:bg-orange-700'
                : 'bg-gray-600 text-white border-gray-400 hover:bg-gray-700'
            }`}
            title={isPlaying ? "Stop notification sound" : notifications.filter(n => !n.is_read).length > 0 ? "Start notification sound" : "Emergency stop for all sounds"}
          >
            <div className="flex items-center space-x-2">
              <span>{isPlaying ? '🔇' : notifications.filter(n => !n.is_read).length > 0 ? '🔊' : '🔇'}</span>
              <span>
                {isPlaying ? 'STOP SUONO' :
                 notifications.filter(n => !n.is_read).length > 0 ? 'PLAY SUONO' :
                 'STOP AUDIO'}
              </span>
            </div>
          </button>

          {/* Manual Test Button */}
          <button
            onClick={() => {
              console.log('🧪 [OrderNotification] Manual test button clicked');
              if (!isPlaying) {
                console.log('🔊 [OrderNotification] Starting test sound...');
                startNotificationSound();
              } else {
                console.log('🔇 [OrderNotification] Stopping test sound...');
                forceStopSound();
              }
            }}
            className="mt-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium shadow-lg transition-all duration-300"
            title="Test notification sound manually"
          >
            🧪 TEST SOUND
          </button>
        </div>
      )}



      {/* Notification Panel - Removed for simplicity */}
      {false && (
        <div className="fixed top-40 right-4 w-96 max-h-96 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="p-4 bg-red-600 text-white flex items-center justify-between">
            <h3 className="font-semibold flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Nuovi Ordini ({unreadCount})
            </h3>
            <div className="flex items-center space-x-2">
              {isPlaying && (
                <button
                  onClick={forceStopSound}
                  className="text-sm bg-red-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-900 transition-colors animate-pulse border-2 border-red-600"
                >
                  <div className="flex items-center space-x-1">
                    <VolumeX size={16} className="animate-bounce" />
                    <span>FERMA SUONO</span>
                  </div>
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                >
                  Segna tutti letti
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="mx-auto mb-2 opacity-50" size={32} />
                <p>Nessun nuovo ordine</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">
                        {notification.message}
                      </p>
                      {notification.order_details && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Cliente: {notification.order_details.customer_name}</p>
                          <p>Totale: €{notification.order_details.total_amount.toFixed(2)}</p>
                          <p>Articoli: {notification.order_details.items_count}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-2 p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="Segna come letto"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


    </>
  );
};

export default OrderNotificationSystem;
