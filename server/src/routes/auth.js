// routes/auth.js
import { Router } from 'express'
import { z } from 'zod'
import { registerUser, loginUser } from '../services/authService.js'

const router = Router()

const credsSchema = z.object({
  name: z.string().min(3).max(16),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

router.post('/register', async (req, res, next) => {
  try {
    const parsed = credsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
    const { name, email: rawEmail, password } = parsed.data
    const email = rawEmail.trim().toLowerCase()
    const result = await registerUser({ name, email, password })
    res.status(201).json(result)
  } catch (err) { next(err) }
})

router.post('/login', async (req, res, next) => {
  try {
    const parsed = credsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' })
    const email = parsed.data.email.trim().toLowerCase()
    const password = parsed.data.password
    const result = await loginUser({ email, password })
    res.json(result)
  } catch (err) { next(err) }
})

export default router
