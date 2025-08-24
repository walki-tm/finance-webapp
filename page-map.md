# 📍 Finance WebApp - Mappa Pagine e Componenti

> **Aggiornato**: 22 Agosto 2025  
> **Versione**: 2.0.0

## 🗺️ Struttura Generale

```
Finance WebApp/
├── 🌐 Frontend (React + Vite)
├── 🔧 Backend (Node.js + Express)
└── 🗄️ Database (PostgreSQL + Prisma)
```

---

## 🌐 FRONTEND - Struttura Pagine

### 🏠 App Principale
**File**: `src/App.jsx`  
**Scopo**: Componente root dell'applicazione  
**Funzionalità**:
- Layout principale con topbar e drawer menu
- Gestione autenticazione
- Routing tra tab principali
- State management globale

### 🔐 Autenticazione
**Directory**: `src/features/auth/`
- **File**: `pages/Auth.jsx`
- **Scopo**: Gestione login e registrazione
- **Sottopagine**:
  - Login form
  - Registration form

### 📊 Dashboard
**Directory**: `src/features/dashboard/`
- **File**: `pages/Dashboard.jsx`
- **Scopo**: Overview finanziario principale
- **Sottosezioni**:
  - Sommario mensile
  - Grafici entrate/uscite
  - Andamenti per categoria
  - Quick actions

### 📋 Gestione Transazioni
**Directory**: `src/features/transactions/`

#### Pagina Principale
- **File**: `pages/Transactions.jsx`
- **Scopo**: Gestione transazioni con sub-tab Register/Planned
- **Funzionalità**:
  - **Tab Register**: Lista transazioni esistenti con filtri per periodo e categoria
  - **Tab Planned**: Gestione transazioni pianificate e gruppi organizzativi

#### Componenti Transazioni Regolari
- **File**: `components/TransactionModal.jsx`
  - **Scopo**: Modal per creare/editare transazioni
- **File**: `components/TransactionTable.jsx`
  - **Scopo**: Tabella con filtri e sorting

#### Componenti Transazioni Pianificate
- **File**: `components/PlannedTransactionsTab.jsx`
  - **Scopo**: Interfaccia principale per transazioni pianificate
  - **Features**: Statistiche, gruppi personalizzati, alert scadenze
- **File**: `components/PlannedTransactionModal.jsx`
  - **Scopo**: Modal per creare/editare transazioni pianificate
- **File**: `components/TransactionGroupModal.jsx`
  - **Scopo**: Modal per gestire gruppi di transazioni
- **File**: `components/PlannedTransactionCard.jsx`
  - **Scopo**: Card per singola transazione pianificata
- **File**: `components/TransactionGroupCard.jsx`
  - **Scopo**: Card per gruppi con statistiche aggregate
- **File**: `components/DueTransactionsAlert.jsx`
  - **Scopo**: Alert per transazioni in scadenza

#### Hooks Specializzati
- **File**: `usePlannedTransactions.js`
  - **Scopo**: State management per transazioni pianificate
  - **Features**: CRUD, materializzazione, gestione gruppi

### 🏷️ Gestione Categorie
**Directory**: `src/features/categories/`

#### Pagina Principale
- **File**: `pages/Categories.jsx`
- **Scopo**: Container per gestione categorie

#### Tab Categorie Principali
- **File**: `pages/MainCategoriesTab.jsx`
- **Scopo**: Gestione categorie main (INCOME, EXPENSE, DEBT, SAVINGS)

#### Tab Sottocategorie
- **File**: `pages/SubCategoriesTab.jsx`
- **Scopo**: Gestione sottocategorie per categoria

#### Componenti Supporto
- **File**: `components/CategoryTableRow.jsx`
  - **Scopo**: Singola riga tabella categoria
- **File**: `components/CategoryTableActions.jsx`
  - **Scopo**: Barra azioni tabella
- **File**: `components/ColorPicker.jsx`
  - **Scopo**: Selezione colori categoria
- **File**: `components/CategoryBadge.jsx`
  - **Scopo**: Badge visuale categoria
- **File**: `components/ActionsMenu.jsx`
  - **Scopo**: Menu azioni per singola categoria
- **File**: `components/IconBrowserModal.jsx`
  - **Scopo**: Modal selezione icone

### 💰 Budgeting System
**Directory**: `src/features/budgeting/`

