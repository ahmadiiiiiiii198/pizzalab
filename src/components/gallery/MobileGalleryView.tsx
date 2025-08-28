
import React, { useState, useEffect, useMemo } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryImage as GalleryImageType } from "@/types/gallery";
import GalleryImage from "./GalleryImage";

interface MobileGalleryViewProps {
  images: GalleryImageType[];
  lastUpdated: number;
  onRefresh?: () => void;
}

const MobileGalleryView: React.FC<MobileGalleryViewProps> = ({ 
  images, 
  lastUpdated,
  onRefresh 
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [key, setKey] = useState(`mobile-gallery-${lastUpdated}`);

  // Log incoming data for debugging
  useEffect(() => {
    console.log("MobileGalleryView - Images received:", images?.length || 0);
    if (images?.length > 0) {
      console.log("MobileGalleryView - First image:", images[0].id,
        images[0].src ? images[0].src.substring(0, 50) + "..." : "No src");
    }

    // Reset key when images or lastUpdated changes
    setKey(`mobile-gallery-${lastUpdated}-${Date.now()}`);
  }, [images, lastUpdated]);
  
  // Ensure we always have validated images to display (no default images to prevent recreation)
  const safeImages = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) {
      return []; // Return empty array instead of default images
    }

    return images.filter(img => img && typeof img.src === 'string');
  }, [images]);
  
  const handleRefresh = () => {
    if (onRefresh) {
      console.log("MobileGalleryView - Refresh requested");
      setLoadError(null);
      setKey(`mobile-gallery-refresh-${Date.now()}`);

      try {
        onRefresh();
      } catch (error) {
        console.error("Error refreshing gallery:", error);
        setLoadError("Failed to refresh gallery");
      }
    }
  };
  
  return (
    <div className="md:hidden mb-10 relative">
      {loadError && (
        <div className="text-center py-4 px-3 bg-red-50 rounded-lg mb-4">
          <p className="text-red-500">{loadError}</p>
        </div>
      )}

      <Carousel className="w-full" key={key}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {safeImages.map((image, index) => (
            <CarouselItem key={`${image.id}-${index}-${key}`} className="pl-2 md:pl-4">
              <div className="p-1">
                <GalleryImage
                  src={image.src}
                  alt={image.alt || "Gallery Image"}
                  className="mobile-gallery-image"
                  onLoad={() => console.log("Mobile image loaded:", image.src.substring(0, 30))}
                  onError={() => {
                    console.error("Failed to load image:", image.src);
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-6 mt-6">
          <CarouselPrevious className="static transform-none bg-pizza-orange/10 hover:bg-pizza-orange/20 border-pizza-orange/30 text-pizza-dark hover:text-pizza-orange mobile-gallery-nav h-12 w-12" />
          <CarouselNext className="static transform-none bg-pizza-orange/10 hover:bg-pizza-orange/20 border-pizza-orange/30 text-pizza-dark hover:text-pizza-orange mobile-gallery-nav h-12 w-12" />
        </div>
      </Carousel>
      
      <div className="mt-4 text-center">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2 border-persian-gold/20 text-persian-navy hover:bg-persian-gold/5 hover:text-persian-gold"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Gallery
        </Button>
      </div>
    </div>
  );
};

export default React.memo(MobileGalleryView);
