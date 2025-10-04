/**
 * 📄 ACCOUNT SERVICE: Business logic gestione conti
 * 
 * 🎯 Scopo: Logica di business per operazioni sui conti utente
 * 
 * 🔧 Dipendenze principali:
 * - Prisma Client per database operations
 * - Validazione e calcoli balance
 * 
 * 📝 Note:
 * - Gestione transazioni per consistency
 * - Calcoli balance automatici
 * - Ottimizzazioni query per performance
 * - Supporto completo per tutti i tipi account
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione service accounts
 */

// 🔸 Import dependencies
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 🎯 SERVICE: Ottieni tutti i conti di un utente
 * 
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Array>} Lista conti con statistiche
 */
export async function getAccountsByUser(userId) {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: [
        { accountType: 'asc' }, // Prima per tipo
        { createdAt: 'asc' }    // Poi per data creazione
      ],
      include: {
        _count: {
          select: {
            transactions: true,
            plannedTransactions: true
          }
        }
      }
    })

    // 🔸 Arricchimento dati per frontend
    return accounts.map(account => ({
      ...account,
      balance: parseFloat(account.balance), // Converti Decimal a number
      transactionCount: account._count.transactions,
      plannedTransactionCount: account._count.plannedTransactions
    }))
  } catch (error) {
    throw new Error(`Errore recupero conti: ${error.message}`)
  }
}

/**
 * 🎯 SERVICE: Ottieni singolo conto per ID
 * 
 * @param {string} accountId - ID del conto
 * @param {string} userId - ID dell'utente (per security)
 * @returns {Promise<Object|null>} Dati del conto
 */
export async function getAccountById(accountId, userId) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId // Security: solo conti dell'utente
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10, // Ultime 10 transazioni
          select: {
            id: true,
            date: true,
            amount: true,
            main: true,
            note: true,
            payee: true
          }
        },
        _count: {
          select: {
            transactions: true,
            plannedTransactions: true
          }
        }
      }
    })

    if (!account) return null

    return {
      ...account,
      balance: parseFloat(account.balance),
      transactions: account.transactions.map(tx => ({
        ...tx,
        amount: parseFloat(tx.amount)
      })),
      transactionCount: account._count.transactions,
      plannedTransactionCount: account._count.plannedTransactions
    }
  } catch (error) {
    throw new Error(`Errore recupero conto: ${error.message}`)
  }
}

/**
 * 🎯 SERVICE: Crea nuovo conto
 * 
 * @param {Object} accountData - Dati del conto da creare
 * @returns {Promise<Object>} Conto creato
 */
export async function createAccount(accountData) {
  try {
    const account = await prisma.account.create({
      data: {
        userId: accountData.userId,
        name: accountData.name,
        accountType: accountData.accountType,
        balance: accountData.balance || 0,
        colorHex: accountData.colorHex
      }
    })

    return {
      ...account,
      balance: parseFloat(account.balance)
    }
  } catch (error) {
    throw error // Mantieni error code Prisma per gestione upstream
  }
}

/**
 * 🎯 SERVICE: Aggiorna conto esistente
 * 
 * @param {string} accountId - ID del conto
 * @param {Object} updateData - Dati da aggiornare
 * @param {string} userId - ID dell'utente (per security)
 * @returns {Promise<Object|null>} Conto aggiornato
 */
export async function updateAccount(accountId, updateData, userId) {
  try {
    // 🔸 Verifica che il conto appartenga all'utente
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    })

    if (!existingAccount) return null

    // 🔸 Aggiorna il conto
    const account = await prisma.account.update({
      where: { id: accountId },
      data: updateData
    })

    return {
      ...account,
      balance: parseFloat(account.balance)
    }
  } catch (error) {
    throw error
  }
}

/**
 * 🎯 SERVICE: Elimina conto
 * 
 * @param {string} accountId - ID del conto
 * @param {string} userId - ID dell'utente (per security)
 * @returns {Promise<boolean>} True se eliminato
 */
