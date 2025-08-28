
import React, { useEffect, useState, useMemo } from "react";
import { GalleryImage as GalleryImageType } from "@/types/gallery";
import GalleryImage from "./GalleryImage";

interface DesktopGalleryViewProps {
  images: GalleryImageType[];
  lastUpdated: number;
}

const DesktopGalleryView: React.FC<DesktopGalleryViewProps> = ({ 
  images,
  lastUpdated
}) => {
  // Log images for debugging
  useEffect(() => {
    console.log("DesktopGalleryView - Images received:", images?.length || 0);
    if (images?.length > 0) {
      console.log("DesktopGalleryView - First image:", images[0].id,
        images[0].src ? images[0].src.substring(0, 50) + "..." : "No src");
    }
  }, [images]);
  
  // Generate a unique key for forcing re-renders when needed
  const gridKey = useMemo(() => `desktop-gallery-${lastUpdated}-${Date.now()}`, [lastUpdated]);
  
  // Ensure we always have valid images to display (no default images to prevent recreation)
  const safeImages = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) {
      return []; // Return empty array instead of default images
    }

    return images.filter(img => img && typeof img.src === 'string');
  }, [images]);
  
  // Handle image load events
  const handleImageLoad = () => {
    console.log("Desktop image loaded successfully");
  };

  return (
    <div className="hidden md:block relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" key={gridKey}>
        {safeImages.map((image, index) => (
          <div
            key={`${image.id}-${index}-${gridKey}`}
            className="transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl rounded-lg"
          >
            <GalleryImage
              src={image.src}
              alt={image.alt || "Gallery Image"}
              className="desktop-gallery-image"
              onLoad={handleImageLoad}
              onError={handleImageLoad} // Count errors as loaded to avoid infinite loading state
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(DesktopGalleryView);
