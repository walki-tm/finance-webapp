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
  // 🔸 State per transazioni upcoming
  const [upcomingTransactions, setUpcomingTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 🔸 Carica prossime transazioni pianificate
  const loadUpcomingTransactions = useCallback(async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const url = `/api/planned-transactions/upcoming?limit=${limit}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        // Controlla se è un errore 404 (endpoint non trovato) o altro
        if (response.status === 404) {
          setUpcomingTransactions([])
          setError(null)
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Controlla se la risposta è JSON valido
      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        setUpcomingTransactions([])
        setError(null)
        return
      }
      
      const data = await response.json()
      setUpcomingTransactions(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      // Per errori di parsing JSON, non mostrare errore ma logga per debug
      if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        setUpcomingTransactions([])
        setError(null) // Non mostrare errore all'utente
      } else {
        setError(err.message)
        setUpcomingTransactions([])
      }
    } finally {
      setLoading(false)
    }
  }, [token, limit])

  // 🔸 Carica all'avvio
  useEffect(() => {
    loadUpcomingTransactions()
  }, [loadUpcomingTransactions])

  // 🔸 Auto refresh ogni 5 minuti
  useEffect(() => {
    if (!token) return
    
    const interval = setInterval(() => {
      loadUpcomingTransactions()
    }, 5 * 60 * 1000) // 5 minuti
    
    return () => clearInterval(interval)
  }, [loadUpcomingTransactions, token])

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

  return {
    upcomingTransactions: formattedUpcomingTransactions,
    loading,
    error,
    refresh: loadUpcomingTransactions,
    hasUpcomingTransactions: upcomingTransactions.length > 0
  }
}
