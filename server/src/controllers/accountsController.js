/**
 * 📄 ACCOUNTS CONTROLLER: Gestione conti utente
 * 
 * 🎯 Scopo: Gestisce le richieste HTTP per operazioni CRUD sui conti
 * 
 * 🔧 Dipendenze principali:
 * - Prisma ORM per database operations
 * - Zod per validazione input
 * - accountService per business logic
 * 
 * 📝 Note:
 * - Supporta tutti i tipi di account (CURRENT, INVESTMENTS, SAVINGS, POCKET)
 * - Calcolo balance automatico
 * - Validazione completa input
 * - Gestione errori centralizzata
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione controller accounts
 */

// 🔸 Import dependencies
import { z } from 'zod'
import { accountService } from '../services/accountService.js'
import { recalculateAccountBalance as recalculateAccountBalanceService } from '../services/accountBalanceService.js'

// 🔸 Validation schemas
const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome conto richiesto').max(100, 'Nome troppo lungo'),
  accountType: z.enum(['CURRENT', 'INVESTMENTS', 'SAVINGS', 'POCKET'], {
    errorMap: () => ({ message: 'Tipo conto non valido' })
  }),
  balance: z.number().or(z.string().transform(val => parseFloat(val))).default(0),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Colore deve essere hex valido (#RRGGBB)')
})

const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().cuid('ID conto non valido')
})

const accountIdSchema = z.object({
  id: z.string().cuid('ID conto non valido')
})

/**
 * 🎯 CONTROLLER: Ottieni tutti i conti dell'utente
 */
export async function getAccounts(req, res, next) {
  try {
    // 🔸 Estrai userId dal token JWT
    const userId = req.user.id
    
    // 🔸 Ottieni conti dal service
    const accounts = await accountService.getAccountsByUser(userId)
    
    // 🔸 Response
    res.json(accounts)
  } catch (error) {
    next(error)
  }
}

/**
 * 🎯 CONTROLLER: Ottieni singolo conto per ID
 */
export async function getAccountById(req, res, next) {
  try {
    // 🔸 Validazione parametri
    const { id } = accountIdSchema.parse(req.params)
    const userId = req.user.id
    
    // 🔸 Ottieni conto dal service
    const account = await accountService.getAccountById(id, userId)
    
    if (!account) {
      return res.status(404).json({ error: 'Conto non trovato' })
    }
    
    // 🔸 Response
    res.json(account)
  } catch (error) {
    next(error)
  }
}

/**
 * 🎯 CONTROLLER: Crea nuovo conto
 */
export async function createAccount(req, res, next) {
  try {
    // 🔸 Validazione input
    const validatedData = createAccountSchema.parse(req.body)
    const userId = req.user.id
    
    // 🔸 Crea conto tramite service
    const account = await accountService.createAccount({
      ...validatedData,
      userId
    })
    
    // 🔸 Response
    res.status(201).json(account)
  } catch (error) {
    // 🔸 Gestione errori specifici
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Esiste già un conto con questo nome' 
      })
    }
    next(error)
  }
}

/**
 * 🎯 CONTROLLER: Aggiorna conto esistente
 */
export async function updateAccount(req, res, next) {
  try {
    // 🔸 Validazione input
    const { id, ...updateData } = updateAccountSchema.parse({
      id: req.params.id,
      ...req.body
    })
    const userId = req.user.id
    
    // 🔸 Aggiorna conto tramite service
    const account = await accountService.updateAccount(id, updateData, userId)
    
    if (!account) {
      return res.status(404).json({ error: 'Conto non trovato' })
    }
    
    // 🔸 Response
    res.json(account)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Esiste già un conto con questo nome' 
      })
    }
    next(error)
  }
}

/**
 * 🎯 CONTROLLER: Elimina conto
 */
export async function deleteAccount(req, res, next) {
  try {
    // 🔸 Validazione parametri
    const { id } = accountIdSchema.parse(req.params)
    const userId = req.user.id
    
    // 🔸 Elimina conto tramite service
    const deleted = await accountService.deleteAccount(id, userId)
    
    if (!deleted) {
      return res.status(404).json({ error: 'Conto non trovato' })
    }
    
    // 🔸 Response
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

/**
 * 🎯 CONTROLLER: Ottieni statistiche conti
 */
export async function getAccountsStats(req, res, next) {
  try {
    // 🔸 Estrai userId dal token JWT
    const userId = req.user.id
    
    // 🔸 Ottieni statistiche dal service
    const stats = await accountService.getAccountsStats(userId)
    
    // 🔸 Response
    res.json(stats)
  } catch (error) {
    next(error)
  }
}

/**
 * 🎯 CONTROLLER: Ricalcola balance di un conto
 */
export async function recalculateAccountBalance(req, res, next) {
  try {
    // 🔸 Validazione parametri
    const { id } = accountIdSchema.parse(req.params)
    const userId = req.user.id
    
    // 🔸 Ricalcola balance tramite service corretto (considera entrate/uscite)
    const account = await recalculateAccountBalanceService(id, userId)
    
    if (!account) {
      return res.status(404).json({ error: 'Conto non trovato' })
    }
    
    // 🔸 Response
    res.json(account)
  } catch (error) {
    next(error)
  }
}
