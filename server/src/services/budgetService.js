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
    
    // ⚠️ SPECIAL CASE: Per planned transactions da prestiti, permettiamo flessibilità nella categoria
    // Se la subcategoria non corrisponde al main, proviamo ad usare la categoria della subcategoria
    if (sub.Category.main !== main) {
      // Log per debugging
      console.warn(`⚠️ Category mismatch: subcategory belongs to '${sub.Category.main}' but main is '${main}'. Using subcategory's main category.`)
      // Aggiorna il main per usare quello della sottocategoria invece di fallire
      main = sub.Category.main
    }
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
      
      // ⚠️ SPECIAL CASE: Per planned transactions da prestiti, permettiamo flessibilità nella categoria
      // Se la subcategoria non corrisponde al main, proviamo ad usare la categoria della subcategoria
      if (sub.Category.main !== budgetData.main) {
        console.warn(`⚠️ Category mismatch: subcategory belongs to '${sub.Category.main}' but main is '${budgetData.main}'. Using subcategory's main category.`)
        // Aggiorna il main per usare quello della sottocategoria
        budgetData.main = sub.Category.main
        main = sub.Category.main
      }
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

// Nuova funzione per accumulare budget invece di sovrascrivere - OTTIMIZZATA
export async function batchAccumulateBudgets(userId, budgets) {
  if (!budgets || budgets.length === 0) return []
  
  // 🚀 OTTIMIZZAZIONE 1: Batch validation delle sottocategorie
  const uniqueSubcategoryIds = [...new Set(budgets.map(b => b.subcategoryId).filter(Boolean))]
  
  let subcategoryValidation = {}
  if (uniqueSubcategoryIds.length > 0) {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        id: { in: uniqueSubcategoryIds },
        userId
      },
      include: {
        Category: {
          select: { main: true }
        }
      }
    })
    
    // Crea mappa per validazione veloce
    subcategoryValidation = subcategories.reduce((acc, sub) => {
      acc[sub.id] = sub.Category.main
      return acc
    }, {})
    
    // Valida che tutte le sottocategorie richieste esistano e correggi le categorie se necessario
    for (let i = 0; i < budgets.length; i++) {
      const budgetData = budgets[i]
      if (budgetData.subcategoryId && !subcategoryValidation[budgetData.subcategoryId]) {
        throw httpError(404, `Subcategory ${budgetData.subcategoryId} not found`)
      }
      if (budgetData.subcategoryId && subcategoryValidation[budgetData.subcategoryId] !== budgetData.main) {
        // ⚠️ SPECIAL CASE: Per planned transactions da prestiti, permettiamo flessibilità nella categoria
        console.warn(`⚠️ Category mismatch in batch: subcategory belongs to '${subcategoryValidation[budgetData.subcategoryId]}' but main is '${budgetData.main}'. Using subcategory's main category.`)
        // Correggi il main nell'array dei budget
        budgets[i] = {
          ...budgetData,
          main: subcategoryValidation[budgetData.subcategoryId]
        }
      }
    }
  }
  
  // 🚀 OTTIMIZZAZIONE 2: Batch fetch dei budget esistenti
  const budgetKeys = budgets.map(b => ({
    userId,
    main: b.main,
    subcategoryId: b.subcategoryId || null,
    period: b.period
  }))
  
  const existingBudgets = await prisma.budget.findMany({
    where: {
      userId,
      OR: budgetKeys.map(key => ({
        main: key.main,
        subcategoryId: key.subcategoryId,
        period: key.period
      }))
    }
  })
  
  // Crea mappa per lookup veloce
  const existingBudgetsMap = existingBudgets.reduce((acc, budget) => {
    const key = `${budget.main}-${budget.subcategoryId || 'null'}-${budget.period}`
    acc[key] = budget
    return acc
  }, {})
  
  // 🚀 OTTIMIZZAZIONE 3: Prepara operations senza query aggiuntive
  const operations = budgets.map(budgetData => {
    const { main, subcategoryId, period, amount, style = 'FIXED', managedAutomatically = false, ...rest } = budgetData
    
    // Lookup veloce del budget esistente
    const key = `${main}-${subcategoryId || 'null'}-${period}`
    const existingBudget = existingBudgetsMap[key]
    
    let finalAmount = amount
    if (existingBudget) {
      // Accumula con l'importo esistente
      finalAmount = parseFloat(existingBudget.amount) + parseFloat(amount)
    }

    return prisma.budget.upsert({
      where: {
        userId_main_subcategoryId_period: {
          userId,
          main,
          subcategoryId: subcategoryId || null,
          period
        }
      },
      update: {
        amount: finalAmount,
        style,
        // Solo aggiorna managedAutomatically se viene esplicitamente fornito E non è undefined
        ...(budgetData.hasOwnProperty('managedAutomatically') ? { managedAutomatically } : {}),
        ...rest,
        updatedAt: new Date()
      },
      create: {
        userId,
        main,
        subcategoryId: subcategoryId || null,
        period,
        amount: finalAmount,
        style,
        managedAutomatically: managedAutomatically || false,
        ...rest
      }
    })
  })

  // 🚀 Una singola transazione database invece di N+1 queries
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
