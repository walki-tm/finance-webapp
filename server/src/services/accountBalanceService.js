/**
 * 📄 ACCOUNT BALANCE SERVICE: Gestione saldi conti
 * 
 * 🎯 Scopo: Servizio dedicato per aggiornare i saldi dei conti automaticamente
 * quando vengono materializzate transazioni di qualsiasi tipo
 * 
 * 🔧 Dipendenze principali:
 * - Prisma client per operazioni database
 * - Logica transazionale per aggiornamenti atomici
 * 
 * 📝 Note:
 * - Gestisce entrate (+) e uscite (-) sui conti
 * - Supporta transazioni, planned transactions e loans
 * - Operazioni atomiche per consistenza dati
 * - Gestione errori e validazioni
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione servizio balance management
 */

import { prisma } from '../lib/prisma.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

/**
 * 🎯 UTILITY: Determina se una transazione è un'entrata o uscita
 * 
 * @param {string} main - Categoria principale della transazione
 * @returns {boolean} True se è un'entrata (aumenta il saldo)
 */
function isIncomeTransaction(main) {
  return main?.toUpperCase() === 'INCOME'
}

/**
 * 🎯 CORE FUNCTION: Aggiorna il saldo di un conto
 * 
 * @param {string} accountId - ID del conto da aggiornare
 * @param {number} amount - Importo della transazione (sempre positivo)
 * @param {string} main - Categoria principale per determinare +/-
 * @param {Object} options - Opzioni aggiuntive
 * @param {Object} options.transaction - Transazione Prisma per operazioni atomiche
 * @returns {Promise<Object>} Account aggiornato
 */
export async function updateAccountBalance(accountId, amount, main, options = {}) {
  if (!accountId) {
    return null // Non c'è conto associato, niente da fare
  }

  // Usa transazione Prisma se fornita, altrimenti crea una nuova
  const tx = options.transaction || prisma

  try {
    // Verifica che il conto esista
    const account = await tx.account.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      throw httpError(400, `Account con ID ${accountId} non trovato`)
    }

    // Determina se è entrata (+) o uscita (-)
    const isIncome = isIncomeTransaction(main)
    const absoluteAmount = Math.abs(Number(amount))
    const balanceChange = isIncome ? absoluteAmount : -absoluteAmount
    
    console.log(`🐛 DEBUG isIncomeTransaction:`)
    console.log(`  - main category: "${main}"`)
    console.log(`  - main.toUpperCase(): "${main?.toUpperCase()}"`)
    console.log(`  - isIncome result: ${isIncome}`)

    console.log(`🏦 Aggiornamento saldo conto "${account.name}":`)
    console.log(`  - Tipo: ${isIncome ? 'ENTRATA' : 'USCITA'}`)
    console.log(`  - Importo: €${amount}`)
    console.log(`  - Variazione saldo: ${balanceChange > 0 ? '+' : ''}€${balanceChange}`)
    console.log(`  - Saldo attuale: €${Number(account.balance)}`)

    // Aggiorna il saldo
    const updatedAccount = await tx.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    })

    console.log(`  - Nuovo saldo: €${Number(updatedAccount.balance)}`)
    
    return updatedAccount
  } catch (error) {
    console.error('❌ Errore aggiornamento saldo conto:', error.message)
    throw error
  }
}

/**
 * 🎯 FUNCTION: Reverte l'aggiornamento di un saldo (per modifiche/cancellazioni)
 * 
 * @param {string} accountId - ID del conto
 * @param {number} amount - Importo originale della transazione
 * @param {string} main - Categoria principale originale
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<Object>} Account aggiornato
 */
export async function revertAccountBalance(accountId, amount, main, options = {}) {
  if (!accountId) {
    return null
  }

  // Per revertire, invertiamo la logica: entrata diventa uscita e viceversa
  const isIncome = isIncomeTransaction(main)
  const revertedMain = isIncome ? 'EXPENSE' : 'INCOME'
  
  return updateAccountBalance(accountId, amount, revertedMain, options)
}

/**
 * 🎯 FUNCTION: Gestisce la modifica di una transazione (reverte vecchio + applica nuovo)
 * 
 * @param {Object} oldTransaction - Dati della transazione precedente
 * @param {Object} newTransaction - Nuovi dati della transazione
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<void>}
 */
