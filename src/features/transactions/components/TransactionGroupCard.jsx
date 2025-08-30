/**
 * 📄 TRANSACTION GROUP CARD: Card gruppo transazioni pianificate
 * 
 * 🎯 Scopo: Card professionale per gruppi di transazioni con stile uniforme al Budgeting
 * 
 * 🔧 Dipendenze principali:
 * - Card UI components
 * - Icone Lucide
 * - Palette colori dinamica
 * 
 * @author Finance WebApp Team
 * @modified 24 Agosto 2025 - Redesign professionale
 */

import React, { useState } from 'react'
import { Card, CardContent } from '../../ui'
import { Folder, FolderOpen, Calendar, Clock, Euro, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react'
import ActionsMenu from '../../categories/components/ActionsMenu.jsx'

export default function TransactionGroupCard({ 
  group, 
  transactions = [], 
  stats = {}, 
  onEdit, 
  onDelete,
  onEditTransaction,
  onDeleteTransaction,
  onMaterialize,
  onMoveTransaction,
  onApplyToBudgeting,
  onApplyGroupToBudgeting,
  onToggleActive,
  subcats = {},
  mains = []
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 🔸 Utility per convertire hex in rgba
  const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(100, 116, 139, ${alpha})` // slate fallback
    
    // Rimuovi # se presente
    hex = hex.replace('#', '')
    
    // Converti a RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // 🔸 Usa colore personalizzato del gruppo o fallback automatico
  const groupColor = React.useMemo(() => {
    // Se il gruppo ha un colore personalizzato, usalo
    if (group.color) {
      return group.color
    }
    
    // Altrimenti determina colore basato sui tipi di transazioni predominanti
    if (!transactions.length) return '#64748b' // slate
    
    const mainTypes = transactions.map(tx => tx.main)
    const majorityType = mainTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    const dominantType = Object.entries(majorityType)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    // Colori core del progetto
    const colorMap = {
      'INCOME': '#10b981', // verde
      'EXPENSE': '#3b82f6', // blu  
      'DEBT': '#ef4444',    // rosso
      'SAVING': '#f59e0b'   // arancio
    }
    
    return colorMap[dominantType] || '#64748b'
  }, [group.color, transactions])
  
  // 🔸 Genera colori con opacità corretta
  const bgColor = hexToRgba(groupColor, 0.08) // 8% opacity
  const borderColor = hexToRgba(groupColor, 0.3) // 30% opacity
  const shadowColor = hexToRgba(groupColor, 0.2) // 20% opacity per shadow
  const iconBgColor = hexToRgba(groupColor, 0.15) // 15% opacity per icona background
  const iconBorderColor = hexToRgba(groupColor, 0.3) // 30% per bordo icona
  
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 border-2 hover:scale-[1.02] cursor-pointer"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${hexToRgba(groupColor, 0.2)}, 0 10px 10px -5px ${hexToRgba(groupColor, 0.1)}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
      }}
    >
      <CardContent className="p-0">
        {/* Header del gruppo - più compatto */}
        <div 
          className="p-3 cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            {/* Info principale */}
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: iconBgColor,
                  border: `2px solid ${iconBorderColor}`
                }}
              >
                {isExpanded ? 
                  <FolderOpen className="h-5 w-5" style={{ color: groupColor }} /> :
                  <Folder className="h-5 w-5" style={{ color: groupColor }} />
                }
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {group.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stats.activeCount || 0} di {transactions.length} transazioni attive
                </p>
              </div>
            </div>
            
            {/* Azioni e expand */}
            <div className="flex items-center gap-1">
              <ActionsMenu
                onEdit={onEdit}
                onRemove={onDelete}
                customActions={[
                  {
                    label: '📈 Applica tutto a Budgeting',
                    onClick: () => onApplyGroupToBudgeting && onApplyGroupToBudgeting(transactions),
                    variant: 'default'
                  }
                ]}
                disableRemove={false}
              />
              {isExpanded ? 
                <ChevronDown className="h-4 w-4 text-slate-400" /> :
                <ChevronRight className="h-4 w-4 text-slate-400" />
              }
            </div>
          </div>
        </div>
        
        {/* Statistiche principali migliorate e compatte */}
        <div className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Importo totale con breakdown */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Euro className="h-3 w-3" style={{ color: groupColor }} />
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                €{Math.abs(stats.totalAmount || 0).toFixed(0)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                <div>Totale mensile</div>
                {transactions.length > 0 && (
                  <div className="text-[9px] opacity-75">
                    ~€{Math.abs((stats.totalAmount || 0) / Math.max(transactions.length, 1)).toFixed(0)} per tx
                  </div>
                )}
              </div>
            </div>
            
            {/* Prossima scadenza con urgenza */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Calendar className="h-3 w-3" style={{ color: groupColor }} />
              </div>
              <div className={`text-sm font-semibold ${
                stats.nextDue && new Date(stats.nextDue) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}>
                {stats.nextDue ? 
                  new Date(stats.nextDue).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) :
                  '—'
                }
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                <div>Prossima</div>
                {stats.nextDue && (
                  <div className="text-[9px] opacity-75">
                    {Math.ceil((new Date(stats.nextDue) - new Date()) / (1000 * 60 * 60 * 24))} giorni
                  </div>
                )}
              </div>
            </div>
            
            {/* Stato attivazione */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Clock className="h-3 w-3" style={{ color: groupColor }} />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {stats.activeCount || 0}/{transactions.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                <div>Attive</div>
                <div className="text-[9px] opacity-75">
                  {transactions.length > 0 ? Math.round(((stats.activeCount || 0) / transactions.length) * 100) : 0}% attivazione
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista transazioni compatta nel gruppo - Solo quando espanso */}
        {isExpanded && (
          <div className="px-3 pb-3">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-3">
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <span>Transazioni ({transactions.length})</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                      {stats.activeCount || 0} attive
                    </span>
                  </h4>
                  
                  <div className="space-y-1.5">
                    {transactions.map((tx, index) => {
                      const subcat = Object.values(subcats).flat()
                        .find(s => s.id === tx.subId || s.name === tx.subName)
                      const daysUntil = Math.ceil((new Date(tx.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <div 
                          key={tx.id}
                          className="flex items-center justify-between py-1.5 px-2 bg-white/80 dark:bg-slate-800/80 rounded-md border border-slate-200/30 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800 transition-colors group relative"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: tx.isActive ? groupColor : '#94a3b8' }}
                              />
                              <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                                {tx.title || subcat?.name || 'Transazione'}
                              </span>
                              {tx.appliedToBudget && (
                                <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-semibold text-[10px]" title="Applicata al budgeting generale">
                                  📊
                                </span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                daysUntil <= 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                daysUntil <= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                daysUntil <= 31 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}>
                                {daysUntil <= 0 ? 'Scaduta' : 
                                 daysUntil <= 7 ? `${daysUntil}g` : 
                                 daysUntil <= 31 ? new Date(tx.nextDueDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : 
                                 'Futura'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              €{Math.abs(tx.amount).toFixed(0)}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {tx.frequency === 'MONTHLY' ? 'Mens.' : tx.frequency === 'YEARLY' ? 'Ann.' : 'Sing.'}
                            </div>
                          </div>
                          {/* Actions menu per transazione */}
                          <div className="ml-2">
                            <ActionsMenu
                              onEdit={() => onEditTransaction(tx)}
                              onRemove={() => onDeleteTransaction(tx.id)}
                              customActions={[
                                ...(daysUntil <= 0 && tx.isActive ? [{
                                  label: '💸 Paga ora',
                                  onClick: () => onMaterialize && onMaterialize(tx.id),
                                  variant: 'primary'
                                }] : []),
                                ...(tx.frequency === 'MONTHLY' ? [{
                                  label: tx.isActive ? '🚫 Disattiva' : '▶️ Attiva',
                                  onClick: () => onToggleActive && onToggleActive(tx, !tx.isActive),
                                  variant: tx.isActive ? 'warning' : 'success'
                                }] : []),
                                ...(tx.isActive ? [{
                                  label: tx.appliedToBudget ? '📉 Rimuovi da Budgeting' : '📈 Applica a Budgeting',
                                  onClick: () => onApplyToBudgeting && onApplyToBudgeting(tx),
                                  variant: tx.appliedToBudget ? 'warning' : 'default'
                                }] : [])
                              ]}
                              size="sm"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📂</div>
                    <div className="text-sm font-medium">Gruppo vuoto</div>
                    <div className="text-xs mt-1">Nessuna transazione in questo gruppo</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  )
}
