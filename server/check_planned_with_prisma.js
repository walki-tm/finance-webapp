/**
 * 🔍 DEBUG: Script per controllare le transazioni pianificate con Prisma
 * 
 * Analizza il database per verificare quali transazioni pianificate
 * sono attive e dovrebbero contribuire al calcolo delle uscite previste
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkRealPlannedTransactions() {
  console.log('🔍 DEBUGGING: Controllo transazioni pianificate con Prisma')
  
  try {
    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: {
        email: 'm.venezia02@outlook.it'
      }
    })
    
    if (!user) {
      console.log('❌ Utente non trovato')
      return
    }
    
    console.log('✅ Utente trovato:', user.email)
    
    // Ottieni tutte le transazioni pianificate dell'utente
    const plannedTransactions = await prisma.plannedTransaction.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { isActive: 'desc' },
        { main: 'asc' },
        { title: 'asc' }
      ]
    })
    
    console.log(`📊 Trovate ${plannedTransactions.length} transazioni pianificate totali`)
    
    if (plannedTransactions.length === 0) {
      console.log('⚠️ Nessuna transazione pianificata trovata')
      return
    }
    
    // Analizza ogni transazione
    console.log('\n🔍 ANALISI DETTAGLIATA:')
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const futureStartDate = new Date(Math.max(startOfMonth.getTime(), now.getTime()))
    
    console.log('📅 Periodo analizzato:', {
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      now: now.toISOString(),
      futureStartDate: futureStartDate.toISOString()
    })
    
    let totalActiveExpenses = 0
    let activeExpenseCount = 0
    
    plannedTransactions.forEach((tx, index) => {
      console.log(`\n--- Transazione ${index + 1} ---`)
      console.log('📋 Dettagli:', {
        id: tx.id,
        title: tx.title,
        amount: tx.amount.toString(), // BigInt to string
        frequency: tx.frequency,
        main: tx.main,
        isActive: tx.isActive,
        nextDueDate: tx.nextDueDate,
        createdAt: tx.createdAt
      })
      
      // Controlla se è una spesa attiva
      const isActiveExpense = tx.isActive && tx.main?.toLowerCase() !== 'income'
      
      if (!isActiveExpense) {
        console.log('⏭️ Skipped:', !tx.isActive ? 'non attiva' : 'è income')
        return
      }
      
      console.log('✅ Transazione valida per calcolo uscite previste')
      
      // Calcola occorrenze nel mese corrente
      let currentDate = tx.nextDueDate 
        ? new Date(tx.nextDueDate)
        : new Date()
      
      if (isNaN(currentDate.getTime())) {
        console.log('❌ Data next_execution non valida')
        return
      }
      
      console.log('📅 Next execution:', currentDate.toISOString())
      
      const frequency = tx.frequency?.toUpperCase() || 'MONTHLY'
      const amount = Math.abs(parseFloat(tx.amount.toString()) || 0)
      let occurrences = 0
      let iterations = 0
      const MAX_ITERATIONS = 12 // Limite per sicurezza
      
      // Calcola occorrenze nel periodo
      while (currentDate <= endOfMonth && iterations < MAX_ITERATIONS) {
        if (currentDate >= futureStartDate) {
          occurrences++
          console.log(`  ✅ Occorrenza: ${currentDate.toISOString()} - Amount: ${amount}€`)
        }
        
        // Incrementa data basandosi sulla frequenza
        switch (frequency) {
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
            // One-time or unknown
            if (currentDate >= futureStartDate && currentDate <= endOfMonth) {
              // Already counted above
            }
            break
        }
        
        iterations++
        
        // Evita loop infiniti per frequenze one-time
        if (frequency === 'ONE_TIME' || !['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY'].includes(frequency)) {
          break
        }
      }
      
      const totalContribution = amount * occurrences
      totalActiveExpenses += totalContribution
      activeExpenseCount++
      
      console.log(`📊 Contributo: ${occurrences} occorrenze × ${amount}€ = ${totalContribution}€`)
    })
    
    console.log('\n📊 RISULTATO FINALE:')
    console.log(`  - Transazioni pianificate totali: ${plannedTransactions.length}`)
    console.log(`  - Transazioni attive: ${plannedTransactions.filter(tx => tx.isActive).length}`)
    console.log(`  - Spese attive: ${activeExpenseCount}`)
    console.log(`  - Uscite previste per il mese corrente: ${totalActiveExpenses}€`)
    
    // Controlla anche gruppi di transazioni
    const transactionGroups = await prisma.transactionGroup.findMany({
      where: {
        userId: user.id
      },
      include: {
        plannedTransactions: true
      }
    })
    
    console.log(`\n📁 Gruppi di transazioni: ${transactionGroups.length}`)
    transactionGroups.forEach(group => {
      console.log(`  - ${group.name}: ${group.description} (${group.plannedTransactions.length} transazioni)`)
    })
    
    // Verifica se c'è una discrepanza tra le transazioni nel gruppo "Abbonamenti"
    const abbonamentiGroup = transactionGroups.find(g => 
      g.name.toLowerCase().includes('abbonament') || 
      g.description.toLowerCase().includes('abbonament')
    )
    
    if (abbonamentiGroup) {
      console.log('\n🔍 ANALISI GRUPPO ABBONAMENTI:')
      console.log(`  - Nome: ${abbonamentiGroup.name}`)
      console.log(`  - Descrizione: ${abbonamentiGroup.description}`)
      console.log(`  - Transazioni nel gruppo: ${abbonamentiGroup.plannedTransactions.length}`)
      
      abbonamentiGroup.plannedTransactions.forEach(tx => {
        const amount = parseFloat(tx.amount.toString())
        console.log(`    • ${tx.title || 'Senza titolo'}: ${amount}€ (${tx.frequency}, attiva: ${tx.isActive})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Disconnesso dal database')
  }
}

// Esegui il controllo
checkRealPlannedTransactions().catch(console.error)