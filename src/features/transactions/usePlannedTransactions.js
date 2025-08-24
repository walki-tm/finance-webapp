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
  }, [token])

  // 🔸 Gestione modal planned transactions
  const openAddPlannedTx = () => { setEditingPlannedTx(null); setPlannedTxModalOpen(true) }
  const openEditPlannedTx = (tx) => { setEditingPlannedTx(tx); setPlannedTxModalOpen(true) }
  const closePlannedTxModal = () => { setPlannedTxModalOpen(false); setEditingPlannedTx(null) }

  // 🔸 Gestione modal gruppi
  const openAddGroup = () => { setEditingGroup(null); setGroupModalOpen(true) }
  const openEditGroup = (group) => { setEditingGroup(group); setGroupModalOpen(true) }
  const closeGroupModal = () => { setGroupModalOpen(false); setEditingGroup(null) }

  // 🔸 CRUD transazioni pianificate
  const savePlannedTx = async (payload) => {
    const isEdit = Boolean(editingPlannedTx?.id)
    const body = {
      main: String(payload.main || 'EXPENSE').toUpperCase(),
      subId: payload.subId || null,
      subName: payload.sub || null,
      amount: Number(payload.amount || 0),
      note: payload.note || '',
      payee: payload.payee || '',
      frequency: payload.frequency,
      startDate: payload.startDate || new Date().toISOString(),
      endDate: payload.endDate || null,
      confirmationMode: payload.confirmationMode || 'MANUAL',
      groupId: payload.groupId || null,
    }

    try {
      if (isEdit) {
        const updated = await api.updatePlannedTransaction(token, editingPlannedTx.id, body)
        const normalizedMain = normalizeMainKey(updated.main)
        const normalized = { ...updated, main: normalizedMain, sub: payload.sub || updated.subcategory?.name || '' }
        setPlannedTransactions(s => s.map(t => (t.id === editingPlannedTx.id ? normalized : t)))
      } else {
        const created = await api.addPlannedTransaction(token, body)
        const normalizedMain = normalizeMainKey(created.main)
        const normalized = { ...created, main: normalizedMain, sub: payload.sub || created.subcategory?.name || '' }
        setPlannedTransactions(s => [normalized, ...s])
      }
    } catch (err) {
      console.error('Errore save planned tx:', err.message)
      throw err
    } finally {
      closePlannedTxModal()
    }
  }

  const deletePlannedTx = async (id) => {
    setPlannedTransactions(s => s.filter(t => t.id !== id))
    try {
      await api.deletePlannedTransaction(token, id)
    } catch (err) {
      console.error('Errore delete planned tx:', err.message)
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

  // 🔸 Riordinamento gruppi
  const reorderGroups = async (groupIds) => {
    try {
      await api.reorderTransactionGroups(token, groupIds)
      // Riordina localmente
      const orderedGroups = groupIds.map(id => transactionGroups.find(g => g.id === id)).filter(Boolean)
      setTransactionGroups(orderedGroups)
    } catch (err) {
      console.error('Errore reorder groups:', err.message)
    }
  }

  // 🔸 Spostamento transazioni tra gruppi
  const movePlannedTx = async (plannedTxId, groupId) => {
    try {
      const updated = await api.movePlannedTransaction(token, plannedTxId, groupId)
      const normalizedMain = normalizeMainKey(updated.main)
      const normalized = { ...updated, main: normalizedMain, sub: updated.subcategory?.name || '' }
      setPlannedTransactions(s => s.map(t => (t.id === plannedTxId ? normalized : t)))
    } catch (err) {
      console.error('Errore move planned tx:', err.message)
    }
  }

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

  // 🔸 Refresh transazioni in scadenza
  const refreshDueTransactions = async () => {
    try {
      const due = await api.getPlannedTransactionsDue(token)
      setDueTransactions(due)
    } catch (err) {
      console.error('Errore refresh due transactions:', err.message)
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
    reorderGroups,
    movePlannedTx,
    materializePlannedTx,
    refreshDueTransactions,
  }
}

export default usePlannedTransactions
