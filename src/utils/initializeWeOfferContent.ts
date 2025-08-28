import { settingsService } from '@/services/settingsService';

export const initializeWeOfferContent = async () => {
  try {
    console.log('🍕 [WeOffer] Initializing We Offer content in database...');
    
    // Initialize the settings service
    await settingsService.initialize();
    
    // Check if weOfferContent already exists
    const existingContent = await settingsService.getSetting('weOfferContent', null);

    // Check if existing content has the correct structure
    if (existingContent && existingContent.offers && Array.isArray(existingContent.offers)) {
      console.log('✅ [WeOffer] We Offer content already exists with correct structure');
      return existingContent;
    }

    if (existingContent && (!existingContent.offers || !Array.isArray(existingContent.offers))) {
      console.log('⚠️ [WeOffer] Existing content has old structure, updating to new structure...');
      // Continue to create new content with correct structure
    }
    
    // Create the default We Offer content
    const defaultWeOfferContent = {
      heading: "Offriamo",
      subheading: "Scopri le nostre autentiche specialità italiane",
      offers: [
        {
          id: 1,
          title: "Pizza Metro Finchi 5 Gusti",
          description: "Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un'unica creazione straordinaria. Perfetta da condividere con famiglia e amici.",
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Specialità"
        },
        {
          id: 2,
          title: "Usiamo la Farina 5 Stagioni, Alta Qualità",
          description: "Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto leggero, digeribile e incredibilmente saporito.",
          image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Qualità"
        },
        {
          id: 3,
          title: "Creiamo Tutti i Tipi di Pizza Italiana di Alta Qualità",
          description: "Dalla classica Margherita alle specialità gourmet, prepariamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un'autentica esperienza italiana.",
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Autentica"
        }
      ]
    };
    
    // Save to database ONLY if it doesn't exist (don't overwrite existing content)
    const { supabase } = await import('@/integrations/supabase/client');

    // Check if weOfferContent already exists in database with correct structure
    const { data: existingSetting } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'weOfferContent')
      .single();

    if (existingSetting && existingSetting.value &&
        existingSetting.value.offers && Array.isArray(existingSetting.value.offers)) {
      console.log('✅ [WeOffer] We Offer content already exists with correct structure, not overwriting');
      return existingSetting.value;
    }

    if (existingSetting && existingSetting.value &&
        (!existingSetting.value.offers || !Array.isArray(existingSetting.value.offers))) {
      console.log('⚠️ [WeOffer] Existing content has old structure, updating...');
      // Delete old content and insert new
      await supabase
        .from('settings')
        .delete()
        .eq('key', 'weOfferContent');
    }

    // Only insert if it doesn't exist
    const { error } = await supabase
      .from('settings')
      .insert({
        key: 'weOfferContent',
        value: defaultWeOfferContent,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ [WeOffer] Error inserting We Offer content:', error);
      throw error;
    }

    console.log('✅ [WeOffer] We Offer content successfully initialized in database');
    return defaultWeOfferContent;
    
  } catch (error) {
    console.error('❌ [WeOffer] Failed to initialize We Offer content:', error);
    throw error;
  }
};
