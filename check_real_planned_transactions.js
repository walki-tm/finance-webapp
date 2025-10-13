/**
 * 🔍 DEBUG: Script per controllare le transazioni pianificate reali
 * 
 * Analizza il database per verificare quali transazioni pianificate
 * sono attive e dovrebbero contribuire al calcolo delle uscite previste
 */

import pg from 'pg'
import 'dotenv/config'

const { Client } = pg

async function checkRealPlannedTransactions() {
  console.log('🔍 DEBUGGING: Controllo transazioni pianificate reali nel database')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  
  try {
    await client.connect()
    console.log('✅ Connesso al database')
    
    // Query per ottenere le transazioni pianificate attive
    const plannedQuery = `
      SELECT 
        id,
        description,
        amount,
        frequency,
        main,
        is_active,
        next_execution,
        created_at,
        updated_at
      FROM planned_transactions 
      WHERE user_id = (
        SELECT id FROM users 
        WHERE email = 'm.venezia02@outlook.it'
      )
      ORDER BY is_active DESC, main ASC, description ASC
    `
    
    const plannedResult = await client.query(plannedQuery)
    const transactions = plannedResult.rows
    
    console.log(`📊 Trovate ${transactions.length} transazioni pianificate totali`)
    
    if (transactions.length === 0) {
      console.log('⚠️ Nessuna transazione pianificata trovata per l\'utente')
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
    
    transactions.forEach((tx, index) => {
      console.log(`\n--- Transazione ${index + 1} ---`)
      console.log('📋 Dettagli:', {
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        frequency: tx.frequency,
        main: tx.main,
        is_active: tx.is_active,
        next_execution: tx.next_execution,
        created_at: tx.created_at
      })
      
      // Controlla se è una spesa attiva
      const isActiveExpense = tx.is_active && tx.main?.toLowerCase() !== 'income'
      
      if (!isActiveExpense) {
        console.log('⏭️ Skipped:', !tx.is_active ? 'non attiva' : 'è income')
        return
      }
      
      console.log('✅ Transazione valida per calcolo uscite previste')
      
      // Calcola occorrenze nel mese corrente
      let currentDate = tx.next_execution 
        ? new Date(tx.next_execution)
        : new Date()
      
      if (isNaN(currentDate.getTime())) {
        console.log('❌ Data next_execution non valida')
        return
      }
      
      console.log('📅 Next execution:', currentDate.toISOString())
      
      const frequency = tx.frequency?.toUpperCase() || 'MONTHLY'
      const amount = Math.abs(parseFloat(tx.amount) || 0)
      let occurrences = 0
      
      // Calcola occorrenze nel periodo
      while (currentDate <= endOfMonth) {
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
            // One-time
            break
        }
        
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
    console.log(`  - Transazioni attive totali: ${transactions.filter(tx => tx.is_active).length}`)
    console.log(`  - Spese attive: ${activeExpenseCount}`)
    console.log(`  - Uscite previste per il mese: ${totalActiveExpenses}€`)
    
    // Controlla anche gruppi di transazioni
    const groupsQuery = `
      SELECT id, name, description, created_at
      FROM transaction_groups 
      WHERE user_id = (
        SELECT id FROM users 
        WHERE email = 'm.venezia02@outlook.it'
      )
    `
    
    const groupsResult = await client.query(groupsQuery)
    const groups = groupsResult.rows
    
    console.log(`\n📁 Gruppi di transazioni: ${groups.length}`)
    groups.forEach(group => {
      console.log(`  - ${group.name}: ${group.description}`)
    })
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await client.end()
    console.log('🔌 Disconnesso dal database')
  }
}

// Esegui il controllo
checkRealPlannedTransactions().catch(console.error)