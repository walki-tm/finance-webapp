import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { 
  createTransferHandler, 
  deleteTransferHandler, 
  listTransfersHandler,
  updateTransferHandler 
} from '../controllers/transferController.js'

const router = Router()

// Tutte le route richiedono autenticazione
router.use(authRequired)

// POST /api/transfers - Crea un nuovo trasferimento
router.post('/', createTransferHandler)

// GET /api/transfers - Lista trasferimenti (con filtri opzionali)
router.get('/', listTransfersHandler)

// PUT /api/transfers/:id - Aggiorna un trasferimento
router.put('/:id', updateTransferHandler)

// DELETE /api/transfers/:id - Elimina un trasferimento
router.delete('/:id', deleteTransferHandler)

export default router
