/**
 * 🔍 Script di Diagnostica Transazioni Pianificate
 * 
 * Questo script analizza le transazioni pianificate per l'utente
 * m.venezia02@outlook.it per capire perché le "Uscite Previste"
 * risultano essere 250.625,55 €
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
  try {
    console.log('🔍 Iniziando diagnostica per m.venezia02@outlook.it...\n')
    
    // 1. Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: 'm.venezia02@outlook.it' }
    })
    
    if (!user) {
      console.log('❌ Utente non trovato!')
      return
    }
    
    console.log('✅ Utente trovato:', user.email, '(ID:', user.id, ')\n')
    
    // 2. Recupera tutte le transazioni pianificate attive
    const plannedTransactions = await prisma.plannedTransaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        }
      },
      orderBy: {
        amount: 'desc'
      }
    })
    
    console.log(`📊 Trovate ${plannedTransactions.length} transazioni pianificate\n`)
    
    // 3. Analizza ogni transazione
    let totalActive = 0
    let totalInactive = 0
    let totalIncomeActive = 0
    let totalExpenseActive = 0
    
    const activeExpenses = []
    
    console.log('📋 DETTAGLIO TRANSAZIONI:\n')
    console.log('='  .repeat(80))
    
    plannedTransactions.forEach((tx, index) => {
      const isIncome = tx.subcategory?.Category?.main === 'INCOME'
      const isActive = tx.isActive
      const amount = Math.abs(parseFloat(tx.amount))
      
      if (isActive) {
        totalActive++
        if (isIncome) {
          totalIncomeActive += amount
        } else {
          totalExpenseActive += amount
          activeExpenses.push(tx)
        }
      } else {
        totalInactive++
      }
      
      console.log(`\n${index + 1}. ${tx.title || tx.note || 'Senza descrizione'}`)
      console.log(`   ID: ${tx.id}`)
      console.log(`   Importo: ${amount.toFixed(2)} €`)
      console.log(`   Tipo: ${isIncome ? '💰 INCOME' : '💸 EXPENSE'}`)
      console.log(`   Main Category: ${tx.subcategory?.Category?.main || tx.main || 'N/A'}`)
      console.log(`   Subcategory: ${tx.subcategory?.name || 'N/A'}`)
      console.log(`   Frequenza: ${tx.frequency}`)
      console.log(`   Modalità: ${tx.mode}`)
      console.log(`   Attiva: ${isActive ? '✅ SÌ' : '❌ NO'}`)
      console.log(`   Start Date: ${tx.startDate}`)
      console.log(`   Next Execution: ${tx.next_execution || 'Non impostata'}`)
      console.log(`   End Date: ${tx.endDate || 'Nessuna'}`)
      console.log(`   Applied to Budget: ${tx.appliedToBudget ? '✅ SÌ' : '❌ NO'}`)
      console.log(`   Group ID: ${tx.groupId || 'Nessuno'}`)
    })
    
    console.log('\n' + '='.repeat(80))
    
    // 4. Calcola le uscite per dicembre 2025
    console.log('\n\n📅 CALCOLO USCITE DICEMBRE 2025:\n')
    console.log('='  .repeat(80))
    
    const startDate = new Date(2025, 11, 1) // 1 dicembre 2025
    const endDate = new Date(2025, 11, 31) // 31 dicembre 2025
    const now = new Date()
    const futureStartDate = new Date(Math.max(startDate.getTime(), now.getTime()))
    
    console.log(`Periodo: ${startDate.toLocaleDateString('it-IT')} - ${endDate.toLocaleDateString('it-IT')}`)
    console.log(`Data corrente: ${now.toLocaleDateString('it-IT')}`)
    console.log(`Start futuro (max tra periodo e ora): ${futureStartDate.toLocaleDateString('it-IT')}\n`)
    
    let totalPlannedExpenses = 0
    
    activeExpenses.forEach((tx, index) => {
      console.log(`\n${index + 1}. Analizzando: ${tx.title || tx.note || 'Senza descrizione'}`)
      console.log(`   Importo base: ${Math.abs(parseFloat(tx.amount)).toFixed(2)} €`)
      console.log(`   Frequenza: ${tx.frequency}`)
      console.log(`   Next Due Date: ${tx.nextDueDate}`)
      
      // Calcola occorrenze
      let currentDate = tx.next_execution 
        ? new Date(tx.next_execution)
        : new Date(tx.nextDueDate || tx.startDate || futureStartDate)
      
      const frequency = tx.frequency?.toUpperCase() || 'MONTHLY'
      const amount = Math.abs(parseFloat(tx.amount) || 0)
      let occurrences = 0
      let iterations = 0
      const MAX_ITERATIONS = 500
      
      const occurrenceDates = []
      
      while (currentDate <= endDate && iterations < MAX_ITERATIONS) {
        if (currentDate >= futureStartDate) {
          occurrences++
          occurrenceDates.push(new Date(currentDate))
        }
        
        try {
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
                occurrences = 1
              }
              break
          }
        } catch (dateError) {
          console.error('   ❌ Errore calcolo data:', dateError)
          break
        }
        
        iterations++
        
        if (iterations >= MAX_ITERATIONS) {
          console.warn('   ⚠️ Raggiunto limite iterazioni!')
          break
        }
      }
      
      const subtotal = amount * occurrences
      totalPlannedExpenses += subtotal
      
      console.log(`   Occorrenze nel periodo: ${occurrences}`)
      if (occurrenceDates.length > 0 && occurrenceDates.length <= 10) {
        console.log(`   Date occorrenze:`)
        occurrenceDates.forEach(date => {
          console.log(`     - ${date.toLocaleDateString('it-IT')}`)
        })
      } else if (occurrenceDates.length > 10) {
        console.log(`   Date occorrenze: [Troppi risultati da mostrare: ${occurrenceDates.length}]`)
      }
      console.log(`   Subtotale: ${subtotal.toFixed(2)} €`)
      console.log(`   ✅ Cumulativo: ${totalPlannedExpenses.toFixed(2)} €`)
    })
    
    console.log('\n' + '='.repeat(80))
    console.log(`\n💰 TOTALE USCITE PREVISTE DICEMBRE 2025: ${totalPlannedExpenses.toFixed(2)} €`)
    console.log('='  .repeat(80))
    
    // 5. Riepilogo statistiche
    console.log('\n\n📊 RIEPILOGO STATISTICHE:\n')
    console.log(`Transazioni totali: ${plannedTransactions.length}`)
    console.log(`Transazioni attive: ${totalActive}`)
    console.log(`Transazioni inattive: ${totalInactive}`)
    console.log(`Entrate attive (importo base): ${totalIncomeActive.toFixed(2)} €`)
    console.log(`Uscite attive (importo base): ${totalExpenseActive.toFixed(2)} €`)
    console.log(`Uscite attive (numero): ${activeExpenses.length}`)
    
  } catch (error) {
    console.error('❌ Errore durante la diagnostica:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
