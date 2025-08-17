import React, { useEffect, useMemo, useState } from 'react'
import { ToastProvider } from './components/Toast.jsx'
import { Switch, Badge, NavItem } from './components/ui'
import AuthScreens from './pages/Auth.jsx'
import TransactionModal from './components/TransactionModal.jsx'
import { MAIN_CATS } from './lib/constants.js'
import { useAuth } from './context/AuthContext.jsx'
import { api } from './lib/api'
import { tabs } from './lib/tabs.js'

import {
  Layers3, LogOut, SunMedium, Moon, User, Plus
} from 'lucide-react'

// Stato iniziale (dinamico)
const defaultData = () => ({
  theme: 'light',
  customMainCats: [],      // tutte le MAIN (core + custom) come override dal DB
  mainEnabled: {},         // { [mainKeyLower]: boolean }
  subcats: {},             // { [mainKeyLower]: Subcategory[] }
  budgets: {},
  transactions: []
})

// Normalizzazione main → key UI
const normalizeMainKey = (main) => {
  const u = String(main || 'EXPENSE').toUpperCase()
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' }
  return map[u] || u.toLowerCase()
}

// UI → backend enum
const mainUp = { income: 'INCOME', expense: 'EXPENSE', debt: 'DEBT', saving: 'SAVINGS' }

