/**
 * 📄 GOAL MODAL COMPONENT: Modal per creazione/modifica obiettivi
 * 
 * 🎯 Scopo: Interfaccia modale per CRUD obiettivi di risparmio con supporto dark mode
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-07 - Aggiunto supporto dark mode
 */

import React, { useState, useMemo } from 'react'
import { X } from 'lucide-react'

export default function GoalModal({ isOpen, onClose, onSubmit, goal, isEditing, categories }) {
  // 🔸 Inizializza categoryMain da goal esistente o dalla sottocategoria
  const getInitialCategoryMain = () => {
    if (goal?.categoryMain) return goal.categoryMain
    if (goal?.subcategoryId && categories) {
      // Trova la categoria principale dalla sottocategoria
      for (const cat of categories) {
        if (cat.subcats?.some(sub => sub.id === goal.subcategoryId)) {
          return cat.main
        }
      }
    }
    return ''
  }

  const [formData, setFormData] = useState({
    title: goal?.title || '',
    targetAmount: goal?.targetAmount || '',
    targetDate: goal?.targetDate || '',
    categoryMain: getInitialCategoryMain(),
    subcategoryId: goal?.subcategoryId || '',
    notes: goal?.notes || '',
    iconKey: goal?.iconKey || ''
  })

  // 🔸 Filtra categorie disponibili (esclude INCOME)
  const availableCategories = useMemo(() => {
    if (!categories) return []
    
    // Filtra le categorie escludendo INCOME
    return categories.filter(cat => 
      cat.main && 
      cat.main.toUpperCase() !== 'INCOME' &&
      cat.visible !== false
    )
  }, [categories])

  // 🔸 Filtra sottocategorie basate sulla categoria principale selezionata
  const availableSubcategories = useMemo(() => {
    if (!formData.categoryMain || !categories) return []
    
    const selectedCategory = categories.find(cat => cat.main === formData.categoryMain)
    return selectedCategory?.subcats || []
  }, [formData.categoryMain, categories])

  // 🔸 Reset sottocategoria quando cambia categoria principale
  const handleMainCategoryChange = (newMain) => {
    setFormData({
      ...formData,
      categoryMain: newMain,
      subcategoryId: '' // Reset sottocategoria
    })
  }

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Modifica Obiettivo' : 'Nuovo Obiettivo'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Titolo</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="Nome del tuo obiettivo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Importo Obiettivo (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Data Scadenza (opzionale)</label>
            <input
              type="date"
              value={formData.targetDate?.split('T')[0] || formData.targetDate}
              onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lascia vuoto per un obiettivo di "Accumulo Soldi" senza scadenza
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Categoria Principale</label>
            <select
              value={formData.categoryMain}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              required
            >
              <option value="" className="text-slate-400 dark:text-slate-500">Seleziona categoria</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.main} className="text-slate-900 dark:text-slate-100">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Sottocategoria</label>
            <select
              value={formData.subcategoryId}
              onChange={(e) => setFormData({...formData, subcategoryId: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-slate-800"
              required
              disabled={!formData.categoryMain}
            >
              <option value="" className="text-slate-400 dark:text-slate-500">
                {formData.categoryMain ? 'Seleziona sottocategoria' : 'Prima seleziona una categoria'}
              </option>
              {availableSubcategories.map(sub => (
                <option key={sub.id} value={sub.id} className="text-slate-900 dark:text-slate-100">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Note (opzionale)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg h-20 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              placeholder="Aggiungi note..."
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
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {isEditing ? 'Aggiorna' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
