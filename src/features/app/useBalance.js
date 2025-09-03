/**
 * 📄 BALANCE HOOK: Gestione centralizzata saldo (SEMPLIFICATO)
 */

import { useState, useEffect } from 'react'
import { api } from '../../lib/api.js'

export function useBalance(token) {
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    let mounted = true
    
    async function loadBalance() {
      if (!token) return
      
      try {
        setIsLoading(true)
        const res = await api.getBalance(token)
        if (mounted) {
          setBalance(res?.balance ?? 0)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message)
          setIsLoading(false)
        }
      }
    }
    
    loadBalance()
    
    return () => {
      mounted = false
    }
  }, [token])
  
  return { balance, isLoading, error }
}

// Utility per triggerare refresh globale del saldo
export const triggerBalanceRefresh = () => {
  window.dispatchEvent(new CustomEvent('balanceRefresh'))
}
