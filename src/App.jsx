// // src/App.jsx
// import React, { useEffect, useMemo, useState } from 'react'
// import { Switch, Badge, NavItem } from './components/ui.jsx'
// import AuthScreens from './pages/Auth.jsx'
// import Dashboard from './pages/Dashboard.jsx'
// import Transactions from './pages/Transactions.jsx'
// import Categories from './pages/Categories.jsx'
// import Budgeting from './pages/Budgeting.jsx'
// import TransactionModal from './components/TransactionModal.jsx'
// import { saveState, loadState, uuid } from './lib/utils.js'
// import { MAIN_CATS } from './lib/constants.js'
// import { useAuth } from './context/AuthContext.jsx'
// import { api } from './lib/api'

// import {
//   Layers3, LogOut, SunMedium, Moon, BarChart3, TrendingUp,
//   Settings as SettingsIcon, CalendarDays, User, Plus
// } from 'lucide-react'

// // Stato iniziale (fallback locale)
// const defaultData = () => ({
//   user: null,
//   theme: 'light',
//   customIcons: {},
//   customMainCats: [],          // override MAIN (nome/colore/icona) da DB
//   mainEnabled: { income: true, expense: true, debt: true, saving: true },
//   subcats: { income: [], expense: [], debt: [], saving: [] }, // verranno popolati da DB
//   budgets: {},
//   goals: {},
//   transactions: []
// })

// export default function App() {
//   const { user, logout, token } = useAuth()

//   const [state, setState] = useState(defaultData())
//   const [activeTab, setActiveTab] = useState('dashboard')
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [dashDetail, setDashDetail] = useState(null)

//   // Modale transazione (aggiungi/modifica)
//   const [txModalOpen, setTxModalOpen] = useState(false)
//   const [editingTx, setEditingTx] = useState(null)

//   const year = String(new Date().getFullYear())

//   // Bootstrap locale
//   useEffect(() => {
//     const s = loadState()
//     setState(s || defaultData())
//   }, [])

//   // Persistenza tema + snapshot locale
//   useEffect(() => {
//     document.documentElement.classList.toggle('dark', state.theme === 'dark')
//     saveState(state)
//   }, [state])

//   // Helpers main <-> enum
//   const mainDown = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving' }
//   const mainUp   = { income: 'INCOME', expense: 'EXPENSE', debt: 'DEBT', saving: 'SAVINGS' }

//   // === Carica CATEGORIE (MAIN + SUB) all'accesso (icone incluse) ===
//   useEffect(() => {
//     if (!token) return
//     ;(async () => {
//       try {
//         const cats = await api.listCategories(token) // include: subcats[]
//         // costruisco subcats per main e override delle MAIN (nome/colore/icona)
//         const subByMain = { income: [], expense: [], debt: [], saving: [] }
//         const customMainCats = []

//         for (const c of cats) {
//           const key = mainDown[c.main] || 'expense'
//           // override MAIN (nome/colore/icona) dalla tabella Category
//           customMainCats.push({
//             key,
//             name: c.name,
//             color: c.colorHex || MAIN_CATS.find(m => m.key === key)?.color,
//             iconKey: c.iconKey || undefined
//           })
//           // subcats con iconKey e id (serve per render tabella e mapping rapido)
//           for (const sc of (c.subcats || [])) {
//             subByMain[key].push({
//               id: sc.id,
//               name: sc.name,
//               iconKey: sc.iconKey || null
//             })
//           }
//         }

//         setState(s => ({
//           ...s,
//           customMainCats,
//           subcats: subByMain
//         }))
//       } catch (err) {
//         console.error('Errore caricamento categorie:', err.message)
//       }
//     })()
//   }, [token])

