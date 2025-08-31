/**
 * 📄 LOANS FEATURE INDEX
 * 
 * 🎯 Scopo: Esporta tutti i componenti e hook della feature prestiti/mutui
 * per facile importazione da altre parti dell'applicazione.
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale feature prestiti
 */

// =============================================================================
// 🎯 HOOKS
// =============================================================================

export { useLoans } from './useLoans.js'

// =============================================================================
// 🎯 SERVICES
// =============================================================================

export { loansApi, extendApiWithLoans } from './services/loans.api.js'

// =============================================================================
// 🎯 COMPONENTS
// =============================================================================

// Dashboard components
export { default as LoansDashboard } from './components/LoansDashboard.jsx'
export { default as LoanCard } from './components/LoanCard.jsx'
// export { LoanSummary } from './components/LoanSummary.jsx'

// Form components (da implementare)
// export { LoanForm } from './components/LoanForm.jsx'
// export { LoanFormModal } from './components/LoanFormModal.jsx'

// Detail components (da implementare)
// export { LoanDetails } from './components/LoanDetails.jsx'
// export { AmortizationTable } from './components/AmortizationTable.jsx'
// export { PaymentRecordModal } from './components/PaymentRecordModal.jsx'

// Simulation components (da implementare)
// export { PayoffSimulator } from './components/PayoffSimulator.jsx'
// export { SimulationResults } from './components/SimulationResults.jsx'

// =============================================================================
// 🎯 PAGES
// =============================================================================

export { default as LoansPage } from './pages/LoansPage.jsx'

// =============================================================================
// 🎯 UTILITIES
// =============================================================================

// export { loanCalculations } from './lib/loanCalculations.js'
// export { loanValidations } from './lib/loanValidations.js'

// =============================================================================
// 🎯 CONSTANTS
// =============================================================================

export const LOAN_TYPES = {
  MORTGAGE: 'MORTGAGE',
  PERSONAL_LOAN: 'PERSONAL_LOAN'
}

export const LOAN_STATUS = {
  ACTIVE: 'ACTIVE',
  PAID_OFF: 'PAID_OFF', 
  SUSPENDED: 'SUSPENDED',
  DEFAULTED: 'DEFAULTED'
}

export const PAYMENT_STATUS = {
  PLANNED: 'PLANNED',
  DUE: 'DUE',
  PAID: 'PAID',
  PAID_LATE: 'PAID_LATE',
  PARTIAL: 'PARTIAL',
  SKIPPED: 'SKIPPED'
}

export const PAYMENT_FREQUENCY = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMIANNUAL: 'SEMIANNUAL'
}

export const RATE_TYPE = {
  FIXED: 'FIXED',
  VARIABLE: 'VARIABLE'
}
