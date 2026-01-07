/**
 * Script diagnostico per verificare calcolo uscite
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugExpenses() {
  try {
    // Trova utente
    const user = await prisma.user.findUnique({
      where: { email: 'm.venezia02@outlook.it' }
    })
    
    if (!user) {
      console.log('❌ Utente non trovato')
      return
    }
    
    console.log(`✅ Utente trovato: ${user.email} (ID: ${user.id})`)
    
    // Periodo: Dicembre 2025
    const start = new Date('2025-12-01T00:00:00.000Z')
    const end = new Date('2025-12-31T23:59:59.999Z')
    
    console.log(`\n📅 Periodo: ${start.toISOString()} - ${end.toISOString()}`)
    
    // TUTTE le transazioni di dicembre (per debug)
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: start, lte: end }
      },
      select: {
        id: true,
        date: true,
        main: true,
        amount: true,
        note: true
      },
      orderBy: { date: 'desc' }
    })
    
    console.log(`\n📋 TUTTE le transazioni di dicembre (${allTransactions.length}):`)
    
    let totalIncome = 0
    let totalExpenses = 0
    let totalSaving = 0
    
    allTransactions.forEach((tx, i) => {
      const amount = Math.abs(Number(tx.amount))
      const isIncome = tx.main === 'INCOME'
      const isSaving = tx.main === 'SAVING'
      
      if (isIncome) {
        totalIncome += amount
      } else if (isSaving) {
        totalSaving += amount
      } else {
        totalExpenses += amount
      }
      
      const emoji = isIncome ? '💰' : isSaving ? '🏦' : '💸'
      console.log(`${emoji} ${i + 1}. ${tx.date.toISOString().split('T')[0]} | ${tx.main} | €${amount.toFixed(2)} | ${tx.note || 'N/A'}`)
    })
    
    console.log(`\n📊 RIEPILOGO:`)
    console.log(`   💰 Entrate (INCOME): €${totalIncome.toFixed(2)}`)
    console.log(`   💸 Uscite (escluso INCOME e SAVING): €${totalExpenses.toFixed(2)}`)
    console.log(`   🏦 Risparmio (SAVING): €${totalSaving.toFixed(2)}`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugExpenses()
