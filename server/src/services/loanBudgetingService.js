/**
 * 📄 LOAN BUDGETING SERVICE: Integrazione prestiti con budgeting
 * 
 * 🎯 Scopo: Gestisce l'integrazione automatica tra prestiti e sistema budgeting
 * includendo auto-generazione planned transactions e aggiornamento budget.
 * 
 * 🔧 Dipendenze principali:
 * - Prisma per accesso database
 * - PlannedTransactionService per gestione transazioni pianificate
 * - Budget service esistente per aggiornamento budget
 * 
 * 📝 Note:
 * - Mantiene sincronizzazione bidirezionale prestiti <-> budgeting
 * - Gestisce rate come planned transactions ricorrenti
 * - Aggiorna automaticamente budget al pagamento rate
 * - Supporta notifiche scadenze
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale integrazione prestiti-budgeting
 */

import { PrismaClient } from '@prisma/client'
import { 
  createPlannedTransaction, 
  updatePlannedTransaction,
  deletePlannedTransaction 
} from './plannedTransactionService.js'

const prisma = new PrismaClient()

// =============================================================================
// 🔧 UTILITY FUNCTIONS
// =============================================================================

/**
 * 🔧 Calcola categoria per planned transaction rate prestito
 * 
 * ⚠️ IMPORTANTE: Questa funzione deve assicurarsi che la categoria main
 * sia coerente con la sottocategoria selezionata
 */
function getLoanPaymentCategory(loan) {
  // Se il prestito ha una sottocategoria specifica, usa quella categoria
  if (loan.subcategoryId) {
    // La categoria main verrà determinata dal budgetService quando si valida la sottocategoria
    // Non impostiamo un main fisso qui per evitare conflitti
    return {
      main: loan.categoryMain || 'DEBT', // Valore predefinito che può essere corretto
      subId: loan.subcategoryId
    }
  }

  // Se il prestito ha solo una categoria specifica senza sottocategoria, usala
  if (loan.categoryMain) {
    return {
      main: loan.categoryMain,
      subId: null // Nessuna sottocategoria
    }
  }

  // Altrimenti usa categorie predefinite per tipo prestito
  const categoryMapping = {
    'MORTGAGE': 'DEBT', // Categoria debiti per mutui
    'PERSONAL_LOAN': 'EXPENSE', // Categoria spese per prestiti personali
    'AUTO_LOAN': 'DEBT', // Prestiti auto come debiti
    'OTHER': 'DEBT' // Altri prestiti come debiti
  }

  return {
    main: categoryMapping[loan.loanType] || 'DEBT',
    subId: null
  }
}

/**
 * 🔧 Genera titolo per planned transaction rate
 */
function generateLoanPaymentTitle(loan) {
  const typeLabel = loan.loanType === 'MORTGAGE' ? 'Mutuo' : 'Prestito'
  return `Rata ${typeLabel} - ${loan.name}`
}

/**
 * 🔧 Calcola prossima data scadenza rata (OTTIMIZZATO)
 */
function calculateNextPaymentDate(loan) {
  // Con il nuovo schema ottimizzato, usiamo direttamente nextPaymentDate
  return new Date(loan.nextPaymentDate)
}

// =============================================================================
// 🎯 MAIN INTEGRATION FUNCTIONS
// =============================================================================

/**
 * 🎯 Crea planned transaction per rate prestito
 * 
 * Chiamata automaticamente quando si crea un nuovo prestito
 */
export async function createLoanPaymentPlan(userId, loan) {
  try {
    console.log(`📊 Creating payment plan for loan: ${loan.name}`)

    // Non creare se disabilitato
    if (!loan.autoCreatePayments) {
      console.log('⏭️ Auto payment creation disabled, skipping')
      return null
    }

    const category = getLoanPaymentCategory(loan)
    const title = generateLoanPaymentTitle(loan)
    const nextPaymentDate = calculateNextPaymentDate(loan)

    // Mappa frequenza pagamento prestito a frequenza planned transaction
    const frequencyMapping = {
      'MONTHLY': 'MONTHLY',
      'QUARTERLY': 'QUARTERLY', // Potrebbe non essere supportato, fallback a MONTHLY
      'SEMIANNUAL': 'SEMIANNUAL' // Potrebbe non essere supportato, fallback a MONTHLY
    }

    const frequency = frequencyMapping[loan.paymentFrequency] || 'MONTHLY'

    const plannedTransactionData = {
      title,
      main: category.main,
      subId: category.subId,
      accountId: loan.accountId, // 🏦 Account associato al prestito per le rate
      amount: parseFloat(loan.monthlyPayment),
      note: `Rate automatiche per ${loan.name} presso ${loan.lenderName}`,
      payee: loan.lenderName,
      frequency,
      startDate: nextPaymentDate, // Usa la data calcolata dinamicamente
      confirmationMode: 'AUTOMATIC', // ✅ AUTOMATICO per prestiti - verranno auto-materializzate se in scadenza
      groupId: null, // Potremmo creare un gruppo "Prestiti" in futuro
      appliedToBudget: false, // L'utente può scegliere se applicare al budgeting
      loanId: loan.id // Collegamento diretto al prestito
    }
    
    console.log('🏦 DEBUG: Creating planned transaction for loan:', loan.id)
    console.log('📅 Start date:', nextPaymentDate, 'ISO:', nextPaymentDate.toISOString())
    console.log('💰 Monthly payment amount:', parseFloat(loan.monthlyPayment))
    console.log('🏦 Account ID:', loan.accountId)
    console.log('🔄 Frequency: MONTHLY')
    console.log('⚡ Confirmation mode: AUTOMATIC')

    // Crea la planned transaction
    const plannedTransaction = await createPlannedTransaction(userId, plannedTransactionData)

    console.log(`✅ Payment plan created successfully: ${plannedTransaction.id}`)
    return plannedTransaction

  } catch (error) {
    console.error('❌ Error creating loan payment plan:', error)
    throw new Error(`Failed to create payment plan: ${error.message}`)
  }
}

