import React, { createContext, useContext, useEffect, ReactNode } from 'react';

const ThemeContext = createContext<undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={undefined}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return { theme: 'dark' as const };
}
