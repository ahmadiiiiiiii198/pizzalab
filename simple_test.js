console.log('🚀 Starting simple test...');

// Test basic functionality
async function testBasic() {
  try {
    console.log('✅ Basic test working');
    
    // Test environment variables
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment variables:');
    console.log('  URL:', url ? 'Found' : 'Missing');
    console.log('  Key:', key ? 'Found' : 'Missing');
    
    if (!url || !key) {
      console.log('❌ Missing environment variables');
      return;
    }
    
    // Try to import Supabase
    console.log('📦 Importing Supabase...');
    const { createClient } = await import('@supabase/supabase-js');
    console.log('✅ Supabase imported successfully');
    
    // Create client
    console.log('🔧 Creating Supabase client...');
    const supabase = createClient(url, key);
    console.log('✅ Supabase client created');
    
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Sample data:', data);
    
    // Test feature toggle read
    console.log('🔍 Testing feature toggle read...');
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, impasto_enabled, aggiunti_enabled, base_del_pizze_enabled')
      .eq('slug', 'consigliate-piccanti')
      .single();
    
    if (categoryError) {
      console.log('❌ Feature toggle read failed:', categoryError.message);
      return;
    }
    
    console.log('✅ Feature toggle read successful');
    console.log('📊 Category data:', categoryData);
    
    // Test feature toggle write
    console.log('🔧 Testing feature toggle write...');
    const newValue = !categoryData.impasto_enabled;
    
    const { error: updateError } = await supabase
      .from('categories')
      .update({ 
        impasto_enabled: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryData.id);
    
    if (updateError) {
      console.log('❌ Feature toggle write failed:', updateError.message);
      console.log('   Error details:', updateError);
      
      // Check if it's a permissions issue
      if (updateError.message.includes('permission') || updateError.message.includes('policy')) {
        console.log('💡 This looks like a Row Level Security (RLS) policy issue');
        console.log('   The categories table might have RLS enabled but no policies for updates');
      }
      
      return;
    }
    
    console.log('✅ Feature toggle write successful');
    console.log(`   Changed impasto_enabled from ${categoryData.impasto_enabled} to ${newValue}`);
    
    // Verify the change
    console.log('🔍 Verifying the change...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('categories')
      .select('impasto_enabled')
      .eq('id', categoryData.id)
      .single();
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      return;
    }
    
    console.log('✅ Verification successful');
    console.log(`   Current value: ${verifyData.impasto_enabled}`);
    console.log(`   Expected value: ${newValue}`);
    console.log(`   Match: ${verifyData.impasto_enabled === newValue ? '✅' : '❌'}`);
    
    console.log('\n🎉 All tests passed! Feature toggles should be working.');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('   Stack:', error.stack);
  }
}

testBasic();
