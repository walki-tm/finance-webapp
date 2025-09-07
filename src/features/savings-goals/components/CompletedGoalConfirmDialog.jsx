/**
 * 📄 COMPLETED GOAL CONFIRM DIALOG: Dialog per conferma azioni su obiettivi completati
 * 
 * 🎯 Scopo: Dialog che appare quando si preleva tutto l'ammontare da un obiettivo completato
 * con le opzioni "Ripeti" e "Elimina"
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-07 - Creazione componente
 */

import React from 'react'
import { X, RotateCcw, Trash2, AlertCircle } from 'lucide-react'

export default function CompletedGoalConfirmDialog({ 
  isOpen, 
  onClose, 
  onRepeat, 
  onDelete, 
  goal,
  withdrawAmount 
}) {
  if (!isOpen || !goal) return null

  const isFullWithdrawal = parseFloat(withdrawAmount) >= parseFloat(goal.currentAmount)

  const handleRepeat = () => {
    onRepeat()
    onClose()
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <AlertCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            <span>Obiettivo Completato</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <p className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">{goal.title}</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {isFullWithdrawal 
              ? `Stai per prelevare tutti i €${parseFloat(goal.currentAmount).toFixed(2)} dall'obiettivo completato.`
              : `Stai per prelevare €${parseFloat(withdrawAmount).toFixed(2)} dall'obiettivo completato.`
            }
          </p>
          {isFullWithdrawal && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              💡 Cosa vuoi fare con l'obiettivo?
            </p>
          )}
        </div>

        {isFullWithdrawal ? (
          // Mostra opzioni solo se si preleva tutto
          <div className="space-y-3">
            <button
              onClick={handleRepeat}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              <RotateCcw className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Ripeti Obiettivo</div>
                <div className="text-xs text-blue-100 dark:text-blue-200">Ricomincio da €0, mantieni l'obiettivo attivo</div>
              </div>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              <Trash2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Elimina Obiettivo</div>
                <div className="text-xs text-red-100 dark:text-red-200">Rimuovi completamente l'obiettivo</div>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Annulla
            </button>
          </div>
        ) : (
          // Prelievo parziale - solo conferma normale
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Il prelievo verrà completato e l'obiettivo tornerà attivo.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  // Per prelievi parziali, chiudiamo semplicemente il dialog
                  // Il prelievo sarà già stato processato dal WithdrawModal
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                Conferma
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
