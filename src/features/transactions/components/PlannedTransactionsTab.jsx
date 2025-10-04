/**
 * 📄 PLANNED TRANSACTIONS TAB: Tab per gestione transazioni pianificate
 * 
 * 🎯 Scopo: Interfaccia principale per gestire transazioni pianificate e gruppi
 * 
 * 🔧 Dipendenze principali:
 * - usePlannedTransactions hook per state management
 * - Componenti drag-and-drop per riorganizzazione
 * - Modal per creazione/editing
 * 
 * 📝 Note:
 * - Layout cards per gruppi con aggregated info
 * - Drag-and-drop per spostamento transazioni
 * - Notifiche per transazioni in scadenza
 * 
 * @author Finance WebApp Team
 * @modified 23 Agosto 2025 - Creazione iniziale
 */

import React, { useMemo, useState } from 'react'
import { Card, CardContent, Button } from '../../ui'
import { Plus, Calendar, AlertCircle, Clock, Euro, Folder } from 'lucide-react'
import usePlannedTransactions from '../usePlannedTransactions.js'
import { useLoans } from '../../loans/useLoans.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import PlannedTransactionModal from './PlannedTransactionModal.jsx'
import TransactionGroupModal from './TransactionGroupModal.jsx'
import PlannedTransactionCard from './PlannedTransactionCard.jsx'
import TransactionGroupCard from './TransactionGroupCard.jsx'
import FilterBar from './FilterBar.jsx'
import BudgetApplicationModal from './BudgetApplicationModal.jsx'
import { useBudgetContext } from '../../../context/BudgetContext.jsx'
import { useToast } from '../../toast'
import { api } from '../../../lib/api.js'

