/**
 * 📄 SAVINGS GOALS INDEX: Export principale feature obiettivi di risparmio
 * 
 * 🎯 Scopo: Centralizza export di hook, componenti e pagine della feature
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione index
 */

// Main hook
export { default as useSavingsGoals } from './useSavingsGoals.js'

// Main page
export { default as SavingsGoals } from './pages/SavingsGoals.jsx'

// Components
export { default as GoalCard } from './components/GoalCard.jsx'
export { default as GoalModal } from './components/GoalModal.jsx'
export { default as AddBalanceModal } from './components/AddBalanceModal.jsx'
export { default as WithdrawModal } from './components/WithdrawModal.jsx'
export { default as GoalHistoryModal } from './components/GoalHistoryModal.jsx'
