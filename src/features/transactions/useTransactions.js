import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const normalizeMainKey = (main) => {
  const u = String(main || 'EXPENSE').toUpperCase();
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' };
  return map[u] || u.toLowerCase();
};

export function useTransactions(token) {
  const [transactions, setTransactions] = useState([]);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Caricamento iniziale: mese corrente (API richiede year+month)
  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) { setTransactions([]); return; }
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-12
        const list = await api.listTransactions(token, year, month);
        const normalized = list.map(t => ({
          ...t,
          main: normalizeMainKey(t.main),
          sub: t.subcategory?.name || t.sub || '',
        }));
        if (active) setTransactions(normalized);
      } catch (err) {
        console.error('Errore list tx:', err.message);
        if (active) setTransactions([]);
      }
    }
    load();
    return () => { active = false; };
  }, [token]);

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
      date: payload.date || new Date().toISOString(),
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
  };
}

export default useTransactions;
