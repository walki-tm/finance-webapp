import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { fetchBalance } from '../controllers/balanceController.js'

const router = Router()
router.use(authRequired)

router.get('/', fetchBalance)

export default router
