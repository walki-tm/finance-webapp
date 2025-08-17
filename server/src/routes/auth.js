// routes/auth.js
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const router = Router()

const credsSchema = z.object({
  name: z.string().min(3).max(16), 
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

// MAIN + subcategorie di default (iconKey = nome file .svg in /public/icons senza estensione)
const DEFAULT_CATEGORIES = [
  {
    main: 'INCOME',
    name: 'Reddito',
    colorHex: '#48BFA0',
    iconKey: 'bank',
    subcats: [
      { name: 'Stipendio',   iconKey: 'bank'   },
      { name: 'Bonus',       iconKey: 'money'  },
      { name: 'Affitti',     iconKey: 'home'   },
      { name: 'Investimenti',iconKey: 'money2' },
      { name: 'Donazioni',   iconKey: 'gift'   },
    ],
  },
  {
    main: 'EXPENSE',
    name: 'Spese',
    colorHex: '#24B7DB',
    iconKey: 'shop2',
    subcats: [
      { name: 'Abitazione',   iconKey: 'home'  },
      { name: 'Alimentari',   iconKey: 'shop'  },
      { name: 'Trasporti',    iconKey: 'bus'   },
      { name: 'Tempo libero', iconKey: 'hobby' },
      { name: 'Abbonamenti',  iconKey: 'sheet' },
      { name: 'Shopping',     iconKey: 'shop2' },
      { name: 'Extra',        iconKey: 'other' },
    ],
  },
  {
    main: 'SAVINGS',
    name: 'Risparmi',
    colorHex: '#F5C51C',
    iconKey: 'piggybank',
    subcats: [
      { name: 'Emergenza',    iconKey: 'piggybank' },
      { name: 'Investimenti', iconKey: 'money3'    },
      { name: 'Vacanza',      iconKey: 'vacantion' }, // (nome file come da tua cartella)
    ],
  },
  {
    main: 'DEBT',
    name: 'Debiti',
    colorHex: '#ED4870',
    iconKey: 'creditcard',
    subcats: [
      { name: 'Mutuo',             iconKey: 'home'       },
      { name: 'Prestito',          iconKey: 'sheet2'     },
      { name: 'Auto',              iconKey: 'car'        },
      { name: 'Carta di Credito',  iconKey: 'creditcard' },
      { name: 'Università',        iconKey: 'college'    },
    ],
  },
]

router.post('/register', async (req, res) => {
  try {
    const parsed = credsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })

    const { name, email: rawEmail, password } = parsed.data
    const email = rawEmail.trim().toLowerCase()

    // opzionale: controlla duplicati email (e name se @unique)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, password: hash, name },   // <- PASSA name
      })

      for (const cat of DEFAULT_CATEGORIES) {
        await tx.category.create({
          data: {
            userId: u.id,
            main: cat.main,
            name: cat.name,
            iconKey: cat.iconKey || null,
            colorHex: cat.colorHex || null,
            subcats: {
              create: cat.subcats.map(sc => ({
                userId: u.id,
                name: sc.name,
                iconKey: sc.iconKey || null,
              })),
            },
          },
        })
      }

      return u
    })

    const token = jwt.sign(
      { uid: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev',
      { expiresIn: '7d' }
    )

    // includi name nella risposta se ti serve lato FE
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    // mappa violazioni unique (email o name se @unique)
    if (err?.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(',') : 'unique'
      return res.status(409).json({ error: `Duplicate ${target}` })
    }
    console.error('Register error:', err)
    res.status(500).json({ error: 'Unable to register user' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const parsed = credsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' })
    const email = parsed.data.email.trim().toLowerCase()
    const password = parsed.data.password

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { uid: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev',
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Unable to login' })
  }
})

export default router
