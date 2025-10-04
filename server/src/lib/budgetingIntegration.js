/**
 * 🔧 BUDGETING INTEGRATION SERVER-SIDE: Integrazione transazioni pianificate con budgeting 
 * 
 * 🎯 Scopo: Funzioni per applicare/rimuovere transazioni pianificate dai budget
 * 
 * 🔧 Funzionalità:
 * - Applica transazioni al budgeting creando/aggiornando i budget
 * - Rimuove transazioni dal budgeting
 * - Gestisce diversi tipi di frequenza (MONTHLY, YEARLY, ONE_TIME)
 * 
 * @author Finance WebApp Team
 * @created 27 Agosto 2025
 */

/**
 * Applica una transazione mensile ricorrente al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget data per upsert
 */
export function applyMonthlyTransactionToBudget(transaction, year, subcats) {
  const budgets = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  
  if (!transaction.subId && !transaction.subcategory?.name) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subcategoryId = transaction.subId || transaction.subcategory?.id
  const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
  
  if (!subcategoryId || !subcategoryName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Per le transazioni mensili ricorrenti, applichiamo a tutti i 12 mesi dell'anno
  for (let month = 1; month <= 12; month++) {
    budgets.push({
      main: transaction.main,
      subcategoryId,
      period: `${year}-${String(month).padStart(2, '0')}`,
      amount: amount,
      style: 'FIXED',
      managedAutomatically: true,
      notes: `Auto-applicata da transazione pianificata: ${transaction.title || 'Senza titolo'}`
    })
  }
  
  return budgets
}

/**
 * Applica una transazione annuale al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @param {string} mode - 'specific' per mese specifico, 'divide' per dividere
 * @param {number} targetMonth - Mese target (solo per mode='specific')
 * @returns {Array} Array di budget data per upsert
 */
export function applyYearlyTransactionToBudget(transaction, year, subcats, mode = 'divide', targetMonth = null) {
  const budgets = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  
  if (!transaction.subId && !transaction.subcategory?.name) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  const subcategoryId = transaction.subId || transaction.subcategory?.id
  const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
  
  if (!subcategoryId || !subcategoryName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  if (mode === 'specific') {
    // Applica al mese specifico
    // targetMonth arriva dal frontend come indice 0-11, quindi aggiungiamo 1 per ottenere 1-12
    const month = (targetMonth !== null && targetMonth !== undefined) ? (targetMonth + 1) : (new Date(transaction.startDate).getMonth() + 1)
    budgets.push({
      main: transaction.main,
      subcategoryId,
      period: `${year}-${String(month).padStart(2, '0')}`,
      amount: amount,
      style: 'FIXED',
      managedAutomatically: true,
      notes: `Auto-applicata da transazione pianificata annuale: ${transaction.title || 'Senza titolo'}`
    })
  } else if (mode === 'divide') {
    // Dividi l'importo su tutti i 12 mesi
    const monthlyAmount = amount / 12
    for (let month = 1; month <= 12; month++) {
      budgets.push({
        main: transaction.main,
        subcategoryId,
        period: `${year}-${String(month).padStart(2, '0')}`,
        amount: monthlyAmount,
        style: 'FIXED',
        managedAutomatically: true,
        notes: `Auto-applicata da transazione pianificata annuale (divisa): ${transaction.title || 'Senza titolo'}`
      })
    }
  }
  
  return budgets
}

/**
 * Applica una transazione settimanale al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget data per upsert
 */
export function applyWeeklyTransactionToBudget(transaction, year, subcats) {
  const budgets = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  // Calcola l'equivalente mensile: 52 settimane all'anno / 12 mesi = ~4.33 settimane al mese
  const monthlyEquivalent = (amount * 52) / 12
  
  if (!transaction.subId && !transaction.subcategory?.name) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  const subcategoryId = transaction.subId || transaction.subcategory?.id
  const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
  
  if (!subcategoryId || !subcategoryName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Per le transazioni settimanali, applichiamo l'equivalente mensile a tutti i 12 mesi dell'anno
  for (let month = 1; month <= 12; month++) {
    budgets.push({
      main: transaction.main,
      subcategoryId,
      period: `${year}-${String(month).padStart(2, '0')}`,
      amount: monthlyEquivalent,
      style: 'FIXED',
      managedAutomatically: true,
      notes: `Auto-applicata da transazione pianificata settimanale: ${transaction.title || 'Senza titolo'}`
    })
  }
  
  return budgets
}

/**
 * Applica una transazione trimestrale al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget data per upsert
 */
export function applyQuarterlyTransactionToBudget(transaction, year, subcats) {
  const budgets = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  // Dividi l'importo trimestrale su 3 mesi
  const monthlyAmount = amount / 3
  
  if (!transaction.subId && !transaction.subcategory?.name) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  const subcategoryId = transaction.subId || transaction.subcategory?.id
  const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
  
  if (!subcategoryId || !subcategoryName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Per le transazioni trimestrali, applichiamo l'importo a tutti i trimestri dell'anno
  for (let quarter = 0; quarter < 4; quarter++) {
    const quarterStartMonth = quarter * 3 + 1
    
    // Applica ai 3 mesi del trimestre
    for (let monthInQuarter = 0; monthInQuarter < 3; monthInQuarter++) {
      const month = quarterStartMonth + monthInQuarter
      budgets.push({
        main: transaction.main,
        subcategoryId,
        period: `${year}-${String(month).padStart(2, '0')}`,
        amount: monthlyAmount,
        style: 'FIXED',
        managedAutomatically: true,
        notes: `Auto-applicata da transazione pianificata trimestrale: ${transaction.title || 'Senza titolo'}`
      })
    }
  }
  
  return budgets
}

/**
 * Applica una transazione semestrale al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget data per upsert
 */
export function applySemiannualTransactionToBudget(transaction, year, subcats) {
  const budgets = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  // Dividi l'importo semestrale su 6 mesi
  const monthlyAmount = amount / 6
  
  if (!transaction.subId && !transaction.subcategory?.name) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  const subcategoryId = transaction.subId || transaction.subcategory?.id
  const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
  
  if (!subcategoryId || !subcategoryName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Per le transazioni semestrali, applichiamo l'importo diviso su tutti i mesi dell'anno
  for (let month = 1; month <= 12; month++) {
    budgets.push({
      main: transaction.main,
      subcategoryId,
      period: `${year}-${String(month).padStart(2, '0')}`,
      amount: monthlyAmount,
      style: 'FIXED',
      managedAutomatically: true,
      notes: `Auto-applicata da transazione pianificata semestrale: ${transaction.title || 'Senza titolo'}`
    })
  }
  
  return budgets
}

/**
 * Applica una transazione una tantum al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget data per upsert
 */
export function applyOneTimeTransactionToBudget(transaction, year, subcats) {
  const budgets = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  
  if (!transaction.subId && !transaction.subcategory?.name) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  const subcategoryId = transaction.subId || transaction.subcategory?.id
  const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
  
  if (!subcategoryId || !subcategoryName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Applica al mese della startDate
  const startDate = new Date(transaction.startDate)
  const month = startDate.getMonth() + 1
  
  // Verifica che sia nell'anno corrente
  if (startDate.getFullYear() !== year) {
    throw new Error(`Transazione non appartiene all'anno ${year}`)
  }
  
  budgets.push({
    main: transaction.main,
    subcategoryId,
    period: `${year}-${String(month).padStart(2, '0')}`,
    amount: amount,
    style: 'FIXED',
    managedAutomatically: true,
    notes: `Auto-applicata da transazione pianificata una tantum: ${transaction.title || 'Senza titolo'}`
  })
  
  return budgets
}

/**
 * Applica una transazione generica al budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {Object} options - Opzioni per l'applicazione
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget data per upsert
 */
export function applyTransactionToBudget(transaction, options, subcats) {
  const { mode, targetMonth, year } = options
  
  switch (transaction.frequency) {
    case 'WEEKLY':
      return applyWeeklyTransactionToBudget(transaction, year, subcats)
    case 'MONTHLY':
      return applyMonthlyTransactionToBudget(transaction, year, subcats)
    case 'QUARTERLY':
      return applyQuarterlyTransactionToBudget(transaction, year, subcats)
    case 'SEMIANNUAL':
      return applySemiannualTransactionToBudget(transaction, year, subcats)
    case 'YEARLY':
      return applyYearlyTransactionToBudget(transaction, year, subcats, mode, targetMonth)
    case 'ONE_TIME':
      return applyOneTimeTransactionToBudget(transaction, year, subcats)
    default:
      throw new Error(`Frequenza non supportata: ${transaction.frequency}`)
  }
}

/**
 * Rimuove una transazione dal budgeting sottraendo gli importi dai budget corrispondenti
 * @param {Object} transaction - Transazione pianificata
 * @param {Object} options - Opzioni per la rimozione
 * @param {Object} subcats - Mappa delle sottocategorie
 * @param {Function} checkOtherActiveTransactions - Funzione asincrona per verificare se ci sono altre transazioni attive
 * @returns {Promise<Array>} Promise che risolve in array di budget data per sottrazione
 */
export async function removeTransactionFromBudget(transaction, options, subcats, checkOtherActiveTransactions = null) {
  // Otteniamo i budget che sarebbero stati creati
  const budgetsToRemove = applyTransactionToBudget(transaction, options, subcats)
  
  // Convertiamo gli importi in negativi per sottrarre (sistema di accumulo)
  const processedBudgets = []
  
  for (const budget of budgetsToRemove) {
    // Determina se la cella dovrebbe rimanere gestita automaticamente
    // Solo se c'è una funzione di controllo e ci sono altre transazioni attive
    let shouldStayManaged = false
    if (checkOtherActiveTransactions && typeof checkOtherActiveTransactions === 'function') {
      try {
        // Estrai il mese dall'ID period (YYYY-MM -> month index 0-11)
        const monthIndex = parseInt(budget.period.split('-')[1], 10) - 1
        const subcategoryName = transaction.subcategory?.name || findSubcategoryName(transaction.subId, subcats)
        if (subcategoryName) {
          shouldStayManaged = await checkOtherActiveTransactions(transaction.main, subcategoryName, monthIndex, transaction.id)
        }
      } catch (error) {
        console.warn('Errore nel controllo transazioni attive:', error)
      }
    }
    
    const budgetUpdate = {
      ...budget,
      amount: -Math.abs(budget.amount), // Assicuriamoci che sia negativo
      notes: `Rimossa transazione pianificata: ${transaction.title || 'Senza titolo'}`
    }
    
    // Solo imposta managedAutomatically se abbiamo fatto il controllo
    // e il risultato è diverso da quello che ci aspettiamo
    if (checkOtherActiveTransactions) {
      budgetUpdate.managedAutomatically = shouldStayManaged
    }
    // Altrimenti non passare il flag, lasciando che rimanga com'era
    
    processedBudgets.push(budgetUpdate)
  }
  
  return processedBudgets
}

/**
 * Trova il nome della sottocategoria dato l'ID (funzione di utilità)
 * @param {string} subId - ID della sottocategoria
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {string|null} Nome della sottocategoria o null se non trovata
 */
function findSubcategoryName(subId, subcats) {
  for (const mainKey in subcats) {
    const subs = subcats[mainKey] || []
    const found = subs.find(sub => sub.id === subId)
    if (found) return found.name
  }
  return null
}
