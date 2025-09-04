/**
 * 📄 DASHBOARD SETTINGS MODAL: Modal impostazioni categorie dashboard
 * 
 * 🎯 Scopo: Fornisce interfaccia per configurare visibilità categorie dashboard
 * Permette di selezionare max 4 categorie visibili e riordinarle
 * 
 * 🔧 Dipendenze principali:
 * - React hooks
 * - useDashboardSettings hook
 * - UI components (Modal, Button, Switch)
 * - Drag & Drop per riordinamento
 * - Lucide icons
 * 
 * @author Finance WebApp Team
 * @modified 03/09/2025 - Creazione modal impostazioni dashboard
 */

import React, { useState, useEffect } from 'react'
import { X, Settings, Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react'
import { Button } from '../../ui'
import { useDashboardSettings } from '../hooks/useDashboardSettings'

/**
 * 🎯 COMPONENTE: Modal impostazioni categorie dashboard
 * 
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Se il modal è aperto
 * @param {Function} props.onClose - Callback per chiudere il modal
 * @param {Function} props.onSettingsUpdated - Callback quando le impostazioni vengono aggiornate
 */
export default function DashboardSettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  // 🔸 Hook personalizzato per gestire settings
  const {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    resetToDefaults,
    getAvailableCategories
  } = useDashboardSettings()

  // 🔸 State locale per gestire le modifiche nel modal
  const [localSettings, setLocalSettings] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)

  // 🔸 Sincronizza settings locali quando si aprono le impostazioni
  useEffect(() => {
    if (isOpen && settings.length > 0) {
      setLocalSettings([...settings])
    }
  }, [isOpen, settings])

  // 🔸 Handler per toggle visibilità categoria
  const handleToggleVisibility = (categoryKey) => {
    const updatedSettings = localSettings.map(setting => {
      if (setting.categoryKey === categoryKey) {
        // Non permettere di disattivare INCOME
        if (categoryKey === 'INCOME' && setting.visible) {
          return setting
        }
        return { ...setting, visible: !setting.visible }
      }
      return setting
    })

    // Controlla il limite di 4 categorie visibili
    const visibleCount = updatedSettings.filter(s => s.visible).length
    if (visibleCount > 4) {
      return // Non permettere più di 4 categorie visibili
    }

    setLocalSettings(updatedSettings)
  }

  // 🔸 Handler per inizio drag & drop
  const handleDragStart = (e, index) => {
    setIsDragging(true)
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
  }

  // 🔸 Handler per drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // 🔸 Handler per drop
  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setIsDragging(false)
      setDraggedIndex(null)
      return
    }

    const newSettings = [...localSettings]
    const draggedItem = newSettings[draggedIndex]
    
    // Rimuovi l'elemento dalla posizione originale
    newSettings.splice(draggedIndex, 1)
    // Inserisci l'elemento nella nuova posizione
    newSettings.splice(dropIndex, 0, draggedItem)
    
    // Aggiorna sortOrder
    const reorderedSettings = newSettings.map((setting, index) => ({
      ...setting,
      sortOrder: index
    }))

    setLocalSettings(reorderedSettings)
    setIsDragging(false)
    setDraggedIndex(null)
  }

  // 🔸 Handler per drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedIndex(null)
  }

  // 🔸 Handler per salvare le impostazioni
  const handleSave = async () => {
    const success = await saveSettings(localSettings)
    if (success) {
      onSettingsUpdated?.()
      onClose()
    }
  }

  // 🔸 Handler per reset alle impostazioni default
  const handleReset = async () => {
    const success = await resetToDefaults()
    if (success) {
      onSettingsUpdated?.()
    }
  }

  // 🔸 Handler per chiudere modal
  const handleClose = () => {
    // Reset delle impostazioni locali
    setLocalSettings([...settings])
    onClose()
  }

  // 🔸 Ottieni info categoria dall'array disponibili
  const getCategoryInfo = (categoryKey) => {
    const availableCategories = getAvailableCategories()
    console.log('getCategoryInfo - categoryKey:', categoryKey)
    console.log('getCategoryInfo - availableCategories:', availableCategories)
    
    const foundCategory = availableCategories.find(cat => cat.key === categoryKey || cat.key?.toLowerCase() === categoryKey.toLowerCase())
    console.log('getCategoryInfo - foundCategory:', foundCategory)
    
    return foundCategory || {
      key: categoryKey,
      name: categoryKey,
      icon: 'Circle',
      color: '#6b7280'
    }
  }

  // 🔸 Render helpers
  const renderCategoryItem = (setting, index) => {
    const categoryInfo = getCategoryInfo(setting.categoryKey)
    const isVisible = setting.visible
    const isIncome = setting.categoryKey === 'INCOME'
    const visibleCount = localSettings.filter(s => s.visible).length

    return (
      <div
        key={setting.categoryKey}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={`
          flex items-center justify-between p-4 bg-white dark:bg-slate-800 
          border border-slate-200 dark:border-slate-700 rounded-lg
          transition-all duration-200 cursor-move
          ${isDragging && draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'}
          ${isVisible ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}
        `}
      >
        {/* Drag handle e info categoria */}
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-slate-400" />
          
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: categoryInfo.color }}
          />
          
          <div>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {categoryInfo.name}
            </span>
            {isIncome && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Obbligatoria
              </span>
            )}
          </div>
        </div>

        {/* Toggle visibilità */}
        <button
          onClick={() => handleToggleVisibility(setting.categoryKey)}
          disabled={isIncome && isVisible || (!isVisible && visibleCount >= 4)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
            ${isVisible 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
            ${(isIncome && isVisible) || (!isVisible && visibleCount >= 4)
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'}
            dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600
          `}
        >
          {isVisible ? (
            <>
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Visibile</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="text-sm font-medium">Nascosta</span>
            </>
          )}
        </button>
      </div>
    )
  }

  const visibleCategoriesCount = localSettings.filter(s => s.visible).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Impostazioni Dashboard
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Header con descrizione */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Configurazione Categorie
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Seleziona fino a 4 categorie da mostrare nella dashboard e riordinale trascinandole.
              </p>
            </div>
          </div>

          {/* Contatore categorie visibili */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Categorie visibili: {visibleCategoriesCount}/4
            </span>
            {visibleCategoriesCount === 4 && (
              <span className="text-xs text-blue-700 dark:text-blue-300">
                Limite massimo raggiunto
              </span>
            )}
          </div>

          {/* Lista categorie con drag & drop */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Caricamento impostazioni...</div>
              </div>
            ) : (
              localSettings
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((setting, index) => renderCategoryItem(setting, index))
            )}
          </div>
        </div>

        {/* Footer con azioni */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Default
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSaving}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salva Impostazioni'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
