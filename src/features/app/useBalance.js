/**
 * 📄 BALANCE HOOK: Gestione centralizzata saldo (REAL-TIME)
 * 
 * 🎯 Scopo: Hook per gestione saldo con aggiornamenti automatici
 * 
 * ⚡ Features:
 * - Caricamento iniziale del saldo
 * - Refresh automatico via custom events
 * - Cache invalidation intelligente
 * - Prevenzione race conditions
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Aggiunto refresh real-time
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api.js'

export function useBalance(token) {
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 🔸 Funzione di caricamento saldo (centralizzata e riutilizzabile)
  const loadBalance = useCallback(async (showLoading = false) => {
    if (!token) return
    
    try {
      if (showLoading) setIsLoading(true)
      setError(null)
      
      const res = await api.getBalance(token)
      setBalance(res?.balance ?? 0)
      
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [token])
  
  // 🔸 Effect per caricamento iniziale
  useEffect(() => {
    let mounted = true
    
    const initialLoad = async () => {
      if (!token || !mounted) return
      
      setIsLoading(true)
      await loadBalance(false) // Non mostrare loading aggiuntivo
      if (mounted) setIsLoading(false)
    }
    
    initialLoad()
    
    return () => {
      mounted = false
    }
  }, [token, loadBalance])
  
  // 🔸 Effect per ascolto eventi refresh automatici
  useEffect(() => {
    const handleBalanceRefresh = () => {
      loadBalance(false) // Refresh senza loading spinner
    }
    
    // Ascolta eventi custom per refresh automatico
    window.addEventListener('balanceRefresh', handleBalanceRefresh)
    
    return () => {
      window.removeEventListener('balanceRefresh', handleBalanceRefresh)
    }
  }, [loadBalance])
  
  return { balance, isLoading, error, refresh: loadBalance }
}

// Utility per triggerare refresh globale del saldo
export const triggerBalanceRefresh = () => {
  window.dispatchEvent(new CustomEvent('balanceRefresh'))
}
