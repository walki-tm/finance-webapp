/**
 * 📄 CATEGORY SETTINGS MODAL: Modal per impostazioni categorie dashboard
 * 
 * 🎯 Scopo: Modal per selezionare quali categorie main visualizzare nel dashboard
 * 
 * 🔧 Dipendenze principali:
 * - useDashboardSettings per state management
 * - useCategories per categorie disponibili
 * - Toast per feedback utente
 * 
 * 📝 Note:
 * - Limita selezione a massimo 4 categorie
 * - INCOME è sempre incluso e non disattivabile
 * - Supporta switch per attivazione/disattivazione
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, Button, Switch } from '../../ui'
import { useAuth } from '../../../context/AuthContext.jsx'
import { X, Settings, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../../toast/useToast.js'
import { useDashboardSettings } from '../hooks/useDashboardSettings.js'

export default function CategorySettingsModal({ isOpen, onClose }) {
  const { showToast } = useToast()
  const { 
    settings,
    visibleCategories,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateCategoryVisibility,
    getAvailableCategories
  } = useDashboardSettings()

  // 🔸 Ottieni le categorie disponibili reali
  const availableCategories = getAvailableCategories()
  
  // Debug: log delle categorie disponibili
  console.log('CategorySettingsModal - availableCategories:', availableCategories)
  
  // 🔸 State locale per modifiche
  const [selectedCategories, setSelectedCategories] = useState([])
  const [categoryVisibility, setCategoryVisibility] = useState({})

  // 🔸 Inizializza state quando cambiano le impostazioni
  useEffect(() => {
    if (settings?.length > 0) {
      const visibleKeys = settings.filter(s => s.visible).map(s => s.categoryKey.toUpperCase())
      setSelectedCategories(visibleKeys)
    }
    
    // Inizializza visibilità categorie dalle categorie disponibili
    if (availableCategories?.length > 0) {
      const visibility = {}
      availableCategories.forEach(cat => {
        visibility[cat.key.toUpperCase()] = cat.enabled !== false
      })
      setCategoryVisibility(visibility)
    }
  }, [settings, availableCategories])

  // 🔸 Toggle selezione categoria per dashboard
  const handleCategoryToggle = (categoryKey) => {
    const categoryUpper = categoryKey.toUpperCase()
    
    // INCOME non può essere deselezionato
    if (categoryUpper === 'INCOME') return
    
    setSelectedCategories(prev => {
      if (prev.includes(categoryUpper)) {
        return prev.filter(key => key !== categoryUpper)
      } else {
        if (prev.length >= 4) {
          showToast('Puoi selezionare massimo 4 categorie', 'error')
          return prev
        }
        return [...prev, categoryUpper]
      }
    })
  }

  // 🔸 Toggle visibilità categoria in generale
  const handleVisibilityToggle = async (categoryKey) => {
    const categoryUpper = categoryKey.toUpperCase()
    const newVisibility = !categoryVisibility[categoryUpper]
    
    try {
      await updateCategoryVisibility(categoryUpper, newVisibility)
      setCategoryVisibility(prev => ({
        ...prev,
        [categoryUpper]: newVisibility
      }))
      
      showToast(`Categoria ${newVisibility ? 'attivata' : 'disattivata'}`, 'success')
    } catch (error) {
      showToast('Errore aggiornando visibilità categoria', 'error')
    }
  }

  // 🔸 Salva impostazioni
  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      showToast('Devi selezionare almeno una categoria', 'error')
      return
    }

    try {
      // Crea il nuovo settings array con le categorie selezionate
      const newSettings = availableCategories.map((category, index) => ({
        categoryKey: category.key.toUpperCase(),
        visible: selectedCategories.includes(category.key.toUpperCase()),
        sortOrder: index
      }))
      
      const success = await saveSettings(newSettings)
      if (success) {
        showToast('Impostazioni salvate con successo', 'success')
        onClose()
      }
    } catch (error) {
      showToast('Errore salvando impostazioni', 'error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Impostazioni Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sezione visibilità generale categorie */}
          <div>
            <h3 className="text-lg font-medium mb-4">Visibilità Categorie</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Attiva o disattiva le categorie nell'intera applicazione. Le categorie disattivate non saranno mostrate in nessun tab.
            </p>
            
            <div className="space-y-3">
              {availableCategories.map(category => (
                <div key={category.key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {categoryVisibility[category.key.toUpperCase()] ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    )}
                    <Switch
                      checked={categoryVisibility[category.key.toUpperCase()] || false}
                      onCheckedChange={() => handleVisibilityToggle(category.key)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Categorie Dashboard</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Seleziona massimo 4 categorie da visualizzare nelle cards del dashboard. INCOME è sempre incluso.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {availableCategories.filter(category => categoryVisibility[category.key.toUpperCase()]).map(category => {
                const categoryUpper = category.key.toUpperCase()
                const isSelected = selectedCategories.includes(categoryUpper)
                const isIncome = categoryUpper === 'INCOME'
                
                return (
                  <div key={category.key}>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(category.key)}
                        disabled={isIncome || isLoading}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className={`font-medium ${isSelected ? 'text-blue-600' : ''}`}>
                          {category.name}
                        </span>
                        {isIncome && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Sempre visibile
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 text-sm text-slate-500">
              Categorie selezionate: {selectedCategories.length}/4
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedCategories.length === 0}
            className="min-w-[120px]"
          >
            {isSaving ? 'Salvando...' : 'Salva Impostazioni'}
          </Button>
        </div>
      </div>
    </div>
  )
}
