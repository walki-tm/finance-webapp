/**
 * 🔧 FIX SCRIPT: Ripara le categorie dell'utente con key undefined
 * 
 * Uso: node fix-user-categories.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping nomi italiani -> key corretti
const categoryKeyMapping = {
  'Reddito': 'income',
  'SPESE': 'expense',
  'Risparmi': 'saving',
  'Debiti': 'debt',
  'FORMAZIONE': 'formation',
  'SALUTE': 'health',
  'AUTO': 'auto',
  'TECNOLOGIA': 'tech',
  'IMPREVISTI': 'unexpected'
}

async function fixUserCategories() {
  try {
    console.log('🔧 FIXING USER CATEGORIES: m.venezia02@outlook.it')
    console.log('='.repeat(50))
    
    // 1. Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: 'm.venezia02@outlook.it' },
      include: {
        categories: true
      }
    })
    
    if (!user) {
      console.log('❌ UTENTE NON TROVATO!')
      return
    }
    
    console.log(`✅ Utente trovato: ${user.name} (ID: ${user.id})`)
    console.log(`📂 Categorie da controllare: ${user.categories.length}`)
    console.log()
    
    // 2. Trova categorie con key undefined o null
    const brokenCategories = user.categories.filter(cat => !cat.key || cat.key === 'undefined')
    
    console.log(`🔍 Categorie con key problematici: ${brokenCategories.length}`)
    
    if (brokenCategories.length === 0) {
      console.log('✅ Tutte le categorie hanno key validi!')
      return
    }
    
    // 3. Ripara ogni categoria
    const fixes = []
    for (const category of brokenCategories) {
      const correctKey = categoryKeyMapping[category.name]
      
      if (correctKey) {
        console.log(`🔧 Riparando: "${category.name}" -> key: "${correctKey}"`)
        
        // Controlla che non esista già una categoria con questa key
        const existingWithKey = user.categories.find(cat => 
          cat.key === correctKey && cat.id !== category.id
        )
        
        if (existingWithKey) {
          console.log(`⚠️ ATTENZIONE: Esiste già una categoria con key "${correctKey}": ${existingWithKey.name}`)
          console.log(`   Salto la riparazione di "${category.name}"`)
          continue
        }
        
        fixes.push({
          id: category.id,
          name: category.name,
          newKey: correctKey
        })
      } else {
        console.log(`❌ ATTENZIONE: Non conosco la key corretta per "${category.name}"`)
        // Genera una key basata sul nome
        const generatedKey = category.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        console.log(`🔧 Generando key: "${category.name}" -> key: "${generatedKey}"`)
        
        fixes.push({
          id: category.id,
          name: category.name,
          newKey: generatedKey
        })
      }
    }
    
    // 4. Applica le correzioni
    if (fixes.length > 0) {
      console.log()
      console.log(`🚀 Applicando ${fixes.length} correzioni...`)
      
      for (const fix of fixes) {
        try {
          await prisma.category.update({
            where: { id: fix.id },
            data: { key: fix.newKey }
          })
          console.log(`✅ Riparato: "${fix.name}" -> key: "${fix.newKey}"`)
        } catch (error) {
          console.error(`❌ Errore riparando "${fix.name}":`, error.message)
        }
      }
      
      console.log()
      console.log('🎉 RIPARAZIONE COMPLETATA!')
    }
    
    // 5. Verifica finale
    console.log()
    console.log('🔍 VERIFICA FINALE:')
    
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'm.venezia02@outlook.it' },
      include: { categories: true }
    })
    
    const stillBroken = updatedUser.categories.filter(cat => !cat.key || cat.key === 'undefined')
    
    if (stillBroken.length === 0) {
      console.log('✅ TUTTE LE CATEGORIE SONO RIPARATE!')
      
      // Mostra le categorie riparate
      console.log()
      console.log('📂 CATEGORIE CORRETTE:')
      updatedUser.categories.forEach(cat => {
        console.log(`  - ${cat.name} -> key: "${cat.key}"`)
      })
    } else {
      console.log(`❌ ${stillBroken.length} categorie ancora problematiche:`)
      stillBroken.forEach(cat => {
        console.log(`  - ${cat.name} (key: ${cat.key})`)
      })
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserCategories()
