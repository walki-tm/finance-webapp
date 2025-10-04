/**
 * 📄 USE ACCOUNTS HOOK: Custom hook per gestione state conti
 * 
 * 🎯 Scopo: Hook personalizzato per state management e operazioni CRUD sui conti
 * 
 * 🔧 Dipendenze principali:
 * - React hooks (useState, useEffect, useCallback)
 * - accounts API service per backend calls
 * - Toast notifications per feedback utente
 * 
 * 📝 Note:
 * - State management centralizzato per accounts
 * - Operazioni CRUD complete
 * - Loading states e error handling
 * - Cache e refresh automatico
 * - Integrazione toast notifications
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione hook useAccounts
 */

// 🔸 Import dependencies
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../toast'
import { triggerBalanceRefresh } from '../app/useBalance'
import {
  fetchAccounts,
  fetchAccountById,
  createAccount as apiCreateAccount,
  updateAccount as apiUpdateAccount,
  deleteAccount as apiDeleteAccount,
  fetchAccountsStats,
  recalculateAccountBalance as apiRecalculateBalance
} from './services/accounts.api'

/**
 * 🎯 HOOK: useAccounts - Gestione completa conti utente
 * 
 * @param {string} token - JWT token per autenticazione
 * @returns {Object} State e funzioni per gestione accounts
 */
