import { prisma } from '../lib/prisma.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function getCategories(userId) {
  return prisma.category.findMany({
    where: { userId },
    include: {
      subcats: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }
    },
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

export async function reorderSubcategories(userId, items) {
  await prisma.$transaction(async (tx) => {
    for (const it of items) {
      const sub = await tx.subcategory.findFirst({ where: { id: it.id, userId } })
      if (!sub) throw httpError(404, 'Subcategory not found')
      await tx.subcategory.update({
        where: { id: it.id },
        data: { sortOrder: it.sortOrder }
      })
    }
  })
  return true
}

export async function deleteCategory(userId, id) {
  const cat = await prisma.category.findFirst({
    where: { id, userId },
    include: { subcats: { select: { id: true, name: true } } }
  })
  if (!cat) throw httpError(404, 'Not found')
  const subIds = cat.subcats.map(s => s.id)

  // 🔥 NUOVO: Controlla se ci sono transazioni collegate a qualsiasi sottocategoria
  if (subIds.length > 0) {
    const transactionCount = await prisma.transaction.count({
      where: { userId, subId: { in: subIds } }
    })
    
    if (transactionCount > 0) {
      const error = httpError(409, 'Cannot delete category with existing transactions in subcategories')
      error.transactionCount = transactionCount
      error.categoryId = id
      error.subcategoryIds = subIds
      throw error
    }
  }

  // Se non ci sono transazioni, procedi con l'eliminazione
  await prisma.$transaction(async (tx) => {
    if (subIds.length) {
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
  
  // 🔥 NUOVO: Controlla se ci sono transazioni collegate
  const transactionCount = await prisma.transaction.count({
    where: { userId, subId: id }
  })
  
  if (transactionCount > 0) {
    const error = httpError(409, 'Cannot delete subcategory with existing transactions')
    error.transactionCount = transactionCount
    error.subcategoryId = id
    throw error
  }
  
  // Se non ci sono transazioni, procedi con l'eliminazione
  await prisma.subcategory.delete({ where: { id } })
}

/**
 * 🎯 SERVICE: Aggiorna visibilità categoria per dashboard
 */
export async function updateCategoryVisibility(userId, main, visible) {
  // Cerca tutte le categorie con lo stesso main per questo utente
  const categories = await prisma.category.findMany({
    where: { userId, main: main.toUpperCase() }
  })
  
  if (categories.length === 0) {
    throw httpError(404, `Categoria ${main} non trovata`)
  }
  
  // Aggiorna tutte le categorie con lo stesso main
  await prisma.category.updateMany({
    where: { userId, main: main.toUpperCase() },
    data: { visible }
  })
  
  // Ritorna le categorie aggiornate
  return prisma.category.findMany({
    where: { userId, main: main.toUpperCase() },
    include: {
      subcats: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }
    }
  })
}

/**
 * 🎯 SERVICE: Trasferisce tutte le transazioni da una sottocategoria ad un'altra (BATCH)
 * 
 * Questa funzione sposta tutte le transazioni da una sottocategoria di origine
 * ad una sottocategoria di destinazione in una singola transazione atomica.
 * 
 * @param {string} userId - ID utente proprietario delle categorie
 * @param {string} sourceSubcategoryId - ID sottocategoria di origine
 * @param {string} targetSubcategoryId - ID sottocategoria di destinazione
 * @returns {Promise<{transferred: number, source: object, target: object}>}
 */
export async function transferTransactionsBatch(userId, sourceSubcategoryId, targetSubcategoryId) {
  // 🔸 Validazione: IDs diversi
  if (sourceSubcategoryId === targetSubcategoryId) {
    throw httpError(400, 'Source and target subcategories must be different')
  }
  
  // 🔸 Verifica che le sottocategorie esistano e appartengano all'utente
  const sourceSubcat = await prisma.subcategory.findFirst({
    where: { id: sourceSubcategoryId, userId },
    include: { Category: true }
  })
  
  if (!sourceSubcat) {
    throw httpError(404, 'Source subcategory not found')
  }
  
  const targetSubcat = await prisma.subcategory.findFirst({
    where: { id: targetSubcategoryId, userId },
    include: { Category: true }
  })
  
  if (!targetSubcat) {
    throw httpError(404, 'Target subcategory not found')
  }
  
  // 🔸 Conta le transazioni da trasferire
  const transactionCount = await prisma.transaction.count({
    where: { userId, subId: sourceSubcategoryId }
  })
  
  if (transactionCount === 0) {
    throw httpError(400, 'No transactions to transfer')
  }
  
  // 🔸 Esegui il trasferimento in una transazione atomica
  const result = await prisma.$transaction(async (tx) => {
    // Aggiorna tutte le transazioni
    await tx.transaction.updateMany({
      where: { userId, subId: sourceSubcategoryId },
      data: { 
        subId: targetSubcategoryId,
        main: targetSubcat.Category.main // Aggiorna anche la main category se diversa
      }
    })
    
    // Aggiorna anche le planned transactions se esistono
    const plannedCount = await tx.plannedTransaction.count({
      where: { userId, subId: sourceSubcategoryId }
    })
    
    if (plannedCount > 0) {
      await tx.plannedTransaction.updateMany({
        where: { userId, subId: sourceSubcategoryId },
        data: { 
          subId: targetSubcategoryId,
          main: targetSubcat.Category.main
        }
      })
    }
    
    return {
      transferred: transactionCount,
      plannedTransferred: plannedCount,
      source: sourceSubcat,
      target: targetSubcat
    }
  })
  
  return result
}
