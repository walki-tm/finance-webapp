import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { formatDateTimeForAPI, getTodayDate } from '../../lib/dateUtils.js';
import { triggerBalanceRefresh } from '../app/useBalance.js';

const normalizeMainKey = (main) => {
  const u = String(main || 'EXPENSE').toUpperCase();
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' };
  return map[u] || u.toLowerCase();
};

export function useTransactions(token, filters = null) {
  const [transactions, setTransactions] = useState([]);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  // Funzione per refreshare le transazioni dall'esterno
  const refreshTransactions = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Funzione per caricare transazioni con filtri specifici
  const loadTransactions = useCallback(async (apiFilters) => {
    if (!token) { 
      setTransactions([]);
      return;
    }
    
    setLoading(true);
    try {
      const list = await api.listTransactions(token, apiFilters);
      
      if (!Array.isArray(list)) {
        console.error('❌ API response is not an array:', list);
        setTransactions([]);
        return;
      }
      
      const normalized = list.map((t, index) => {
        try {
          const result = {
            ...t,
            main: normalizeMainKey(t.main),
            sub: t.subcategory?.name || t.sub || '',
          };
          return result;
        } catch (err) {
          console.error(`❌ Error normalizing transaction ${index}:`, t, err);
          return t; // Return original if normalization fails
        }
      });
      
      setTransactions(normalized);
      
    } catch (err) {
      console.error('❌ Errore list tx:', err.message, err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Serializza i filtri per evitare loop infiniti
  const filtersString = filters ? JSON.stringify(filters) : null;

  // Carica transazioni quando cambiano token, refreshTrigger, o filtri dall'esterno
  useEffect(() => {
    if (!token) return;
    
    // Usa sempre i filtri dall'esterno se disponibili, altrimenti default
    const filtersToUse = filters || {
      year: getTodayDate().getFullYear(),
      month: getTodayDate().getMonth() + 1,
      limit: 200
    };
    
    // Carica direttamente senza usare loadTransactions nel dependency
    const doLoad = async () => {
      setLoading(true);
      try {
        const list = await api.listTransactions(token, filtersToUse);
        const normalized = list.map(t => ({
          ...t,
          main: normalizeMainKey(t.main),
          sub: t.subcategory?.name || t.sub || '',
        }));
        setTransactions(normalized);
      } catch (err) {
        console.error('❌ Errore list tx:', err.message);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    doLoad();
  }, [token, refreshTrigger, filtersString]);

  const openAddTx = () => { setEditingTx(null); setTxModalOpen(true); };
  const openEditTx = (tx) => { setEditingTx(tx); setTxModalOpen(true); };
  const closeTxModal = () => { setTxModalOpen(false); setEditingTx(null); };

  const delTx = async (id) => {
    setTransactions(s => s.filter(t => t.id !== id));
    try {
      await api.deleteTransaction(token, id);
      
      // 🔄 Trigger refresh saldo dopo eliminazione transazione
      setTimeout(() => triggerBalanceRefresh(), 100);
      
    } catch (err) {
      console.error('Errore delete tx:', err.message);
    }
  };

  const saveTx = async (payload) => {
    const isEdit = Boolean(editingTx?.id);
    
    // Gestisci il nuovo formato con transactionType e accountId
    let main, amount;
    
    if (payload.transactionType) {
      // Nuovo formato dal TransactionModal aggiornato
      switch (payload.transactionType) {
        case 'income':
          main = 'INCOME';
          amount = Math.abs(Number(payload.amount || 0));
          break;
        case 'expense':
          main = payload.main ? String(payload.main).toUpperCase() : 'EXPENSE';
          amount = -Math.abs(Number(payload.amount || 0));
          break;
        default:
          main = String(payload.main || 'EXPENSE').toUpperCase();
          amount = Number(payload.amount || 0);
      }
    } else {
      // Formato vecchio per retrocompatibilità
      main = String(payload.main || 'EXPENSE').toUpperCase();
      amount = Number(payload.amount || 0);
    }
    
    const body = {
      date: payload.date || formatDateTimeForAPI(new Date()),
      amount,
      main,
      note: payload.note || '',
      payee: payload.payee || '',
      subId: payload.subId || null,
      subName: payload.sub || null,
      // Nuovi campi per supporto conti
      accountId: payload.accountId || null,
      destinationAccountId: payload.destinationAccountId || null,
    };

    try {
      if (isEdit) {
        const updated = await api.updateTransaction(token, editingTx.id, body);
        const normalizedMain = normalizeMainKey(updated.main);
        const normalized = { ...updated, main: normalizedMain, sub: payload.sub || updated.subcategory?.name || '' };
        setTransactions(s => s.map(t => (t.id === editingTx.id ? normalized : t)));
        
        // 🔄 Trigger refresh saldo dopo modifica transazione
        setTimeout(() => triggerBalanceRefresh(), 100);
        
      } else {
        const created = await api.addTransaction(token, body);
        const normalizedMain = normalizeMainKey(created.main);
        const normalized = { ...created, main: normalizedMain, sub: payload.sub || created.subcategory?.name || '' };
        setTransactions(s => [normalized, ...s]);
        
        // 🔄 Trigger refresh saldo dopo creazione transazione
        setTimeout(() => triggerBalanceRefresh(), 100);
      }
    } catch (err) {
      console.error('Errore save tx:', err.message);
    } finally {
      closeTxModal();
    }
  };


  return {
    transactions,
    txModalOpen,
    editingTx,
    openAddTx,
    openEditTx,
    closeTxModal,
    delTx,
    saveTx,
    refreshTransactions, // Nuova funzione per refresh
    loadTransactions, // Funzione per caricare con filtri specifici
    setTransactions, // Funzione per impostare direttamente le transazioni
    loading, // Stato di caricamento
  };
}

export default useTransactions;
