#!/usr/bin/env node
/**
 * Simple PDF Text Extractor for PIZZALAB Menu
 * Uses pdf-parse to extract text from the menu PDF
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPdfText(pdfPath) {
  try {
    // Dynamic import of pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    
    console.log('📄 Reading PDF file...');
    const dataBuffer = fs.readFileSync(pdfPath);
    
    console.log('🔍 Extracting text...');
    const data = await pdfParse(dataBuffer);
    
    console.log(`📝 Extracted ${data.text.length} characters from ${data.numpages} pages`);
    
    return data.text;
  } catch (error) {
    console.error('❌ Error extracting PDF:', error.message);
    return null;
  }
}

/**
 * Parse menu text to extract products and categories
 */
function parseMenuText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const categories = [];
  const products = [];
  let currentCategory = null;
  
  // Patterns for identifying menu items
  const pricePattern = /€\s*(\d+[.,]\d{2})|(\d+[.,]\d{2})\s*€/g;
  const categoryPatterns = [
    /^[A-Z\s&-]{3,}$/,  // All caps categories
    /^PIZZE?\s/i,       // Pizza categories
    /^ANTIPASTI/i,      // Antipasti
    /^PRIMI/i,          // Primi piatti
    /^SECONDI/i,        // Secondi piatti
    /^DOLCI/i,          // Dolci
    /^BEVANDE/i,        // Bevande
    /^BIRRE/i,          // Birre
    /^VINI/i,           // Vini
  ];
  
  console.log('🔍 Parsing menu text...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip very short lines or page numbers
    if (line.length < 3 || /^\d+$/.test(line)) {
      continue;
    }
    
    // Check if this is a category
    const isCategory = categoryPatterns.some(pattern => pattern.test(line)) && 
                      !pricePattern.test(line);
    
    if (isCategory) {
      currentCategory = {
        name: line,
        slug: line.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-'),
        products: []
      };
      categories.push(currentCategory);
      console.log(`📂 Found category: ${line}`);
      continue;
    }
    
    // Check if this line contains a product with price
    const priceMatches = [...line.matchAll(pricePattern)];
    if (priceMatches.length > 0) {
      const priceMatch = priceMatches[0];
      const priceStr = (priceMatch[1] || priceMatch[2]).replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (price > 0) {
        // Extract product name (remove price and clean up)
        let productName = line.replace(pricePattern, '').trim();
        productName = productName.replace(/^\d+[\.\)]\s*/, ''); // Remove numbering
        productName = productName.replace(/\s+/g, ' '); // Normalize spaces
        
        if (productName.length > 2) {
          const product = {
            name: productName,
            price: price,
            category: currentCategory ? currentCategory.name : 'General',
            description: '',
            raw_line: line
          };
          
          products.push(product);
          if (currentCategory) {
            currentCategory.products.push(product);
          }
          
          console.log(`🍕 Found product: ${productName} - €${price}`);
        }
      }
    }
  }
  
  return { categories, products };
}

/**
 * Save extracted data to JSON files
 */
function saveExtractedData(categories, products, rawText) {
  const outputDir = path.join(__dirname, 'extracted_menu_data');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save categories
  fs.writeFileSync(
    path.join(outputDir, 'extracted_categories.json'),
    JSON.stringify(categories, null, 2),
    'utf8'
  );
  
  // Save products
  fs.writeFileSync(
    path.join(outputDir, 'extracted_products.json'),
    JSON.stringify(products, null, 2),
    'utf8'
  );
  
  // Save raw text for manual review
  fs.writeFileSync(
    path.join(outputDir, 'extracted_text.txt'),
    rawText,
    'utf8'
  );
  
  // Create summary
  const summary = {
    extraction_date: new Date().toISOString(),
    categories_count: categories.length,
    products_count: products.length,
    categories: categories.map(cat => ({
      name: cat.name,
      products_count: cat.products.length
    }))
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'extraction_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );
  
  console.log(`💾 Saved data to: ${outputDir}`);
  console.log(`📊 Categories: ${categories.length}`);
  console.log(`🍕 Products: ${products.length}`);
  
  return outputDir;
}

/**
 * Main extraction function
 */
async function main() {
  const pdfPath = 'c:/Users/39351/Downloads/m.pdf';
  
  console.log('🚀 Starting PDF extraction...');
  console.log(`📄 PDF file: ${pdfPath}`);
  
  // Check if PDF exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF file not found: ${pdfPath}`);
    return;
  }
  
  // Extract text from PDF
  const text = await extractPdfText(pdfPath);
  if (!text) {
    console.error('❌ Failed to extract text from PDF');
    return;
  }
  
  // Parse the text
  const { categories, products } = parseMenuText(text);
  
  // Save the data
  const outputDir = saveExtractedData(categories, products, text);
  
  console.log('\n✅ Extraction completed successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('\n📋 Next steps:');
  console.log('1. Review the extracted files');
  console.log('2. Run: node import_menu_data.js');
  console.log('3. Check the website admin panel');
}

// Install pdf-parse if not available
async function ensureDependencies() {
  try {
    await import('pdf-parse');
  } catch (error) {
    console.log('📦 Installing pdf-parse...');
    const { execSync } = await import('child_process');
    execSync('npm install pdf-parse', { stdio: 'inherit' });
  }
}

// Run the extraction
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureDependencies()
    .then(() => main())
    .catch(console.error);
}
