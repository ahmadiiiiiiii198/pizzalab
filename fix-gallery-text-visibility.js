import { readFileSync, writeFileSync } from 'fs';

function fixGalleryTextVisibility() {
  console.log('🎨 FIXING GALLERY TEXT VISIBILITY WITH WHEAT THEME...');
  
  try {
    let content = readFileSync('src/components/Gallery.tsx', 'utf8');
    
    // Update the main heading colors to wheat theme with better contrast
    content = content.replace(
      /text-4xl md:text-5xl text-center font-fredoka font-bold mb-4 text-pizza-dark/g,
      'text-4xl md:text-5xl text-center font-bold mb-4 italian-heading'
    );
    
    // Add wheat styling to the heading
    content = content.replace(
      /<h2 className="text-4xl md:text-5xl text-center font-bold mb-4 italian-heading"/g,
      '<h2 className="text-4xl md:text-5xl text-center font-bold mb-4 italian-heading" style={{color: "var(--country-dark)", textShadow: "2px 2px 4px rgba(0,0,0,0.3)"}}'
    );
    
    // Update the span color to wheat theme
    content = content.replace(
      /<span className="text-pizza-orange">/g,
      '<span style={{color: "var(--wheat-harvest)", textShadow: "2px 2px 4px rgba(0,0,0,0.4)"}}>'
    );
    
    // Update subheading colors
    content = content.replace(
      /text-center text-pizza-brown mb-8 max-w-3xl mx-auto font-roboto text-lg/g,
      'text-center mb-8 max-w-3xl mx-auto text-lg italian-body'
    );
    
    // Add wheat styling to subheading
    content = content.replace(
      /<p className="text-center mb-8 max-w-3xl mx-auto text-lg italian-body"/g,
      '<p className="text-center mb-8 max-w-3xl mx-auto text-lg italian-body" style={{color: "var(--country-brown)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)"}}'
    );
    
    // Update the experience button to wheat theme
    content = content.replace(
      /bg-gradient-to-r from-pizza-red to-pizza-orange text-white px-6 py-4 rounded-full flex items-center shadow-lg/g,
      'bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-6 py-4 rounded-full flex items-center shadow-xl'
    );
    
    // Update the icon color in the button
    content = content.replace(
      /<Images className="text-pizza-cream mr-3" size=\{24\} \/>/g,
      '<Images className="text-white mr-3" size={24} />'
    );
    
    // Update the button text font
    content = content.replace(
      /<span className="font-pacifico text-lg">Vivi l'Esperienza Regina 2000<\/span>/g,
      '<span className="italian-heading text-lg font-bold">Vivi l\'Esperienza Regina 2000</span>'
    );
    
    // Update the "No gallery images" text for better visibility
    content = content.replace(
      /<div className="text-gray-500 mb-4">/g,
      '<div className="mb-4" style={{color: "var(--country-brown)"}}>'
    );
    
    // Update the no images text
    content = content.replace(
      /<p className="text-lg">No gallery images available<\/p>/g,
      '<p className="text-lg italian-heading font-bold" style={{color: "var(--country-dark)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)"}}>No gallery images available</p>'
    );
    
    content = content.replace(
      /<p className="text-sm">Images will appear here once they are uploaded\.<\/p>/g,
      '<p className="text-sm italian-body" style={{color: "var(--country-brown)", textShadow: "1px 1px 2px rgba(0,0,0,0.2)"}}>Images will appear here once they are uploaded.</p>'
    );
    
    // Update refresh button styling for better visibility
    content = content.replace(
      /bg-transparent hover:bg-persian-gold\/5 text-persian-navy hover:text-persian-gold border-persian-gold\/20 hover:border-persian-gold\/40/g,
      'bg-white/90 hover:bg-white text-amber-800 hover:text-amber-900 border-amber-600 hover:border-amber-700 backdrop-blur-sm'
    );
    
    // Update error text styling
    content = content.replace(
      /<div className="text-center py-8 px-4 bg-red-50 rounded-lg mb-8">/g,
      '<div className="text-center py-8 px-4 rounded-lg mb-8" style={{backgroundColor: "rgba(255,255,255,0.9)", border: "2px solid var(--wheat-amber)"}}>'
    );
    
    content = content.replace(
      /<p className="text-red-500">\{error\}<\/p>/g,
      '<p className="italian-body font-semibold" style={{color: "var(--country-dark)"}}>{error}</p>'
    );
    
    // Update loading spinner color
    content = content.replace(
      /border-persian-gold/g,
      'border-amber-600'
    );
    
    // Update background decorations to wheat colors
    content = content.replace(
      /bg-pizza-red rounded-full blur-xl animate-pulse/g,
      'bg-amber-300 rounded-full blur-xl animate-pulse'
    );
    
    content = content.replace(
      /bg-pizza-orange rounded-full blur-xl animate-pulse/g,
      'bg-yellow-300 rounded-full blur-xl animate-pulse'
    );
    
    content = content.replace(
      /bg-pizza-green rounded-full blur-xl animate-pulse/g,
      'bg-amber-200 rounded-full blur-xl animate-pulse'
    );
    
    // Update floating icons colors
    content = content.replace(
      /text-pizza-orange\/20/g,
      'text-amber-400/30'
    );
    
    content = content.replace(
      /text-pizza-red\/20/g,
      'text-yellow-400/30'
    );
    
    writeFileSync('src/components/Gallery.tsx', content);
    console.log('✅ Gallery text visibility fixed with wheat theme');
    
    console.log('🎉 GALLERY TEXT VISIBILITY FIXED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error fixing gallery text:', error.message);
  }
}

fixGalleryTextVisibility();
