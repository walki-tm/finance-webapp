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
  
  // 🔸 Effect per caricamento iniziale - FIXED INLINE LOGIC
  useEffect(() => {
    console.log('🔄 useBalance: Effect caricamento iniziale', { token: !!token })
    let mounted = true
    
    const initialLoad = async () => {
      if (!token || !mounted) return
      
      setIsLoading(true)
      
      try {
        setError(null)
        
        // 🔸 Ottieni statistiche accounts per calcolare saldo da conti CURRENT
        const accountsStats = await fetchAccountsStats(token)
        
        // 🔸 Il saldo è la somma di tutti i conti correnti
        const currentBalance = accountsStats?.currentAccountsBalance ?? 0
        if (mounted) setBalance(currentBalance)
        
      } catch (err) {
        // 🔸 Fallback: se accounts non disponibile, prova con API balance legacy
        try {
          console.warn('Accounts API non disponibile, uso balance API legacy')
          const { api } = await import('../../lib/api.js')
          const res = await api.getBalance(token)
          if (mounted) setBalance(res?.balance ?? 0)
        } catch (fallbackErr) {
          if (mounted) {
            setError(fallbackErr.message || err.message)
            console.error('Errore caricamento saldo:', fallbackErr)
          }
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    
    initialLoad()
    
    return () => {
      mounted = false
    }
  }, [token]) // 🔧 FIX: Solo token come dipendenza, logica inline per evitare loop
  
  // 🔸 Effect per ascolto eventi refresh automatici - FIXED INLINE LOGIC
  useEffect(() => {
    console.log('🔄 useBalance: Setup event listener per refresh')
    let mounted = true
    
    const initialLoad = async () => {
      if (!token || !mounted) return
      
      setIsLoading(true)
      
      try {
        setError(null)
        
        // 🔸 Ottieni statistiche accounts per calcolare saldo da conti CURRENT
        const accountsStats = await fetchAccountsStats(token)
        
        // 🔸 Il saldo è la somma di tutti i conti correnti
        const currentBalance = accountsStats?.currentAccountsBalance ?? 0
        if (mounted) setBalance(currentBalance)
        
      } catch (err) {
        // 🔸 Fallback: se accounts non disponibile, prova con API balance legacy
        try {
          console.warn('Accounts API non disponibile, uso balance API legacy')
          const { api } = await import('../../lib/api.js')
          const res = await api.getBalance(token)
          if (mounted) setBalance(res?.balance ?? 0)
        } catch (fallbackErr) {
          if (mounted) {
            setError(fallbackErr.message || err.message)
            console.error('Errore caricamento saldo:', fallbackErr)
          }
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    
    initialLoad()
    
    return () => {
      mounted = false
    }
  }, [token]) // 🔧 FIX: Solo token come dipendenza, logica inline per evitare loop
  
  // 🔸 Effect per ascolto eventi refresh automatici
  useEffect(() => {
    console.log('🔄 useBalance: Setup event listener per refresh')
    const handleBalanceRefresh = async () => {
      console.log('🔄 useBalance: Ricevuto evento balanceRefresh')
      
      if (!token) return
      
      try {
        setError(null)
        const accountsStats = await fetchAccountsStats(token)
        const currentBalance = accountsStats?.currentAccountsBalance ?? 0
        setBalance(currentBalance)
      } catch (err) {
        try {
          const { api } = await import('../../lib/api.js')
          const res = await api.getBalance(token)
          setBalance(res?.balance ?? 0)
        } catch (fallbackErr) {
          setError(fallbackErr.message || err.message)
          console.error('Errore refresh saldo:', fallbackErr)
        }
      }
    }
    
    // Ascolta eventi custom per refresh automatico
    window.addEventListener('balanceRefresh', handleBalanceRefresh)
    
    return () => {
      window.removeEventListener('balanceRefresh', handleBalanceRefresh)
    }
  }, [token]) // 🔧 FIX: Solo token como dipendenza, logica inline
  
  return { balance, isLoading, error }
}

// Utility per triggerare refresh globale del saldo
export const triggerBalanceRefresh = () => {
  window.dispatchEvent(new CustomEvent('balanceRefresh'))
}
