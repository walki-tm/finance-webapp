/**
 * 🔍 ANALYZE PROBLEMATIC DATA
 * Identifica dati specifici che causano loop infiniti nell'applicazione
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeProblematicData() {
  console.log('🔍 ANALISI DATI PROBLEMATICI - Ricerca dati che causano loop infiniti...\n')
  
  try {
    const userId = 'cmf912eck0001rsf22f77hfng' // Il tuo ID utente
    
    // ==========================================
    // 1. ANALISI PLANNED TRANSACTIONS PROBLEMATICHE
    // ==========================================
    console.log('🎯 === PLANNED TRANSACTIONS ANALYSIS ===')
    
    const plannedTransactions = await prisma.plannedTransaction.findMany({
      where: { userId },
      include: {
        subcategory: true,
        group: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Total Planned Transactions: ${plannedTransactions.length}`)
    
    // Controlla date problematiche
    console.log('\n🔍 Checking problematic dates...')
    const badDates = plannedTransactions.filter(pt => {
      const nextDue = new Date(pt.nextDueDate)
      const start = new Date(pt.startDate)
      const created = new Date(pt.createdAt)
      
      return (
        isNaN(nextDue.getTime()) || 
        isNaN(start.getTime()) || 
        isNaN(created.getTime()) ||
        nextDue.getFullYear() < 1900 || 
        nextDue.getFullYear() > 2100 ||
        start.getFullYear() < 1900 || 
        start.getFullYear() > 2100 ||
        start > nextDue
      )
    })
    
    if (badDates.length > 0) {
      console.log(`🚨 FOUND ${badDates.length} TRANSACTIONS WITH BAD DATES:`)
      badDates.forEach((pt, i) => {
        console.log(`  ${i+1}. ID: ${pt.id}`)
        console.log(`     Title: ${pt.title}`)
        console.log(`     NextDue: ${pt.nextDueDate}`)
        console.log(`     StartDate: ${pt.startDate}`)
        console.log(`     Created: ${pt.createdAt}`)
      })
    } else {
      console.log('✅ All dates are valid')
    }
    
    // Controlla campi null problematici
    console.log('\n🔍 Checking problematic null fields...')
    const nullFields = plannedTransactions.filter(pt => 
      pt.frequency === null || 
      pt.confirmationMode === null ||
      pt.main === null ||
      pt.amount === null
    )
    
    if (nullFields.length > 0) {
      console.log(`🚨 FOUND ${nullFields.length} TRANSACTIONS WITH NULL CRITICAL FIELDS:`)
      nullFields.forEach((pt, i) => {
        console.log(`  ${i+1}. ID: ${pt.id}, Title: ${pt.title}`)
        console.log(`     Frequency: ${pt.frequency}`)
        console.log(`     ConfirmationMode: ${pt.confirmationMode}`)
        console.log(`     Main: ${pt.main}`)
        console.log(`     Amount: ${pt.amount}`)
      })
    } else {
      console.log('✅ All critical fields are non-null')
    }
    
    // Controlla riferimenti rotti
    console.log('\n🔍 Checking broken references...')
    const brokenRefs = []
    
    for (const pt of plannedTransactions) {
      let issues = []
      
      // Controlla subcategory
      if (pt.subId && !pt.subcategory) {
        issues.push(`subcategory ${pt.subId} not found`)
      }
      
      // Controlla group
      if (pt.groupId && !pt.group) {
        issues.push(`group ${pt.groupId} not found`)
      }
      
      // Controlla account se presente
      if (pt.accountId) {
        const account = await prisma.account.findUnique({
          where: { id: pt.accountId }
        })
        if (!account) {
          issues.push(`account ${pt.accountId} not found`)
        }
      }
      
      if (issues.length > 0) {
        brokenRefs.push({ 
          id: pt.id, 
          title: pt.title, 
          issues: issues.join(', ')
        })
      }
    }
    
    if (brokenRefs.length > 0) {
      console.log(`🚨 FOUND ${brokenRefs.length} TRANSACTIONS WITH BROKEN REFERENCES:`)
      brokenRefs.forEach((pt, i) => {
        console.log(`  ${i+1}. ID: ${pt.id}, Title: ${pt.title}`)
        console.log(`     Issues: ${pt.issues}`)
      })
    } else {
      console.log('✅ All references are valid')
    }
    
    // Controlla transazioni con nextDueDate in scadenza che potrebbero causare auto-materializzazione
    console.log('\n🔍 Checking due transactions that might cause auto-materialization...')
    const now = new Date()
    const dueTransactions = plannedTransactions.filter(pt => {
      const nextDue = new Date(pt.nextDueDate)
      return pt.isActive && pt.confirmationMode === 'AUTOMATIC' && nextDue <= now
    })
    
    if (dueTransactions.length > 0) {
      console.log(`🚨 FOUND ${dueTransactions.length} AUTO TRANSACTIONS DUE (might cause loop):`)
      dueTransactions.forEach((pt, i) => {
        console.log(`  ${i+1}. ID: ${pt.id}, Title: ${pt.title}`)
        console.log(`     NextDue: ${pt.nextDueDate}`)
        console.log(`     ConfirmationMode: ${pt.confirmationMode}`)
        console.log(`     IsActive: ${pt.isActive}`)
      })
      console.log('\n💡 SUGGESTION: These AUTO transactions might be causing the infinite loop!')
      console.log('   Try disabling them or changing confirmationMode to MANUAL')
    } else {
      console.log('✅ No problematic due auto transactions')
    }
    
    // ==========================================
    // 2. ANALISI TRANSAZIONI RECENTI
    // ==========================================
    console.log('\n\n🎯 === RECENT TRANSACTIONS ANALYSIS ===')
    
    const recentTransactions = await prisma.transaction.findMany({
      where: { 
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Ultimi 7 giorni
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`📊 Recent Transactions (last 7 days): ${recentTransactions.length}`)
    
    if (recentTransactions.length > 0) {
      console.log('Latest transactions:')
      recentTransactions.slice(0, 5).forEach((tx, i) => {
        console.log(`  ${i+1}. ${tx.createdAt.toISOString()} - €${tx.amount} - ${tx.note || 'No note'}`)
      })
    }
    
    // ==========================================
    // 3. RIEPILOGO E RACCOMANDAZIONI
    // ==========================================
    console.log('\n\n📋 === SUMMARY & RECOMMENDATIONS ===')
    
    let foundIssues = 0
    
    if (badDates.length > 0) {
      foundIssues++
      console.log(`🚨 ISSUE 1: ${badDates.length} transactions with invalid dates`)
      console.log('   SOLUTION: Fix or delete these transactions')
    }
    
    if (nullFields.length > 0) {
      foundIssues++
      console.log(`🚨 ISSUE 2: ${nullFields.length} transactions with null critical fields`)
      console.log('   SOLUTION: Update these fields with valid values')
    }
    
    if (brokenRefs.length > 0) {
      foundIssues++
      console.log(`🚨 ISSUE 3: ${brokenRefs.length} transactions with broken references`)
      console.log('   SOLUTION: Fix references or set them to null')
    }
    
    if (dueTransactions.length > 0) {
      foundIssues++
      console.log(`🚨 ISSUE 4: ${dueTransactions.length} auto transactions due (LIKELY CAUSE OF LOOP!)`)
      console.log('   SOLUTION: Change confirmationMode to MANUAL or disable these transactions')
    }
    
    if (foundIssues === 0) {
      console.log('✅ No obvious data issues found. The problem might be in the frontend logic.')
    } else {
      console.log(`\n🎯 Found ${foundIssues} potential issues. Focus on Issue 4 first (auto transactions).`)
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeProblematicData()