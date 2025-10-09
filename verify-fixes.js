
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jncuwwavffepnajxvjxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo'
);

async function verifyFixes() {
  console.log('🔍 Verifying automated fixes...');
  
  // Test RLS fix
  try {
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id')
      .limit(1)
      .single();
    
    if (reservation) {
      const { error } = await supabase
        .from('reservations')
        .update({ notes: 'Auto-fix test ' + Date.now() })
        .eq('id', reservation.id);
      
      if (!error) {
        console.log('✅ RLS fix verified - reservations working');
        return true;
      } else if (error.message.includes('row-level security')) {
        console.log('❌ RLS still needs fixing');
        return false;
      }
    }
  } catch (e) {
    console.log('⚠️ Verification test failed:', e.message);
  }
  
  return false;
}

// Auto-run verification
verifyFixes().then(success => {
  if (success) {
    console.log('🎉 All fixes verified successfully');
  } else {
    console.log('🔄 Fixes still in progress...');
  }
});
  