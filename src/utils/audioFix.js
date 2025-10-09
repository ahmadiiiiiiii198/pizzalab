
// Audio unlock utility for web browsers
export function createAudioUnlocker() {
  let audioContext = null;
  let isUnlocked = false;
  
  const unlockAudio = () => {
    if (isUnlocked) return true;
    
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          isUnlocked = true;
          console.log('✅ Audio context unlocked');
        }).catch(() => {
          console.log('⚠️ Audio unlock failed');
        });
      } else {
        isUnlocked = true;
      }
      
      return isUnlocked;
    } catch (error) {
      console.log('⚠️ Audio context error:', error.message);
      return false;
    }
  };
  
  // Auto-unlock on user interactions
  const events = ['click', 'touchstart', 'keydown', 'mousedown'];
  const unlockOnInteraction = () => {
    if (unlockAudio()) {
      events.forEach(event => {
        document.removeEventListener(event, unlockOnInteraction);
      });
    }
  };
  
  events.forEach(event => {
    document.addEventListener(event, unlockOnInteraction, { passive: true });
  });
  
  return { unlockAudio, isUnlocked: () => isUnlocked };
}

// Auto-initialize
if (typeof window !== 'undefined') {
  createAudioUnlocker();
}
    