export default function PlannedTransactionsTab({ state, onOpenAddPlannedTx, refreshTransactions }) {
  const { token } = useAuth()
  const currentYear = new Date().getFullYear()
  
  // 🔸 Filter state
  const [filters, setFilters] = useState({
    frequency: null,
    confirmationMode: null,
    dueStatus: null,
    isActive: null
  })
  
  // 🔸 Show expired transactions toggle - SEMPRE TRUE per mostrare sempre le scadute
  const [showExpired, setShowExpired] = useState(true)
  
  // 🔸 Budget application modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetModalData, setBudgetModalData] = useState(null)
  
  // 🔸 Loading state per operazioni budgeting
  const [budgetOperationLoading, setBudgetOperationLoading] = useState(new Set())
  
  // 🔸 Budgeting hook - use shared context
  const { batchUpsertBudgets, refreshBudgets } = useBudgetContext()
  
  // 💰 Loans hook per gestione prestiti
  const { refreshLoanData, skipPayment } = useLoans(token)
  
  // 🎉 Toast hook per notifiche di successo
  const toast = useToast()
  
  const {
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
    deletePlannedTx: deletePlannedTxBase,
    saveGroup,
    deleteGroup,
    materializePlannedTx,
    refresh,
    
    // Budgeting integration
    applyTransactionToBudget,
    applyGroupToBudgeting,
    toggleTransactionActive: toggleTransactionActiveBase,
  } = usePlannedTransactions(token, { refreshTransactions })
  
  // 🎉 Wrapper con toast per deletePlannedTx - CON REFRESH BUDGETING
  const deletePlannedTx = async (transactionId) => {
    try {
      // Trova la transazione da eliminare per il messaggio di toast
      const transactionToDelete = plannedTransactions.find(t => t.id === transactionId)
      
      await deletePlannedTxBase(transactionId, {
        subcats: state.subcats,
        batchUpsertBudgets,
        currentYear,
        refreshBudgets
      })
      
      // 🎆 REFRESH ESPLICITO: Aggiorna i dati di budgeting in tempo reale
      await refreshBudgets()
      
      // 🎉 TOAST DI SUCCESSO
      toast.success(
        `🗑️ ${transactionToDelete?.title || 'Transazione'} eliminata`,
        { description: 'La transazione pianificata è stata rimossa definitivamente' }
      )
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error)
      toast.error('Errore nell\'eliminazione della transazione')
      throw error
    }
  }
  
  // 🎉 Wrapper con toast per toggleTransactionActive
  const toggleTransactionActive = async (transaction, isActive, options = {}) => {
    try {
      await toggleTransactionActiveBase(transaction, isActive, {
        ...options,
        refreshBudgets
      })
      
      // 🎉 TOAST DI SUCCESSO
      const statusText = isActive ? '✅ attivata' : '⏸️ sospesa'
      toast.success(
        `${transaction.title || 'Transazione'} ${statusText}`,
        { 
          description: isActive 
            ? 'La transazione è ora attiva e verrà inclusa nei calcoli'
            : 'La transazione è stata sospesa e non apparirà più nei budget'
        }
      )
    } catch (error) {
      console.error('Errore nel toggle active:', error)
      toast.error(`Errore nell'${isActive ? 'attivazione' : 'disattivazione'} della transazione`)
      throw error
    }
  }

  // 📁 Funzione per cambiare il gruppo di una transazione
  const handleChangeGroup = async (transaction, newGroupId) => {
    try {
      // Trova il nuovo gruppo per il messaggio di toast
      const newGroup = newGroupId ? transactionGroups.find(g => g.id === newGroupId) : null
      const oldGroup = transaction.groupId ? transactionGroups.find(g => g.id === transaction.groupId) : null
      
      // Aggiorna la transazione tramite l'API
      await api.updatePlannedTransaction(token, transaction.id, {
        ...transaction,
        groupId: newGroupId
      })
      
      // Refresh dei dati
      refresh()
      
      // 🎉 TOAST DI SUCCESSO
      const groupText = newGroup ? `spostata in "${newGroup.name}"` : 'rimossa da tutti i gruppi'
      toast.success(
        `📁 ${transaction.title || 'Transazione'} ${groupText}`,
        { 
          description: oldGroup ? `Prima era in: "${oldGroup.name}"` : 'Prima non apparteneva a nessun gruppo'
        }
      )
    } catch (error) {
      console.error('Errore nel cambio gruppo:', error)
      toast.error('Errore nel cambiare il gruppo della transazione')
      throw error
    }
  }

  // 🔸 Filter logic
  const applyDueStatusFilter = (transaction, dueStatus) => {
    if (!dueStatus) return true
    
    const now = new Date()
    const dueDate = new Date(transaction.nextDueDate)
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    switch (dueStatus) {
      case 'overdue': return diffDays < 0  // Solo transazioni veramente scadute (ieri e prima)
      case 'today': return diffDays === 0  // Solo transazioni di oggi
      case 'this_week': return diffDays >= 0 && diffDays <= 7  // 🔄 FIXED: Include oggi (0) e prossimi 7 giorni
      case 'upcoming': return diffDays > 7  // Future (oltre 7 giorni)
      default: return true
    }
  }

  const filterTransactions = (transactions) => {
    return transactions.filter(tx => {
      // Filter by frequency
      if (filters.frequency && tx.frequency !== filters.frequency) return false
      
      // Filter by confirmation mode
      if (filters.confirmationMode && tx.confirmationMode !== filters.confirmationMode) return false
      
      // Filter by due status
      if (!applyDueStatusFilter(tx, filters.dueStatus)) return false
      
      // Filter by active status
      if (filters.isActive !== null && tx.isActive !== filters.isActive) return false
      
      return true
    })
  }

  // 🔸 Filter transazioni prima di organizzarle
  const filteredTransactions = useMemo(() => {
    return filterTransactions(plannedTransactions)
  }, [plannedTransactions, filters])

  // 🔸 Funzione helper per controllare se una transazione è scaduta
  const isExpired = (transaction) => {
    const now = new Date()
    const dueDate = new Date(transaction.nextDueDate)
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // 🔄 FIXED: Usa la stessa logica di applyDueStatusFilter - Solo transazioni veramente scadute (ieri e prima)
    return diffDays < 0
  }
  
  // 🔸 Funzione per ordinare transazioni (prima OK, poi scadute)
  const sortTransactions = (transactions) => {
    return transactions.sort((a, b) => {
      const aExpired = isExpired(a)
      const bExpired = isExpired(b)
      
      // Se una è scaduta e l'altra no, la non scaduta va prima
      if (aExpired !== bExpired) {
        return aExpired ? 1 : -1
      }
      
      // Altrimenti ordina per data di scadenza
      return new Date(a.nextDueDate) - new Date(b.nextDueDate)
    })
  }

