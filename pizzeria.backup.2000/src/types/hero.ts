/**
 * TypeScript type definitions for Hero Content
 */

export interface HeroContent {
  // New Flegrea-style fields
  welcomeMessage?: string;
  pizzaType?: string;
  subtitle?: string;
  openingHours?: string;
  buttonText?: string;

  // Font styling options
  welcomeMessageFont?: string;
  pizzaTypeFont?: string;
  subtitleFont?: string;

  // Legacy fields (for backward compatibility)
  heading?: string;
  subheading?: string;

  // Image fields
  backgroundImage?: string;
  heroImage?: string;
}

export interface HeroContentDefaults {
  welcomeMessage: string;
  pizzaType: string;
  subtitle: string;
  openingHours: string;
  buttonText: string;
  welcomeMessageFont: string;
  pizzaTypeFont: string;
  subtitleFont: string;
  heading: string;
  subheading: string;
  backgroundImage: string;
  heroImage: string;
}
