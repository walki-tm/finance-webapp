/**
 * 📄 PAYOFF LOAN MODAL: Modale per conferma estinzione prestito
 * 
 * 🎯 Scopo: Interfaccia per confermare e gestire l'estinzione anticipata
 * di un prestito, mostrando dettagli finanziari e opzioni di pagamento.
 * 
 * 🎨 Features:
 * - Visualizzazione debito residuo e importo estinzione
 * - Campo note personalizzabile
 * - Selezione data estinzione
 * - Validazione input
 * - Design responsive e accessibile
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-01 - Implementazione modale estinzione
 */

import React, { useState, useEffect, useMemo } from 'react'
import { 
  X, 
  AlertTriangle, 
  CreditCard, 
  Calendar, 
  FileText,
  DollarSign,
  Percent,
  Calculator,
  Clock
} from 'lucide-react'
import { loansApi } from '../services/loans.api.js'

export default function PayoffLoanModal({ 
  isOpen, 
  onClose, 
  loan, 
  onConfirm,
  loading = false 
}) {
  // =============================================================================
  // 🔸 STATE
  // =============================================================================
  
  const [formData, setFormData] = useState({
    payoffType: 'TOTAL', // 'TOTAL' o 'PARTIAL'
    payoffAmount: '',
    payoffDate: '',
    notes: '',
    paymentMethod: 'BANK_TRANSFER',
    penaltyAmount: '',
    penaltyType: 'PERCENTAGE', // 'PERCENTAGE' o 'FIXED'
    recalculationType: 'RECALCULATE_PAYMENT' // 'RECALCULATE_PAYMENT' o 'RECALCULATE_DURATION'
  })
  
  const [errors, setErrors] = useState({})
  const [showPenaltySection, setShowPenaltySection] = useState(false)
  const [showNotesSection, setShowNotesSection] = useState(false)

  // =============================================================================
  // 🔸 EFFECTS
  // =============================================================================
  
  useEffect(() => {
    if (isOpen && loan) {
      // Inizializza con debito residuo e data corrente
      const today = new Date().toISOString().split('T')[0]
      const remainingAmount = parseFloat(loan.currentBalance) || 0
      
      setFormData({
        payoffType: 'TOTAL',
        payoffAmount: remainingAmount.toFixed(2),
        payoffDate: today,
        notes: '',
        paymentMethod: 'BANK_TRANSFER',
        penaltyAmount: '',
        penaltyType: 'PERCENTAGE',
        recalculationType: 'RECALCULATE_PAYMENT'
      })
      setErrors({})
      setShowPenaltySection(false)
      setShowNotesSection(false)
    }
  }, [isOpen, loan])

  // =============================================================================
  // 🔸 COMPUTED VALUES
  // =============================================================================
  
  const remainingAmount = loan ? parseFloat(loan.currentBalance) : 0
  const payoffAmount = parseFloat(formData.payoffAmount) || 0
  const penaltyAmount = parseFloat(formData.penaltyAmount) || 0
  
  // Calcola penale in base al tipo
  const actualPayoffAmount = formData.payoffType === 'TOTAL' ? remainingAmount : payoffAmount
  const calculatedPenalty = formData.penaltyType === 'PERCENTAGE' 
    ? (actualPayoffAmount * penaltyAmount / 100)
    : penaltyAmount
  
  const totalPayoffAmount = payoffAmount + calculatedPenalty
  const savingsAmount = remainingAmount - payoffAmount
  
  // Calcolo nuova rata per ricalcolo rata (solo estinzione parziale)
  const newMonthlyPayment = useMemo(() => {
    if (formData.payoffType === 'TOTAL' || formData.recalculationType !== 'RECALCULATE_PAYMENT') {
      return 0
    }
    
    const newBalance = remainingAmount - payoffAmount
    const currentRemainingPayments = loan ? (loan.totalPayments - loan.paidPayments) : 0
    const interestRate = loan ? parseFloat(loan.interestRate) : 0
    
    if (newBalance <= 0 || currentRemainingPayments <= 0) {
      return 0
    }
    
    const TAN = interestRate // Tasso Annuo Nominale
    const p = 12 // Periodi per anno (mensile)
    const i = TAN / p // Tasso periodale
    const n = currentRemainingPayments // Mensilità rimanenti invariate
    const PV = newBalance // Nuovo debito residuo
    
    if (i === 0) {
      // Caso tasso zero: A = PV/n
      return PV / n
    } else {
      // Formula ammortamento francese: A = PV × [i × (1+i)^n] / [(1+i)^n - 1]
      const onePlusI = 1 + i
      const onePlusIPowerN = Math.pow(onePlusI, n)
      const numerator = PV * i * onePlusIPowerN
      const denominator = onePlusIPowerN - 1
      return numerator / denominator
    }
  }, [formData.payoffType, formData.recalculationType, payoffAmount, remainingAmount, loan])
  
  // Calcolo rate rimanenti post estinzione (solo per estinzione parziale)
  const remainingPaymentsPostPayoff = useMemo(() => {
    if (formData.payoffType === 'TOTAL' || payoffAmount <= 0 || payoffAmount >= remainingAmount) {
      return 0 // Estinzione totale = 0 rate rimanenti
    }
    
    const currentRemainingPayments = loan ? (loan.totalPayments - loan.paidPayments) : 0
    const newBalance = remainingAmount - payoffAmount
    const interestRate = loan ? parseFloat(loan.interestRate) : 0
    const monthlyPayment = loan ? parseFloat(loan.monthlyPayment) : 0
    
    if (newBalance <= 0 || currentRemainingPayments <= 0) {
      return 0
    }
    
    if (formData.recalculationType === 'RECALCULATE_PAYMENT') {
      // Ricalcola Rata: mensilità restano invariate
      return currentRemainingPayments
    } else {
      // Ricalcola Mensilità: calcola nuove mensilità con stessa rata
      const TAN = interestRate // Tasso Annuo Nominale
      const p = 12 // Periodi per anno (mensile)
      const i = TAN / p // Tasso periodale
      const A = monthlyPayment // Rata invariata
      
      if (i === 0) {
        // Caso tasso zero: n = PV/A
        return Math.ceil(newBalance / A)
      } else {
        // Condizione: A > i⋅PV (altrimenti non ammortizza)
        if (A <= i * newBalance) {
          return currentRemainingPayments // Fallback se rata troppo bassa
        }
        
        // Formula: n = -ln(1 - i⋅PV/A) / ln(1+i)
        const numerator = -Math.log(1 - (i * newBalance) / A)
        const denominator = Math.log(1 + i)
        const n_exact = numerator / denominator
        return Math.ceil(n_exact)
      }
    }
  }, [formData.payoffType, formData.recalculationType, payoffAmount, remainingAmount, loan])

  // =============================================================================
  // 🔸 VALIDATION
  // =============================================================================
  
  const validateForm = () => {
    const newErrors = {}

    // Validazione per estinzione parziale
    if (formData.payoffType === 'PARTIAL') {
      if (!formData.payoffAmount || payoffAmount <= 0) {
        newErrors.payoffAmount = 'L\'importo di estinzione è obbligatorio e deve essere maggiore di zero'
      } else if (payoffAmount >= remainingAmount) {
        newErrors.payoffAmount = 'Per estinzione parziale, l\'importo deve essere inferiore al debito residuo'
      }
    }
    
    // Validazione penale
    if (formData.penaltyAmount && penaltyAmount < 0) {
      newErrors.penaltyAmount = 'La penale non può essere negativa'
    }
    
    if (formData.penaltyType === 'PERCENTAGE' && penaltyAmount > 100) {
      newErrors.penaltyAmount = 'La percentuale non può essere superiore al 100%'
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Le note non possono superare 500 caratteri'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =============================================================================
  // 🔸 EVENT HANDLERS
  // =============================================================================
  
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Gestione automatica per estinzione totale/parziale
      if (field === 'payoffType') {
        const today = new Date().toISOString().split('T')[0]
        newData.payoffDate = today // Sempre data di oggi per entrambi i tipi
        
        if (value === 'TOTAL') {
          // Per estinzione totale: importo automatico
          newData.payoffAmount = remainingAmount.toFixed(2)
        } else if (value === 'PARTIAL') {
          // Per estinzione parziale: resetta importo
          newData.payoffAmount = ''
        }
      }
      
      return newData
    })
    
    // Rimuovi errore del campo se presente
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const payoffData = {
      payoffType: formData.payoffType,
      payoffAmount: parseFloat(formData.payoffAmount),
      payoffDate: formData.payoffDate,
      notes: formData.notes.trim() || undefined,
      paymentMethod: formData.paymentMethod,
      penaltyAmount: calculatedPenalty,
      penaltyType: formData.penaltyType,
      totalAmount: totalPayoffAmount,
      recalculationType: formData.recalculationType
    }

    onConfirm(loan, payoffData)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  // =============================================================================
  // 🔸 RENDER HELPERS
  // =============================================================================
  
  const renderWarningSection = () => (
    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
          Attenzione: Estinzione Anticipata
        </h4>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Questa operazione estinguerà il prestito (totalmente o parzialmente) e non potrà essere annullata.
          Verifica attentamente l'importo prima di procedere.
        </p>
      </div>
    </div>
  )

  const renderLoanSummary = () => (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
        Riepilogo Prestito
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Nome:</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{loan?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Banca/Ente:</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{loan?.lenderName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Debito residuo:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {loansApi.formatCurrency(remainingAmount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Rata mensile:</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {loansApi.formatCurrency(loan?.monthlyPayment || 0)}
          </span>
        </div>
      </div>
    </div>
  )

  // =============================================================================
  // 🔸 MAIN RENDER
  // =============================================================================
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Estinzione Prestito
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Conferma estinzione anticipata
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderLoanSummary()}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payoff Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Tipo di Estinzione
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('payoffType', 'TOTAL')}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 border rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                    formData.payoffType === 'TOTAL'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  Estinzione Totale
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('payoffType', 'PARTIAL')}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 border rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                    formData.payoffType === 'PARTIAL'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  Estinzione Parziale
                </button>
              </div>
            </div>

            {/* Recalculation Type (only for PARTIAL) */}
            {formData.payoffType === 'PARTIAL' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Tipo di Ricalcolo
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('recalculationType', 'RECALCULATE_PAYMENT')}
                      disabled={loading}
                      className={`flex-1 px-4 py-3 border rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                        formData.recalculationType === 'RECALCULATE_PAYMENT'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Calculator className="w-4 h-4 inline mr-2" />
                      Ricalcola Rata
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('recalculationType', 'RECALCULATE_DURATION')}
                      disabled={loading}
                      className={`flex-1 px-4 py-3 border rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                        formData.recalculationType === 'RECALCULATE_DURATION'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Clock className="w-4 h-4 inline mr-2" />
                      Ricalcola Mensilità
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded p-3">
                    {formData.recalculationType === 'RECALCULATE_PAYMENT' ? (
                      <p><strong>Ricalcola Rata:</strong> Mantiene il numero di mensilità rimanenti invariato ma riduce l'importo della rata mensile.</p>
                    ) : (
                      <p><strong>Ricalcola Mensilità:</strong> Mantiene l'importo della rata mensile invariato ma riduce il numero di mensilità rimanenti.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payoff Amount - Solo per estinzione parziale */}
            {formData.payoffType === 'PARTIAL' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Importo Estinzione
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.payoffAmount}
                  onChange={(e) => handleInputChange('payoffAmount', e.target.value)}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${
                    errors.payoffAmount ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                  placeholder="0.00"
                />
                {errors.payoffAmount && (
                  <p className="text-red-600 text-sm mt-1">{errors.payoffAmount}</p>
                )}
                {payoffAmount > 0 && payoffAmount !== remainingAmount && (
                  <p className={`text-sm mt-1 ${
                    savingsAmount > 0 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {savingsAmount > 0 
                      ? `Risparmio: ${loansApi.formatCurrency(savingsAmount)}`
                      : `Costo aggiuntivo: ${loansApi.formatCurrency(Math.abs(savingsAmount))}`
                    }
                  </p>
                )}
              </div>
            )}

            {/* Penalty Badge */}
            <div>
              <button
                type="button"
                onClick={() => setShowPenaltySection(!showPenaltySection)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Percent className="w-4 h-4" />
                Aggiungi Penale
                {calculatedPenalty > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-200 dark:bg-purple-800 rounded text-xs">
                    {loansApi.formatCurrency(calculatedPenalty)}
                  </span>
                )}
              </button>
              
              {/* Penalty Section - Expandable */}
              {showPenaltySection && (
                <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">
                    Configurazione Penale
                  </h4>
                  
                  {/* Penalty Type Selection */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('penaltyType', 'PERCENTAGE')}
                      disabled={loading}
                      className={`flex-1 px-3 py-2 border rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                        formData.penaltyType === 'PERCENTAGE'
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          : 'border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <Percent className="w-4 h-4 inline mr-1" />
                      Percentuale
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('penaltyType', 'FIXED')}
                      disabled={loading}
                      className={`flex-1 px-3 py-2 border rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                        formData.penaltyType === 'FIXED'
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          : 'border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Importo Fisso
                    </button>
                  </div>
                  
                  {/* Penalty Amount */}
                  <input
                    type="number"
                    step={formData.penaltyType === 'PERCENTAGE' ? '0.1' : '0.01'}
                    min="0"
                    max={formData.penaltyType === 'PERCENTAGE' ? '100' : undefined}
                    value={formData.penaltyAmount}
                    onChange={(e) => handleInputChange('penaltyAmount', e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 ${
                      errors.penaltyAmount ? 'border-red-500' : 'border-purple-200 dark:border-purple-700'
                    }`}
                    placeholder={formData.penaltyType === 'PERCENTAGE' ? '0.0 %' : '0.00 €'}
                  />
                  {errors.penaltyAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.penaltyAmount}</p>
                  )}
                  {calculatedPenalty > 0 && (
                    <p className="text-purple-600 text-sm mt-1">
                      💰 Penale calcolata: {loansApi.formatCurrency(calculatedPenalty)}
                    </p>
                  )}
                </div>
              )}
            </div>


            {/* Total Amount Summary */}
            {(formData.payoffType === 'TOTAL' && remainingAmount > 0) || (formData.payoffType === 'PARTIAL' && payoffAmount > 0) ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Riepilogo Importi
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Importo estinzione:</span>
                    <span className="font-medium">
                      {loansApi.formatCurrency(formData.payoffType === 'TOTAL' ? remainingAmount : payoffAmount)}
                    </span>
                  </div>
                  
                  {/* Nuova rata - Solo per ricalcolo rata in estinzione parziale */}
                  {formData.payoffType === 'PARTIAL' && formData.recalculationType === 'RECALCULATE_PAYMENT' && newMonthlyPayment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Nuova rata:</span>
                      <span className="font-medium">{loansApi.formatCurrency(newMonthlyPayment)}</span>
                    </div>
                  )}
                  
                  {/* Penale - Se presente */}
                  {calculatedPenalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Penale:</span>
                      <span className="font-medium">{loansApi.formatCurrency(calculatedPenalty)}</span>
                    </div>
                  )}
                  
                  {/* Rate rimanenti - Solo per estinzione parziale */}
                  {formData.payoffType === 'PARTIAL' && remainingPaymentsPostPayoff > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Rate rimanenti:</span>
                      <span className="font-medium">{remainingPaymentsPostPayoff}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-blue-200 dark:border-blue-700 pt-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-blue-800 dark:text-blue-200">Totale da pagare:</span>
                      <span className="text-blue-800 dark:text-blue-200">
                        {loansApi.formatCurrency(
                          formData.payoffType === 'TOTAL' 
                            ? remainingAmount + calculatedPenalty
                            : totalPayoffAmount
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Notes Badge */}
            <div>
              <button
                type="button"
                onClick={() => setShowNotesSection(!showNotesSection)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Aggiungi Nota
                {formData.notes.trim().length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">
                    {formData.notes.length} caratteri
                  </span>
                )}
              </button>
              
              {/* Notes Section - Expandable */}
              {showNotesSection && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    Note Estinzione
                  </h4>
                  
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    disabled={loading}
                    placeholder="Aggiungi note sull'estinzione..."
                    rows={3}
                    maxLength={500}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none ${
                      errors.notes ? 'border-red-500' : 'border-blue-200 dark:border-blue-700'
                    }`}
                  />
                  {errors.notes && (
                    <p className="text-red-600 text-sm mt-1">{errors.notes}</p>
                  )}
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {formData.notes.length}/500 caratteri
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Conferma Estinzione
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
