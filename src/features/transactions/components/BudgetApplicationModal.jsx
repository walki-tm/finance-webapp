/**
 * 📋 BUDGET APPLICATION MODAL: Modal per scegliere modalità di applicazione al budgeting
 * 
 * 🎯 Scopo: Permettere all'utente di scegliere come applicare transazioni pianificate al budget
 * 
 * 🔧 Caratteristiche:
 * - Opzioni diverse per transazioni mensili, annuali e una tantum
 * - Anteprima degli importi che verranno applicati
 * - Validazione e conferma prima dell'applicazione
 * 
 * @author Finance WebApp Team  
 * @created 25 Agosto 2025
 */

import React, { useState, useMemo } from 'react'
import { X, Calculator, Calendar, Euro, CheckCircle2 } from 'lucide-react'
import { getYearlyApplicationOptions } from '../lib/budgetingIntegration.js'

const monthNames = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export default function BudgetApplicationModal({
  open,
  onClose,
  onConfirm,
  transaction,
  transactions, // per i gruppi
  year = new Date().getFullYear(),
  type = 'single' // 'single' o 'group'
}) {
  const [selectedMode, setSelectedMode] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [loading, setLoading] = useState(false)

  const isGroup = type === 'group'
  const targetTransaction = transaction || (transactions && transactions[0])
  
  // Reset state quando si apre/chiude il modal
  React.useEffect(() => {
    if (open) {
      setSelectedMode(null)
      setSelectedMonth(null)
      setLoading(false)
    }
  }, [open])

  // Opzioni disponibili basate sulla frequenza
  const availableOptions = useMemo(() => {
    if (isGroup) {
      // Per i gruppi, mostra sempre opzione generica
      return [{
        mode: 'group',
        label: 'Applica tutto al budgeting',
        description: `Applica tutte le ${transactions?.length || 0} transazioni del gruppo ai rispettivi mesi/categorie`
      }]
    }

    if (!targetTransaction) return []

    switch (targetTransaction.frequency) {
      case 'MONTHLY':
        return [{
          mode: 'monthly',
          label: 'Applica ricorrente mensile',
          description: `Applica €${Math.abs(targetTransaction.amount)} a tutti i mesi`
        }]
      
      case 'YEARLY':
        return getYearlyApplicationOptions(targetTransaction)
      
      case 'ONE_TIME':
        const startDate = new Date(targetTransaction.startDate)
        const month = startDate.getMonth()
        return [{
          mode: 'onetime',
          targetMonth: month,
          label: `Applica a ${monthNames[month]}`,
          description: `Applica €${Math.abs(targetTransaction.amount)} al mese di ${monthNames[month]} ${year}`
        }]
      
      default:
        return []
    }
  }, [targetTransaction, transactions, year, isGroup])

  const handleConfirm = async () => {
    if (!selectedMode) return
    
    setLoading(true)
    try {
      const option = availableOptions.find(opt => opt.mode === selectedMode)
      await onConfirm({
        mode: selectedMode,
        targetMonth: option?.targetMonth || selectedMonth,
        year
      })
      onClose()
    } catch (error) {
      console.error('Errore nell\'applicazione al budget:', error)
      // Il toast di errore viene gestito nel componente parent
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Applica al Budgeting
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Informazioni sulla transazione/gruppo */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              {isGroup ? (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Gruppo di Transazioni
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {transactions?.length || 0} transazioni • Anno {year}
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                    {targetTransaction?.title || 'Transazione Pianificata'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Euro className="w-4 h-4" />
                      €{Math.abs(targetTransaction?.amount || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {targetTransaction?.frequency === 'MONTHLY' ? 'Mensile' :
                       targetTransaction?.frequency === 'YEARLY' ? 'Annuale' :
                       'Una volta'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Opzioni disponibili */}
            <div className="space-y-3 mb-6">
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Modalità di applicazione:
              </h5>
              
              {availableOptions.map((option, index) => (
                <label
                  key={option.mode}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMode === option.mode
                      ? 'border-blue-300 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="budgetMode"
                      value={option.mode}
                      checked={selectedMode === option.mode}
                      onChange={() => setSelectedMode(option.mode)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        {option.label}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Anteprima risultato */}
            {selectedMode && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Anteprima applicazione</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Le transazioni verranno aggiunte ai budget dell'anno {year} secondo la modalità selezionata.
                  I valori esistenti verranno sommati a quelli nuovi.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <div className="text-xs text-slate-500">
              L'operazione aggiornerà i budget per l'anno {year}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedMode || loading}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedMode && !loading
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Applicando...' : 'Applica al Budget'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
