/**
 * 📄 CATEGORY TABLE ACTIONS: Barra azioni tabella categorie
 * 
 * 🎯 Scopo: Gestisce le azioni principali della tabella categorie
 * 
 * 🔧 Dipendenze principali:
 * - Lucide React per icone
 * - Toast per feedback utente
 * 
 * 📝 Note:
 * - Supporta modalità edit batch e singola
 * - Genera nomi unici per nuove categorie
 * - Gestisce validazione prima del salvataggio
 * 
 * @author Finance WebApp Team
 * @modified 19 Gennaio 2025 - Estratto da MainCategoriesTab per modularità
 */

import React from 'react'
import { Save } from 'lucide-react'

// 🔸 Import hooks
import { useToast } from '../../toast'

/**
 * 🎯 COMPONENTE: Barra azioni tabella categorie
 * 
 * Gestisce i pulsanti di azione principali:
 * - Modifica batch
 * - Salva modifiche
 * - Annulla modifiche
 * - Aggiungi categoria
 */
export default function CategoryTableActions({
  editAll,
  onStartEditAll,
  onSaveEditAll,
  onCancelEditAll,
  onAddCategory,
  uniqueMainName
}) {
  const toast = useToast()

  // 🔸 Handler per aggiungere categoria
  const handleAddCategory = async () => {
    const key = `custom_${Date.now().toString(36)}`
    const name = uniqueMainName('NUOVA CATEGORIA')
    
    try {
      await onAddCategory({ key, name, color: '#5B86E5' })
      toast.success('Categoria creata')
    } catch (e) {
      toast.error('Errore creazione categoria', { 
        description: String(e.message || e) 
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!editAll ? (
        // Modalità normale
        <>
          <button
            onClick={onStartEditAll}
            className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Modifica
          </button>
          <button
            onClick={handleAddCategory}
            className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90"
          >
            + Aggiungi categoria
          </button>
        </>
      ) : (
        // Modalità edit batch
        <>
          <button
            onClick={onCancelEditAll}
            className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Annulla
          </button>
          <button
            onClick={onSaveEditAll}
            className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>Salva</span>
          </button>
        </>
      )}
    </div>
  )
}
