import React from 'react';

interface SmokeBackgroundProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

const SmokeBackground: React.FC<SmokeBackgroundProps> = ({ 
  children, 
  intensity = 'medium',
  className = '' 
}) => {
  const getParticleCount = () => {
    switch (intensity) {
      case 'light': return 3;
      case 'medium': return 6;
      case 'heavy': return 9;
      default: return 6;
    }
  };

  const getOpacityMultiplier = () => {
    switch (intensity) {
      case 'light': return 0.5;
      case 'medium': return 1;
      case 'heavy': return 1.5;
      default: return 1;
    }
  };

  const particleCount = getParticleCount();
  const opacityMultiplier = getOpacityMultiplier();

  return (
    <div className={`smoke-background ${className}`}>
      {/* Atmospheric smoke particles */}
      {Array.from({ length: particleCount }, (_, index) => (
        <div
          key={index}
          className={`smoke-particle smoke-particle-${(index % 6) + 1}`}
          style={{
            opacity: opacityMultiplier * 0.1,
            animationDelay: `${-index * 3}s`,
          }}
        />
      ))}
      
      {/* Content with higher z-index */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SmokeBackground;