/**
 * 🎯 Aggiorna planned transaction quando il prestito cambia
 * 
 * Chiamata quando vengono modificati parametri del prestito
 */
export async function updateLoanPaymentPlan(userId, loan, changes) {
  try {
    console.log(`🔄 Updating payment plan for loan: ${loan.name}`)

    // Trova la planned transaction collegata
    const plannedTx = await prisma.plannedTransaction.findFirst({
      where: { 
        loanId: loan.id,
        userId 
      }
    })

    if (!plannedTx) {
      console.log('⚠️ No existing payment plan found, creating new one')
      return await createLoanPaymentPlan(userId, loan)
    }

    // Determina cosa aggiornare
    const updates = {}

    // Se è cambiato il nome del prestito, aggiorna il titolo
    if (changes.name || changes.loanType) {
      updates.title = generateLoanPaymentTitle(loan)
    }

    // Se è cambiata la rata mensile, aggiorna l'importo
    if (changes.monthlyPayment) {
      updates.amount = parseFloat(loan.monthlyPayment)
    }

    // Se è cambiata la categoria, aggiorna
    if (changes.categoryMain || changes.subcategoryId) {
      const category = getLoanPaymentCategory(loan)
      updates.main = category.main
      updates.subId = category.subId
    }

    // Se è cambiato l'account associato, aggiorna
    if (changes.accountId !== undefined) {
      updates.accountId = loan.accountId
    }

    // Se è cambiata la frequenza di pagamento
    if (changes.paymentFrequency) {
      const frequencyMapping = {
        'MONTHLY': 'MONTHLY',
        'QUARTERLY': 'MONTHLY', // Fallback
        'SEMIANNUAL': 'MONTHLY'  // Fallback
      }
      updates.frequency = frequencyMapping[loan.paymentFrequency] || 'MONTHLY'
    }

    // Se è cambiata la data prima rata
    if (changes.firstPaymentDate) {
      updates.startDate = loan.firstPaymentDate
    }

    // Se è cambiata l'autoCreazione
    if (changes.autoCreatePayments === false) {
      // Disabilita la planned transaction
      updates.isActive = false
    } else if (changes.autoCreatePayments === true) {
      // Riabilita la planned transaction
      updates.isActive = true
    }

    // Applica gli aggiornamenti se ce ne sono
    if (Object.keys(updates).length > 0) {
      const updatedPlannedTx = await updatePlannedTransaction(userId, plannedTx.id, updates)
      console.log(`✅ Payment plan updated successfully`)
      return updatedPlannedTx
    } else {
      console.log('ℹ️ No updates needed for payment plan')
      return plannedTx
    }

  } catch (error) {
    console.error('❌ Error updating loan payment plan:', error)
    throw new Error(`Failed to update payment plan: ${error.message}`)
  }
}

/**
 * 🎯 Elimina planned transaction quando si elimina il prestito
 * 
 * Chiamata automaticamente quando si elimina un prestito
 */
export async function deleteLoanPaymentPlan(userId, loanId) {
  try {
    console.log(`🗑️ Deleting payment plan for loan: ${loanId}`)

    // Trova tutte le planned transactions collegate al prestito
    const plannedTxs = await prisma.plannedTransaction.findMany({
      where: { 
        loanId: loanId,
        userId 
      }
    })

    if (plannedTxs.length === 0) {
      console.log('ℹ️ No payment plan found to delete')
      return
    }

    // Elimina tutte le planned transactions collegate
    const deletePromises = plannedTxs.map(tx => 
      deletePlannedTransaction(userId, tx.id)
    )

    await Promise.all(deletePromises)

    console.log(`✅ Deleted ${plannedTxs.length} payment plan(s)`)

  } catch (error) {
    console.error('❌ Error deleting loan payment plan:', error)
    throw new Error(`Failed to delete payment plan: ${error.message}`)
  }
}

/**
 * 🎯 Sincronizza stato prestito con planned transaction
 * 
 * Chiamata dopo operazioni come registrazione pagamenti
 */
