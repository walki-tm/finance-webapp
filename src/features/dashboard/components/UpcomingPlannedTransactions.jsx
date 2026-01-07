/**
 * 📄 UPCOMING PLANNED TRANSACTIONS: Sezione prossime transazioni pianificate
 * 
 * 🎯 Scopo: Mostra le prossime 5 transazioni pianificate con dettagli, urgenza e azioni
 * 
 * 🔧 Dipendenze principali:
 * - useUpcomingPlannedTransactions per dati
 * - MAIN_CATS per colori categorie
 * - ActionsMenu per menu azioni dinamico
 * - usePlannedTransactions per materializzazione
 * 
 * 📝 Note:
 * - Colori basati su urgenza (overdue, today, urgent, soon, normal)
 * - Badge per distinguere transazioni da loan vs manuali + Automatic/Manual
 * - Pulsante "Paga" per transazioni manuali scadute
 * - Menu azioni con stesse funzionalità della PlannedTransactionCard
 * - Click per navigare al tab delle transazioni pianificate
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Aggiornamento con azioni e pagamento
 */

import React, { useMemo, useState } from 'react'
import { Card, CardContent, Badge } from '../../ui'
import { CalendarClock, CreditCard, Building2, ArrowRight, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { MAIN_CATS } from '../../../lib/constants.js'
import { nice } from '../../../lib/utils.js'
import useUpcomingPlannedTransactions from '../useUpcomingPlannedTransactions.js'
import { usePlannedTransactions } from '../../transactions/usePlannedTransactions.js'
import ActionsMenu from '../../categories/components/ActionsMenu.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'

export default function UpcomingPlannedTransactions({ token, onNavigateToPlanned, refreshTransactions }) {
  const { token: authToken } = useAuth()
  const [expandedNotes, setExpandedNotes] = useState(new Set())
  const { 
    upcomingTransactions, 
    loading, 
    hasUpcomingTransactions,
    refresh: refreshUpcoming
  } = useUpcomingPlannedTransactions(token, 5)
  
  // Hook per materializzazione e gestione transazioni pianificate
  const {
    materializePlannedTx,
    toggleTransactionActive
  } = usePlannedTransactions(authToken, { refreshTransactions })

  // 🔸 Funzione per ottenere colore in base urgenza (con supporto dark mode)
  const getUrgencyColor = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'overdue': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
      case 'today': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50'
      case 'urgent': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50'
      case 'soon': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
    }
  }

  // 🔸 Funzione per ottenere badge urgenza
  const getUrgencyBadge = (tx) => {
    if (tx.isOverdue) return { text: 'Scaduto', variant: 'destructive' }
    if (tx.isDueToday) return { text: 'Oggi', variant: 'warning' }
    if (tx.daysUntilDue <= 3) return { text: `Tra ${tx.daysUntilDue}g`, variant: 'warning' }
    if (tx.daysUntilDue <= 7) return { text: `Tra ${tx.daysUntilDue}g`, variant: 'secondary' }
    return { text: tx.formattedDate, variant: 'outline' }
  }

  // 🔸 Ottieni colore categoria
  const getCategoryColor = (main) => {
    const mainCat = MAIN_CATS.find(cat => cat.key === main?.toLowerCase())
    return mainCat?.color || '#94a3b8'
  }
  
  // 🔸 Raggruppa transazioni per periodo temporale
  const groupedTransactions = useMemo(() => {
    if (!upcomingTransactions.length) return []
    
    const groups = []
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Funzione per ottenere l'etichetta del gruppo
    const getGroupLabel = (tx) => {
      const dueDate = new Date(tx.nextDueDate)
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return { key: 'overdue', label: '🚨 Scadute', priority: 0 }
      if (diffDays === 0) return { key: 'today', label: '🗓️ Oggi', priority: 1 }
      if (diffDays === 1) return { key: 'tomorrow', label: '🌅 Domani', priority: 2 }
      if (diffDays <= 7) return { key: 'thisWeek', label: '📅 Questa settimana', priority: 3 }
      if (diffDays <= 30) return { key: 'thisMonth', label: '📆 Questo mese', priority: 4 }
      return { key: 'later', label: '🕰️ Prossimamente', priority: 5 }
    }
    
    // Raggruppa le transazioni
    const grouped = upcomingTransactions.reduce((acc, tx) => {
      const group = getGroupLabel(tx)
      if (!acc[group.key]) {
        acc[group.key] = {
          ...group,
          transactions: []
        }
      }
      acc[group.key].transactions.push(tx)
      return acc
    }, {})
    
    // Converti in array e ordina per priorità
    return Object.values(grouped).sort((a, b) => a.priority - b.priority)
  }, [upcomingTransactions])
  
  // 🔸 Funzioni di gestione
  const handleMaterialize = async (transaction) => {
    try {
      await materializePlannedTx(transaction)
      // Refresh della lista dopo materializzazione
      refreshUpcoming()
      if (refreshTransactions && typeof refreshTransactions === 'function') {
        refreshTransactions()
      }
    } catch (error) {
      console.error('Errore nella materializzazione:', error)
      alert('Errore nel pagamento della transazione: ' + (error.message || 'Riprova.'))
    }
  }
  
  const handleToggleActive = async (transaction, isActive) => {
    try {
      await toggleTransactionActive(transaction, isActive)
      // Refresh della lista dopo modifica
      refreshUpcoming()
    } catch (error) {
      console.error('Errore nell\'attivazione/disattivazione:', error)
      alert('Errore nella modifica della transazione: ' + (error.message || 'Riprova.'))
    }
  }
  
  const handleSkipLoanPayment = async (transaction) => {
    try {
      // Implementazione per saltare rata prestito (se necessario)
      console.log('Skip loan payment:', transaction.id)
      refreshUpcoming()
    } catch (error) {
      console.error('Errore nel saltare la rata:', error)
    }
  }
  
  // 🔸 Toggle note expansion
  const toggleNoteExpansion = (txId) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(txId)) {
      newExpanded.delete(txId)
    } else {
      newExpanded.add(txId)
    }
    setExpandedNotes(newExpanded)
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Prossime Transazioni</h3>
        </div>
          {hasUpcomingTransactions && (
          <button
            onClick={onNavigateToPlanned}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
          >
            Vedi tutte
            <ArrowRight className="h-4 w-4" />
          </button>
          )}
        </div>

        {hasUpcomingTransactions ? (
          <div className="space-y-4">
            {groupedTransactions.map(group => (
              <div key={group.key}>
                {/* Intestazione del gruppo */}
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {group.label}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {group.transactions.length}
                  </Badge>
                </div>
                
                {/* Transazioni del gruppo */}
                <div className="space-y-2">
                  {group.transactions.map(tx => {
                    const urgencyBadge = getUrgencyBadge(tx)
                    const categoryColor = getCategoryColor(tx.main)
                    const isDue = tx.isDueToday || tx.isOverdue
                    
                    return (
                      <div
                        key={tx.id}
                        className={`rounded-lg border transition-all hover:shadow-sm ${
                          getUrgencyColor(tx.urgencyLevel)
                        }`}
                      >
                        {/* Layout compatto con click per espandere note */}
                        <div 
                          className="p-3 cursor-pointer" 
                          onClick={() => tx.note ? toggleNoteExpansion(tx.id) : null}
                        >
                          <div className="flex items-center justify-between">
                            {/* Sinistra: Data + Titolo */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Data compatta */}
                              <div className="text-center flex-shrink-0">
                                <div className={`text-sm font-bold leading-none ${
                                  isDue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {new Date(tx.nextDueDate).getDate()}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  {new Date(tx.nextDueDate).toLocaleDateString('it-IT', { month: 'short' })}
                                </div>
                              </div>
                              
                              {/* Dot + Titolo */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: categoryColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {tx.title || tx.subcategory?.name || tx.main}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {tx.isFromLoan && (
                                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                                        <Building2 className="h-2.5 w-2.5 mr-0.5" />
                                        Prestito
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant={tx.confirmationMode === 'AUTOMATIC' ? 'default' : 'secondary'} 
                                      className="text-xs py-0 px-1.5"
                                    >
                                      {tx.confirmationMode === 'AUTOMATIC' ? '⚡ Automatico' : '👤 Manuale'}
                                    </Badge>
                                    {tx.note && (
                                      <div className="flex items-center text-slate-400 dark:text-slate-500">
                                        {expandedNotes.has(tx.id) ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                        <span className="text-xs ml-0.5">nota</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Destra: Importo centrato + Menu + Pulsante Paga */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-center">
                                <div className="text-sm font-bold" style={{ color: categoryColor }}>
                                  {tx.main?.toLowerCase() === 'income' ? '+' : '-'}{nice(Math.abs(tx.amount))}
                                </div>
                              </div>
                              
                              {/* Menu Azioni vicino al saldo */}
                              <ActionsMenu
                                customActions={[
                                  // Paga (per TUTTE le transazioni attive)
                                  ...(tx.isActive ? [{
                                    label: '💰 Paga',
                                    onClick: () => handleMaterialize(tx),
                                    variant: 'default'
                                  }] : []),
                                  // Disattiva/Attiva (per transazioni mensili non-prestiti)
                                  ...(tx.frequency === 'MONTHLY' && !tx.isFromLoan ? [{
                                    label: tx.isActive ? '🚫 Disattiva' : '▶️ Attiva',
                                    onClick: () => handleToggleActive(tx, !tx.isActive),
                                    variant: tx.isActive ? 'warning' : 'success'
                                  }] : []),
                                  // Salta Rata solo per transazioni prestiti attive
                                  ...(tx.isFromLoan && tx.isActive ? [{
                                    label: '⏭️ Salta Rata',
                                    onClick: () => handleSkipLoanPayment(tx),
                                    variant: 'warning'
                                  }] : [])
                                ]}
                              />
                              
                              {/* Pulsante Paga per transazioni manuali scadute */}
                              {isDue && tx.confirmationMode === 'MANUAL' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMaterialize(tx)
                                  }}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                                  title="Paga subito questa transazione"
                                >
                                  💳 Paga
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Seconda riga: Info aggiuntive se presenti */}
                          {(tx.payee || (isDue && tx.confirmationMode === 'AUTOMATIC')) && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                                {tx.payee && (
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {tx.payee}
                                  </span>
                                )}
                                {/* Indicatore automatico per transazioni scadute */}
                                {isDue && tx.confirmationMode === 'AUTOMATIC' && (
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <span className="animate-pulse">🤖</span>
                                    <span>Auto-pagamento attivo</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Note espandibili */}
                        {tx.note && expandedNotes.has(tx.id) && (
                          <div className="px-3 pb-3">
                            <div className="text-xs text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border-t border-slate-200 dark:border-slate-700">
                              💬 {tx.note}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <CalendarClock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm">Nessuna transazione pianificata in arrivo</p>
            <button
              onClick={onNavigateToPlanned}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
            >
              Configura transazioni pianificate
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
