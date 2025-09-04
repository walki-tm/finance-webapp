/**
 * 📄 DASHBOARD CATEGORY SERVICE: Gestione API categorie dashboard
 * 
 * 🎯 Scopo: Fornisce funzioni per interagire con le API di visibilità categorie dashboard
 * 
 * 🔧 Dipendenze principali:
 * - API backend endpoints /api/dashboard-categories
 * 
 * @author Finance WebApp Team
 * @modified 03/09/2025 - Creazione servizio API
 */

import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

/**
 * 🎯 API: Ottieni tutte le impostazioni di visibilità categorie dashboard
 * 
 * @param {string} token - Token di autenticazione
 * @returns {Promise<Array>} Lista delle impostazioni visibilità
 */
export const getDashboardCategoriesVisibility = async (token) => {
  return await api.getDashboardCategoriesVisibility(token)
}

/**
 * 🎯 API: Ottieni solo le categorie visibili per dashboard
 * 
 * @param {string} token - Token di autenticazione
 * @returns {Promise<Array>} Lista categorie visibili ordinate per sortOrder
 */
export const getVisibleDashboardCategories = async (token) => {
  return await api.getVisibleDashboardCategories(token)
}

/**
 * 🎯 API: Aggiorna le impostazioni di visibilità categorie dashboard
 * 
 * @param {string} token - Token di autenticazione
 * @param {Array} categories - Array di oggetti con categoryKey, visible, sortOrder
 * @returns {Promise<Array>} Impostazioni aggiornate
 */
export const updateDashboardCategoriesVisibility = async (token, categories) => {
  return await api.updateDashboardCategoriesVisibility(token, categories)
}

/**
 * 🎯 UTILITY: Valida le impostazioni categorie prima dell'invio
 * 
 * @param {Array} categories - Categorie da validare
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateCategoriesSettings = (categories) => {
  const errors = []
  
  // Controlla massimo 4 categorie visibili
  const visibleCategories = categories.filter(cat => cat.visible)
  if (visibleCategories.length > 4) {
    errors.push('Massimo 4 categorie possono essere visibili contemporaneamente')
  }
  
  // Controlla che INCOME sia sempre visibile se presente
  const incomeCategory = categories.find(cat => cat.categoryKey === 'INCOME')
  if (incomeCategory && !incomeCategory.visible) {
    errors.push('La categoria INCOME deve sempre essere visibile')
  }
  
  // Controlla che ogni categoria abbia i campi obbligatori
  categories.forEach((cat, index) => {
    if (!cat.categoryKey) {
      errors.push(`Categoria ${index + 1}: categoryKey è obbligatoria`)
    }
    if (typeof cat.visible !== 'boolean') {
      errors.push(`Categoria ${index + 1}: visible deve essere boolean`)
    }
    if (typeof cat.sortOrder !== 'number') {
      errors.push(`Categoria ${index + 1}: sortOrder deve essere number`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}
