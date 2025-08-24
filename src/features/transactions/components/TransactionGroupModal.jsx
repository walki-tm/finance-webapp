/**
 * Modal placeholder per gruppi di transazioni - implementazione base
 */

import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function TransactionGroupModal({ open, onClose, onSave, initial = null }) {
  const [name, setName] = useState(initial?.name || '')

  if (!open) return null

  const handleSave = () => {
    onSave({ name })
  }

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
