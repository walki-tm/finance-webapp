/**
 * 📄 ACCOUNT CARD: Componente card per singolo conto
 * 
 * 🎯 Scopo: Visualizza informazioni conto in formato card colorata
 * 
 * 🔧 Dipendenze principali:
 * - React per UI
 * - Lucide icons per icone
 * - accountIcons config per icone personalizzate
 * 
 * 📝 Note:
 * - Card colorata con colore personalizzato del conto
 * - Icona automatica basata su accountType
 * - Azioni rapide (modifica, elimina)
 * - Formato valuta localizzato italiano
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Aggiunta pulsante "Nuova Transazione" come quick action
 */

// 🔸 Import dependencies
import React from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { getAccountIcon, ACCOUNT_ICON_CONFIG, ACCOUNT_TYPES } from '../../../lib/accountIcons'

/**
 * 🎯 COMPONENTE: AccountCard
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.account - Dati del conto
 * @param {Function} props.onEdit - Callback per modifica conto
 * @param {Function} props.onDelete - Callback per elimina conto
 * @param {Function} props.onAddTransaction - Callback per aggiungere transazione
 * @param {boolean} props.isDeleting - Loading state eliminazione
 */
export default function AccountCard({ 
  account, 
  onEdit, 
  onDelete,
  onAddTransaction,
  isDeleting = false 
}) {
  // 🔸 Ottieni configurazione icona per tipo account
  const iconConfig = getAccountIcon(account.accountType)
  const IconComponent = iconConfig.icon

  // 🔸 Handler functions
  const handleEdit = () => onEdit?.(account)
  const handleDelete = () => onDelete?.(account.id)
  const handleAddTransaction = () => onAddTransaction?.(account)

  // 🔸 Formattazione balance
  const formattedBalance = account.balance.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR'
  })

  // 🔸 Determina colore testo balance (verde se positivo, rosso se negativo, grigio se zero)
  const getBalanceColor = () => {
    if (account.balance > 0) {
      return {
        textClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/10',
        hex: '#10B981'
      }
    } else if (account.balance < 0) {
      return {
        textClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-50 dark:bg-rose-900/10',
        hex: '#EF4444'
      }
    } else {
      return {
        textClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-50 dark:bg-slate-900/10',
        hex: '#64748B'
      }
    }
  }
  
  const balanceColor = getBalanceColor()

  // 🔸 Determina colori badge per tipo account
  const getAccountTypeBadge = () => {
    switch (account.accountType) {
      case ACCOUNT_TYPES.CURRENT:
        return {
          bgClass: 'bg-blue-50 dark:bg-blue-900/20',
          textClass: 'text-blue-700 dark:text-blue-300',
          borderClass: 'border-blue-200 dark:border-blue-800'
        }
      case ACCOUNT_TYPES.SAVINGS:
        return {
          bgClass: 'bg-green-50 dark:bg-green-900/20',
          textClass: 'text-green-700 dark:text-green-300',
          borderClass: 'border-green-200 dark:border-green-800'
        }
      case ACCOUNT_TYPES.INVESTMENTS:
        return {
          bgClass: 'bg-purple-50 dark:bg-purple-900/20',
          textClass: 'text-purple-700 dark:text-purple-300',
          borderClass: 'border-purple-200 dark:border-purple-800'
        }
      case ACCOUNT_TYPES.POCKET:
        return {
          bgClass: 'bg-orange-50 dark:bg-orange-900/20',
          textClass: 'text-orange-700 dark:text-orange-300',
          borderClass: 'border-orange-200 dark:border-orange-800'
        }
      default:
        return {
          bgClass: 'bg-slate-50 dark:bg-slate-900/20',
          textClass: 'text-slate-700 dark:text-slate-300',
          borderClass: 'border-slate-200 dark:border-slate-800'
        }
    }
  }
  
  const badgeStyle = getAccountTypeBadge()

  return (
    <div 
      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 hover:-translate-y-1"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: account.colorHex
      }}
    >
      {/* Header con icona e nome */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icona account type */}
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: `${account.colorHex}15` }}
            >
              <IconComponent 
                className="w-5 h-5"
                style={{ color: account.colorHex }}
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {account.name}
                </h3>
                <span 
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyle.bgClass} ${badgeStyle.textClass} ${badgeStyle.borderClass}`}
                >
                  {ACCOUNT_ICON_CONFIG[account.accountType]?.label || account.accountType}
                </span>
              </div>
              {/* Statistiche sotto il nome */}
              {(account.transactionCount > 0 || account.plannedTransactionCount > 0) && (
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {account.transactionCount > 0 && (
                    <span>
                      {account.transactionCount} transazioni
                    </span>
                  )}
                  {account.plannedTransactionCount > 0 && (
                    <span>
                      {account.plannedTransactionCount} pianificate
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu azioni */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Modifica conto"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Elimina conto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Balance e quick actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`text-2xl font-bold ${balanceColor.textClass}`}>
            {formattedBalance}
          </div>
          
          {/* Quick action - Nuova Transazione */}
          {onAddTransaction && (
            <button
              onClick={handleAddTransaction}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
              title="Aggiungi transazione"
            >
              <Plus className="w-4 h-4" />
              Transazione
            </button>
          )}
        </div>
      </div>

      {/* Loading overlay per eliminazione */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
            Eliminazione...
          </div>
        </div>
      )}
    </div>
  )
}
