
import React from "react";
import PatternDivider from "./PatternDivider";
import { Images, RefreshCw } from "lucide-react";
import MobileGalleryView from "./gallery/MobileGalleryView";
import DesktopGalleryView from "./gallery/DesktopGalleryView";
import { useGalleryData } from "@/hooks/use-gallery-data";
import { Button } from "@/components/ui/button";
import VideoBackground from "./VideoBackground";

const Gallery = () => {
  // Use the improved gallery data hook
  const {
    galleryContent,
    images,
    isLoading,
    error,
    lastUpdated,
    refreshGalleryData
  } = useGalleryData();

  // Debug logging
  console.log('🎨 [Gallery] Component state:', {
    imagesCount: images?.length || 0,
    isLoading,
    error,
    lastUpdated
  });

  if (images?.length > 0) {
    console.log('🎨 [Gallery] First image:', images[0]);
  }

  // Convert lastUpdated to a timestamp for props
  const lastUpdatedTimestamp = lastUpdated instanceof Date ? lastUpdated.getTime() : 0;

  // Create section style with background image if available
  const sectionStyle = galleryContent.backgroundImage
    ? {
        backgroundImage: `url(${galleryContent.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <div
      className="py-24 relative"
      style={sectionStyle}
    >
      {/* Background overlay when using custom background */}
      {galleryContent.backgroundImage && (
        <div className="absolute inset-0 bg-black/30"></div>
      )}

      {/* Video background when no custom background */}
      {!galleryContent.backgroundImage && (
        <VideoBackground
          videoSrc="/video_preview_h264.mp4"
          className="absolute inset-0"
          overlay={true}
          overlayOpacity={0.2}
          overlayColor="rgba(0, 0, 0, 0.3)"
        />
      )}
      <section id="gallery" className="relative">
        {/* Pizza-themed background decorations */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pizza-red rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pizza-orange rounded-full blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pizza-green rounded-full blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        {/* Floating pizza icons */}
        <div className="absolute top-20 right-20 text-pizza-orange/20 animate-float">
          <Images size={40} />
        </div>
        <div className="absolute bottom-20 left-20 text-pizza-red/20 animate-float animation-delay-2000">
          <Images size={30} />
        </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl md:text-5xl text-center font-fredoka font-bold mb-4 text-pizza-dark animate-on-scroll" data-animation-id="gallery-heading">
          📸 <span className="text-pizza-orange">{galleryContent.heading || "La Nostra Galleria"}</span>
        </h2>
        {galleryContent.subheading && (
          <p className="text-center text-pizza-brown mb-8 max-w-3xl mx-auto font-roboto text-lg animate-on-scroll" data-animation-id="gallery-subheading">
            {galleryContent.subheading}
          </p>
        )}

        <PatternDivider />

        <div className="flex items-center justify-center mb-10">
          <div className="bg-gradient-to-r from-pizza-red to-pizza-orange text-white px-6 py-4 rounded-full flex items-center shadow-lg animate-on-scroll" data-animation-id="gallery-label">
            <Images className="text-pizza-cream mr-3" size={24} />
            <span className="font-pacifico text-lg">Vivi l'Esperienza Regina 2000</span>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-persian-gold"></div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 px-4 bg-red-50 rounded-lg mb-8">
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={refreshGalleryData}
              variant="outline" 
              className="mt-4 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry loading
            </Button>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            {images && images.length > 0 ? (
              <>
                {/* Mobile gallery view */}
                <MobileGalleryView
                  images={images}
                  lastUpdated={lastUpdatedTimestamp}
                  onRefresh={refreshGalleryData}
                />

                {/* Desktop gallery view */}
                <DesktopGalleryView
                  images={images}
                  lastUpdated={lastUpdatedTimestamp}
                />

                <div className="hidden md:flex mt-6 justify-center">
                  <Button
                    onClick={refreshGalleryData}
                    variant="outline"
                    className="bg-transparent hover:bg-persian-gold/5 text-persian-navy hover:text-persian-gold border-persian-gold/20 hover:border-persian-gold/40 transition-all animate-on-scroll flex items-center gap-2"
                    data-animation-id="gallery-refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh gallery images
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Images size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg">No gallery images available</p>
                  <p className="text-sm">Images will appear here once they are uploaded.</p>
                </div>
                <Button
                  onClick={refreshGalleryData}
                  variant="outline"
                  className="mt-4 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh gallery
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      </section>
    </div>
  );
};

export default Gallery;
