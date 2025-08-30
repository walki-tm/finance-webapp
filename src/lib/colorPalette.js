/**
 * 🎨 PALETTE COLORI: Sistema colori coerente per l'app
 * 
 * 🎯 Scopo: Definisce una palette limitata e coerente basata sulle main categories
 * 
 * 🎨 Strategia:
 * - Income = Verde (positivo, guadagni)
 * - Expense = Blu (neutro, spese quotidiane)
 * - Debt = Rosso (attenzione, debiti)
 * - Saving = Giallo/Oro (risparmio, investimenti)
 * - Toni soft per background, accesi per stati critici
 * 
 * @author Finance WebApp Team
 * @modified 24 Agosto 2025 - Creazione sistema colori
 */

export const COLORS = {
  // 🟢 Income Colors - Verde
  income: {
    primary: '#10B981',      // emerald-500
    light: '#D1FAE5',        // emerald-100
    dark: '#065F46',         // emerald-800
    soft: '#ECFDF5',         // emerald-50
    accent: '#059669',       // emerald-600
    muted: '#A7F3D0'         // emerald-200
  },
  
  // 🔵 Expense Colors - Blu
  expense: {
    primary: '#3B82F6',      // blue-500
    light: '#DBEAFE',        // blue-100
    dark: '#1E3A8A',         // blue-800
    soft: '#EFF6FF',         // blue-50
    accent: '#2563EB',       // blue-600
    muted: '#93C5FD'         // blue-300
  },
  
  // 🔴 Debt Colors - Rosso
  debt: {
    primary: '#EF4444',      // red-500
    light: '#FEE2E2',        // red-100
    dark: '#991B1B',         // red-800
    soft: '#FEF2F2',         // red-50
    accent: '#DC2626',       // red-600
    muted: '#FCA5A5'         // red-300
  },
  
  // 🟡 Saving Colors - Giallo/Oro
  saving: {
    primary: '#F59E0B',      // amber-500
    light: '#FEF3C7',        // amber-100
    dark: '#92400E',         // amber-800
    soft: '#FFFBEB',         // amber-50
    accent: '#D97706',       // amber-600
    muted: '#FDE68A'         // amber-200
  },
  
  // 🌈 Status Colors
  status: {
    // Scadenze e urgenze
    overdue: '#DC2626',      // red-600 - Scaduto
    dueToday: '#F59E0B',     // amber-500 - Scade oggi
    dueThisWeek: '#EAB308',  // yellow-500 - Scade questa settimana
    upcoming: '#6B7280',     // gray-500 - In programma
    
    // Stati generali
    success: '#10B981',      // emerald-500
    warning: '#F59E0B',      // amber-500
    error: '#EF4444',        // red-500
    info: '#3B82F6',         // blue-500
    
    // Background soft per stati
    overdueLight: '#FEE2E2', // red-100
    dueTodayLight: '#FEF3C7', // amber-100
    dueThisWeekLight: '#FEF08A', // yellow-100
    upcomingLight: '#F3F4F6', // gray-100
  },
  
  // 🎨 Neutral Colors
  neutral: {
    50: '#F8FAFC',   // slate-50
    100: '#F1F5F9',  // slate-100
    200: '#E2E8F0',  // slate-200
    300: '#CBD5E1',  // slate-300
    400: '#94A3B8',  // slate-400
    500: '#64748B',  // slate-500
    600: '#475569',  // slate-600
    700: '#334155',  // slate-700
    800: '#1E293B',  // slate-800
    900: '#0F172A',  // slate-900
  }
}

/**
 * 🎯 Ottieni palette colori per una main category
 */
export const getMainCategoryColors = (mainType) => {
  const normalized = String(mainType || 'EXPENSE').toLowerCase()
  
  switch (normalized) {
    case 'income': return COLORS.income
    case 'expense': return COLORS.expense
    case 'debt': return COLORS.debt
    case 'saving': return COLORS.saving
    default: return COLORS.expense
  }
}

/**
 * 🚨 Ottieni colori per stato di scadenza con background card
 * 🎨 Aggiornato con palette più soft per dark mode
 * 🔸 Updated to show specific date for current month transactions
 */
export const getDueDateColors = (daysUntilDue, isActive = true, nextDueDate = null) => {
  if (!isActive) {
    return {
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
      card: 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20',
      cardShadow: 'shadow-sm hover:shadow-md',
      textOpacity: 'opacity-60',
      icon: '⏸️',
      text: 'Inattiva'
    }
  }
  
  // Helper function to format date for badge
  const formatDateForBadge = (date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
  }
  
  if (daysUntilDue < 0) {
    return {
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200 animate-pulse font-bold',
      card: 'border-red-300 dark:border-red-600/50 bg-red-50/40 dark:bg-red-900/10',
      cardShadow: 'shadow-md hover:shadow-lg ring-2 ring-red-200 dark:ring-red-800/30',
      textOpacity: 'opacity-100',
      icon: '🔴',
      text: `Scaduta ${formatDateForBadge(nextDueDate)}`
    }
  } else if (daysUntilDue === 0) {
    return {
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-200 font-bold',
      card: 'border-orange-300 dark:border-orange-600/50 bg-orange-50/40 dark:bg-orange-900/10',
      cardShadow: 'shadow-md hover:shadow-lg ring-2 ring-orange-200 dark:ring-orange-800/30',
      textOpacity: 'opacity-100',
      icon: '🟠',
      text: 'Oggi!'
    }
  } else if (daysUntilDue <= 3) {
    return {
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200',
      card: 'border-amber-300 dark:border-amber-600/50 bg-amber-50/30 dark:bg-amber-900/10',
      cardShadow: 'shadow-md hover:shadow-lg',
      textOpacity: 'opacity-100',
      icon: '🟡',
      text: `${daysUntilDue}g`
    }
  } else if (daysUntilDue <= 7) {
    return {
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
      card: 'border-blue-200 dark:border-blue-700/50 bg-blue-50/20 dark:bg-blue-900/10',
      cardShadow: 'shadow hover:shadow-lg',
      textOpacity: 'opacity-100',
      icon: '🔵',
      text: `${daysUntilDue}g`
    }
  } else if (daysUntilDue <= 31) {
    // For transactions in current month, show the actual date instead of "OK"
    return {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200',
      card: 'border-emerald-200 dark:border-emerald-700/50 bg-emerald-50/20 dark:bg-emerald-900/10',
      cardShadow: 'shadow hover:shadow-lg',
      textOpacity: 'opacity-100',
      icon: '📅',
      text: formatDateForBadge(nextDueDate)
    }
  } else {
    return {
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
      card: 'border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/10',
      cardShadow: 'shadow hover:shadow-lg',
      textOpacity: 'opacity-100',
      icon: '🔜',
      text: 'Futura'
    }
  }
}

/**
 * 🏷️ Ottieni colori per badge di conferma (uniformati con stile base)
 */
export const getConfirmationModeColors = (mode) => {
  return mode === 'AUTOMATIC' 
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 font-medium'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 font-medium'
}

/**
 * 🎨 Ottieni stile uniforme per badge generici
 */
export const getBadgeStyle = (variant = 'default') => {
  const baseStyle = 'px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors'
  
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-200',
  }
  
  return `${baseStyle} ${variants[variant] || variants.default}`
}
