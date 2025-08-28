
import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Clock, Star, Flower } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { supabase } from '@/integrations/supabase/client';
import VideoBackground from './VideoBackground';

const About = () => {
  const { language, t } = useLanguage();
  const [aboutContent, setAboutContent] = useState(null);
  const [chiSiamoContent, setChiSiamoContent] = useState(null);
  const [chiSiamoImage, setChiSiamoImage] = useState({
    image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    alt: 'EFES KEBAP - La nostra storia'
  });
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  useEffect(() => {
    console.log('🚀 [About] Component mounted, loading content...');

    const loadAboutContent = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'aboutContent')
          .single();

        if (!error && data?.value) {
          setAboutContent(data.value);
        }
      } catch (error) {
        console.log('About content not found in database, using default');
      }
    };

    const loadChiSiamoContent = async () => {
      try {
        console.log('🔄 [About] Loading Chi Siamo content from database...');
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'chiSiamoContent')
          .single();

        if (!error && data?.value) {
          console.log('✅ [About] Chi Siamo content loaded:', data.value);
          const value = data.value as any;
          console.log('🖼️ [About] Background image from DB:', value.backgroundImage);
          setChiSiamoContent(data.value);
        } else {
          console.log('⚠️ [About] No Chi Siamo content found, using default');
          console.log('❌ [About] Database error:', error);
        }
      } catch (error) {
        console.error('❌ [About] Error loading Chi Siamo content:', error);
      }
    };

    const loadChiSiamoImage = async () => {
      try {
        console.log('🔄 [About] Loading Chi Siamo image from database...');
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'chiSiamoImage')
          .single();

        if (!error && data?.value) {
          console.log('✅ [About] Chi Siamo image loaded:', data.value);
          setChiSiamoImage(data.value);
        } else {
          console.log('⚠️ [About] No Chi Siamo image found, using default');
        }
      } catch (error) {
        console.error('❌ [About] Error loading Chi Siamo image:', error);
      }
    };

    loadAboutContent();
    loadChiSiamoContent();
    loadChiSiamoImage();

    // Set up real-time listener for Chi Siamo content and image changes
    const timestamp = Date.now();
    const channelName = `chi-siamo-updates-${timestamp}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.chiSiamoImage'
      }, async (payload) => {
        console.log('🔔 [About] Real-time Chi Siamo image update received from admin');
        console.log('📦 [About] Payload:', payload);
        if (payload.new?.value) {
          console.log('🖼️ [About] New image data:', payload.new.value);
          setChiSiamoImage(payload.new.value);
          console.log('✅ [About] Chi Siamo image updated from real-time change');

          // Force a re-render by updating the refresh key
          console.log('🔄 [About] Forcing component refresh...');
          setImageRefreshKey(Date.now());
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.chiSiamoContent'
      }, async (payload) => {
        console.log('🔔 [About] Real-time Chi Siamo content update received from admin');
        if (payload.new?.value) {
          setChiSiamoContent(payload.new.value);
          console.log('✅ [About] Chi Siamo content updated from real-time change');
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Multilingual content
  const content = {
    it: {
      title: '👨‍🍳 Chi Siamo - EFES KEBAP',
      storyTitle: '🥙 La Nostra Storia',
      paragraph1: 'EFES KEBAP nasce dalla passione per l\'autentica tradizione turca e italiana, unendo l\'esperienza culinaria tramandata nel tempo. Da anni, offriamo kebap e pizza preparati con amore, ingredienti freschi e tecniche tradizionali.',
      paragraph2: 'I nostri piatti nascono da una profonda passione per la tradizione culinaria turca e italiana. Solo ingredienti selezionati, solo autenticità made in Torino. 🥙 Situati nel cuore di Torino, offriamo esperienza artigianale e passione per il vero kebap e la vera pizza italiana.',
      quote: '🏪 Nel nostro ristorante puoi trovare:',
      quoteAuthor: 'Un viaggio tra sapori, tradizione e autenticità',
      servicesTitle: 'Nella nostra pizzeria puoi trovare:',
      services: [
        'Pizza italiana cotta nel forno a legna',
        'Ingredienti freschi e di prima qualità',
        'Impasto preparato quotidianamente con lievitazione naturale',
        'Servizio per eventi e feste personalizzato'
      ],
      stats: {
        years: 'Anni di Esperienza',
        customers: 'Clienti Soddisfatti',
        varieties: 'Varietà di Pizze'
      },
      closingMessage: 'Vieni a trovarci alla Pizzeria Senza Cipolla e scopri il vero sapore della tradizione italiana.',
      tagline: 'Creiamo sapori autentici, una pizza alla volta'
    },
    en: {
      title: '👨‍🍳 About Us - Pizzeria Senza Cipolla',
      storyTitle: '🍕 Our Story',
      paragraph1: 'Pizzeria Senza Cipolla was born from a passion for authentic Italian tradition and culinary experience passed down through time. For 14 years, we offer Italian pizza prepared with love, fresh ingredients and our traditional wood-fired oven.',
      paragraph2: 'Our pizzas are born from a deep passion for Italian culinary tradition. Only selected ingredients, only authenticity made in Turin. 🍕 Located in the heart of Turin, we offer artisanal experience and passion for authentic Italian pizza.',
      quote: '🏪 In our pizzeria you can find:',
      quoteAuthor: 'A journey through flavors, tradition and authenticity',
      servicesTitle: 'In our pizzeria you can find:',
      services: [
        'Italian pizza cooked in a wood-fired oven',
        'Fresh and top quality ingredients',
        'Dough prepared daily with natural leavening',
        'Service for events and personalized parties'
      ],
      stats: {
        years: 'Years of Experience',
        customers: 'Satisfied Customers',
        varieties: 'Pizza Varieties'
      },
      closingMessage: 'Come visit us at Pizzeria Senza Cipolla and discover the true taste of Italian tradition.',
      tagline: 'Creating authentic flavors, one pizza at a time'
    },
    fr: {
      title: '👨‍🍳 À Propos - Pizzeria Senza Cipolla',
      storyTitle: '🍕 Notre Histoire',
      paragraph1: 'Pizzeria Senza Cipolla est née d\'une passion pour la tradition italienne authentique et l\'expérience culinaire transmise à travers le temps. Depuis 14 ans, nous offrons de la pizza italienne préparée avec amour, des ingrédients frais et notre four à bois traditionnel.',
      paragraph2: 'Nos pizzas naissent d\'une passion profonde pour la tradition culinaire italienne. Seulement des ingrédients sélectionnés, seulement l\'authenticité made in Turin. 🍕 Situés au cœur de Turin, nous offrons une expérience artisanale et une passion pour la vraie pizza italienne.',
      quote: '🏪 Dans notre pizzeria vous pouvez trouver:',
      quoteAuthor: 'Un voyage à travers les saveurs, la tradition et l\'authenticité',
      servicesTitle: 'Dans notre pizzeria vous pouvez trouver:',
      services: [
        'Pizza italienne cuite au four à bois',
        'Ingrédients frais et de première qualité',
        'Pâte préparée quotidiennement avec levage naturel',
        'Service pour événements et fêtes personnalisé'
      ],
      stats: {
        years: 'Années d\'Expérience',
        customers: 'Clients Satisfaits',
        varieties: 'Variétés de Pizzas'
      },
      closingMessage: 'Venez nous rendre visite à Pizzeria Senza Cipolla et découvrez le vrai goût de la tradition italienne.',
      tagline: 'Créer des saveurs authentiques, une pizza à la fois'
    },
    ar: {
      title: 'حول بيتزيريا ريجينا 2000',
      storyTitle: 'قصتنا',
      paragraph1: 'ولدت بيتزيريا ريجينا 2000 من شغف بالتقاليد الإيطالية الأصيلة والخبرة الطهوية المتوارثة عبر الزمن. منذ عام 2000، نقدم البيتزا الإيطالية المحضرة بحب، مع مكونات طازجة وفرننا التقليدي الذي يعمل بالحطب.',
      paragraph2: 'بيتزاتنا تولد من شغف عميق بالتقاليد الطهوية الإيطالية. فقط مكونات مختارة، فقط أصالة صنع في تورين. 🍕 تقع في قلب تورين، نقدم خبرة حرفية وشغف بالبيتزا الإيطالية الأصيلة.',
      quote: '📍 اعثر علينا في وسط تورين – حيث تلتقي التقاليد الإيطالية بالضيافة البيدمونتية.',
      quoteAuthor: 'رحلة عبر النكهات والتقاليد والأصالة',
      servicesTitle: 'في بيتزيريتنا يمكنك أن تجد:',
      services: [
        'بيتزا إيطالية مطبوخة في فرن الحطب',
        'مكونات طازجة وعالية الجودة',
        'عجين محضر يومياً مع تخمير طبيعي',
        'خدمة للفعاليات والحفلات والتموين المخصص'
      ],
      stats: {
        years: 'سنوات الخبرة',
        customers: 'عملاء راضون',
        varieties: 'أنواع البيتزا'
      },
      closingMessage: 'تعال لزيارتنا في بيتزيريا ريجينا 2000 واكتشف الطعم الحقيقي للتقاليد الإيطالية.',
      tagline: 'نخلق نكهات أصيلة، بيتزا واحدة في كل مرة'
    },
    fa: {
      title: 'درباره پیتزریا رجینا 2000',
      storyTitle: 'داستان ما',
      paragraph1: 'پیتزریا رجینا 2000 از عشق به سنت‌های اصیل ایتالیایی و تجربه آشپزی که در طول زمان منتقل شده، متولد شد. از سال 2000، ما پیتزای ایتالیایی تهیه شده با عشق، مواد تازه و کوره سنتی هیزمی خود ارائه می‌دهیم.',
      paragraph2: 'پیتزاهای ما از عشق عمیق به سنت‌های آشپزی ایتالیایی متولد می‌شوند. فقط مواد انتخابی، فقط اصالت ساخت تورین. 🍕 واقع در قلب تورین، ما تجربه صنعتگری و عشق به پیتزای اصیل ایتالیایی ارائه می‌دهیم.',
      quote: '📍 ما را در مرکز تورین پیدا کنید – جایی که سنت ایتالیایی با مهمان‌نوازی پیدمونتی ملاقات می‌کند.',
      quoteAuthor: 'سفری در میان طعم‌ها، سنت و اصالت',
      servicesTitle: 'در پیتزریای ما می‌توانید پیدا کنید:',
      services: [
        'پیتزای ایتالیایی پخته شده در کوره هیزمی',
        'مواد تازه و با کیفیت بالا',
        'خمیر تهیه شده روزانه با تخمیر طبیعی',
        'خدمات برای رویدادها، جشن‌ها و کترینگ شخصی‌سازی شده'
      ],
      stats: {
        years: 'سال تجربه',
        customers: 'مشتریان راضی',
        varieties: 'انواع پیتزا'
      },
      closingMessage: 'برای دیدن ما به پیتزریا سنزا چیپولا بیایید و طعم واقعی سنت ایتالیایی را کشف کنید.',
      tagline: 'خلق طعم‌های اصیل، یک پیتزا در هر زمان'
    }
  };

  // Use database content if available, otherwise fallback to hardcoded content
  const currentContent = chiSiamoContent
    ? (chiSiamoContent[language] || chiSiamoContent.it)
    : (content[language] || content.it);

  // Create background style with cache busting
  const backgroundImageUrl = chiSiamoContent?.backgroundImage ?
    `${chiSiamoContent.backgroundImage}${chiSiamoContent.backgroundImage.includes('?') ? '&' : '?'}t=${imageRefreshKey}` :
    undefined;

  const sectionStyle = {
    backgroundImage: backgroundImageUrl ?
      `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${backgroundImageUrl}')` :
      undefined,
    backgroundSize: backgroundImageUrl ? 'cover' : undefined,
    backgroundPosition: backgroundImageUrl ? 'center' : undefined,
  };

  // Debug logging
  console.log('🔍 [About] Debug Info:');
  console.log('   - chiSiamoContent:', chiSiamoContent);
  console.log('   - chiSiamoContent?.backgroundImage:', chiSiamoContent?.backgroundImage);
  console.log('   - backgroundImageUrl:', backgroundImageUrl);
  console.log('   - Will use background image?', !!backgroundImageUrl);
  console.log('   - Section style:', sectionStyle);

  // Add manual refresh function to window for debugging
  React.useEffect(() => {
    (window as any).refreshAboutBackground = () => {
      console.log('🔄 [About] Manual background refresh triggered');
      setImageRefreshKey(Date.now());
    };
  }, []);

  return (
    <section
      id="about"
      className="py-20 timeout-bg-primary relative overflow-hidden"
    >
      {/* Basketball-themed background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-timeout-orange rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-timeout-orange-hover rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-timeout-orange-light rounded-full blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating basketball/pizza icons */}
      <div className="absolute top-20 right-20 timeout-text-accent/20 animate-float">
        <div className="text-4xl">🏀</div>
      </div>
      <div className="absolute bottom-20 left-20 timeout-text-accent/20 animate-float animation-delay-2000">
        <Pizza size={40} />
      </div>
      <div className="absolute top-1/3 left-10 timeout-text-accent/20 animate-float animation-delay-4000">
        <ChefHat size={30} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold timeout-text-primary timeout-heading mb-4">
            Chi Siamo
          </h2>
          <p className="text-lg timeout-text-accent">
            La nostra storia, la nostra passione per la pizza e il basket
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold timeout-text-primary mb-4">
                {currentContent?.title || "La pizzeria che non ti aspettavi!"}
              </h3>
              <div className="space-y-4 timeout-text-secondary text-lg leading-relaxed">
                <p>
                  {currentContent?.paragraph1 || "Time Out Pizza nasce dalla passione per due mondi apparentemente distanti: l'autentica pizza italiana e il basket americano."}
                </p>
                <p>
                  {currentContent?.paragraph2 || "La nostra missione è offrire pizze di altissima qualità con ingredienti freschi e genuini, in un ambiente unico che celebra le leggende del basket di tutti i tempi."}
                </p>
                {currentContent?.quote && (
                  <p>
                    {currentContent.quote}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 timeout-bg-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🏀</span>
                </div>
                <div>
                  <div className="timeout-text-primary font-bold">
                    {currentContent?.stats?.years || "Dal 2025"}
                  </div>
                  <div className="timeout-text-secondary text-sm">
                    {currentContent?.stats?.customers || "6 giorni su 7"}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Section */}
            {currentContent?.services && currentContent.services.length > 0 && (
              <div className="pt-6">
                <h4 className="text-lg font-semibold timeout-text-primary mb-4">
                  {currentContent?.servicesTitle || "I nostri servizi:"}
                </h4>
                <ul className="space-y-2">
                  {currentContent.services.map((service, index) => (
                    <li key={index} className="flex items-center gap-2 timeout-text-secondary">
                      <span className="text-timeout-orange">•</span>
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Closing Message */}
            {currentContent?.closingMessage && (
              <div className="pt-6 border-t border-timeout-orange/20">
                <p className="timeout-text-secondary italic">
                  {currentContent.closingMessage}
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Image Carousel */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-timeout-secondary">
              {/* Main Image Container */}
              <div className="aspect-[4/3] relative">
                {chiSiamoImage.image ? (
                  <img
                    src={`${chiSiamoImage.image}${chiSiamoImage.image.includes('?') ? '&' : '?'}t=${imageRefreshKey}`}
                    alt={chiSiamoImage.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ [About] Chi Siamo image failed to load:', chiSiamoImage.image);
                      // Fallback to basketball court image
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                    }}
                    onLoad={() => {
                      console.log('✅ [About] Chi Siamo image loaded successfully:', chiSiamoImage.image);
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-timeout-dark-gray to-timeout-medium-gray flex items-center justify-center">
                    <div className="text-center timeout-text-secondary">
                      <div className="text-6xl mb-4">🏀</div>
                      <p className="text-lg">Il Nostro Ristorante</p>
                      <p className="text-sm mt-2">Dove la pizza incontra il basket</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Navigation Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 bg-timeout-orange rounded-full"></div>
                <div className="w-2 h-2 bg-timeout-light-gray rounded-full"></div>
                <div className="w-2 h-2 bg-timeout-light-gray rounded-full"></div>
              </div>

              {/* Navigation Arrows */}
              <button className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <span className="text-lg">‹</span>
              </button>
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <span className="text-lg">›</span>
              </button>
            </div>

            {/* Bottom Info Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
              <h4 className="text-white font-bold text-lg mb-2">Il Nostro Ristorante</h4>
              <p className="text-white/90 text-sm">
                Dove accogliamo i nostri clienti con la passione per la pizza e il basket
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
