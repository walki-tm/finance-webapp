/**
 * 📄 ADD BALANCE MODAL COMPONENT: Modal per aggiungere saldo agli obiettivi
 * 
 * 🎯 Scopo: Modal per aggiungere saldo con supporto dark mode
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-07 - Aggiunto supporto dark mode
 */

import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function AddBalanceModal({ isOpen, onClose, onSubmit, goal }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(parseFloat(amount), notes)
    setAmount('')
    setNotes('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <Plus className="h-5 w-5 text-green-600 dark:text-green-500" />
            <span>Aggiungi Saldo</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="font-medium text-slate-900 dark:text-slate-100">{goal?.title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Attuale: €{goal?.currentAmount || 0} / €{goal?.targetAmount}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Importo da aggiungere (€)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Note (opzionale)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
              placeholder="Aggiungi una nota..."
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
              className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Aggiungi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
