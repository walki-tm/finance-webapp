/**
 * 📄 LOAN FORM MODAL: Modal per creare e modificare prestiti
 * 
 * 🎯 Scopo: Form modal completo per gestire dati dei prestiti
 * con validazione e calcoli automatici.
 * 
 * 🎨 Features:
 * - Form con validazione completa
 * - Calcoli automatici rata mensile
 * - Selezione categoria e sottocategoria per rate
 * - Supporto creazione e modifica
 * - UI responsive e accessibile
 * - Gestione errori integrata
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Campo conto reso obbligatorio
 */

import React, { useState, useEffect, useMemo } from 'react'
import { X, Calculator, AlertCircle, DollarSign, Calendar, Percent, ChevronDown, Wallet } from 'lucide-react'
import { MAIN_CATS } from '../../../lib/constants.js'
import { useCategories } from '../../categories/useCategories.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { formatDateForAPI, parseLocalDate } from '../../../lib/dateUtils.js'
import useAccounts from '../../accounts/useAccounts'

export default function LoanFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  title = "Nuovo Prestito" 
}) {
  // =============================================================================
  // 🔸 STATE MANAGEMENT
  // =============================================================================

  const { token } = useAuth()
  const { mains, subcats } = useCategories(token)
  const { accounts } = useAccounts(token) // 🏦 Hook per caricamento account

  // Genera la data odierna in formato YYYY-MM-DD usando timezone-safe utilities
  const getTodayDateString = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    console.log('📅 Generated today date:', dateString)
    return dateString
  }, []) // Memorizza il valore così non viene ricalcolato ad ogni render

  const [formData, setFormData] = useState({
    name: '',
    lenderName: '',
    loanType: 'PERSONAL_LOAN',
    principalAmount: '',
    interestRate: '',
    termMonths: '',
    startDate: getTodayDateString,
    monthlyPayment: '',
    description: '',
    categoryMain: 'DEBT', // Default per prestiti
    subcategoryId: '',
    accountId: '' // 🏦 Account associato al prestito
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // =============================================================================
  // 🔸 COMPUTED VALUES FOR CATEGORIES
  // =============================================================================

  // Filtra sottocategorie per categoria principale selezionata
  const filteredSubcats = useMemo(() => {
    if (!formData.categoryMain || !subcats[formData.categoryMain]) return []
    return subcats[formData.categoryMain] || []
  }, [formData.categoryMain, subcats])

  // =============================================================================
  // 🔸 EFFECTS
  // =============================================================================

  // Reset sottocategoria quando cambia la categoria principale
  useEffect(() => {
    setFormData(prev => ({ ...prev, subcategoryId: '' }))
  }, [formData.categoryMain])

  // Initialize form with existing data when editing
  useEffect(() => {
    if (!isOpen) return // Non inizializzare se il modal è chiuso
    
    // Ottieni sempre la data odierna fresca usando il valore memorizzato
    const todayDate = getTodayDateString
    console.log('🔄 useEffect - setting form data with todayDate:', todayDate)
    
    if (initialData) {
      const newFormData = {
        name: initialData.name || '',
        lenderName: initialData.lenderName || '',
        loanType: initialData.loanType || 'PERSONAL_LOAN',
        principalAmount: initialData.principalAmount?.toString() || '',
        // Converti interestRate da decimale (0.035) a percentuale (3.5) per il form
        interestRate: initialData.interestRate ? (parseFloat(initialData.interestRate) * 100).toString() : '',
        // Usa durationMonths invece di termMonths dal database
        termMonths: initialData.durationMonths?.toString() || '',
        // Usa firstPaymentDate se disponibile, altrimenti startDate
        startDate: initialData.firstPaymentDate 
          ? new Date(initialData.firstPaymentDate).toISOString().split('T')[0]
          : initialData.startDate 
          ? new Date(initialData.startDate).toISOString().split('T')[0] 
          : todayDate,
        monthlyPayment: initialData.monthlyPayment?.toString() || '',
        description: initialData.description || '',
        categoryMain: initialData.categoryMain || 'DEBT',
        subcategoryId: initialData.subcategoryId || '',
        accountId: initialData.accountId || '' // 🏦 Account associato al prestito
      }
      console.log('🔄 Setting form data for edit with startDate:', newFormData.startDate)
      setFormData(newFormData)
    } else {
      // Reset form for new loan - SEMPRE imposta data odierna
      const newFormData = {
        name: '',
        lenderName: '',
        loanType: 'PERSONAL_LOAN',
        principalAmount: '',
        interestRate: '',
        termMonths: '',
        startDate: todayDate, // Usa la data odierna fresca
        monthlyPayment: '',
        description: '',
        categoryMain: 'DEBT', // Default per prestiti
        subcategoryId: '',
        accountId: '' // 🏦 Account associato al prestito
      }
      console.log('🔄 Setting form data for new loan with startDate:', newFormData.startDate)
      setFormData(newFormData)
    }
    setErrors({})
  }, [initialData, isOpen])

  // =============================================================================
  // 🔸 COMPUTED VALUES
  // =============================================================================

  // Calculate monthly payment automatically
  const calculatedMonthlyPayment = useMemo(() => {
    const principal = parseFloat(formData.principalAmount)
    const rate = parseFloat(formData.interestRate)
    const months = parseInt(formData.termMonths)

    if (principal && rate && months && principal > 0 && rate > 0 && months > 0) {
      const monthlyRate = rate / 100 / 12
      const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      return payment.toFixed(2)
    }
    return ''
  }, [formData.principalAmount, formData.interestRate, formData.termMonths])

  // =============================================================================
  // 🔸 EVENT HANDLERS
  // =============================================================================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleCalculatePayment = () => {
    if (calculatedMonthlyPayment) {
      setFormData(prev => ({ ...prev, monthlyPayment: calculatedMonthlyPayment }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome prestito richiesto'
    }

    if (!formData.lenderName.trim()) {
      newErrors.lenderName = 'Nome creditore richiesto'
    }

    if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
      newErrors.principalAmount = 'Importo deve essere maggiore di 0'
    }

    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      newErrors.interestRate = 'Tasso interesse deve essere ≥ 0'
    }

    if (!formData.termMonths || parseInt(formData.termMonths) <= 0) {
      newErrors.termMonths = 'Durata deve essere maggiore di 0 mesi'
    }

    if (!formData.monthlyPayment || parseFloat(formData.monthlyPayment) <= 0) {
      newErrors.monthlyPayment = 'Rata mensile richiesta'
    }

    if (!formData.categoryMain) {
      newErrors.categoryMain = 'Categoria principale richiesta'
    }

    if (!formData.subcategoryId) {
      newErrors.subcategoryId = 'Sottocategoria richiesta'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data inizio richiesta'
    }


    if (!formData.accountId) {
      newErrors.accountId = 'Conto richiesto'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🐛 [LoanFormModal] Submitting loan with formData.startDate:', formData.startDate)
      const parsedStartDate = parseLocalDate(formData.startDate)
      const apiFormattedDate = formatDateForAPI(parsedStartDate)
      console.log('🐛 [LoanFormModal] Date conversion:')
      console.log('  - Original formData.startDate:', formData.startDate)
      console.log('  - Parsed local date:', parsedStartDate)
      console.log('  - API formatted date:', apiFormattedDate)
      
      const submitData = {
        name: formData.name.trim(),
        lenderName: formData.lenderName.trim(),
        loanType: formData.loanType,
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate) / 100, // Convert percentage to decimal for API
        durationMonths: parseInt(formData.termMonths), // API usa durationMonths
        firstPaymentDate: apiFormattedDate, // API usa firstPaymentDate
        monthlyPayment: parseFloat(formData.monthlyPayment),
        categoryMain: formData.categoryMain,
        subcategoryId: formData.subcategoryId,
        accountId: formData.accountId // Account ora obbligatorio
      }
      
      console.log('🐛 [LoanFormModal] Final submitData:', submitData)

      // Only include description if it has a value (avoid sending null)
      if (formData.description.trim()) {
        submitData.description = formData.description.trim()
      }


      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error submitting loan:', error)
      // TODO: Add toast error handling
    } finally {
      setIsSubmitting(false)
    }
  }

  // =============================================================================
  // 🔸 RENDER
  // =============================================================================

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Informazioni Base
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome Prestito *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="es. Mutuo Casa, Prestito Auto..."
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Lender name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Creditore *
                </label>
                <input
                  type="text"
                  value={formData.lenderName}
                  onChange={(e) => handleInputChange('lenderName', e.target.value)}
                  placeholder="es. Intesa Sanpaolo, UniCredit..."
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lenderName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.lenderName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lenderName}
                  </p>
                )}
              </div>
            </div>

            {/* Loan type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo Prestito
              </label>
              <select
                value={formData.loanType}
                onChange={(e) => handleInputChange('loanType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PERSONAL_LOAN">Prestito Personale</option>
                <option value="MORTGAGE">Mutuo</option>
              </select>
            </div>
          </div>

          {/* Financial details section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Dettagli Finanziari
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Principal amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importo Prestito (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.principalAmount}
                  onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.principalAmount ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.principalAmount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.principalAmount}
                  </p>
                )}
              </div>

              {/* Interest rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tasso Interesse (% annuo) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.interestRate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.interestRate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.interestRate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Term months */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Durata (mesi) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.termMonths}
                  onChange={(e) => handleInputChange('termMonths', e.target.value)}
                  placeholder="60"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.termMonths ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.termMonths && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.termMonths}
                  </p>
                )}
              </div>

              {/* Start date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Data Inizio *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startDate}
                  </p>
                )}
              </div>
            </div>

            {/* Monthly payment with calculator */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rata Mensile (€) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPayment}
                  onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
                  placeholder="0.00"
                  className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.monthlyPayment ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {calculatedMonthlyPayment && (
                  <button
                    type="button"
                    onClick={handleCalculatePayment}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    title={`Calcola automaticamente: €${calculatedMonthlyPayment}`}
                  >
                    <Calculator className="w-4 h-4" />
                    Calcola
                  </button>
                )}
              </div>
              {calculatedMonthlyPayment && (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Rata calcolata: €{calculatedMonthlyPayment}
                </p>
              )}
              {errors.monthlyPayment && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.monthlyPayment}
                </p>
              )}
            </div>
          </div>

          {/* Categorization section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ChevronDown className="w-5 h-5" />
              Categorizzazione Rate
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Seleziona categoria e sottocategoria per le rate del prestito che verranno create automaticamente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Categoria Principale *
                </label>
              <select
                value={formData.categoryMain}
                onChange={(e) => handleInputChange('categoryMain', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.categoryMain ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {MAIN_CATS.filter(cat => cat.key !== 'income').map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.name}</option>
                ))}
              </select>
                {errors.categoryMain && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.categoryMain}
                  </p>
                )}
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sottocategoria *
                </label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
                  disabled={filteredSubcats.length === 0}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.subcategoryId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">
                    {filteredSubcats.length === 0 ? 'Nessuna sottocategoria disponibile' : 'Seleziona sottocategoria...'}
                  </option>
                  {filteredSubcats.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                {errors.subcategoryId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.subcategoryId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-500" />
              Seleziona Conto *
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => handleInputChange('accountId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.accountId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Seleziona un conto...</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.balance !== undefined && `(€${account.balance.toFixed(2)})`}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.accountId}
              </p>
            )}
            {formData.accountId && !errors.accountId ? (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                ✓ Conto selezionato
              </p>
            ) : !errors.accountId ? (
              <p className="mt-1 text-sm text-slate-500">
                Seleziona un conto per tracciare l'impatto del prestito
              </p>
            ) : null}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descrizione (opzionale)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Note aggiuntive sul prestito..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  {initialData ? 'Aggiorna' : 'Crea'} Prestito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
