/**
 * Pleasant Notification Sound Generator
 * Creates a much better notification sound than harsh beeps
 */

export class PleasantNotificationSound {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private audioBuffer: AudioBuffer | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isLoadingAudio = false;
  private audioFileUrl = '/glovo_app.mp3'; // Default to glovo_app sound

  constructor() {
    this.initializeAudioContext();
    this.loadAudioFile();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('🎵 [PleasantNotification] Audio context initialized');
    } catch (error) {
      console.error('🎵 [PleasantNotification] Failed to initialize audio context:', error);
    }
  }

  /**
   * Load the glovo_app audio file
   */
  private async loadAudioFile() {
    if (this.isLoadingAudio) {
      return;
    }

    this.isLoadingAudio = true;
    console.log('🎵 [PleasantNotification] Loading glovo_app audio file...');

    try {
      // Try to load with Web Audio API first (for better control)
      if (this.audioContext) {
        const response = await fetch(this.audioFileUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          console.log('🎵 [PleasantNotification] ✅ Glovo_app audio loaded with Web Audio API');
          this.isLoadingAudio = false;
          return;
        }
      }

      // Fallback to HTML Audio Element
      this.audioElement = new Audio();
      this.audioElement.src = this.audioFileUrl;
      this.audioElement.loop = true;
      this.audioElement.volume = 0.8;

      await new Promise((resolve, reject) => {
        this.audioElement!.addEventListener('canplaythrough', resolve, { once: true });
        this.audioElement!.addEventListener('error', reject, { once: true });
        this.audioElement!.load();
      });

      console.log('🎵 [PleasantNotification] ✅ Glovo_app audio loaded with HTML Audio');
    } catch (error) {
      console.warn('🎵 [PleasantNotification] ⚠️ Failed to load glovo_app audio, will use fallback:', error);
      // Keep the existing generated sound as fallback
    }

    this.isLoadingAudio = false;
  }

  private continuousOscillators: OscillatorNode[] = [];
  private continuousGains: GainNode[] = [];
  private isRinging = false;

  /**
   * Starts truly continuous ringing sound - now using glovo_app audio file
   */
  public async startContinuousRinging(): Promise<boolean> {
    if (this.isRinging) {
      console.log('🔔 [PleasantNotification] Already ringing');
      return true;
    }

    console.log('🔔 [PleasantNotification] Starting glovo_app notification sound...');

    try {
      // Try to use the loaded audio file first
      if (this.audioBuffer && this.audioContext) {
        return await this.playAudioBufferLoop();
      }

      // Fallback to HTML Audio Element
      if (this.audioElement) {
        return await this.playAudioElementLoop();
      }

      // Final fallback to generated sound
      console.log('🔔 [PleasantNotification] No audio file available, using generated sound fallback');
      return await this.playGeneratedSoundFallback();

    } catch (error) {
      console.error('🔔 [PleasantNotification] ❌ Failed to start notification sound:', error);
      this.isRinging = false;
      return false;
    }
  }

  /**
   * Play audio using Web Audio API buffer (best quality and control)
   */
  private async playAudioBufferLoop(): Promise<boolean> {
    if (!this.audioContext || !this.audioBuffer) {
      return false;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isRinging = true;
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;
      source.loop = true;
      source.connect(this.audioContext.destination);
      source.start();

      // Store reference for stopping
      this.continuousOscillators = [source as any];

      console.log('🔔 [PleasantNotification] ✅ Glovo_app audio started (Web Audio API)');
      return true;
    } catch (error) {
      console.error('🔔 [PleasantNotification] ❌ Web Audio API playback failed:', error);
      return false;
    }
  }

  /**
   * Play audio using HTML Audio Element (fallback)
   */
  private async playAudioElementLoop(): Promise<boolean> {
    if (!this.audioElement) {
      return false;
    }

    try {
      this.isRinging = true;
      this.audioElement.currentTime = 0;
      this.audioElement.loop = true;
      await this.audioElement.play();

      console.log('🔔 [PleasantNotification] ✅ Glovo_app audio started (HTML Audio)');
      return true;
    } catch (error) {
      console.error('🔔 [PleasantNotification] ❌ HTML Audio playback failed:', error);
      return false;
    }
  }

  /**
   * Fallback to generated sound if audio file is not available
   */
  private async playGeneratedSoundFallback(): Promise<boolean> {
    if (!this.audioContext || !this.isInitialized) {
      console.warn('🔔 [PleasantNotification] Audio context not available');
      return false;
    }

    try {
      // Resume audio context if suspended (required for mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isRinging = true;
      const now = this.audioContext.currentTime;

      // Create master gain node
      const masterGain = this.audioContext.createGain();
      masterGain.connect(this.audioContext.destination);

      // Create classic phone ring frequencies (dual tone) - more pleasant frequencies
      const freq1 = 523; // C5 - bright, clear primary tone
      const freq2 = 659; // E5 - perfect fifth harmony for pleasant ring

      // Create oscillators for the dual-tone ring
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      const gain2 = this.audioContext.createGain();

      // Store references for cleanup
      this.continuousOscillators = [osc1, osc2];
      this.continuousGains = [gain1, gain2, masterGain];

      // Set frequencies and waveforms - use triangle wave for warmer sound
      osc1.type = 'triangle';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq1, now);
      osc2.frequency.setValueAtTime(freq2, now);

      // Connect oscillators
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(masterGain);
      gain2.connect(masterGain);

      // Create classic phone ring pattern with on/off cycles
      const ringOnTime = 1.0;   // Ring for 1 second
      const ringOffTime = 0.4;  // Pause for 0.4 seconds
      const cycleDuration = ringOnTime + ringOffTime;

      // Create LFO for ring pattern (on/off cycles)
      const ringLfo = this.audioContext.createOscillator();
      const ringLfoGain = this.audioContext.createGain();

      ringLfo.type = 'square'; // Square wave for on/off pattern
      ringLfo.frequency.setValueAtTime(1 / cycleDuration, now); // Complete cycle every 1.4 seconds

      // Configure the ring pattern LFO
      ringLfoGain.gain.setValueAtTime(0.3, now); // Ring volume
      ringLfo.connect(ringLfoGain);

      // Create tremolo within each ring burst for classic phone sound
      const tremoloLfo = this.audioContext.createOscillator();
      const tremoloGain = this.audioContext.createGain();

      tremoloLfo.type = 'sine';
      tremoloLfo.frequency.setValueAtTime(8, now); // 8 Hz tremolo for classic ring warble
      tremoloGain.gain.setValueAtTime(0.1, now); // Subtle tremolo depth

      tremoloLfo.connect(tremoloGain);

      // Connect the modulation chain: ring pattern -> tremolo -> oscillator gains
      ringLfoGain.connect(gain1.gain);
      ringLfoGain.connect(gain2.gain);
      tremoloGain.connect(gain1.gain);
      tremoloGain.connect(gain2.gain);

      // Set base gain levels
      gain1.gain.setValueAtTime(0.35, now); // Primary tone (louder)
      gain2.gain.setValueAtTime(0.25, now); // Harmony tone

      // Start all oscillators - they will run indefinitely until stopped
      osc1.start(now);
      osc2.start(now);
      ringLfo.start(now);
      tremoloLfo.start(now);

      // Store all LFOs for cleanup
      this.continuousOscillators.push(ringLfo, tremoloLfo);

      console.log('🔔 [PleasantNotification] ✅ Continuous ringing started - will ring until stopped');
      return true;

    } catch (error) {
      console.error('🔔 [PleasantNotification] ❌ Failed to start continuous ringing:', error);
      this.isRinging = false;
      return false;
    }
  }

  /**
   * Stops the continuous ringing sound
   */
  public stopContinuousRinging(): void {
    if (!this.isRinging) {
      return;
    }

    console.log('🔔 [PleasantNotification] Stopping glovo_app notification sound...');

    try {
      // Stop HTML Audio Element if it's playing
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        console.log('🔔 [PleasantNotification] ✅ HTML Audio stopped');
      }

      // Stop Web Audio API sources
      this.continuousOscillators.forEach(source => {
        try {
          if ('stop' in source) {
            source.stop();
          }
        } catch (e) {
          // Source might already be stopped
        }
      });

      // Disconnect all gains
      this.continuousGains.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {
          // Gain might already be disconnected
        }
      });

      // Clear arrays
      this.continuousOscillators = [];
      this.continuousGains = [];
      this.isRinging = false;

      console.log('🔔 [PleasantNotification] ✅ Notification sound stopped');
    } catch (error) {
      console.error('🔔 [PleasantNotification] ❌ Error stopping notification sound:', error);
      this.isRinging = false;
    }
  }

  /**
   * Check if currently ringing
   */
  public isCurrentlyRinging(): boolean {
    return this.isRinging;
  }

  /**
   * Creates a gentle notification bell sound
   */
  public async playGentleBell(): Promise<boolean> {
    if (!this.audioContext || !this.isInitialized) {
      console.warn('🎵 [PleasantNotification] Audio context not available');
      return false;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const duration = 2.0;
      const now = this.audioContext.currentTime;

      // Create bell-like sound with metallic harmonics
      const fundamentalFreq = 440; // A4
      const harmonics = [1, 2.4, 3.2, 4.8]; // Bell-like harmonic ratios
      
      const masterGain = this.audioContext.createGain();
      masterGain.connect(this.audioContext.destination);

      harmonics.forEach((ratio, index) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamentalFreq * ratio, now);

        osc.connect(gain);
        gain.connect(masterGain);

        // Volume decreases for higher harmonics
        const volume = 0.2 / (index + 1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
      });

      console.log('🎵 [PleasantNotification] ✅ Gentle bell played successfully');
      return true;

    } catch (error) {
      console.error('🎵 [PleasantNotification] ❌ Failed to play gentle bell:', error);
      return false;
    }
  }

  /**
   * Creates a modern, soft notification sound
   */
  public async playModernNotification(): Promise<boolean> {
    if (!this.audioContext || !this.isInitialized) {
      console.warn('🎵 [PleasantNotification] Audio context not available');
      return false;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const duration = 1.0;
      const now = this.audioContext.currentTime;

      // Create modern notification sound - two quick tones
      const frequencies = [800, 600]; // High to low
      const toneDuration = 0.15;
      const gap = 0.05;

      const masterGain = this.audioContext.createGain();
      masterGain.connect(this.audioContext.destination);

      frequencies.forEach((freq, index) => {
        const startTime = now + (index * (toneDuration + gap));
        
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        osc.connect(gain);
        gain.connect(masterGain);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + toneDuration);

        osc.start(startTime);
        osc.stop(startTime + toneDuration);
      });

      console.log('🎵 [PleasantNotification] ✅ Modern notification played successfully');
      return true;

    } catch (error) {
      console.error('🎵 [PleasantNotification] ❌ Failed to play modern notification:', error);
      return false;
    }
  }

  /**
   * Get the audio context state for debugging
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      audioContextState: this.audioContext?.state,
      audioContextAvailable: !!this.audioContext
    };
  }
}

// Create singleton instance
export const pleasantNotificationSound = new PleasantNotificationSound();
