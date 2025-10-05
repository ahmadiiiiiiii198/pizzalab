import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw, Type } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useHeroContent } from '@/hooks/use-settings';
import type { HeroContent } from '@/types/hero';

const HeroContentEditor = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [heroContent, updateHeroContent, isLoading] = useHeroContent();

  // Available font options
  const fontOptions = [
    { value: 'inter', label: 'Inter (Clean & Modern)', preview: 'font-inter' },
    { value: 'montserrat', label: 'Montserrat (Bold & Strong)', preview: 'font-montserrat' },
    { value: 'pacifico', label: 'Pacifico (Handwritten)', preview: 'font-pacifico' },
    { value: 'playfair', label: 'Playfair Display (Elegant)', preview: 'font-playfair' },
    { value: 'dancing', label: 'Dancing Script (Cursive)', preview: 'font-dancing' },
    { value: 'fredoka', label: 'Fredoka One (Playful)', preview: 'font-fredoka' },
    { value: 'roboto', label: 'Roboto (Professional)', preview: 'font-roboto' },
    { value: 'crimson', label: 'Crimson Text (Classic)', preview: 'font-crimson' }
  ];
  const [localContent, setLocalContent] = useState({
    welcomeMessage: 'BENVENUTI DA PIZZALAB',
    pizzaType: 'la Pizza Innovativa',
    subtitle: 'Ingredienti Freschi e Tecniche Moderne!',
    openingHours: 'APERTO 7 SU 7 DALLE 18',
    buttonText: 'ORDINA ORA',
    welcomeMessageFont: 'montserrat',
    pizzaTypeFont: 'pacifico',
    subtitleFont: 'inter',
    heading: '🍕 PIZZALAB PIZZERIA',
    subheading: 'Laboratorio di pizza italiana innovativa con ingredienti freschi e tecniche moderne',
    backgroundImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  });
  const { toast } = useToast();

  // Sync local content with hook data when it loads
  useEffect(() => {
    if (heroContent && !isLoading) {
      setLocalContent({
        welcomeMessage: heroContent.welcomeMessage || 'BENVENUTI DA FLEGREA',
        pizzaType: heroContent.pizzaType || 'la Pizza Napoletana',
        subtitle: heroContent.subtitle || 'ad Alta Digeribilità, anche Gluten Free!',
        openingHours: heroContent.openingHours || 'APERTO 7 SU 7 DALLE 19',
        buttonText: heroContent.buttonText || 'PRENOTA IL TUO TAVOLO',
        welcomeMessageFont: heroContent.welcomeMessageFont || 'montserrat',
        pizzaTypeFont: heroContent.pizzaTypeFont || 'pacifico',
        subtitleFont: heroContent.subtitleFont || 'inter',
        heading: heroContent.heading || '🍕 PIZZERIA Regina 2000',
        subheading: heroContent.subheading || 'Autentica pizza italiana preparata con ingredienti freschi e forno a legna tradizionale nel cuore di Torino',
        backgroundImage: heroContent.backgroundImage || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        heroImage: heroContent.heroImage || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      });
    }
  }, [heroContent, isLoading]);

  const handleSave = async () => {
    console.log('🔥 [HeroContentEditor] Save button clicked!');
    setIsSaving(true);
    console.log('🍕 HeroContentEditor: Starting save process...', localContent);
    console.log('🍕 HeroContentEditor: Has changes:', hasChanges);

    try {
      // Use the hook to save to database and localStorage
      console.log('🍕 HeroContentEditor: Calling updateHeroContent...');
      const success = await updateHeroContent(localContent);
      console.log('🍕 HeroContentEditor: Save result:', success);

      if (success) {
        // Trigger a custom event to notify other components
        console.log('🍕 HeroContentEditor: Triggering heroContentUpdated event...');
        window.dispatchEvent(new CustomEvent('heroContentUpdated', {
          detail: localContent
        }));

        // Force a page refresh to ensure changes are visible
        console.log('🍕 HeroContentEditor: Triggering page refresh...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        toast({
          title: '🍕 Successo!',
          description: hasChanges
            ? 'Contenuto hero aggiornato con successo per la pizzeria!'
            : 'Stato corrente salvato con successo! La pagina si ricaricherà per mostrare le modifiche.',
        });

        console.log('🍕 HeroContentEditor: Save completed successfully');
      } else {
        throw new Error('Failed to save hero content');
      }
    } catch (error) {
      console.error('🍕 HeroContentEditor: Error saving hero content:', error);
      toast({
        title: '❌ Errore',
        description: 'Impossibile salvare il contenuto hero. Riprova.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (heroContent) {
      setLocalContent({
        welcomeMessage: heroContent.welcomeMessage || 'BENVENUTI DA FLEGREA',
        pizzaType: heroContent.pizzaType || 'la Pizza Napoletana',
        subtitle: heroContent.subtitle || 'ad Alta Digeribilità, anche Gluten Free!',
        openingHours: heroContent.openingHours || 'APERTO 7 SU 7 DALLE 19',
        buttonText: heroContent.buttonText || 'PRENOTA IL TUO TAVOLO',
        welcomeMessageFont: heroContent.welcomeMessageFont || 'montserrat',
        pizzaTypeFont: heroContent.pizzaTypeFont || 'pacifico',
        subtitleFont: heroContent.subtitleFont || 'inter',
        heading: heroContent.heading || 'PIZZALAB - Laboratorio di Pizza Italiana',
        subheading: heroContent.subheading || 'Autentica pizza italiana preparata con ingredienti freschi e forno a legna tradizionale nel cuore di Torino',
        backgroundImage: heroContent.backgroundImage || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        heroImage: heroContent.heroImage || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      });
    }
  };

  const updateWelcomeMessage = (value: string) => {
    setLocalContent(prev => ({ ...prev, welcomeMessage: value }));
  };

  const updatePizzaType = (value: string) => {
    setLocalContent(prev => ({ ...prev, pizzaType: value }));
  };

  const updateSubtitle = (value: string) => {
    setLocalContent(prev => ({ ...prev, subtitle: value }));
  };

  const updateOpeningHours = (value: string) => {
    setLocalContent(prev => ({ ...prev, openingHours: value }));
  };

  const updateButtonText = (value: string) => {
    setLocalContent(prev => ({ ...prev, buttonText: value }));
  };

  const updateWelcomeMessageFont = (value: string) => {
    setLocalContent(prev => ({ ...prev, welcomeMessageFont: value }));
  };

  const updatePizzaTypeFont = (value: string) => {
    setLocalContent(prev => ({ ...prev, pizzaTypeFont: value }));
  };

  const updateSubtitleFont = (value: string) => {
    setLocalContent(prev => ({ ...prev, subtitleFont: value }));
  };

  const updateHeading = (value: string) => {
    setLocalContent(prev => ({ ...prev, heading: value }));
  };

  const updateSubheading = (value: string) => {
    setLocalContent(prev => ({ ...prev, subheading: value }));
  };

  const updateBackgroundImage = (imageUrl: string) => {
    console.log('🖼️ HeroContentEditor: Background image updated:', imageUrl);
    setLocalContent(prev => ({ ...prev, backgroundImage: imageUrl }));
  };



  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const hasChanges =
    localContent.welcomeMessage !== (heroContent?.welcomeMessage || '') ||
    localContent.pizzaType !== (heroContent?.pizzaType || '') ||
    localContent.subtitle !== (heroContent?.subtitle || '') ||
    localContent.openingHours !== (heroContent?.openingHours || '') ||
    localContent.buttonText !== (heroContent?.buttonText || '') ||
    localContent.welcomeMessageFont !== (heroContent?.welcomeMessageFont || '') ||
    localContent.pizzaTypeFont !== (heroContent?.pizzaTypeFont || '') ||
    localContent.subtitleFont !== (heroContent?.subtitleFont || '') ||
    localContent.heading !== (heroContent?.heading || '') ||
    localContent.subheading !== (heroContent?.subheading || '') ||
    localContent.backgroundImage !== (heroContent?.backgroundImage || '') ||
    localContent.heroImage !== (heroContent?.heroImage || '');

  // Debug logging for hasChanges
  console.log('🔍 [HeroContentEditor] Debug hasChanges:', {
    hasChanges,
    localContent,
    heroContent,
    comparisons: {
      welcomeMessage: `"${localContent.welcomeMessage}" !== "${heroContent?.welcomeMessage || ''}"`,
      pizzaType: `"${localContent.pizzaType}" !== "${heroContent?.pizzaType || ''}"`,
      subtitle: `"${localContent.subtitle}" !== "${heroContent?.subtitle || ''}"`,
      openingHours: `"${localContent.openingHours}" !== "${heroContent?.openingHours || ''}"`,
      buttonText: `"${localContent.buttonText}" !== "${heroContent?.buttonText || ''}"`,
      welcomeMessageFont: `"${localContent.welcomeMessageFont}" !== "${heroContent?.welcomeMessageFont || ''}"`,
      pizzaTypeFont: `"${localContent.pizzaTypeFont}" !== "${heroContent?.pizzaTypeFont || ''}"`,
      subtitleFont: `"${localContent.subtitleFont}" !== "${heroContent?.subtitleFont || ''}"`,
      heading: `"${localContent.heading}" !== "${heroContent?.heading || ''}"`,
      subheading: `"${localContent.subheading}" !== "${heroContent?.subheading || ''}"`,
      backgroundImage: `"${localContent.backgroundImage}" !== "${heroContent?.backgroundImage || ''}"`,
      heroImage: `"${localContent.heroImage}" !== "${heroContent?.heroImage || ''}"`
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Hero Section Editor
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={!hasChanges || isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              variant={hasChanges ? "default" : "secondary"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {hasChanges ? "Save Changes" : "Save Current State"}
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Hero Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Welcome Message</label>
            <Input
              value={localContent.welcomeMessage}
              onChange={(e) => updateWelcomeMessage(e.target.value)}
              placeholder="e.g., BENVENUTI DA FLEGREA"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Main welcome text at the top</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pizza Type</label>
            <Input
              value={localContent.pizzaType}
              onChange={(e) => updatePizzaType(e.target.value)}
              placeholder="e.g., la Pizza Napoletana"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Large elegant script text</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subtitle</label>
          <Input
            value={localContent.subtitle}
            onChange={(e) => updateSubtitle(e.target.value)}
            placeholder="e.g., ad Alta Digeribilità, anche Gluten Free!"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Descriptive subtitle below pizza type</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Opening Hours</label>
            <Input
              value={localContent.openingHours}
              onChange={(e) => updateOpeningHours(e.target.value)}
              placeholder="e.g., APERTO 7 SU 7 DALLE 19"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Hours display in card format</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Button Text</label>
            <Input
              value={localContent.buttonText}
              onChange={(e) => updateButtonText(e.target.value)}
              placeholder="e.g., PRENOTA IL TUO TAVOLO"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Main call-to-action button</p>
          </div>
        </div>

        {/* Font Selection Section */}
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Font Styling</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Welcome Message Font</label>
              <Select
                value={localContent.welcomeMessageFont}
                onValueChange={updateWelcomeMessageFont}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span className={font.preview}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Font for main welcome text</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pizza Type Font</label>
              <Select
                value={localContent.pizzaTypeFont}
                onValueChange={updatePizzaTypeFont}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span className={font.preview}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Font for pizza type text</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtitle Font</label>
              <Select
                value={localContent.subtitleFont}
                onValueChange={updateSubtitleFont}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span className={font.preview}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Font for subtitle text</p>
            </div>
          </div>

          {/* Font Preview Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Font Preview:</h4>
            <div className="space-y-3">
              <div className={`text-2xl font-bold ${fontOptions.find(f => f.value === localContent.welcomeMessageFont)?.preview || 'font-montserrat'}`}>
                {localContent.welcomeMessage}
              </div>
              <div className={`text-3xl italic ${fontOptions.find(f => f.value === localContent.pizzaTypeFont)?.preview || 'font-pacifico'}`}>
                {localContent.pizzaType}
              </div>
              <div className={`text-lg ${fontOptions.find(f => f.value === localContent.subtitleFont)?.preview || 'font-inter'}`}>
                {localContent.subtitle}
              </div>
            </div>
          </div>
        </div>

        {/* Legacy Fields (for backward compatibility) */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 text-gray-600">Legacy Fields (Optional)</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Legacy Heading</label>
              <Input
                value={localContent.heading}
                onChange={(e) => updateHeading(e.target.value)}
                placeholder="Legacy heading field"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Legacy Subheading</label>
              <Textarea
                value={localContent.subheading}
                onChange={(e) => updateSubheading(e.target.value)}
                placeholder="Legacy subheading field"
                className="w-full"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Background Video</label>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Local Video Active</span>
            </div>
            <p className="text-sm text-green-700 mb-2">
              <strong>Current:</strong> 20250525_141332.mp4
            </p>
            <p className="text-xs text-green-600">
              ✅ Using local video file to save database storage space. Video is served from the public folder.
              If the video fails to load, it will automatically fallback to the background image below.
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Fallback Background Image</label>
            <ImageUploader
              currentImage={localContent.backgroundImage}
              onImageSelected={updateBackgroundImage}
              bucketName="uploads"
              folderPath="hero-backgrounds"
              buttonLabel="Upload Fallback Image"
            />
            <p className="text-xs text-gray-500 mt-2">
              This image will be used as a fallback if the video fails to load. Recommended size: 2000x1000px or larger.
            </p>
          </div>
        </div>

        {/* Hero Image section removed - now using only background image */}

        {/* Preview Section */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-3">Preview</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500">Welcome Message:</span>
                <p className="font-bold text-lg">{localContent.welcomeMessage || 'No welcome message set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Pizza Type:</span>
                <p className="font-serif italic text-xl text-yellow-600">{localContent.pizzaType || 'No pizza type set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Subtitle:</span>
                <p className="text-sm">{localContent.subtitle || 'No subtitle set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Opening Hours:</span>
                <p className="font-medium">{localContent.openingHours || 'No opening hours set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Button Text:</span>
                <p className="bg-red-500 text-white px-3 py-1 rounded inline-block text-sm font-bold">{localContent.buttonText || 'No button text set'}</p>
              </div>
              <div className="border-t pt-2">
                <span className="text-xs text-gray-400">Legacy Heading:</span>
                <p className="text-sm text-gray-600">{localContent.heading || 'No legacy heading set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Legacy Subheading:</span>
                <p className="text-xs text-gray-600">{localContent.subheading || 'No legacy subheading set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Background:</span>
                <div className="mt-2 space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium text-blue-800">Video Background</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">20250509_211620.mp4</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">Fallback Image:</span>
                    {localContent.backgroundImage ? (
                      <div className="mt-1">
                        <img
                          src={localContent.backgroundImage}
                          alt="Fallback background preview"
                          className="w-full h-16 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No fallback image set</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Hero Image (Right Side):</span>
                {localContent.heroImage ? (
                  <div className="mt-2">
                    <img
                      src={localContent.heroImage}
                      alt="Hero image preview"
                      className="w-full h-24 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No hero image set</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`border rounded-lg p-3 ${hasChanges ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-sm ${hasChanges ? 'text-yellow-800' : 'text-blue-800'}`}>
            {hasChanges ? (
              <>⚠️ You have unsaved changes. Click "Save Changes" to apply them to your website.</>
            ) : (
              <>ℹ️ No changes detected. You can still save the current state to ensure data consistency.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroContentEditor;
