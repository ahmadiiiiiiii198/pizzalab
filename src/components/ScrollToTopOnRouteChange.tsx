import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';

/**
 * Component that automatically scrolls to top when route changes
 * Should be placed inside BrowserRouter but outside Routes
 */
const ScrollToTopOnRouteChange = () => {
  const location = useLocation();
  const { scrollToTop } = useScrollToTop();

  useEffect(() => {
    // Scroll to top when route changes
    scrollToTop('instant'); // Use instant for route changes to avoid animation conflicts
  }, [location.pathname, scrollToTop]);

  return null; // This component doesn't render anything
};

export default ScrollToTopOnRouteChange;
