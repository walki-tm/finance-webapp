/**
 * 📄 LOAN DETAILS MODAL: Modale per visualizzazione dettagli prestito
 * 
 * 🎯 Scopo: Mostra informazioni dettagliate del prestito inclusi
 * rate rimanenti, data fine prestito, interessi totali e pagati.
 * 
 * 🎨 Features:
 * - Informazioni dettagliate prestito
 * - Rate rimanenti e data fine prestito
 * - Interessi totali del prestito calcolati
 * - Interessi già pagati
 * - Design responsive e accessibile
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-02 - Implementazione modale dettagli
 */

import React, { useMemo } from 'react'
import { 
  X, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Info,
  CreditCard,
  Home,
  Calculator,
  Percent
} from 'lucide-react'
import { loansApi } from '../services/loans.api.js'

export default function LoanDetailsModal({ 
  isOpen, 
  onClose, 
  loan 
}) {
  // =============================================================================
  // 🔸 COMPUTED VALUES
  // =============================================================================
  
  const loanDetails = useMemo(() => {
    if (!loan) return null

    // Calcola data fine prestito
    const remainingPayments = loan.totalPayments - loan.paidPayments
    const nextPaymentDate = new Date(loan.nextPaymentDate || loan.startDate)
    const endDate = new Date(nextPaymentDate)
    endDate.setMonth(endDate.getMonth() + remainingPayments - 1)

    // Calcola interessi totali del prestito (rata × mensilità - ammontare prestito)
    const totalInterest = (parseFloat(loan.monthlyPayment) * loan.totalPayments) - parseFloat(loan.principalAmount)

    // Calcola interessi già pagati (basato sulle transazioni)
    const interestPaid = loan.transactions?.reduce((sum, tx) => 
      sum + parseFloat(tx.interestAmount || 0), 0
    ) || 0

    return {
      remainingPayments,
      endDate,
      totalInterest,
      interestPaid,
      interestRemaining: totalInterest - interestPaid
    }
  }, [loan])

  const progress = useMemo(() => {
    if (!loan) return null
    return loansApi.calculateProgress(loan)
  }, [loan])

  const loanTypeInfo = useMemo(() => {
    const typeMap = {
      'MORTGAGE': {
        text: 'Mutuo',
        icon: Home,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      },
      'PERSONAL_LOAN': {
        text: 'Prestito Personale',
        icon: CreditCard,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
      }
    }
    
    return typeMap[loan?.loanType] || typeMap['PERSONAL_LOAN']
  }, [loan?.loanType])

  // =============================================================================
  // 🔸 EVENT HANDLERS
  // =============================================================================
  
  const handleClose = () => {
    onClose()
  }

  // =============================================================================
  // 🔸 RENDER
  // =============================================================================
  
  if (!isOpen || !loan || !loanDetails) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${loanTypeInfo.bgColor} rounded-lg`}>
              <loanTypeInfo.icon className={`w-5 h-5 ${loanTypeInfo.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Dettagli Prestito
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {loan.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Informazioni generali */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Informazioni Generali
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Banca/Ente:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{loan.lenderName}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Tipo:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{loanTypeInfo.text}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Stato:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  loan.status === 'ACTIVE' 
                    ? progress?.percentage >= 100 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : loan.status === 'PAID_OFF'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {loan.status === 'ACTIVE' 
                    ? progress?.percentage >= 100 ? 'Terminato' : 'Attivo'
                    : loan.status === 'PAID_OFF' ? 'Estinto' : loan.status
                  }
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Tasso annuo:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {(parseFloat(loan.interestRate) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Informazioni finanziarie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ammontari */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ammontari
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Importo iniziale:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {loansApi.formatCurrency(loan.principalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Debito residuo:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {loansApi.formatCurrency(loan.currentBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Importo pagato:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {loansApi.formatCurrency(parseFloat(loan.principalAmount) - parseFloat(loan.currentBalance))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Rata mensile:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {loansApi.formatCurrency(loan.monthlyPayment)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rate e scadenze */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rate e Scadenze
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Rate pagate:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {loan.paidPayments} / {loan.totalPayments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Rate rimanenti:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {loanDetails.remainingPayments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Prossima rata:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {progress?.percentage < 100 
                      ? new Date(loan.nextPaymentDate || loan.startDate).toLocaleDateString('it-IT')
                      : 'Completato'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Fine prestito:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {progress?.percentage >= 100 
                      ? 'Terminato'
                      : loanDetails.endDate.toLocaleDateString('it-IT')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interessi */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Dettaglio Interessi
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-amber-700 dark:text-amber-300">Interessi totali prestito:</span>
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-lg">
                  {loansApi.formatCurrency(loanDetails.totalInterest)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ({loan.monthlyPayment} × {loan.totalPayments} - {loansApi.formatCurrency(loan.principalAmount)})
                </p>
              </div>
              <div>
                <span className="text-amber-700 dark:text-amber-300">Interessi pagati:</span>
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-lg">
                  {loansApi.formatCurrency(loanDetails.interestPaid)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Su {loan.paidPayments} rate pagate
                </p>
              </div>
              <div>
                <span className="text-amber-700 dark:text-amber-300">Interessi rimanenti:</span>
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-lg">
                  {loansApi.formatCurrency(loanDetails.interestRemaining)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Su {loanDetails.remainingPayments} rate rimanenti
                </p>
              </div>
            </div>
          </div>

          {/* Barra di progresso */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progresso Pagamento
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Completamento</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {progress?.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    progress?.percentage >= 75 ? 'bg-emerald-500' :
                    progress?.percentage >= 50 ? 'bg-blue-500' :
                    progress?.percentage >= 25 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${Math.min(progress?.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Note aggiuntive */}
          {loan.notes && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Note
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {loan.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
