import { useCallback } from 'react';

/**
 * Custom hook for scroll-to-top functionality
 * Provides smooth scrolling to top of page or specific element
 */
export const useScrollToTop = () => {
  // Scroll to top of page
  const scrollToTop = useCallback((behavior: 'smooth' | 'instant' = 'smooth') => {
    window.scrollTo({
      top: 0,
      behavior
    });
  }, []);

  // Scroll to top of specific element (useful for modals, containers)
  const scrollToTopOfElement = useCallback((
    selector: string, 
    behavior: 'smooth' | 'instant' = 'smooth'
  ) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollTo({
        top: 0,
        behavior
      });
    }
  }, []);

  // Scroll to specific element on page
  const scrollToElement = useCallback((
    elementId: string, 
    behavior: 'smooth' | 'instant' = 'smooth',
    offset: number = 0
  ) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior
      });
    }
  }, []);

  // Scroll to top with delay (useful for state changes)
  const scrollToTopWithDelay = useCallback((
    delay: number = 100, 
    behavior: 'smooth' | 'instant' = 'smooth'
  ) => {
    setTimeout(() => scrollToTop(behavior), delay);
  }, [scrollToTop]);

  return {
    scrollToTop,
    scrollToTopOfElement,
    scrollToElement,
    scrollToTopWithDelay
  };
};

export default useScrollToTop;
