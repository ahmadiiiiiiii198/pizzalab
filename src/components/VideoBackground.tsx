import React, { useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  children: React.ReactNode;
  videoSrc: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  children,
  videoSrc,
  className = '',
  overlay = true,
  overlayOpacity = 0.7,
  overlayColor = 'black'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Ensure video plays automatically and loops
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      
      // Try to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Video autoplay failed:', error);
        });
      }
    }
  }, []);

  return (
    <div
      className={`video-background relative overflow-hidden ${className}`}
      style={{
        isolation: 'isolate',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: -1,
          transform: 'translateZ(0)',
          willChange: 'transform',
          minWidth: '100%',
          minHeight: '100%',
          imageRendering: 'crisp-edges',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)',
          filter: 'none'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
      </video>

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity
          }}
        ></div>
      )}

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

export default VideoBackground;