export async function syncLoanWithPaymentPlan(userId, loanId) {
  try {
    console.log(`🔄 Syncing loan with payment plan: ${loanId}`)

    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId }
    })

    if (!loan) {
      throw new Error('Loan not found')
    }

    const plannedTx = await prisma.plannedTransaction.findFirst({
      where: { loanId, userId }
    })

    if (!plannedTx) {
      console.log('ℹ️ No payment plan to sync')
      return
    }

    const updates = {}

    // Aggiorna importo se diverso
    if (parseFloat(plannedTx.amount) !== parseFloat(loan.monthlyPayment)) {
      updates.amount = parseFloat(loan.monthlyPayment)
    }

    // Disattiva se prestito estinto
    if (loan.status === 'PAID_OFF' && plannedTx.isActive) {
      updates.isActive = false
    }

    // Riattiva se prestito torna attivo
    if (loan.status === 'ACTIVE' && !plannedTx.isActive && loan.autoCreatePayments) {
      updates.isActive = true
    }

    // 🆕 NUOVO OTTIMIZZATO: Usa direttamente nextPaymentDate dal prestito
    // Con il nuovo schema ottimizzato, non abbiamo più rate pre-generate
    const currentNextDueDate = new Date(plannedTx.nextDueDate)
    const loanNextDueDate = new Date(loan.nextPaymentDate)
    
    console.log(`📅 Date comparison (optimized):`, {
      currentNextDueDate: currentNextDueDate.toISOString(),
      loanNextDueDate: loanNextDueDate.toISOString(),
      areEqual: currentNextDueDate.getTime() === loanNextDueDate.getTime()
    })
    
    // Aggiorna solo se le date sono diverse (evita aggiornamenti inutili)
    if (currentNextDueDate.getTime() !== loanNextDueDate.getTime()) {
      updates.nextDueDate = loanNextDueDate
      console.log(`📅 Updating nextDueDate from ${currentNextDueDate.toISOString()} to ${loanNextDueDate.toISOString()}`)
    }

    // Applica aggiornamenti se necessari
    if (Object.keys(updates).length > 0) {
      await updatePlannedTransaction(userId, plannedTx.id, updates)
      console.log('✅ Payment plan synced successfully')
    } else {
      console.log('ℹ️ Payment plan already in sync')
    }

  } catch (error) {
    console.error('❌ Error syncing loan with payment plan:', error)
    // Non lanciamo errore qui per non bloccare altre operazioni
  }
}

/**
 * 🎯 Ottieni informazioni su planned transactions collegate ai prestiti
 */
export async function getLoanPaymentPlans(userId, loanIds = []) {
  try {
    const where = {
      userId,
      loanId: { not: null }
    }

    if (loanIds.length > 0) {
      where.loanId = { in: loanIds }
    }

    const paymentPlans = await prisma.plannedTransaction.findMany({
      where,
      include: {
        loan: true,
        subcategory: true
      },
      orderBy: {
        nextDueDate: 'asc'
      }
    })

    return paymentPlans

  } catch (error) {
    console.error('❌ Error fetching loan payment plans:', error)
    throw new Error('Failed to fetch loan payment plans')
  }
}

/**
 * 🎯 Verifica e aggiorna automaticamente le planned transactions dei prestiti
 * 
 * Funzione di manutenzione da chiamare periodicamente
 */
export async function maintainLoanPaymentPlans(userId) {
  try {
    console.log(`🔧 Maintaining loan payment plans for user: ${userId}`)

    // Trova tutti i prestiti attivi dell'utente
    const activeLoans = await prisma.loan.findMany({
      where: { 
        userId,
        status: 'ACTIVE',
        autoCreatePayments: true
      }
    })

    // Trova tutte le planned transactions per prestiti
    const existingPlans = await prisma.plannedTransaction.findMany({
      where: {
        userId,
        loanId: { not: null }
      }
    })

    let created = 0
    let updated = 0
    let deleted = 0

    // Crea planned transactions mancanti
    for (const loan of activeLoans) {
      const existingPlan = existingPlans.find(p => p.loanId === loan.id)
      
      if (!existingPlan) {
        await createLoanPaymentPlan(userId, loan)
        created++
      }
    }

    // Elimina planned transactions orfane (prestiti eliminati/disabilitati)
    for (const plan of existingPlans) {
      const correspondingLoan = activeLoans.find(l => l.id === plan.loanId)
      
      if (!correspondingLoan) {
        await deletePlannedTransaction(userId, plan.id)
        deleted++
      } else {
        // Sincronizza se necessario
        await syncLoanWithPaymentPlan(userId, plan.loanId)
        updated++
      }
    }

    console.log(`✅ Maintenance completed: ${created} created, ${updated} updated, ${deleted} deleted`)

    return {
      created,
      updated,
      deleted
    }

  } catch (error) {
    console.error('❌ Error maintaining loan payment plans:', error)
    throw new Error('Failed to maintain loan payment plans')
  }
}
