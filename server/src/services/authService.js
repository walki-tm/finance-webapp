import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

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
      { name: 'Vacanza',      iconKey: 'vacantion' },
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

export async function registerUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw httpError(409, 'Email already registered')

  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { email, password: hash, name },
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

  return { token, user: { id: user.id, email: user.email, name: user.name, theme: user.theme } }
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw httpError(401, 'Invalid credentials')
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw httpError(401, 'Invalid credentials')

  const token = jwt.sign(
    { uid: user.id, email: user.email },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '7d' }
  )

  return { token, user: { id: user.id, email: user.email, name: user.name, theme: user.theme } }
}