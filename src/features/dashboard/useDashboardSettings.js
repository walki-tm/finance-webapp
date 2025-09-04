/**
 * 📄 DASHBOARD SETTINGS HOOK: Gestione impostazioni categorie dashboard
 * 
 * 🎯 Scopo: Hook personalizzato per gestire visibilità e selezione categorie main
 * 
 * 🔧 Dipendenze principali:
 * - API per settings utente
 * - State management locale per settings
 * 
 * 📝 Note:
 * - Gestisce selezione max 4 categorie
 * - Supporta attivazione/disattivazione categorie
 * - Cache locale per performance
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api.js'

export default function useDashboardSettings(token) {
  // 🔸 State per impostazioni
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 🔸 Carica impostazioni utente
  const loadSettings = useCallback(async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/user-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to load settings')
      
      const data = await response.json()
      setSettings(data)
      setError(null)
    } catch (err) {
      console.error('❌ Error loading user settings:', err)
      setError(err.message)
      // Fallback a impostazioni default
      setSettings({
        dashboardSettings: {
          visibleMainCategories: ['INCOME', 'EXPENSE', 'DEBT', 'SAVINGS']
        }
      })
    } finally {
      setLoading(false)
    }
  }, [token])

  // 🔸 Carica settings all'avvio
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // 🔸 Aggiorna impostazioni dashboard
  const updateDashboardSettings = useCallback(async (newSettings) => {
    if (!token) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/user-settings/dashboard', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }
      
      const data = await response.json()
      setSettings(data.settings)
      setError(null)
      
      return data.settings
    } catch (err) {
      console.error('❌ Error updating dashboard settings:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  // 🔸 Aggiorna visibilità categoria specifica
  const updateCategoryVisibility = useCallback(async (main, visible) => {
    if (!token) return
    
    try {
      const response = await fetch('/api/user-settings/category-visibility', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ main, visible })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category visibility')
      }
      
      const data = await response.json()
      
      // Aggiorna le impostazioni locali per riflettere il cambio
      await loadSettings()
      
      return data.category
    } catch (err) {
      console.error('❌ Error updating category visibility:', err)
      setError(err.message)
      throw err
    }
  }, [token, loadSettings])

  // 🔸 Ottieni categorie visibili
  const visibleMainCategories = settings?.dashboardSettings?.visibleMainCategories || []

  // 🔸 Check se una categoria è visibile
  const isCategoryVisible = useCallback((main) => {
    return visibleMainCategories.includes(main?.toUpperCase())
  }, [visibleMainCategories])

  return {
    settings,
    loading,
    error,
    visibleMainCategories,
    isCategoryVisible,
    updateDashboardSettings,
    updateCategoryVisibility,
    refreshSettings: loadSettings
  }
}
