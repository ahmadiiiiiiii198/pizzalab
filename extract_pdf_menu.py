#!/usr/bin/env python3
"""
PDF Menu Extractor for PIZZALAB
Extracts product information from the 2025 menu PDF and converts it to JSON format
"""

import PyPDF2
import json
import re
from pathlib import Path
import sys

def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            print(f"📄 Processing PDF with {len(pdf_reader.pages)} pages...")
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                print(f"📖 Extracting page {page_num}...")
                page_text = page.extract_text()
                text += f"\n--- PAGE {page_num} ---\n"
                text += page_text
                
            return text
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return None

def parse_menu_text(text):
    """Parse extracted text to identify products and categories"""
    lines = text.split('\n')
    products = []
    categories = []
    current_category = None
    
    # Common patterns for menu items
    price_pattern = re.compile(r'€?\s*(\d+[.,]\d{2})')
    category_patterns = [
        re.compile(r'^[A-Z\s]+$'),  # All caps categories
        re.compile(r'^\d+\.\s*[A-Z]'),  # Numbered categories
        re.compile(r'^[A-Z][^a-z]*[A-Z]$'),  # Mixed case categories
    ]
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith('---'):
            continue
            
        # Check if this might be a category
        is_category = False
        for pattern in category_patterns:
            if pattern.match(line) and len(line) > 3:
                is_category = True
                break
        
        if is_category and not price_pattern.search(line):
            current_category = {
                'name': line,
                'slug': line.lower().replace(' ', '-').replace('&', 'e'),
                'products': []
            }
            if current_category not in categories:
                categories.append(current_category)
                print(f"📂 Found category: {line}")
        
        # Check if this might be a product with price
        elif price_pattern.search(line):
            price_match = price_pattern.search(line)
            if price_match:
                price_str = price_match.group(1).replace(',', '.')
                try:
                    price = float(price_str)
                    
                    # Extract product name (text before price)
                    name_part = line[:price_match.start()].strip()
                    name_part = re.sub(r'^\d+[\.\)]\s*', '', name_part)  # Remove numbering
                    
                    if len(name_part) > 2:  # Valid product name
                        product = {
                            'name': name_part,
                            'price': price,
                            'category': current_category['name'] if current_category else 'General',
                            'description': '',
                            'raw_line': line
                        }
                        
                        products.append(product)
                        if current_category:
                            current_category['products'].append(product)
                        
                        print(f"🍕 Found product: {name_part} - €{price}")
                        
                except ValueError:
                    continue
    
    return categories, products

def save_extracted_data(categories, products, output_dir):
    """Save extracted data to JSON files"""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Save categories
    categories_file = output_path / 'extracted_categories.json'
    with open(categories_file, 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    
    # Save products
    products_file = output_path / 'extracted_products.json'
    with open(products_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    # Save raw text for manual review
    text_file = output_path / 'extracted_text.txt'
    with open(text_file, 'w', encoding='utf-8') as f:
        f.write("EXTRACTED TEXT FROM PDF\n")
        f.write("=" * 50 + "\n\n")
        for category in categories:
            f.write(f"CATEGORY: {category['name']}\n")
            f.write("-" * 30 + "\n")
            for product in category['products']:
                f.write(f"  • {product['name']} - €{product['price']}\n")
            f.write("\n")
    
    print(f"💾 Saved data to {output_path}")
    print(f"📊 Categories: {len(categories)}")
    print(f"🍕 Products: {len(products)}")
    
    return categories_file, products_file

def main():
    """Main extraction function"""
    pdf_path = Path("c:/Users/39351/Downloads/2025 menu_compressed.pdf")
    output_dir = Path("c:/Users/39351/Downloads/pizzalab-main/extracted_menu_data")
    
    if not pdf_path.exists():
        print(f"❌ PDF file not found: {pdf_path}")
        return False
    
    print(f"🚀 Starting PDF extraction from: {pdf_path}")
    
    # Extract text from PDF
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return False
    
    print(f"📝 Extracted {len(text)} characters of text")
    
    # Parse the text
    categories, products = parse_menu_text(text)
    
    # Save the data
    categories_file, products_file = save_extracted_data(categories, products, output_dir)
    
    print("\n✅ Extraction completed!")
    print(f"📁 Check the files in: {output_dir}")
    print("\n📋 Next steps:")
    print("1. Review the extracted data files")
    print("2. Run the import script to add products to the website")
    print("3. Use the admin panel to fine-tune the data")
    
    return True

if __name__ == "__main__":
    try:
        import PyPDF2
    except ImportError:
        print("❌ PyPDF2 not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
        import PyPDF2
    
    main()
