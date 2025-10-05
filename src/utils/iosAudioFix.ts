/**
 * iOS Audio Fix for Notification Sounds
 * Handles iOS Safari's strict audio autoplay policies
 */

interface IOSAudioManager {
  isIOS: boolean;
  isInitialized: boolean;
  audioContext: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  userHasInteracted: boolean;
}

class IOSAudioFix {
  private manager: IOSAudioManager;
  private interactionEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];

  constructor() {
    this.manager = {
      isIOS: this.detectIOS(),
      isInitialized: false,
      audioContext: null,
      audioBuffer: null,
      userHasInteracted: false
    };

    console.log('🍎 [IOSAudioFix] iOS detected:', this.manager.isIOS);
    
    if (this.manager.isIOS) {
      this.setupUserInteractionListeners();
    }
  }

  private detectIOS(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    console.log('🍎 [IOSAudioFix] Device detection:', {
      userAgent,
      isIOS,
      isSafari,
      platform: navigator.platform
    });

    return isIOS || (isSafari && /mac/.test(userAgent));
  }

  private setupUserInteractionListeners(): void {
    console.log('🍎 [IOSAudioFix] Setting up user interaction listeners...');
    
    const handleUserInteraction = () => {
      console.log('🍎 [IOSAudioFix] User interaction detected!');
      this.manager.userHasInteracted = true;
      this.initializeAudioContext();
      
      // Remove listeners after first interaction
      this.interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction, true);
      });
    };

    this.interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, true);
    });
  }

  private async initializeAudioContext(): Promise<void> {
    if (this.manager.isInitialized) return;

    try {
      console.log('🍎 [IOSAudioFix] Initializing AudioContext...');
      
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.manager.audioContext = new AudioContextClass();

      // Resume context if suspended (iOS requirement)
      if (this.manager.audioContext.state === 'suspended') {
        await this.manager.audioContext.resume();
        console.log('🍎 [IOSAudioFix] AudioContext resumed');
      }

      // Create a simple beep sound buffer
      await this.createBeepBuffer();
      
      this.manager.isInitialized = true;
      console.log('🍎 [IOSAudioFix] ✅ AudioContext initialized successfully');
      
    } catch (error) {
      console.error('🍎 [IOSAudioFix] ❌ AudioContext initialization failed:', error);
    }
  }

  private async createBeepBuffer(): Promise<void> {
    if (!this.manager.audioContext) return;

    try {
      const sampleRate = this.manager.audioContext.sampleRate;
      const duration = 0.5; // 0.5 seconds
      const frameCount = sampleRate * duration;
      
      const audioBuffer = this.manager.audioContext.createBuffer(1, frameCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a simple beep tone (800Hz)
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * 0.3;
      }
      
      this.manager.audioBuffer = audioBuffer;
      console.log('🍎 [IOSAudioFix] Beep buffer created');
      
    } catch (error) {
      console.error('🍎 [IOSAudioFix] ❌ Failed to create beep buffer:', error);
    }
  }

  public async playNotificationSound(): Promise<boolean> {
    console.log('🍎 [IOSAudioFix] Attempting to play notification sound...');
    
    if (!this.manager.isIOS) {
      console.log('🍎 [IOSAudioFix] Not iOS, using standard audio');
      return false; // Let standard audio handle it
    }

    if (!this.manager.userHasInteracted) {
      console.log('🍎 [IOSAudioFix] ❌ No user interaction yet');
      return false;
    }

    if (!this.manager.isInitialized) {
      await this.initializeAudioContext();
    }

    if (!this.manager.audioContext || !this.manager.audioBuffer) {
      console.log('🍎 [IOSAudioFix] ❌ AudioContext or buffer not ready');
      return false;
    }

    try {
      // Create and play the sound
      const source = this.manager.audioContext.createBufferSource();
      source.buffer = this.manager.audioBuffer;
      source.connect(this.manager.audioContext.destination);
      source.start();
      
      console.log('🍎 [IOSAudioFix] ✅ Sound played successfully');
      return true;
      
    } catch (error) {
      console.error('🍎 [IOSAudioFix] ❌ Failed to play sound:', error);
      return false;
    }
  }

  public async playLoopingSound(): Promise<() => void> {
    console.log('🍎 [IOSAudioFix] Starting looping notification sound...');
    
    if (!this.manager.isIOS) {
      return () => {}; // Return empty stop function
    }

    let isPlaying = true;
    
    const playLoop = async () => {
      while (isPlaying) {
        await this.playNotificationSound();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second interval
      }
    };

    playLoop();

    // Return stop function
    return () => {
      console.log('🍎 [IOSAudioFix] Stopping looping sound');
      isPlaying = false;
    };
  }

  public getStatus(): IOSAudioManager {
    return { ...this.manager };
  }
}

// Create global instance
const iosAudioFix = new IOSAudioFix();

// Export for use in other components
export default iosAudioFix;

// Also expose globally for debugging
(window as any).iosAudioFix = iosAudioFix;
