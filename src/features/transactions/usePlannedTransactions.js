import { useEffect, useState, useRef } from 'react'
import { api } from '../../lib/api.js'
import { triggerBalanceRefresh } from '../app/useBalance.js'

const normalizeMainKey = (main) => {
  const u = String(main || 'EXPENSE').toUpperCase()
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' }
  return map[u] || u.toLowerCase()
}

// 🔥 SINGLETON PATTERN: Una sola istanza di dati per tutta l'app
let GLOBAL_PLANNED_TRANSACTIONS_DATA = {
  data: [],
  groups: [],
  isLoading: false,
  groupsLoading: false,
  hasLoaded: false,
  groupsLoaded: false,
  error: null,
  subscribers: new Set(),
  modalState: {
    plannedTxOpen: false,
    editingPlannedTx: null,
    groupOpen: false,
    editingGroup: null
  }
}

let API_CALL_IN_PROGRESS = false
let GROUPS_API_CALL_IN_PROGRESS = false

// 🔥 SINGLETON API CALL: Una sola chiamata per tutta l'app
async function loadPlannedTransactionsGlobal(token) {
  if (!token || GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded || API_CALL_IN_PROGRESS) {
    console.log('🛡️ Skipping API call - already loaded or in progress')
    return
  }
  
  console.log('🚀 SINGLETON: Loading planned transactions globally...')
  API_CALL_IN_PROGRESS = true
  GLOBAL_PLANNED_TRANSACTIONS_DATA.isLoading = true
  
  try {
    const planned = await api.listPlannedTransactions(token)
    console.log('✅ SINGLETON: API returned:', planned?.length || 0, 'transactions')
    
    // Fix next_execution undefined
    const fixedPlanned = planned.map(tx => {
      if (!tx.next_execution) {
        const now = new Date()
        let nextExecution
        
        switch (tx.frequency) {
          case 'MONTHLY':
            nextExecution = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            break
          case 'QUARTERLY': 
            nextExecution = new Date(now.getFullYear(), now.getMonth() + 3, 1)
            break
          case 'SEMIANNUAL':
            nextExecution = new Date(now.getFullYear(), now.getMonth() + 6, 1)
            break
          case 'YEARLY':
            nextExecution = new Date(now.getFullYear() + 1, now.getMonth(), 1)
            break
          default:
            nextExecution = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
        
        return { ...tx, next_execution: nextExecution.toISOString() }
      }
      return tx
    })
    
    GLOBAL_PLANNED_TRANSACTIONS_DATA.data = fixedPlanned
    GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = true
    GLOBAL_PLANNED_TRANSACTIONS_DATA.isLoading = false
    GLOBAL_PLANNED_TRANSACTIONS_DATA.error = null
    
    console.log('✅ SINGLETON: Data saved globally, notifying', GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.size, 'subscribers')
    
    // Notify all subscribers
    GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => {
      try {
        callback()
      } catch (err) {
        console.error('Error in subscriber callback:', err)
      }
    })
    
  } catch (error) {
    console.error('❌ SINGLETON: Error loading planned transactions:', error)
    GLOBAL_PLANNED_TRANSACTIONS_DATA.data = []
    GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = true
    GLOBAL_PLANNED_TRANSACTIONS_DATA.isLoading = false
    GLOBAL_PLANNED_TRANSACTIONS_DATA.error = error
    
    // Notify subscribers of error
    GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => {
      try {
        callback()
      } catch (err) {
        console.error('Error in subscriber callback:', err)
      }
    })
  } finally {
    API_CALL_IN_PROGRESS = false
  }
}

