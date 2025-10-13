/**
 * 🔍 DEBUG: Script per diagnosticare il calcolo delle uscite previste
 * 
 * Questo script analizza le transazioni pianificate e simula il calcolo
 * delle uscite previste per verificare se ci sono problemi nella logica
 */

// Simulazione dei dati di test per debugging
function debugPlannedExpensesCalculation() {
  console.log('🔍 DEBUGGING: Calcolo uscite previste dashboard')
  
  // Simula alcune transazioni pianificate di test
  const mockPlannedTransactions = [
    {
      id: 1,
      description: "Netflix",
      amount: 12.99,
      frequency: "MONTHLY",
      main: "expense",
      isActive: true,
      next_execution: "2025-10-15T00:00:00.000Z"
    },
    {
      id: 2,
      description: "Spotify",
      amount: 9.99,
      frequency: "MONTHLY", 
      main: "expense",
      isActive: true,
      next_execution: "2025-10-20T00:00:00.000Z"
    },
    {
      id: 3,
      description: "Stipendio",
      amount: 2000,
      frequency: "MONTHLY",
      main: "income",
      isActive: true,
      next_execution: "2025-10-25T00:00:00.000Z"
    },
    {
      id: 4,
      description: "Abbonamento disattivo",
      amount: 15,
      frequency: "MONTHLY",
      main: "expense",
      isActive: false,
      next_execution: "2025-10-10T00:00:00.000Z"
    }
  ]
  
  // Simula filtri per il mese corrente
  const now = new Date()
  const filters = {
    mode: 'month',
    pointer: new Date(now.getFullYear(), now.getMonth(), 1)
  }
  
  console.log('📅 Periodo di calcolo:', {
    mode: filters.mode,
    month: filters.pointer.getMonth() + 1,
    year: filters.pointer.getFullYear()
  })
  
  // Replica la logica della dashboard
  let startDate, endDate
  
  if (filters.mode === 'month') {
    const year = filters.pointer.getFullYear()
    const month = filters.pointer.getMonth()
    startDate = new Date(year, month, 1)
    endDate = new Date(year, month + 1, 0)
  }
  
  console.log('📅 Date periodo:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    now: now.toISOString()
  })
  
  // Solo future expenses (da ora in poi)
  const futureStartDate = new Date(Math.max(startDate.getTime(), now.getTime()))
  console.log('📅 Future start date:', futureStartDate.toISOString())
  
  let totalPlannedExpenses = 0
  let processedCount = 0
  
  console.log('\n🔍 ANALISI TRANSAZIONI PIANIFICATE:')
  
  mockPlannedTransactions.forEach((tx, index) => {
    console.log(`\n--- Transazione ${index + 1} ---`)
    console.log('📋 Dettagli:', {
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      frequency: tx.frequency,
      main: tx.main,
      isActive: tx.isActive,
      next_execution: tx.next_execution
    })
    
    // Skip se non attiva o se è income
    if (!tx.isActive || tx.main?.toLowerCase() === 'income') {
      console.log('⏭️ Skipped:', !tx.isActive ? 'non attiva' : 'è income')
      return
    }
    
    console.log('✅ Transazione valida per il calcolo')
    
    let currentDate = tx.next_execution 
      ? new Date(tx.next_execution)
      : new Date(tx.nextDueDate || tx.startDate || futureStartDate)
    
    if (isNaN(currentDate.getTime())) {
      console.log('❌ Data non valida')
      return
    }
    
    console.log('📅 Current date:', currentDate.toISOString())
    
    const frequency = tx.frequency?.toUpperCase() || 'MONTHLY'
    const amount = Math.abs(parseFloat(tx.amount) || 0)
    let iterations = 0
    let occurrencesFound = 0
    const MAX_ITERATIONS = 50 // Ridotto per debug
    
    console.log('🔄 Calcolo occorrenze...')
    
    while (currentDate <= endDate && iterations < MAX_ITERATIONS) {
      console.log(`  Iter ${iterations + 1}: ${currentDate.toISOString()}`)
      
      if (currentDate >= futureStartDate) {
        totalPlannedExpenses += amount
        occurrencesFound++
        console.log(`  ✅ Occorrenza trovata! Amount: ${amount}€, Total: ${totalPlannedExpenses}€`)
      } else {
        console.log(`  ⏭️ Data troppo nel passato`)
      }
      
      // Incrementa data
      const oldDate = new Date(currentDate)
      switch (frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          currentDate.setMonth(currentDate.getMonth() + 3)
          break
        case 'SEMIANNUAL':
          currentDate.setMonth(currentDate.getMonth() + 6)
          break
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
        default:
          // One-time
          if (currentDate >= futureStartDate && currentDate <= endDate) {
            totalPlannedExpenses += amount
            occurrencesFound++
            console.log(`  ✅ One-time occorrenza! Amount: ${amount}€, Total: ${totalPlannedExpenses}€`)
          }
          break
      }
      
      console.log(`  📅 Incremento: ${oldDate.toISOString()} → ${currentDate.toISOString()}`)
      iterations++
    }
    
    console.log(`📊 Risultato transazione:`)
    console.log(`  - Occorrenze trovate: ${occorrencesFound}`)
    console.log(`  - Contributo totale: ${amount * occurrencesFound}€`)
    console.log(`  - Iterazioni: ${iterations}`)
    
    processedCount++
  })
  
  console.log('\n📊 RISULTATO FINALE:')
  console.log(`  - Transazioni processate: ${processedCount}`)
  console.log(`  - Uscite previste totali: ${totalPlannedExpenses}€`)
  
  return {
    totalPlannedExpenses,
    processedCount,
    transactionCount: mockPlannedTransactions.length,
    activeExpenseCount: mockPlannedTransactions.filter(tx => tx.isActive && tx.main?.toLowerCase() !== 'income').length
  }
}

// Esegui il debug
const result = debugPlannedExpensesCalculation()
console.log('\n🎯 SUMMARY:', result)