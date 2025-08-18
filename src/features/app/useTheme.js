import { useState, useEffect, useCallback } from 'react';

export default function useTheme(initial = 'light') {
  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}