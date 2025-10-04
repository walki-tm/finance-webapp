/**
 * 🔬 ULTRA DEEP DIAGNOSTICS
 * Trova dati corrotti nascosti che causano blocchi della webapp
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function ultraDeepDiagnostics() {
  console.log('🔬 ULTRA DEEP DIAGNOSTICS - Ricerca dati corrotti nascosti...\n')
  
  try {
    
    // ==========================================
    // 1. STRINGHE VUOTE O CARATTERI PROBLEMATICI
    // ==========================================
    console.log('🔍 === STRINGHE PROBLEMATICHE ===')
    
    // Categorie con main/name vuoti o solo spazi
    const badCategoryStrings = await prisma.$queryRaw`
      SELECT id, "userId", main, name, "createdAt"
      FROM "Category" 
      WHERE main = '' 
         OR name = '' 
         OR main IS NULL 
         OR name IS NULL
         OR LENGTH(TRIM(main)) = 0 
         OR LENGTH(TRIM(name)) = 0
         OR main ~ '[[:cntrl:]]'
         OR name ~ '[[:cntrl:]]'
      LIMIT 5
    `
    if (badCategoryStrings.length > 0) {
      console.log('🚨 CATEGORIES CON STRINGHE PROBLEMATICHE:')
      badCategoryStrings.forEach((cat, i) => {
        console.log(`  ${i+1}. ID: ${cat.id}, Main: '${cat.main}', Name: '${cat.name}'`)
      })
    } else {
      console.log('✅ Categories: nessuna stringa problematica')
    }
    
    // Subcategorie con name vuoto
    const badSubcatStrings = await prisma.$queryRaw`
      SELECT id, "userId", "categoryId", name, "createdAt"
      FROM "Subcategory" 
      WHERE name = '' 
         OR name IS NULL
         OR LENGTH(TRIM(name)) = 0
         OR name ~ '[[:cntrl:]]'
      LIMIT 5
    `
    if (badSubcatStrings.length > 0) {
      console.log('🚨 SUBCATEGORIES CON STRINGHE PROBLEMATICHE:')
      badSubcatStrings.forEach((sub, i) => {
        console.log(`  ${i+1}. ID: ${sub.id}, Name: '${sub.name}', CategoryID: ${sub.categoryId}`)
      })
    } else {
      console.log('✅ Subcategories: nessuna stringa problematica')
    }
    
    // ==========================================
    // 2. VALORI DECIMAL/NUMERIC CORROTTI
    // ==========================================
    console.log('\n🔍 === VALORI NUMERICI CORROTTI ===')
    
    // Transazioni con amount = 0 o valori strani
    const badTransactionAmounts = await prisma.$queryRaw`
      SELECT id, "userId", amount, date, main, "createdAt"
      FROM "Transaction" 
      WHERE amount = 0
         OR amount IS NULL
         OR ABS(amount) > 999999999999
         OR amount::text ~ '[^0-9.-]'
      LIMIT 5
    `
    if (badTransactionAmounts.length > 0) {
      console.log('🚨 TRANSACTIONS CON IMPORTI PROBLEMATICI:')
      badTransactionAmounts.forEach((tx, i) => {
        console.log(`  ${i+1}. ID: ${tx.id}, Amount: ${tx.amount}, Date: ${tx.date}`)
      })
    } else {
      console.log('✅ Transactions: nessun importo problematico')
    }
    
    // Budget con amount = 0 o corrotti
    const badBudgetAmounts = await prisma.$queryRaw`
      SELECT id, "userId", main, "period", amount, "createdAt"
      FROM "Budget" 
      WHERE amount = 0
         OR amount IS NULL
         OR ABS(amount) > 999999999999
      LIMIT 5
    `
    if (badBudgetAmounts.length > 0) {
      console.log('🚨 BUDGETS CON IMPORTI PROBLEMATICI:')
      badBudgetAmounts.forEach((budget, i) => {
        console.log(`  ${i+1}. ID: ${budget.id}, Amount: ${budget.amount}, Period: ${budget.period}`)
      })
    } else {
      console.log('✅ Budgets: nessun importo problematico')
    }
    
    // ==========================================
    // 3. DATE E TIMESTAMP CORROTTI
    // ==========================================
    console.log('\n🔍 === DATE E TIMESTAMP CORROTTI ===')
    
    // Transazioni con date strane
    const badTransactionDates = await prisma.$queryRaw`
      SELECT id, "userId", date, amount, main, "createdAt", "updatedAt"
      FROM "Transaction" 
      WHERE date IS NULL
         OR date < '1900-01-01'::date
         OR date > '2050-01-01'::date
         OR "createdAt" IS NULL
         OR "updatedAt" IS NULL
         OR "createdAt" > "updatedAt"
      LIMIT 5
    `
    if (badTransactionDates.length > 0) {
      console.log('🚨 TRANSACTIONS CON DATE PROBLEMATICHE:')
      badTransactionDates.forEach((tx, i) => {
        console.log(`  ${i+1}. ID: ${tx.id}, Date: ${tx.date}, Created: ${tx.createdAt}, Updated: ${tx.updatedAt}`)
      })
    } else {
      console.log('✅ Transactions: nessuna data problematica')
    }
    
    // Planned transactions con date problematiche
    const badPlannedDates = await prisma.$queryRaw`
      SELECT id, "userId", title, "nextDueDate", "startDate", frequency, "createdAt"
      FROM "PlannedTransaction" 
      WHERE "nextDueDate" IS NULL
         OR "startDate" IS NULL
         OR "nextDueDate" < '1900-01-01'::date
         OR "startDate" < '1900-01-01'::date
         OR "nextDueDate" > '2050-01-01'::date
         OR "startDate" > "nextDueDate"
      LIMIT 5
    `
    if (badPlannedDates.length > 0) {
      console.log('🚨 PLANNED TRANSACTIONS CON DATE PROBLEMATICHE:')
      badPlannedDates.forEach((pt, i) => {
        console.log(`  ${i+1}. ID: ${pt.id}, NextDue: ${pt.nextDueDate}, StartDate: ${pt.startDate}`)
      })
    } else {
      console.log('✅ Planned Transactions: nessuna data problematica')
    }
    
    // ==========================================
    // 4. RIFERIMENTI ROTTI/INCONSISTENTI
    // ==========================================
    console.log('\n🔍 === RIFERIMENTI ROTTI ===')
    
    // Transazioni che puntano a subcategorie di altri utenti
    const crossUserTransactions = await prisma.$queryRaw`
      SELECT t.id, t."userId" as tx_user, t."subId", s."userId" as sub_user, s.name
      FROM "Transaction" t
      JOIN "Subcategory" s ON t."subId" = s."id"
      WHERE t."userId" != s."userId"
      LIMIT 5
    `
    if (crossUserTransactions.length > 0) {
      console.log('🚨 TRANSACTIONS CHE PUNTANO A SUBCATEGORIE DI ALTRI UTENTI:')
      crossUserTransactions.forEach((tx, i) => {
        console.log(`  ${i+1}. TX ID: ${tx.id}, TX User: ${tx.tx_user}, Sub User: ${tx.sub_user}`)
      })
    } else {
      console.log('✅ Transactions: nessun riferimento cross-user')
    }
    
    // Budget che puntano a subcategorie di altri utenti
    const crossUserBudgets = await prisma.$queryRaw`
      SELECT b.id, b."userId" as budget_user, b."subcategoryId", s."userId" as sub_user
      FROM "Budget" b
      JOIN "Subcategory" s ON b."subcategoryId" = s."id"
      WHERE b."userId" != s."userId"
      LIMIT 5
    `
    if (crossUserBudgets.length > 0) {
      console.log('🚨 BUDGETS CHE PUNTANO A SUBCATEGORIE DI ALTRI UTENTI:')
      crossUserBudgets.forEach((b, i) => {
        console.log(`  ${i+1}. Budget ID: ${b.id}, Budget User: ${b.budget_user}, Sub User: ${b.sub_user}`)
      })
    } else {
      console.log('✅ Budgets: nessun riferimento cross-user')
    }
    
    // ==========================================
    // 5. DATI CON ENCODING PROBLEMATICI
    // ==========================================
    console.log('\n🔍 === ENCODING E CARATTERI SPECIALI ===')
    
    // Categorie/subcategorie con caratteri non UTF-8 o strani
    const badEncodingData = await prisma.$queryRaw`
      SELECT 'Category' as table_name, id, main, name
      FROM "Category" 
      WHERE main ~ '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
         OR name ~ '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
         OR LENGTH(main) != LENGTH(TRIM(main))
         OR LENGTH(name) != LENGTH(TRIM(name))
      UNION ALL
      SELECT 'Subcategory' as table_name, id, 'N/A' as main, name
      FROM "Subcategory" 
      WHERE name ~ '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]'
         OR LENGTH(name) != LENGTH(TRIM(name))
      LIMIT 10
    `
    if (badEncodingData.length > 0) {
      console.log('🚨 DATI CON ENCODING PROBLEMATICI:')
      badEncodingData.forEach((data, i) => {
        console.log(`  ${i+1}. Table: ${data.table_name}, ID: ${data.id}, Name: '${data.name}'`)
      })
    } else {
      console.log('✅ Encoding: nessun carattere problematico')
    }
    
    // ==========================================
    // 6. ANALISI SPECIFICA CAMPI ENUM
    // ==========================================
    console.log('\n🔍 === VALORI ENUM INVALIDI ===')
    
    // Account con accountType invalido
    const invalidAccountTypes = await prisma.$queryRaw`
      SELECT id, "userId", name, "accountType"
      FROM "Account" 
      WHERE "accountType" NOT IN ('CURRENT', 'INVESTMENTS', 'SAVINGS', 'POCKET')
      LIMIT 5
    `
    if (invalidAccountTypes.length > 0) {
      console.log('🚨 ACCOUNTS CON ACCOUNT TYPE INVALIDO:')
      invalidAccountTypes.forEach((acc, i) => {
        console.log(`  ${i+1}. ID: ${acc.id}, Name: ${acc.name}, Type: ${acc.accountType}`)
      })
    } else {
      console.log('✅ Accounts: tutti i tipi sono validi')
    }
    
    // ==========================================
    // 7. CONTROLLO SEQUENZA DATI
    // ==========================================
    console.log('\n🔍 === SEQUENZE E ORDINI STRANI ===')
    
    // Subcategorie con sortOrder duplicati o negativi
    const badSortOrders = await prisma.$queryRaw`
      SELECT sc1.id, sc1."userId", sc1.name, sc1."sortOrder", sc1."categoryId"
      FROM "Subcategory" sc1
      WHERE sc1."sortOrder" < 0
         OR EXISTS (
           SELECT 1 FROM "Subcategory" sc2 
           WHERE sc2."categoryId" = sc1."categoryId" 
           AND sc2."sortOrder" = sc1."sortOrder" 
           AND sc2."id" != sc1."id"
         )
      LIMIT 5
    `
    if (badSortOrders.length > 0) {
      console.log('🚨 SUBCATEGORIES CON SORT ORDER PROBLEMATICI:')
      badSortOrders.forEach((sub, i) => {
        console.log(`  ${i+1}. ID: ${sub.id}, Name: ${sub.name}, SortOrder: ${sub.sortOrder}`)
      })
    } else {
      console.log('✅ Subcategories: tutti i sort order sono validi')
    }
    
    console.log('\n📊 === CONTEGGI FINALI ===')
    
    // Conteggi per verifica
    const counts = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "User") as users,
        (SELECT COUNT(*) FROM "Category") as categories,
        (SELECT COUNT(*) FROM "Subcategory") as subcategories,
        (SELECT COUNT(*) FROM "Transaction") as transactions,
        (SELECT COUNT(*) FROM "Budget") as budgets,
        (SELECT COUNT(*) FROM "PlannedTransaction") as planned_transactions,
        (SELECT COUNT(*) FROM "Account") as accounts
    `
    
    const stats = counts[0]
    console.log(`👥 Users: ${stats.users}`)
    console.log(`📂 Categories: ${stats.categories}`)  
    console.log(`📁 Subcategories: ${stats.subcategories}`)
    console.log(`💰 Transactions: ${stats.transactions}`)
    console.log(`💸 Budgets: ${stats.budgets}`)
    console.log(`⏰ Planned Transactions: ${stats.planned_transactions}`)
    console.log(`🏦 Accounts: ${stats.accounts}`)
    
    console.log('\n✅ Ultra Deep Diagnostics completata!')
    console.log('Se non sono stati trovati problemi, il bug potrebbe essere nel frontend o in query più complesse.')
    
  } catch (error) {
    console.error('❌ Errore durante ultra deep diagnostics:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

ultraDeepDiagnostics()