export async function handleTransactionUpdate(oldTransaction, newTransaction, options = {}) {
  const tx = options.transaction || prisma

  // Se non abbiamo una transazione attiva, creane una
  if (!options.transaction) {
    return prisma.$transaction(async (txClient) => {
      // 1. Reverte il saldo del vecchio conto se esisteva
      if (oldTransaction.accountId && oldTransaction.amount) {
        await revertAccountBalance(
          oldTransaction.accountId,
          oldTransaction.amount,
          oldTransaction.main,
          { transaction: txClient }
        )
      }

      // 2. Applica il saldo al nuovo conto se esiste
      if (newTransaction.accountId && newTransaction.amount) {
        await updateAccountBalance(
          newTransaction.accountId,
          newTransaction.amount,
          newTransaction.main,
          { transaction: txClient }
        )
      }
    })
  } else {
    // Usa la transazione esistente
    // 1. Reverte il saldo del vecchio conto se esisteva
    if (oldTransaction.accountId && oldTransaction.amount) {
      await revertAccountBalance(
        oldTransaction.accountId,
        oldTransaction.amount,
        oldTransaction.main,
        { transaction: tx }
      )
    }

    // 2. Applica il saldo al nuovo conto se esiste
    if (newTransaction.accountId && newTransaction.amount) {
      await updateAccountBalance(
        newTransaction.accountId,
        newTransaction.amount,
        newTransaction.main,
        { transaction: tx }
      )
    }
  }
}

/**
 * 🎯 FUNCTION: Gestisce i trasferimenti tra conti
 * 
 * @param {string} fromAccountId - Conto di origine
 * @param {string} toAccountId - Conto di destinazione
 * @param {number} amount - Importo del trasferimento
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<void>}
 */
export async function handleTransfer(fromAccountId, toAccountId, amount, options = {}) {
  if (!fromAccountId || !toAccountId) {
    throw httpError(400, 'Conti di origine e destinazione obbligatori per trasferimenti')
  }

  const tx = options.transaction || prisma

  // Se non abbiamo una transazione attiva, creane una
  if (!options.transaction) {
    return prisma.$transaction(async (txClient) => {
      // Uscita dal conto di origine
      await updateAccountBalance(fromAccountId, amount, 'EXPENSE', { transaction: txClient })
      
      // Entrata nel conto di destinazione
      await updateAccountBalance(toAccountId, amount, 'INCOME', { transaction: txClient })
      
      console.log(`🔄 Trasferimento completato: €${amount} da ${fromAccountId} a ${toAccountId}`)
    })
  } else {
    // Usa la transazione esistente
    // Uscita dal conto di origine
    await updateAccountBalance(fromAccountId, amount, 'EXPENSE', { transaction: tx })
    
    // Entrata nel conto di destinazione
    await updateAccountBalance(toAccountId, amount, 'INCOME', { transaction: tx })
    
    console.log(`🔄 Trasferimento completato: €${amount} da ${fromAccountId} a ${toAccountId}`)
  }
}

/**
 * 🎯 FUNCTION: Ricalcola il saldo di un conto basandosi su tutte le transazioni
 * 
 * @param {string} accountId - ID del conto da ricalcolare
 * @param {string} userId - ID dell'utente (per sicurezza)
 * @returns {Promise<Object>} Account con saldo ricalcolato
 */
export async function recalculateAccountBalance(accountId, userId) {
  if (!accountId || !userId) {
    throw httpError(400, 'AccountId e userId obbligatori per ricalcolo saldo')
  }

  return prisma.$transaction(async (tx) => {
    // Verifica che il conto appartenga all'utente
    const account = await tx.account.findFirst({
      where: { id: accountId, userId }
    })

    if (!account) {
      throw httpError(404, 'Conto non trovato o non autorizzato')
    }

    // Calcola il saldo basandosi su tutte le transazioni del conto
    const transactions = await tx.transaction.findMany({
      where: { accountId, userId },
      select: { amount: true, main: true }
    })

    let calculatedBalance = 0
    for (const transaction of transactions) {
      const isIncome = isIncomeTransaction(transaction.main)
      const absoluteAmount = Math.abs(Number(transaction.amount))
      const balanceChange = isIncome ? absoluteAmount : -absoluteAmount
      calculatedBalance += balanceChange
    }

    console.log(`🔧 Ricalcolo saldo conto "${account.name}":`)
    console.log(`  - Saldo precedente: €${Number(account.balance)}`)
    console.log(`  - Saldo calcolato: €${calculatedBalance}`)
    console.log(`  - Transazioni analizzate: ${transactions.length}`)

    // Aggiorna il saldo con quello calcolato
    const updatedAccount = await tx.account.update({
      where: { id: accountId },
      data: { balance: calculatedBalance }
    })

    return updatedAccount
  })
}

export default {
  updateAccountBalance,
  revertAccountBalance,
  handleTransactionUpdate,
  handleTransfer,
  recalculateAccountBalance
}
