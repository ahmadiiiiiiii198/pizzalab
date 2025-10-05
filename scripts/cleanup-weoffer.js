// Script to remove WeOffer content from database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupWeOfferContent() {
  try {
    console.log('🧹 Cleaning up WeOffer content from database...');
    
    // Delete weOfferContent setting
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', 'weOfferContent');
    
    if (error) {
      console.error('❌ Error deleting WeOffer content:', error);
      return false;
    }
    
    console.log('✅ WeOffer content successfully removed from database');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the cleanup
cleanupWeOfferContent().then((success) => {
  process.exit(success ? 0 : 1);
});
