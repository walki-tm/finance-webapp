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
import React, { useMemo, useCallback, useState } from 'react'

// 🔸 Import providers e context
import { ToastProvider } from './features/toast'
import { useAuth } from './context/AuthContext.jsx'
import { BudgetProvider, useBudgetContext } from './context/BudgetContext.jsx'

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
import useTabState from './features/app/useTabState.js'
import { useBalance } from './features/app/useBalance.js'

// 🔸 Import icone
import { Layers3, LogOut, SunMedium, Moon, User, Plus, Settings } from 'lucide-react'

/**
 * 🎯 COMPONENTE: App Content (interno)
 * 
 * Contenuto principale dell'app che usa il BudgetContext
 */
function AppContent() {
  // 🔸 Hook per autenticazione e saldo
  const { user, logout, token } = useAuth()
  const { balance, isLoading: balanceLoading } = useBalance(token)

  // 🔸 Hook per UI e navigazione
  const { theme, toggleTheme } = useTheme()
  const year = String(new Date().getFullYear())
  const { budgets, upsertBudget, batchUpsertBudgets, isManagedAutomatically } = useBudgetContext()
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
    reorderSubcats,
  } = useCategories(token)

  // 🔸 Hook per gestione transazioni
  const {
    transactions,
    txModalOpen,
    editingTx,
    openAddTx,
    openEditTx,
    closeTxModal,
    delTx: originalDelTx,
    saveTx: originalSaveTx,
    refreshTransactions,
  } = useTransactions(token)
  
  // 🔸 Wrapper functions che includono refresh per sincronizzazione
  const delTx = useCallback(async (id) => {
    await originalDelTx(id);
    // Force refresh dopo delete
    setTimeout(() => {
      refreshTransactions();
      // Notifica componenti locali del cambiamento
      window.dispatchEvent(new CustomEvent('transactionRefresh'));
    }, 100);
  }, [originalDelTx, refreshTransactions]);
  
  const saveTx = useCallback(async (payload) => {
    await originalSaveTx(payload);
    // Force refresh dopo save
    setTimeout(() => {
      refreshTransactions();
      // Notifica componenti locali del cambiamento
      window.dispatchEvent(new CustomEvent('transactionRefresh'));
    }, 100);
  }, [originalSaveTx, refreshTransactions]);


  // 🔸 State consolidato per performance (memoized)
  const state = useMemo(() => ({
    theme,
    customMainCats,
    mainEnabled,
    subcats,
    budgets,
    transactions,
  }), [theme, customMainCats, mainEnabled, subcats, budgets, transactions])

  // 🔸 Funzione per navigare alle transazioni pianificate
  const navigateToPlanned = useCallback(() => {
    setActiveTab('transactions')
    // Aggiungi un piccolo delay per permettere al componente di renderizzarsi
    setTimeout(() => {
      // Il componente Transactions ora accetterà initialTab='planned'
      window.dispatchEvent(new CustomEvent('setPlannedTab', { detail: { tab: 'planned' } }))
    }, 100)
  }, [setActiveTab])

  // 🔸 Props per i tab components (memoized)
  const tabProps = useMemo(() => ({
    dashboard: {
      state,
      year,
      onSelectMain: (key) => setDashDetail(prev => prev === key ? null : key),
      detailMain: dashDetail,
      addTx: openAddTx, // Funzione per aggiungere transazioni dal dashboard
      onNavigateToPlanned: navigateToPlanned, // Navigazione al tab transazioni pianificate
    },
    transactions: {
      state,
      token,
      updateTx: saveTx, // Passa la funzione per aggiornare transazioni
      delTx,
      openTxEditor: openEditTx,
      refreshTransactions, // Aggiunta la funzione di refresh
      // Non passiamo initialTab qui perché deve essere dinamico
    },
    categories: {
      state,
      addSubcat,
      updateSubcat,
      removeSubcat,
      updateMainCat,
      addMainCat,
      removeMainCat,
      reorderSubcats,
    },
    budgeting: {
      state,
      year,
      upsertBudget,
      batchUpsertBudgets,
      isManagedAutomatically,
    },
    loans: {
      // LoansPage gestisce il suo stato internamente via useLoans hook
      // Potenzialmente aggiungere props comuni qui se necessario
    },
  }), [state, year, dashDetail, setDashDetail, setActiveTab, token, openAddTx, saveTx, delTx, openEditTx, refreshTransactions, addSubcat, updateSubcat, removeSubcat, updateMainCat, addMainCat, removeMainCat, upsertBudget, batchUpsertBudgets, isManagedAutomatically])

  return (
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
            {/* Saldo sempre visibile in topbar */}
            {user && (
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Saldo attuale</div>
                <div className={`text-sm font-semibold ${
                  Number(balance) < 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {balanceLoading ? 'Caricamento...' : (
                    balance !== null ? (Number(balance)).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
                    : 'Non disponibile'
                  )}
                </div>
              </div>
            )}
            
            
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
            <div className="flex flex-wrap gap-2 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl">
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
  );
}

/**
 * 🎯 COMPONENTE: App Principale
 * 
 * Wrappa l'AppContent con i provider necessari
 */
export default function App() {
  const year = String(new Date().getFullYear())
  
  return (
    <ToastProvider>
      <BudgetProvider year={year}>
        <AppContent />
      </BudgetProvider>
    </ToastProvider>
  )
}
