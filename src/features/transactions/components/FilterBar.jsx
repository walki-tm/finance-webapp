/**
 * 🔍 FILTER BAR: Barra filtri per transazioni pianificate
 * 
 * 🎯 Features:
 * - Filtri per frequenza (Mensile, Annuale, Una volta)
 * - Filtri per modalità conferma (Manuale, Automatico)
 * - Filtri per stato scadenza (In scadenza, Oggi, Questa settimana, Programmate)
 * - Filtri per stato attivo/inattivo
 * - Reset rapido di tutti i filtri
 */

import React, { useState } from 'react'
import { Filter, X, Calendar, Clock, Settings, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../../ui'

export default function FilterBar({ 
  filters, 
  onFiltersChange, 
  transactionsCount = 0 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key] === value ? null : value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      frequency: null,
      confirmationMode: null,
      dueStatus: null,
      isActive: null
    })
  }

  const hasActiveFilters = Object.values(filters).some(filter => filter !== null)
  
  const filterGroups = [
    {
      key: 'frequency',
      icon: Calendar,
      label: 'Frequenza',
      options: [
        { value: 'MONTHLY', label: 'Mensile' },
        { value: 'YEARLY', label: 'Annuale' },
        { value: 'ONE_TIME', label: 'Una volta' }
      ]
    },
    {
      key: 'confirmationMode',
      icon: Settings,
      label: 'Conferma',
      options: [
        { value: 'MANUAL', label: 'Manuale' },
        { value: 'AUTOMATIC', label: 'Automatico' }
      ]
    },
    {
      key: 'dueStatus',
      icon: Clock,
      label: 'Scadenza',
      options: [
        { value: 'overdue', label: 'In ritardo' },
        { value: 'today', label: 'Oggi' },
        { value: 'this_week', label: 'Questa settimana' },
        { value: 'upcoming', label: 'Programmate' }
      ]
    },
    {
      key: 'isActive',
      icon: AlertCircle,
      label: 'Stato',
      options: [
        { value: true, label: 'Attive' },
        { value: false, label: 'Inattive' }
      ]
    }
  ]

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
      {/* Header collassabile */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-slate-500" /> :
              <ChevronRight className="h-4 w-4 text-slate-500" />
            }
          </div>
          <div>
            <span className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Filtri Avanzati
            </span>
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {Object.values(filters).filter(f => f !== null).length} attivi
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {transactionsCount} risultati
          </span>
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearAllFilters()
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Contenuto espandibile */}
      {isExpanded && (
        <CardContent className="pt-0 pb-6 px-6 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filterGroups.map(group => {
              const Icon = group.icon
              const groupColor = {
                'frequency': 'blue',
                'confirmationMode': 'green', 
                'dueStatus': 'orange',
                'isActive': 'purple'
              }[group.key] || 'slate'
              
              return (
                <div key={group.key} className="space-y-3">
                  {/* Label del gruppo */}
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 text-${groupColor}-500`} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {group.label}
                    </span>
                  </div>
                  
                  {/* Pill buttons */}
                  <div className="flex flex-wrap gap-2">
                    {group.options.map(option => {
                      const isActive = filters[group.key] === option.value
                      const colorClasses = {
                        'blue': isActive 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20',
                        'green': isActive
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20',
                        'orange': isActive
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20',
                        'purple': isActive
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20',
                        'slate': isActive
                          ? 'bg-slate-600 text-white border-slate-600 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                      }[groupColor]
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => updateFilter(group.key, option.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-200 transform hover:scale-105 ${colorClasses}`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
