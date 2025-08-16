import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const router = Router()

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

router.post('/register', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const { email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'Email already registered' })

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: hash } })

  const token = jwt.sign({ uid: user.id, email }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email } })
})

router.post('/login', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ uid: user.id, email }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email } })
})

export default router