//   // === Carica TRANSIZIONI reali ===
//   useEffect(() => {
//     if (!token) return
//     ;(async () => {
//       try {
//         const now = new Date()
//         const txs = await api.listTransactions(token, now.getFullYear(), now.getMonth() + 1)
//         const normalized = (txs || []).map(t => ({
//           ...t,
//           main: mainDown[t.main] || 'expense',
//           sub: t.subcategory?.name || '',      // nome sub per tabella
//           subId: t.subId || null               // id sub
//         }))
//         setState(s => ({ ...s, transactions: normalized }))
//       } catch (err) {
//         console.error('Errore caricamento transazioni:', err.message)
//       }
//     })()
//   }, [token])

//   // MAIN da mostrare (core + override da DB, con enabled)
//   const mainsForModal = useMemo(() => {
//     const core = MAIN_CATS.map(m => ({
//       ...m,
//       enabled: state.mainEnabled?.[m.key] !== false
//     }))
//     const custom = (state.customMainCats || []).map(c => ({
//       ...c,
//       enabled: state.mainEnabled?.[c.key] !== false
//     }))
//     const byKey = Object.fromEntries(core.map(m => [m.key, m]))
//     for (const c of custom) byKey[c.key] = { ...(byKey[c.key] || {}), ...c }
//     return Object.values(byKey)
//   }, [state.mainEnabled, state.customMainCats])

//   // Mutations locali per categorie/budget (UI)
//   const setTheme = (t) => setState((s) => ({ ...s, theme: t }))

//   const addSubcat = (main, obj) =>
//     setState((s) => ({ ...s, subcats: { ...s.subcats, [main]: [...(s.subcats[main] || []), obj] } }))

//   const updateSubcat = (main, oldName, patch) =>
//     setState((s) => ({
//       ...s,
//       subcats: {
//         ...s.subcats,
//         [main]: (s.subcats[main] || []).map((sc) => sc.name === oldName ? { ...sc, ...patch } : sc)
//       }
//     }))

//   const removeSubcat = (main, name) =>
//     setState((s) => ({
//       ...s,
//       subcats: { ...s.subcats, [main]: (s.subcats[main] || []).filter((sc) => sc.name !== name) }
//     }))

//   const updateMainCat = (key, patch) =>
//     setState((s) => {
//       const nextEnabled = patch.enabled !== undefined ? { ...s.mainEnabled, [key]: patch.enabled } : s.mainEnabled
//       const idx = (s.customMainCats || []).findIndex(c => c.key === key)
//       const nextCustom = [...(s.customMainCats || [])]
//       const hasOvProps = ('name' in patch) || ('color' in patch) || ('iconKey' in patch)
//       if (hasOvProps) {
//         if (idx >= 0) nextCustom[idx] = { ...nextCustom[idx], ...patch, key }
//         else nextCustom.push({ key, name: patch.name, color: patch.color, iconKey: patch.iconKey })
//       }
//       return { ...s, mainEnabled: nextEnabled, customMainCats: nextCustom }
//     })

//   const addMainCat = (obj) =>
//     setState((s) => ({
//       ...s,
//       customMainCats: [...(s.customMainCats || []), obj],
//       mainEnabled: { ...(s.mainEnabled || {}), [obj.key]: true },
//     }))

//   const removeMainCat = (key) =>
//     setState((s) => {
//       if (MAIN_CATS.some((m) => m.key === key)) return s
//       const { [key]: _omit, ...restEnabled } = s.mainEnabled || {}
//       return { ...s, customMainCats: (s.customMainCats || []).filter((c) => c.key !== key), mainEnabled: restEnabled }
//     })

//   const upsertBudget = (main, sub, value) =>
//     setState((s) => ({
//       ...s,
//       budgets: { ...s.budgets, [year]: { ...(s.budgets[year] || {}), [main + ':' + sub]: value } }
//     }))

//   // Compat locale
//   const addTx = (tx) => setState((s) => ({ ...s, transactions: [{ id: uuid(), ...tx }, ...s.transactions] }))
//   const updateTx = (id, patch) =>
//     setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))

//   // Delete ottimistico + API
//   const delTxApi = async (id) => {
//     setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }))
//     try { if (token) await api.deleteTransaction(token, id) } catch (err) {
//       console.error('Errore cancellazione transazione:', err.message)
//     }
//   }

