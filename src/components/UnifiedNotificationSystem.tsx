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

  // Initialize audio system
  useEffect(() => {
    console.log('🔊 [UnifiedNotification] Initializing...');
    
    const audio = new Audio();
    audio.src = pleasantNotificationSound;
    audio.preload = 'auto';
    audioRef.current = audio;
    setIsInitialized(true);

    // Auto-unlock audio on user interaction
    const unlockAudio = async () => {
      if (!isAudioUnlocked && audioRef.current) {
        console.log('🔓 [UnifiedNotification] Auto-unlocking audio...');
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
          console.log('✅ [UnifiedNotification] Audio unlocked');
        } catch (error) {
          console.log('🔒 [UnifiedNotification] Auto-unlock failed');
        }
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [isAudioUnlocked]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    console.log('📡 [UnifiedNotification] Fetching notifications...');
    
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [UnifiedNotification] Error:', error);
        setError(error.message);
        return;
      }

      console.log('📊 [UnifiedNotification] Found notifications:', data?.length || 0);
      
      const newNotifications = data || [];
      const hasNewNotifications = newNotifications.length > notifications.length;
      
      setNotifications(newNotifications);
      
      // Play sound for new notifications
      if (hasNewNotifications && isSoundEnabled && isAudioUnlocked && audioRef.current && !isPlaying) {
        console.log('🔊 [UnifiedNotification] Playing notification sound');
        setIsPlaying(true);
        
        try {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setTimeout(() => setIsPlaying(false), 2000);
        } catch (playError) {
          console.log('🔇 [UnifiedNotification] Sound play failed:', playError);
          setIsPlaying(false);
        }
      }
      
    } catch (fetchError) {
      console.error('💥 [UnifiedNotification] Fetch error:', fetchError);
      setError('Failed to fetch notifications');
    }
  }, [notifications.length, isSoundEnabled, isAudioUnlocked, isPlaying]);

  // Start polling for notifications
  useEffect(() => {
    if (isInitialized) {
      fetchNotifications();
      
      intervalRef.current = setInterval(fetchNotifications, 10000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isInitialized, fetchNotifications]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
    console.log('🔊 [UnifiedNotification] Sound toggled:', !isSoundEnabled);
  }, [isSoundEnabled]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        console.log('✅ [UnifiedNotification] Marked as read:', notificationId);
      }
    } catch (error) {
      console.error('❌ [UnifiedNotification] Mark read error:', error);
    }
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2">
        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
          title={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {isSoundEnabled ? (
            <Volume2 className="w-5 h-5 text-green-600" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="relative">
            <div className="p-2 rounded-full bg-orange-500 shadow-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notifications.length}
            </span>
          </div>
        )}
      </div>

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="mt-2 space-y-2 max-w-sm">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-lg shadow-lg p-3 border-l-4 border-orange-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {notification.title || 'New Order'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default UnifiedNotificationSystem;
