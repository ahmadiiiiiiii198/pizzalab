import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ixqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NzE0NzE5LCJleHAiOjIwNTAyOTA3MTl9.Ej5rJZvZHZvZHZvZHZvZHZvZHZvZHZvZHZvZHZvZHZs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running SatisPay QR settings migration...');

    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS satispay_qr_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          qr_code_image_url TEXT,
          is_enabled BOOLEAN DEFAULT true,
          title TEXT DEFAULT 'Paga con SatisPay',
          description TEXT DEFAULT 'Scansiona il QR code per pagare con SatisPay',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('❌ Error creating table:', createError);
      return;
    }

    console.log('✅ Table created successfully');

    // Insert default settings
    const { error: insertError } = await supabase
      .from('satispay_qr_settings')
      .insert({
        title: 'Paga con SatisPay',
        description: 'Scansiona il QR code per pagare con SatisPay',
        is_enabled: true
      });

    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('❌ Error inserting default settings:', insertError);
      return;
    }

    console.log('✅ Default settings inserted successfully');
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