// 🔥 SINGLETON API CALL for Groups: Una sola chiamata per tutta l'app
async function loadTransactionGroupsGlobal(token) {
  if (!token || GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoaded || GROUPS_API_CALL_IN_PROGRESS) {
    console.log('🛡️ Skipping Groups API call - already loaded or in progress')
    return
  }
  
  console.log('🚀 SINGLETON: Loading transaction groups globally...')
  GROUPS_API_CALL_IN_PROGRESS = true
  GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoading = true
  
  try {
    const groups = await api.listTransactionGroups(token)
    console.log('✅ SINGLETON: Groups API returned:', groups?.length || 0, 'groups')
    
    GLOBAL_PLANNED_TRANSACTIONS_DATA.groups = Array.isArray(groups) ? groups : []
    GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoaded = true
    GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoading = false
    
    console.log('✅ SINGLETON: Groups saved globally, notifying', GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.size, 'subscribers')
    
    // Notify all subscribers
    GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => {
      try {
        callback()
      } catch (err) {
        console.error('Error in groups subscriber callback:', err)
      }
    })
    
  } catch (error) {
    console.error('❌ SINGLETON: Error loading transaction groups:', error)
    GLOBAL_PLANNED_TRANSACTIONS_DATA.groups = []
    GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoaded = true
    GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoading = false
    
    // Notify subscribers of error
    GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => {
      try {
        callback()
      } catch (err) {
        console.error('Error in groups subscriber callback:', err)
      }
    })
  } finally {
    GROUPS_API_CALL_IN_PROGRESS = false
  }
}

