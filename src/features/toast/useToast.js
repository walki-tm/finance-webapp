/**
 * 📄 USE TOAST HOOK: Hook per gestire toast notifications
 * 
 * 🎯 Scopo: Hook semplificato per mostrare notifiche toast all'utente
 * 
 * 📝 Note:
 * - Implementazione semplice con console.log per ora
 * - In futuro potrà essere esteso con un sistema di toast completo
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { useCallback } from 'react'

export function useToast() {
  const showToast = useCallback((message, type = 'info') => {
    // Per ora usiamo console.log, in futuro potremo implementare un toast system completo
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[type] || 'ℹ️'
    
    console.log(`${emoji} Toast ${type.toUpperCase()}: ${message}`)
    
    // In futuro qui potremo aggiungere la logica per mostrare un toast visuale
    // Per ora mostriamo un alert semplice per feedback immediato
    if (type === 'error') {
      alert(`❌ ${message}`)
    } else if (type === 'success') {
      // Non mostriamo alert per i successi per evitare troppi popup
      console.log(`✅ ${message}`)
    }
  }, [])

  return { showToast }
}