export async function deleteAccount(accountId, userId) {
  try {
    // 🔸 Verifica che il conto appartenga all'utente
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    })

    if (!existingAccount) return false

    // 🔸 Transazione per eliminazione sicura
    await prisma.$transaction(async (tx) => {
      // Disconnetti transazioni esistenti (set accountId to null)
      await tx.transaction.updateMany({
        where: { accountId },
        data: { accountId: null }
      })

      // Disconnetti planned transactions
      await tx.plannedTransaction.updateMany({
        where: { accountId },
        data: { accountId: null }
      })

      // Elimina il conto
      await tx.account.delete({
        where: { id: accountId }
      })
    })

    return true
  } catch (error) {
    throw new Error(`Errore eliminazione conto: ${error.message}`)
  }
}

/**
 * 🎯 SERVICE: Ottieni statistiche conti utente
 * 
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} Statistiche aggregate
 */
export async function getAccountsStats(userId) {
  try {
    const [accounts, totalTransactions] = await Promise.all([
      // Conti con balance per tipo
      prisma.account.groupBy({
        by: ['accountType'],
        where: { userId },
        _sum: { balance: true },
        _count: { id: true }
      }),

      // Totale transazioni
      prisma.transaction.count({
        where: {
          userId,
          account: { isNot: null }
        }
      })
    ])

    // 🔸 Calcola totale saldo conti correnti
    const currentAccountsBalance = accounts
      .filter(group => group.accountType === 'CURRENT')
      .reduce((sum, group) => sum + parseFloat(group._sum.balance || 0), 0)

    // 🔸 Statistiche per tipo
    const statsByType = accounts.reduce((acc, group) => {
      acc[group.accountType] = {
        count: group._count.id,
        totalBalance: parseFloat(group._sum.balance || 0)
      }
      return acc
    }, {})

    return {
      totalAccounts: accounts.reduce((sum, group) => sum + group._count.id, 0),
      currentAccountsBalance, // Usato per saldo principale app
      totalTransactionsWithAccounts: totalTransactions,
      accountsByType: statsByType
    }
  } catch (error) {
    throw new Error(`Errore calcolo statistiche: ${error.message}`)
  }
}

/**
 * 🎯 SERVICE: Ricalcola balance conto da transazioni
 * 
 * @param {string} accountId - ID del conto
 * @param {string} userId - ID dell'utente (per security)
 * @returns {Promise<Object|null>} Conto con balance aggiornato
 */
export async function recalculateBalance(accountId, userId) {
  try {
    // 🔸 Verifica che il conto appartenga all'utente
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    })

    if (!existingAccount) return null

    // 🔸 Calcola balance da transazioni (considerando entrate/uscite)
    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      select: { amount: true, main: true }
    })

    let transactionBalance = 0
    for (const transaction of transactions) {
      const isIncome = transaction.main?.toUpperCase() === 'INCOME'
      const absoluteAmount = Math.abs(Number(transaction.amount))
      const balanceChange = isIncome ? absoluteAmount : -absoluteAmount
      transactionBalance += balanceChange
    }

    // 🔸 Calcola trasferimenti (in entrata - in uscita)
    const [transfersIn, transfersOut] = await Promise.all([
      prisma.transfer.aggregate({
        where: { toAccountId: accountId },
        _sum: { amount: true }
      }),
      prisma.transfer.aggregate({
        where: { fromAccountId: accountId },
        _sum: { amount: true }
      })
    ])

    // 🔸 Calcolo balance finale
    const transfersInBalance = parseFloat(transfersIn._sum.amount || 0)
    const transfersOutBalance = parseFloat(transfersOut._sum.amount || 0)
    
    const calculatedBalance = transactionBalance + transfersInBalance - transfersOutBalance

    // 🔸 Aggiorna il conto
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { balance: calculatedBalance }
    })

    return {
      ...updatedAccount,
      balance: parseFloat(updatedAccount.balance)
    }
  } catch (error) {
    throw new Error(`Errore ricalcolo balance: ${error.message}`)
  }
}

/**
 * 🎯 SERVICE: Aggiorna balance conto dopo transazione
 * 
 * @param {string} accountId - ID del conto
 * @param {number} amount - Importo da aggiungere/sottrarre
 * @returns {Promise<Object>} Conto aggiornato
 */
export async function updateAccountBalance(accountId, amount) {
  try {
    const account = await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: amount
        }
      }
    })

    return {
      ...account,
      balance: parseFloat(account.balance)
    }
  } catch (error) {
    throw new Error(`Errore aggiornamento balance: ${error.message}`)
  }
}

// 🔸 Export service methods
export const accountService = {
  getAccountsByUser,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsStats,
  recalculateBalance,
  updateAccountBalance
}
