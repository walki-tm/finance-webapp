/**
 * 📄 LOAN CARD: Card per visualizzazione prestito nel dashboard
 * 
 * 🎯 Scopo: Visualizza informazioni essenziali del prestito in formato card compatto
 * con indicatori di progresso, prossima rata e azioni rapide.
 * 
 * 🎨 Features:
 * - Barra di progresso visuale del pagamento
 * - Badge di stato (attivo, pagato, sospeso)
 * - Indicatore prossima rata con data
 * - Menu azioni rapide (dettagli, pagamento, simulazione)
 * - Colori basati sullo stato e tipo prestito
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale card prestiti
 */

import React, { useMemo } from 'react'
import { 
  Calendar, 
  TrendingUp, 
  Home, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Pause,
  Eye,
  DollarSign,
  Calculator
} from 'lucide-react'
import ActionsMenu from '../../categories/components/ActionsMenu.jsx'
import { loansApi } from '../services/loans.api.js'

export default function LoanCard({ 
  loan, 
  onViewDetails, 
  onRecordPayment, 
  onSimulatePayoff, 
  onEdit, 
  onDelete,
  onSkipPayment
}) {
  // =============================================================================
  // 🔸 COMPUTED VALUES
  // =============================================================================

  const progress = useMemo(() => {
    return loansApi.calculateProgress(loan)
  }, [loan])

  const nextPaymentInfo = useMemo(() => {
    console.log('🔧 DEBUG: LoanCard calculating nextPaymentInfo for loan:', loan.name)
    console.log('🔧 DEBUG: loan object keys:', Object.keys(loan))
    console.log('🔧 DEBUG: loan.nextPayment:', loan.nextPayment)
    console.log('🔧 DEBUG: loan.nextPayment.dueDate:', loan.nextPayment?.dueDate)
    console.log('🔧 DEBUG: loan.plannedTransactions:', loan.plannedTransactions)
    console.log('🔧 DEBUG: loan.firstPaymentDate:', loan.firstPaymentDate)
    console.log('🔧 DEBUG: loan.currentBalance:', loan.currentBalance)
    
    if (!loan.nextPayment?.dueDate) {
      // Fallback 1: cerca la prossima rata nei plannedTransactions
      if (loan.plannedTransactions && loan.plannedTransactions.length > 0) {
        const nextPlanned = loan.plannedTransactions.find(pt => pt.nextDueDate)
        if (nextPlanned?.nextDueDate) {
          const dueDate = new Date(nextPlanned.nextDueDate)
          const today = new Date()
          const diffTime = dueDate - today
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          return {
            date: dueDate,
            daysUntil: diffDays,
            amount: loan.monthlyPayment,
            isOverdue: diffDays < 0,
            isDueToday: diffDays === 0,
            isDueSoon: diffDays > 0 && diffDays <= 7
          }
        }
      }

      // Fallback 2: calcola dalla firstPaymentDate del prestito
      if (loan.firstPaymentDate) {
        const firstPayment = new Date(loan.firstPaymentDate)
        const today = new Date()
        let nextDate = new Date(firstPayment)
        
        // Se la prima rata è futura, usa quella
        if (firstPayment > today) {
          const diffTime = firstPayment - today
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          return {
            date: firstPayment,
            daysUntil: diffDays,
            amount: loan.monthlyPayment,
            isOverdue: false,
            isDueToday: diffDays === 0,
            isDueSoon: diffDays > 0 && diffDays <= 7
          }
        }
        
        // Altrimenti calcola la prossima rata mensile
        while (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        
        const diffTime = nextDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
          date: nextDate,
          daysUntil: diffDays,
          amount: loan.monthlyPayment,
          isOverdue: false, // Assumiamo non scaduta per il fallback
          isDueToday: diffDays === 0,
          isDueSoon: diffDays > 0 && diffDays <= 7
        }
      }
      
      return null
    }
    
    const dueDate = new Date(loan.nextPayment.dueDate)
    const today = new Date()
    const diffTime = dueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return {
      date: dueDate,
      daysUntil: diffDays,
      amount: loan.nextPayment.amount || loan.monthlyPayment,
      isOverdue: diffDays < 0,
      isDueToday: diffDays === 0,
      isDueSoon: diffDays > 0 && diffDays <= 7
    }
  }, [loan.nextPayment, loan.monthlyPayment, loan.plannedTransactions])

  const statusInfo = useMemo(() => {
    const statusMap = {
      'ACTIVE': {
        text: 'Attivo',
        icon: CheckCircle2,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        dotColor: 'bg-emerald-500 dark:bg-emerald-400'
      },
      'PAID_OFF': {
        text: 'Estinto',
        icon: CheckCircle2,
        color: 'text-green-800 dark:text-green-300',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        dotColor: 'bg-green-600 dark:bg-green-400'
      },
      'SUSPENDED': {
        text: 'Sospeso',
        icon: Pause,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        dotColor: 'bg-amber-500 dark:bg-amber-400'
      },
      'DEFAULTED': {
        text: 'Inadempiente',
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        dotColor: 'bg-red-500 dark:bg-red-400'
      }
    }
    
    return statusMap[loan.status] || statusMap['ACTIVE']
  }, [loan.status])

  const loanTypeInfo = useMemo(() => {
    const typeMap = {
      'MORTGAGE': {
        text: 'Mutuo',
        icon: Home,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        cardBgColor: 'bg-blue-50/80 dark:bg-blue-900/10'
      },
      'PERSONAL_LOAN': {
        text: 'Prestito',
        icon: CreditCard,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        cardBgColor: 'bg-purple-50/80 dark:bg-purple-900/10'
      }
    }
    
    return typeMap[loan.loanType] || typeMap['PERSONAL_LOAN']
  }, [loan.loanType])

  // =============================================================================
  // 🔸 STYLE HELPERS
  // =============================================================================

  const getNextPaymentStyle = () => {
    if (!nextPaymentInfo) return 'text-slate-500 dark:text-slate-400'
    
    if (nextPaymentInfo.isOverdue) {
      return 'text-red-600 dark:text-red-400 font-semibold'
    } else if (nextPaymentInfo.isDueToday) {
      return 'text-amber-600 dark:text-amber-400 font-semibold'
    } else if (nextPaymentInfo.isDueSoon) {
      return 'text-orange-600 dark:text-orange-400 font-medium'
    }
    
    return 'text-slate-600 dark:text-slate-400'
  }

  const getProgressBarColor = () => {
    const percentage = progress.percentage
    
    if (percentage >= 75) return 'bg-emerald-500'
    if (percentage >= 50) return 'bg-blue-500'
    if (percentage >= 25) return 'bg-amber-500'
    return 'bg-slate-400'
  }

  // =============================================================================
  // 🔸 ACTION HANDLERS
  // =============================================================================

  const handleViewDetails = () => {
    onViewDetails?.(loan)
  }

  const handleRecordPayment = () => {
    onRecordPayment?.(loan, nextPaymentInfo)
  }

  const handleSimulatePayoff = () => {
    onSimulatePayoff?.(loan)
  }

  // =============================================================================
  // 🔸 RENDER
  // =============================================================================

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group bg-white dark:bg-slate-800 ${loanTypeInfo.cardBgColor}`}>
      
      {/* Header with status and type */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg truncate">
              {loan.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
              {loan.lenderName}
            </p>
          </div>
          
          {/* Status and type badges */}
          <div className="flex flex-col items-end gap-1 ml-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.text}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${loanTypeInfo.color} ${loanTypeInfo.bgColor}`}>
              <loanTypeInfo.icon className="w-3 h-3" />
              {loanTypeInfo.text}
            </div>
          </div>
        </div>

        {/* Current balance (prominent) */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
            Debito residuo
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {loansApi.formatCurrency(progress.remainingAmount)}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            di {loansApi.formatCurrency(loan.principalAmount)} iniziali
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Progresso pagamento
            </span>
            <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
              {progress.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payment info section */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prossima rata
              </p>
              {nextPaymentInfo ? (
                <p className={`text-sm font-medium ${getNextPaymentStyle()}`}>
                  {nextPaymentInfo.date.toLocaleDateString('it-IT')}
                  {nextPaymentInfo.isOverdue && ' (Scaduta)'}
                  {nextPaymentInfo.isDueToday && ' (Oggi)'}
                  {nextPaymentInfo.isDueSoon && ` (${nextPaymentInfo.daysUntil}g)`}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Non disponibile
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Importo
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {loansApi.formatCurrency(loan.monthlyPayment)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewDetails}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white/80 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Eye className="w-3 h-3" />
              Dettagli
            </button>
            
          </div>

          <ActionsMenu
            customActions={[
              {
                label: '📊 Simula estinzione',
                onClick: handleSimulatePayoff,
                icon: Calculator
              },
              {
                label: '🗑️ Elimina',
                onClick: () => onDelete?.(loan),
                icon: 'delete',
                variant: 'danger'
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}
