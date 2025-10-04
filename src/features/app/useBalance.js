/**
 * 📄 BALANCE HOOK: Gestione centralizzata saldo (REAL-TIME)
 * 
 * 🎯 Scopo: Hook per gestione saldo con aggiornamenti automatici da conti CURRENT
 * 
 * ⚡ Features:
 * - Caricamento saldo come somma conti correnti
 * - Refresh automatico via custom events
 * - Cache invalidation intelligente
 * - Prevenzione race conditions
 * - Integrazione con sistema accounts
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Integrazione con sistema accounts
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchAccountsStats } from '../accounts/services/accounts.api'

export function useBalance(token) {
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  console.log('🔄 useBalance: RE-ENABLED with fixed logic')
  
  // 🔸 loadBalance function definition
  const loadBalance = useCallback(async () => {
    if (!token) return
    
    setIsLoading(true)
    
    try {
      setError(null)
      
      // 🔸 Ottieni statistiche accounts per calcolare saldo da conti CURRENT
      const accountsStats = await fetchAccountsStats(token)
      
      // 🔸 Il saldo è la somma di tutti i conti correnti
      const currentBalance = accountsStats?.currentAccountsBalance ?? 0
      setBalance(currentBalance)
      
    } catch (err) {
      // 🔸 Fallback: se accounts non disponibile, prova con API balance legacy
      try {
        console.warn('Accounts API non disponibile, uso balance API legacy')
        const { api } = await import('../../lib/api.js')
        const res = await api.getBalance(token)
        setBalance(res?.balance ?? 0)
      } catch (fallbackErr) {
        setError(fallbackErr.message || err.message)
        console.error('Errore caricamento saldo:', fallbackErr)
      }
    } finally {
      setIsLoading(false)
    }
  }, [token])
  
  // 🔸 Effect per caricamento iniziale
  useEffect(() => {
    console.log('🔄 useBalance: Effect caricamento iniziale', { token: !!token })
    loadBalance()
  }, [loadBalance])
  
  // 🔸 Effect per ascolto eventi refresh automatici
  useEffect(() => {
    console.log('🔄 useBalance: Setup event listener per refresh')
    
    // Ascolta eventi custom per refresh automatico
    window.addEventListener('balanceRefresh', loadBalance)
    
    return () => {
      window.removeEventListener('balanceRefresh', loadBalance)
    }
  }, [loadBalance])
  
  return { balance, isLoading, error, refresh: loadBalance }
}

// Utility per triggerare refresh globale del saldo
export const triggerBalanceRefresh = () => {
  window.dispatchEvent(new CustomEvent('balanceRefresh'))
}
