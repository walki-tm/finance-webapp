/**
 * 🔍 DEEP DATABASE DIAGNOSTICS
 * Analisi approfondita per trovare tutti i possibili problemi
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runDeepDiagnostics() {
  console.log('🔍 DEEP DIAGNOSTICS - Analisi approfondita database...\n')
  
  try {
    
    // ==========================================
    // 1. VERIFICA DATI NULL DOVE NON DOVREBBERO ESSERE
    // ==========================================
    console.log('🔎 === VERIFICA CAMPI OBBLIGATORI NULL ===')
    
    // Transazioni con campi obbligatori NULL
    const nullTransactions = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" 
      WHERE "userId" IS NULL 
         OR "date" IS NULL 
         OR "amount" IS NULL 
         OR "main" IS NULL
    `
    console.log(`❌ Transazioni con campi obbligatori NULL: ${Number(nullTransactions[0].count)}`)
    
    // Categories con campi obbligatori NULL
    const nullCategories = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Category" 
      WHERE "userId" IS NULL 
         OR "main" IS NULL 
         OR "name" IS NULL
    `
    console.log(`❌ Categories con campi obbligatori NULL: ${Number(nullCategories[0].count)}`)
    
    // Budget con campi obbligatori NULL
    const nullBudgets = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Budget" 
      WHERE "userId" IS NULL 
         OR "main" IS NULL 
         OR "period" IS NULL 
         OR "amount" IS NULL
    `
    console.log(`❌ Budget con campi obbligatori NULL: ${Number(nullBudgets[0].count)}`)
    
    // ==========================================
    // 2. VERIFICA DATI CON VALORI ESTREMI
    // ==========================================
    console.log('\n🔎 === VERIFICA VALORI ESTREMI ===')
    
    // Transazioni con importi estremi
    const extremeAmounts = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" 
      WHERE ABS("amount") > 1000000
    `
    console.log(`⚠️  Transazioni con importi > 1M: ${Number(extremeAmounts[0].count)}`)
    
    // Budget con importi estremi
    const extremeBudgets = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Budget" 
      WHERE ABS("amount") > 1000000
    `
    console.log(`⚠️  Budget con importi > 1M: ${Number(extremeBudgets[0].count)}`)
    
    // ==========================================
    // 3. VERIFICA PROBLEMI CON LE DATE
    // ==========================================
    console.log('\n🔎 === VERIFICA PROBLEMI DATE ===')
    
    // Transazioni con date nel futuro lontano
    const futureDates = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" 
      WHERE "date" > CURRENT_DATE + INTERVAL '2 years'
    `
    console.log(`⚠️  Transazioni con date > 2 anni nel futuro: ${Number(futureDates[0].count)}`)
    
    // Transazioni con date molto nel passato
    const oldDates = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" 
      WHERE "date" < '1900-01-01'
    `
    console.log(`⚠️  Transazioni con date < 1900: ${Number(oldDates[0].count)}`)
    
    // Planned transactions con nextDueDate problematiche
    const badDueDates = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "PlannedTransaction" 
      WHERE "nextDueDate" IS NULL 
         OR "nextDueDate" < '1900-01-01'
         OR "nextDueDate" > CURRENT_DATE + INTERVAL '10 years'
    `
    console.log(`⚠️  Planned transactions con nextDueDate problematiche: ${Number(badDueDates[0].count)}`)
    
    // ==========================================
    // 4. VERIFICA CICLI INFINITI O LOOP
    // ==========================================
    console.log('\n🔎 === VERIFICA PROBLEMI LOGICI ===')
    
    // Subcategorie duplicate (stesso nome nella stessa categoria)
    const duplicateSubcats = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "userId", "categoryId", "name", COUNT(*) as cnt
        FROM "Subcategory"
        GROUP BY "userId", "categoryId", "name"
        HAVING COUNT(*) > 1
      ) as duplicates
    `
    console.log(`⚠️  Subcategorie duplicate: ${Number(duplicateSubcats[0].count)}`)
    
    // Categories duplicate (stesso main/name per lo stesso user)
    const duplicateCategories = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "userId", "main", "name", COUNT(*) as cnt
        FROM "Category"
        GROUP BY "userId", "main", "name"
        HAVING COUNT(*) > 1
      ) as duplicates
    `
    console.log(`⚠️  Categories duplicate: ${Number(duplicateCategories[0].count)}`)
    
    // ==========================================
    // 5. DETTAGLI RECORD PROBLEMATICI
    // ==========================================
    console.log('\n🚨 === DETTAGLI RECORD PROBLEMATICI ===')
    
    // Transazioni più problematiche
    const problematicTx = await prisma.$queryRaw`
      SELECT id, "userId", date, amount, main, "subId", "createdAt"
      FROM "Transaction" 
      WHERE "userId" IS NULL 
         OR "date" IS NULL 
         OR "amount" IS NULL 
         OR "main" IS NULL
         OR ABS("amount") > 1000000
         OR "date" > CURRENT_DATE + INTERVAL '2 years'
         OR "date" < '1900-01-01'
      ORDER BY "createdAt" DESC
      LIMIT 3
    `
    if (problematicTx.length > 0) {
      console.log('\n🚨 TRANSAZIONI PIÙ PROBLEMATICHE:')
      problematicTx.forEach((tx, i) => {
        console.log(`  ${i+1}. ID: ${tx.id}`)
        console.log(`     Amount: ${tx.amount}, Date: ${tx.date}`)
        console.log(`     Main: ${tx.main}, UserID: ${tx.userId}`)
      })
    }
    
    // Budget più problematici
    const problematicBudgets = await prisma.$queryRaw`
      SELECT id, "userId", main, "period", amount, "subcategoryId", "createdAt"
      FROM "Budget" 
      WHERE "userId" IS NULL 
         OR "main" IS NULL 
         OR "period" IS NULL 
         OR "amount" IS NULL
         OR ABS("amount") > 1000000
         OR "period" !~ '^\\d{4}-\\d{2}$'
      ORDER BY "createdAt" DESC
      LIMIT 3
    `
    if (problematicBudgets.length > 0) {
      console.log('\n🚨 BUDGET PIÙ PROBLEMATICI:')
      problematicBudgets.forEach((budget, i) => {
        console.log(`  ${i+1}. ID: ${budget.id}`)
        console.log(`     Amount: ${budget.amount}, Period: ${budget.period}`)
        console.log(`     Main: ${budget.main}, UserID: ${budget.userId}`)
      })
    }
    
    // ==========================================
    // 6. TEST QUERY CRITICHE DELLA HOMEPAGE
    // ==========================================
    console.log('\n🎯 === TEST QUERY CRITICHE HOMEPAGE ===')
    
    try {
      console.log('Testing categories query...')
      const categoriesCount = await prisma.category.count()
      console.log(`✅ Categories query OK (${categoriesCount} records)`)
    } catch (error) {
      console.log(`❌ Categories query FAILED: ${error.message}`)
    }
    
    try {
      console.log('Testing transactions query...')
      const transactionsCount = await prisma.transaction.count()
      console.log(`✅ Transactions query OK (${transactionsCount} records)`)
    } catch (error) {
      console.log(`❌ Transactions query FAILED: ${error.message}`)
    }
    
    try {
      console.log('Testing budgets query...')
      const budgetsCount = await prisma.budget.count()
      console.log(`✅ Budgets query OK (${budgetsCount} records)`)
    } catch (error) {
      console.log(`❌ Budgets query FAILED: ${error.message}`)
    }
    
    try {
      console.log('Testing balance calculation...')
      const balanceQuery = await prisma.$queryRaw`
        SELECT COALESCE(SUM("amount"), 0) as total
        FROM "Transaction"
        WHERE "date" <= CURRENT_DATE
      `
      console.log(`✅ Balance query OK (${balanceQuery[0].total})`)
    } catch (error) {
      console.log(`❌ Balance query FAILED: ${error.message}`)
    }
    
    console.log('\n✅ Deep diagnostics completata!')
    
  } catch (error) {
    console.error('❌ Errore durante la diagnostica approfondita:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

runDeepDiagnostics()
