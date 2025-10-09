import { readFileSync, writeFileSync } from 'fs';

function fixAllSyntaxErrors() {
  console.log('🔧 FIXING ALL SYNTAX ERRORS IN WHYCHOOSEUSSECTION...');
  
  try {
    let content = readFileSync('src/components/WhyChooseUsSection.tsx', 'utf8');
    
    // Fix all missing closing brackets in div tags with style attributes
    // This is a comprehensive fix for all similar patterns
    
    // Fix pattern: style={{...}} followed by content without closing >
    content = content.replace(
      /style=\{\{borderColor: "var\(--wheat-amber\)"\}\}\s*\n\s*<div className="flex items-center space-x-3">/g,
      'style={{borderColor: "var(--wheat-amber)"}}>\n                  <div className="flex items-center space-x-3">'
    );
    
    // Fix any other similar patterns with different style attributes
    content = content.replace(
      /style=\{\{borderColor: "var\(--wheat-golden\)"\}\}\s*\n\s*\{centralImageUrl/g,
      'style={{borderColor: "var(--wheat-golden)"}}>\n                {centralImageUrl'
    );
    
    // Fix any remaining patterns where style attribute is not closed properly
    content = content.replace(
      /style=\{\{color: "var\(--country-dark\)"\}\}\s*\n/g,
      'style={{color: "var(--country-dark)"}}>\n'
    );
    
    content = content.replace(
      /style=\{\{color: "var\(--country-brown\)"\}\}\s*\n/g,
      'style={{color: "var(--country-brown)"}}>\n'
    );
    
    content = content.replace(
      /style=\{\{borderColor: "var\(--wheat-light\)"\}\}\s*\n/g,
      'style={{borderColor: "var(--wheat-light)"}}>\n'
    );
    
    // Let's also check for any other unclosed tags by looking for the specific pattern
    // where a tag has attributes but no closing >
    
    // Read the file again to check line by line
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Check if line has a div/element with style attribute but no closing >
      if (line.includes('style={{') && line.includes('}}') && !line.includes('}>') && !line.includes('/>')) {
        // Check if the next line starts with content (not another attribute)
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('<') || nextLine.startsWith('{')) {
            // This line needs a closing >
            line = line.replace(/\}\}$/, '}}>');
          }
        }
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    writeFileSync('src/components/WhyChooseUsSection.tsx', content);
    console.log('✅ All syntax errors fixed in WhyChooseUsSection.tsx');
    
    console.log('🎉 ALL SYNTAX ERRORS FIXED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error fixing syntax:', error.message);
  }
}

fixAllSyntaxErrors();
