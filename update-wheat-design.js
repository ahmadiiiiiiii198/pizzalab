import { readFileSync, writeFileSync } from 'fs';

function updateWheatDesign() {
  console.log('🌾 UPDATING CIRCULAR ELEMENTS TO MATCH WHEAT/COUNTRYSIDE DESIGN...');
  
  try {
    let content = readFileSync('src/components/WhyChooseUsSection.tsx', 'utf8');
    
    // Replace the orange/red color scheme with wheat/countryside colors
    
    // Update decorative background elements to wheat colors
    content = content.replace(
      /bg-orange-300 rounded-full blur-3xl/g,
      'bg-amber-200 rounded-full blur-3xl'
    );
    
    content = content.replace(
      /bg-red-300 rounded-full blur-3xl/g,
      'bg-yellow-200 rounded-full blur-3xl'
    );
    
    content = content.replace(
      /bg-yellow-300 rounded-full blur-2xl/g,
      'bg-amber-100 rounded-full blur-2xl'
    );
    
    // Update main title color to wheat theme
    content = content.replace(
      /style=\{\{ color: '#8B4513' \}\}/g,
      'style={{ color: "var(--country-dark)" }} className="italian-heading"'
    );
    
    // Update subtitle styling
    content = content.replace(
      /text-gray-700 max-w-3xl mx-auto font-inter font-medium/g,
      'max-w-3xl mx-auto italian-body font-medium'
    );
    
    // Add wheat styling to subtitle
    content = content.replace(
      /<p className="text-lg md:text-xl max-w-3xl mx-auto italian-body font-medium">/g,
      '<p className="text-lg md:text-xl max-w-3xl mx-auto italian-body font-medium" style={{color: "var(--country-brown)"}}>'
    );
    
    // Update central image glow effect to wheat colors
    content = content.replace(
      /bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-2xl opacity-20 animate-pulse/g,
      'bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full blur-2xl opacity-30 animate-pulse'
    );
    
    // Update central image border to wheat theme
    content = content.replace(
      /border-6 border-white bg-white/g,
      'border-6 bg-white'
    );
    
    // Add wheat border styling
    content = content.replace(
      /className="relative w-60 h-60 rounded-full overflow-hidden shadow-2xl border-6 bg-white">/g,
      'className="relative w-60 h-60 rounded-full overflow-hidden shadow-2xl border-6 bg-white" style={{borderColor: "var(--wheat-golden)"}}'
    );
    
    // Update mobile central image border
    content = content.replace(
      /border-4 border-white bg-white/g,
      'border-4 bg-white'
    );
    
    content = content.replace(
      /className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 bg-white">/g,
      'className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 bg-white" style={{borderColor: "var(--wheat-golden)"}}'
    );
    
    // Update connecting lines to wheat colors
    content = content.replace(
      /bg-gradient-to-r from-orange-300 to-transparent/g,
      'bg-gradient-to-r from-amber-300 to-transparent'
    );
    
    content = content.replace(
      /bg-gradient-to-l from-orange-300 to-transparent/g,
      'bg-gradient-to-l from-amber-300 to-transparent'
    );
    
    // Update feature cards background to wheat theme
    content = content.replace(
      /bg-gradient-to-r from-orange-50 to-orange-100/g,
      'from-amber-50 to-yellow-50'
    );
    
    content = content.replace(
      /bg-gradient-to-l from-orange-50 to-orange-100/g,
      'from-yellow-50 to-amber-50'
    );
    
    // Update feature cards borders to wheat theme
    content = content.replace(
      /border-2 border-orange-200/g,
      'border-2'
    );
    
    // Add wheat border styling to feature cards
    content = content.replace(
      /className="group from-amber-50 to-yellow-50 rounded-full px-4 py-3 shadow-lg border-2 w-64 h-12 flex items-center relative z-10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">/g,
      'className="group bg-gradient-to-r from-amber-50 to-yellow-50 rounded-full px-4 py-3 shadow-lg border-2 w-64 h-12 flex items-center relative z-10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer" style={{borderColor: "var(--wheat-amber)"}}'
    );
    
    content = content.replace(
      /className="group from-yellow-50 to-amber-50 rounded-full px-4 py-3 shadow-lg border-2 w-64 h-12 flex items-center relative z-10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">/g,
      'className="group bg-gradient-to-l from-yellow-50 to-amber-50 rounded-full px-4 py-3 shadow-lg border-2 w-64 h-12 flex items-center relative z-10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer" style={{borderColor: "var(--wheat-amber)"}}'
    );
    
    // Update feature card icons to wheat theme
    content = content.replace(
      /bg-gradient-to-br from-red-500 to-red-600/g,
      'bg-gradient-to-br from-amber-500 to-yellow-600'
    );
    
    // Update feature card text colors to wheat theme
    content = content.replace(
      /text-gray-800 text-sm font-inter leading-tight group-hover:text-red-700/g,
      'text-sm font-inter leading-tight group-hover:text-amber-700 italian-body'
    );
    
    // Add wheat text color
    content = content.replace(
      /className="font-semibold text-sm font-inter leading-tight group-hover:text-amber-700 italian-body"/g,
      'className="font-semibold text-sm font-inter leading-tight group-hover:text-amber-700 italian-body" style={{color: "var(--country-dark)"}}'
    );
    
    // Update hover glow effects to wheat colors
    content = content.replace(
      /bg-gradient-to-r from-orange-200 to-red-200/g,
      'bg-gradient-to-r from-amber-200 to-yellow-200'
    );
    
    content = content.replace(
      /bg-gradient-to-l from-orange-200 to-red-200/g,
      'bg-gradient-to-l from-yellow-200 to-amber-200'
    );
    
    // Update mobile feature cards
    content = content.replace(
      /border border-orange-100 hover:border-orange-200/g,
      'border hover:border-amber-200'
    );
    
    // Add wheat border to mobile cards
    content = content.replace(
      /className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-amber-200">/g,
      'className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border hover:border-amber-200" style={{borderColor: "var(--wheat-light)"}}'
    );
    
    // Update mobile feature icons
    content = content.replace(
      /bg-gradient-to-br from-orange-100 to-red-100/g,
      'bg-gradient-to-br from-amber-100 to-yellow-100'
    );
    
    // Update mobile feature text colors
    content = content.replace(
      /text-gray-800 text-lg font-inter leading-tight group-hover:text-red-700/g,
      'text-lg font-inter leading-tight group-hover:text-amber-700 italian-heading'
    );
    
    // Add wheat color to mobile titles
    content = content.replace(
      /className="font-semibold text-lg font-inter leading-tight group-hover:text-amber-700 italian-heading"/g,
      'className="font-semibold text-lg font-inter leading-tight group-hover:text-amber-700 italian-heading" style={{color: "var(--country-dark)"}}'
    );
    
    // Update mobile description text
    content = content.replace(
      /text-gray-600 text-sm font-inter leading-relaxed/g,
      'text-sm font-inter leading-relaxed italian-body'
    );
    
    // Add wheat color to mobile descriptions
    content = content.replace(
      /className="text-sm font-inter leading-relaxed italian-body"/g,
      'className="text-sm font-inter leading-relaxed italian-body" style={{color: "var(--country-brown)"}}'
    );
    
    // Update mobile hover effects
    content = content.replace(
      /bg-gradient-to-r from-orange-200 to-red-200 opacity-0 group-hover:opacity-10/g,
      'bg-gradient-to-r from-amber-200 to-yellow-200 opacity-0 group-hover:opacity-10'
    );
    
    // Update CTA button colors to wheat theme
    content = content.replace(
      /bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-xl opacity-30/g,
      'bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-30'
    );
    
    content = content.replace(
      /bg-gradient-to-r from-red-600 to-red-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-full shadow-2xl hover:from-red-700 hover:to-red-800/g,
      'bg-gradient-to-r from-amber-600 to-yellow-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-full shadow-2xl hover:from-amber-700 hover:to-yellow-800'
    );
    
    // Update CTA text styling
    content = content.replace(
      /font-bold text-sm md:text-lg font-inter tracking-wide text-center/g,
      'font-bold text-sm md:text-lg italian-heading tracking-wide text-center'
    );
    
    writeFileSync('src/components/WhyChooseUsSection.tsx', content);
    console.log('✅ WhyChooseUsSection updated with wheat/countryside design');
    
    console.log('🎉 WHEAT/COUNTRYSIDE DESIGN APPLIED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error updating wheat design:', error.message);
  }
}

updateWheatDesign();
