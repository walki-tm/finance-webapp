import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { 
  createBackup,
  listBackups
} from '../controllers/backupController.js'

const router = Router()

// Tutte le route richiedono autenticazione
router.use(authRequired)

// POST /api/backup - Crea backup del database
router.post('/', createBackup)

// GET /api/backup - Lista backup esistenti
router.get('/', listBackups)

export default router