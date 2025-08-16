// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Switch, Badge, Button, NavItem } from './components/ui.jsx';
import AuthScreens from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Categories from './pages/Categories.jsx';
import Budgeting from './pages/Budgeting.jsx';
import TransactionModal from './components/TransactionModal.jsx';
import { saveState, loadState, uuid } from './lib/utils.js';
import { MAIN_CATS } from './lib/constants.js';
import { useAuth } from './context/AuthContext.jsx';
import { api } from './lib/api';

import {
  Layers3,
  LogOut,
  SunMedium,
  Moon,
  BarChart3,
  TrendingUp,
  Settings as SettingsIcon,
  CalendarDays,
  User,
  Plus
} from 'lucide-react';

// Stato iniziale mock (resta locale per ora)
const defaultData = () => ({
  user: null,
  theme: 'light',
  customIcons: {},
  customMainCats: [],
  mainEnabled: {
    income: true,
    expense: true,
    debt: true,
    saving: true
  },
  subcats: {
    income: [
      { name: 'Stipendio', iconKey: 'earn' },
      { name: 'Tredicesima', iconKey: 'wallet' },
      { name: 'Bonus', iconKey: 'briefcase' }
    ],
    expense: [
      { name: 'Alimentari', iconKey: 'cart' },
      { name: 'Affitto', iconKey: 'building' },
      { name: 'Benzina', iconKey: 'car' },
      { name: 'Svago', iconKey: 'gamepad' }
    ],
    debt: [
      { name: 'Prestito', iconKey: 'card' },
      { name: 'Carta', iconKey: 'card' }
    ],
    saving: [
      { name: 'Fondo Emergenza', iconKey: 'piggy' },
      { name: 'PAC ETF', iconKey: 'money' }
    ]
  },
  budgets: {},
  goals: {},
  transactions: []
});

