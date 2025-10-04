/**
 * 🔍 DATABASE DIAGNOSTIC SCRIPT
 * Verifica l'integrità dei dati e trova inconsistenze
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runDiagnostics() {
  console.log('🔍 Avvio diagnostica database Finance WebApp...\n')
  
  try {
    // ==========================================
    // 1. VERIFICA INTEGRITÀ REFERENZIALE
    // ==========================================
    console.log('📋 === VERIFICA INTEGRITÀ REFERENZIALE ===')
    
    // Transazioni con subcategorie inesistenti
    const orphanTransactions = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" t 
      LEFT JOIN "Subcategory" s ON t."subId" = s."id"
      WHERE t."subId" IS NOT NULL AND s."id" IS NULL
    `
    console.log(`❌ Transazioni con subcategorie inesistenti: ${Number(orphanTransactions[0].count)}`)
    
    // Subcategorie con categorie inesistenti  
    const orphanSubcategories = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Subcategory" sc
      LEFT JOIN "Category" c ON sc."categoryId" = c."id"  
      WHERE c."id" IS NULL
    `
    console.log(`❌ Subcategorie con categorie inesistenti: ${Number(orphanSubcategories[0].count)}`)
    
    // Planned transactions con subcategorie inesistenti
    const orphanPlannedTx = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "PlannedTransaction" pt
      LEFT JOIN "Subcategory" s ON pt."subId" = s."id"
      WHERE pt."subId" IS NOT NULL AND s."id" IS NULL
    `
    console.log(`❌ Planned transactions con subcategorie inesistenti: ${Number(orphanPlannedTx[0].count)}`)
    
    // Budget con subcategorie inesistenti
    const orphanBudgets = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Budget" b
      LEFT JOIN "Subcategory" s ON b."subcategoryId" = s."id"
      WHERE b."subcategoryId" IS NOT NULL AND s."id" IS NULL
    `
    console.log(`❌ Budget con subcategorie inesistenti: ${Number(orphanBudgets[0].count)}`)
    
    // ==========================================
    // 2. VERIFICA DATI PROBLEMATICI  
    // ==========================================
    console.log('\n📋 === VERIFICA DATI PROBLEMATICI ===')
    
    // Transazioni con importi problematici
    const badAmountTx = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" 
      WHERE ABS("amount") > 999999999 OR "amount" = 0
    `
    console.log(`⚠️  Transazioni con importi problematici: ${Number(badAmountTx[0].count)}`)
    
    // Transazioni con date future eccessive
    const futureTx = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Transaction" 
      WHERE "date" > CURRENT_DATE + INTERVAL '1 year'
    `
    console.log(`⚠️  Transazioni con date future eccessive: ${Number(futureTx[0].count)}`)
    
    // Planned transactions con frequency invalida
    const badFrequency = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "PlannedTransaction" 
      WHERE "frequency" NOT IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME')
    `
    console.log(`⚠️  Planned transactions con frequency invalida: ${Number(badFrequency[0].count)}`)
    
    // Budget con period formato invalido
    const badPeriod = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Budget" 
      WHERE "period" !~ '^\\d{4}-\\d{2}$'
    `
    console.log(`⚠️  Budget con period formato invalido: ${Number(badPeriod[0].count)}`)
    
    // ==========================================
    // 3. DATI DETTAGLIATI PROBLEMATICI
    // ==========================================
    console.log('\n📋 === DATI DETTAGLIATI PROBLEMATICI ===')
    
    // Transazioni problematiche
    const problematicTransactions = await prisma.$queryRaw`
      SELECT t.id, t."userId", t.date, t.amount, t.main, t."subId"
      FROM "Transaction" t 
      LEFT JOIN "Subcategory" s ON t."subId" = s."id"
      WHERE (t."subId" IS NOT NULL AND s."id" IS NULL)
         OR ABS(t."amount") > 999999999 
         OR t."amount" = 0
         OR t."date" > CURRENT_DATE + INTERVAL '1 year'
      ORDER BY t."createdAt" DESC
      LIMIT 5
    `
    if (problematicTransactions.length > 0) {
      console.log('\n🚨 TRANSAZIONI PROBLEMATICHE TROVATE:')
      problematicTransactions.forEach((tx, i) => {
        console.log(`  ${i+1}. ID: ${tx.id}, Amount: ${tx.amount}, Date: ${tx.date}, SubID: ${tx.subId}`)
      })
    }
    
    // Subcategorie problematiche
    const problematicSubcats = await prisma.$queryRaw`
      SELECT sc.id, sc."userId", sc."categoryId", sc.name
      FROM "Subcategory" sc
      LEFT JOIN "Category" c ON sc."categoryId" = c."id"  
      WHERE c."id" IS NULL
      LIMIT 5
    `
    if (problematicSubcats.length > 0) {
      console.log('\n🚨 SUBCATEGORIE PROBLEMATICHE TROVATE:')
      problematicSubcats.forEach((sc, i) => {
        console.log(`  ${i+1}. ID: ${sc.id}, Name: ${sc.name}, CategoryID: ${sc.categoryId}`)
      })
    }
    
    // Planned transactions problematiche
    const problematicPlanned = await prisma.$queryRaw`
      SELECT pt.id, pt."userId", pt.title, pt."nextDueDate", pt."frequency", pt."isActive", pt."subId"
      FROM "PlannedTransaction" pt
      LEFT JOIN "Subcategory" s ON pt."subId" = s."id"
      WHERE (pt."subId" IS NOT NULL AND s."id" IS NULL)
         OR (pt."nextDueDate" < CURRENT_DATE - INTERVAL '2 years' AND pt."isActive" = true)
         OR pt."frequency" NOT IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME')
      ORDER BY pt."createdAt" DESC  
      LIMIT 5
    `
    if (problematicPlanned.length > 0) {
      console.log('\n🚨 PLANNED TRANSACTIONS PROBLEMATICHE TROVATE:')
      problematicPlanned.forEach((pt, i) => {
        console.log(`  ${i+1}. ID: ${pt.id}, Title: ${pt.title}, Frequency: ${pt.frequency}, SubID: ${pt.subId}`)
      })
    }
    
    // ==========================================
    // 4. STATISTICHE GENERALI
    // ==========================================
    console.log('\n📊 === STATISTICHE GENERALI ===')
    
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()
    const subcategoryCount = await prisma.subcategory.count()
    const transactionCount = await prisma.transaction.count()
    const plannedTxCount = await prisma.plannedTransaction.count()
    const budgetCount = await prisma.budget.count()
    
    console.log(`👥 Users: ${userCount}`)
    console.log(`📂 Categories: ${categoryCount}`)
    console.log(`📁 Subcategories: ${subcategoryCount}`)
    console.log(`💰 Transactions: ${transactionCount}`)
    console.log(`⏰ Planned Transactions: ${plannedTxCount}`)
    console.log(`💸 Budgets: ${budgetCount}`)
    
    console.log('\n✅ Diagnostica completata!')
    
  } catch (error) {
    console.error('❌ Errore durante la diagnostica:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

runDiagnostics()
