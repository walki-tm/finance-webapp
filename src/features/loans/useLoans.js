/**
 * 📄 USE LOANS: Hook per gestione prestiti/mutui
 * 
 * 🎯 Scopo: Gestisce state e operazioni per prestiti, rate e simulazioni
 * seguendo il pattern consolidato degli altri hook del progetto.
 * 
 * 🔧 Dipendenze principali:
 * - React hooks per state management
 * - LoansAPI per operazioni backend
 * - Toast per feedback utente
 * 
 * 📝 Note:
 * - Gestisce CRUD completo per prestiti
 * - Include calcoli real-time e simulazioni
 * - Integra con sistema planned transactions
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale hook prestiti
 */

import { useEffect, useState, useCallback } from 'react'
import { loansApi } from './services/loans.api.js'

export function useLoans(token) {
  // =============================================================================
  // 🔸 STATE MANAGEMENT
  // =============================================================================
  
  // Core data
  const [loans, setLoans] = useState([])
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [loanDetails, setLoanDetails] = useState(null)
  const [amortizationSchedule, setAmortizationSchedule] = useState([])
  const [simulations, setSimulations] = useState({})
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalStates, setModalStates] = useState({
    createLoan: false,
    editLoan: false,
    deleteLoan: false,
    loanDetails: false,
    paymentRecord: false,
    simulatePayoff: false
  })
  
  // Form state
  const [editingLoan, setEditingLoan] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  
  // Summary data
  const [summary, setSummary] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalDebt: 0,
    monthlyPayments: 0
  })

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // =============================================================================
  // 🔸 MODAL MANAGEMENT
  // =============================================================================

  const openModal = useCallback((modalType, data = null) => {
    setModalStates(prev => ({ ...prev, [modalType]: true }))
    
    switch (modalType) {
      case 'editLoan':
        setEditingLoan(data)
        break
      case 'deleteLoan':
        setEditingLoan(data)
        break
      case 'loanDetails':
        setSelectedLoan(data)
        break
      case 'paymentRecord':
        setSelectedPayment(data)
        break
      default:
        break
    }
  }, [])

  const closeModal = useCallback((modalType) => {
    setModalStates(prev => ({ ...prev, [modalType]: false }))
    
    // Clear associated data when closing
    if (modalType === 'editLoan' || modalType === 'deleteLoan') {
      setEditingLoan(null)
    } else if (modalType === 'loanDetails') {
      setSelectedLoan(null)
      setLoanDetails(null)
      setAmortizationSchedule([])
    } else if (modalType === 'paymentRecord') {
      setSelectedPayment(null)
    }
  }, [])

  // =============================================================================
  // 🔸 DATA LOADING
  // =============================================================================

  /**
   * 🎯 Carica lista prestiti utente
   */
  const loadUserLoans = useCallback(async () => {
    if (!token) {
      setLoans([])
      setSummary({ totalLoans: 0, activeLoans: 0, totalDebt: 0, monthlyPayments: 0 })
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await loansApi.getUserLoans(token)
      const { loans: userLoans, summary: loansSummary } = response
      
      setLoans(userLoans || [])
      setSummary(loansSummary || { totalLoans: 0, activeLoans: 0, totalDebt: 0, monthlyPayments: 0 })
      
    } catch (err) {
      console.error('❌ Error loading user loans:', err.message)
      setError(err.message)
      setLoans([])
      setSummary({ totalLoans: 0, activeLoans: 0, totalDebt: 0, monthlyPayments: 0 })
    } finally {
      setLoading(false)
    }
  }, [token])

  /**
   * 🎯 Carica dettagli prestito specifico
   */
  const loadLoanDetails = useCallback(async (loanId) => {
    if (!token || !loanId) return

    try {
      setLoading(true)
      setError(null)

      const details = await loansApi.getLoanDetails(token, loanId)
      setLoanDetails(details)
      setAmortizationSchedule(details.schedule || [])

    } catch (err) {
      console.error('❌ Error loading loan details:', err.message)
      setError(err.message)
      setLoanDetails(null)
      setAmortizationSchedule([])
    } finally {
      setLoading(false)
    }
  }, [token])

  // =============================================================================
  // 🔸 CRUD OPERATIONS
  // =============================================================================

  /**
   * 🎯 Crea nuovo prestito
   */
  const createLoan = useCallback(async (loanData) => {
    if (!token) throw new Error('Token mancante')

    try {
      setLoading(true)
      setError(null)

      console.log('🚀 DEBUG: Hook createLoan called with:', JSON.stringify(loanData, null, 2))

      // Prepara dati per backend (il form ha già convertito i valori)
      const backendData = {
        ...loanData
      }

      // Solo aggiungere effectiveRate se presente (e convertirlo se necessario)
      if (loanData.effectiveRate && typeof loanData.effectiveRate === 'number') {
        // Se effectiveRate viene dal form come percentuale, convertilo
        backendData.effectiveRate = loanData.effectiveRate > 1 
          ? loanData.effectiveRate / 100 
          : loanData.effectiveRate
      }

      console.log('🚀 DEBUG: Backend data prepared:', JSON.stringify(backendData, null, 2))

      const result = await loansApi.createLoan(token, backendData)
      
      // Aggiorna lista prestiti
      await loadUserLoans()
      
      // Chiudi modal
      closeModal('createLoan')
      
      return result

    } catch (err) {
      console.error('❌ Error creating loan:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, loadUserLoans, closeModal])

  /**
   * 🎯 Aggiorna prestito esistente
   */
  const updateLoan = useCallback(async (loanId, updateData) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      setLoading(true)
      setError(null)

      const updatedLoan = await loansApi.updateLoan(token, loanId, updateData)
      
      // Aggiorna loan nella lista
      setLoans(prevLoans =>
        prevLoans.map(loan =>
          loan.id === loanId ? { ...loan, ...updatedLoan } : loan
        )
      )

      // Se stiamo visualizzando i dettagli di questo prestito, aggiornali
      if (loanDetails && loanDetails.id === loanId) {
        setLoanDetails(prev => ({ ...prev, ...updatedLoan }))
      }

      closeModal('editLoan')
      return updatedLoan

    } catch (err) {
      console.error('❌ Error updating loan:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, loanDetails, closeModal])

  /**
   * 🎯 Elimina prestito
   */
  const deleteLoan = useCallback(async (loanId) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      setLoading(true)
      setError(null)

      await loansApi.deleteLoan(token, loanId)
      
      // Rimuovi dalla lista
      setLoans(prevLoans => prevLoans.filter(loan => loan.id !== loanId))
      
      // Aggiorna summary
      await loadUserLoans()
      
      closeModal('deleteLoan')

    } catch (err) {
      console.error('❌ Error deleting loan:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, loadUserLoans, closeModal])

  // =============================================================================
  // 🔸 PAYMENT OPERATIONS
  // =============================================================================

  /**
   * 🎯 Registra pagamento rata
   */
  const recordPayment = useCallback(async (loanId, paymentNumber, paymentData) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      setLoading(true)
      setError(null)

      const result = await loansApi.recordLoanPayment(token, loanId, paymentNumber, paymentData)
      
      // Aggiorna dettagli prestito se stiamo visualizzandoli
      if (loanDetails && loanDetails.id === loanId) {
        await loadLoanDetails(loanId)
      }
      
      // Aggiorna lista prestiti per i summary
      await loadUserLoans()
      
      closeModal('paymentRecord')
      
      return result

    } catch (err) {
      console.error('❌ Error recording payment:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, loanDetails, loadLoanDetails, loadUserLoans, closeModal])

  /**
   * 🎯 Paga rata direttamente
   */
  const payLoan = useCallback(async (loanId) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      console.log('💰 DEBUG: Starting loan payment for:', loanId)
      setLoading(true)
      setError(null)
      
      // Chiama l'endpoint specifico per pagare la prossima rata automaticamente
      const result = await loansApi.payNextLoan(token, loanId)
      
      console.log('💰 DEBUG: Payment completed, result:', result)
      
      // Force refresh completo dei dati loan
      await loadUserLoans()
      
      // Se stiamo visualizzando i dettagli di questo prestito, ricarica anche quelli
      if (loanDetails && loanDetails.id === loanId) {
        await loadLoanDetails(loanId)
      }
      
      console.log('✅ DEBUG: Loan data refresh completed')
      
      return result

    } catch (err) {
      console.error('❌ Error paying loan:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, loadUserLoans, loadLoanDetails, loanDetails])

  /**
   * 🎯 Refresh dati prestito (usato dopo materializzazione planned transaction)
   */
  const refreshLoanData = useCallback(async (loanId) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      console.log('🔄 DEBUG: Refreshing loan data for:', loanId)
      
      // Solo refresh, senza registrare pagamenti
      await loadUserLoans()
      
      // Se stiamo visualizzando i dettagli di questo prestito, ricarica anche quelli
      if (loanDetails && loanDetails.id === loanId) {
        await loadLoanDetails(loanId)
      }
      
      console.log('✅ DEBUG: Loan data refresh completed')

    } catch (err) {
      console.error('❌ Error refreshing loan data:', err.message)
      setError(err.message)
      throw err
    }
  }, [token, loadUserLoans, loadLoanDetails, loanDetails])

  /**
   * 🎯 Salta prossima rata
   */
  const skipPayment = useCallback(async (loanId) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      console.log('⏭️ DEBUG: Starting skip payment for loan:', loanId)
      setLoading(true)
      setError(null)

      const result = await loansApi.skipLoanPayment(token, loanId)
      
      console.log('⏭️ DEBUG: Skip payment completed, result:', result)
      
      // Force refresh completo dei dati
      console.log('🔄 DEBUG: Forcing complete refresh after skip...')
      
      // Refresh immediato
      await loadUserLoans()
      
      // Se stiamo visualizzando i dettagli di questo prestito, ricarica anche quelli
      if (loanDetails && loanDetails.id === loanId) {
        await loadLoanDetails(loanId)
      }
      
      // Trigger refresh per sicurezza
      setRefreshTrigger(prev => {
        const newVal = prev + 1
        console.log('🔄 DEBUG: Refresh trigger incremented from', prev, 'to', newVal)
        return newVal
      })
      
      return result

    } catch (err) {
      console.error('❌ Error skipping payment:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, loadUserLoans, loadLoanDetails, loanDetails])

  // =============================================================================
  // 🔸 SIMULATION OPERATIONS
  // =============================================================================

  /**
   * 🎯 Simula estinzione anticipata
   */
  const simulatePayoff = useCallback(async (loanId, targetMonths = []) => {
    if (!token || !loanId) throw new Error('Parametri mancanti')

    try {
      setLoading(true)
      setError(null)

      const simulation = await loansApi.simulateLoanPayoff(token, loanId, targetMonths)
      
      // Cache della simulazione
      setSimulations(prev => ({
        ...prev,
        [loanId]: simulation
      }))

      return simulation

    } catch (err) {
      console.error('❌ Error simulating payoff:', err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  // =============================================================================
  // 🔸 UTILITY FUNCTIONS
  // =============================================================================

  /**
   * 🎯 Refresh completo dei dati
   */
  const refreshAllData = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  /**
   * 🎯 Calcola preview rata (per form)
   */
  const calculatePaymentPreview = useCallback((principal, interestRate, durationMonths) => {
    try {
      const annualRate = interestRate / 100 // Convert percentage to decimal
      return loansApi.calculateMonthlyPayment(principal, annualRate, durationMonths)
    } catch (err) {
      return 0
    }
  }, [])

  /**
   * 🎯 Trova prestito per ID
   */
  const getLoanById = useCallback((loanId) => {
    return loans.find(loan => loan.id === loanId)
  }, [loans])

  // =============================================================================
  // 🔸 EFFECTS
  // =============================================================================

  // Caricamento iniziale
  useEffect(() => {
    loadUserLoans()
  }, [loadUserLoans, refreshTrigger])

  // Auto-refresh quando cambia il prestito selezionato
  useEffect(() => {
    if (selectedLoan) {
      loadLoanDetails(selectedLoan.id || selectedLoan)
    }
  }, [selectedLoan, loadLoanDetails])

  // =============================================================================
  // 🔸 RETURN HOOK API
  // =============================================================================

  return {
    // Data
    loans,
    selectedLoan,
    loanDetails,
    amortizationSchedule,
    simulations,
    summary,
    
    // State
    loading,
    error,
    modalStates,
    editingLoan,
    selectedPayment,
    
    // Actions
    createLoan,
    updateLoan,
    deleteLoan,
    recordPayment,
    simulatePayoff,
    payLoan,
    refreshLoanData,
    skipPayment,
    
    // Loaders
    loadUserLoans,
    loadLoanDetails,
    refreshAllData,
    
    // Modal management
    openModal,
    closeModal,
    
    // Utilities
    calculatePaymentPreview,
    getLoanById,
    formatCurrency: loansApi.formatCurrency,
    formatPercentage: loansApi.formatPercentage,
    calculateProgress: loansApi.calculateProgress,
    
    // Clear error
    clearError: () => setError(null)
  }
}
