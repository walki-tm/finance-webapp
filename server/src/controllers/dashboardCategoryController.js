import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Ottieni le impostazioni di visibilità categorie dashboard per l'utente
export const getDashboardCategoriesVisibility = async (req, res) => {
  try {
    const userId = req.user.id

    // Recupera le impostazioni dell'utente
    const visibility = await prisma.dashboardCategoryVisibility.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' }
    })

    // Se non ci sono impostazioni, crea quelle di default
    if (visibility.length === 0) {
      const defaultCategories = [
        { categoryKey: 'INCOME', visible: true, sortOrder: 0 },
        { categoryKey: 'EXPENSES', visible: true, sortOrder: 1 },
        { categoryKey: 'SAVINGS', visible: true, sortOrder: 2 }
      ]

      const createdVisibility = await prisma.$transaction(
        defaultCategories.map(category =>
          prisma.dashboardCategoryVisibility.create({
            data: {
              userId,
              ...category
            }
          })
        )
      )

      return res.json(createdVisibility)
    }

    res.json(visibility)
  } catch (error) {
    console.error('Errore nel recupero visibilità categorie dashboard:', error)
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    })
  }
}

// Aggiorna le impostazioni di visibilità categorie dashboard
export const updateDashboardCategoriesVisibility = async (req, res) => {
  try {
    const userId = req.user.id
    const { categories } = req.body

    // Validazione: massimo 4 categorie visibili
    const visibleCategories = categories.filter(cat => cat.visible)
    if (visibleCategories.length > 4) {
      return res.status(400).json({
        error: 'Massimo 4 categorie possono essere visibili contemporaneamente'
      })
    }

    // Validazione: INCOME deve sempre essere visibile (se presente)
    const incomeCategory = categories.find(cat => cat.categoryKey === 'INCOME')
    if (incomeCategory && !incomeCategory.visible) {
      return res.status(400).json({
        error: 'La categoria INCOME deve sempre essere visibile'
      })
    }

    // Aggiorna le impostazioni in transazione
    const updatedCategories = await prisma.$transaction(
      categories.map((category, index) =>
        prisma.dashboardCategoryVisibility.upsert({
          where: {
            userId_categoryKey: {
              userId,
              categoryKey: category.categoryKey
            }
          },
          update: {
            visible: category.visible,
            sortOrder: index
          },
          create: {
            userId,
            categoryKey: category.categoryKey,
            visible: category.visible,
            sortOrder: index
          }
        })
      )
    )

    res.json(updatedCategories)
  } catch (error) {
    console.error('Errore nell\'aggiornamento visibilità categorie dashboard:', error)
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    })
  }
}

// Ottieni solo le categorie visibili per la dashboard
export const getVisibleDashboardCategories = async (req, res) => {
  try {
    const userId = req.user.id

    const visibleCategories = await prisma.dashboardCategoryVisibility.findMany({
      where: { 
        userId,
        visible: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Se non ci sono categorie visibili, restituisci quelle di default
    if (visibleCategories.length === 0) {
      const defaultVisibleCategories = [
        { categoryKey: 'INCOME', visible: true, sortOrder: 0 },
        { categoryKey: 'EXPENSES', visible: true, sortOrder: 1 },
        { categoryKey: 'SAVINGS', visible: true, sortOrder: 2 }
      ]

      // Crea le impostazioni di default nel database
      await prisma.$transaction(
        defaultVisibleCategories.map(category =>
          prisma.dashboardCategoryVisibility.create({
            data: {
              userId,
              ...category
            }
          })
        )
      )

      return res.json(defaultVisibleCategories)
    }

    res.json(visibleCategories)
  } catch (error) {
    console.error('Errore nel recupero categorie visibili dashboard:', error)
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    })
  }
}

