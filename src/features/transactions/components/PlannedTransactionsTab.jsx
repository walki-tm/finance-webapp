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
import { Plus, Calendar, AlertCircle, Clock, Euro } from 'lucide-react'
import usePlannedTransactions from '../usePlannedTransactions.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import PlannedTransactionModal from './PlannedTransactionModal.jsx'
import TransactionGroupModal from './TransactionGroupModal.jsx'
import PlannedTransactionCard from './PlannedTransactionCard.jsx'
import TransactionGroupCard from './TransactionGroupCard.jsx'
import DueTransactionsAlert from './DueTransactionsAlert.jsx'
import FilterBar from './FilterBar.jsx'

export default function PlannedTransactionsTab({ state, onOpenAddPlannedTx }) {
  const { token } = useAuth()
  
  // 🔸 Filter state
  const [filters, setFilters] = useState({
    frequency: null,
    confirmationMode: null,
    dueStatus: null,
    isActive: null
  })
  
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
    deletePlannedTx,
    saveGroup,
    deleteGroup,
    reorderGroups,
    movePlannedTx,
    materializePlannedTx,
  } = usePlannedTransactions(token)

  // 🔸 Filter logic
  const applyDueStatusFilter = (transaction, dueStatus) => {
    if (!dueStatus) return true
    
    const now = new Date()
    const dueDate = new Date(transaction.nextDueDate)
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    switch (dueStatus) {
      case 'overdue': return diffDays < 0
      case 'today': return diffDays === 0
      case 'this_week': return diffDays > 0 && diffDays <= 7
      case 'upcoming': return diffDays > 7
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

  // 🔸 Organizza transazioni filtrate per gruppo
  const { groupedTransactions, ungroupedTransactions } = useMemo(() => {
    const grouped = {}
    const ungrouped = []
    
    filteredTransactions.forEach(tx => {
      if (tx.groupId) {
        if (!grouped[tx.groupId]) {
          grouped[tx.groupId] = []
        }
        grouped[tx.groupId].push(tx)
      } else {
        ungrouped.push(tx)
      }
    })
    
    return { groupedTransactions: grouped, ungroupedTransactions: ungrouped }
  }, [filteredTransactions])

  // 🔸 Calcola statistiche per gruppi
  const groupStats = useMemo(() => {
    const stats = {}
    transactionGroups.forEach(group => {
      const transactions = groupedTransactions[group.id] || []
      const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
      const nextDue = transactions
        .filter(tx => tx.isActive)
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0]?.nextDueDate
      
      stats[group.id] = {
        totalAmount,
        transactionCount: transactions.length,
        activeCount: transactions.filter(tx => tx.isActive).length,
        nextDue,
      }
    })
    return stats
  }, [transactionGroups, groupedTransactions])

  return (
    <div className="space-y-6">
      {/* Alert per transazioni in scadenza */}
      {dueTransactions.length > 0 && (
        <DueTransactionsAlert 
          dueTransactions={dueTransactions}
          onMaterialize={materializePlannedTx}
        />
      )}

      {/* Header con azioni */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Transazioni Pianificate
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={openAddGroup}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo Gruppo
          </Button>
          {/* CTA principale ora gestita dal componente padre per evitare ridondanza */}
        </div>
      </div>

      {/* Statistiche rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Totale Pianificate</div>
                <div className="text-lg font-semibold">{plannedTransactions.filter(tx => tx.isActive).length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">In Scadenza</div>
                <div className="text-lg font-semibold">{dueTransactions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Importo Mensile</div>
                <div className="text-lg font-semibold">
                  €{plannedTransactions
                    .filter(tx => tx.isActive && tx.frequency === 'MONTHLY')
                    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
                    .toFixed(2)
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      {plannedTransactions.length > 0 && (
        <FilterBar 
          filters={filters}
          onFiltersChange={setFilters}
          transactionsCount={filteredTransactions.length}
        />
      )}

      {/* Gruppi di transazioni */}
      {transactionGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-slate-800 dark:text-slate-200">Gruppi Personalizzati</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                onMaterialize={materializePlannedTx}
                onMoveTransaction={movePlannedTx}
                subcats={state.subcats}
                mains={state.mains}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transazioni non raggruppate */}
      {ungroupedTransactions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-slate-800 dark:text-slate-200">Transazioni Singole</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ungroupedTransactions.map(tx => (
              <PlannedTransactionCard
                key={tx.id}
                transaction={tx}
                onEdit={() => openEditPlannedTx(tx)}
                onDelete={() => deletePlannedTx(tx.id)}
                onMaterialize={() => materializePlannedTx(tx.id)}
                onMove={(groupId) => movePlannedTx(tx.id, groupId)}
                availableGroups={transactionGroups}
                subcats={state.subcats}
                mains={state.mains}
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
        onSave={savePlannedTx}
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
    </div>
  )
}
