/**
 * 📄 USE PLANNED TRANSACTIONS: Hook per gestione transazioni pianificate
 * 
 * 🎯 Scopo: Gestisce state e operazioni per transazioni pianificate e gruppi
 * 
 * 🔧 Dipendenze principali:
 * - React hooks per state management
 * - API client per operazioni backend
 * 
 * 📝 Note:
 * - Gestisce CRUD per transazioni pianificate
 * - Supporta raggruppamento e riorganizzazione
 * - Include logica per materializzazione
 * 
 * @author Finance WebApp Team
 * @modified 23 Agosto 2025 - Creazione iniziale
 */

import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { 
  applyMonthlyTransactionToBudget,
  applyYearlyTransactionToBudget,
  applyOneTimeTransactionToBudget,
  applyGroupToBudget,
  removeTransactionFromBudget
} from './lib/budgetingIntegration.js'

const normalizeMainKey = (main) => {
  const u = String(main || 'EXPENSE').toUpperCase()
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' }
  return map[u] || u.toLowerCase()
}

export function usePlannedTransactions(token) {
  // 🔸 State per transazioni pianificate
  const [plannedTransactions, setPlannedTransactions] = useState([])
  const [transactionGroups, setTransactionGroups] = useState([])
  const [plannedTxModalOpen, setPlannedTxModalOpen] = useState(false)
  const [editingPlannedTx, setEditingPlannedTx] = useState(null)
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [dueTransactions, setDueTransactions] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 🔸 Caricamento iniziale
  useEffect(() => {
    let active = true
    async function load() {
      if (!token) {
        setPlannedTransactions([])
        setTransactionGroups([])
        setDueTransactions([])
        return
      }
      try {
        const [planned, groups, due] = await Promise.all([
          api.listPlannedTransactions(token),
          api.listTransactionGroups(token),
          api.getPlannedTransactionsDue(token)
        ])
        
        
        const normalizedPlanned = planned.map(t => ({
          ...t,
          main: normalizeMainKey(t.main),
          sub: t.subcategory?.name || '',
        }))
        
        if (active) {
          setPlannedTransactions(normalizedPlanned)
          setTransactionGroups(groups)
          setDueTransactions(due)
        }
      } catch (err) {
        console.error('Errore caricamento planned transactions:', err.message)
        if (active) {
          setPlannedTransactions([])
          setTransactionGroups([])
          setDueTransactions([])
        }
      }
    }
    load()
    return () => { active = false }
  }, [token, refreshTrigger])

  // 🔸 Gestione modal planned transactions
  const openAddPlannedTx = () => { setEditingPlannedTx(null); setPlannedTxModalOpen(true) }
  const openEditPlannedTx = (tx) => { setEditingPlannedTx(tx); setPlannedTxModalOpen(true) }
  const closePlannedTxModal = () => { setPlannedTxModalOpen(false); setEditingPlannedTx(null) }

  // 🔸 Gestione modal gruppi
  const openAddGroup = () => { setEditingGroup(null); setGroupModalOpen(true) }
  const openEditGroup = (group) => { setEditingGroup(group); setGroupModalOpen(true) }
  const closeGroupModal = () => { setGroupModalOpen(false); setEditingGroup(null) }

  // 🔸 CRUD transazioni pianificate
  const savePlannedTx = async (payload, { subcats, batchUpsertBudgets, currentYear, refreshBudgets } = {}) => {
    const isEdit = Boolean(editingPlannedTx?.id)
    const shouldApplyToBudget = Boolean(payload.applyToBudget)
    const body = {
      title: payload.title || '',  // ✅ Aggiungi title mancante
      main: String(payload.main || 'EXPENSE').toUpperCase(),
      subId: payload.subId || null,
      subName: payload.sub || null,
      amount: Number(payload.amount || 0),
      note: payload.note || '',
      payee: payload.payee || '',
      frequency: payload.frequency,
      startDate: payload.startDate || new Date().toISOString(),
      confirmationMode: payload.confirmationMode || 'MANUAL',
      groupId: payload.groupId || null,
      appliedToBudget: shouldApplyToBudget,
    }

    try {
      let savedTransaction
      if (isEdit) {
        const updated = await api.updatePlannedTransaction(token, editingPlannedTx.id, body)
        const normalizedMain = normalizeMainKey(updated.main)
        const normalized = { 
          ...updated, 
          main: normalizedMain, 
          sub: payload.sub || updated.subcategory?.name || '',
          // Assicuriamoci che appliedToBudget sia preservato dal backend
          appliedToBudget: updated.appliedToBudget || false
        }
        setPlannedTransactions(s => s.map(t => (t.id === editingPlannedTx.id ? normalized : t)))
        savedTransaction = normalized
      } else {
        const created = await api.addPlannedTransaction(token, body)
        const normalizedMain = normalizeMainKey(created.main)
        const normalized = { 
          ...created, 
          main: normalizedMain, 
          sub: payload.sub || created.subcategory?.name || '',
          // Assicuriamoci che appliedToBudget sia preservato dal backend
          appliedToBudget: created.appliedToBudget || false
        }
        setPlannedTransactions(s => [normalized, ...s])
        savedTransaction = normalized
      }

      // 🔸 Applica automaticamente al budgeting se richiesto
      if (shouldApplyToBudget && subcats && batchUpsertBudgets && currentYear) {
        try {
          const budgetOptions = {
            year: currentYear,
            mode: 'divide', // Default per applicazione automatica
            targetMonth: null
          }
          await applyTransactionToBudget(savedTransaction, budgetOptions, subcats, batchUpsertBudgets)
          console.log('Transazione applicata automaticamente al budgeting')
          
          // 🔸 Refresh dello stato budgeting se fornita la callback
          if (refreshBudgets && typeof refreshBudgets === 'function') {
            try {
              await refreshBudgets()
              console.log('Dati budgeting aggiornati dopo applicazione automatica')
            } catch (refreshError) {
              console.error('Errore nel refresh budgeting:', refreshError)
            }
          }
        } catch (budgetError) {
          console.error('Errore nell\'applicazione automatica al budgeting:', budgetError)
          // Non blocchiamo il salvataggio se l'applicazione al budget fallisce
        }
      }
    } catch (err) {
      console.error('Errore save planned tx:', err.message)
      throw err
    } finally {
      closePlannedTxModal()
    }
  }

  const deletePlannedTx = async (id, { subcats, batchUpsertBudgets, currentYear, refreshBudgets } = {}) => {
    // Trova la transazione da eliminare
    const transactionToDelete = plannedTransactions.find(t => t.id === id)
    
    // Se la transazione era applicata al budgeting, rimuoviamola prima di eliminare
    if (transactionToDelete && transactionToDelete.appliedToBudget && subcats && batchUpsertBudgets && currentYear) {
      try {
        const options = {
          year: currentYear,
          mode: 'divide',
          targetMonth: null
        }
        await removeTransactionFromBudgeting(transactionToDelete, options, subcats, batchUpsertBudgets)
        console.log('Transazione rimossa dal budgeting prima dell\'eliminazione')
        
        // Refresh budgeting data
        if (refreshBudgets && typeof refreshBudgets === 'function') {
          await refreshBudgets()
        }
      } catch (budgetError) {
        console.error('Errore nella rimozione dal budgeting:', budgetError)
        // Continuiamo comunque con l'eliminazione
      }
    }
    
    // Rimuovi dal state locale
    setPlannedTransactions(s => s.filter(t => t.id !== id))
    
    try {
      await api.deletePlannedTransaction(token, id)
    } catch (err) {
      console.error('Errore delete planned tx:', err.message)
      // Re-aggiungi la transazione al state se l'eliminazione fallisce
      if (transactionToDelete) {
        setPlannedTransactions(s => [transactionToDelete, ...s])
      }
      throw err
    }
  }

  // 🔸 CRUD gruppi
  const saveGroup = async (payload) => {
    const isEdit = Boolean(editingGroup?.id)

    try {
      if (isEdit) {
        const updated = await api.updateTransactionGroup(token, editingGroup.id, payload)
        setTransactionGroups(s => s.map(g => (g.id === editingGroup.id ? updated : g)))
      } else {
        const created = await api.addTransactionGroup(token, payload)
        setTransactionGroups(s => [...s, created])
      }
    } catch (err) {
      console.error('Errore save group:', err.message)
      throw err
    } finally {
      closeGroupModal()
    }
  }

  const deleteGroup = async (id) => {
    // Sposta le transazioni pianificate del gruppo fuori dal gruppo
    setPlannedTransactions(s => s.map(t => t.groupId === id ? { ...t, groupId: null, group: null } : t))
    setTransactionGroups(s => s.filter(g => g.id !== id))
    try {
      await api.deleteTransactionGroup(token, id)
    } catch (err) {
      console.error('Errore delete group:', err.message)
    }
  }

  // Removed reorderGroups and movePlannedTx functions - no longer needed without drag-and-drop

  // 🔸 Materializzazione transazioni
  const materializePlannedTx = async (plannedTxId) => {
    try {
      const newTransaction = await api.materializePlannedTransaction(token, plannedTxId)
      
      // Aggiorna la transazione pianificata (può essere disattivata se ONE_TIME)
      const updatedPlanned = await api.listPlannedTransactions(token)
      const normalizedPlanned = updatedPlanned.map(t => ({
        ...t,
        main: normalizeMainKey(t.main),
        sub: t.subcategory?.name || '',
      }))
      setPlannedTransactions(normalizedPlanned)
      
      return newTransaction
    } catch (err) {
      console.error('Errore materialize planned tx:', err.message)
      throw err
    }
  }

  // 🔸 Refresh funzioni
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  const refreshDueTransactions = async () => {
    try {
      const due = await api.getPlannedTransactionsDue(token)
      setDueTransactions(due)
    } catch (err) {
      console.error('Errore refresh due transactions:', err.message)
    }
  }

  // 🔸 Applicazione al budgeting
  const applyTransactionToBudget = async (transaction, options, subcats, batchUpsertBudgets) => {
    const { mode, targetMonth, year } = options
    let budgetUpdates = []

    try {
      switch (transaction.frequency) {
        case 'MONTHLY':
          budgetUpdates = applyMonthlyTransactionToBudget(transaction, year, subcats)
          break
        case 'YEARLY':
          budgetUpdates = applyYearlyTransactionToBudget(transaction, year, subcats, mode, targetMonth)
          break
        case 'ONE_TIME':
          budgetUpdates = applyOneTimeTransactionToBudget(transaction, year, subcats)
          break
        default:
          throw new Error(`Frequenza non supportata: ${transaction.frequency}`)
      }

      // Applica gli aggiornamenti tramite batchUpsertBudgets
      if (budgetUpdates.length > 0) {
        await batchUpsertBudgets(budgetUpdates)
      }
      
      return budgetUpdates
    } catch (error) {
      console.error('Errore applicazione al budget:', error)
      throw error
    }
  }

  const applyGroupToBudgeting = async (groupId, options, subcats, batchUpsertBudgets) => {
    const { year } = options
    const groupTransactions = plannedTransactions.filter(tx => tx.groupId === groupId)
    
    if (groupTransactions.length === 0) {
      throw new Error('Nessuna transazione trovata nel gruppo')
    }

    try {
      const budgetUpdates = applyGroupToBudget(groupTransactions, year, subcats)
      
      // Applica gli aggiornamenti tramite batchUpsertBudgets
      if (budgetUpdates.length > 0) {
        await batchUpsertBudgets(budgetUpdates)
      }
      
      return budgetUpdates
    } catch (error) {
      console.error('Errore applicazione gruppo al budget:', error)
      throw error
    }
  }

  // 🔸 Rimozione dal budgeting
  const removeTransactionFromBudgeting = async (transaction, options, subcats, batchUpsertBudgets, isManagedAutomatically = null) => {
    try {
      const budgetUpdates = removeTransactionFromBudget(transaction, options, subcats, isManagedAutomatically)
      
      // Applica gli aggiornamenti negativi tramite batchUpsertBudgets
      if (budgetUpdates.length > 0) {
        await batchUpsertBudgets(budgetUpdates)
      }
      
      return budgetUpdates
    } catch (error) {
      console.error('Errore rimozione dal budget:', error)
      throw error
    }
  }

  // 🔸 Toggle budgeting per transazione
  const toggleTransactionBudgeting = async (transaction, { subcats, batchUpsertBudgets, currentYear, refreshBudgets, isManagedAutomatically } = {}) => {
    if (!subcats || !batchUpsertBudgets || !currentYear) {
      throw new Error('Parametri richiesti per il toggle budgeting mancanti')
    }

    const options = {
      year: currentYear,
      mode: 'divide', // Default per applicazione automatica
      targetMonth: null
    }

    try {
      if (transaction.appliedToBudget) {
        // Rimuovi dal budgeting
        await removeTransactionFromBudgeting(transaction, options, subcats, batchUpsertBudgets, isManagedAutomatically)
        
        // Aggiorna lo stato nel database
        const updated = await api.updatePlannedTransaction(token, transaction.id, { 
          appliedToBudget: false 
        })
        
        // Aggiorna lo state locale
        setPlannedTransactions(s => s.map(t => 
          t.id === transaction.id 
            ? { ...t, appliedToBudget: false }
            : t
        ))
        
        console.log('Transazione rimossa dal budgeting')
      } else {
        // Applica al budgeting
        await applyTransactionToBudget(transaction, options, subcats, batchUpsertBudgets)
        
        // Aggiorna lo stato nel database
        const updated = await api.updatePlannedTransaction(token, transaction.id, { 
          appliedToBudget: true 
        })
        
        // Aggiorna lo state locale
        setPlannedTransactions(s => s.map(t => 
          t.id === transaction.id 
            ? { ...t, appliedToBudget: true }
            : t
        ))
        
        console.log('Transazione applicata al budgeting')
      }
      
      // Refresh budgeting data
      if (refreshBudgets && typeof refreshBudgets === 'function') {
        try {
          await refreshBudgets()
        } catch (refreshError) {
          console.error('Errore nel refresh budgeting:', refreshError)
        }
      }
    } catch (error) {
      console.error('Errore nel toggle budgeting:', error)
      throw error
    }
  }

  // 🔸 Toggle attivo/inattivo per transazioni (usa il nuovo endpoint dedicato)
  const toggleTransactionActive = async (transaction, isActive, { refreshBudgets } = {}) => {
    try {
      // Usa il nuovo endpoint dedicato che gestisce automaticamente il budgeting
      const updated = await api.togglePlannedTransactionActive(token, transaction.id, isActive)
      
      // 🎆 REFRESH AUTOMATICO: Aggiorna immediatamente lo stato
      setRefreshTrigger(prev => prev + 1) // Refresh completo delle transazioni pianificate
      
      // Refresh budgeting data se fornita la callback
      if (refreshBudgets && typeof refreshBudgets === 'function') {
        try {
          await refreshBudgets()
          console.log('Dati budgeting aggiornati dopo attivazione/disattivazione')
        } catch (refreshError) {
          console.error('Errore nel refresh budgeting:', refreshError)
        }
      }
      
      console.log(`Transazione ${isActive ? 'attivata' : 'disattivata'} con successo`)
    } catch (err) {
      console.error('Errore toggle active planned tx:', err.message)
      throw err
    }
  }

  return {
    // State
    plannedTransactions,
    transactionGroups,
    dueTransactions,
    
    // Modal state
    plannedTxModalOpen,
    editingPlannedTx,
    groupModalOpen,
    editingGroup,
    
    // Modal actions
    openAddPlannedTx,
    openEditPlannedTx,
    closePlannedTxModal,
    openAddGroup,
    openEditGroup,
    closeGroupModal,
    
    // CRUD actions
    savePlannedTx,
    deletePlannedTx,
    saveGroup,
    deleteGroup,
    materializePlannedTx,
    refresh,
    refreshDueTransactions,
    
    // Budgeting integration
    applyTransactionToBudget,
    applyGroupToBudgeting,
    removeTransactionFromBudgeting,
    toggleTransactionBudgeting,
    toggleTransactionActive,
  }
}

export default usePlannedTransactions
