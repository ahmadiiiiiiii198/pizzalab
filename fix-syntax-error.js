import { readFileSync, writeFileSync } from 'fs';

function fixSyntaxError() {
  console.log('🔧 FIXING SYNTAX ERROR IN WHYCHOOSEUSSECTION...');
  
  try {
    let content = readFileSync('src/components/WhyChooseUsSection.tsx', 'utf8');
    
    // Fix the missing closing bracket on line 144
    content = content.replace(
      /<div className="relative w-60 h-60 rounded-full overflow-hidden shadow-2xl border-6 bg-white" style=\{\{borderColor: "var\(--wheat-golden\)"\}\}\s*\{centralImageUrl \? \(/,
      '<div className="relative w-60 h-60 rounded-full overflow-hidden shadow-2xl border-6 bg-white" style={{borderColor: "var(--wheat-golden)"}}>\n                {centralImageUrl ? ('
    );
    
    // Also fix the mobile version if it has the same issue
    content = content.replace(
      /<div className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 bg-white" style=\{\{borderColor: "var\(--wheat-golden\)"\}\}\s*\{centralImageUrl \? \(/,
      '<div className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 bg-white" style={{borderColor: "var(--wheat-golden)"}}>\n                {centralImageUrl ? ('
    );
    
    writeFileSync('src/components/WhyChooseUsSection.tsx', content);
    console.log('✅ Syntax error fixed in WhyChooseUsSection.tsx');
    
    console.log('🎉 SYNTAX ERROR FIXED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error fixing syntax:', error.message);
  }
}

fixSyntaxError();
