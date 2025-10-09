
import React, { useState, useEffect } from 'react';
import { Flower, Sparkles, Heart, Users, Pizza, ChefHat, Utensils, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CategoryGallery from './CategoryGallery';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';

const Categories = () => {
  const [categoryPictures, setCategoryPictures] = useState([]);
  const [categoryGalleries, setCategoryGalleries] = useState({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Categories] 🚀 Categories component mounted, starting data loading...');
    loadCategoryPictures();
    loadCategoryGalleries();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('[Categories] 🔄 Loading categories from database...');
      console.log('[Categories] 🔄 Calling categoryService.refreshContent...');

      // Force refresh to ensure we get the latest data (including any slug fixes)
      const categoryContent = await categoryService.refreshContent(false); // Only active categories

      console.log('[Categories] ✅ Categories loaded successfully!');
      console.log('[Categories] 📊 Categories data:', categoryContent.categories);
      console.log('[Categories] 📈 Total categories count:', categoryContent.categories.length);

      // Log each category for debugging
      if (categoryContent.categories && categoryContent.categories.length > 0) {
        categoryContent.categories.forEach((cat, index) => {
          console.log(`[Categories] ${index + 1}. ${cat.name} (slug: ${cat.slug}, active: ${cat.is_active})`);
        });
      } else {
        console.warn('[Categories] ⚠️ No categories found in the response!');
      }

      setCategories(categoryContent.categories || []);
    } catch (error) {
      console.error('[Categories] ❌ Error loading categories:', error);
      console.error('[Categories] ❌ Error details:', error.message, error.stack);
      setCategories([]);
    } finally {
      console.log('[Categories] 🏁 Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const loadCategoryPictures = async () => {
    try {
      // Load from the same source as admin "Galleria" section
      const { data, error } = await supabase
        .from('settings')
        .select('value, updated_at')
        .eq('key', 'gallery_images')
        .single();

      if (!error && data?.value && Array.isArray(data.value)) {
        // Convert gallery images format to match expected format
        const galleryImages = data.value.map((img, index) => ({
          id: img.id || `gallery-${index}`,
          image_url: img.src,
          title: img.alt || 'Gallery Image',
          position: index,
          is_active: true
        }));
        setCategoryPictures(galleryImages);
      } else {
        setCategoryPictures([]);
      }
    } catch (error) {
      console.log('Could not load gallery pictures:', error);
      setCategoryPictures([]);
    }
  };

  const loadCategoryGalleries = async () => {
    try {
      console.log('[Categories] Loading category galleries from database...');

      // Load all category gallery data
      const categoryKeys = ['matrimoni', 'fiori_piante', 'fiori_finti', 'funerali'];
      const galleries = {};

      for (const categoryKey of categoryKeys) {
        const { data, error } = await supabase
          .from('content_sections')
          .select('content_value')
          .eq('section_key', `category_${categoryKey}_images`)
          .single();

        if (!error && data?.content_value) {
          try {
            const parsedData = JSON.parse(data.content_value);
            console.log(`[Categories] Loaded ${categoryKey} gallery:`, parsedData);

            // Handle both old format (array of strings) and new format (array of objects with url and label)
            let images = [];
            let labels = [];

            if (Array.isArray(parsedData)) {
              if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
                // Old format: array of URL strings
                images = parsedData.filter(url => url && url.trim());
                labels = [];
              } else {
                // New format: array of objects with url and label
                images = parsedData
                  .filter(item => item && item.url && item.url.trim())
                  .map(item => item.url.trim());
                labels = parsedData
                  .filter(item => item && item.url && item.url.trim())
                  .map(item => item.label || '');
              }
            }

            galleries[categoryKey] = { images, labels };
          } catch (parseError) {
            console.error(`[Categories] Error parsing ${categoryKey} gallery:`, parseError);
          }
        } else {
          console.log(`[Categories] No gallery data found for ${categoryKey}`);
        }
      }

      setCategoryGalleries(galleries);
      console.log('[Categories] All category galleries loaded:', galleries);
    } catch (error) {
      console.error('[Categories] Error loading category galleries:', error);
    }
  };

  // Get icon for category based on slug
  const getCategoryIcon = (slug: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'pizza-classiche': <Pizza className="text-orange-500" size={28} />,
      'pizze-speciale': <ChefHat className="text-red-500" size={28} />,
      'pizze-gourmet': <Utensils className="text-purple-500" size={28} />,
      'consigliate-piccanti': <Sparkles className="text-red-600" size={28} />,
      'crea-la-tua-pizza': <Pizza className="text-blue-500" size={28} />,
      'pizze-vegane': <Flower className="text-green-500" size={28} />,
      'offerta-settembre': <Sparkles className="text-yellow-500" size={28} />,
      'farinate': <ChefHat className="text-yellow-600" size={28} />,
      'focacce': <Utensils className="text-amber-500" size={28} />,
      'calzoni': <Pizza className="text-orange-600" size={28} />,
      'fritti': <ChefHat className="text-red-400" size={28} />,
      'dolci': <Heart className="text-pink-500" size={28} />,
      'bevande': <Coffee className="text-blue-600" size={28} />,
      'birre': <Coffee className="text-amber-600" size={28} />
    };
    return iconMap[slug] || <Pizza className="text-orange-500" size={28} />;
  };

  // Create categories with database data
  const getCategories = () => {
    const defaultImages = [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Pizza
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Pizza 2
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Pizza 3
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"  // Pizza 4
    ];

    return categories.map((category, index) => ({
      title: category.name,
      description: category.description || `Scopri le nostre ${category.name.toLowerCase()}`,
      images: category.image_url ? [category.image_url] : [defaultImages[index % defaultImages.length]],
      explanation: category.description || `Benvenuto nella sezione ${category.name}. Qui troverai una selezione curata dei nostri migliori prodotti.`,
      features: [
        "Ingredienti freschi e di qualità",
        "Preparazione artigianale",
        "Ricette tradizionali",
        "Servizio veloce",
        "Consegna a domicilio"
      ],
      labels: [],
      icon: getCategoryIcon(category.slug),
      slug: category.slug,
      id: category.id
    }));
  };

  return (
    <section id="categories" className="py-20 bg-gradient-to-br from-peach-50/30 via-white to-amber-50/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-playfair animate-scale-in">
            Le Nostre Categorie
          </h2>
          <p className="text-xl text-gray-600 font-inter animate-fade-in-up animate-stagger-1">
            Scopri il gusto autentico di Ruràl Pizza: dalle pizze classiche alle specialità gourmet. 🍕✨
          </p>
        </div>

        {/* 3-Picture Gallery - WHERE YOU CAN UPLOAD YOUR DOG PICTURE! */}
        <div className="mb-16 animate-slide-in-up animate-stagger-2">
          <div className="text-center mb-8 animate-fade-in-down">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2 font-playfair animate-bounce-gentle">
              La Nostra Galleria
            </h3>
            <p className="text-gray-600 animate-fade-in-up animate-stagger-1">
              Scopri alcuni dei nostri piatti più deliziosi e le nostre creazioni speciali! 🍕
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {!isLoading && categoryPictures && categoryPictures.length > 0 ? (
              categoryPictures.map((picture, index) => (
                <div
                  key={picture.id}
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover-lift animate-scale-in animate-stagger-${Math.min(index + 1, 5)}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={picture.image_url}
                      alt={picture.title || `Gallery picture ${picture.position}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 hover-glow"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {picture.title && (
                    <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <p className="text-sm font-medium animate-fade-in-up">{picture.title}</p>
                    </div>
                  )}
                  {/* Floating animation elements */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Flower className="text-white animate-float" size={20} />
                  </div>
                </div>
              ))
            ) : (
              // Default placeholder images when no pictures are uploaded
              [1, 2, 3].map((position) => (
                <div
                  key={position}
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover-lift animate-fade-in-up animate-stagger-${position}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500 animate-bounce-gentle">
                      <Flower size={48} className="mx-auto mb-2 text-gray-400 animate-float" />
                      <p className="text-sm animate-fade-in-up">Picture {position}</p>
                      <p className="text-xs animate-fade-in-up animate-stagger-1">Upload via Admin Panel</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up animate-stagger-3">
          {isLoading ? (
            // Loading state
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse bg-gray-200 rounded-2xl h-64"
              />
            ))
          ) : getCategories().length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <Pizza className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nessuna categoria disponibile al momento.</p>
              <p className="text-gray-500 text-sm mt-2">Le categorie verranno visualizzate qui una volta aggiunte.</p>
            </div>
          ) : (
            // Categories
            getCategories().map((category, index) => (
              <div
                key={category.id || index}
                className={`animate-scale-in animate-stagger-${Math.min(index + 1, 5)} hover-lift`}
              >
                <CategoryGallery
                  category={category}
                />
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};

export default Categories;
