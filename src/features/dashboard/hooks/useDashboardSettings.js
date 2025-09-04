/**
 * 📄 DASHBOARD SETTINGS HOOK: Gestione stato impostazioni dashboard
 * 
 * 🎯 Scopo: Hook centralizzato per gestire visibilità categorie dashboard
 * 
 * 🔧 Dipendenze principali:
 * - React hooks (useState, useEffect, useCallback)
 * - Dashboard Category Service per API calls
 * - Toast per feedback utente
 * 
 * @author Finance WebApp Team
 * @modified 03/09/2025 - Creazione hook dashboard settings
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../toast/useToast.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useCategories } from '../../categories/useCategories.js'
import {
  getDashboardCategoriesVisibility,
  getVisibleDashboardCategories,
  updateDashboardCategoriesVisibility,
  validateCategoriesSettings
} from '../../../services/dashboardCategoryService'

/**
 * 🎯 HOOK: Gestione impostazioni categorie dashboard
 * 
 * @returns {Object} Hook state e functions
 */
export function useDashboardSettings() {
  // 🔸 Toast hook
  const { showToast } = useToast()
  
  // 🔸 Auth hook per ottenere il token
  const { token } = useAuth()
  
  // 🔸 Categories hook per ottenere le categorie reali
  const { mainsForModal, customMainCats } = useCategories(token)
  
  // 🔸 State hooks
  const [settings, setSettings] = useState([])
  const [visibleCategories, setVisibleCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // 🔸 Carica tutte le impostazioni categorie
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const settingsData = await getDashboardCategoriesVisibility(token)
      setSettings(settingsData)
    } catch (err) {
      console.error('Errore caricamento impostazioni dashboard:', err)
      setError('Errore nel caricamento delle impostazioni')
      showToast('Errore nel caricamento delle impostazioni', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [token, showToast])

  // 🔸 Carica solo categorie visibili
  const loadVisibleCategories = useCallback(async () => {
    try {
      const visibleData = await getVisibleDashboardCategories(token)
      setVisibleCategories(visibleData)
    } catch (err) {
      console.error('Errore caricamento categorie visibili:', err)
      // Non mostriamo toast per questo errore, è meno critico
    }
  }, [token])

  // 🔸 Salva impostazioni aggiornate
  const saveSettings = useCallback(async (newSettings) => {
    try {
      setIsSaving(true)
      setError(null)

      // Validazione client-side
      const validation = validateCategoriesSettings(newSettings)
      if (!validation.valid) {
        validation.errors.forEach(error => showToast(error, 'error'))
        return false
      }

      // Salva impostazioni
      const updatedSettings = await updateDashboardCategoriesVisibility(token, newSettings)
      setSettings(updatedSettings)
      
      // Ricarica categorie visibili per sincronizzare
      await loadVisibleCategories()
      
      showToast('Impostazioni salvate con successo!', 'success')
      return true
    } catch (err) {
      console.error('Errore salvataggio impostazioni:', err)
      const errorMsg = err.message || 'Errore nel salvataggio delle impostazioni'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [token, loadVisibleCategories, showToast])

  // 🔸 Aggiorna una singola categoria
  const updateCategoryVisibility = useCallback(async (categoryKey, visible) => {
    const updatedSettings = settings.map(setting => 
      setting.categoryKey === categoryKey 
        ? { ...setting, visible }
        : setting
    )
    
    return await saveSettings(updatedSettings)
  }, [settings, saveSettings])

  // 🔸 Riordina categorie per drag & drop
  const reorderCategories = useCallback(async (reorderedSettings) => {
    // Aggiorna sortOrder in base al nuovo ordine
    const settingsWithOrder = reorderedSettings.map((setting, index) => ({
      ...setting,
      sortOrder: index
    }))
    
    return await saveSettings(settingsWithOrder)
  }, [saveSettings])

  // 🔸 Reset alle impostazioni di default
  const resetToDefaults = useCallback(async () => {
    const defaultSettings = [
      { categoryKey: 'INCOME', visible: true, sortOrder: 0 },
      { categoryKey: 'EXPENSES', visible: true, sortOrder: 1 },
      { categoryKey: 'SAVINGS', visible: true, sortOrder: 2 },
      { categoryKey: 'INVESTMENTS', visible: false, sortOrder: 3 }
    ]
    
    return await saveSettings(defaultSettings)
  }, [saveSettings])

  // 🔸 Ottieni categorias disponibili (tutte le possibili categorie - reali dal database)
  const getAvailableCategories = useCallback(() => {
    // Debug: log dei dati per verificare cosa stiamo ricevendo
    console.log('mainsForModal:', mainsForModal)
    console.log('customMainCats:', customMainCats)
    
    return mainsForModal || []
  }, [mainsForModal])

  // 🔸 Caricamento iniziale
  useEffect(() => {
    loadSettings()
    loadVisibleCategories()
  }, [loadSettings, loadVisibleCategories])

  return {
    // State
    settings,
    visibleCategories,
    isLoading,
    isSaving,
    error,
    
    // Actions
    loadSettings,
    loadVisibleCategories,
    saveSettings,
    updateCategoryVisibility,
    reorderCategories,
    resetToDefaults,
    
    // Utilities
    getAvailableCategories
  }
}
