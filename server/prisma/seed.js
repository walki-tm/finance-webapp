import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'demo@example.com'
  const password = await bcrypt.hash('demo1234', 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password },
  })

  // sample categories
  const income = await prisma.category.create({
    data: { userId: user.id, main: 'INCOME', name: 'Salary', colorHex: '#48BFA0' }
  })
  const expenses = await prisma.category.create({
    data: { userId: user.id, main: 'EXPENSE', name: 'Groceries', colorHex: '#24B7DB' }
  })

  const sub1 = await prisma.subcategory.create({
    data: { userId: user.id, categoryId: expenses.id, name: 'Supermarket' }
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      date: new Date(),
      amount: 123.45,
      main: 'EXPENSE',
      subId: sub1.id,
      note: 'Sample',
      payee: 'Coop'
    }
  })
}

main().finally(() => prisma.$disconnect())
