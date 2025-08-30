/**
 * 📄 PLANNED TRANSACTION CARD: Card avanzata per transazioni pianificate
 * 
 * 🎯 Features:
 * - Design basato su stati visuali intuitivi
 * - Background card colorato per stato (attiva/scaduta/inattiva)
 * - Badge posizionati strategicamente con icone
 * - Mini floating action button per conferma
 * - Visualizzazione anteprima prossime occorrenze
 * 
 * 🎨 Colori per stato:
 * - Attive: verde tenue
 * - In scadenza (1-3 giorni): giallo/arancione
 * - Scadute: rosso chiaro
 * - Oggi: arancione pallido
 * - Inattive: grigio desaturato
 * 
 * @author Finance WebApp Team
 * @modified 24 Agosto 2025 - Nuovo design stati visuali
 */

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '../../ui'
import { Calendar, ChevronDown, ChevronUp, Edit, Trash2, Play, MoreVertical, GripVertical } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'
import { MAIN_CATS } from '../../../lib/constants.js'
import { getMainCategoryColors, getDueDateColors, getConfirmationModeColors } from '../../../lib/colorPalette.js'
import ActionsMenu from '../../categories/components/ActionsMenu.jsx'

export default function PlannedTransactionCard({ 
  transaction, 
  onEdit, 
  onDelete, 
  onMaterialize,
  onApplyToBudgeting,
  onToggleActive,
  subcats = {},
  mains = []
}) {
  const { token } = useAuth()
  const [showOccurrences, setShowOccurrences] = useState(false)
  const [nextOccurrences, setNextOccurrences] = useState([])
  const [loadingOccurrences, setLoadingOccurrences] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  // 🔸 Trova main category per colori e icone
  const selectedMainCat = useMemo(() => {
    return MAIN_CATS.find(cat => cat.key === transaction.main)
  }, [transaction.main])
  
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

  // 🎨 Usa la nuova palette colori per uniformità
  const daysUntil = getDaysUntilDue()
  const dueDateColors = getDueDateColors(daysUntil, transaction.isActive, transaction.nextDueDate)
  const confirmationColors = getConfirmationModeColors(transaction.confirmationMode)
  const mainColors = getMainCategoryColors(transaction.main)

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

  const isDue = transaction.nextDueDate && new Date(transaction.nextDueDate) <= new Date()

  return (
    <Card className={`group transition-all duration-200 rounded-xl ${dueDateColors.card} ${dueDateColors.cardShadow} overflow-hidden`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Riga 1: Titolo + Stato (badge a destra) */}
          <div className="flex items-start justify-between">
            <h3 className={`font-semibold text-slate-900 dark:text-slate-100 ${dueDateColors.textOpacity} flex-1 min-w-0 pr-2`}>
              {transaction.title || '(senza titolo)'}
            </h3>
            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${dueDateColors.badge} flex items-center gap-1 flex-shrink-0`}>
              <span className="text-sm">{dueDateColors.icon}</span>
              <span>{dueDateColors.text}</span>
            </div>
          </div>

          {/* Riga 2: Importo grande e colorato */}
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${
              Number(transaction.amount) >= 0 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-red-600 dark:text-red-400'
            } ${dueDateColors.textOpacity}`}>
              €{Math.abs(Number(transaction.amount)).toFixed(2)}
            </span>
            {/* Action button compatto se necessario */}
            {isDue && transaction.isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMaterialize()
                }}
                className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex-shrink-0"
              >
                ✓ Conferma
              </button>
            )}
          </div>

          {/* Riga 3: Categoria (icona + nome) */}
          <div className="flex items-center gap-2">
            <div 
              className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1"
              style={{ 
                backgroundColor: mainColors.light,
                color: mainColors.dark
              }}
            >
              {selectedMainCat && (
                <selectedMainCat.icon className="h-3 w-3" />
              )}
              {selectedMainCat?.name || transaction.main}
            </div>
            {transaction.subcategory?.name && (
              <span className="text-xs text-slate-600 dark:text-slate-400">→ {transaction.subcategory.name}</span>
            )}
          </div>

          {/* Riga 4: Frequenza + Prossima data (stessa riga, testo piccolo) */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{formatFrequency(transaction.frequency)}</span>
              <span className={`px-1.5 py-0.5 rounded ${confirmationColors}`}>
                {transaction.confirmationMode === 'AUTOMATIC' ? '⚡' : '👤'}
              </span>
              {transaction.appliedToBudget && (
                <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-semibold" title="Applicata al budgeting generale">
                  📊
                </span>
              )}
            </div>
            <span className={isDue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
              {formatDate(transaction.nextDueDate)}
            </span>
          </div>

          {/* Riga 5: Azioni rapide (menu azioni e anteprima) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1">
              <ActionsMenu
                onEdit={() => onEdit()}
                onRemove={() => onDelete(transaction.id)}
                customActions={[
                  ...(isDue && transaction.isActive ? [{
                    label: '💸 Paga ora',
                    onClick: () => onMaterialize(),
                    variant: 'primary'
                  }] : []),
                  ...(transaction.frequency === 'MONTHLY' ? [{
                    label: transaction.isActive ? '🚫 Disattiva' : '▶️ Attiva',
                    onClick: () => onToggleActive && onToggleActive(transaction, !transaction.isActive),
                    variant: transaction.isActive ? 'warning' : 'success'
                  }] : []),
                  ...(transaction.isActive ? [{
                    label: transaction.appliedToBudget ? '📉 Rimuovi da Budgeting' : '📈 Applica a Budgeting',
                    onClick: () => onApplyToBudgeting && onApplyToBudgeting(transaction),
                    variant: transaction.appliedToBudget ? 'warning' : 'default'
                  }] : [])
                ]}
              />
            </div>
            {transaction.frequency !== 'ONE_TIME' && (
              <button
                onClick={toggleOccurrences}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-500 transition-colors"
                title="Anteprima prossime date"
              >
                👀
                {showOccurrences ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
          
          {/* Vista dettagliata espandibile - Dettagli accessibili su richiesta */}
          {showOccurrences && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-2 text-xs">
                <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                  📅 Prossime date:
                </div>
                {loadingOccurrences ? (
                  <div className="text-slate-500">Caricamento...</div>
                ) : (
                  <div className="space-y-1">
                    {nextOccurrences.slice(0, 4).map((date, index) => (
                      <div key={index} className="text-slate-600 dark:text-slate-400">
                        {index + 1}. {formatDate(date)}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Timeline dettagliata */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Frequenza:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatFrequency(transaction.frequency)}</span>
                    </div>
                    {transaction.endDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fine:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(transaction.endDate)}</span>
                      </div>
                    )}
                    {transaction.payee && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Beneficiario:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{transaction.payee}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Note */}
                {transaction.note && (
                  <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                    💬 {transaction.note}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
