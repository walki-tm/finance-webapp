/**
 * 📄 LOANS DASHBOARD: Dashboard principale per gestione prestiti/mutui
 * 
 * 🎯 Scopo: Interfaccia principale per visualizzare e gestire tutti i prestiti
 * dell'utente con riassunto finanziario e azioni rapide.
 * 
 * 🎨 Features:
 * - Cards riassuntive con metriche principali
 * - Griglia di LoanCard per tutti i prestiti
 * - Filtri per stato e tipo prestito
 * - Azioni rapide (nuovo prestito, importa dati)
 * - Integrazione con modal per operazioni dettagliate
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale dashboard prestiti
 */

import React, { useState, useMemo } from 'react'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertCircle,
  Filter,
  Search,
  PiggyBank,
  DollarSign
} from 'lucide-react'
import LoanCard from './LoanCard.jsx'
import { loansApi } from '../services/loans.api.js'

export default function LoansDashboard({
  loans,
  summary,
  loading,
  error,
  openModal,
  formatCurrency
}) {

  // =============================================================================
  // 🔸 LOCAL STATE
  // =============================================================================
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // =============================================================================
  // 🔸 COMPUTED VALUES
  // =============================================================================

  const filteredLoans = useMemo(() => {
    let filtered = loans

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(loan => 
        loan.name.toLowerCase().includes(query) ||
        loan.lenderName.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(loan => loan.loanType === typeFilter)
    }

    return filtered
  }, [loans, searchQuery, statusFilter, typeFilter])

  const upcomingPayments = useMemo(() => {
    return loans
      .filter(loan => loan.nextPayment?.dueDate && loan.status === 'ACTIVE')
      .map(loan => {
        const dueDate = new Date(loan.nextPayment.dueDate)
        const today = new Date()
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
        
        return {
          ...loan,
          daysUntilDue: diffDays,
          isOverdue: diffDays < 0,
          isDueToday: diffDays === 0,
          isDueSoon: diffDays > 0 && diffDays <= 7
        }
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5) // Show next 5 payments
  }, [loans])

  // =============================================================================
  // 🔸 EVENT HANDLERS
  // =============================================================================

  const handleViewDetails = (loan) => {
    openModal('loanDetails', loan)
  }

  const handleRecordPayment = (loan, paymentInfo) => {
    openModal('paymentRecord', { loan, paymentInfo })
  }

  const handleSimulatePayoff = (loan) => {
    openModal('simulatePayoff', loan)
  }

  const handleEditLoan = (loan) => {
    openModal('editLoan', loan)
  }

  const handleDeleteLoan = (loan) => {
    openModal('deleteLoan', loan)
  }

  const handlePayoffLoan = (loan) => {
    console.log('🔥 [LoansDashboard] handlePayoffLoan called for:', loan.name)
    console.log('🔥 [LoansDashboard] openModal function:', typeof openModal)
    openModal('payoffLoan', loan)
  }

  const handleCreateLoan = () => {
    openModal('createLoan')
  }

  // =============================================================================
  // 🔸 RENDER HELPERS
  // =============================================================================

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total debt */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Debito Totale
          </h3>
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(summary.totalDebt)}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {summary.activeLoans} prestiti attivi
        </p>
      </div>

      {/* Monthly payments */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Rate Mensili
          </h3>
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(summary.monthlyPayments)}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          al mese
        </p>
      </div>

      {/* Next payment */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Prossimo Pagamento
          </h3>
          <DollarSign className={`w-4 h-4 ${
            upcomingPayments[0]?.isOverdue || upcomingPayments[0]?.isDueToday
              ? 'text-red-500'
              : upcomingPayments[0]?.isDueSoon
              ? 'text-amber-500'
              : 'text-emerald-500'
          }`} />
        </div>
        {upcomingPayments[0] ? (
          <>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(upcomingPayments[0].monthlyPayment)}
            </p>
            <p className={`text-sm ${
              upcomingPayments[0].isOverdue
                ? 'text-red-600'
                : upcomingPayments[0].isDueToday
                ? 'text-amber-600'
                : upcomingPayments[0].isDueSoon
                ? 'text-orange-600'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {upcomingPayments[0].isOverdue && 'Scaduta - '}
              {upcomingPayments[0].isDueToday && 'Oggi - '}
              {upcomingPayments[0].isDueSoon && `Tra ${upcomingPayments[0].daysUntilDue}g - `}
              {upcomingPayments[0].name}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-400">
              --
            </p>
            <p className="text-sm text-slate-400">
              Nessun pagamento programmato
            </p>
          </>
        )}
      </div>

      {/* Total loans */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Prestiti Totali
          </h3>
          <PiggyBank className="w-4 h-4 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {summary.totalLoans}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          gestiti
        </p>
      </div>
    </div>
  )

  const renderFilters = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca prestiti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">Tutti gli stati</option>
        <option value="ACTIVE">Attivi</option>
        <option value="PAID_OFF">Estinti</option>
        <option value="SUSPENDED">Sospesi</option>
        <option value="DEFAULTED">Inadempienti</option>
      </select>

      {/* Type filter */}
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">Tutti i tipi</option>
        <option value="MORTGAGE">Mutui</option>
        <option value="PERSONAL_LOAN">Prestiti</option>
      </select>

      {/* New loan button */}
      <button
        onClick={handleCreateLoan}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nuovo Prestito
      </button>
    </div>
  )

  // =============================================================================
  // 🔸 MAIN RENDER
  // =============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-slate-600 dark:text-slate-400">Caricamento prestiti...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Errore nel caricamento
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Prestiti e Mutui
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestisci i tuoi prestiti e monitora i pagamenti
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {renderSummaryCards()}

      {/* Filters and search */}
      {renderFilters()}

      {/* Loans grid */}
      <div className="space-y-4">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-12">
            <PiggyBank className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Nessun prestito trovato'
                : 'Nessun prestito configurato'
              }
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo il tuo primo prestito o mutuo'
              }
            </p>
            {(!searchQuery && statusFilter === 'all' && typeFilter === 'all') && (
              <button
                onClick={handleCreateLoan}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Prestito
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onViewDetails={handleViewDetails}
                onRecordPayment={handleRecordPayment}
                onSimulatePayoff={handleSimulatePayoff}
                onEdit={handleEditLoan}
                onDelete={handleDeleteLoan}
                onPayoff={handlePayoffLoan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