// 🔸 Funzioni di gestione budgeting
const openBudgetModal = (transaction, type = 'single', transactions = null) => {
  // Se la transazione è già applicata al budgeting, rimuovila direttamente
  if (transaction.appliedToBudget) {
    handleRemoveFromBudgeting(transaction)
  } else {
    // Per transazioni MENSILI, applica direttamente senza modal
    if (transaction.frequency === 'MONTHLY') {
      handleDirectBudgetApplication(transaction)
    } else {
      // Per YEARLY e ONE_TIME, apri il modal per le opzioni
      setBudgetModalData({ transaction, type, transactions })
      setBudgetModalOpen(true)
    }
  }
}

const closeBudgetModal = () => {
  setBudgetModalOpen(false)
  setBudgetModalData(null)
}

// 🔸 Applica transazione mensile direttamente al budgeting - CON FEEDBACK IMMEDIATO
const handleDirectBudgetApplication = async (transaction) => {
  // 🎯 TOAST IMMEDIATO: Feedback istantaneo per l'utente
  toast.info(
    `⏳ Applicando ${transaction.title || 'transazione'} al budgeting...`,
    { description: 'Elaborazione in corso, attendere...' }
  )
  
  try {
    const options = {
      year: currentYear,
      mode: 'divide' // Per le mensili usiamo sempre divide
    }
    
    // API call ottimizzata
    await api.applyToBudgeting(token, transaction.id, options)
    
    // 🎆 REFRESH AUTOMATICO OTTIMIZZATO: Aggiorna in parallelo per migliori performance
    await Promise.all([
      new Promise(resolve => { refresh(); resolve(); }), // Refresh transazioni pianificate
      refreshBudgets() // Refresh dati budgeting
    ])
    
    // 🎉 TOAST DI SUCCESSO
    toast.success(
      `✅ ${transaction.title || 'Transazione'} applicata al budgeting`,
      { 
        description: `€${Math.abs(transaction.amount).toFixed(2)} mensile aggiunta ai budget ${currentYear}`
      }
    )
  } catch (error) {
    console.error('Errore nell\'applicazione diretta al budgeting:', error)
    
    // 🚨 TOAST DI ERRORE
    toast.error(
      `❌ Errore nell'applicazione al budgeting`,
      { 
        description: error.message || 'Si è verificato un errore imprevisto'
      }
    )
  }
}

// 🔸 Rimuovi transazione dal budgeting usando modalità salvata - CON FEEDBACK IMMEDIATO
const handleRemoveFromBudgeting = async (transaction) => {
  // 🎯 TOAST IMMEDIATO: Feedback istantaneo per l'utente
  toast.info(
    `⏳ Rimuovendo ${transaction.title || 'transazione'} dal budgeting...`,
    { description: 'Elaborazione in corso, attendere...' }
  )
  
  try {
    const options = {
      year: currentYear,
      // Usa la modalità salvata per transazioni annuali, altrimenti default
      mode: transaction.frequency === 'YEARLY' && transaction.budgetApplicationMode 
        ? transaction.budgetApplicationMode 
        : 'divide',
      // Includi il mese target se era stato specificato
      targetMonth: transaction.budgetTargetMonth || undefined
    }
    
    await api.removeFromBudgeting(token, transaction.id, options)
    
    // 🎆 REFRESH AUTOMATICO OTTIMIZZATO: Aggiorna in parallelo per migliori performance
    refresh() // Refresh transazioni pianificate (sincrono)
    await refreshBudgets() // Refresh dati budgeting (asincrono)
    
    // 🎉 TOAST DI SUCCESSO
    toast.success(
      `⚙️ ${transaction.title || 'Transazione'} rimossa dal budgeting`,
      { 
        description: `€${Math.abs(transaction.amount).toFixed(2)} rimossa dai budget ${currentYear}`
      }
    )
  } catch (error) {
    console.error('Errore nella rimozione dal budgeting:', error)
    
    // 🚨 TOAST DI ERRORE
    toast.error(
      `❌ Errore nella rimozione dal budgeting`,
      { 
        description: error.message || 'Si è verificato un errore imprevisto'
      }
    )
  }
}

