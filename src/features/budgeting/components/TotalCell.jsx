/**
 * 📄 TOTAL CELL: Cella per valori totali non editabili
 * 
 * 🎯 Scopo: Mostra i totali con la stessa formattazione delle celle editabili
 * ma senza possibilità di modifica
 * 
 * @author Finance WebApp Team
 * @modified 22 Gennaio 2025 - Creazione componente
 */

import React from 'react';

export default function TotalCell({ 
  value, 
  color = '#64748b',
  className = '',
  variant = 'default', // 'default' | 'emphasized'
  label = ''
}) {
  // Formatta il valore per display consistente (stesso formato di EditableCell)
  const formatDisplayValue = (val) => {
    const num = Math.round(val || 0);
    // Mostra anche i valori zero
    return num.toLocaleString('it-IT') + '€';
  };

  return (
    <div
      className={`relative w-full h-full px-3 py-2 text-center transition-colors duration-200 ${
        variant === 'emphasized' 
          ? 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-lg' 
          : ''
      } ${className}`}
      title={label ? `${label}: ${formatDisplayValue(value)}` : `Totale: ${formatDisplayValue(value)}`}
      aria-label={label ? `${label}: ${formatDisplayValue(value)}` : `Totale: ${formatDisplayValue(value)}`}
    >
      {/* Valore con formattazione consistente - nessun hover effect */}
      <span className={`text-base font-semibold ${
        variant === 'emphasized'
          ? 'text-slate-800 dark:text-slate-200'
          : 'text-slate-600 dark:text-slate-300'
      }`}>
        {formatDisplayValue(value)}
      </span>
    </div>
  );
}
