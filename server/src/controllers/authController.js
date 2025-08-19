/**
 * 📄 AUTH CONTROLLER: Gestione autenticazione utenti
 * 
 * 🎯 Scopo: Gestisce login e registrazione utenti con validazione
 * 
 * 🔧 Dipendenze principali:
 * - Zod per validazione input
 * - authService per business logic
 * 
 * 📝 Note:
 * - Email viene sempre normalizzata (lowercase, trimmed)
 * - Password deve essere tra 6-100 caratteri
 * - Nome utente deve essere tra 3-16 caratteri
 * 
 * @author Finance WebApp Team
 * @modified 19 Gennaio 2025 - Aggiunta documentazione e migliorata struttura
 */

// 🔸 Import dependencies
import { z } from 'zod'

// 🔸 Import services
import { registerUser, loginUser } from '../services/authService.js'

// 🔸 Validation schemas
const registrationSchema = z.object({
  name: z.string().min(3, 'Nome deve essere almeno 3 caratteri').max(16, 'Nome non può superare 16 caratteri'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri').max(100, 'Password troppo lunga'),
})

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri').max(100, 'Password troppo lunga'),
})

/**
 * 🎯 CONTROLLER: Registrazione nuovo utente
 * 
 * Crea un nuovo account utente con validazione completa dei dati.
 * L'email viene normalizzata e controllata l'univocità.
 * 
 * @param {Request} req - Express request con { name, email, password }
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function register(req, res, next) {
  try {
    // 🔸 Validazione input
    const parsed = registrationSchema.safeParse(req.body)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message).join(', ')
      return res.status(400).json({ 
        error: 'Dati di registrazione non validi',
        details: errors
      })
    }

    // 🔸 Normalizzazione email
    const { name, email: rawEmail, password } = parsed.data
    const email = rawEmail.trim().toLowerCase()

    // 🔸 Business logic
    const result = await registerUser({ name, email, password })

    // 🔸 Risposta successo
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * 🎯 CONTROLLER: Login utente
 * 
 * Autentica un utente esistente e ritorna JWT token.
 * L'email viene normalizzata per il confronto.
 * 
 * @param {Request} req - Express request con { email, password }
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function login(req, res, next) {
  try {
    // 🔸 Validazione input
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message).join(', ')
      return res.status(400).json({ 
        error: 'Credenziali non valide',
        details: errors
      })
    }

    // 🔸 Normalizzazione email
    const { email: rawEmail, password } = parsed.data
    const email = rawEmail.trim().toLowerCase()

    // 🔸 Business logic
    const result = await loginUser({ email, password })

    // 🔸 Risposta successo
    res.json(result)
  } catch (err) {
    next(err)
  }
}
