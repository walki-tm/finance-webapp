/**
 * 🔧 BUDGETING INTEGRATION: Funzioni per integrare transazioni pianificate con sistema budgeting
 * 
 * 🎯 Scopo: Gestire l'applicazione delle transazioni pianificate ai budget
 * 
 * 🔧 Logica per tipo di transazione:
 * - MENSILI: Senza data di fine, applicate a tutti i mesi indefinitamente
 * - ANNUALI: Applicate per mese fisso o divise su 12 mesi, senza data di fine
 * - UNA TANTUM: Solo nel mese di riferimento, rimosse quando pagate/inattive
 * 
 * 📝 Note: La data di fine è stata rimossa dal sistema per semplificare la gestione
 * 
 * @author Finance WebApp Team
 * @created 25 Agosto 2025
 * @modified 27 Agosto 2025 - Rimossa dipendenza da endDate
 */

/**
 * Applica una transazione mensile ricorrente al budgeting
 * Le transazioni mensili vengono applicate a TUTTI i 12 mesi dell'anno sempre,
 * indipendentemente dal mese di inizio o dall'anno corrente
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates per tutti i 12 mesi
 */
export function applyMonthlyTransactionToBudget(transaction, year, subcats) {
  const updates = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  
  if (!transaction.subId && !transaction.subName) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subName = transaction.subName || findSubcategoryName(transaction.subId, subcats)
  if (!subName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Per le transazioni mensili ricorrenti, applichiamo SEMPRE a tutti i 12 mesi dell'anno
  // Non consideriamo la data di inizio - le mensili sono a tempo indeterminato
  
  // Applica a TUTTI i 12 mesi dell'anno (Gennaio = 0, Dicembre = 11)
  for (let month = 0; month < 12; month++) {
    updates.push({
      main: transaction.main.toLowerCase(),
      keyWithMonth: `${subName}:${month}`,
      value: amount,
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      subcategoryName: subName,
      managedAutomatically: true
    })
  }
  
  return updates
}

/**
 * Applica una transazione annuale al budgeting
 * Offre due modalità: applica al mese specifico o dividi su tutti i mesi
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @param {string} mode - 'specific' per mese specifico, 'divide' per dividere
 * @param {number} targetMonth - Mese target (solo per mode='specific')
 * @returns {Array} Array di budget updates
 */
export function applyYearlyTransactionToBudget(transaction, year, subcats, mode = 'divide', targetMonth = null) {
  const updates = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  
  if (!transaction.subId && !transaction.subName) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subName = transaction.subName || findSubcategoryName(transaction.subId, subcats)
  if (!subName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  if (mode === 'specific') {
    // Applica al mese specifico
    const month = targetMonth !== null ? targetMonth : new Date(transaction.startDate).getMonth()
    updates.push({
      main: transaction.main.toLowerCase(),
      keyWithMonth: `${subName}:${month}`,
      value: amount,
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      subcategoryName: subName,
      managedAutomatically: true
    })
  } else if (mode === 'divide') {
    // Dividi l'importo su tutti i 12 mesi
    const monthlyAmount = amount / 12
    for (let month = 0; month < 12; month++) {
      updates.push({
        main: transaction.main.toLowerCase(),
        keyWithMonth: `${subName}:${month}`,
        value: monthlyAmount,
        period: `${year}-${String(month + 1).padStart(2, '0')}`,
        subcategoryName: subName,
        managedAutomatically: true
      })
    }
  }
  
  return updates
}

/**
 * Applica una transazione settimanale al budgeting
 * Calcola l'equivalente mensile (52 settimane / 12 mesi) e applica a tutti i mesi
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates
 */
export function applyWeeklyTransactionToBudget(transaction, year, subcats) {
  const updates = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  // Calcola l'equivalente mensile: 52 settimane all'anno / 12 mesi = ~4.33 settimane al mese
  const monthlyEquivalent = (amount * 52) / 12
  
  if (!transaction.subId && !transaction.subName) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subName = transaction.subName || findSubcategoryName(transaction.subId, subcats)
  if (!subName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Applica l'equivalente mensile a tutti i 12 mesi dell'anno
  for (let month = 0; month < 12; month++) {
    updates.push({
      main: transaction.main.toLowerCase(),
      keyWithMonth: `${subName}:${month}`,
      value: monthlyEquivalent,
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      subcategoryName: subName,
      managedAutomatically: true
    })
  }
  
  return updates
}

/**
 * Applica una transazione trimestrale al budgeting
 * Divide l'importo su 3 mesi e applica ai trimestri appropriati
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates
 */
export function applyQuarterlyTransactionToBudget(transaction, year, subcats) {
  const updates = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  // Dividi l'importo trimestrale su 3 mesi
  const monthlyAmount = amount / 3
  
  if (!transaction.subId && !transaction.subName) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subName = transaction.subName || findSubcategoryName(transaction.subId, subcats)
  if (!subName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Determina il trimestre di inizio dalla startDate
  const startDate = new Date(transaction.startDate)
  const startMonth = startDate.getMonth() // 0-11
  
  // Calcola in quale trimestre cade la data di inizio
  const startQuarter = Math.floor(startMonth / 3) // 0,1,2,3
  
  // Applica a tutti i trimestri dell'anno
  for (let quarter = 0; quarter < 4; quarter++) {
    const quarterStartMonth = quarter * 3
    
    // Applica ai 3 mesi del trimestre
    for (let monthInQuarter = 0; monthInQuarter < 3; monthInQuarter++) {
      const month = quarterStartMonth + monthInQuarter
      updates.push({
        main: transaction.main.toLowerCase(),
        keyWithMonth: `${subName}:${month}`,
        value: monthlyAmount,
        period: `${year}-${String(month + 1).padStart(2, '0')}`,
        subcategoryName: subName,
        managedAutomatically: true
      })
    }
  }
  
  return updates
}

/**
 * Applica una transazione semestrale al budgeting
 * Divide l'importo su 6 mesi e applica ai semestri appropriati
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates
 */
export function applySemiannualTransactionToBudget(transaction, year, subcats) {
  const updates = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  // Dividi l'importo semestrale su 6 mesi
  const monthlyAmount = amount / 6
  
  if (!transaction.subId && !transaction.subName) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subName = transaction.subName || findSubcategoryName(transaction.subId, subcats)
  if (!subName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Applica a tutti i mesi dell'anno (due semestri)
  for (let month = 0; month < 12; month++) {
    updates.push({
      main: transaction.main.toLowerCase(),
      keyWithMonth: `${subName}:${month}`,
      value: monthlyAmount,
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      subcategoryName: subName,
      managedAutomatically: true
    })
  }
  
  return updates
}

/**
 * Applica una transazione una tantum al budgeting
 * Applica solo al mese di riferimento della transazione
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates
 */
export function applyOneTimeTransactionToBudget(transaction, year, subcats) {
  const updates = []
  const amount = Math.abs(Number(transaction.amount) || 0)
  
  if (!transaction.subId && !transaction.subName) {
    throw new Error('Sottocategoria richiesta per applicare al budgeting')
  }
  
  // Trova la sottocategoria
  const subName = transaction.subName || findSubcategoryName(transaction.subId, subcats)
  if (!subName) {
    throw new Error('Sottocategoria non trovata')
  }
  
  // Applica al mese della startDate
  const startDate = new Date(transaction.startDate)
  const month = startDate.getMonth()
  
  // Verifica che sia nell'anno corrente
  if (startDate.getFullYear() !== year) {
    throw new Error(`Transazione non appartiene all'anno ${year}`)
  }
  
  updates.push({
    main: transaction.main.toLowerCase(),
    keyWithMonth: `${subName}:${month}`,
    value: amount,
    period: `${year}-${String(month + 1).padStart(2, '0')}`,
    subcategoryName: subName,
    managedAutomatically: true
  })
  
  return updates
}

/**
 * Applica un gruppo di transazioni al budgeting
 * @param {Array} transactions - Array di transazioni del gruppo
 * @param {number} year - Anno di riferimento  
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates consolidati
 */
export function applyGroupToBudget(transactions, year, subcats) {
  const allUpdates = []
  
  transactions.forEach(transaction => {
    try {
      let updates = []
      
      switch (transaction.frequency) {
        case 'MONTHLY':
          updates = applyMonthlyTransactionToBudget(transaction, year, subcats)
          break
        case 'YEARLY':
          // Per i gruppi, usiamo sempre la modalità "dividi"
          updates = applyYearlyTransactionToBudget(transaction, year, subcats, 'divide')
          break
        case 'ONE_TIME':
          updates = applyOneTimeTransactionToBudget(transaction, year, subcats)
          break
        default:
          console.warn(`Frequenza non supportata: ${transaction.frequency}`)
          return
      }
      
      allUpdates.push(...updates)
    } catch (error) {
      console.error(`Errore applicando transazione ${transaction.id}:`, error)
      // Continua con le altre transazioni
    }
  })
  
  // Consolida gli aggiornamenti per evitare duplicati
  return consolidateBudgetUpdates(allUpdates)
}

/**
 * Consolida i budget updates sommando gli importi per la stessa categoria/mese
 * @param {Array} updates - Array di budget updates
 * @returns {Array} Array consolidato
 */
export function consolidateBudgetUpdates(updates) {
  const consolidated = new Map()
  
  updates.forEach(update => {
    const key = `${update.main}:${update.keyWithMonth}`
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)
      existing.value += update.value
    } else {
      consolidated.set(key, { ...update })
    }
  })
  
  return Array.from(consolidated.values())
}

/**
 * Trova il nome della sottocategoria dato l'ID
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

/**
 * Rimuove una transazione mensile dal budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeMonthlyTransactionFromBudget(transaction, year, subcats) {
  const updates = applyMonthlyTransactionToBudget(transaction, year, subcats)
  // Invertiamo i valori per sottrarli
  return updates.map(update => ({
    ...update,
    value: -update.value
  }))
}

/**
 * Rimuove una transazione annuale dal budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @param {string} mode - 'specific' per mese specifico, 'divide' per dividere
 * @param {number} targetMonth - Mese target (solo per mode='specific')
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeYearlyTransactionFromBudget(transaction, year, subcats, mode = 'divide', targetMonth = null) {
  const updates = applyYearlyTransactionToBudget(transaction, year, subcats, mode, targetMonth)
  // Invertiamo i valori per sottrarli
  return updates.map(update => ({
    ...update,
    value: -update.value
  }))
}

/**
 * Rimuove una transazione settimanale dal budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeWeeklyTransactionFromBudget(transaction, year, subcats) {
  const updates = applyWeeklyTransactionToBudget(transaction, year, subcats)
  // Invertiamo i valori per sottrarli
  return updates.map(update => ({
    ...update,
    value: -update.value
  }))
}

/**
 * Rimuove una transazione trimestrale dal budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeQuarterlyTransactionFromBudget(transaction, year, subcats) {
  const updates = applyQuarterlyTransactionToBudget(transaction, year, subcats)
  // Invertiamo i valori per sottrarli
  return updates.map(update => ({
    ...update,
    value: -update.value
  }))
}

/**
 * Rimuove una transazione semestrale dal budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeSemiannualTransactionFromBudget(transaction, year, subcats) {
  const updates = applySemiannualTransactionToBudget(transaction, year, subcats)
  // Invertiamo i valori per sottrarli
  return updates.map(update => ({
    ...update,
    value: -update.value
  }))
}

/**
 * Rimuove una transazione una tantum dal budgeting
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Object} subcats - Mappa delle sottocategorie
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeOneTimeTransactionFromBudget(transaction, year, subcats) {
  const updates = applyOneTimeTransactionToBudget(transaction, year, subcats)
  // Invertiamo i valori per sottrarli
  return updates.map(update => ({
    ...update,
    value: -update.value
  }))
}

/**
 * Rimuove una transazione dal budgeting (funzione generica)
 * @param {Object} transaction - Transazione pianificata
 * @param {Object} options - Opzioni per la rimozione
 * @param {Object} subcats - Mappa delle sottocategorie
 * @param {Function} isManagedAutomatically - Funzione per verificare se una cella è gestita automaticamente
 * @returns {Array} Array di budget updates con valori negativi
 */
export function removeTransactionFromBudget(transaction, options, subcats, isManagedAutomatically = null) {
  const { mode, targetMonth, year } = options
  
  switch (transaction.frequency) {
    case 'WEEKLY':
      return removeWeeklyTransactionFromBudget(transaction, year, subcats)
    case 'MONTHLY':
      return removeMonthlyTransactionFromBudget(transaction, year, subcats)
    case 'QUARTERLY':
      return removeQuarterlyTransactionFromBudget(transaction, year, subcats)
    case 'SEMIANNUAL':
      return removeSemiannualTransactionFromBudget(transaction, year, subcats)
    case 'YEARLY':
      // Per le transazioni annuali, determiniamo automaticamente il modo se non specificato
      let detectedMode = mode
      let detectedTargetMonth = targetMonth
      
      if (!mode && isManagedAutomatically) {
        const detectedInfo = detectYearlyTransactionApplication(transaction, year, isManagedAutomatically)
        detectedMode = detectedInfo.mode
        detectedTargetMonth = detectedInfo.targetMonth
      }
      
      return removeYearlyTransactionFromBudget(transaction, year, subcats, detectedMode || 'divide', detectedTargetMonth)
    case 'ONE_TIME':
      return removeOneTimeTransactionFromBudget(transaction, year, subcats)
    default:
      throw new Error(`Frequenza non supportata: ${transaction.frequency}`)
  }
}

/**
 * Rileva automaticamente come è stata applicata una transazione annuale al budgeting
 * controllando quali celle sono gestite automaticamente
 * @param {Object} transaction - Transazione pianificata
 * @param {number} year - Anno di riferimento
 * @param {Function} isManagedAutomatically - Funzione per verificare se una cella è gestita automaticamente
 * @returns {Object} Oggetto con mode e targetMonth rilevati
 */
export function detectYearlyTransactionApplication(transaction, year, isManagedAutomatically) {
  const subName = transaction.subName || findSubcategoryName(transaction.subId, {})
  if (!subName) {
    return { mode: 'divide', targetMonth: null }
  }
  
  const main = transaction.main.toLowerCase()
  let managedMonthsCount = 0
  let managedMonth = null
  
  // Controlla tutti i 12 mesi per vedere quali sono gestiti automaticamente da questa transazione
  for (let month = 0; month < 12; month++) {
    if (isManagedAutomatically(main, subName, month)) {
      managedMonthsCount++
      if (managedMonth === null) {
        managedMonth = month
      }
    }
  }
  
  // Se solo 1 mese è gestito automaticamente, era applicata come 'specific'
  // Se 12 mesi sono gestiti automaticamente, era applicata come 'divide'
  if (managedMonthsCount === 1) {
    return {
      mode: 'specific',
      targetMonth: managedMonth
    }
  } else if (managedMonthsCount === 12) {
    return {
      mode: 'divide',
      targetMonth: null
    }
  } else {
    // Caso ambiguo - defaultiamo a 'divide'
    return {
      mode: 'divide',
      targetMonth: null
    }
  }
}

/**
 * Genera opzioni per l'applicazione di transazioni annuali
 * @param {Object} transaction - Transazione pianificata
 * @returns {Array} Array di opzioni disponibili
 */
export function getYearlyApplicationOptions(transaction) {
  const startDate = new Date(transaction.startDate)
  const startMonth = startDate.getMonth()
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]
  
  return [
    {
      mode: 'specific',
      targetMonth: startMonth,
      label: `Applica a ${monthNames[startMonth]}`,
      description: `Applica l'intero importo (€${Math.abs(transaction.amount)}) al mese specifico`
    },
    {
      mode: 'divide',
      label: 'Dividi su tutti i mesi',
      description: `Dividi l'importo su 12 mesi (€${(Math.abs(transaction.amount) / 12).toFixed(2)} al mese)`
    }
  ]
}
