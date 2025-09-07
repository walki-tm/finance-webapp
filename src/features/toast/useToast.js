/**
 * 📄 USE TOAST HOOK: Hook per gestire toast notifications
 * 
 * 🎯 Scopo: Hook semplificato per mostrare notifiche toast all'utente
 * 
 * 📝 Note:
 * - Implementazione semplice per ora
 * - In futuro potrà essere esteso con un sistema di toast completo
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { useCallback } from 'react'

export function useToast() {
  const showToast = useCallback((message, type = 'info') => {
    // Per ora usiamo alert semplice per feedback immediato
    if (type === 'error') {
      alert(`❌ ${message}`)
    }
    // In futuro qui potremo aggiungere la logica per mostrare un toast system completo
  }, [])

  return { showToast }
}
