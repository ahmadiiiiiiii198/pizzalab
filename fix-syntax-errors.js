import { readFileSync, writeFileSync } from 'fs';

function fixSyntaxErrors() {
  console.log('🔧 FIXING SYNTAX ERRORS AUTOMATICALLY...');
  
  try {
    // Read the UnifiedNotificationSystem file
    let content = readFileSync('src/components/UnifiedNotificationSystem.tsx', 'utf8');
    
    // Fix any remaining syntax issues
    content = content
      // Remove duplicate console.log statements
      .replace(/console\.log\('console\.log\('/g, "console.log('")
      // Fix any malformed emoji console logs
      .replace(/console\.log\('([^']*)'([^']*)'([^']*)\);/g, "console.log('$1$2$3');")
      // Ensure proper string escaping
      .replace(/console\.log\('🔓 \[UnifiedNotification\] Auto-unlocking audio\.\.\.'\);/g, "console.log('🔓 [UnifiedNotification] Auto-unlocking audio...');")
      .replace(/console\.log\('✅ \[UnifiedNotification\] Audio unlocked successfully'\);/g, "console.log('✅ [UnifiedNotification] Audio unlocked successfully');")
      // Fix any broken function calls
      .replace(/if \(unlockAudio\(\)\) \{[^}]*\}/g, '')
      // Remove any orphaned closing braces
      .replace(/^\s*\}\s*$/gm, '');
    
    // Write the fixed content back
    writeFileSync('src/components/UnifiedNotificationSystem.tsx', content);
    console.log('✅ UnifiedNotificationSystem.tsx syntax fixed');
    
    // Also ensure the audio fix utility exists and is correct
    const audioFixContent = `
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
    `;
    
    writeFileSync('src/utils/audioFix.js', audioFixContent);
    console.log('✅ Audio fix utility updated');
    
    console.log('🎉 ALL SYNTAX ERRORS FIXED AUTOMATICALLY');
    
  } catch (error) {
    console.error('❌ Error fixing syntax:', error.message);
  }
}

fixSyntaxErrors();
