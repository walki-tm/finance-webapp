/**
 * 🚨 DUE TRANSACTIONS ALERT: Banner per transazioni in scadenza
 * 
 * 🎯 Features:
 * - Banner prominente per transazioni overdue/oggi
 * - Azione "Conferma tutto" per transazioni manuali
 * - Lista collassabile con dettagli
 * - Animazioni e visual feedback
 */

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '../../ui'
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react'

export default function DueTransactionsAlert({ dueTransactions = [], onMaterialize }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmingAll, setConfirmingAll] = useState(false)
  
  // 🔸 Separa transazioni per tipo
  const categorizedTransactions = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdue = []
    const dueToday = []
    
    dueTransactions.forEach(tx => {
      const dueDate = new Date(tx.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        overdue.push(tx)
      } else if (dueDate.getTime() === today.getTime()) {
        dueToday.push(tx)
      }
    })
    
    return { overdue, dueToday }
  }, [dueTransactions])
  
  // 🔸 Conta transazioni manuali
  const manualTransactions = useMemo(() => {
    return dueTransactions.filter(tx => tx.confirmationMode === 'MANUAL')
  }, [dueTransactions])
  
  if (dueTransactions.length === 0) return null
  
  // 🔸 Conferma tutte le transazioni manuali
  const handleConfirmAll = async () => {
    if (manualTransactions.length === 0) return
    
    setConfirmingAll(true)
    try {
      // Materializza tutte le transazioni manuali in parallelo
      await Promise.all(
        manualTransactions.map(tx => onMaterialize(tx.id))
      )
    } catch (error) {
      console.error('Error confirming all transactions:', error)
    } finally {
      setConfirmingAll(false)
    }
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT')
  }
  
  const getDaysOverdue = (date) => {
    const today = new Date()
    const dueDate = new Date(date)
    const diffTime = today - dueDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 shadow-md">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 🔸 Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="relative">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                {categorizedTransactions.overdue.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-orange-900 dark:text-orange-100 text-lg">
                  {categorizedTransactions.overdue.length > 0 && categorizedTransactions.dueToday.length > 0 && (
                    `${categorizedTransactions.overdue.length} in ritardo, ${categorizedTransactions.dueToday.length} oggi`
                  )}
                  {categorizedTransactions.overdue.length > 0 && categorizedTransactions.dueToday.length === 0 && (
                    `${categorizedTransactions.overdue.length} transazioni in ritardo`
                  )}
                  {categorizedTransactions.overdue.length === 0 && categorizedTransactions.dueToday.length > 0 && (
                    `${categorizedTransactions.dueToday.length} transazioni in scadenza oggi`
                  )}
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {categorizedTransactions.overdue.length > 0 
                    ? 'Alcune transazioni sono in ritardo e richiedono attenzione immediata'
                    : 'Transazioni pianificate da confermare oggi'
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {manualTransactions.length > 0 && (
                <button
                  onClick={handleConfirmAll}
                  disabled={confirmingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {confirmingAll ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confermando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Conferma tutto ({manualTransactions.length})
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 px-3 py-2 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800/30 rounded-lg text-sm transition-colors"
              >
                {expanded ? 'Nascondi' : 'Dettagli'}
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* 🔸 Preview (sempre visibile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueTransactions.slice(0, expanded ? dueTransactions.length : 3).map(tx => {
              const daysOverdue = getDaysOverdue(tx.nextDueDate)
              const isOverdue = daysOverdue > 0
              
              return (
                <div 
                  key={tx.id} 
                  className={`p-3 rounded-lg border ${
                    isOverdue 
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-white border-orange-200 dark:bg-slate-800 dark:border-orange-700'
                  } transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {tx.title || '(senza titolo)'}
                      </div>
                      <div className={`text-lg font-bold ${
                        Number(tx.amount) >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        €{Math.abs(Number(tx.amount)).toFixed(2)}
                      </div>
                    </div>
                    
                    {isOverdue && (
                      <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                        +{daysOverdue}g
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {tx.subcategory?.name || 'Nessuna sottocategoria'}
                    </div>
                    
                    {tx.confirmationMode === 'MANUAL' && (
                      <button
                        onClick={() => onMaterialize(tx.id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          isOverdue
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 inline-block mr-1" />
                        Conferma
                      </button>
                    )}
                    
                    {tx.confirmationMode === 'AUTOMATIC' && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Auto
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* 🔸 Show more indicator */}
          {!expanded && dueTransactions.length > 3 && (
            <div className="text-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
              >
                Mostra altre {dueTransactions.length - 3} transazioni
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
