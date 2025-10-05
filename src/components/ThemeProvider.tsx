import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light';
  setTheme: (theme: 'light') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light'>('light');

  useEffect(() => {
    // Force light theme
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    // Set CSS custom properties for light theme
    const root = document.documentElement;
    root.style.setProperty('--theme-background', '#fefefe');
    root.style.setProperty('--theme-foreground', '#1f2937');
    root.style.setProperty('--theme-primary', '#ff6b35');
    root.style.setProperty('--theme-secondary', '#6b7280');
    root.style.setProperty('--theme-accent', '#fef3c7');
    root.style.setProperty('--theme-border', '#e5e7eb');
    root.style.setProperty('--theme-card', '#ffffff');
    
    // Override any dark theme styles
    document.body.style.backgroundColor = '#fefefe';
    document.body.style.color = '#1f2937';
  }, []);

  const value = {
    theme,
    setTheme: () => {
      // Always keep light theme
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="light-theme-wrapper">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