const handleBudgetApplication = async (options) => {
  if (!budgetModalData) return
  
  const { transaction, type, transactions } = budgetModalData
  
  try {
    if (type === 'group') {
      // Applica gruppo al budgeting
      const group = transactionGroups.find(g => g.id === transactions[0]?.groupId)
      if (group) {
        await applyGroupToBudgeting(group.id, options, state.subcats, batchUpsertBudgets)
      }
    } else {
      // Applica singola transazione al budgeting usando la nuova API
      await api.applyToBudgeting(token, transaction.id, options)
    }
    
    // Chiudi il modal
    closeBudgetModal()
    
    // 🎆 REFRESH AUTOMATICO: Aggiorna entrambi i dati
    refresh() // Refresh transazioni pianificate
    await refreshBudgets() // Refresh dati budgeting
    
    // 🎉 TOAST DI SUCCESSO
    if (type === 'group') {
      const group = transactionGroups.find(g => g.id === transactions[0]?.groupId)
      const transactionCount = transactions.length
      toast.success(
        `✅ Gruppo "${group?.name || 'Gruppo'}" applicato al budgeting`,
        { description: `${transactionCount} transazioni applicate ai budget ${options.year}` }
      )
    } else {
      const application = options.mode === 'divide' ? 'distribuito' : `applicato a ${options.targetMonth ? new Date(2024, options.targetMonth - 1).toLocaleDateString('it-IT', { month: 'long' }) : options.year}`
      toast.success(
        `✅ ${transaction.title || 'Transazione'} applicata al budgeting`,
        { description: `€${Math.abs(transaction.amount).toFixed(2)} ${application}` }
      )
    }
  } catch (error) {
    console.error('Errore nell\'applicazione al budget:', error)
    alert('Errore nell\'applicazione al budget: ' + error.message)
  }
  }
  
  // 🔸 Organizza transazioni filtrate per gruppo
  const { groupedTransactions, ungroupedTransactions, expiredCount } = useMemo(() => {
    const grouped = {}
    const ungrouped = []
    
    // Conta le transazioni scadute totali per il toggle
    const totalExpiredCount = filteredTransactions.filter(tx => isExpired(tx)).length
    
    // SEMPRE mostra tutte le transazioni filtrate (incluse quelle scadute)
    const transactionsToShow = filteredTransactions
    
    transactionsToShow.forEach(tx => {
      if (tx.groupId) {
        if (!grouped[tx.groupId]) {
          grouped[tx.groupId] = []
        }
        grouped[tx.groupId].push(tx)
      } else {
        ungrouped.push(tx)
      }
    })
    
    // Ordina le transazioni in ogni gruppo e quelle non raggruppate
    Object.keys(grouped).forEach(groupId => {
      grouped[groupId] = sortTransactions(grouped[groupId])
    })
    
    const sortedUngrouped = sortTransactions(ungrouped)
    
    return { groupedTransactions: grouped, ungroupedTransactions: sortedUngrouped, expiredCount: totalExpiredCount }
  }, [filteredTransactions, showExpired])

  // 🔸 Calcola statistiche per gruppi
  const groupStats = useMemo(() => {
    const stats = {}
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentMonthYear = now.getFullYear()
    
    transactionGroups.forEach(group => {
      const transactions = groupedTransactions[group.id] || []
      
      // Calcola totalAmount solo per transazioni che contribuiscono al mese corrente
      const monthlyAmount = transactions.reduce((sum, tx) => {
        if (!tx.isActive) return sum
        
        // Per transazioni mensili, sempre includi se attiva
        if (tx.frequency === 'MONTHLY') {
          return sum + Math.abs(Number(tx.amount))
        }
        
        // Per transazioni annuali, includi solo se ricorre nel mese corrente
        if (tx.frequency === 'YEARLY') {
          const startDate = new Date(tx.startDate)
          const startMonth = startDate.getMonth()
          if (startMonth === currentMonth) {
            return sum + Math.abs(Number(tx.amount))
          }
        }
        
        // Per transazioni una tantum, includi solo se è nel mese corrente
        if (tx.frequency === 'ONE_TIME') {
          const startDate = new Date(tx.startDate)
          if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentMonthYear) {
            return sum + Math.abs(Number(tx.amount))
          }
        }
        
        return sum
      }, 0)
      
      const nextDue = transactions
        .filter(tx => tx.isActive)
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0]?.nextDueDate
      
      stats[group.id] = {
        totalAmount: monthlyAmount,
        transactionCount: transactions.length,
        activeCount: transactions.filter(tx => tx.isActive).length,
        nextDue,
      }
    })
    return stats
  }, [transactionGroups, groupedTransactions])

  return (
      <div className="space-y-6">

      {/* Pillole Informative - Riepilogo compatto e cliccabile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillola Totale Pianificate */}
        <div 
          onClick={() => setFilters(prev => ({ ...prev, isActive: prev.isActive === true ? null : true }))}
          className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 bg-white dark:bg-slate-800 bg-blue-50/80 dark:bg-blue-900/10 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-blue-500 group-hover:bg-blue-600 transition-colors shadow-sm">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {plannedTransactions.filter(tx => tx.isActive).length}
              </span>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Pianificate
              </span>
            </div>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70 group-hover:text-blue-700 dark:group-hover:text-blue-300">
              ({plannedTransactions.length} totali)
            </span>
          </div>
        </div>
        
        {/* Pillola In Scadenza */}
        <div 
          onClick={() => setFilters(prev => ({ ...prev, dueStatus: prev.dueStatus === 'this_week' ? null : 'this_week' }))}
          className={`group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 bg-white dark:bg-slate-800 cursor-pointer ${
            dueTransactions.length > 0 
              ? 'bg-orange-50/80 dark:bg-orange-900/10'
              : 'bg-slate-50/80 dark:bg-slate-900/10'
          }`}
        >
          <div className={`relative p-2 rounded-lg shadow-sm transition-colors ${
            dueTransactions.length > 0 
              ? 'bg-orange-500 group-hover:bg-orange-600'
              : 'bg-slate-500 group-hover:bg-slate-600'
          }`}>
            <Clock className="h-5 w-5 text-white" />
            {dueTransactions.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                dueTransactions.length > 0 
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {dueTransactions.length}
              </span>
              <span className={`text-xs font-medium ${
                dueTransactions.length > 0 
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                In Scadenza
              </span>
            </div>
            <span className={`text-xs ${
              dueTransactions.length > 0 
                ? 'text-orange-600/70 dark:text-orange-400/70 group-hover:text-orange-700 dark:group-hover:text-orange-300'
                : 'text-slate-600/70 dark:text-slate-400/70 group-hover:text-slate-700 dark:group-hover:text-slate-300'
            }`}>
              entro 7 giorni
            </span>
          </div>
        </div>
        
        {/* Pillola Importo Mensile */}
        <div 
          onClick={() => setFilters(prev => ({ ...prev, frequency: prev.frequency === 'MONTHLY' ? null : 'MONTHLY' }))}
          className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 bg-white dark:bg-slate-800 bg-emerald-50/80 dark:bg-emerald-900/10 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-emerald-500 group-hover:bg-emerald-600 transition-colors shadow-sm">
            <Euro className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                €{plannedTransactions
                  .filter(tx => tx.isActive && tx.frequency === 'MONTHLY')
                  .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
                  .toFixed(0)
                }
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Mensile
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600/70 dark:text-emerald-400/70">
              <span>{plannedTransactions.filter(tx => tx.isActive && tx.frequency === 'MONTHLY').length} transazioni</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info transazioni scadute - sempre visibili */}
      {expiredCount > 0 && (
        <div className="flex justify-center">
          <div className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 flex items-center gap-2">
            ⚠️ <span>Transazioni scadute: {expiredCount}</span>
          </div>
        </div>
      )}

      {/* Gruppi di transazioni */}
      {transactionGroups.length > 0 && (
        <div className="space-y-6">
          {/* Header sezione gruppi con accenti dark mode */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl"></div>
            <div className="absolute inset-0 border border-white/20 dark:border-white/5 rounded-xl"></div>
            <div className="relative flex items-center gap-3 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
              <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 shadow-sm">
                <Folder className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-1">
                  Gruppi Personalizzati
                </h3>
                <p className="text-base font-medium text-indigo-700 dark:text-indigo-300">
                  {transactionGroups.length} gruppi organizzati
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {transactionGroups.map(group => (
              <TransactionGroupCard
                key={group.id}
                group={group}
                transactions={groupedTransactions[group.id] || []}
                stats={groupStats[group.id]}
                onEdit={() => openEditGroup(group)}
                onDelete={() => deleteGroup(group.id)}
                onEditTransaction={openEditPlannedTx}
                onDeleteTransaction={deletePlannedTx}
                onMaterialize={async (txId) => {
                  try {
                    // Get transaction details to check if it's a loan payment
                    const transaction = plannedTransactions.find(tx => tx.id === txId)
                    
                    const result = await materializePlannedTx(transaction)
                    
                    // If this was a loan payment, refresh the loan data (payment already processed by materialize)
                    if (transaction?.loanId && result) {
                      await refreshLoanData(transaction.loanId)
                    }
                    
                    // Small delay to ensure backend sync operations complete
                    setTimeout(() => {
                      refresh()
                      // ✨ REFRESH delle transazioni per mostrare la nuova transazione materializzata
                      if (refreshTransactions) {
                        refreshTransactions()
                      }
                    }, 500) // Increased delay to allow backend sync
                    
                    toast.success(`💰 Transazione materializzata`, {
                      description: `€${Math.abs(result?.amount || 0).toFixed(2)} registrata con successo`
                    })
                    
                    return result
                  } catch (error) {
                    console.error('❌ Error in materialize:', error)
                    toast.error('Errore nella materializzazione: ' + (error.message || 'Riprova.'))
                    throw error
                  }
                }}
                onApplyToBudgeting={(transaction) => openBudgetModal(transaction, 'single')}
                onApplyGroupToBudgeting={(transactions) => openBudgetModal(null, 'group', transactions)}
                onToggleActive={(transaction, isActive) => toggleTransactionActive(transaction, isActive, { refreshBudgets })}
                onSkipLoanPayment={async (transaction, skipData) => {
                  if (!transaction.loanId) return
                  
                  try {
                    // Se il skip è già stato completato dal card, fai solo refresh
                    if (skipData?.skipCompleted && skipData?.refreshOnly) {
                      // Solo refresh dei dati senza operazioni aggiuntive
                      refresh()
                      
                      toast.success(`⏭️ Rata saltata per ${transaction.title || 'transazione'}`, {
                        description: 'Il prossimo pagamento è stato spostato al mese successivo'
                      })
                      return
                    }
                    
                    // Fallback: chiamata diretta API (non dovrebbe mai essere eseguita ora)
                    const result = await api.skipLoanPayment(token, transaction.loanId)
                    
                    // 🆕 FORZA REFRESH COMPLETO: Incrementa il trigger per bypassare completamente la cache
                    refresh() // Questo chiama setRefreshTrigger(prev => prev + 1) internamente
                    
                    toast.success(`⏭️ Rata saltata per ${transaction.title || 'transazione'}`, {
                      description: 'Il prossimo pagamento è stato spostato al mese successivo'
                    })
                  } catch (error) {
                    console.error('❌ Errore nel saltare la rata:', error)
                    toast.error('Errore nel saltare la rata: ' + (error.message || 'Riprova.'))
                  }
                }}
                onChangeGroup={handleChangeGroup}
                subcats={state.subcats}
                mains={state.mains}
                groups={transactionGroups}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transazioni non raggruppate */}
      {ungroupedTransactions.length > 0 && (
        <div className="space-y-6">
          {/* Header sezione transazioni singole con accenti dark mode */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl"></div>
            <div className="absolute inset-0 border border-white/20 dark:border-white/5 rounded-xl"></div>
            <div className="relative flex items-center gap-3 p-5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shadow-sm">
                <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">
                  Transazioni Singole
                </h3>
                <p className="text-base font-medium text-emerald-700 dark:text-emerald-300">
                  {ungroupedTransactions.length} transazioni indipendenti
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {ungroupedTransactions.map((tx, index) => (
              <PlannedTransactionCard
                key={tx.id}
                transaction={tx}
                onEdit={() => openEditPlannedTx(tx)}
                onDelete={() => deletePlannedTx(tx.id)}
                onMaterialize={async () => {
                  try {
                    const result = await materializePlannedTx(tx)
                    
                    // If this was a loan payment, refresh the loan data (payment already processed by materialize)
                    if (tx.loanId && result) {
                      await refreshLoanData(tx.loanId)
                    }
                    
                    // Small delay to ensure backend sync operations complete
                    setTimeout(() => {
                      refresh()
                      // ✨ REFRESH delle transazioni per mostrare la nuova transazione materializzata
                      if (refreshTransactions) {
                        refreshTransactions()
                      }
                    }, 500) // Increased delay to allow backend sync
                    
                    toast.success(`💰 Transazione materializzata`, {
                      description: `€${Math.abs(result?.amount || 0).toFixed(2)} registrata con successo`
                    })
                    
                    return result
                  } catch (error) {
                    console.error('❌ Error in materialize:', error)
                    toast.error('Errore nella materializzazione: ' + (error.message || 'Riprova.'))
                    throw error
                  }
                }}
                onApplyToBudgeting={(transaction) => openBudgetModal(transaction, 'single')}
                onToggleActive={(transaction, isActive) => toggleTransactionActive(transaction, isActive, { refreshBudgets })}
                onSkipLoanPayment={async (transaction, skipData) => {
                  if (!transaction.loanId) return
                  
                  try {
                    // Se il skip è già stato completato dal card, fai solo refresh
                    if (skipData?.skipCompleted && skipData?.refreshOnly) {
                      // Solo refresh dei dati senza operazioni aggiuntive
                      setTimeout(() => {
                        refresh()
                      }, 500) // Delay ridotto per refresh
                      
                      toast.success(`⏭️ Rata saltata per ${transaction.title || 'transazione'}`, {
                        description: 'Il prossimo pagamento è stato spostato al mese successivo'
                      })
                      return
                    }
                    
                    // Fallback: chiamata diretta API (non dovrebbe mai essere eseguita ora)
                    const result = await api.skipLoanPayment(token, transaction.loanId)
                    
                    // 🕰️ Aspetta un momento per permettere al database di aggiornarsi completamente
                    setTimeout(() => {
                      // 🆕 FORZA REFRESH COMPLETO: Incrementa il trigger per bypassare completamente la cache
                      refresh() // Questo chiama setRefreshTrigger(prev => prev + 1) internamente
                    }, 1000) // Delay di 1 secondo per permettere al sync di completarsi
                    
                    toast.success(`⏭️ Rata saltata per ${transaction.title || 'transazione'}`, {
                      description: 'Il prossimo pagamento è stato spostato al mese successivo'
                    })
                  } catch (error) {
                    console.error('❌ Errore nel saltare la rata:', error)
                    toast.error('Errore nel saltare la rata: ' + (error.message || 'Riprova.'))
                  }
                }}
                onChangeGroup={handleChangeGroup}
                subcats={state.subcats}
                mains={state.mains}
                groups={transactionGroups}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {plannedTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Nessuna transazione pianificata
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Inizia creando la tua prima transazione ricorrente o programmata.
            </p>
            <Button 
              onClick={openAddPlannedTx}
              className="bg-gradient-to-tr from-sky-600 to-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crea Prima Transazione
            </Button>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Nessuna transazione trovata
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Prova a modificare i filtri per visualizzare altre transazioni pianificate.
            </p>
            <Button 
              onClick={() => setFilters({
                frequency: null,
                confirmationMode: null,
                dueStatus: null,
                isActive: null
              })}
              variant="outline"
            >
              Reset Filtri
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Modal per transazioni pianificate */}
      <PlannedTransactionModal
        open={plannedTxModalOpen}
        onClose={closePlannedTxModal}
        onSave={(payload) => savePlannedTx(payload, {
          subcats: state.subcats,
          batchUpsertBudgets,
          currentYear,
          refreshBudgets
        })}
        initial={editingPlannedTx}
        subcats={state.subcats}
        mains={state.mains}
        groups={transactionGroups}
      />

      {/* Modal per gruppi */}
      <TransactionGroupModal
        open={groupModalOpen}
        onClose={closeGroupModal}
        onSave={saveGroup}
        initial={editingGroup}
      />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {/* Pulsante secondario per gruppo */}
        <button
          onClick={openAddGroup}
          className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          title="Nuovo Gruppo"
        >
          <Folder className="h-5 w-5" />
        </button>
        
      {/* Pulsante principale per transazione */}
        <button
          onClick={openAddPlannedTx}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
          title="Nuova Transazione Pianificata"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Modal per applicazione al budgeting */}
      <BudgetApplicationModal
        open={budgetModalOpen}
        onClose={closeBudgetModal}
        onConfirm={handleBudgetApplication}
        transaction={budgetModalData?.transaction}
        transactions={budgetModalData?.transactions}
        year={currentYear}
        type={budgetModalData?.type}
      />
    </div>
  )
}
