/**
 * 📄 TRANSFER MODAL: Modal dedicata per creazione/modifica trasferimenti
 * 
 * 🎯 Scopo: Modal separata per gestione trasferimenti tra conti
 * - Interface dedicata per trasferimenti (From -> To)
 * - Validazione specifica per trasferimenti
 * - Integrazione con API transfers (non transactions)
 * - Design coerente con TransactionModal ma semplificato
 * 
 * @author Finance WebApp Team
 * @modified 4 Ottobre 2025 - Creazione modal transfers dedicata
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react';
import { formatDateForAPI, getTodayDate } from '../../../lib/dateUtils.js';
import { getAccountIcon } from '../../../lib/accountIcons.js';
import { useAccounts } from '../../accounts';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api.js';

/* ===== Utils ===== */
function hexToRgba(hex, a = 1) {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

function useDropdown(onClose) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) { setOpen(false); onClose?.(); }
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); onClose?.(); }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return { open, setOpen, ref };
}

/* ===== AccountSelect Component ===== */
function AccountSelect({ value, onChange, accounts = [], placeholder = "Seleziona conto", disabled = false }) {
  const { open, setOpen, ref } = useDropdown();
  const dark = isDark();
  
  const selected = accounts.find(acc => acc.id === value);
  
  const AccountItem = ({ account }) => {
    const accountIconConfig = getAccountIcon(account.accountType || account.type);
    const IconComponent = accountIconConfig.icon;
    
    return (
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: hexToRgba(account.colorHex || account.color, 0.2),
            border: `1px solid ${hexToRgba(account.colorHex || account.color, 0.3)}`
          }}
        >
          <IconComponent 
            className="h-4 w-4" 
            style={{ color: account.colorHex || account.color }}
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 dark:text-white">
            {account.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {accountIconConfig.label} • €{Number(account.balance || 0).toFixed(2)}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full rounded-xl px-3 py-2.5 text-sm border bg-white dark:bg-slate-900 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
          disabled 
            ? 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed' 
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <AccountItem account={selected} />
        ) : (
          <span className="text-slate-500 dark:text-slate-400">
            {placeholder}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      
      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {accounts.map((account) => (
              <li
                key={account.id}
                role="option"
                onClick={() => { onChange(account.id); setOpen(false); }}
                className={`px-3 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  account.id === value ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                }`}
              >
                <AccountItem account={account} />
              </li>
            ))}
            {accounts.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                Nessun conto disponibile
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===== TransferModal Component ===== */
export default function TransferModal({
  open,
  onClose,
  onSave,
  initial = null
}) {
  if (!open) return null;
  
  // Ottieni token JWT dall'AuthContext
  const { token } = useAuth();
  
  // Carica conti tramite hook
  const { accounts = [], refreshAccounts } = useAccounts(token);
  
  // Stato form
  const [fromAccountId, setFromAccountId] = useState(initial?.fromAccountId || '');
  const [toAccountId, setToAccountId] = useState(initial?.toAccountId || '');
  const [amount, setAmount] = useState(initial?.amount ? Math.abs(Number(initial.amount)) : '');
  const [note, setNote] = useState(initial?.note || '');
  const [date, setDate] = useState(
    initial?.date 
      ? formatDateForAPI(new Date(initial.date)) 
      : formatDateForAPI(getTodayDate())
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtra conti disponibili (solo conti attivi)
  const availableAccounts = useMemo(() => {
    return accounts.filter(account => account.isActive !== false);
  }, [accounts]);
  
  // Filtra conti destinazione (escludi conto di origine)
  const destinationAccounts = useMemo(() => {
    return availableAccounts.filter(acc => acc.id !== fromAccountId);
  }, [availableAccounts, fromAccountId]);
  
  // Reset destinationAccount se uguale a fromAccount
  useEffect(() => {
    if (toAccountId === fromAccountId) {
      setToAccountId('');
    }
  }, [fromAccountId, toAccountId]);
  
  // Validazione e submit
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    
    const amountValue = Number(amount);
    
    // Validazione
    if (!fromAccountId || !toAccountId || !date || isNaN(amountValue) || amountValue <= 0) {
      setError('Seleziona conti di origine e destinazione, data valida e importo > 0.');
      return;
    }
    
    if (fromAccountId === toAccountId) {
      setError('Il conto di origine e destinazione devono essere diversi.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const transferData = {
        fromAccountId,
        toAccountId,
        amount: Math.abs(amountValue),
        note: note.trim(),
        date: new Date(date).toISOString()
      };
      
      if (initial?.id) {
        // Modifica transfer esistente
        await api.updateTransfer(token, initial.id, transferData);
      } else {
        // Crea nuovo transfer
        await api.createTransfer(token, transferData);
      }
      
      // Refresh accounts per aggiornare saldi
      await refreshAccounts();
      
      // Callback success
      onSave?.();
      
      // Chiudi modal
      onClose();
      
    } catch (err) {
      console.error('Error saving transfer:', err);
      setError(err.message || 'Errore durante il salvataggio del trasferimento');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <ArrowRight className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {initial ? 'Modifica trasferimento' : 'Nuovo trasferimento'}
              </h3>
            </div>
            <button
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Header trasferimento */}
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ArrowRight className="h-5 w-5" />
                <span className="font-semibold">Trasferimento tra conti</span>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Sposta denaro da un conto all'altro
              </p>
            </div>

            {/* Conti */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-200">
                  Da conto <span className="text-red-600">(addebita)</span>
                </label>
                <AccountSelect
                  value={fromAccountId}
                  onChange={setFromAccountId}
                  accounts={availableAccounts}
                  placeholder="Seleziona conto origine"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-200">
                  A conto <span className="text-emerald-600">(riceve)</span>
                </label>
                <AccountSelect
                  value={toAccountId}
                  onChange={setToAccountId}
                  accounts={destinationAccounts}
                  placeholder="Seleziona conto destinazione"
                />
              </div>
            </div>

            {/* Importo e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-200">
                  Importo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-200">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-200">
                Note <span className="text-slate-500 font-normal">(opzionale)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Descrizione del trasferimento..."
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-tr from-emerald-600 to-teal-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isSubmitting ? 'Salvataggio...' : (initial ? 'Aggiorna' : 'Crea trasferimento')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}