/**
 * 📄 ACCOUNTS FEATURE: Export principale feature accounts
 * 
 * 🎯 Scopo: Centralizza exports per feature accounts
 * 
 * 📝 Note:
 * - Export componenti principali
 * - Export hooks e utilities
 * - Pattern standard per features
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione index accounts
 */

// 🔸 Export main page component
export { default as AccountsPage } from './pages/AccountsPage'

// 🔸 Export individual components  
export { default as AccountCard } from './components/AccountCard'
export { default as AccountModal } from './components/AccountModal'

// 🔸 Export custom hook
export { default as useAccounts } from './useAccounts'

// 🔸 Export API service
export { default as accountsAPI } from './services/accounts.api'
