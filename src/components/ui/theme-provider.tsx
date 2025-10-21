'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply theme on initial load to prevent flash
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const initialTheme = savedTheme || 'system';
    
    const root = document.documentElement;
    
    if (initialTheme === 'system') {
      // Remove data-theme attribute to use system preference
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', initialTheme);
    }
  }, []);

  return <>{children}</>;
}
