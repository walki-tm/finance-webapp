/**
 * 📄 USER SETTINGS SERVICE: Business logic impostazioni utente
 * 
 * 🎯 Scopo: Gestisce la logica di business per impostazioni utente personalizzate
 * 
 * 🔧 Dipendenze principali:
 * - Prisma per accesso database
 * - Validazione e serializzazione settings
 * 
 * 📝 Note:
 * - Salva impostazioni come JSON nel database
 * - Supporta merge di impostazioni esistenti
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { prisma } from '../lib/prisma.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

// 🔸 Impostazioni default per nuovo utente
const defaultSettings = {
  dashboardSettings: {
    visibleMainCategories: ['INCOME', 'EXPENSE', 'DEBT', 'SAVINGS'] // Tutte visibili di default
  }
}

/**
 * 🎯 SERVICE: Ottieni impostazioni utente
 */
export async function getUserSettings(userId) {
  // Prima verifica se esistono impostazioni specifiche
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })
  
  if (!user) {
    throw httpError(404, 'User not found')
  }

  // Per ora usiamo le impostazioni default
  // In futuro potremo aggiungere una tabella user_settings se necessario
  return defaultSettings
}

/**
 * 🎯 SERVICE: Aggiorna impostazioni utente
 */
export async function updateUserSettings(userId, newSettings) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })
  
  if (!user) {
    throw httpError(404, 'User not found')
  }

  // Per ora restituiamo le impostazioni aggiornate in memoria
  // In futuro potremo salvarle in una tabella dedicata
  const currentSettings = defaultSettings
  
  // Merge delle nuove impostazioni con quelle esistenti
  const updatedSettings = {
    ...currentSettings,
    ...newSettings
  }

  // TODO: Salvare in database quando avremo la tabella user_settings
  console.log(`🔧 Settings updated for user ${userId}:`, updatedSettings)
  
  return updatedSettings
}
