import { prisma } from '../lib/prisma.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function getBudgets(userId, year) {
  const startPeriod = `${year}-01`
  const endPeriod = `${year}-12`

  return prisma.budget.findMany({
    where: {
      userId,
      period: {
        gte: startPeriod,
        lte: endPeriod
      }
    },
    include: {
      subcategory: {
        select: {
          id: true,
          name: true,
          Category: {
            select: {
              main: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: [
      { main: 'asc' },
      { period: 'asc' }
    ]
  })
}

export async function upsertBudget(userId, data) {
  const { main, subcategoryId, period, amount, style = 'FIXED', ...rest } = data

  // Verify the subcategory belongs to the user if provided
  if (subcategoryId) {
    const sub = await prisma.subcategory.findFirst({
      where: { id: subcategoryId, userId },
      include: { Category: true }
    })
    if (!sub) throw httpError(404, 'Subcategory not found')
    if (sub.Category.main !== main) throw httpError(400, 'Subcategory does not match main category')
  }

  try {
    return await prisma.budget.upsert({
      where: {
        userId_main_subcategoryId_period: {
          userId,
          main,
          subcategoryId: subcategoryId || null,
          period
        }
      },
      update: {
        amount,
        style,
        ...rest,
        updatedAt: new Date()
      },
      create: {
        userId,
        main,
        subcategoryId: subcategoryId || null,
        period,
        amount,
        style,
        ...rest
      },
      include: {
        subcategory: {
          select: {
            id: true,
            name: true,
            Category: {
              select: {
                main: true,
                name: true
              }
            }
          }
        }
      }
    })
  } catch (e) {
    if (e.code === 'P2025') throw httpError(404, 'Budget not found')
    throw e
  }
}

export async function batchUpsertBudgets(userId, budgets) {
  const operations = []
  
  for (const budgetData of budgets) {
    const { main, subcategoryId, period, amount, style = 'FIXED', ...rest } = budgetData

    // Verify the subcategory belongs to the user if provided
    if (subcategoryId) {
      const sub = await prisma.subcategory.findFirst({
        where: { id: subcategoryId, userId },
        include: { Category: true }
      })
      if (!sub) throw httpError(404, `Subcategory ${subcategoryId} not found`)
      if (sub.Category.main !== main) throw httpError(400, 'Subcategory does not match main category')
    }

    operations.push(
      prisma.budget.upsert({
        where: {
          userId_main_subcategoryId_period: {
            userId,
            main,
            subcategoryId: subcategoryId || null,
            period
          }
        },
        update: {
          amount,
          style,
          ...rest,
          updatedAt: new Date()
        },
        create: {
          userId,
          main,
          subcategoryId: subcategoryId || null,
          period,
          amount,
          style,
          ...rest
        }
      })
    )
  }

  return await prisma.$transaction(operations)
}

export async function deleteBudget(userId, id) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } })
  if (!budget) throw httpError(404, 'Budget not found')
  
  return prisma.budget.delete({ where: { id } })
}

export async function getBudgetsByCategory(userId, main, year) {
  const startPeriod = `${year}-01`
  const endPeriod = `${year}-12`

  return prisma.budget.findMany({
    where: {
      userId,
      main,
      period: {
        gte: startPeriod,
        lte: endPeriod
      }
    },
    include: {
      subcategory: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { period: 'asc' },
      { subcategory: { name: 'asc' } }
    ]
  })
}
