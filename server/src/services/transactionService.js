import { prisma } from '../lib/prisma.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function listTransactions(userId, { year, month, limit = 200 }) {
  const where = { userId }
  if (year && month) {
    const y = Number(year)
    const m = Number(month) - 1
    const from = new Date(Date.UTC(y, m, 1))
    const to = new Date(Date.UTC(y, m + 1, 1))
    where.date = { gte: from, lt: to }
  }
  return prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: Number(limit),
    include: { subcategory: true }
  })
}

async function resolveSubId(userId, subId, subName) {
  if (!subId && subName) {
    const found = await prisma.subcategory.findFirst({
      where: { userId, name: { equals: subName, mode: 'insensitive' } },
      select: { id: true }
    })
    if (found) subId = found.id
  }
  if (subId) {
    const ok = await prisma.subcategory.findFirst({ where: { id: subId, userId } })
    if (!ok) throw httpError(400, 'Invalid subId')
  }
  return subId || null
}

export async function createTransaction(userId, data) {
  const { date, amount, main, subId, subName, note, payee } = data
  const finalSubId = await resolveSubId(userId, subId, subName)
  return prisma.transaction.create({
    data: {
      userId,
      date: new Date(date),
      amount,
      main,
      subId: finalSubId,
      note: note || null,
      payee: payee || null
    },
    include: { subcategory: true }
  })
}

export async function updateTransaction(userId, id, data) {
  const exists = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')

  let { date, amount, main, subId, subName, note, payee } = data
  const finalSubId = await resolveSubId(userId, subId, subName)

  return prisma.transaction.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(typeof amount === 'number' ? { amount } : {}),
      ...(main ? { main } : {}),
      ...(finalSubId !== undefined ? { subId: finalSubId } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(payee !== undefined ? { payee } : {}),
    },
    include: { subcategory: true }
  })
}

export async function deleteTransaction(userId, id) {
  const tx = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!tx) throw httpError(404, 'Not found')
  await prisma.transaction.delete({ where: { id } })
}