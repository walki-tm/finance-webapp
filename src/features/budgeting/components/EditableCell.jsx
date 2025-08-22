/**
 * 📄 EDITABLE CELL: Cella modificabile per valori budget
 * 
 * 🎯 Scopo: Gestisce l'editing inline di valori monetari con:
 * - Click per attivare modalità edit
 * - Input number/currency
 * - Salvataggio automatico onBlur/Enter
 * - Annullamento con Escape
 * 
 * @author Finance WebApp Team
 * @modified 21 Gennaio 2025 - Creazione componente
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { nice } from '../../../lib/utils.js';
import { useToast } from '../../toast';

export default function EditableCell({ 
  value, 
  onSave, 
  color = '#64748b',
  className = '',
  disabled = false,
  tabIndex = 0,
  onTab = null // Callback per navigazione Tab
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const measureRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(60); // Larghezza minima
  const toast = useToast();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Calcola larghezza iniziale basata sul valore corrente
      updateInputWidth(inputValue);
    }
  }, [isEditing]);

  // Aggiorna la larghezza dell'input in base al contenuto
  const updateInputWidth = (text) => {
    if (measureRef.current) {
      measureRef.current.textContent = text || '0';
      const width = Math.max(40, measureRef.current.scrollWidth + 20); // Minimo 40px + padding
      setInputWidth(width);
    }
  };

  // Aggiorna la larghezza quando il valore cambia
  useEffect(() => {
    if (isEditing) {
      updateInputWidth(inputValue);
    }
  }, [inputValue, isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    // Se il valore è zero, inizia con una stringa vuota per facilitare l'inserimento
    setInputValue(value && value > 0 ? String(value) : '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const cleanedValue = inputValue.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanedValue) || 0;
    
    // Validazione: valore negativo
    if (numValue < 0) {
      toast.error('Il valore non può essere negativo');
      return;
    }
    
    // Validazione: più di 7 cifre (10.000.000 = 10 milioni)
    if (numValue >= 10000000) {
      toast.error('Il valore non può superare i 7 zeri (10 milioni)');
      return;
    }
    
    try {
      // Salva con precisione di 2 decimali
      const preciseValue = Math.round(numValue * 100) / 100;
      await onSave(preciseValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving budget value:', error);
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const handleBlur = async (e) => {
    // Check if focus is moving to our action buttons
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && relatedTarget.closest('.editable-cell-actions')) {
      // Focus is moving to our action buttons, don't auto-save
      return;
    }
    // Focus is moving elsewhere, auto-save
    await handleSave();
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSave();
      // Dopo salvare, naviga alla prossima cella se disponibile
      if (onTab) {
        onTab(1); // 1 = avanti
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await handleSave();
      // Naviga in base alla direzione di Tab
      if (onTab) {
        onTab(e.shiftKey ? -1 : 1); // -1 = indietro, 1 = avanti
      }
    }
  };

  // Validate and clean input value
  const validateInput = (value) => {
    // Remove any non-numeric characters except dots and commas
    const cleaned = value.replace(/[^\d.,]/g, '');
    // Replace comma with dot for decimal separator
    const normalized = cleaned.replace(',', '.');
    // Ensure only one decimal point
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return normalized;
  };

  // Formatta il valore per display consistente
  const formatDisplayValue = (val) => {
    const num = Math.round(val || 0);
    // Mostra anche i valori zero
    return num.toLocaleString('it-IT') + '€';
  };

  if (isEditing) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Highlight leggero per indicare editing attivo */}
        <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-pulse opacity-60"></div>
        
        {/* Elemento invisibile per misurare la larghezza del testo */}
        <span 
          ref={measureRef}
          className="absolute invisible text-sm font-medium whitespace-pre"
          style={{ fontFamily: 'inherit' }}
        ></span>
        
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => {
            const validatedValue = validateInput(e.target.value);
            setInputValue(validatedValue);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="relative z-10 px-3 py-2 text-sm font-medium text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-0 border-b-2 border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 transition-all duration-200 rounded-lg"
          style={{
            width: `${inputWidth}px`,
            minWidth: '40px',
            maxWidth: '120px',
            boxShadow: `0 0 0 2px ${color}20, 0 4px 12px rgba(59, 130, 246, 0.15)`,
            borderBottomColor: color
          }}
          autoComplete="off"
          tabIndex={tabIndex}
          placeholder="0"
        />
        
        {/* Pulsanti di azione integrati - posizionati come overlay sopra la cella */}
        <div className="editable-cell-actions absolute top-0 right-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full shadow-lg px-1.5 py-1 z-20 transform translate-x-2 -translate-y-2">
          <button
            onClick={handleSave}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus stealing
            className="p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-110"
            title="Conferma e salva (Enter)"
            aria-label="Conferma modifiche"
            tabIndex={-1} // Remove from tab order
          >
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </button>
          <button
            onClick={handleCancel}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus stealing
            className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-110"
            title="Annulla modifiche (Esc)"
            aria-label="Annulla modifiche"
            tabIndex={-1} // Remove from tab order
          >
            <X className="h-3 w-3 text-red-500 dark:text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
      className={`group relative w-full h-full px-3 py-2 text-center cursor-pointer transition-all duration-200 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-blue-50 dark:focus:bg-blue-900/20'
      } ${className}`}
      title={disabled ? 'Campo non modificabile' : 'Clicca per modificare • Tab per navigare'}
      tabIndex={disabled ? -1 : tabIndex}
      role="button"
      aria-label={`Valore budget: ${formatDisplayValue(value)}. Clicca per modificare.`}
    >
      {/* Badge hover con bordi arrotondati */}
      {!disabled && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -m-0.5"></div>
      )}
      
      {/* Indicatore di interattività più sottile */}
      {!disabled && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-6 bg-blue-400 dark:bg-blue-500 rounded-full transition-all duration-200 shadow-sm"></div>
      )}
      
      {/* Valore con formattazione consistente */}
      <span className="relative z-10 text-base font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200">
        {formatDisplayValue(value)}
      </span>
      
      {/* Indicatore editabilità */}
      {!disabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"></div>
      )}
    </div>
  );
}
