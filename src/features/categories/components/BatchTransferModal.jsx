/**
 * 📄 BATCH TRANSFER MODAL: Modal per trasferire tutte le transazioni tra sottocategorie
 * 
 * 🎯 Features:
 * - Selezione sottocategoria di origine e destinazione
 * - Preview del numero di transazioni da trasferire
 * - Conferma esplicita dell'operazione
 * - Validazione per evitare errori
 * 
 * @author Finance WebApp Team
 * @created 2025-10-30
 */

import React, { useState, useMemo, useEffect } from 'react'
import { X, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'

export default function BatchTransferModal({ 
  open, 
  onClose, 
  onSuccess,
  categories = [],
  subcats = {},
  initialSourceSubcategoryId = null
}) {
  const { token } = useAuth()
  
  const [step, setStep] = useState(1) // 1: Selection, 2: Confirmation
  const [sourceSubcategoryId, setSourceSubcategoryId] = useState(initialSourceSubcategoryId || '')
  const [targetSubcategoryId, setTargetSubcategoryId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Reset quando il modal si apre
  useEffect(() => {
    if (open) {
      setStep(1)
      setSourceSubcategoryId(initialSourceSubcategoryId || '')
      setTargetSubcategoryId('')
      setError(null)
    }
  }, [open, initialSourceSubcategoryId])
  
  // Prepara lista flat di tutte le sottocategorie
  const allSubcategories = useMemo(() => {
    const subs = []
    // categories è un array di {key, id, name, color} (customMainCats)
    // subcats è un oggetto {expense: [...], income: [...], ...}
    categories.forEach(cat => {
      const mainKey = cat.key
      const subcatsForMain = subcats?.[mainKey] || []
      subcatsForMain.forEach(sub => {
        subs.push({
          ...sub,
          categoryName: cat.name,
          categoryMain: mainKey,
          fullName: `${cat.name} → ${sub.name}`
        })
      })
    })
    return subs
  }, [categories, subcats])
  
  // Trova le sottocategorie selezionate
  const sourceSubcat = allSubcategories.find(s => s.id === sourceSubcategoryId)
  const targetSubcat = allSubcategories.find(s => s.id === targetSubcategoryId)
  
  // Filtra le sottocategorie di destinazione compatibili
  const compatibleTargetSubcats = useMemo(() => {
    if (!sourceSubcat) return allSubcategories
    
    const sourceMain = sourceSubcat.categoryMain
    
    // REGOLA: INCOME può trasferire solo a INCOME
    if (sourceMain === 'income') {
      return allSubcategories.filter(s => s.categoryMain === 'income' && s.id !== sourceSubcategoryId)
    }
    
    // REGOLA: Tutte le altre possono trasferire tra loro MA NON verso INCOME
    return allSubcategories.filter(s => s.categoryMain !== 'income' && s.id !== sourceSubcategoryId)
  }, [sourceSubcat, allSubcategories, sourceSubcategoryId])
  
  // Validazione
  const isValid = useMemo(() => {
    if (!sourceSubcategoryId || !targetSubcategoryId) return false
    if (sourceSubcategoryId === targetSubcategoryId) return false
    return true
  }, [sourceSubcategoryId, targetSubcategoryId])
  
  const handleNext = () => {
    if (step === 1 && sourceSubcategoryId && targetSubcategoryId && sourceSubcategoryId !== targetSubcategoryId) {
      // Verifica che le sottocategorie esistano prima di procedere
      const source = allSubcategories.find(s => s.id === sourceSubcategoryId)
      const target = allSubcategories.find(s => s.id === targetSubcategoryId)
      
      if (!source || !target) {
        setError('Sottocategorie non trovate')
        return
      }
      
      setStep(2)
      setError(null)
    }
  }
  
  const handleBack = () => {
    setStep(1)
    setError(null)
  }
  
  const handleTransfer = async () => {
    if (!isValid) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await api.batchTransferCategories(token, sourceSubcategoryId, targetSubcategoryId)
      
      // Successo!
      if (onSuccess) {
        onSuccess(result)
      }
      
      // Chiudi il modal dopo un breve delay per mostrare il successo
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Errore nel trasferimento batch:', err)
      setError(err.message || 'Errore durante il trasferimento delle transazioni')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Trasferimento Batch Transazioni
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Step {step} di 2
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* Step 1: Selezione */}
            {step === 1 && (
              <>
                {/* Info Alert */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                        Questa operazione sposterà TUTTE le transazioni (normali e pianificate) dalla sottocategoria di origine a quella di destinazione.
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        📌 <strong>Regole:</strong> REDDITO può trasferire solo a REDDITO. Tutte le altre categorie possono trasferire tra loro ma non verso REDDITO.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Selezione Origine */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sottocategoria di Origine <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sourceSubcategoryId}
                    onChange={(e) => setSourceSubcategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={!!initialSourceSubcategoryId}
                  >
                    <option value="">Seleziona sottocategoria di origine...</option>
                    {allSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.fullName}
                      </option>
                    ))}
                  </select>
                  {initialSourceSubcategoryId && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sottocategoria preselezionata
                    </p>
                  )}
                </div>
                
                {/* Arrow Indicator */}
                {sourceSubcategoryId && (
                  <div className="flex justify-center">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                      <ArrowRight className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Selezione Destinazione */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sottocategoria di Destinazione <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={targetSubcategoryId}
                    onChange={(e) => setTargetSubcategoryId(e.target.value)}
                    disabled={!sourceSubcategoryId}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleziona sottocategoria di destinazione...</option>
                    {compatibleTargetSubcats.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.fullName}
                      </option>
                    ))}
                  </select>
                  {sourceSubcat && compatibleTargetSubcats.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Nessuna sottocategoria compatibile disponibile
                    </p>
                  )}
                </div>
                
                {/* Warning se stessa categoria */}
                {sourceSubcategoryId === targetSubcategoryId && sourceSubcategoryId && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                        Le sottocategorie di origine e destinazione devono essere diverse!
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Step 2: Conferma */}
            {step === 2 && sourceSubcat && targetSubcat && (
              <>
                {/* Riepilogo */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    Riepilogo Trasferimento
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium w-24 flex-shrink-0">
                        Da:
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {sourceSubcat.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {sourceSubcat.categoryName}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium w-24 flex-shrink-0">
                        A:
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {targetSubcat.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {targetSubcat.categoryName}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Warning Critico */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
                        Attenzione: Questa operazione è irreversibile!
                      </p>
                      <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                        <li>Tutte le transazioni normali verranno spostate</li>
                        <li>Tutte le transazioni pianificate verranno spostate</li>
                        <li>La categoria principale verrà aggiornata se necessario</li>
                        <li>Non è possibile annullare questa operazione</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <div className="text-xs text-slate-500">
              {step === 1 && '1/2 - Seleziona le categorie'}
              {step === 2 && '2/2 - Conferma il trasferimento'}
            </div>
            
            <div className="flex gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Indietro
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!sourceSubcategoryId || !targetSubcategoryId || sourceSubcategoryId === targetSubcategoryId}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
                >
                  Avanti
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={!isValid || isLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Trasferimento...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Conferma Trasferimento
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