//   const addCustomIcon = (key, emoji) =>
//     setState((s) => ({ ...s, customIcons: { ...s.customIcons, [key]: emoji } }))

//   function openAddTx() { setEditingTx(null); setTxModalOpen(true) }
//   function openEditTx(tx) { setEditingTx(tx); setTxModalOpen(true) }

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
//       {/* Topbar */}
//       <div className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/75 backdrop-blur border-b border-slate-200/20">
//         <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <button className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMenuOpen(true)} aria-label="Apri menu">
//               <Layers3 />
//             </button>
//             <h1 className="text-lg md:text-2xl font-semibold">
//               Bentornato/a {user ? <span className="text-teal-500">{user.email}</span> : 'Utente'}
//             </h1>
//             <Badge variant="secondary" className="ml-2">Anno: {year}</Badge>
//           </div>
//           <div className="flex items-center gap-2">
//             <Switch checked={state.theme === 'dark'} onCheckedChange={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')} />
//             {state.theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
//             {user && (
//               <button className="border rounded-xl px-3 py-2" onClick={logout} aria-label="Logout">
//                 <LogOut className="h-4 w-4 inline mr-2" /> Logout
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Corpo */}
//       <div className="max-w-7xl mx-auto p-3 md:p-6">
//         {!user ? (
//           <AuthScreens />
//         ) : (
//           <>
//             <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl">
//               <div className="flex flex-wrap gap-2">
//                 {['dashboard', 'transactions', 'categories', 'budgeting'].map((k) => (
//                   <button
//                     key={k}
//                     onClick={() => setActiveTab(k)}
//                     className={
//                       'px-3 py-2 rounded-xl text-sm transition ' +
//                       (activeTab === k ? 'bg-white dark:bg-slate-900 shadow border border-slate-200/40'
//                                        : 'hover:bg-white/40 dark:hover:bg-slate-900/40')
//                     }>
//                     {{ dashboard: 'Dashboard', transactions: 'Transazioni', categories: 'Categorie', budgeting: 'Budgeting' }[k]}
//                   </button>
//                 ))}
//               </div>

//               <button onClick={openAddTx} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90">
//                 <Plus className="h-4 w-4" /> Nuova Transazione
//               </button>
//             </div>

//             <div className="mt-4">
//               {activeTab === 'dashboard' && (
//                 <Dashboard
//                   state={state}
//                   year={year}
//                   onSelectMain={(key) => setDashDetail((prev) => (prev === key ? null : key))}
//                   detailMain={dashDetail}
//                   addTx={addTx}
//                 />
//               )}

//               {activeTab === 'transactions' && (
//                 <Transactions
//                   state={state}
//                   updateTx={updateTx}
//                   delTx={delTxApi}
//                   openTxEditor={openEditTx}
//                 />
//               )}

//               {activeTab === 'categories' && (
//                 <Categories
//                   state={state}
//                   addSubcat={addSubcat}
//                   updateSubcat={updateSubcat}
//                   removeSubcat={removeSubcat}
//                   addCustomIcon={addCustomIcon}
//                   updateMainCat={updateMainCat}
//                   addMainCat={addMainCat}
//                   removeMainCat={removeMainCat}
//                 />
//               )}

//               {activeTab === 'budgeting' && <Budgeting state={state} year={year} upsertBudget={upsertBudget} />}
//             </div>
//           </>
//         )}
//       </div>

