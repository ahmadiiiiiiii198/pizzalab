#!/usr/bin/env python3
"""
Simple PDF extractor for menu data
"""

import json
import os
import re
import sys

def install_and_import(package):
    """Install and import a package"""
    try:
        __import__(package)
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        globals()[package] = __import__(package)

# Install required packages
try:
    import PyPDF2
except ImportError:
    print("Installing PyPDF2...")
    install_and_import('PyPDF2')
    import PyPDF2

def extract_pdf_text(pdf_path):
    """Extract text from PDF"""
    print(f"📄 Opening PDF: {pdf_path}")
    
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            print(f"📖 Found {len(reader.pages)} pages")
            
            for i, page in enumerate(reader.pages):
                print(f"Processing page {i+1}...")
                page_text = page.extract_text()
                text += f"\n--- PAGE {i+1} ---\n{page_text}\n"
            
            return text
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return None

def parse_menu_items(text):
    """Parse text to extract menu items"""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    products = []
    categories = []
    current_category = "General"
    
    # Price pattern - matches various formats
    price_patterns = [
        r'€\s*(\d+[.,]\d{2})',
        r'(\d+[.,]\d{2})\s*€',
        r'(\d+[.,]\d{2})\s*euro',
    ]
    
    # Category patterns
    category_keywords = [
        'PIZZA', 'PIZZE', 'ANTIPASTI', 'PRIMI', 'SECONDI', 
        'DOLCI', 'BEVANDE', 'BIRRE', 'VINI', 'CONTORNI',
        'PANINI', 'PIADINE', 'KEBAB', 'FALAFEL'
    ]
    
    for line in lines:
        if len(line) < 3:
            continue
            
        # Check if this might be a category
        line_upper = line.upper()
        if any(keyword in line_upper for keyword in category_keywords):
            if not any(re.search(pattern, line) for pattern in price_patterns):
                current_category = line.title()
                if current_category not in [cat['name'] for cat in categories]:
                    categories.append({
                        'name': current_category,
                        'slug': current_category.lower().replace(' ', '-').replace('&', 'e')
                    })
                    print(f"📂 Found category: {current_category}")
                continue
        
        # Check for products with prices
        for pattern in price_patterns:
            matches = re.findall(pattern, line)
            if matches:
                price_str = matches[0].replace(',', '.')
                try:
                    price = float(price_str)
                    
                    # Extract product name
                    name = re.sub(r'€\s*\d+[.,]\d{2}|\d+[.,]\d{2}\s*€|\d+[.,]\d{2}\s*euro', '', line).strip()
                    name = re.sub(r'^\d+[\.\)]\s*', '', name)  # Remove numbering
                    
                    if len(name) > 2:
                        product = {
                            'name': name,
                            'price': price,
                            'category': current_category,
                            'description': f"Delizioso {name.lower()}"
                        }
                        products.append(product)
                        print(f"🍕 Found: {name} - €{price}")
                        break
                        
                except ValueError:
                    continue
    
    return categories, products

def save_data(categories, products, text):
    """Save extracted data"""
    output_dir = "extracted_menu_data"
    os.makedirs(output_dir, exist_ok=True)
    
    # Save categories
    with open(f"{output_dir}/categories.json", 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    
    # Save products
    with open(f"{output_dir}/products.json", 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    # Save raw text
    with open(f"{output_dir}/raw_text.txt", 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"\n💾 Data saved to {output_dir}/")
    print(f"📊 Categories: {len(categories)}")
    print(f"🍕 Products: {len(products)}")

def main():
    pdf_path = r"c:\Users\39351\Downloads\m.pdf"
    
    print("🚀 Starting PDF extraction...")
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found: {pdf_path}")
        return
    
    # Extract text
    text = extract_pdf_text(pdf_path)
    if not text:
        return
    
    # Parse menu items
    categories, products = parse_menu_items(text)
    
    # Save data
    save_data(categories, products, text)
    
    print("\n✅ Extraction complete!")
    print("Next: Run the import script to add to website")

if __name__ == "__main__":
    main()
