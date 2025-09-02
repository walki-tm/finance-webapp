import { prisma } from '../lib/prisma.js'

export async function getCurrentBalance(userId) {
  const now = new Date()

  const [incomeAgg, othersAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, date: { lte: now }, main: 'INCOME' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { userId, date: { lte: now }, NOT: { main: 'INCOME' } },
      _sum: { amount: true }
    })
  ])

  const income = Number(incomeAgg._sum.amount || 0)
  const outflows = Number(othersAgg._sum.amount || 0)
  const balance = income - outflows

  return { balance, asOf: now }
}
