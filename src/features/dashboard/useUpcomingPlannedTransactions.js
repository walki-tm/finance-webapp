/**
 * 📄 UPCOMING PLANNED TRANSACTIONS HOOK: Gestione prossime transazioni pianificate
 * 
 * 🎯 Scopo: Hook per caricare e gestire le prossime transazioni pianificate per dashboard
 * 
 * 🔧 Dipendenze principali:
 * - API planned transactions
 * - Auto refresh ogni 5 minuti
 * 
 * 📝 Note:
 * - Carica solo le prossime 5 transazioni
 * - Include transazioni da loan e manuali
 * - Ordinate per data di scadenza
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { useState, useEffect, useCallback } from 'react'

export default function useUpcomingPlannedTransactions(token, limit = 5) {
  console.log('🔄 useUpcomingPlannedTransactions: RE-ENABLED with fixed logic')
  
  // 🔸 State per transazioni upcoming
  const [upcomingTransactions, setUpcomingTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // 🔸 Carica all'avvio - FIXED INLINE LOGIC
  useEffect(() => {
    console.log('🔄 useUpcomingPlannedTransactions: Effect caricamento', { token: !!token, limit })
    
    if (!token) return
    
    let mounted = true
    setLoading(true)
    
    const loadTransactions = async () => {
      try {
        const url = `/api/planned-transactions/upcoming?limit=${limit}`
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            if (mounted) {
              setUpcomingTransactions([])
              setError(null)
            }
            return
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        
        if (!contentType || !contentType.includes('application/json')) {
          if (mounted) {
            setUpcomingTransactions([])
            setError(null)
          }
          return
        }
        
        const data = await response.json()
        if (mounted) {
          setUpcomingTransactions(Array.isArray(data) ? data : [])
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
            setUpcomingTransactions([])
            setError(null)
          } else {
            setError(err.message)
            setUpcomingTransactions([])
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadTransactions()
    
    return () => {
      mounted = false
    }
  }, [token, limit]) // 🔧 FIX: Solo token e limit come dipendenze stabili
  
  // 🔸 Formatta transazioni con informazioni aggiuntive
  const formattedUpcomingTransactions = upcomingTransactions.map(tx => {
    const nextDueDate = new Date(tx.nextDueDate)
    const today = new Date()
    const diffTime = nextDueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Calcola stato urgenza
    let urgencyLevel = 'normal'
    if (diffDays < 0) urgencyLevel = 'overdue'
    else if (diffDays === 0) urgencyLevel = 'today'
    else if (diffDays <= 3) urgencyLevel = 'urgent'
    else if (diffDays <= 7) urgencyLevel = 'soon'
    
    return {
      ...tx,
      nextDueDate,
      daysUntilDue: diffDays,
      urgencyLevel,
      isOverdue: diffDays < 0,
      isDueToday: diffDays === 0,
      formattedDate: nextDueDate.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
      }),
      isFromLoan: !!tx.loanId
    }
  })
  
  // 🔸 Manual refresh function for external use
  const refresh = async () => {
    console.log('🔄 useUpcomingPlannedTransactions: Manual refresh triggered')
    
    if (!token) return
    
    setLoading(true)
    try {
      const url = `/api/planned-transactions/upcoming?limit=${limit}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json()
        setUpcomingTransactions(Array.isArray(data) ? data : [])
        setError(null)
      }
    } catch (err) {
      console.error('Error in manual refresh:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return {
    upcomingTransactions: formattedUpcomingTransactions,
    loading,
    error,
    refresh,
    hasUpcomingTransactions: upcomingTransactions.length > 0
  }
}