#### Pagina Principale - Interfaccia Cards Interattive
- **File**: `pages/Budgeting.jsx`
- **Scopo**: Sistema completo gestione budget con interfaccia cards espandibili
- **Funzionalità**:
  - **Cards responsive**: 2 per riga su desktop, 1 su mobile/tablet
  - **Cards espandibili**: Click per espandere configurazione a tutta larghezza
  - **Ring charts visuali**: Rappresentazione grafica percentuali categoria su reddito
  - **Calcolo "Da Allocare"**: Monitoraggio automatico con avvisi sforamento
  - **Vista semestrale**: Controlli integrati nell'header delle sezioni espanse
  - **Sincronizzazione real-time**: Aggiornamenti automatici tra componenti

#### Componenti Configurazione Specializzati
- **File**: `components/IncomeConfigSection.jsx`
  - **Scopo**: Sezione dedicata configurazione reddito ("Da Allocare")
  - **Features**: Tabelle responsive, controlli semestre integrati, totali annuali
- **File**: `components/CategoryConfigSection.jsx`
  - **Scopo**: Sezione configurazione categorie di spesa generiche
  - **Features**: Layout adattivo desktop/mobile, gestione batch operations

#### Componenti Avanzati di Editing
- **File**: `components/EditableCell.jsx`
  - **Scopo**: Cella editabile inline per valori budget
  - **Features**: Input dinamico, validazione real-time, focus intelligente
- **File**: `components/TotalCell.jsx`
  - **Scopo**: Cella non-editabile per visualizzazione totali
- **File**: `components/BudgetRowActions.jsx`
  - **Scopo**: Azioni bulk per righe budget (Imposta tutti, Reset)

#### Architettura UI/UX Innovativa
- **Cards-First Design**: Interfaccia focalizzata su cards interattive
- **Expand-on-Demand**: Configurazione dettagliata solo quando necessaria
- **Visual Feedback**: Ring charts e indicatori colorati per comprensione immediata
- **Contextual Controls**: Controlli semestre contestuali per ogni categoria
- **Event System**: Comunicazione tra componenti tramite custom events

#### Sistema di Editing Professionale
- **Inline Editing**: Modifica diretta con larghezza dinamica
- **Keyboard Navigation**: Enter, Escape, Tab per navigazione
- **Smart Focus**: Gestione intelligente focus con pulsanti azione
- **Input Validation**: Supporto decimali/virgole, sanitizzazione real-time
- **Mobile Optimized**: Tastiera decimale su dispositivi touch
- **Responsive Tables**: Layout adattivo per desktop e mobile

---

## 🧩 COMPONENTI UI RIUTILIZZABILI

### Base UI Components
**Directory**: `src/components/ui/`

| Componente | File | Scopo |
|------------|------|-------|
| Badge | `Badge.jsx` | Etichette colorate |
| Button | `Button.jsx` | Pulsanti con varianti |
| Card | `Card.jsx` | Container card |
| CardContent | `CardContent.jsx` | Contenuto card |
| Input | `Input.jsx` | Campo input testo |
| Label | `Label.jsx` | Etichette form |
| NativeSelect | `NativeSelect.jsx` | Select nativo |
| NavItem | `NavItem.jsx` | Item navigazione |
| Switch | `Switch.jsx` | Toggle switch |

### Componenti Feature-Specific
**Directory**: `src/features/[feature]/components/`

#### Toast System
- **Directory**: `src/features/toast/`
- **File**: `components/Toast.jsx`
- **Scopo**: Sistema notifiche

#### Icone
- **Directory**: `src/features/icons/`
- **File**: `components/SvgIcon.jsx`
- **Scopo**: Wrapper per icone SVG

---

## 🔧 BACKEND - Struttura API

### 📡 Routes Principali
**Directory**: `server/src/routes/`

| Route | File | Endpoint | Scopo |
|-------|------|----------|-------|
| Auth | `auth.js` | `/api/auth/*` | Login, register |
| Categories | `categories.js` | `/api/categories/*` | CRUD categorie |
| Transactions | `transactions.js` | `/api/transactions/*` | CRUD transazioni |
| Planned Transactions | `plannedTransactions.js` | `/api/planned-transactions/*` | CRUD transazioni pianificate, gruppi, materializzazione |
| Budgets | `budgets.js` | `/api/budgets/*` | CRUD budget, operazioni batch |

### 🎮 Controllers
**Directory**: `server/src/controllers/`

