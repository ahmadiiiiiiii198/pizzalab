
import React, { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import PatternDivider from "./PatternDivider";
import { Pizza } from 'lucide-react';

interface MenuItem {
  name: string;
  description: string;
  price: number;
}

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  description?: string;
  items: MenuItem[];
}

interface MenuData {
  categories: MenuCategory[];
}

const MenuSection = ({ title, items, pricingInfo }: { title: string; items: MenuItem[]; pricingInfo?: string }) => {
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-pizza-dark mb-6 text-center">
        <span className="border-b-2 border-pizza-red pb-1">{title}</span>
      </h3>
      {pricingInfo && (
        <p className="text-lg text-pizza-orange font-semibold mb-4 text-center italic">
          {pricingInfo}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-8">
        {items.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="text-lg font-semibold text-pizza-dark">{item.name}</h4>
              <span className="text-pizza-red font-bold">€{(typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)).toFixed(2)}</span>
            </div>
            <p className="text-gray-600 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Menu = () => {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get category pricing information
  const getCategoryPricingInfo = (categoryName: string) => {
    if (categoryName === 'Menu Combos') {
      return 'Ogni menu è servito con patatine fritte e bibita';
    }
    return null;
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      console.log('🍕 Loading menu items from settings...');
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'menuItems')
        .single();

      if (error) {
        console.error('Error loading menu items:', error);
        return;
      }

      if (settingsData?.value) {
        console.log('🍕 Menu data loaded:', settingsData.value);
        setMenuData(settingsData.value as MenuData);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section id="menu" className="py-24 bg-white relative">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Pizza className="animate-spin h-6 w-6 text-pizza-red" />
            <span>Caricamento menu...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-24 bg-white relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-pizza-dark flex items-center justify-center gap-3">
            <Pizza className="h-8 w-8 text-pizza-red" />
            Il Nostro Menu
            <Pizza className="h-8 w-8 text-pizza-red" />
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Scopri la nostra selezione di pizze, panini, piadine, tacos e piatti speciali
          </p>
        </div>

        <PatternDivider />

        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-10 rounded-lg shadow-lg">
          {isLoading ? (
            <div className="text-center py-12">
              <Pizza className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Caricamento menu...</p>
            </div>
          ) : !menuData || !menuData.categories || menuData.categories.length === 0 ? (
            <div className="text-center py-12">
              <Pizza className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun prodotto disponibile al momento.</p>
              <p className="text-sm text-gray-500 mt-2">
                Aggiungi prodotti dal pannello admin per visualizzarli qui.
              </p>
            </div>
          ) : (
            menuData.categories
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => (
                <MenuSection
                  key={category.id}
                  title={category.name}
                  items={category.items}
                  pricingInfo={getCategoryPricingInfo(category.name) || category.description}
                />
              ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Menu;
