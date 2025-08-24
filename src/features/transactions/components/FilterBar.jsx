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

import React from 'react'
import { Filter, X, Calendar, Clock, Settings, AlertCircle } from 'lucide-react'

export default function FilterBar({ 
  filters, 
  onFiltersChange, 
  transactionsCount = 0 
}) {
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
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* 🔸 Filter icon e titolo */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Filtri
          </span>
        </div>

        {/* 🔸 Filter groups */}
        <div className="flex items-center gap-6 flex-wrap">
          {filterGroups.map(group => {
            const Icon = group.icon
            return (
              <div key={group.key} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {group.label}:
                </span>
                <div className="flex gap-1">
                  {group.options.map(option => {
                    const isActive = filters[group.key] === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => updateFilter(group.key, option.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                        }`}
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

        {/* 🔸 Results count e clear */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-slate-500">
            {transactionsCount} transazioni
          </span>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
