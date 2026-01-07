/**
 * Script diagnostico per verificare transfers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugTransfers() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'm.venezia02@outlook.it' }
    })
    
    if (!user) {
      console.log('❌ Utente non trovato')
      return
    }
    
    console.log(`✅ Utente trovato: ${user.email}`)
    
    const start = new Date('2025-12-01T00:00:00.000Z')
    const end = new Date('2025-12-31T23:59:59.999Z')
    
    console.log(`\n📅 Periodo: ${start.toISOString()} - ${end.toISOString()}`)
    
    // Tutti i transfers con account info
    const transfers = await prisma.transfer.findMany({
      where: {
        date: { gte: start, lte: end },
        OR: [
          { fromAccount: { userId: user.id } },
          { toAccount: { userId: user.id } }
        ]
      },
      include: {
        fromAccount: { select: { name: true, accountType: true, userId: true } },
        toAccount: { select: { name: true, accountType: true, userId: true } }
      },
      orderBy: { date: 'desc' }
    })
    
    console.log(`\n🔄 Trovati ${transfers.length} transfers:`)
    
    let totalAllocate = 0
    let totalSaving = 0
    let totalInternal = 0
    
    transfers.forEach((t, i) => {
      const amount = Math.abs(Number(t.amount))
      const isUserFrom = t.fromAccount.userId === user.id
      
      console.log(`${i + 1}. ${t.date.toISOString().split('T')[0]}`)
      console.log(`   ${t.fromAccount.name} (${t.fromAccount.accountType}) → ${t.toAccount.name} (${t.toAccount.accountType})`)
      console.log(`   €${amount.toFixed(2)} | Type: ${t.transferType} | Note: ${t.note || 'N/A'}`)
      console.log(`   User is: ${isUserFrom ? 'FROM' : 'TO'}`)
      
      if (t.transferType === 'ALLOCATE') totalAllocate += amount
      if (t.transferType === 'SAVING') totalSaving += amount  
      if (t.transferType === 'INTERNAL') totalInternal += amount
    })
    
    console.log(`\n📊 RIEPILOGO TRANSFERS:`)
    console.log(`   📦 ALLOCATE: €${totalAllocate.toFixed(2)}`)
    console.log(`   💰 SAVING: €${totalSaving.toFixed(2)}`)
    console.log(`   🔄 INTERNAL: €${totalInternal.toFixed(2)}`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTransfers()
