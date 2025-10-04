/**
 * 📄 ACCOUNT ICONS: Configurazione icone conti automatiche
 * 
 * 🎯 Scopo: Mappare automaticamente i tipi di conto alle rispettive icone SVG
 * 
 * 🔧 Dipendenze principali:
 * - AccountType enum da Prisma
 * - SVG files in src/assets/account-icons/
 * 
 * 📝 Note:
 * - Le icone SVG devono essere posizionate in src/assets/account-icons/
 * - I nomi dei file devono corrispondere ai valori enum (lowercase)
 * - Fallback a Lucide icons se SVG non disponibile
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione configurazione accounts
 */

// 🔸 Import icone fallback da Lucide
import { 
  Banknote,      // Fallback per CONTO_CORRENTE
  TrendingUp,    // Fallback per CONTO_INVESTIMENTI  
  PiggyBank,     // Fallback per CONTO_DEPOSITO
  Wallet,        // Fallback per CONTANTI
  CreditCard,    // Fallback per CARTA_CREDITO
  Circle         // Fallback per ALTRO
} from 'lucide-react'

// 🔸 Definizione tipi account supportati (corrispondenti a Prisma AccountType enum)
export const ACCOUNT_TYPES = {
  CURRENT: 'CURRENT',
  INVESTMENTS: 'INVESTMENTS',
  SAVINGS: 'SAVINGS',
  POCKET: 'POCKET'
}

// 🔸 Configurazione icone per tipo account
export const ACCOUNT_ICON_CONFIG = {
  [ACCOUNT_TYPES.CURRENT]: {
    fileName: 'current.svg',
    fallbackIcon: Banknote,
    label: 'Conto Corrente',
    description: 'Conto bancario principale per operazioni quotidiane'
  },
  [ACCOUNT_TYPES.INVESTMENTS]: {
    fileName: 'investments.svg', 
    fallbackIcon: TrendingUp,
    label: 'Investimenti',
    description: 'Conto dedicato agli investimenti e trading'
  },
  [ACCOUNT_TYPES.SAVINGS]: {
    fileName: 'savings.svg',
    fallbackIcon: PiggyBank,
    label: 'Conto Deposito',
    description: 'Conto di deposito per accumulo a lungo termine'
  },
  [ACCOUNT_TYPES.POCKET]: {
    fileName: 'pocket.svg',
    fallbackIcon: Wallet,
    label: 'Pocket',
    description: 'Conto pocket per spese piccole e gestione contanti'
  }
}

// 🔸 Palette colori predefiniti per accounts
export const ACCOUNT_COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#DC2626'  // Rose
]

/**
 * 🎯 UTILITY: Ottieni icona per tipo account
 * 
 * @param {string} accountType - Tipo account (CURRENT, INVESTMENTS, etc.)
 * @param {Object} options - Opzioni per rendering icona
 * @returns {Object} Configurazione icona con fallback
 */
export function getAccountIcon(accountType, options = {}) {
  const config = ACCOUNT_ICON_CONFIG[accountType]
  
  if (!config) {
    return {
      icon: Banknote, // Default fallback
      isCustom: false,
      fileName: null,
      label: 'Account generico'
    }
  }

  return {
    icon: config.fallbackIcon,
    fileName: config.fileName,
    isCustom: true, // Indica se dovremmo usare SVG custom
    label: config.label,
    description: config.description,
    fallbackIcon: config.fallbackIcon
  }
}

/**
 * 🎯 UTILITY: Ottieni path completo icona SVG
 * 
 * @param {string} accountType - Tipo account
 * @returns {string} Path relativo all'icona SVG
 */
export function getAccountIconPath(accountType) {
  const config = ACCOUNT_ICON_CONFIG[accountType]
  if (!config) return null
  
  return `/src/assets/account-icons/${config.fileName}`
}

/**
 * 🎯 UTILITY: Ottieni lista tutti i tipi di account disponibili
 * 
 * @returns {Array} Array di oggetti con tipo e configurazione
 */
export function getAllAccountTypes() {
  return Object.entries(ACCOUNT_ICON_CONFIG).map(([type, config]) => ({
    type,
    ...config
  }))
}

/**
 * 🎯 UTILITY: Valida tipo account
 * 
 * @param {string} accountType - Tipo da validare
 * @returns {boolean} True se tipo valido
 */
export function isValidAccountType(accountType) {
  return Object.hasOwnProperty.call(ACCOUNT_TYPES, accountType)
}

export default {
  ACCOUNT_TYPES,
  ACCOUNT_ICON_CONFIG,
  ACCOUNT_COLOR_PALETTE,
  getAccountIcon,
  getAccountIconPath,
  getAllAccountTypes,
  isValidAccountType
}
