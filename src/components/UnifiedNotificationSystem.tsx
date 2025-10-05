import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, VolumeX, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { pleasantNotificationSound } from '@/utils/pleasantNotificationSound';

interface OrderNotification {
  id: string;
  order_id: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  title?: string;
}

const UnifiedNotificationSystem = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Simple audio initialization
  useEffect(() => {
    console.log('🔊 [UnifiedNotification] Initializing...');
    console.log('🔊 [UnifiedNotification] Component mounted on:', window.location.href);
    console.log('🔊 [UnifiedNotification] Timestamp:', new Date().toISOString());

    // Create audio element with a working beep sound
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.8;

    // Use a simple, reliable beep sound (shorter base64)
    const beepDataUrl = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAC/hYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';

    // Fallback: if data URL fails, create a simple oscillator-based beep
    audio.onerror = () => {
      console.log('🔊 [UnifiedNotification] Data URL failed, using Web Audio API fallback');
      // We'll handle this in the startSound function
    };

    audio.src = beepDataUrl;

    audioRef.current = audio;
    setIsInitialized(true);

    // Auto-unlock audio on any user interaction
    const autoUnlockAudio = async () => {
      if (!isAudioUnlocked && audioRef.current) {
        console.log('🔓 [UnifiedNotification] Auto-unlocking audio on user interaction...');
        try {
          audioRef.current.volume = 0;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.8;
          }
          setIsAudioUnlocked(true);
          console.log('✅ [UnifiedNotification] Audio auto-unlocked');

          // Remove listeners after successful unlock
          document.removeEventListener('click', autoUnlockAudio);
          document.removeEventListener('keydown', autoUnlockAudio);
          document.removeEventListener('touchstart', autoUnlockAudio);
        } catch (error) {
          console.log('🔒 [UnifiedNotification] Auto-unlock failed, will retry on next interaction');
        }
      }
    };

    // Add listeners for any user interaction
    document.addEventListener('click', autoUnlockAudio);
    document.addEventListener('keydown', autoUnlockAudio);
    document.addEventListener('touchstart', autoUnlockAudio);

    // Listen for force notification check events
    const handleForceCheck = () => {
      console.log('🚨 [UnifiedNotification] Force notification check triggered');
      fetchNotifications();
    };
    window.addEventListener('forceNotificationCheck', handleForceCheck);

    // Initial check
    fetchNotifications();

    // Setup real-time subscription
    setupRealtimeSubscription();
    
    // Cleanup
    return () => {
      // Clean up continuous ringing
      if ((window as any).unifiedPleasantSoundActive) {
        pleasantNotificationSound.stopContinuousRinging();
        (window as any).unifiedPleasantSoundActive = false;
      }

      // Clean up old pleasant sound loop (for backward compatibility)
      if ((window as any).unifiedPleasantSoundLoop) {
        clearInterval((window as any).unifiedPleasantSoundLoop);
        (window as any).unifiedPleasantSoundLoop = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      // Clean up event listeners
      document.removeEventListener('click', autoUnlockAudio);
      document.removeEventListener('keydown', autoUnlockAudio);
      document.removeEventListener('touchstart', autoUnlockAudio);
      window.removeEventListener('forceNotificationCheck', handleForceCheck);
    };
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('📡 [UnifiedNotification] Fetching notifications...');
      console.log('📡 [UnifiedNotification] Current state:', {
        isSoundEnabled,
        isPlaying,
        isInitialized,
        currentURL: window.location.href,
        timestamp: new Date().toISOString()
      });

      console.log('📡 [UnifiedNotification] Executing database query...');
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('📡 [UnifiedNotification] Database query completed:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message
      });

      if (error) {
        console.error('❌ [UnifiedNotification] Database fetch error:', error);
        console.error('❌ [UnifiedNotification] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Check if it's an RLS policy issue
        if (error.message.includes('row-level security policy')) {
          console.log('🔧 [UnifiedNotification] RLS POLICY ISSUE DETECTED!');
          console.log('📋 [UnifiedNotification] Notifications table has RLS policies blocking access');
          setError('RLS policies need fixing - notifications blocked');
        } else {
          setError(`Database error: ${error.message}`);
        }
        return;
      }

      const newNotifications = data || [];
      setNotifications(newNotifications);

      console.log(`📊 [UnifiedNotification] Found ${newNotifications.length} notifications`);
      console.log('📊 [UnifiedNotification] Notifications:', newNotifications.map(n => ({
        id: n.id,
        message: n.message,
        created_at: n.created_at
      })));

      // Start sound if there are unread notifications
      if (newNotifications.length > 0 && isSoundEnabled && !isPlaying) {
        console.log('🔊 [UnifiedNotification] TRIGGERING SOUND - Conditions met:');
        console.log('  - Notifications found:', newNotifications.length);
        console.log('  - Sound enabled:', isSoundEnabled);
        console.log('  - Not already playing:', !isPlaying);
        startSound();
      } else {
        console.log('🔇 [UnifiedNotification] NOT TRIGGERING SOUND - Conditions:');
        console.log('  - Notifications found:', newNotifications.length);
        console.log('  - Sound enabled:', isSoundEnabled);
        console.log('  - Not already playing:', !isPlaying);

        if (newNotifications.length === 0) {
          console.log('📊 [UnifiedNotification] No unread notifications found');
        } else if (!isSoundEnabled) {
          console.log('🔇 [UnifiedNotification] Sound disabled, not playing');
        } else if (isPlaying) {
          console.log('🔊 [UnifiedNotification] Sound already playing');
        }
      }

    } catch (error) {
      console.error('❌ [UnifiedNotification] Unexpected fetch error:', error);
      setError(`Fetch error: ${error.message}`);
    }
  }, [isSoundEnabled, isPlaying, isInitialized]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    console.log('📡 [UnifiedNotification] Setting up real-time subscription...');

    try {
      const subscription = supabase
        .channel('unified_notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_notifications' },
          (payload) => {
            console.log('📡 [UnifiedNotification] 🚨 NEW NOTIFICATION VIA REAL-TIME! 🚨');
            console.log('📡 [UnifiedNotification] Payload:', payload);
            console.log('📡 [UnifiedNotification] Real-time payload details:', {
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
              schema: payload.schema,
              table: payload.table,
              timestamp: new Date().toISOString()
            });
            console.log('📡 [UnifiedNotification] Triggering fetchNotifications...');
            fetchNotifications();
          }
        )
        .subscribe((status) => {
          console.log('📡 [UnifiedNotification] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ [UnifiedNotification] Real-time subscription active');
            setError(null); // Clear any previous errors
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [UnifiedNotification] Real-time subscription error');
            setError('Real-time subscription failed - notifications may not work');
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ [UnifiedNotification] Real-time subscription timed out');
            setError('Real-time subscription timed out - using polling only');
          } else if (status === 'CLOSED') {
            console.warn('⚠️ [UnifiedNotification] Real-time subscription closed');
            setError('Real-time subscription closed - using polling only');

            // Try to reconnect after 5 seconds
            setTimeout(() => {
              console.log('🔄 [UnifiedNotification] Attempting to reconnect real-time...');
              setupRealtimeSubscription();
            }, 5000);
          }
        });

      subscriptionRef.current = subscription;

      // Backup polling every 30 seconds
      intervalRef.current = setInterval(() => {
        console.log('📡 [UnifiedNotification] Polling backup...');
        fetchNotifications();

        // Also check for recent orders without notifications
        checkOrdersWithoutNotifications();
      }, 30000);

    } catch (error) {
      console.error('❌ [UnifiedNotification] Subscription setup error:', error);
      setError(`Subscription error: ${error.message}`);
    }

  }, [fetchNotifications]);

  // Check for orders without notifications
  const checkOrdersWithoutNotifications = useCallback(async () => {
    try {
      console.log('🔍 [UnifiedNotification] Checking for orders without notifications...');

      // Get recent orders (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('❌ [UnifiedNotification] Error checking orders:', ordersError);
        return;
      }

      if (recentOrders && recentOrders.length > 0) {
        console.log(`📊 [UnifiedNotification] Found ${recentOrders.length} recent orders`);

        // Check which orders have notifications
        for (const order of recentOrders) {
          const { data: orderNotifications, error: notifError } = await supabase
            .from('order_notifications')
            .select('id')
            .eq('order_id', order.id);

          if (notifError) {
            console.error(`❌ [UnifiedNotification] Error checking notifications for order ${order.order_number}:`, notifError);
          } else if (!orderNotifications || orderNotifications.length === 0) {
            console.warn(`⚠️ [UnifiedNotification] Order ${order.order_number} has NO NOTIFICATION!`);
            console.warn(`   Customer: ${order.customer_name}, Created: ${order.created_at}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ [UnifiedNotification] Error in checkOrdersWithoutNotifications:', error);
    }
  }, []);

  // Unlock audio with user interaction
  const unlockAudio = useCallback(async () => {
    console.log('🔓 [UnifiedNotification] Unlocking audio with user interaction...');

    if (!audioRef.current) {
      console.error('❌ [UnifiedNotification] No audio reference for unlock');
      return false;
    }

    try {
      // Try to play and immediately pause to unlock audio
      audioRef.current.volume = 0; // Silent unlock
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        await playPromise;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.8; // Restore volume
      }

      setIsAudioUnlocked(true);
      console.log('✅ [UnifiedNotification] Audio unlocked successfully');
      return true;
    } catch (error) {
      console.error('❌ [UnifiedNotification] Audio unlock failed:', error);
      return false;
    }
  }, []);

  // Start notification sound - now using ONLY pleasant sounds!
  const startSound = useCallback(async () => {
    console.log('🎵 [UnifiedNotification] startSound called - using ONLY pleasant ringing sound');

    if (!isSoundEnabled) {
      console.log('🔇 [UnifiedNotification] Sound disabled, not playing');
      return;
    }

    if (isPlaying) {
      console.log('🎵 [UnifiedNotification] Sound already playing');
      return;
    }

    try {
      console.log('🎵 [UnifiedNotification] Starting pleasant notification sound...');
      setIsPlaying(true);

      // Start truly continuous ringing sound - no gaps, no interruptions
      const ringingSuccess = await pleasantNotificationSound.startContinuousRinging();

      if (ringingSuccess) {
        console.log('🔔 [UnifiedNotification] ✅ Continuous ringing started successfully - will ring until stopped');
        setError(null); // Clear any previous errors

        // No need for intervals - the ringing is truly continuous until manually stopped
        (window as any).unifiedPleasantSoundActive = true;
        return; // SUCCESS - exit here, don't run any fallback systems
      } else {
        console.log('🔔 [UnifiedNotification] ❌ Pleasant ringing sound failed completely');
        setError('Notification sound not available');
        setIsPlaying(false);
        return; // FAIL - exit here, don't run fallback systems
      }

    } catch (error) {
      console.error('❌ [UnifiedNotification] Pleasant sound error:', error);
      setError('Notification sound error');
      setIsPlaying(false);
      return; // ERROR - exit here, don't run fallback systems
    }


  }, [isSoundEnabled, isPlaying]);

  // Stop notification sound and mark notifications as read
  const stopSound = useCallback(async () => {
    console.log('🔇 [UnifiedNotification] Stopping sound and marking notifications as read...');

    // Stop continuous ringing first
    if ((window as any).unifiedPleasantSoundActive) {
      console.log('🔇 [UnifiedNotification] 🔔 STOPPING CONTINUOUS RINGING');
      pleasantNotificationSound.stopContinuousRinging();
      (window as any).unifiedPleasantSoundActive = false;
      console.log('🔇 [UnifiedNotification] ✅ Continuous ringing stopped');
    }

    // Also clear any old interval-based loops (for backward compatibility)
    if ((window as any).unifiedPleasantSoundLoop) {
      console.log('🔇 [UnifiedNotification] 🎵 STOPPING OLD SOUND LOOP');
      clearInterval((window as any).unifiedPleasantSoundLoop);
      (window as any).unifiedPleasantSoundLoop = null;
      console.log('🔇 [UnifiedNotification] ✅ Old sound loop stopped');
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);

    // Also mark all notifications as read to prevent sound from restarting
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications([]);
      console.log('✅ [UnifiedNotification] Sound stopped and all notifications marked as read');
    } catch (error) {
      console.error('❌ [UnifiedNotification] Error marking notifications as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications([]);
      console.log('✅ [UnifiedNotification] All notifications marked as read');
    } catch (error) {
      console.error('❌ [UnifiedNotification] Mark as read error:', error);
    }
  }, []);

  // Toggle sound
  const toggleSound = useCallback(async () => {
    if (isPlaying) {
      await stopSound();
    } else if (notifications.length > 0) {
      startSound();
    }
  }, [isPlaying, notifications.length, startSound, stopSound]);

  const unreadCount = notifications.length;

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
      {/* Error display */}
      {error && (
        <div className="fixed top-16 right-4 z-50 max-w-sm">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium">⚠️ {error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-yellow-600 hover:text-yellow-800"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System status indicator */}
      <div className="fixed top-4 left-4 z-50">
        <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-bold ${
          error
            ? 'bg-red-100 text-red-800 border border-red-300'
            : isInitialized
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        }`}>
          {error
            ? '❌ NOTIFICATION ERROR'
            : isInitialized
            ? '✅ NOTIFICATION SYSTEM ACTIVE'
            : '⏳ INITIALIZING...'
          }
        </div>
      </div>

      {/* Floating notification button */}
      {(unreadCount > 0 || isPlaying) && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={toggleSound}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
              isPlaying
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
            title={isPlaying ? 'Stop notification sound' : 'Play notification sound'}
          >
            <div className="flex items-center space-x-2">
              {isPlaying ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              {unreadCount > 0 && (
                <span className="bg-white text-red-600 rounded-full px-2 py-1 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Control buttons */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {/* Main control button */}
        <button
          onClick={toggleSound}
          className={`px-4 py-2 rounded-lg shadow-lg font-bold text-sm transition-all duration-300 ${
            isPlaying
              ? 'bg-red-600 text-white animate-pulse'
              : unreadCount > 0
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {isPlaying ? '🔇 STOP & MARK READ' : unreadCount > 0 ? `🔊 PLAY (${unreadCount})` : '🔇 NO ALERTS'}
        </button>

        {/* Mark as read button */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg font-bold text-sm hover:bg-green-700 transition-all duration-300"
          >
            ✅ MARK READ
          </button>
        )}


      </div>
    </>
  );
};

export default UnifiedNotificationSystem;