| Controller | File | Responsabilità |
|------------|------|---------|
| Auth | `authController.js` | Gestione autenticazione |
| Categories | `categoriesController.js` | Gestione categorie |
| Transactions | `transactionsController.js` | Gestione transazioni |
| Planned Transactions | `plannedTransactionsController.js` | Gestione transazioni pianificate e gruppi |
| Budgets | `budgetsController.js` | Gestione budget e pianificazione |

### 🔧 Services (Business Logic)
**Directory**: `server/src/services/`

| Service | File | Responsabilità |
|---------|------|---------|
| Auth | `authService.js` | Logica autenticazione e JWT |
| Categories | `categoryService.js` | Logica categorie e validazione |
| Transactions | `transactionService.js` | Logica transazioni e calcoli |
| Planned Transactions | `plannedTransactionService.js` | Logica transazioni pianificate, schedulazione, materializzazione |
| Scheduler | `schedulerService.js` | Auto-materializzazione transazioni pianificate |
| Budgets | `budgetService.js` | Logica budget e validazione stili |

### 🛡️ Middleware
**Directory**: `server/src/middleware/`

| Middleware | File | Scopo |
|------------|------|-------|
| Auth | `auth.js` | Validazione JWT token |
| Error | `error.js` | Gestione errori globale |

---

## 🗄️ DATABASE - Schema

### 📊 Tabelle Principali

| Tabella | Scopo | Relazioni |
|---------|-------|-----------|
| `users` | Utenti registrati | → categories, transactions, budgets, planned_transactions, transaction_groups |
| `categories` | Categorie principali | → subcategories |
| `subcategories` | Sottocategorie | → transactions, budgets, planned_transactions |
| `transactions` | Transazioni finanziarie | ← users, subcategories |
| `planned_transactions` | Transazioni pianificate | ← users, subcategories, transaction_groups |
| `transaction_groups` | Gruppi per organizzare transazioni pianificate | ← users, → planned_transactions |
| `budgets` | Budget pianificati | ← users, subcategories |

---

## 🔄 Custom Hooks

### Hooks Globali
**Directory**: `src/features/app/`

| Hook | File | Scopo |
|------|------|-------|
| useTheme | `useTheme.js` | Gestione tema dark/light |
| useTabState | `useTabState.js` | Stato navigazione tab |
| useBudgets | `useBudgets.js` | Gestione budget |

### Hooks Feature-Specific

| Hook | File | Feature | Scopo |
|------|------|---------|-------|
| useCategories | `features/categories/useCategories.js` | Categories | Gestione CRUD categorie |
| useTransactions | `features/transactions/useTransactions.js` | Transactions | Gestione CRUD transazioni |
| usePlannedTransactions | `features/transactions/usePlannedTransactions.js` | Planned Transactions | Gestione CRUD transazioni pianificate e gruppi |

---

## 🌊 Flusso Dati

### 1. Autenticazione
```
User → AuthContext → JWT → API Calls
```

### 2. Gestione State
```
Custom Hooks → Local State → API → Backend → Database
```

### 3. UI Updates
```
User Action → Handler → State Update → Component Re-render
```

---

## 📱 Routing e Navigazione

### Tab Principali
1. **Dashboard** - Overview finanziario
2. **Transactions** - Gestione transazioni
3. **Categories** - Gestione categorie
4. **Budgeting** - Pianificazione budget

### Modali e Overlays
- **Transaction Modal** - CRUD transazioni
- **Icon Browser** - Selezione icone
- **Color Picker** - Selezione colori
- **Mobile Menu** - Navigazione mobile

---

## 🎯 Convenzioni Naming

### File e Componenti
- **Pages**: `PascalCase.jsx` (es. `Dashboard.jsx`)
- **Components**: `PascalCase.jsx` (es. `CategoryBadge.jsx`)
- **Hooks**: `camelCase.js` con prefisso `use` (es. `useCategories.js`)
- **Utils**: `camelCase.js` (es. `formatCurrency.js`)

### API Endpoints
- **REST Pattern**: `/api/[resource]/[action]`
- **Examples**:
  - `GET /api/categories` - Lista categorie
  - `POST /api/categories` - Crea categoria
  - `PUT /api/categories/:id` - Aggiorna categoria
  - `DELETE /api/categories/:id` - Elimina categoria

---

**📝 Note**: Questa mappa viene aggiornata automaticamente quando vengono aggiunte nuove pagine o componenti al progetto.
