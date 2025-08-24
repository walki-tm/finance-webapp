/**
 * 📄 PLANNED TRANSACTION CARD: Card avanzata per transazioni pianificate
 * 
 * 🎯 Features:
 * - Visualizzazione anteprima prossime occorrenze
 * - Badge per stato e modalità conferma
 * - Indicatori colorati per scadenze
 * - Menu contestuale per azioni
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../../ui'
import { Calendar, Clock, Settings, MoreHorizontal, ChevronDown, ChevronUp, Edit, Trash2, Play, MoreVertical } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'
import { MAIN_CATS } from '../../../lib/constants.js'

export default function PlannedTransactionCard({ 
  transaction, 
  onEdit, 
  onDelete, 
  onMaterialize,
  onMove,
  availableGroups = [],
  subcats = {},
  mains = []
}) {
  const { token } = useAuth()
  const [showOccurrences, setShowOccurrences] = useState(false)
  const [nextOccurrences, setNextOccurrences] = useState([])
  const [loadingOccurrences, setLoadingOccurrences] = useState(false)

  // 🔸 Trova main category per colori e icone
  const selectedMainCat = useMemo(() => {
    return MAIN_CATS.find(cat => cat.key === transaction.main)
  }, [transaction.main])
  
  // 🔸 Menu state per quick actions
  const [showQuickActions, setShowQuickActions] = useState(false)
  
  // 🔸 Helper functions
  const formatFrequency = (freq) => {
    switch (freq) {
      case 'MONTHLY': return 'Mensile'
      case 'YEARLY': return 'Annuale'  
      case 'ONE_TIME': return 'Una volta'
      default: return freq
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT')
  }

  const getDaysUntilDue = () => {
    const now = new Date()
    const dueDate = new Date(transaction.nextDueDate)
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = () => {
    if (!transaction.isActive) {
      return { text: 'Inattiva', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
    }

    const daysUntil = getDaysUntilDue()
    if (daysUntil < 0) {
      return { text: 'In scadenza', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
    } else if (daysUntil === 0) {
      return { text: 'Oggi', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }
    } else if (daysUntil <= 7) {
      return { text: `${daysUntil}g`, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }
    } else {
      return { text: 'Programmata', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
    }
  }

  const getConfirmationBadge = () => {
    return transaction.confirmationMode === 'AUTOMATIC' 
      ? { text: 'Auto', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
      : { text: 'Manuale', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
  }

  // 🔸 Load next occurrences
  const loadNextOccurrences = async () => {
    if (transaction.frequency === 'ONE_TIME' || loadingOccurrences || nextOccurrences.length > 0) return
    
    setLoadingOccurrences(true)
    try {
      const result = await api.getNextOccurrences(token, transaction.startDate, transaction.frequency, 5)
      setNextOccurrences(result.data || result)
    } catch (error) {
      console.error('Error loading next occurrences:', error)
    } finally {
      setLoadingOccurrences(false)
    }
  }

  const toggleOccurrences = () => {
    if (!showOccurrences) {
      loadNextOccurrences()
    }
    setShowOccurrences(!showOccurrences)
  }

  const statusBadge = getStatusBadge()
  const confirmBadge = getConfirmationBadge()
  const isDue = transaction.nextDueDate && new Date(transaction.nextDueDate) <= new Date()

  return (
    <Card className={`relative group hover:shadow-md transition-all duration-200 overflow-hidden ${
      isDue ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''
    }`}>
      {/* 🔸 Category color bar */}
      {selectedMainCat && (
        <div 
          className="absolute top-0 left-0 w-1 h-full" 
          style={{ backgroundColor: selectedMainCat.color }}
        />
      )}
      
      <CardContent className="p-4 pl-6">
        <div className="space-y-3">
          {/* 🔸 Header con icona, titolo/categoria e amount */}
          <div className="flex items-start gap-3">
            {/* Category Icon */}
            {selectedMainCat && (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${selectedMainCat.color}20` }}
              >
                <selectedMainCat.icon 
                  className="w-5 h-5" 
                  style={{ color: selectedMainCat.color }} 
                />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title o fallback */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {transaction.title || '(senza titolo)'}
                </h3>
                
                {/* Quick Actions */}
                <div className="relative">
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4 text-slate-500" />
                  </button>
                  
                  {/* Quick Actions Menu */}
                  {showQuickActions && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowQuickActions(false)}
                      />
                      <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
                        {isDue && transaction.isActive && (
                          <button
                            onClick={() => {
                              onMaterialize()
                              setShowQuickActions(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Play className="w-4 h-4 text-green-500" />
                            Conferma
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onEdit()
                            setShowQuickActions(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                          Modifica
                        </button>
                        <button
                          onClick={() => {
                            onDelete(transaction.id)
                            setShowQuickActions(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          Elimina
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Amount e badges */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg font-bold ${
                  Number(transaction.amount) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  €{Math.abs(Number(transaction.amount)).toFixed(2)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${confirmBadge.className}`}>
                  {confirmBadge.text}
                </span>
              </div>
              
              {/* Meta info */}
              <div className="space-y-1">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedMainCat?.name} • {transaction.subcategory?.name || 'Nessuna sottocategoria'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{formatFrequency(transaction.frequency)}</span>
                  {transaction.endDate && (
                    <>
                      <span>•</span>
                      <span>Fine: {formatDate(transaction.endDate)}</span>
                    </>
                  )}
                  {!transaction.endDate && transaction.frequency !== 'ONE_TIME' && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">Senza fine</span>
                    </>
                  )}
                </div>
                {transaction.payee && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    🏦 {transaction.payee}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 🔸 Next due date */}
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Prossima: <span className="font-medium">{formatDate(transaction.nextDueDate)}</span>
              </span>
              {transaction.frequency !== 'ONE_TIME' && (
                <button
                  onClick={toggleOccurrences}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Anteprima
                  {showOccurrences ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
          
          {/* 🔸 Next occurrences preview */}
          {showOccurrences && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Prossime occorrenze:
              </div>
              {loadingOccurrences ? (
                <div className="text-xs text-slate-500">Caricamento...</div>
              ) : (
                <div className="space-y-1">
                  {nextOccurrences.slice(0, 4).map((date, index) => (
                    <div key={index} className="text-xs text-slate-600 dark:text-slate-400">
                      {index + 1}. {formatDate(date)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 🔸 Note */}
          {transaction.note && (
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-2 rounded">
              {transaction.note}
            </div>
          )}
          
          {/* 🔸 Actions */}
          {isDue && transaction.isActive && (
            <button
              onClick={onMaterialize}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              <Clock className="h-4 w-4 inline-block mr-1" />
              Conferma Transazione
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
