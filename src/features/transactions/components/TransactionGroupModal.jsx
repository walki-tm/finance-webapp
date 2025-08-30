/**
 * Modal placeholder per gruppi di transazioni - implementazione base
 */

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function TransactionGroupModal({ open, onClose, onSave, initial = null }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || '#3b82f6')

  // Reset form when modal changes - MUST be before any conditional returns
  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setColor(initial?.color || '#3b82f6')
    }
  }, [open, initial])

  const handleSave = () => {
    onSave({ name, color })
  }

  if (!open) return null
  
  // Colori predefiniti
  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#64748b'  // slate
  ]

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/10">
            <h3 className="text-lg font-semibold">
              {initial ? 'Modifica gruppo' : 'Nuovo gruppo'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Nome gruppo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Es. Spese Ricorrenti"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Colore gruppo</label>
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-6 h-6 rounded-lg border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{color}</span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {predefinedColors.map(predefinedColor => (
                  <button
                    key={predefinedColor}
                    type="button"
                    onClick={() => setColor(predefinedColor)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                      color === predefinedColor 
                        ? 'border-slate-400 shadow-md scale-105' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: predefinedColor }}
                  />
                ))}
              </div>
              
              <div className="mt-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-sm border border-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white disabled:opacity-50"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
