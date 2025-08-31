/**
 * 📄 SERVICE: LoanCalculationService
 * 
 * 🎯 Scopo: Gestisce tutti i calcoli matematici per prestiti e mutui
 * includendo ammortamento francese, simulazioni estinzione e pagamenti.
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale sistema prestiti
 */

/**
 * 🧮 CALCOLO: Rata mensile ammortamento francese
 * 
 * Formula: R = P * [r * (1+r)^n] / [(1+r)^n - 1]
 * Dove:
 *   P = Capitale (principal)
 *   r = Tasso mensile (annuale / 12)  
 *   n = Numero rate
 */
function calculateMonthlyPayment(principal, annualRate, durationMonths) {
  // 🔸 Gestione casi edge
  if (principal <= 0 || durationMonths <= 0) {
    throw new Error('Principal amount and duration must be positive')
  }
  
  if (annualRate <= 0) {
    // Se tasso zero, rata = capitale / numero rate
    return principal / durationMonths
  }

  // 🔸 Conversione tasso annuale a mensile
  const monthlyRate = annualRate / 12

  // 🔸 Calcolo con formula ammortamento francese
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, durationMonths)
  const denominator = Math.pow(1 + monthlyRate, durationMonths) - 1
  
  return principal * (numerator / denominator)
}

/**
 * 🧮 CALCOLO: Piano di ammortamento completo
 * 
 * Genera tutte le rate con suddivisione capitale/interessi
 * e debito residuo per ogni mese
 */
function calculateAmortizationSchedule(loanData) {
  const {
    principal,
    annualRate,
    durationMonths,
    firstPaymentDate
  } = loanData

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, durationMonths)
  const monthlyRate = annualRate / 12
  let remainingBalance = principal
  
  const schedule = []

  for (let month = 1; month <= durationMonths; month++) {
    // 🔸 Calcolo interessi sulla quota residua
    const interestAmount = remainingBalance * monthlyRate
    
    // 🔸 Calcolo quota capitale (rata - interessi)
    let principalAmount = monthlyPayment - interestAmount
    
    // 🔸 Gestione ultima rata (arrotondamenti)
    if (month === durationMonths) {
      principalAmount = remainingBalance
    }

    // 🔸 Calcolo nuovo debito residuo
    const newBalance = remainingBalance - principalAmount

    // 🔸 Calcolo data scadenza
    const dueDate = new Date(firstPaymentDate)
    dueDate.setMonth(dueDate.getMonth() + (month - 1))

    schedule.push({
      paymentNumber: month,
      dueDate: dueDate.toISOString(),
      scheduledAmount: parseFloat(monthlyPayment.toFixed(2)),
      principalAmount: parseFloat(principalAmount.toFixed(2)),
      interestAmount: parseFloat(interestAmount.toFixed(2)),
      remainingBalance: parseFloat(Math.max(0, newBalance).toFixed(2))
    })

    remainingBalance = newBalance
  }

  return {
    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    totalInterest: parseFloat((monthlyPayment * durationMonths - principal).toFixed(2)),
    schedule
  }
}

/**
 * 🧮 SIMULAZIONE: Estinzione anticipata per mese specifico
 * 
 * Calcola costi/benefici dell'estinzione anticipata in un mese futuro
 */
function simulateEarlyPayoff(loanData, targetMonth) {
  const { principal, annualRate, durationMonths, firstPaymentDate } = loanData
  
  if (targetMonth < 1 || targetMonth > durationMonths) {
    throw new Error('Target month must be within loan duration')
  }

  // 🔸 Calcola piano ammortamento fino al mese target
  const schedule = calculateAmortizationSchedule(loanData)
  const targetPayment = schedule.schedule[targetMonth - 1]
  
  // 🔸 Debito residuo al mese target (PRIMA del pagamento)
  const currentBalance = targetMonth === 1 
    ? principal 
    : schedule.schedule[targetMonth - 2].remainingBalance

  // 🔸 Calcolo risparmi
  const remainingPayments = durationMonths - targetMonth + 1
  const totalRemainingCost = schedule.monthlyPayment * remainingPayments
  const interestSaved = totalRemainingCost - currentBalance

  // 🔸 Data estinzione
  const payoffDate = new Date(firstPaymentDate)
  payoffDate.setMonth(payoffDate.getMonth() + (targetMonth - 1))

  return {
    targetMonth,
    payoffDate: payoffDate.toISOString(),
    currentBalance: parseFloat(currentBalance.toFixed(2)),
    earlyPayoffAmount: parseFloat(currentBalance.toFixed(2)), // Assumendo nessuna penale
    monthlyPaymentSaved: schedule.monthlyPayment,
    remainingPayments: remainingPayments,
    totalPaymentsSaved: parseFloat((schedule.monthlyPayment * remainingPayments).toFixed(2)),
    interestSaved: parseFloat(Math.max(0, interestSaved).toFixed(2)),
    breakEvenMonths: interestSaved > 0 ? Math.ceil(currentBalance / schedule.monthlyPayment) : 0
  }
}

/**
 * 🧮 CALCOLO: Aggiornamento debito residuo dopo pagamento
 * 
 * Ricalcola il piano di ammortamento dopo un pagamento effettivo
 */
