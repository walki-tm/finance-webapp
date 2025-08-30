/**
 * 📄 BUDGET CONTEXT: Shared budget state management
 * 
 * 🎯 Scopo: Centralizza la gestione dello stato budget per sincronizzare
 * automaticamente i dati tra PlannedTransactionsTab e Budgeting tab
 * 
 * 🔧 Funzionalità:
 * - State condiviso per budgets
 * - Funzione refreshBudgets globale
 * - Sincronizzazione automatica tra componenti
 * 
 * 📝 Note:
 * - Risolve il problema dell'aggiornamento isolato tra hook instances
 * - Permette aggiornamenti real-time senza refresh manuale
 * 
 * @author Finance WebApp Team
 * @created 25 Gennaio 2025 - Risoluzione sincronizzazione budget
 */

import React, { createContext, useContext } from 'react'
import useBudgets from '../features/app/useBudgets.js'

// Create context
const BudgetContext = createContext()

/**
 * 🎯 PROVIDER: BudgetProvider
 * 
 * Wrappa l'applicazione e fornisce stato budget condiviso
 */
export function BudgetProvider({ children, year }) {
  // Use the existing useBudgets hook internally
  const budgetHook = useBudgets(year)
  
  return (
    <BudgetContext.Provider value={budgetHook}>
      {children}
    </BudgetContext.Provider>
  )
}

/**
 * 🎯 HOOK: useBudgetContext
 * 
 * Hook per accedere al context budget condiviso
 */
export function useBudgetContext() {
  const context = useContext(BudgetContext)
  
  if (!context) {
    throw new Error('useBudgetContext must be used within a BudgetProvider')
  }
  
  return context
}

export default BudgetContext