//       {/* Drawer menu */}
//       {menuOpen && (
//         <div className="fixed inset-0 z-50">
//           <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
//           <div className="absolute top-0 left-0 bottom-0 w-80 bg-slate-50 dark:bg-slate-950 p-4 overflow-auto">
//             <div className="flex items-center gap-2 text-lg font-semibold mb-4">
//               <Layers3 className="h-5 w-5" /> Menu
//             </div>
//             <div className="space-y-3">
//               <NavItem icon={BarChart3}  label="Dashboard"  onClick={() => { setActiveTab('dashboard'); setMenuOpen(false) }} />
//               <NavItem icon={TrendingUp} label="Transazioni" onClick={() => { setActiveTab('transactions'); setMenuOpen(false) }} />
//               <NavItem icon={SettingsIcon} label="Categorie"   onClick={() => { setActiveTab('categories'); setMenuOpen(false) }} />
//               <NavItem icon={CalendarDays} label="Budgeting"   onClick={() => { setActiveTab('budgeting'); setMenuOpen(false) }} />
//               <NavItem icon={User} label="Impostazioni (coming soon)" onClick={() => setMenuOpen(false)} />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modale transazione */}
//       <TransactionModal
//         open={txModalOpen}
//         onClose={() => { setTxModalOpen(false); setEditingTx(null) }}
//         initial={editingTx}
//         subcats={state.subcats}
//         mains={mainsForModal}
//         onSave={async (payload) => {
//           const isEdit = Boolean(editingTx?.id)

//           // corpo per API: mando SEMPRE anche subName; il server risolve subId se mancante
//           const body = {
//             date: payload.date || new Date().toISOString(),
//             amount: Number(payload.amount || 0),
//             main: mainUp[payload.main] || 'EXPENSE',
//             note: payload.note || '',
//             payee: payload.payee || '',
//             subId: payload.subId || null,
//             subName: payload.sub || null
//           }

//           try {
//             if (!token) {
//               // locale
//               if (isEdit) {
//                 updateTx(editingTx.id, { main: payload.main, sub: payload.sub, date: payload.date, amount: payload.amount, note: payload.note })
//               } else {
//                 addTx(payload)
//               }
//               return
//             }

//             if (isEdit && typeof api.updateTransaction === 'function') {
//               const updated = await api.updateTransaction(token, editingTx.id, body)
//               const normalized = {
//                 ...updated,
//                 main: mainDown[updated.main] || 'expense',
//                 sub: payload.sub || updated.subcategory?.name || ''
//               }
//               setState(s => ({ ...s, transactions: s.transactions.map(t => t.id === editingTx.id ? normalized : t) }))
//             } else if (isEdit) {
//               // fallback: DELETE + ADD (mantengo la riga in posizione)
//               const oldId = editingTx.id
//               setState(s => ({
//                 ...s,
//                 transactions: s.transactions.map(t =>
//                   t.id === oldId ? { ...t, main: payload.main, sub: payload.sub, date: payload.date, amount: payload.amount, note: payload.note } : t
//                 )
//               }))
//               try { await api.deleteTransaction(token, oldId) } catch (e) { console.error('Delete fallback edit:', e.message) }
//               const created = await api.addTransaction(token, body)
//               const normalized = { ...created, main: mainDown[created.main] || 'expense', sub: payload.sub || '' }
//               setState(s => ({ ...s, transactions: s.transactions.map(t => (t.id === oldId ? normalized : t)) }))
//             } else {
//               // ADD
//               const created = await api.addTransaction(token, body)
//               const normalized = { ...created, main: mainDown[created.main] || 'expense', sub: payload.sub || created.subcategory?.name || '' }
//               setState(s => ({ ...s, transactions: [normalized, ...(s.transactions || [])] }))
//             }
//           } catch (err) {
//             console.error('Errore salvataggio transazione:', err.message)
//             // fallback UI
//             if (isEdit) {
//               updateTx(editingTx.id, { main: payload.main, sub: payload.sub, date: payload.date, amount: payload.amount, note: payload.note })
//             } else {
//               addTx(payload)
//             }
//           } finally {
//             setTxModalOpen(false)
//             setEditingTx(null)
//           }
//         }}
//       />
//     </div>
//   )
// }
// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { Switch, Badge, NavItem } from './components/ui.jsx'
import AuthScreens from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Categories from './pages/Categories.jsx'
import Budgeting from './pages/Budgeting.jsx'
import TransactionModal from './components/TransactionModal.jsx'
import { MAIN_CATS } from './lib/constants.js'
import { useAuth } from './context/AuthContext.jsx'
import { api } from './lib/api'

