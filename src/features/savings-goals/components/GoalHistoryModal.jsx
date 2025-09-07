/**
 * 📄 GOAL HISTORY MODAL COMPONENT: Modal per visualizzare storico obiettivi
 * 
 * 🎯 Scopo: Modal per visualizzare storico operazioni con supporto dark mode
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-07 - Aggiunto supporto dark mode
 */

import React, { useState, useEffect } from 'react'
import { X, History, Plus, Minus } from 'lucide-react'

export default function GoalHistoryModal({ isOpen, onClose, goal, getGoalHistory }) {
  const [history, setHistory] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && goal) {
      loadHistory()
    }
  }, [isOpen, goal])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const data = await getGoalHistory(goal.id)
      setHistory(data)
    } catch (error) {
      console.error('Errore caricamento storico:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <History className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span>Storico Operazioni</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {goal && (
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <p className="font-medium text-slate-900 dark:text-slate-100">{goal.title}</p>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-2">
              <span>Saldo attuale: {formatCurrency(goal.currentAmount)}</span>
              <span>Obiettivo: {formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
        )}

        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Caricamento storico...</p>
            </div>
          ) : !history?.transactions?.length ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">Nessuna operazione trovata</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  <div className="flex items-center space-x-3">
                    {transaction.type === 'ADD' ? (
                      <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                        <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                        <Minus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {transaction.type === 'ADD' ? 'Deposito' : 'Prelievo'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(transaction.createdAt)}
                      </p>
                      {transaction.notes && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                          "{transaction.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'ADD' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {transaction.type === 'ADD' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {history && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Totale depositi:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(history.totalDeposits)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-600 dark:text-slate-400">Totale prelievi:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {formatCurrency(history.totalWithdrawals)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 font-semibold">
              <span className="text-slate-900 dark:text-slate-100">Saldo netto:</span>
              <span className="text-slate-900 dark:text-slate-100">{formatCurrency(history.netAmount)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