export default function App() {
  const { user, logout, token } = useAuth();

  const [state, setState] = useState(defaultData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashDetail, setDashDetail] = useState(null);

  // supporto EDIT
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const year = String(new Date().getFullYear());

  // Carica stato locale alla prima render
  useEffect(() => {
    const s = loadState();
    setState(s || defaultData());
  }, []);

  // Persistenza tema + stato mock
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    saveState(state);
  }, [state]);

  // === CARICA TRANSIZIONI REALI QUANDO LOGGATO ===
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1; // 1..12
        const txs = await api.listTransactions(token, y, m);

        const mapDown = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving' };
        const normalized = (txs || []).map(t => ({
          ...t,
          main: mapDown[t.main] || 'expense',
          // porta sempre giù il nome sub per tabella/icone
          sub: t.subcategory?.name || t.sub || '',
          subId: t.subId || null,
        }));
        setState(s => ({ ...s, transactions: normalized }));
      } catch (err) {
        console.error('Errore caricamento transazioni:', err.message);
      }
    })();
  }, [token]);

  const mainsForModal = useMemo(() => {
    const core = MAIN_CATS.map(m => ({
      ...m,
      enabled: state.mainEnabled?.[m.key] !== false,
    }));
    const custom = (state.customMainCats || []).map(c => ({
      ...c,
      enabled: state.mainEnabled?.[c.key] !== false,
    }));
    const byKey = Object.fromEntries(core.map(m => [m.key, m]));
    for (const c of custom) byKey[c.key] = { ...(byKey[c.key] || {}), ...c };
    return Object.values(byKey);
  }, [state.mainEnabled, state.customMainCats]);

  // Mutations (ancora locali per categorie/budget)
  const setTheme = (t) => setState((s) => ({ ...s, theme: t }));

  const addSubcat = (main, obj) =>
    setState((s) => ({
      ...s,
      subcats: { ...s.subcats, [main]: [...(s.subcats[main] || []), obj] }
    }));
  const updateSubcat = (main, oldName, patch) =>
    setState((s) => ({
      ...s,
      subcats: {
        ...s.subcats,
        [main]: (s.subcats[main] || []).map((sc) =>
          sc.name === oldName ? { ...sc, ...patch } : sc
        )
      }
    }));
  const removeSubcat = (main, name) =>
    setState((s) => ({
      ...s,
      subcats: {
        ...s.subcats,
        [main]: (s.subcats[main] || []).filter((sc) => sc.name !== name)
      }
    }));

  const updateMainCat = (key, patch) =>
    setState((s) => {
      const nextEnabled =
        patch.enabled !== undefined
          ? { ...s.mainEnabled, [key]: patch.enabled }
          : s.mainEnabled;

      const idx = (s.customMainCats || []).findIndex(c => c.key === key);
      let nextCustom = [...(s.customMainCats || [])];

      const hasOvProps = ('name' in patch) || ('color' in patch);
      if (hasOvProps) {
        if (idx >= 0) nextCustom[idx] = { ...nextCustom[idx], ...patch, key };
        else nextCustom.push({ key, name: patch.name, color: patch.color });
      }

      return { ...s, mainEnabled: nextEnabled, customMainCats: nextCustom };
    });

  const addMainCat = (obj) =>
    setState((s) => ({
      ...s,
      customMainCats: [...(s.customMainCats || []), obj],
      mainEnabled: { ...(s.mainEnabled || {}), [obj.key]: true },
    }));

  const removeMainCat = (key) =>
    setState((s) => {
      if (MAIN_CATS.some((m) => m.key === key)) return s;
      const { [key]: _omit, ...restEnabled } = s.mainEnabled || {};
      return {
        ...s,
        customMainCats: (s.customMainCats || []).filter((c) => c.key !== key),
        mainEnabled: restEnabled,
      };
    });

  const upsertBudget = (main, sub, value) =>
    setState((s) => ({
      ...s,
      budgets: {
        ...s.budgets,
        [year]: { ...(s.budgets[year] || {}), [main + ':' + sub]: value }
      }
    }));

  // --- Transazioni: add/update locali (per compat), delete via API ---
  const addTx = (tx) =>
    setState((s) => ({ ...s, transactions: [{ id: uuid(), ...tx }, ...s.transactions] }));
  const updateTx = (id, patch) =>
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t))
    }));

  // delete ottimistico + API
  const delTxApi = async (id) => {
    setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
    try {
      if (token) await api.deleteTransaction(token, id);
    } catch (err) {
      console.error('Errore cancellazione transazione:', err.message);
      // eventuale rollback se vuoi
    }
  };

  const addCustomIcon = (key, emoji) =>
    setState((s) => ({ ...s, customIcons: { ...s.customIcons, [key]: emoji } }));

  function openAddTx() {
    setEditingTx(null);
    setTxModalOpen(true);
  }
  function openEditTx(tx) {
    setEditingTx(tx);
    setTxModalOpen(true);
  }

  // Helpers mapping main
  const mainUp = { income: 'INCOME', expense: 'EXPENSE', debt: 'DEBT', saving: 'SAVINGS' };
  const mainDown = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving' };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/75 backdrop-blur border-b border-slate-200/20">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(true)}
              aria-label="Apri menu"
            >
              <Layers3 />
            </button>

            <h1 className="text-lg md:text-2xl font-semibold">
              Bentornato/a{' '}
              {user ? <span className="text-teal-500">{user.email}</span> : 'Utente'}
            </h1>

            <Badge variant="secondary" className="ml-2">
              Anno: {year}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={state.theme === 'dark'}
              onCheckedChange={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
            />
            {state.theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}

            {user && (
              <button
                className="border rounded-xl px-3 py-2"
                onClick={logout}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 inline mr-2" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Corpo pagina */}
      <div className="max-w-7xl mx-auto p-3 md:p-6">
        {!user ? (
          <AuthScreens />
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl">
              <div className="flex flex-wrap gap-2">
                {['dashboard', 'transactions', 'categories', 'budgeting'].map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={
                      'px-3 py-2 rounded-xl text-sm transition ' +
                      (activeTab === k
                        ? 'bg-white dark:bg-slate-900 shadow border border-slate-200/40'
                        : 'hover:bg-white/40 dark:hover:bg-slate-900/40')
                    }
                  >
                    {{
                      dashboard: 'Dashboard',
                      transactions: 'Transazioni',
                      categories: 'Categorie',
                      budgeting: 'Budgeting'
                    }[k]}
                  </button>
                ))}
              </div>

              <button
                onClick={openAddTx}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Nuova Transazione
              </button>
            </div>

            <div className="mt-4">
              {activeTab === 'dashboard' && (
                <Dashboard
                  state={state}
                  year={year}
                  onSelectMain={(key) => setDashDetail((prev) => (prev === key ? null : key))}
                  detailMain={dashDetail}
                  addTx={addTx}
                />
              )}

              {activeTab === 'transactions' && (
                <Transactions
                  state={state}
                  updateTx={updateTx}
                  delTx={delTxApi}
                  openTxEditor={openEditTx}
                />
              )}

              {activeTab === 'categories' && (
                <Categories
                  state={state}
                  addSubcat={addSubcat}
                  updateSubcat={updateSubcat}
                  removeSubcat={removeSubcat}
                  addCustomIcon={addCustomIcon}
                  updateMainCat={updateMainCat}
                  addMainCat={addMainCat}
                  removeMainCat={removeMainCat}
                />
              )}

              {activeTab === 'budgeting' && (
                <Budgeting state={state} year={year} upsertBudget={upsertBudget} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Menu laterale */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-slate-50 dark:bg-slate-950 p-4 overflow-auto">
            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Layers3 className="h-5 w-5" /> Menu
            </div>

            <div className="space-y-3">
              <NavItem
                icon={BarChart3}
                label="Dashboard"
                onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
              />
              <NavItem
                icon={TrendingUp}
                label="Transazioni"
                onClick={() => { setActiveTab('transactions'); setMenuOpen(false); }}
              />
              <NavItem
                icon={SettingsIcon}
                label="Categorie"
                onClick={() => { setActiveTab('categories'); setMenuOpen(false); }}
              />
              <NavItem
                icon={CalendarDays}
                label="Budgeting"
                onClick={() => { setActiveTab('budgeting'); setMenuOpen(false); }}
              />
              <NavItem icon={User} label="Impostazioni (coming soon)" onClick={() => setMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modale transazione */}
      <TransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        initial={editingTx}
        subcats={state.subcats}
        mains={mainsForModal}
        onSave={async (payload) => {
          const isEdit = Boolean(editingTx?.id);

          // corpo comune per API
          const body = {
            date: payload.date || new Date().toISOString(),
            amount: Number(payload.amount || 0),
            main: mainUp[payload.main] || 'EXPENSE',
            note: payload.note || '',
            payee: payload.payee || '',
            // Se hai la risoluzione client di subId, valorizzala qui; altrimenti resta null.
            subId: payload.subId || null
          };

          try {
            if (!token) {
              // solo locale (demo)
              if (isEdit) {
                updateTx(editingTx.id, {
                  main: payload.main,
                  sub: payload.sub,
                  date: payload.date,
                  amount: payload.amount,
                  note: payload.note
                });
              } else {
                addTx(payload);
              }
              return;
            }

            if (isEdit) {
              // 1) Se esiste updateTransaction nel client API, usala
              if (typeof api.updateTransaction === 'function') {
                const updated = await api.updateTransaction(token, editingTx.id, body);
                const normalized = {
                  ...updated,
                  main: mainDown[updated.main] || 'expense',
                  sub: payload.sub || updated.subcategory?.name || '' // garantisco sub in UI
                };
                setState(s => ({
                  ...s,
                  transactions: s.transactions.map(t => t.id === editingTx.id ? normalized : t)
                }));
              } else {
                // 2) fallback: DELETE + POST (mantengo UI coerente sostituendo il record)
                const oldId = editingTx.id;
                // Ottimista: aggiorno subito i campi visibili
                setState(s => ({
                  ...s,
                  transactions: s.transactions.map(t =>
                    t.id === oldId
                      ? { ...t, main: payload.main, sub: payload.sub, date: payload.date, amount: payload.amount, note: payload.note }
                      : t
                  )
                }));

                try {
                  await api.deleteTransaction(token, oldId);
                } catch (e) {
                  console.error('Delete in fallback edit fallita:', e.message);
                }

                const created = await api.addTransaction(token, body);
                const normalized = {
                  ...created,
                  main: mainDown[created.main] || 'expense',
                  sub: payload.sub || '' // mostro subito il nome scelto
                };

                // sostituisco l'item (stessa posizione) scambiando l'id
                setState(s => ({
                  ...s,
                  transactions: s.transactions.map(t => (t.id === oldId ? normalized : t))
                }));
              }
            } else {
              // ADD
              const created = await api.addTransaction(token, body);
              const normalized = {
                ...created,
                main: mainDown[created.main] || 'expense',
                sub: payload.sub || created.subcategory?.name || '' // assicuro il nome in UI
              };
              setState(s => ({ ...s, transactions: [normalized, ...(s.transactions || [])] }));
            }
          } catch (err) {
            console.error('Errore salvataggio transazione:', err.message);
            // fallback locale per non perdere il dato in UI
            if (isEdit) {
              updateTx(editingTx.id, {
                main: payload.main,
                sub: payload.sub,
                date: payload.date,
                amount: payload.amount,
                note: payload.note
              });
            } else {
              addTx(payload);
            }
          } finally {
            setTxModalOpen(false);
            setEditingTx(null);
          }
        }}
      />
    </div>
  );
}
