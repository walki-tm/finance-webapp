/**
 * 📄 APP PRINCIPALE: Finance WebApp - Componente Root
 * 
 * 🎯 Scopo: Componente principale dell'applicazione che gestisce:
 * - Autenticazione utente
 * - Layout e navigazione
 * - State management globale
 * - Routing tra le diverse sezioni
 * 
 * 🔧 Dipendenze principali:
 * - React per UI e state management
 * - Lucide React per icone
 * - Context API per auth state
 * - Custom hooks per business logic
 * 
 * 📝 Note:
 * - Supporta tema dark/light
 * - Layout responsive con drawer menu
 * - State centralizzato per performance
 * - Lazy loading dei componenti tabs
 * 
 * @author Finance WebApp Team
 * @modified 19 Gennaio 2025 - Aggiunta documentazione e migliorata struttura
 */

// 🔸 Import core React
import React, { useMemo } from 'react'

// 🔸 Import providers e context
import { ToastProvider } from './features/toast'
import { useAuth } from './context/AuthContext.jsx'

// 🔸 Import componenti UI
import { Switch, Badge, NavItem } from './components/ui'
import AuthScreens from './features/auth/pages/Auth.jsx'
import TransactionModal from './features/transactions/components/TransactionModal.jsx'

// 🔸 Import utilities e configurazioni
import { tabs } from './lib/tabs.js'

// 🔸 Import custom hooks per business logic
import useCategories from './features/categories/useCategories.js'
import useTransactions from './features/transactions/useTransactions.js'
import useTheme from './features/app/useTheme.js'
import useBudgets from './features/app/useBudgets.js'
import useTabState from './features/app/useTabState.js'

// 🔸 Import icone
import { Layers3, LogOut, SunMedium, Moon, User, Plus } from 'lucide-react'

/**
 * 🎯 COMPONENTE: App Principale
 * 
 * Gestisce tutto lo state globale dell'applicazione e orchestra
 * l'interazione tra i diversi moduli/feature.
 */
export default function App() {
  // 🔸 Hook per autenticazione
  const { user, logout, token } = useAuth()

  // 🔸 Hook per UI e navigazione
  const { theme, toggleTheme } = useTheme()
  const year = String(new Date().getFullYear())
  const { budgets, upsertBudget } = useBudgets(year)
  const { activeTab, setActiveTab, menuOpen, setMenuOpen, dashDetail, setDashDetail } = useTabState()

  // 🔸 Hook per gestione categorie
  const {
    customMainCats,
    subcats,
    mainEnabled,
    mainsForModal,
    addMainCat,
    updateMainCat,
    removeMainCat,
    addSubcat,
    updateSubcat,
    removeSubcat,
  } = useCategories(token)

  // 🔸 Hook per gestione transazioni
  const {
    transactions,
    txModalOpen,
    editingTx,
    openAddTx,
    openEditTx,
    closeTxModal,
    delTx,
    saveTx,
  } = useTransactions(token)

  // 🔸 State consolidato per performance (memoized)
  const state = useMemo(() => ({
    theme,
    customMainCats,
    mainEnabled,
    subcats,
    budgets,
    transactions,
  }), [theme, customMainCats, mainEnabled, subcats, budgets, transactions])

  // 🔸 Props per i tab components (memoized)
  const tabProps = useMemo(() => ({
    dashboard: {
      state,
      year,
      onSelectMain: (key) => setDashDetail(prev => prev === key ? null : key),
      detailMain: dashDetail,
    },
    transactions: {
      state,
      delTx,
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
  }), [state, year, dashDetail, delTx, openEditTx, addSubcat, updateSubcat, removeSubcat, updateMainCat, addMainCat, removeMainCat, upsertBudget])

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
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
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
                    onClick={() => { setActiveTab(key); setMenuOpen(false); }}
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
          onClose={closeTxModal}
          initial={editingTx}
          subcats={subcats}
          mains={mainsForModal}
          onSave={saveTx}
        />
      </div>
    </ToastProvider>
  );
}
