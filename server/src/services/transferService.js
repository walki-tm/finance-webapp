import { prisma } from '../lib/prisma.js'
import { invalidateBalanceCache } from './balanceService.js'
import { 
  updateAccountBalance,
  revertAccountBalance 
} from './accountBalanceService.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

/**
 * 🎯 Determina automaticamente il tipo di trasferimento
 * 
 * Regole:
 * - CORRENTE → POCKET = ALLOCATE (Accantonamento)
 * - CORRENTE → SAVINGS = SAVING (Risparmio)
 * - Tutti gli altri casi = INTERNAL (Interno)
 */
function determineTransferType(fromAccount, toAccount) {
  // ALLOCATE: Accantonamento da Corrente a Pocket
  if (fromAccount.accountType === 'CURRENT' && toAccount.accountType === 'POCKET') {
    return 'ALLOCATE'
  }
  
  // SAVING: Risparmio da Corrente a Savings
  if (fromAccount.accountType === 'CURRENT' && toAccount.accountType === 'SAVINGS') {
    return 'SAVING'
  }
  
  // INTERNAL: tutti gli altri casi
  // - Stesso tipo di conto
  // - Verso Corrente
  // - Pocket → Pocket, Savings → Savings, ecc.
  return 'INTERNAL'
}

export async function createTransfer(userId, data) {
  const { date, amount, fromAccountId, toAccountId, note } = data
  
  console.log(`💸 DEBUG createTransfer called:`)
  console.log(`  - userId: ${userId}`)
  console.log(`  - fromAccountId: ${fromAccountId}`)
  console.log(`  - toAccountId: ${toAccountId}`)
  console.log(`  - amount: ${amount}`)
  
  // Valida che i conti esistano e appartengano all'utente
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
    prisma.account.findFirst({ where: { id: toAccountId, userId } })
  ])
  
  if (!fromAccount) throw httpError(400, 'Conto di origine non trovato')
  if (!toAccount) throw httpError(400, 'Conto di destinazione non trovato')
  if (fromAccountId === toAccountId) throw httpError(400, 'I conti devono essere diversi')
  
  // 🎯 Determina automaticamente il tipo di trasferimento
  const transferType = determineTransferType(fromAccount, toAccount)
  console.log(`🎯 Transfer type determined: ${transferType} (${fromAccount.accountType} → ${toAccount.accountType})`)
  
  // Crea il trasferimento e aggiorna i saldi in una transazione atomica
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crea il record Transfer
    const transfer = await tx.transfer.create({
      data: {
        userId,
        fromAccountId,
        toAccountId,
        amount: Math.abs(amount), // Sempre positivo nel modello Transfer
        note: note || null,
        date: new Date(date),
        transferType // 🎯 Classificazione automatica
      },
      include: {
        fromAccount: true,
        toAccount: true
      }
    })
    
    // 2. Aggiorna i saldi dei conti
    console.log(`💸 TRASFERIMENTO - Aggiornamento conto mittente "${fromAccount.name}":`)
    console.log(`   - Sottrarre: €${Math.abs(amount)}`)
    await updateAccountBalance(fromAccountId, Math.abs(amount), 'EXPENSE', { transaction: tx })
    
    console.log(`💰 TRASFERIMENTO - Aggiornamento conto destinatario "${toAccount.name}":`)
    console.log(`   - Aggiungere: €${Math.abs(amount)}`)
    await updateAccountBalance(toAccountId, Math.abs(amount), 'INCOME', { transaction: tx })
    
    return transfer
  })
  
  // Invalida cache saldo dopo creazione
  invalidateBalanceCache(userId)
  
  return result
}

export async function deleteTransfer(userId, id) {
  const transfer = await prisma.transfer.findFirst({ 
    where: { id, userId },
    include: { fromAccount: true, toAccount: true }
  })
  
  if (!transfer) throw httpError(404, 'Trasferimento non trovato')
  
  // Elimina il trasferimento e reverte i saldi in una transazione atomica
  await prisma.$transaction(async (tx) => {
    // 1. Reverte i saldi dei conti
    console.log(`🔄 CANCELLAZIONE TRASFERIMENTO - Ripristino conto mittente "${transfer.fromAccount.name}":`)
    console.log(`   - Ripristinare: €${transfer.amount}`)
    await revertAccountBalance(transfer.fromAccountId, transfer.amount, 'EXPENSE', { transaction: tx })
    
    console.log(`🔄 CANCELLAZIONE TRASFERIMENTO - Ripristino conto destinatario "${transfer.toAccount.name}":`)
    console.log(`   - Sottrarre: €${transfer.amount}`)
    await revertAccountBalance(transfer.toAccountId, transfer.amount, 'INCOME', { transaction: tx })
    
    // 2. Elimina il trasferimento
    await tx.transfer.delete({ where: { id } })
  })
  
  // Invalida cache saldo dopo cancellazione
  invalidateBalanceCache(userId)
}

