/**
 * 📊 KPI CARD: Card per visualizzazione KPI
 * 
 * 🎯 Scopo: Mostra una singola metrica KPI
 * 
 * @author Finance WebApp Team
 * @modified 10 Dicembre 2025 - Creato per dashboard KPI
 */

import React from 'react'
import { nice } from '../../../lib/utils.js'

export default function KPICard({ icon, label, value, color, subtitle }) {
  const colorClasses = {
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    gold: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
  }
  
  const iconColorClasses = {
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    gold: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400'
  }
  
  return (
    <div 
      className={`
        p-4 rounded-xl border transition-all
        ${colorClasses[color]}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 ${iconColorClasses[color]}`}>
          {React.cloneElement(icon, { className: 'w-5 h-5' })}
        </div>
      </div>
      
      <div className={`text-2xl font-bold mb-1 ${iconColorClasses[color]}`}>
        {value !== undefined && value !== null ? nice(value) : '-'}
      </div>
      
      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </div>
      
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  )
}