export function usePlannedTransactions(token, options = {}) {
  console.log('🔥 SINGLETON usePlannedTransactions - Shared data approach')
  
  const [, forceUpdate] = useState(0)
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))
  
  console.log('🏷️ Instance:', instanceId.current, 'Global hasLoaded:', GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded)
  // 🔥 SINGLETON: Subscribe to global data changes
  useEffect(() => {
    const updateCallback = () => {
      console.log('🔔 Instance', instanceId.current, 'received update from singleton')
      forceUpdate(prev => prev + 1)
    }
    
    GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.add(updateCallback)
    
    // Load data if not already loaded
    loadPlannedTransactionsGlobal(token)
    loadTransactionGroupsGlobal(token)
    
    return () => {
      console.log('🧹 Instance', instanceId.current, 'unsubscribing')
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.delete(updateCallback)
    }
  }, [token])
  
  // 📅 Calculate due transactions (scadute)
  const dueTransactions = GLOBAL_PLANNED_TRANSACTIONS_DATA.data.filter(tx => {
    if (!tx.isActive) return false // Skip inactive
    if (!tx.next_execution) return false // Skip without execution date
    
    try {
      const nextExec = new Date(tx.next_execution)
      const now = new Date()
      
      // Check if date is valid
      if (isNaN(nextExec.getTime())) {
        console.warn('⚠️ Invalid next_execution date for due calculation:', tx.id, tx.next_execution)
        return false
      }
      
      // Transaction is due if next_execution is in the past or today
      const isDue = nextExec <= now
      
      if (isDue) {
        console.log('📅 Due transaction found:', {
          id: tx.id,
          description: tx.description || tx.name,
          amount: tx.amount,
          next_execution: tx.next_execution,
          daysOverdue: Math.floor((now.getTime() - nextExec.getTime()) / (1000 * 60 * 60 * 24))
        })
      }
      
      return isDue
    } catch (error) {
      console.error('❌ Error calculating due status for transaction:', tx.id, error)
      return false
    }
  })
  
  console.log('📅 Total due transactions found:', dueTransactions.length)
  
  return {
    // 🔥 SINGLETON VERSION - Use global shared data
    plannedTransactions: GLOBAL_PLANNED_TRANSACTIONS_DATA.data,
    transactionGroups: GLOBAL_PLANNED_TRANSACTIONS_DATA.groups,
    dueTransactions,
    isLoading: GLOBAL_PLANNED_TRANSACTIONS_DATA.isLoading,
    
    // Debug info
    debugInfo: { 
      instanceId: instanceId.current, 
      hasLoaded: GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded,
      groupsLoaded: GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoaded,
      dataCount: GLOBAL_PLANNED_TRANSACTIONS_DATA.data.length,
      groupsCount: GLOBAL_PLANNED_TRANSACTIONS_DATA.groups.length,
      dueCount: dueTransactions.length,
      subscribers: GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.size
    },
    
    // Modal state - Global modal management
    plannedTxModalOpen: GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState?.plannedTxOpen || false,
    editingPlannedTx: GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState?.editingPlannedTx || null,
    groupModalOpen: GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState?.groupOpen || false,
    editingGroup: GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState?.editingGroup || null,
    
    // Actions - Full functionality restored
    openAddPlannedTx: () => {
      console.log('🔥 Opening add planned tx modal')
      GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState = {
        ...GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState,
        plannedTxOpen: true,
        editingPlannedTx: null
      }
      // Notify subscribers
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => callback())
    },
    
    openEditPlannedTx: (tx) => {
      console.log('🔥 Opening edit planned tx modal for:', tx?.id)
      GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState = {
        ...GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState,
        plannedTxOpen: true,
        editingPlannedTx: tx
      }
      // Notify subscribers
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => callback())
    },
    
    closePlannedTxModal: () => {
      console.log('🔥 Closing planned tx modal')
      GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState = {
        ...GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState,
        plannedTxOpen: false,
        editingPlannedTx: null
      }
      // Notify subscribers
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => callback())
    },
    
    openAddGroup: () => {
      console.log('🔥 Opening add group modal')
      GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState = {
        ...GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState,
        groupOpen: true,
        editingGroup: null
      }
      // Notify subscribers
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => callback())
    },
    
    openEditGroup: (group) => {
      console.log('🔥 Opening edit group modal for:', group?.id)
      GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState = {
        ...GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState,
        groupOpen: true,
        editingGroup: group
      }
      // Notify subscribers
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => callback())
    },
    
    closeGroupModal: () => {
      console.log('🔥 Closing group modal')
      GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState = {
        ...GLOBAL_PLANNED_TRANSACTIONS_DATA.modalState,
        groupOpen: false,
        editingGroup: null
      }
      // Notify subscribers
      GLOBAL_PLANNED_TRANSACTIONS_DATA.subscribers.forEach(callback => callback())
    },
    
    refresh: () => {
      console.log('🔄 SINGLETON: Manual refresh - clearing global data')
      GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = false
      GLOBAL_PLANNED_TRANSACTIONS_DATA.data = []
      GLOBAL_PLANNED_TRANSACTIONS_DATA.groupsLoaded = false
      GLOBAL_PLANNED_TRANSACTIONS_DATA.groups = []
      loadPlannedTransactionsGlobal(token)
      loadTransactionGroupsGlobal(token)
    },
    
    materializePlannedTx: async (plannedTx) => {
      console.log('💎 Materializing planned transaction:', plannedTx?.id)
      try {
        const result = await api.materializePlannedTransaction(token, plannedTx.id)
        console.log('✅ Transaction materialized successfully')
        // Refresh data after materialization
        GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = false
        await loadPlannedTransactionsGlobal(token)
        // Trigger balance refresh
        triggerBalanceRefresh()
        return result
      } catch (error) {
        console.error('❌ Error materializing transaction:', error)
        throw error
      }
    },
    
    savePlannedTx: async (data) => {
      console.log('💾 Saving planned transaction:', data)
      try {
        const result = data.id 
          ? await api.updatePlannedTransaction(token, data.id, data)
          : await api.createPlannedTransaction(token, data)
        console.log('✅ Planned transaction saved successfully')
        // Refresh data after save
        GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = false
        await loadPlannedTransactionsGlobal(token)
        return result
      } catch (error) {
        console.error('❌ Error saving planned transaction:', error)
        throw error
      }
    },
    
    deletePlannedTx: async (id) => {
      console.log('🗑️ Deleting planned transaction:', id)
      try {
        const result = await api.deletePlannedTransaction(token, id)
        console.log('✅ Planned transaction deleted successfully')
        // Refresh data after delete
        GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = false
        await loadPlannedTransactionsGlobal(token)
        return result
      } catch (error) {
        console.error('❌ Error deleting planned transaction:', error)
        throw error
      }
    },
    
    saveGroup: async (data) => {
      console.log('💾 Saving group:', data)
      try {
        const result = data.id 
          ? await api.updateTransactionGroup(token, data.id, data)
          : await api.createTransactionGroup(token, data)
        console.log('✅ Group saved successfully')
        // Refresh data after save
        GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = false
        await loadPlannedTransactionsGlobal(token)
        return result
      } catch (error) {
        console.error('❌ Error saving group:', error)
        throw error
      }
    },
    
    deleteGroup: async (id) => {
      console.log('🗑️ Deleting group:', id)
      try {
        const result = await api.deleteTransactionGroup(token, id)
        console.log('✅ Group deleted successfully')
        // Refresh data after delete
        GLOBAL_PLANNED_TRANSACTIONS_DATA.hasLoaded = false
        await loadPlannedTransactionsGlobal(token)
        return result
      } catch (error) {
        console.error('❌ Error deleting group:', error)
        throw error
      }
    }
  }
}

export default usePlannedTransactions
