
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('
').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function processReservationUpdates() {
  console.log('🔄 Processing reservation update requests...');
  
  try {
    // Look for pending update requests
    const { data: requests } = await supabase
      .from('settings')
      .select('*')
      .like('key', 'reservation_update_request_%');
    
    if (requests && requests.length > 0) {
      for (const request of requests) {
        const updateData = request.value;
        
        if (!updateData.processed) {
          console.log('Processing update for reservation:', updateData.reservation_id);
          
          // Try to process the update
          try {
            // Update via direct query
            const { error } = await supabase
              .from('reservations')
              .update({
                status: updateData.status,
                confirmed_by: updateData.confirmed_by,
                confirmed_at: updateData.confirmed_at,
                notes: updateData.notes
              })
              .eq('id', updateData.reservation_id);
            
            if (!error) {
              // Mark as processed
              await supabase
                .from('settings')
                .update({
                  value: { ...updateData, processed: true }
                })
                .eq('key', request.key);
              
              console.log('✅ Processed update for:', updateData.reservation_id);
            }
          } catch (processError) {
            console.log('⚠️ Failed to process:', processError.message);
          }
        }
      }
    }
    
    // Cache current reservations for backup access
    const { data: allReservations } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: true });
    
    if (allReservations) {
      await supabase.from('settings').upsert({
        key: 'cached_reservations',
        value: allReservations
      });
    }
    
  } catch (error) {
    console.log('⚠️ Monitoring error:', error.message);
  }
}

// Run monitoring every 30 seconds
setInterval(processReservationUpdates, 30000);
processReservationUpdates();
    