import { prisma } from '../lib/prisma.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function getCategories(userId) {
  return prisma.category.findMany({
    where: { userId },
    include: { subcats: true },
    orderBy: [{ main: 'asc' }, { name: 'asc' }]
  })
}

export async function createCategory(userId, data) {
  try {
    return await prisma.category.create({ data: { userId, ...data } })
  } catch (e) {
    if (e.code === 'P2002') throw httpError(409, 'Category already exists')
    throw e
  }
}

export async function updateCategory(userId, id, data) {
  const cat = await prisma.category.findFirst({ where: { id, userId } })
  if (!cat) throw httpError(404, 'Not found')
  return prisma.category.update({ where: { id }, data })
}

export async function createSubcategory(userId, categoryId, data) {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } })
  if (!cat) throw httpError(404, 'Category not found')
  return prisma.subcategory.create({ data: { userId, categoryId, ...data } })
}

export async function updateSubcategory(userId, id, data) {
  const sub = await prisma.subcategory.findFirst({ where: { id, userId } })
  if (!sub) throw httpError(404, 'Not found')
  return prisma.subcategory.update({ where: { id }, data })
}

export async function deleteCategory(userId, id) {
  const cat = await prisma.category.findFirst({
    where: { id, userId },
    include: { subcats: { select: { id: true } } }
  })
  if (!cat) throw httpError(404, 'Not found')
  const subIds = cat.subcats.map(s => s.id)

  await prisma.$transaction(async (tx) => {
    if (subIds.length) {
      await tx.transaction.updateMany({
        where: { userId, subId: { in: subIds } },
        data: { subId: null }
      })
      await tx.subcategory.deleteMany({
        where: { userId, id: { in: subIds } }
      })
    }
    await tx.category.delete({ where: { id } })
  })
}

export async function deleteSubcategory(userId, id) {
  const sub = await prisma.subcategory.findFirst({ where: { id, userId } })
  if (!sub) throw httpError(404, 'Not found')
  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { userId, subId: id },
      data: { subId: null }
    })
    await tx.subcategory.delete({ where: { id } })
  })
}