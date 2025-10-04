/**
 * 🔧 FIX FOUND ISSUES
 * Corregge i dati problematici trovati nella diagnostica
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixFoundIssues() {
  console.log('🔧 Correzione dati problematici trovati...\n')
  
  try {
    
    // ==========================================
    // 1. CORREZIONE BUDGET CON AMOUNT = 0
    // ==========================================
    console.log('🔧 === CORREZIONE BUDGET CON AMOUNT = 0 ===')
    
    const budgetsWithZeroAmount = await prisma.budget.findMany({
      where: { amount: 0 },
      select: { id: true, main: true, period: true, userId: true }
    })
    
    console.log(`Trovati ${budgetsWithZeroAmount.length} budget con amount = 0`)
    
    if (budgetsWithZeroAmount.length > 0) {
      console.log('📋 Budget problematici:')
      budgetsWithZeroAmount.forEach((budget, i) => {
        console.log(`  ${i+1}. ID: ${budget.id}, Main: ${budget.main}, Period: ${budget.period}`)
      })
      
      // Opzione 1: Eliminarli (più sicuro)
      console.log('\n🗑️ Eliminazione budget con amount = 0...')
      const deletedCount = await prisma.budget.deleteMany({
        where: { amount: 0 }
      })
      console.log(`✅ Eliminati ${deletedCount.count} budget con amount = 0`)
      
      // Alternativa: Impostarli a 0.01 (se si vuole mantenere)
      // await prisma.budget.updateMany({
      //   where: { amount: 0 },
      //   data: { amount: 0.01 }
      // })
    }
    
    // ==========================================
    // 2. CORREZIONE SORT ORDER DUPLICATI
    // ==========================================
    console.log('\n🔧 === CORREZIONE SORT ORDER DUPLICATI ===')
    
    // Trova tutte le categorie con subcategorie che hanno sortOrder duplicati
    const categoriesWithDuplicates = await prisma.$queryRaw`
      SELECT "categoryId", COUNT(*) as duplicate_count
      FROM "Subcategory" 
      WHERE "sortOrder" IN (
        SELECT "sortOrder" 
        FROM "Subcategory" 
        GROUP BY "categoryId", "sortOrder" 
        HAVING COUNT(*) > 1
      )
      GROUP BY "categoryId"
      ORDER BY duplicate_count DESC
    `
    
    console.log(`Trovate ${categoriesWithDuplicates.length} categorie con sortOrder duplicati`)
    
    if (categoriesWithDuplicates.length > 0) {
      
      for (const categoryInfo of categoriesWithDuplicates) {
        const categoryId = categoryInfo.categoryId
        
        console.log(`\n🔄 Correzione sortOrder per categoria: ${categoryId}`)
        
        // Ottieni tutte le subcategorie di questa categoria ordinate per createdAt
        const subcategories = await prisma.subcategory.findMany({
          where: { categoryId },
          orderBy: { createdAt: 'asc' }
        })
        
        console.log(`   📁 Trovate ${subcategories.length} subcategorie da riordinare`)
        
        // Riassegna sortOrder sequenziale: 0, 1, 2, 3...
        for (let i = 0; i < subcategories.length; i++) {
          await prisma.subcategory.update({
            where: { id: subcategories[i].id },
            data: { sortOrder: i }
          })
          console.log(`   ✅ ${subcategories[i].name} -> sortOrder: ${i}`)
        }
      }
      
      console.log('✅ Tutti i sortOrder sono stati corretti!')
    }
    
    // ==========================================
    // 3. VERIFICA FINALE
    // ==========================================
    console.log('\n🔍 === VERIFICA FINALE ===')
    
    // Verifica che non ci siano più budget con amount = 0
    const remainingZeroBudgets = await prisma.budget.count({
      where: { amount: 0 }
    })
    console.log(`Budget con amount = 0 rimanenti: ${remainingZeroBudgets}`)
    
    // Verifica che non ci siano più sortOrder duplicati
    const duplicateSortOrders = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "categoryId", "sortOrder", COUNT(*) as cnt
        FROM "Subcategory"
        GROUP BY "categoryId", "sortOrder"
        HAVING COUNT(*) > 1
      ) as duplicates
    `
    console.log(`SortOrder duplicati rimanenti: ${Number(duplicateSortOrders[0].count)}`)
    
    console.log('\n🎉 Correzione completata!')
    
    if (remainingZeroBudgets === 0 && Number(duplicateSortOrders[0].count) === 0) {
      console.log('✅ Tutti i problemi sono stati risolti!')
      console.log('🚀 La webapp dovrebbe ora funzionare correttamente.')
    } else {
      console.log('⚠️ Alcuni problemi potrebbero ancora esistere.')
    }
    
  } catch (error) {
    console.error('❌ Errore durante la correzione:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

fixFoundIssues()
