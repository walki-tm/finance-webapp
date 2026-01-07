import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function useTheme() {
  const { user, token, updateUser } = useAuth();
  
  // Inizializza col tema dell'utente dal DB, oppure 'light' come default
  const [theme, setTheme] = useState(user?.theme || 'light');

  // Aggiorna il tema quando cambia l'utente loggato
  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user?.theme]);

  // Applica la classe dark al documento
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Salva nel database e aggiorna context
    if (token) {
      try {
        await api.updateTheme(token, newTheme);
        // Aggiorna user nel context (che a sua volta aggiorna localStorage)
        updateUser({ theme: newTheme });
      } catch (error) {
        console.error('Errore salvataggio tema:', error);
        // Rollback in caso di errore
        setTheme(theme);
      }
    }
  }, [theme, token, updateUser]);

  return { theme, setTheme, toggleTheme };
}
