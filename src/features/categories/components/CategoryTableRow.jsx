/**
 * 📄 CATEGORY TABLE ROW: Singola riga tabella categorie
 * 
 * 🎯 Scopo: Gestisce display e editing di una singola categoria nella tabella
 * 
 * 🔧 Dipendenze principali:
 * - React per state management locale
 * - UI components per form elements
 * - ColorPicker per selezione colori
 * 
 * 📝 Note:
 * - Supporta modalità edit inline
 * - Gestisce validazione in tempo reale
 * - Differenzia categorie core da custom
 * 
 * @author Finance WebApp Team
 * @modified 19 Gennaio 2025 - Estratto da MainCategoriesTab per modularità
 */

import React, { useState } from 'react'
import { Check, X } from 'lucide-react'

// 🔸 Import componenti UI
import { Input, Button, Switch } from '../../ui'
import ColorPicker from './ColorPicker.jsx'
import CategoryBadge, { isDark } from './CategoryBadge.jsx'
import ActionsMenu from './ActionsMenu.jsx'

// 🔸 Import hooks
import { useToast } from '../../toast'

/**
 * 🎯 COMPONENTE: Singola riga categoria
 * 
 * Visualizza e gestisce l'editing di una categoria nella tabella.
 * Supporta editing inline e batch editing.
 */
export default function CategoryTableRow({
  category,
  isEditing,
  editAll,
  draftData,
  coreKeys,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeColor,
  onToggleEnabled,
  onReset,
  onDraftChange
}) {
  // 🔸 State locale per editing
  const [nameDraft, setNameDraft] = useState(category.name || '')
  const toast = useToast()
  
  // 🔸 Determina se è categoria core
  const isCore = coreKeys.has(category.key)
  
  // 🔸 Dati effettivi da mostrare (draft o reali)
  const nameVal = editAll ? (draftData?.name || category.name) : category.name
  const colorVal = editAll ? (draftData?.color || category.color) : category.color
  const enabledVal = editAll ? draftData?.enabled : category.enabled

  // 🔸 Handler per salvataggio edit singolo
  const handleSaveEdit = () => {
    const nv = nameDraft.trim().toUpperCase()
    
    if (!nv || nv === category.name) {
      onCancelEdit()
      return
    }
    
    onSaveEdit(category, nv, nameDraft)
    setNameDraft('')
  }
  
  // 🔸 Handler per inizio edit
  const handleStartEdit = () => {
    setNameDraft(category.name)
    onStartEdit(category)
  }

  // 🔸 Handler per change colore
  const handleColorChange = (newColor) => {
    onChangeColor(category, newColor)
  }

  // 🔸 Handler per toggle visibilità
  const handleToggleEnabled = (enabled) => {
    onToggleEnabled(category, enabled)
  }

  // 🔸 Handler per reset categoria core
  const handleReset = () => {
    onReset(category)
  }

  return (
    <tr className="border-t border-slate-200/10 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      {/* Colonna badge categoria */}
      <td className="px-2 py-3 whitespace-nowrap">
        <CategoryBadge color={colorVal || '#5B86E5'} size="lg">
          {nameVal?.toUpperCase() || 'CATEGORIA'}
        </CategoryBadge>
      </td>

      {/* Colonna nome categoria */}
      <td className="px-2 py-3">
        {editAll ? (
          // Modalità batch edit
          <Input
            value={nameVal?.toUpperCase() || ''}
            onChange={(e) => onDraftChange(category.key, { name: e.target.value.toUpperCase() })}
            className="font-semibold"
          />
        ) : isEditing ? (
          // Modalità edit singolo
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') onCancelEdit()
              }}
              className="font-semibold"
            />
            <Button size="sm" onClick={handleSaveEdit} className="inline-flex items-center gap-1">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Modalità visualizzazione
          <span
            className="font-semibold cursor-text"
            title="Doppio clic per rinominare"
            onDoubleClick={handleStartEdit}
          >
            {nameVal?.toUpperCase() || 'CATEGORIA'}
          </span>
        )}
      </td>

      {/* Colonna colore */}
      <td className="px-2 py-3">
        <ColorPicker
          value={colorVal || '#5B86E5'}
          onChange={handleColorChange}
          paletteKey={category.key}
        />
      </td>

      {/* Colonna visibilità */}
      <td className="px-2 py-3">
        {isCore ? (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        ) : (
          <Switch
            checked={!!enabledVal}
            onCheckedChange={handleToggleEnabled}
            style={!enabledVal ? { filter: isDark() ? "" : "grayscale(40%) opacity(.9)" } : {}}
          />
        )}
      </td>

      {/* Colonna azioni */}
      <td className="px-2 py-3">
        <ActionsMenu
          onEdit={handleStartEdit}
          onRemove={!isCore ? () => {
            // TODO: implementare rimozione
            toast.info('Funzionalità non ancora implementata in questo componente')
          } : undefined}
          onReset={isCore ? handleReset : undefined}
          disableRemove={isCore}
        />
      </td>
    </tr>
  )
}
