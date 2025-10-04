/**
 * 📄 ACCOUNT MODAL: Modal per creazione/modifica conti
 * 
 * 🎯 Scopo: Interfaccia moderna per CRUD operazioni sui conti
 * 
 * 🔧 Dipendenze principali:
 * - React per UI e state management
 * - UI components per form elements
 * - accountIcons per configurazione tipi e colori
 * 
 * 📝 Note:
 * - Modal responsive e accessibile
 * - Palette colori interattiva
 * - Selezione tipo conto con icone
 * - Validazione form completa
 * - Preview in tempo reale
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione AccountModal
 */

// 🔸 Import dependencies
import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { Button, Input, Label, NativeSelect } from '../../../components/ui'
import { 
  ACCOUNT_COLOR_PALETTE, 
  getAllAccountTypes, 
  getAccountIcon 
} from '../../../lib/accountIcons'

/**
 * 🎯 COMPONENTE: AccountModal
 * 
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Se modal è aperto
 * @param {Function} props.onClose - Callback per chiusura modal
 * @param {Function} props.onSave - Callback per salvataggio dati
 * @param {Object} props.initialData - Dati iniziali per modifica (null per creazione)
 * @param {boolean} props.isLoading - Loading state per salvataggio
 */
export default function AccountModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isLoading = false
}) {
  // 🔸 State per form
  const [formData, setFormData] = useState({
    name: '',
    accountType: 'CURRENT',
    balance: 0,
    colorHex: ACCOUNT_COLOR_PALETTE[0]
  })
  
  const [errors, setErrors] = useState({})

  // 🔸 Determina se siamo in modalità edit
  const isEditing = Boolean(initialData)

  // 🔸 Ottieni tutti i tipi account disponibili
  const accountTypes = getAllAccountTypes()

  // 🔸 Effect per inizializzazione form con dati esistenti
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Modalità edit - carica dati esistenti
        setFormData({
          name: initialData.name || '',
          accountType: initialData.accountType || 'CURRENT',
          balance: initialData.balance || 0,
          colorHex: initialData.colorHex || ACCOUNT_COLOR_PALETTE[0]
        })
      } else {
        // Modalità create - reset form
        setFormData({
          name: '',
          accountType: 'CURRENT',
          balance: 0,
          colorHex: ACCOUNT_COLOR_PALETTE[0]
        })
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  // 🔸 Handler per cambiamenti form
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error per campo modificato
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // 🔸 Validazione form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome conto richiesto'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nome troppo lungo (max 100 caratteri)'
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Tipo conto richiesto'
    }

    if (isNaN(formData.balance)) {
      newErrors.balance = 'Saldo deve essere un numero valido'
    }

    if (!formData.colorHex || !/^#[0-9A-F]{6}$/i.test(formData.colorHex)) {
      newErrors.colorHex = 'Colore non valido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 🔸 Handler per submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const success = await onSave?.(formData)
    if (success) {
      onClose?.()
    }
  }

  // 🔸 Handler per chiusura modal
  const handleClose = () => {
    if (!isLoading) {
      onClose?.()
    }
  }

  // 🔸 Ottieni configurazione icona per tipo selezionato
  const selectedTypeConfig = getAccountIcon(formData.accountType)
  const SelectedIcon = selectedTypeConfig.icon

  // 🔸 Non renderizzare se modal chiuso
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Modifica Conto' : 'Nuovo Conto'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Preview card */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{ backgroundColor: `${formData.colorHex}15` }}
              >
                <SelectedIcon 
                  className="w-6 h-6"
                  style={{ color: formData.colorHex }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {formData.name || 'Nome conto'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedTypeConfig.label}
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formData.balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>

          {/* Nome conto */}
          <div>
            <Label htmlFor="accountName">Nome Conto *</Label>
            <Input
              id="accountName"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="es. Unicredit"
              className={errors.name ? 'border-rose-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Tipo conto */}
          <div>
            <Label htmlFor="accountType">Tipo Conto *</Label>
            <NativeSelect
              value={formData.accountType}
              onChange={(value) => handleChange('accountType', value)}
              options={accountTypes.map(type => ({
                value: type.type,
                label: type.label
              }))}
              className={errors.accountType ? 'border-rose-500' : ''}
            />
            {selectedTypeConfig.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {selectedTypeConfig.description}
              </p>
            )}
          </div>

          {/* Saldo iniziale */}
          <div>
            <Label htmlFor="balance">Saldo Iniziale</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => handleChange('balance', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={errors.balance ? 'border-rose-500' : ''}
              disabled={isLoading}
            />
            {errors.balance && (
              <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{errors.balance}</p>
            )}
          </div>

          {/* Palette colori */}
          <div>
            <Label>Colore *</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {ACCOUNT_COLOR_PALETTE.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('colorHex', color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.colorHex === color 
                      ? 'border-slate-400 dark:border-slate-500 scale-110' 
                      : 'border-slate-200 dark:border-slate-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isLoading}
                >
                  {formData.colorHex === color && (
                    <Check className="w-5 h-5 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? 'Aggiornamento...' : 'Creazione...'}
                </div>
              ) : (
                isEditing ? 'Aggiorna' : 'Crea Conto'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