export default function App() {
  const { user, logout, token } = useAuth()

  const [state, setState] = useState(defaultData())
  const [activeTab, setActiveTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashDetail, setDashDetail] = useState(null)

  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)

  const year = String(new Date().getFullYear())

  /* === THEME === */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  // helper in App.jsx (mettile vicino a normalizeMainKey)
  const CORE_UP = new Set(['INCOME', 'EXPENSE', 'DEBT', 'SAVING', 'SAVINGS']);
  const toUp = (s) => String(s || '').toUpperCase();

  // === CARICA CATEGORIE ===
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const cats = await api.listCategories(token);

        const byCore = {};          // { 'EXPENSE': categoryRow }
        const customs = [];         // array categorie custom
        const subByMain = {};       // { [mainKeyLower]: Sub[] }
        const mainEnabled = {};     // { [mainKeyLower]: boolean }

        // split core/custom
        for (const c of cats) {
          const up = toUp(c.main);
          if (CORE_UP.has(up)) byCore[up] = c; else customs.push(c);
        }

        const customMainCats = [];

        // core (override dei 4 default)
        for (const up of CORE_UP) {
          const c = byCore[up];
          if (!c) continue;
          const key = normalizeMainKey(up); // 'income' | 'expense' | ...
          customMainCats.push({
            key,
            id: c.id,
            name: c.name,
            color: c.colorHex || MAIN_CATS.find(m => m.key === key)?.color,
            iconKey: c.iconKey || undefined
          });
          if (typeof c.visible === 'boolean') mainEnabled[key] = c.visible;
          subByMain[key] = (c.subcats || []).map(sc => ({
            id: sc.id,
            name: sc.name,
            iconKey: sc.iconKey || null
          }));
        }

        // custom main (mantieni la loro main come key)
        for (const c of customs) {
          const key = String(c.main || '').toLowerCase(); // es: 'custom_abcd'
          customMainCats.push({
            key,
            id: c.id,
            name: c.name,
            color: c.colorHex || '#5B86E5',
            iconKey: c.iconKey || undefined
          });
          if (typeof c.visible === 'boolean') mainEnabled[key] = c.visible;
          const arr = (c.subcats || []).map(sc => ({ id: sc.id, name: sc.name, iconKey: sc.iconKey || null }));
          subByMain[key] = (subByMain[key] || []).concat(arr);
        }

        setState(s => ({
          ...s,
          customMainCats,
          subcats: subByMain,
          mainEnabled: { income: true, expense: true, debt: true, saving: true, ...mainEnabled }
        }));
      } catch (err) {
        console.error('Errore caricamento categorie:', err);
      }
    })();
  }, [token]);

  // === FUNZIONI CATEGORIE MAIN ===
  const addMainCat = async (obj) => {
    // obj: { key: 'custom_xxx', name, color, iconKey? }
    try {
      const created = await api.addCategory(token, {
        main: String(obj.key).toUpperCase(),   // <-- fondamentale: la custom resta separata
        name: obj.name,
        colorHex: obj.color,
        iconKey: obj.iconKey || null
      });
      setState(s => ({
        ...s,
        customMainCats: [...s.customMainCats, { ...obj, id: created.id }]
      }));
      return created;
    } catch (err) {
      console.error('Errore addMainCat:', err);
      throw err;
    }
  };

  const updateMainCat = async (key, patch) => {
    const cat = state.customMainCats.find(c => c.key === key);
    if (!cat) return;
    try {
      const payload = {
        ...(patch.name ? { name: patch.name } : {}),
        ...(patch.color ? { colorHex: patch.color } : {}),
        ...(patch.iconKey ? { iconKey: patch.iconKey } : {}),
        ...(typeof patch.visible === 'boolean' ? { visible: patch.visible } : {}),
      };
      const updated = await api.updateCategory(token, cat.id, payload);
      setState(s => ({
        ...s,
        customMainCats: s.customMainCats.map(c =>
          c.key === key ? { ...c, ...updated, color: updated.colorHex ?? c.color } : c
        ),
        // aggiorna realtime lo switch
        mainEnabled: (typeof updated.visible === 'boolean')
          ? { ...s.mainEnabled, [key]: updated.visible }
          : s.mainEnabled
      }));
      return updated;
    } catch (err) {
      console.error('Errore updateMainCat:', err);
      throw err;
    }
  };

  const removeMainCat = async (key) => {
    const cat = state.customMainCats.find(c => c.key === key);
    if (!cat) return false;
    try {
      console.log('[removeMainCat] DELETE /categories/' + cat.id);
      await api.deleteCategory(token, cat.id);
      setState(s => {
        const next = {
          ...s,
          customMainCats: s.customMainCats.filter(c => c.key !== key),
          subcats: { ...s.subcats }
        };
        delete next.subcats[key]; // pulizia sottocategorie legate a quella main
        const { [key]: _drop, ...restEnabled } = s.mainEnabled || {};
        next.mainEnabled = restEnabled;
        return next;
      });
      return true;
    } catch (err) {
      console.error('Errore removeMainCat:', err);
      return false;
    }
  };

  // === FUNZIONI SUBCATS ===
  const addSubcat = async (main, obj) => {
    const cat = state.customMainCats.find(c => c.key === main);
    if (!cat) return;
    try {
      const created = await api.addSubCategory(token, {
        categoryId: cat.id,
        name: obj.name,
        iconKey: obj.iconKey || null
      });
      setState(s => ({
        ...s,
        subcats: { ...s.subcats, [main]: [...(s.subcats[main] || []), created] }
      }));
      return created;
    } catch (err) {
      console.error('Errore addSubcat:', err);
      throw err;
    }
  };

  const updateSubcat = async (main, id, patch) => {
    try {
      const updated = await api.updateSubCategory(token, id, patch);
      setState(s => ({
        ...s,
        subcats: {
          ...s.subcats,
          [main]: (s.subcats[main] || []).map(sc => sc.id === id ? { ...sc, ...updated } : sc)
        }
      }));
      return updated;
    } catch (err) {
      console.error('Errore updateSubcat:', err);
      throw err;
    }
  };

  const removeSubcat = async (main, id) => {
    try {
      console.log('[removeSubcat] DELETE /categories/sub/' + id);
      await api.deleteSubCategory(token, id);
      setState(s => ({
        ...s,
        subcats: { ...s.subcats, [main]: (s.subcats[main] || []).filter(sc => sc.id !== id) }
      }));
      return true;
    } catch (err) {
      console.error('Errore removeSubcat:', err);
      return false;
    }
  };


  /* === BUDGET === */
  const upsertBudget = (main, sub, value) =>
    setState(s => ({
      ...s,
      budgets: { ...s.budgets, [year]: { ...(s.budgets[year] || {}), [main + ':' + sub]: value } }
    }))

  /* === THEME === */
  const setTheme = (t) => setState(s => ({ ...s, theme: t }))

  /* === TRANSACTIONS === */
  const openAddTx = () => { setEditingTx(null); setTxModalOpen(true) }
  const openEditTx = (tx) => { setEditingTx(tx); setTxModalOpen(true) }

  const delTxApi = async (id) => {
    setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }))
    try { await api.deleteTransaction(token, id) } catch (err) {
      console.error('Errore delete tx:', err.message)
    }
  }

  const mainsForModal = useMemo(() => {
    const base = MAIN_CATS.map(m => ({
      ...m,
      enabled: state.mainEnabled[m.key] !== false
    }))
    const custom = state.customMainCats.map(c => ({
      ...c,
      enabled: state.mainEnabled[c.key] !== false
    }))
    const byKey = Object.fromEntries(base.map(m => [m.key, m]))
    for (const c of custom) byKey[c.key] = { ...(byKey[c.key] || {}), ...c }
    return Object.values(byKey)
  }, [state.customMainCats, state.mainEnabled])

  const tabProps = useMemo(() => ({
    dashboard: {
      state,
      year,
      onSelectMain: (key) => setDashDetail(prev => prev === key ? null : key),
      detailMain: dashDetail,
    },
    transactions: {
      state,
      delTx: delTxApi,
      openTxEditor: openEditTx,
    },
    categories: {
      state,
      addSubcat,
      updateSubcat,
      removeSubcat,
      updateMainCat,
      addMainCat,
      removeMainCat,
    },
    budgeting: {
      state,
      year,
      upsertBudget,
    },
  }), [state, year, dashDetail, setDashDetail, delTxApi, openEditTx, addSubcat, updateSubcat, removeSubcat, updateMainCat, addMainCat, removeMainCat, upsertBudget])

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Topbar */}
        <div className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/75 backdrop-blur border-b border-slate-200/20">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMenuOpen(true)}>
                <Layers3 />
              </button>
              <h1 className="text-lg md:text-2xl font-semibold">
                Bentornato/a {user ? <span className="text-teal-500">{user.name}</span> : 'Utente'}
              </h1>
              <Badge variant="secondary" className="ml-2">Anno: {year}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={state.theme === 'dark'} onCheckedChange={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')} />
              {state.theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
              {user && (
                <button className="border rounded-xl px-3 py-2" onClick={logout}>
                  <LogOut className="h-4 w-4 inline mr-2" /> Logout
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-3 md:p-6">
          {!user ? (
            <AuthScreens />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl">
                <div className="flex flex-wrap gap-2">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={
                        'px-3 py-2 rounded-xl text-sm transition ' +
                        (activeTab === key
                          ? 'bg-white dark:bg-slate-900 shadow border border-slate-200/40'
                          : 'hover:bg-white/40 dark:hover:bg-slate-900/40')
                      }>
                      {label}
                    </button>
                  ))}
                </div>

                <button onClick={openAddTx} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90">
                  <Plus className="h-4 w-4" /> Nuova Transazione
                </button>
              </div>

              <div className="mt-4">
                {activeTab === 'budgeting' && <Budgeting state={state} year={year} upsertBudget={upsertBudget} />}
                {tabs.map(({ key, component: Component }) => {
                  if (activeTab !== key) return null;
                  return <Component key={key} {...tabProps[key]} />;
                })}
              </div>
            </>
          )}
        </div>

        {/* Drawer menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-0 left-0 bottom-0 w-80 bg-slate-50 dark:bg-slate-950 p-4 overflow-auto">
              <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Layers3 className="h-5 w-5" /> Menu
              </div>
              <div className="space-y-3">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <NavItem
                    key={key}
                    icon={Icon}
                    label={label}
                    onClick={() => { setActiveTab(key); setMenuOpen(false) }}
                  />
                ))}
                <NavItem icon={User} label="Impostazioni (coming soon)" onClick={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Modale transazione */}
        <TransactionModal
          open={txModalOpen}
          onClose={() => { setTxModalOpen(false); setEditingTx(null) }}
          initial={editingTx}
          subcats={state.subcats}
          mains={mainsForModal}
          onSave={async (payload) => {
            const isEdit = Boolean(editingTx?.id)
            const body = {
              date: payload.date || new Date().toISOString(),
              amount: Number(payload.amount || 0),
              main: String(payload.main || 'EXPENSE').toUpperCase(),
              note: payload.note || '',
              payee: payload.payee || '',
              subId: payload.subId || null,
              subName: payload.sub || null
            }

            try {
              if (isEdit) {
                const updated = await api.updateTransaction(token, editingTx.id, body)
                const normalizedMain = normalizeMainKey(updated.main)
                const normalized = { ...updated, main: normalizedMain, sub: payload.sub || updated.subcategory?.name || '' }
                setState(s => ({ ...s, transactions: s.transactions.map(t => t.id === editingTx.id ? normalized : t) }))
              } else {
                const created = await api.addTransaction(token, body)
                const normalizedMain = normalizeMainKey(created.main)
                const normalized = { ...created, main: normalizedMain, sub: payload.sub || created.subcategory?.name || '' }
                setState(s => ({ ...s, transactions: [normalized, ...s.transactions] }))
              }
            } catch (err) {
              console.error('Errore save tx:', err.message)
            } finally {
              setTxModalOpen(false)
              setEditingTx(null)
            }
          }}
        />
      </div>
    </ToastProvider>
  )
}
