// src/App.jsx
// App principale: gestisce lo "stato globale" lato client (per ora su localStorage).
// Entità principali nello stato: User, Theme, Subcats (sottocategorie), Budgets, Transactions, CustomIcons.

import React, { useEffect, useState } from 'react';
import { Switch, Badge, Button, NavItem } from './components/ui.jsx';
import AuthScreens from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Categories from './pages/Categories.jsx';
import Budgeting from './pages/Budgeting.jsx';
import TransactionModal from './components/TransactionModal.jsx'; // <-- Modale riutilizzabile
import { saveState, loadState, uuid } from './lib/utils.js';
import { MAIN_CATS } from './lib/constants.js';
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

// Stato iniziale dell'app (dati mock su client). In futuro saranno sostituiti da API/DB.
const defaultData = () => ({
  user: null,        // Entità User: {name, email}
  theme: 'light',    // Tema iniziale: light
  customIcons: {},   // Icone custom definite dall'utente (es. emoji)
  // Entità Subcategories raggruppate per main
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
  budgets: {},       // Entità Budgets: per anno -> per (main:sub) = amount
  goals: {},         // Obiettivi (non usati ora)
  transactions: []   // Entità Transactions: [{id, main, sub, amount, date, note}, ...]
});

export default function App() {
  // Stato applicazione (persistito su localStorage)
  const [state, setState] = useState(defaultData());

  // UI: quale tab è attivo
  const [activeTab, setActiveTab] = useState('dashboard');

  // UI: apertura menu laterale
  const [menuOpen, setMenuOpen] = useState(false);

  // UI: dettaglio dashboard (quale main è selezionata)
  const [dashDetail, setDashDetail] = useState(null);

  // Utility: anno corrente (usato come chiave per i budget)
  const year = String(new Date().getFullYear());

  // All'avvio carico lo stato da localStorage (se presente)
  useEffect(() => {
    const s = loadState();
    setState(s || defaultData());
  }, []);

  // Ogni volta che cambia lo stato:
  // - aggiorno la classe "dark" sul <html> in base al tema
  // - salvo lo stato su localStorage (persistenza client)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    saveState(state);
  }, [state]);

  // ====== Mutations sullo stato (simulate, in futuro chiameranno API) ======

  // Tema (light/dark)
  const setTheme = (t) => setState((s) => ({ ...s, theme: t }));

  // Login/Logout utente
  const setUser = (u) => setState((s) => ({ ...s, user: u }));

  // CRUD Sottocategorie
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

  // Upsert Budget (entità Budget) per anno corrente
  const upsertBudget = (main, sub, value) =>
    setState((s) => ({
      ...s,
      budgets: {
        ...s.budgets,
        [year]: { ...(s.budgets[year] || {}), [main + ':' + sub]: value }
      }
    }));

  // CRUD Transazioni (entità Transaction)
  const addTx = (tx) =>
    setState((s) => ({ ...s, transactions: [{ id: uuid(), ...tx }, ...s.transactions] }));
  const updateTx = (id, patch) =>
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t))
    }));
  const delTx = (id) =>
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));

  // Icone custom (entità CustomIcons)
  const addCustomIcon = (key, emoji) =>
    setState((s) => ({ ...s, customIcons: { ...s.customIcons, [key]: emoji } }));

  // ====== Modale riutilizzabile per Aggiungi/Modifica Transazione ======

  // Stato UI modale transazione
  const [txModalOpen, setTxModalOpen] = useState(false);  // visibilità modale
  const [editingTx, setEditingTx] = useState(null);       // se presente, è una edit; se null, aggiunta

  // Apri modale in modalità "aggiungi"
  function openAddTx() {
    setEditingTx(null);
    setTxModalOpen(true);
  }

  // Apri modale in modalità "modifica" passando la transazione selezionata
  function openEditTx(tx) {
    setEditingTx(tx);
    setTxModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Topbar con saluto, anno, tema e logout */}
      <div className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/75 backdrop-blur border-b border-slate-200/20">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
          {/* Sezione sinistra: menu + saluto + anno */}
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
              {state.user ? <span className="text-teal-500">{state.user.name}</span> : 'Utente'}
            </h1>

            <Badge variant="secondary" className="ml-2">
              Anno: {year}
            </Badge>
          </div>

          {/* Sezione destra: tema (light/dark) e logout */}
          <div className="flex items-center gap-2">
            <Switch
              checked={state.theme === 'dark'}
              onCheckedChange={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
            />
            {state.theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}

            {state.user && (
              <button
                className="border rounded-xl px-3 py-2"
                onClick={() => setUser(null)}
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
        {!state.user ? (
          // Schermata di autenticazione (demo client-side)
          <AuthScreens onLogin={(u) => setUser(u)} />
        ) : (
          <>
            {/* Barra dei tab + bottone "+" a destra per "Nuova transazione" */}
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

              {/* Bottone "+" che apre la modale in modalità "aggiungi" */}
              <button
                onClick={openAddTx}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Nuova
              </button>
            </div>

            {/* Contenuto del tab selezionato */}
            <div className="mt-4">
              {activeTab === 'dashboard' && (
                <Dashboard
                  state={state}
                  year={year}
                  onSelectMain={(key) => setDashDetail((prev) => (prev === key ? null : key))}
                  detailMain={dashDetail}
                  addTx={addTx} // la Dashboard può comunque aggiungere transazioni (quick add locale)
                />
              )}

              {/* Passo openTxEditor per poter aprire la modale in modalità "modifica" dalla tabella */}
              {activeTab === 'transactions' && (
                <Transactions
                  state={state}
                  updateTx={updateTx}
                  delTx={delTx}
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
                />
              )}

              {activeTab === 'budgeting' && (
                <Budgeting state={state} year={year} upsertBudget={upsertBudget} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Menu laterale (drawer) */}
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
                onClick={() => {
                  setActiveTab('dashboard');
                  setMenuOpen(false);
                }}
              />
              <NavItem
                icon={TrendingUp}
                label="Transazioni"
                onClick={() => {
                  setActiveTab('transactions');
                  setMenuOpen(false);
                }}
              />
              <NavItem
                icon={SettingsIcon}
                label="Categorie"
                onClick={() => {
                  setActiveTab('categories');
                  setMenuOpen(false);
                }}
              />
              <NavItem
                icon={CalendarDays}
                label="Budgeting"
                onClick={() => {
                  setActiveTab('budgeting');
                  setMenuOpen(false);
                }}
              />
              <NavItem icon={User} label="Impostazioni (coming soon)" onClick={() => setMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modale centrale per Aggiungi/Modifica Transazione */}
      <TransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={(payload) => {
          // Se c'è una transazione in editing → update; altrimenti → add
          if (editingTx) updateTx(editingTx.id, payload);
          else addTx(payload);
          setTxModalOpen(false);
        }}
        subcats={state.subcats}
        initial={editingTx}
        MAIN_CATS={MAIN_CATS}
      />
    </div>
  );
}