export async function updateTransfer(userId, id, data) {
  const { date, amount, fromAccountId, toAccountId, note } = data
  
  console.log(`📋 DEBUG updateTransfer called:`)
  console.log(`  - userId: ${userId}`)
  console.log(`  - transferId: ${id}`)
  console.log(`  - fromAccountId: ${fromAccountId}`)
  console.log(`  - toAccountId: ${toAccountId}`)
  console.log(`  - amount: ${amount}`)
  
  // Trova il trasferimento esistente
  const existingTransfer = await prisma.transfer.findFirst({
    where: { id, userId },
    include: { fromAccount: true, toAccount: true }
  })
  
  if (!existingTransfer) throw httpError(404, 'Trasferimento non trovato')
  
  // Valida che i nuovi conti esistano e appartengano all'utente
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
    prisma.account.findFirst({ where: { id: toAccountId, userId } })
  ])
  
  if (!fromAccount) throw httpError(400, 'Conto di origine non trovato')
  if (!toAccount) throw httpError(400, 'Conto di destinazione non trovato')
  if (fromAccountId === toAccountId) throw httpError(400, 'I conti devono essere diversi')
  
  // 🎯 Determina automaticamente il nuovo tipo di trasferimento
  const transferType = determineTransferType(fromAccount, toAccount)
  console.log(`🎯 Transfer type determined: ${transferType} (${fromAccount.accountType} → ${toAccount.accountType})`)
  
  // Aggiorna il trasferimento e i saldi in una transazione atomica
  const result = await prisma.$transaction(async (tx) => {
    // 1. Reverte il trasferimento precedente
    console.log(`🔄 AGGIORNAMENTO TRASFERIMENTO - Ripristino trasferimento precedente:`)
    console.log(`   - Conto mittente precedente "${existingTransfer.fromAccount.name}": +€${existingTransfer.amount}`)
    console.log(`   - Conto destinatario precedente "${existingTransfer.toAccount.name}": -€${existingTransfer.amount}`)
    
    await revertAccountBalance(existingTransfer.fromAccountId, existingTransfer.amount, 'EXPENSE', { transaction: tx })
    await revertAccountBalance(existingTransfer.toAccountId, existingTransfer.amount, 'INCOME', { transaction: tx })
    
    // 2. Aggiorna il record Transfer
    const updatedTransfer = await tx.transfer.update({
      where: { id },
      data: {
        fromAccountId,
        toAccountId,
        amount: Math.abs(amount),
        note: note || null,
        date: new Date(date),
        transferType // 🎯 Aggiorna anche la classificazione
      },
      include: {
        fromAccount: true,
        toAccount: true
      }
    })
    
    // 3. Applica il nuovo trasferimento
    console.log(`💸 AGGIORNAMENTO TRASFERIMENTO - Applicazione nuovo trasferimento:`)
    console.log(`   - Nuovo conto mittente "${fromAccount.name}": -€${Math.abs(amount)}`)
    console.log(`   - Nuovo conto destinatario "${toAccount.name}": +€${Math.abs(amount)}`)
    
    await updateAccountBalance(fromAccountId, Math.abs(amount), 'EXPENSE', { transaction: tx })
    await updateAccountBalance(toAccountId, Math.abs(amount), 'INCOME', { transaction: tx })
    
    return updatedTransfer
  })
  
  // Invalida cache saldo dopo aggiornamento
  invalidateBalanceCache(userId)
  
  return result
}

export async function listTransfers(userId, query = {}) {
  const { year, month, limit = 200 } = query
  const where = { userId }
  
  // Filtri temporali opzionali
  if (year && month) {
    const y = Number(year)
    const m = Number(month) - 1
    const from = new Date(Date.UTC(y, m, 1))
    const to = new Date(Date.UTC(y, m + 1, 1))
    where.date = { gte: from, lt: to }
  }
  
  const transfers = await prisma.transfer.findMany({
    where,
    orderBy: { date: 'desc' },
    take: Number(limit),
    include: {
      fromAccount: true,
      toAccount: true
    }
  })
  
  console.log(`🔍 Found ${transfers.length} transfers for user ${userId}`)
  
  return { transfers }
}
