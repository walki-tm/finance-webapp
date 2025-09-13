// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'demo@example.com'
  const password = await bcrypt.hash('demo1234', 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password, name: 'Demo User' },
  })

  // crea le 4 main più le sottocategorie come in DEFAULT_CATEGORIES (riuso la stessa lista se vuoi)
  // ... oppure lascia vuoto: ora il register fa già il seed “vero”.
}

main().finally(() => prisma.$disconnect())
