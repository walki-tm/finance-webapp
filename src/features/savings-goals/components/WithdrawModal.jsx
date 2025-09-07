/**
 * 📄 WITHDRAW MODAL COMPONENT: Modal per prelevare saldo dagli obiettivi
 * 
 * 🎯 Scopo: Modal per prelievo con selezione obbligatoria sottocategoria REDDITO
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-06 - Aggiunta selezione sottocategoria obbligatoria
 */

import React, { useState, useMemo } from 'react'
import { X, Minus } from 'lucide-react'
import CompletedGoalConfirmDialog from './CompletedGoalConfirmDialog.jsx'

export default function WithdrawModal({ isOpen, onClose, onSubmit, goal, categories }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('')

  // 🔸 Filtra sottocategorie REDDITO/INCOME
  const incomeSubcategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return []
    
    const incomeCategory = categories.find(cat => 
      cat.main === 'INCOME' || cat.key === 'income'
    )
    
    return incomeCategory?.subcats || []
  }, [categories])

  if (!isOpen) return null

  const maxWithdraw = parseFloat(goal?.currentAmount || 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    const withdrawAmount = parseFloat(amount)
    
    if (withdrawAmount > maxWithdraw) {
      alert('Non puoi prelevare più del saldo disponibile')
      return
    }
    
    if (!selectedSubcategoryId) {
      alert('Seleziona una sottocategoria per il reddito')
      return
    }
    
    onSubmit(withdrawAmount, notes, selectedSubcategoryId)
    setAmount('')
    setNotes('')
    setSelectedSubcategoryId('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <Minus className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            <span>Preleva Saldo</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="font-medium text-slate-900 dark:text-slate-100">{goal?.title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Disponibile per prelievo: €{maxWithdraw}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            💰 Categoria: REDDITO
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Importo da prelevare (€)</label>
            <input
              type="number"
              step="0.01"
              max={maxWithdraw}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Massimo: €{maxWithdraw}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Sottocategoria REDDITO *
            </label>
            <select
              value={selectedSubcategoryId}
              onChange={(e) => setSelectedSubcategoryId(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
              required
            >
              <option value="" className="text-slate-400 dark:text-slate-500">
                Seleziona sottocategoria...
              </option>
              {incomeSubcategories.map((subcat) => (
                <option key={subcat.id} value={subcat.id} className="text-slate-900 dark:text-slate-100">
                  {subcat.name}
                </option>
              ))}
            </select>
            {incomeSubcategories.length === 0 && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Nessuna sottocategoria REDDITO disponibile
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Note (opzionale)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
              placeholder="Motivo del prelievo..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Preleva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