function recalculateAfterPayment(loanData, paymentData) {
  const {
    currentBalance,
    annualRate,
    remainingMonths,
    monthlyPayment: originalPayment
  } = loanData

  const {
    actualAmount,
    paymentNumber
  } = paymentData

  // 🔸 Anche per pagamenti standard, dobbiamo ridurre il debito residuo!
  // Calcolo interessi e capitale per questa rata
  const monthlyRate = annualRate / 12
  const interestPortion = currentBalance * monthlyRate
  const principalPortion = actualAmount - interestPortion
  const newBalance = Math.max(0, currentBalance - principalPortion)
  
  // Se pagamento standard, usa la rata originale (ma debito si riduce comunque)
  if (Math.abs(actualAmount - originalPayment) < 0.01) {
    // 🐛 FIX: Anche per pagamenti standard il saldo deve diminuire!
    return {
      newBalance: parseFloat(newBalance.toFixed(2)),
      remainingMonths: remainingMonths - 1,
      monthlyPayment: originalPayment,
      scheduleChanged: false,
      interestPortion: parseFloat(interestPortion.toFixed(2)),
      principalPortion: parseFloat(principalPortion.toFixed(2))
    }
  }

  // 🔸 Per pagamenti extra, il calcolo è già stato fatto sopra

  // 🔸 Se prestito estinto completamente
  if (newBalance === 0) {
    return {
      newBalance: 0,
      remainingMonths: 0,
      monthlyPayment: 0,
      scheduleChanged: true,
      status: 'PAID_OFF'
    }
  }

  // 🔸 Ricalcolo rata per mesi rimanenti
  const newMonthlyPayment = calculateMonthlyPayment(
    newBalance, 
    annualRate, 
    remainingMonths - 1
  )

  return {
    newBalance: parseFloat(newBalance.toFixed(2)),
    remainingMonths: remainingMonths - 1,
    monthlyPayment: parseFloat(newMonthlyPayment.toFixed(2)),
    scheduleChanged: Math.abs(newMonthlyPayment - originalPayment) > 0.01,
    interestPortion: parseFloat(interestPortion.toFixed(2)),
    principalPortion: parseFloat(principalPortion.toFixed(2))
  }
}

/**
 * 🧮 UTILITY: Validazione parametri prestito
 */
function validateLoanParameters(loanData) {
  const {
    principal,
    annualRate,
    durationMonths,
    firstPaymentDate
  } = loanData

  const errors = []

  if (!principal || principal <= 0) {
    errors.push('Principal amount must be positive')
  }

  if (principal > 10000000) { // 10M limit
    errors.push('Principal amount exceeds maximum limit')
  }

  if (annualRate < 0 || annualRate > 1) { // 0-100%
    errors.push('Annual interest rate must be between 0% and 100%')
  }

  if (!durationMonths || durationMonths < 1 || durationMonths > 600) { // Max 50 anni
    errors.push('Duration must be between 1 and 600 months')
  }

  if (!firstPaymentDate || new Date(firstPaymentDate) < new Date()) {
    errors.push('First payment date must be in the future')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 🧮 UTILITY: Formattazione currency e percentuali
 */
function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

function formatPercentage(rate) {
  return `${(rate * 100).toFixed(2)}%`
}

/**
 * 🧮 UTILITY: Validazione parametri prestito completa
 * 
 * Versione estesa per validare tutti i campi del form prestiti
 */
function validateCompleteLoanParameters(loanData) {
  const {
    name,
    loanType,
    lenderName,
    principalAmount,
    interestRate,
    durationMonths,
    firstPaymentDate,
    paymentFrequency
  } = loanData

  const errors = []

  // Nome prestito
  if (!name || name.trim().length < 3) {
    errors.push('Loan name must be at least 3 characters long')
  }

  // Tipo prestito
  const validTypes = ['PERSONAL_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'OTHER']
  if (!loanType || !validTypes.includes(loanType)) {
    errors.push('Invalid loan type')
  }

  // Nome banca/prestatore
  if (!lenderName || lenderName.trim().length < 2) {
    errors.push('Lender name must be at least 2 characters long')
  }

  // Validazione importo
  if (!principalAmount || principalAmount <= 0) {
    errors.push('Principal amount must be positive')
  }

  if (principalAmount > 10000000) { // 10M limit
    errors.push('Principal amount exceeds maximum limit')
  }

  // Validazione tasso
  if (interestRate < 0 || interestRate > 1) { // 0-100%
    errors.push('Annual interest rate must be between 0% and 100%')
  }

  // Validazione durata
  if (!durationMonths || durationMonths < 1 || durationMonths > 600) { // Max 50 anni
    errors.push('Duration must be between 1 and 600 months')
  }

  // Validazione data
  if (!firstPaymentDate) {
    errors.push('First payment date is required')
  } else {
    const paymentDate = new Date(firstPaymentDate)
    if (isNaN(paymentDate.getTime())) {
      errors.push('Invalid payment date format')
    }
  }

  // Frequenza pagamento
  const validFrequencies = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL']
  if (paymentFrequency && !validFrequencies.includes(paymentFrequency)) {
    errors.push('Invalid payment frequency')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 🔸 Export delle funzioni principali
export {
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  simulateEarlyPayoff,
  recalculateAfterPayment,
  validateLoanParameters,
  validateCompleteLoanParameters,
  formatCurrency,
  formatPercentage
}
