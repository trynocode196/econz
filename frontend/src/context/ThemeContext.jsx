import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const COLOR_THEMES = [
  { id: 'indigo', name: 'Indigo', hex: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
  { id: 'orange', name: 'Orange', hex: '#f97316', light: '#fb923c', dark: '#ea580c' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', light: '#34d399', dark: '#059669' },
  { id: 'violet', name: 'Violet', hex: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e', light: '#fb7185', dark: '#e11d48' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
];

export function ThemeProvider({ children }) {
  // Default to dark mode; respect saved preference if it exists
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // dark by default
  });

  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem('colorTheme') || 'orange';
  });

  const [customAccent, setCustomAccent] = useState(() => {
    return localStorage.getItem('customAccent') || '#f97316';
  });

  const [uiScale, setUiScale] = useState(() => {
    const saved = localStorage.getItem('uiScale');
    return saved ? parseInt(saved, 10) : 85; // 85% default compact scale
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('colorTheme', colorTheme);
    let primaryHex = '#f97316';
    let lightHex = '#fb923c';
    let darkHex = '#ea580c';

    if (colorTheme === 'custom') {
      primaryHex = customAccent;
      lightHex = customAccent;
      darkHex = customAccent;
      localStorage.setItem('customAccent', customAccent);
    } else {
      const match = COLOR_THEMES.find(t => t.id === colorTheme);
      if (match) {
        primaryHex = match.hex;
        lightHex = match.light;
        darkHex = match.dark;
      }
    }

    // Update CSS root variables
    const root = document.documentElement;
    root.style.setProperty('--brand-500', primaryHex);
    root.style.setProperty('--brand-600', darkHex);
    root.style.setProperty('--brand-400', lightHex);
    root.style.setProperty('--brand-300', lightHex);
    root.style.setProperty('--brand-200', lightHex);
    root.style.setProperty('--brand-50', `${primaryHex}15`);
    root.style.setProperty('--brand-100', `${primaryHex}25`);
    root.style.setProperty('--text-accent', primaryHex);
    root.style.setProperty('--app-accent', primaryHex);
    root.style.setProperty('--sidebar-text-active', lightHex);
  }, [colorTheme, customAccent]);

  useEffect(() => {
    localStorage.setItem('uiScale', uiScale.toString());
    // Remove document zoom to eliminate bottom white gap
    document.documentElement.style.zoom = '';
    // Scale font size
    const scaleRatio = uiScale / 100;
    document.documentElement.style.fontSize = `${scaleRatio * 16}px`;
  }, [uiScale]);

  const toggle = () => setDark(d => !d);
  const setMode = (mode) => setDark(mode === 'dark');

  return (
    <ThemeContext.Provider value={{ 
      dark, 
      toggle, 
      setMode,
      colorTheme, 
      setColorTheme, 
      customAccent, 
      setCustomAccent, 
      uiScale, 
      setUiScale 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