import {
  Layers3, LogOut, SunMedium, Moon, BarChart3, TrendingUp,
  Settings as SettingsIcon, CalendarDays, User, Plus
} from 'lucide-react'

// Stato iniziale
const defaultData = () => ({
  theme: 'light',
  customMainCats: [],             // override MAIN da DB
  mainEnabled: { income: true, expense: true, debt: true, saving: true },
  subcats: { income: [], expense: [], debt: [], saving: [] },
  budgets: {},
  transactions: []
})

export default function App() {
  const { user, logout, token } = useAuth()

  const [state, setState] = useState(defaultData())
  const [activeTab, setActiveTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashDetail, setDashDetail] = useState(null)

  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)

  const year = String(new Date().getFullYear())

  const mainDown = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving' }
  const mainUp   = { income: 'INCOME', expense: 'EXPENSE', debt: 'DEBT', saving: 'SAVINGS' }

  /* === THEME === */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  /* === CARICA CATEGORIE === */
  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const cats = await api.listCategories(token)
        const subByMain = { income: [], expense: [], debt: [], saving: [] }
        const customMainCats = []

        for (const c of cats) {
          const key = mainDown[c.main] || 'expense'
          customMainCats.push({
            key,
            id: c.id,
            name: c.name,
            color: c.colorHex || MAIN_CATS.find(m => m.key === key)?.color,
            iconKey: c.iconKey || undefined
          })
          for (const sc of (c.subcats || [])) {
            subByMain[key].push({
              id: sc.id,
              name: sc.name,
              iconKey: sc.iconKey || null
            })
          }
        }

        setState(s => ({
          ...s,
          customMainCats,
          subcats: subByMain
        }))
      } catch (err) {
        console.error('Errore caricamento categorie:', err.message)
      }
    })()
  }, [token])

  /* === CARICA TRANSAZIONI === */
  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const now = new Date()
        const txs = await api.listTransactions(token, now.getFullYear(), now.getMonth() + 1)
        const normalized = (txs || []).map(t => ({
          ...t,
          main: mainDown[t.main] || 'expense',
          sub: t.subcategory?.name || '',
          subId: t.subId || null
        }))
        setState(s => ({ ...s, transactions: normalized }))
      } catch (err) {
        console.error('Errore caricamento transazioni:', err.message)
      }
    })()
  }, [token])

  /* === FUNZIONI CATEGORIE MAIN === */
  const addMainCat = async (obj) => {
    try {
      const created = await api.addCategory(token, {
        main: mainUp[obj.key],
        name: obj.name,
        colorHex: obj.color,
        iconKey: obj.iconKey
      })
      setState(s => ({
        ...s,
        customMainCats: [...s.customMainCats, { ...obj, id: created.id }]
      }))
    } catch (err) {
      console.error('Errore addMainCat:', err.message)
    }
  }

  const updateMainCat = async (key, patch) => {
    const cat = state.customMainCats.find(c => c.key === key)
    if (!cat) return
    try {
      const updated = await api.updateCategory(token, cat.id, {
        name: patch.name,
        colorHex: patch.color,
        iconKey: patch.iconKey
      })
      setState(s => ({
        ...s,
        customMainCats: s.customMainCats.map(c => c.key === key ? { ...c, ...updated } : c)
      }))
    } catch (err) {
      console.error('Errore updateMainCat:', err.message)
    }
  }

  const removeMainCat = async (key) => {
    const cat = state.customMainCats.find(c => c.key === key)
    if (!cat) return
    try {
      await api.deleteCategory(token, cat.id)
      setState(s => ({
        ...s,
        customMainCats: s.customMainCats.filter(c => c.key !== key)
      }))
    } catch (err) {
      console.error('Errore removeMainCat:', err.message)
    }
  }

  /* === FUNZIONI SUBCATS === */
  const addSubcat = async (main, obj) => {
    const cat = state.customMainCats.find(c => c.key === main)
    if (!cat) return
    try {
      const created = await api.addSubCategory(token, {
        categoryId: cat.id,
        name: obj.name,
        iconKey: obj.iconKey
      })
      setState(s => ({
        ...s,
        subcats: { ...s.subcats, [main]: [...s.subcats[main], created] }
      }))
    } catch (err) {
      console.error('Errore addSubcat:', err.message)
    }
  }

  const updateSubcat = async (main, id, patch) => {
    try {
      const updated = await api.updateSubCategory(token, id, patch)
      setState(s => ({
        ...s,
        subcats: {
          ...s.subcats,
          [main]: s.subcats[main].map(sc => sc.id === id ? { ...sc, ...updated } : sc)
        }
      }))
    } catch (err) {
      console.error('Errore updateSubcat:', err.message)
    }
  }

  const removeSubcat = async (main, id) => {
    try {
      await api.deleteSubCategory(token, id)
      setState(s => ({
        ...s,
        subcats: { ...s.subcats, [main]: s.subcats[main].filter(sc => sc.id !== id) }
      }))
    } catch (err) {
      console.error('Errore removeSubcat:', err.message)
    }
  }

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
              Bentornato/a {user ? <span className="text-teal-500">{user.email}</span> : 'Utente'}
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
                {['dashboard', 'transactions', 'categories', 'budgeting'].map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={
                      'px-3 py-2 rounded-xl text-sm transition ' +
                      (activeTab === k ? 'bg-white dark:bg-slate-900 shadow border border-slate-200/40'
                                       : 'hover:bg-white/40 dark:hover:bg-slate-900/40')
                    }>
                    {{ dashboard: 'Dashboard', transactions: 'Transazioni', categories: 'Categorie', budgeting: 'Budgeting' }[k]}
                  </button>
                ))}
              </div>

              <button onClick={openAddTx} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Nuova Transazione
              </button>
            </div>

            <div className="mt-4">
              {activeTab === 'dashboard' && (
                <Dashboard
                  state={state}
                  year={year}
                  onSelectMain={(key) => setDashDetail(prev => prev === key ? null : key)}
                  detailMain={dashDetail}
                />
              )}

              {activeTab === 'transactions' && (
                <Transactions
                  state={state}
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
                  updateMainCat={updateMainCat}
                  addMainCat={addMainCat}
                  removeMainCat={removeMainCat}
                />
              )}

              {activeTab === 'budgeting' && <Budgeting state={state} year={year} upsertBudget={upsertBudget} />}
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
              <NavItem icon={BarChart3}  label="Dashboard"  onClick={() => { setActiveTab('dashboard'); setMenuOpen(false) }} />
              <NavItem icon={TrendingUp} label="Transazioni" onClick={() => { setActiveTab('transactions'); setMenuOpen(false) }} />
              <NavItem icon={SettingsIcon} label="Categorie"   onClick={() => { setActiveTab('categories'); setMenuOpen(false) }} />
              <NavItem icon={CalendarDays} label="Budgeting"   onClick={() => { setActiveTab('budgeting'); setMenuOpen(false) }} />
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
            main: mainUp[payload.main] || 'EXPENSE',
            note: payload.note || '',
            payee: payload.payee || '',
            subId: payload.subId || null,
            subName: payload.sub || null
          }

          try {
            if (isEdit) {
              const updated = await api.updateTransaction(token, editingTx.id, body)
              const normalized = { ...updated, main: mainDown[updated.main] || 'expense', sub: payload.sub || updated.subcategory?.name || '' }
              setState(s => ({ ...s, transactions: s.transactions.map(t => t.id === editingTx.id ? normalized : t) }))
            } else {
              const created = await api.addTransaction(token, body)
              const normalized = { ...created, main: mainDown[created.main] || 'expense', sub: payload.sub || created.subcategory?.name || '' }
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
  )
}
