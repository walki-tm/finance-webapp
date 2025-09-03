import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { formatDateTimeForAPI, getTodayDate } from '../../lib/dateUtils.js';

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
      console.log('❌ No token, skipping load');
      setTransactions([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Loading transactions with filters:', apiFilters);
      const list = await api.listTransactions(token, apiFilters);
      console.log('📦 Raw API response:', list);
      
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
          if (index < 2) console.log(`🔧 Normalized transaction ${index}:`, result);
          return result;
        } catch (err) {
          console.error(`❌ Error normalizing transaction ${index}:`, t, err);
          return t; // Return original if normalization fails
        }
      });
      
      console.log('🔧 About to setTransactions with:', normalized.length, 'transactions');
      setTransactions(normalized);
      console.log('✅ setTransactions called successfully');
      
    } catch (err) {
      console.error('❌ Errore list tx:', err.message, err);
      setTransactions([]);
    } finally {
      setLoading(false);
      console.log('🎁 Loading completed');
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
    
    console.log('🎯 useTransactions: loading with filters:', filtersToUse);
    
    // Carica direttamente senza usare loadTransactions nel dependency
    const doLoad = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading transactions with filters:', filtersToUse);
        const list = await api.listTransactions(token, filtersToUse);
        const normalized = list.map(t => ({
          ...t,
          main: normalizeMainKey(t.main),
          sub: t.subcategory?.name || t.sub || '',
        }));
        console.log('🔧 About to setTransactions with:', normalized.length, 'transactions', normalized.slice(0, 2));
        setTransactions(normalized);
        console.log('✅ Loaded', normalized.length, 'transactions');
      } catch (err) {
        console.error('❌ Errore list tx:', err.message);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    doLoad();
  }, [token, refreshTrigger, filtersString]);

  // Debug: log dello stato attuale delle transazioni
  console.log('📊 useTransactions hook state:', {
    transactionsLength: transactions.length,
    transactions: transactions.slice(0, 2),
    loading,
    filtersString
  });

  const openAddTx = () => { setEditingTx(null); setTxModalOpen(true); };
  const openEditTx = (tx) => { setEditingTx(tx); setTxModalOpen(true); };
  const closeTxModal = () => { setTxModalOpen(false); setEditingTx(null); };

  const delTx = async (id) => {
    setTransactions(s => s.filter(t => t.id !== id));
    try {
      await api.deleteTransaction(token, id);
    } catch (err) {
      console.error('Errore delete tx:', err.message);
    }
  };

  const saveTx = async (payload) => {
    const isEdit = Boolean(editingTx?.id);
    const body = {
      date: payload.date || formatDateTimeForAPI(new Date()),
      amount: Number(payload.amount || 0),
      main: String(payload.main || 'EXPENSE').toUpperCase(),
      note: payload.note || '',
      payee: payload.payee || '',
      subId: payload.subId || null,
      subName: payload.sub || null,
    };

    try {
      if (isEdit) {
        const updated = await api.updateTransaction(token, editingTx.id, body);
        const normalizedMain = normalizeMainKey(updated.main);
        const normalized = { ...updated, main: normalizedMain, sub: payload.sub || updated.subcategory?.name || '' };
        setTransactions(s => s.map(t => (t.id === editingTx.id ? normalized : t)));
      } else {
        const created = await api.addTransaction(token, body);
        const normalizedMain = normalizeMainKey(created.main);
        const normalized = { ...created, main: normalizedMain, sub: payload.sub || created.subcategory?.name || '' };
        setTransactions(s => [normalized, ...s]);
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