export default function useAccounts(token) {
  // 🔸 State hooks
  const [accounts, setAccounts] = useState([])
  const [accountsStats, setAccountsStats] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  // 🔸 Toast notifications
  const { addToast } = useToast()

  /**
   * 🎯 FUNCTION: Carica tutti i conti dell'utente
   */
  const loadAccounts = useCallback(async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setError(null)
      
      const data = await fetchAccounts(token)
      setAccounts(data || [])
    } catch (err) {
      setError(err.message)
      addToast?.('Errore caricamento conti', 'error')
      console.error('Error loading accounts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [token, addToast])

  /**
   * 🎯 FUNCTION: Carica statistiche conti
   */
  const loadAccountsStats = useCallback(async () => {
    if (!token) return

    try {
      const stats = await fetchAccountsStats(token)
      setAccountsStats(stats)
    } catch (err) {
      console.error('Error loading accounts stats:', err)
      // Non mostriamo toast per statistiche, sono opzionali
    }
  }, [token])

  /**
   * 🎯 FUNCTION: Carica singolo conto per ID
   */
  const loadAccountById = useCallback(async (accountId) => {
    if (!token || !accountId) return

    try {
      const account = await fetchAccountById(accountId, token)
      setSelectedAccount(account)
      return account
    } catch (err) {
      addToast?.('Errore caricamento conto', 'error')
      console.error('Error loading account:', err)
      return null
    }
  }, [token, addToast])

  /**
   * 🎯 FUNCTION: Crea nuovo conto
   */
  const createAccount = useCallback(async (accountData) => {
    if (!token) return null

    try {
      setIsCreating(true)
      setError(null)
      
      const newAccount = await apiCreateAccount(accountData, token)
      
      // 🔸 Aggiorna state locale
      setAccounts(prev => [...prev, newAccount])
      
      // 🔸 Ricarica statistiche
      loadAccountsStats()
      
      // 🔸 Trigger refresh balance globale
      triggerBalanceRefresh()
      
      addToast?.(`Conto "${newAccount.name}" creato con successo`, 'success')
      return newAccount
    } catch (err) {
      setError(err.message)
      addToast?.(err.message || 'Errore creazione conto', 'error')
      console.error('Error creating account:', err)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [token, addToast, loadAccountsStats])

  /**
   * 🎯 FUNCTION: Aggiorna conto esistente
   */
  const updateAccount = useCallback(async (accountId, updateData) => {
    if (!token || !accountId) return null

    try {
      setIsUpdating(true)
      setError(null)
      
      const updatedAccount = await apiUpdateAccount(accountId, updateData, token)
      
      // 🔸 Aggiorna state locale
      setAccounts(prev => 
        prev.map(account => 
          account.id === accountId ? updatedAccount : account
        )
      )
      
      // 🔸 Aggiorna selected account se è quello modificato
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(updatedAccount)
      }
      
      // 🔸 Ricarica statistiche
      loadAccountsStats()
      
      // 🔸 Trigger refresh balance globale se balance cambiato
      if (updateData.balance !== undefined) {
        triggerBalanceRefresh()
      }
      
      addToast?.(`Conto "${updatedAccount.name}" aggiornato`, 'success')
      return updatedAccount
    } catch (err) {
      setError(err.message)
      addToast?.(err.message || 'Errore aggiornamento conto', 'error')
      console.error('Error updating account:', err)
      return null
    } finally {
      setIsUpdating(false)
    }
  }, [token, selectedAccount, addToast, loadAccountsStats])

  /**
   * 🎯 FUNCTION: Elimina conto
   */
  const deleteAccount = useCallback(async (accountId) => {
    if (!token || !accountId) return false

    try {
      setIsDeleting(true)
      setError(null)
      
      const accountToDelete = accounts.find(acc => acc.id === accountId)
      
      await apiDeleteAccount(accountId, token)
      
      // 🔸 Aggiorna state locale
      setAccounts(prev => prev.filter(account => account.id !== accountId))
      
      // 🔸 Clear selected account se era quello eliminato
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null)
      }
      
      // 🔸 Ricarica statistiche
      loadAccountsStats()
      
      // 🔸 Trigger refresh balance globale
      triggerBalanceRefresh()
      
      addToast?.(`Conto "${accountToDelete?.name || 'Sconosciuto'}" eliminato`, 'success')
      return true
    } catch (err) {
      setError(err.message)
      addToast?.(err.message || 'Errore eliminazione conto', 'error')
      console.error('Error deleting account:', err)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [token, accounts, selectedAccount, addToast, loadAccountsStats])

  /**
   * 🎯 FUNCTION: Ricalcola balance conto
   */
  const recalculateBalance = useCallback(async (accountId) => {
    if (!token || !accountId) return null

    try {
      const updatedAccount = await apiRecalculateBalance(accountId, token)
      
      // 🔸 Aggiorna state locale
      setAccounts(prev => 
        prev.map(account => 
          account.id === accountId ? updatedAccount : account
        )
      )
      
      // 🔸 Aggiorna selected account se è quello ricalcolato
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(updatedAccount)
      }
      
      // 🔸 Ricarica statistiche
      loadAccountsStats()
      
      // 🔸 Trigger refresh balance globale
      triggerBalanceRefresh()
      
      addToast?.('Saldo ricalcolato con successo', 'success')
      return updatedAccount
    } catch (err) {
      addToast?.(err.message || 'Errore ricalcolo saldo', 'error')
      console.error('Error recalculating balance:', err)
      return null
    }
  }, [token, selectedAccount, addToast, loadAccountsStats])

  /**
   * 🎯 FUNCTION: Refresh completo dati accounts
   */
  const refreshAccounts = useCallback(async () => {
    await Promise.all([
      loadAccounts(),
      loadAccountsStats()
    ])
  }, [loadAccounts, loadAccountsStats])

  // 🔸 Effect per caricamento iniziale
  useEffect(() => {
    if (token) {
      refreshAccounts()
    }
  }, [token, refreshAccounts])

  // 🔸 Computed values
  const totalAccounts = accounts.length
  const currentAccounts = accounts.filter(acc => acc.accountType === 'CURRENT')
  const totalCurrentBalance = currentAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)

  // 🔸 Return hook interface
  return {
    // State
    accounts,
    accountsStats,
    selectedAccount,
    totalAccounts,
    currentAccounts,
    totalCurrentBalance,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Actions
    loadAccounts,
    loadAccountsStats,
    loadAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    recalculateBalance,
    refreshAccounts,
    
    // Utilities
    setSelectedAccount,
    clearError: () => setError(null)
  }
}
