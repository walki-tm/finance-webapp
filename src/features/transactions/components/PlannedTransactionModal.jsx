/**
 * 📄 PLANNED TRANSACTION MODAL: Modal per creare/editare transazioni pianificate
 * 
 * 🎯 Features:
 * - Selezione Main Category + Subcategory filtrata
 * - Campi dinamici per frequenza (Mensile, Annuale, Una tantum)
 * - Preview prossime occorrenze
 * - Validazione realtime e UX migliorata
 * - Support per End Date e Confirmation Mode
 */

import React, { useState, useMemo, useEffect } from 'react'
import { X, Calendar, Eye, AlertCircle } from 'lucide-react'
import { MAIN_CATS } from '../../../lib/constants.js'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'

export default function PlannedTransactionModal({ 
  open, 
  onClose, 
  onSave, 
  initial = null, 
  subcats = {}, 
  mains = [], 
  groups = [] 
}) {
  const { token } = useAuth()
  const [formData, setFormData] = useState({
    title: initial?.title || '',
    main: initial?.main || 'expense',
    subId: initial?.subId || '',
    amount: initial?.amount || '',
    payee: initial?.payee || '',
    frequency: initial?.frequency || 'MONTHLY',
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 10) : '',
    confirmationMode: initial?.confirmationMode || 'MANUAL',
    groupId: initial?.groupId || '',
    note: initial?.note || '',
    applyToBudget: initial?.appliedToBudget || false,
  })
  
  const [showPreview, setShowPreview] = useState(false)
  const [nextOccurrences, setNextOccurrences] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  
  // 🔸 Filtra subcategorie per main selezionata
  const filteredSubcats = useMemo(() => {
    if (!formData.main || !subcats[formData.main]) return []
    return subcats[formData.main] || []
  }, [formData.main, subcats])
  
  // 🔸 Trova main category per colori e icone
  const selectedMainCat = useMemo(() => {
    return MAIN_CATS.find(cat => cat.key === formData.main)
  }, [formData.main])
  
  // 🔸 Validazione form
  const isValid = useMemo(() => {
    return (
      formData.amount && 
      Number(formData.amount) > 0 &&
      formData.main &&
      formData.subId &&
      formData.startDate &&
      formData.frequency
    )
  }, [formData])
  
  // 🔸 Load preview occorrenze
  const loadPreview = async () => {
    if (!formData.startDate || !formData.frequency || formData.frequency === 'ONE_TIME') {
      setNextOccurrences([])
      return
    }
    
    setLoadingPreview(true)
    try {
      const result = await api.getNextOccurrences(token, formData.startDate, formData.frequency, 6)
      setNextOccurrences(result.data || result)
    } catch (error) {
      console.error('Error loading preview:', error)
      setNextOccurrences([])
    } finally {
      setLoadingPreview(false)
    }
  }
  
  // 🔸 Effect per ricaricare preview quando cambiano i parametri
  useEffect(() => {
    if (showPreview) {
      loadPreview()
    }
  }, [formData.startDate, formData.frequency, showPreview])
  
  // 🔸 Reset subcategory quando cambia main
  useEffect(() => {
    setFormData(prev => ({ ...prev, subId: '' }))
  }, [formData.main])
  
  // 🔸 Aggiorna formData quando cambia initial (per editing) - SOLO all'apertura del modal
  useEffect(() => {
    if (!open) return // Non fare nulla se il modal è chiuso
    
    if (initial) {
      setFormData({
        title: initial.title || '',
        main: initial.main || 'expense',
        subId: initial.subId || '',
        amount: initial.amount || '',
        payee: initial.payee || '',
        frequency: initial.frequency || 'MONTHLY',
        startDate: initial.startDate ? new Date(initial.startDate).toISOString().slice(0, 10) : '',
        confirmationMode: initial.confirmationMode || 'MANUAL',
        groupId: initial.groupId || '',
        note: initial.note || '',
        applyToBudget: initial.appliedToBudget || false,
      })
    } else {
      // Reset per nuova transazione
      setFormData({
        title: '',
        main: 'expense',
        subId: '',
        amount: '',
        payee: '',
        frequency: 'MONTHLY',
        startDate: '',
        confirmationMode: 'MANUAL',
        groupId: '',
        note: '',
        applyToBudget: false,
      })
    }
  }, [initial, open]) // Aggiungi 'open' come dipendenza
  
  // 🔸 Keyboard shortcuts
  useEffect(() => {
    if (!open) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (isValid) handleSave()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isValid])
  
  if (!open) return null

  const handleSave = () => {
    if (!isValid) return
    onSave(formData)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] overflow-hidden">
          {/* 🔸 Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {selectedMainCat && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedMainCat.color}20` }}>
                  <selectedMainCat.icon className="w-4 h-4" style={{ color: selectedMainCat.color }} />
                </div>
              )}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {initial ? 'Modifica transazione pianificata' : 'Nuova transazione pianificata'}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          
          {/* 🔸 Body scrollable */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-5">
              {/* 🔸 Title (opzionale) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Titolo <span className="text-slate-400">(opzionale)</span>
                </label>
                <input
                  type="text"
                  placeholder="es. Netflix, Affitto, Stipendio..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* 🔸 Amount (focus iniziale) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
                {formData.amount && Number(formData.amount) <= 0 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    L'importo deve essere maggiore di zero
                  </p>
                )}
              </div>
              
              {/* 🔸 Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.main}
                    onChange={(e) => setFormData(prev => ({ ...prev, main: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {MAIN_CATS.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sottocategoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subId: e.target.value }))}
                    disabled={filteredSubcats.length === 0}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{filteredSubcats.length === 0 ? 'Nessuna sottocategoria disponibile' : 'Seleziona sottocategoria...'}</option>
                    {filteredSubcats.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 🔸 Payee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Beneficiario <span className="text-slate-400">(opzionale)</span>
                </label>
                <input
                  type="text"
                  placeholder="es. Amazon, Enel, Banca..."
                  value={formData.payee}
                  onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* 🔸 Frequency + Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Frequenza <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="MONTHLY">Mensile</option>
                    <option value="YEARLY">Annuale</option>
                    <option value="ONE_TIME">Una volta</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.frequency === 'MONTHLY' && 'Ripete ogni mese senza data di fine'}
                    {formData.frequency === 'YEARLY' && 'Ripete ogni anno senza data di fine'}
                    {formData.frequency === 'ONE_TIME' && 'Transazione singola, non ricorrente'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {formData.frequency === 'ONE_TIME' ? 'Data' : 'Data inizio'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.frequency !== 'ONE_TIME' && 'Primo giorno di applicazione della transazione'}
                    {formData.frequency === 'ONE_TIME' && 'Giorno in cui avverrà la transazione'}
                  </p>
                </div>
              </div>
              
              {/* 🔸 Confirmation Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Modalità conferma
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, confirmationMode: 'MANUAL' }))}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      formData.confirmationMode === 'MANUAL'
                        ? 'bg-slate-100 text-slate-900 border-2 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600'
                        : 'bg-transparent border-2 border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    MANUALE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, confirmationMode: 'AUTOMATIC' }))}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      formData.confirmationMode === 'AUTOMATIC'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                        : 'bg-transparent border-2 border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    AUTOMATICO
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {formData.confirmationMode === 'AUTOMATIC' 
                    ? 'Le transazioni verranno create automaticamente alla data di scadenza'
                    : 'Dovrai confermare manualmente ogni transazione'
                  }
                </p>
              </div>
              
              {/* 🔸 Group */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Gruppo <span className="text-slate-400">(opzionale)</span>
                  </label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Nessun gruppo</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 🔸 Applica a Budgeting */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="applyToBudget"
                    checked={formData.applyToBudget}
                    onChange={(e) => setFormData(prev => ({ ...prev, applyToBudget: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 text-green-600 bg-white border-green-300 rounded focus:ring-green-500 dark:focus:ring-green-400"
                  />
                  <div className="flex-1">
                    <label htmlFor="applyToBudget" className="block text-sm font-medium text-green-800 dark:text-green-200 cursor-pointer">
                      Applica al budgeting generale
                    </label>
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                      {formData.frequency === 'MONTHLY' && 'Applicherà €' + Math.abs(Number(formData.amount) || 0) + ' a tutti i mesi'}
                      {formData.frequency === 'YEARLY' && 'Applicherà €' + ((Math.abs(Number(formData.amount) || 0)) / 12).toFixed(2) + ' al mese (diviso su 12 mesi)'}
                      {formData.frequency === 'ONE_TIME' && 'Applicherà €' + Math.abs(Number(formData.amount) || 0) + ' al mese specifico'}
                      {!formData.frequency && 'Seleziona una frequenza per vedere l\'anteprima'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 🔸 Preview Occorrences */}
              {formData.frequency !== 'ONE_TIME' && formData.startDate && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Anteprima prossime occorrenze
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPreview(!showPreview)
                        if (!showPreview) loadPreview()
                      }}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      {showPreview ? 'Nascondi' : 'Mostra'}
                    </button>
                  </div>
                  
                  {showPreview && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      {loadingPreview ? (
                        <div className="text-center text-sm text-slate-500 py-2">
                          Caricamento...
                        </div>
                      ) : nextOccurrences.length > 0 ? (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <div className="font-medium mb-2">Prossime {Math.min(6, nextOccurrences.length)} date:</div>
                          <div className="flex flex-wrap gap-2">
                            {nextOccurrences.slice(0, 6).map((date, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs border border-slate-200 dark:border-slate-600"
                              >
                                {formatDate(date)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 text-center py-2">
                          Nessuna anteprima disponibile
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* 🔸 Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note <span className="text-slate-400">(opzionale)</span>
                </label>
                <textarea
                  placeholder="Eventuali note aggiuntive..."
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* 🔸 Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <div className="text-xs text-slate-500">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs">Esc</kbd> per annullare • 
              <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs ml-1">Ctrl+Enter</kbd> per salvare
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isValid
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {initial ? 'Aggiorna' : 'Crea'} Transazione
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
