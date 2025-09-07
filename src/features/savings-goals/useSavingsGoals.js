/**
 * 📄 USE SAVINGS GOALS HOOK: Gestione stato obiettivi di risparmio
 * 
 * 🎯 Scopo: Hook personalizzato per gestire state management e API calls
 * degli obiettivi di risparmio
 * 
 * 🔧 Dipendenze principali:
 * - React hooks (useState, useEffect, useCallback)
 * - API client per chiamate server
 * - Toast per feedback utente
 * 
 * 📝 Note:
 * - Gestisce CRUD completo degli obiettivi
 * - Integrazione con sistema transazioni per operazioni saldo
 * - Calcoli automatici percentuali progresso e stati
 * - Cache locale ottimizzata per performance
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione hook
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api.js'
import { useToast } from '../toast/useToast.js'

/**
 * 🎯 HOOK: Gestione completa obiettivi di risparmio
 */
export function useSavingsGoals(token) {
  // 🔸 State management
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const { showToast } = useToast()

  // =============================================================================
  // 🔸 DATA FETCHING
  // =============================================================================

  /**
   * 🔸 Carica tutti gli obiettivi dell'utente
   */
  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const goals = await api.listSavingsGoals(token)
      setGoals(goals || [])
    } catch (error) {
      console.error('❌ Errore nel caricamento obiettivi:', error)
      setError(error.message || 'Impossibile caricare gli obiettivi di risparmio')
      showToast('error', 'Errore nel caricamento obiettivi')
    } finally {
      setIsLoading(false)
    }
  }, [token, showToast])

  /**
   * 🔸 Carica dettagli specifici obiettivo
   */
  const fetchGoalDetails = useCallback(async (goalId) => {
    try {
      setIsLoading(true)
      const goal = await api.getSavingsGoal(token, goalId)
      setSelectedGoal(goal)
      return goal
    } catch (error) {
      console.error('❌ Errore nel caricamento dettagli:', error)
      showToast('error', 'Errore nel caricamento dettagli obiettivo')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, showToast])

  // =============================================================================
  // 🔸 CRUD OPERATIONS
  // =============================================================================

  /**
   * 🔸 Crea nuovo obiettivo
   */
  const createGoal = useCallback(async (goalData) => {
    try {
      setIsLoading(true)
      const newGoal = await api.createSavingsGoal(token, goalData)
      setGoals(prev => {
        const currentGoals = Array.isArray(prev) ? prev : []
        return [...currentGoals, newGoal]
      })
      showToast('success', 'Obiettivo creato con successo!')
      return newGoal
    } catch (error) {
      console.error('❌ Errore nella creazione obiettivo:', error)
      const message = error.message || 'Errore nella creazione obiettivo'
      showToast('error', message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, showToast])

  /**
   * 🔸 Aggiorna obiettivo esistente
   */
  const updateGoal = useCallback(async (goalId, updateData) => {
    try {
      setIsLoading(true)
      const updatedGoal = await api.updateSavingsGoal(token, goalId, updateData)
      setGoals(prev => {
        const currentGoals = Array.isArray(prev) ? prev : []
        return currentGoals.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        )
      })
      if (selectedGoal && selectedGoal.id === goalId) {
        setSelectedGoal(updatedGoal)
      }
      showToast('success', 'Obiettivo aggiornato con successo!')
      return updatedGoal
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento obiettivo:', error)
      const message = error.message || 'Errore nell\'aggiornamento obiettivo'
      showToast('error', message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, selectedGoal, showToast])

  /**
   * 🔸 Elimina obiettivo
   */
  const deleteGoal = useCallback(async (goalId) => {
    try {
      setIsLoading(true)
      await api.deleteSavingsGoal(token, goalId)
      setGoals(prev => {
        const currentGoals = Array.isArray(prev) ? prev : []
        return currentGoals.filter(goal => goal.id !== goalId)
      })
      if (selectedGoal && selectedGoal.id === goalId) {
        setSelectedGoal(null)
      }
      showToast('success', 'Obiettivo eliminato')
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione obiettivo:', error)
      const message = error.message || 'Errore nell\'eliminazione obiettivo'
      showToast('error', message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, selectedGoal, showToast])

  // =============================================================================
  // 🔸 BALANCE OPERATIONS
  // =============================================================================

  /**
   * 🔸 Aggiungi saldo all'obiettivo
   */
  const addToGoal = useCallback(async (goalId, amount, notes = null) => {
    try {
      setIsLoading(true)
      const result = await api.addToSavingsGoal(token, goalId, {
        amount: parseFloat(amount),
        notes
      })
      
      // 🔸 Ricarica i goals per avere i dati aggiornati
      await fetchGoals()
      
      showToast('success', `Aggiunto €${amount} all'obiettivo`)
      
      // 🔸 Emetti evento per aggiornare balance globale
      window.dispatchEvent(new CustomEvent('balanceRefresh'))
      
      return result
    } catch (error) {
      console.error('❌ Errore nell\'aggiunta saldo:', error)
      const message = error.message || 'Errore nell\'aggiunta saldo'
      showToast('error', message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, fetchGoals, showToast])

  /**
   * 🔸 Preleva saldo dall'obiettivo
   */
  const withdrawFromGoal = useCallback(async (goalId, amount, notes = null, subcategoryId = null) => {
    try {
      setIsLoading(true)
      const result = await api.withdrawFromSavingsGoal(token, goalId, {
        amount: parseFloat(amount),
        notes,
        subcategoryId
      })
      
      // 🔸 Ricarica i goals per avere i dati aggiornati
      await fetchGoals()
      
      showToast('success', `Prelevato €${amount} dall'obiettivo`)
      
      // 🔸 Emetti evento per aggiornare balance globale
      window.dispatchEvent(new CustomEvent('balanceRefresh'))
      
      return result
    } catch (error) {
      console.error('❌ Errore nel prelievo saldo:', error)
      const message = error.message || 'Errore nel prelievo saldo'
      showToast('error', message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, fetchGoals, showToast])

  /**
   * 🔸 Ottieni storico operazioni obiettivo
   */
  const getGoalHistory = useCallback(async (goalId) => {
    try {
      setIsLoading(true)
      const history = await api.getSavingsGoalHistory(token, goalId)
      return history
    } catch (error) {
      console.error('❌ Errore nel caricamento storico:', error)
      showToast('error', 'Errore nel caricamento storico operazioni')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, showToast])

  /**
   * 🔸 Ripeti obiettivo completato (riporta a 0 e riattiva)
   */
  const repeatCompletedGoal = useCallback(async (goalId) => {
    try {
      setIsLoading(true)
      const result = await api.repeatCompletedGoal(token, goalId)
      
      // 🔸 Ricarica i goals per avere i dati aggiornati
      await fetchGoals()
      
      showToast('success', `Obiettivo ripetuto! €${result.refundedAmount} restituiti`)
      
      // 🔸 Emetti evento per aggiornare balance globale
      window.dispatchEvent(new CustomEvent('balanceRefresh'))
      
      return result
    } catch (error) {
      console.error('❌ Errore nella ripetizione obiettivo:', error)
      const message = error.message || 'Errore nella ripetizione obiettivo'
      showToast('error', message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token, fetchGoals, showToast])

  // =============================================================================
  // 🔸 UTILITY FUNCTIONS
  // =============================================================================

  /**
   * 🔸 Calcola statistiche generali obiettivi
   */
  const getGoalsStats = useCallback(() => {
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return {
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        totalTargetAmount: 0,
        totalCurrentAmount: 0,
        averageProgress: 0
      }
    }

    const activeGoals = goals.filter(g => g.status === 'ACTIVE')
    const completedGoals = goals.filter(g => g.status === 'COMPLETED')
    const totalTargetAmount = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || 0), 0)
    const totalCurrentAmount = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0)
    const averageProgress = goals.length > 0 
      ? goals.reduce((sum, g) => sum + (g.progressPercentage || 0), 0) / goals.length 
      : 0

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      averageProgress
    }
  }, [goals])

  /**
   * 🔸 Filtra obiettivi per stato
   */
  const getGoalsByStatus = useCallback((status) => {
    if (!goals || !Array.isArray(goals)) return []
    return goals.filter(goal => goal.status === status)
  }, [goals])

  // =============================================================================
  // 🔸 EFFECTS
  // =============================================================================

  // 🔸 Carica obiettivi all'inizializzazione
  useEffect(() => {
    if (token) {
      fetchGoals()
    }
  }, [token, fetchGoals])

  // 🔸 Return hook interface
  return {
    // State
    goals,
    selectedGoal,
    isLoading,
    error,
    
    // CRUD Operations
    createGoal,
    updateGoal,
    deleteGoal,
    fetchGoals,
    fetchGoalDetails,
    
    // Balance Operations
    addToGoal,
    withdrawFromGoal,
    getGoalHistory,
    repeatCompletedGoal,
    
    // Utilities
    getGoalsStats,
    getGoalsByStatus,
    
    // Actions
    setSelectedGoal,
    refreshGoals: fetchGoals
  }
}

export default useSavingsGoals
