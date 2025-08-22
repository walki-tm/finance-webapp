# 📍 Finance WebApp - Mappa Pagine e Componenti

> **Aggiornato**: 22 Gennaio 2025  
> **Versione**: 1.2.0

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
- **Scopo**: Lista e gestione transazioni

#### Componenti
- **File**: `components/TransactionModal.jsx`
  - **Scopo**: Modal per creare/editare transazioni
- **File**: `components/TransactionTable.jsx`
  - **Scopo**: Tabella con filtri e sorting

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

#### Pagina Principale
- **File**: `pages/Budgeting.jsx`
- **Scopo**: Sistema completo gestione budget mensili/annuali
- **Funzionalità**:
  - Pianificazione budget per categoria e sottocategoria
  - Vista semestrale (Q1/Q2) con controlli toggle
  - Calcolo automatico "Da allocare" con avvisi over-budget
  - Percentuali di allocazione per categoria
  - Riepilogo mensile con trend e confronti

#### Componenti Avanzati
- **File**: `components/EditableCell.jsx`
  - **Scopo**: Cella editabile inline per valori budget
  - **Features**: Input dinamico, validazione real-time, focus intelligente
- **File**: `components/TotalCell.jsx`
  - **Scopo**: Cella non-editabile per visualizzazione totali
- **File**: `components/BudgetRowActions.jsx`
  - **Scopo**: Azioni bulk per righe budget (Imposta tutti, Reset)

#### Sistema di Editing Professionale
- **Inline Editing**: Modifica diretta con larghezza dinamica
- **Keyboard Navigation**: Enter, Escape, Tab per navigazione
- **Smart Focus**: Gestione intelligente focus con pulsanti azione
- **Input Validation**: Supporto decimali/virgole, sanitizzazione real-time
- **Mobile Optimized**: Tastiera decimale su dispositivi touch

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
| Budgets | `budgets.js` | `/api/budgets/*` | CRUD budget, operazioni batch |

### 🎮 Controllers
**Directory**: `server/src/controllers/`

| Controller | File | Responsabilità |
|------------|------|----------------|
| Auth | `authController.js` | Gestione autenticazione |
| Categories | `categoriesController.js` | Gestione categorie |
| Transactions | `transactionsController.js` | Gestione transazioni |
| Budgets | `budgetsController.js` | Gestione budget e pianificazione |

### 🔧 Services (Business Logic)
**Directory**: `server/src/services/`

| Service | File | Responsabilità |
|---------|------|----------------|
| Auth | `authService.js` | Logica autenticazione e JWT |
| Categories | `categoryService.js` | Logica categorie e validazione |
| Transactions | `transactionService.js` | Logica transazioni e calcoli |
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
| `users` | Utenti registrati | → categories, transactions, budgets |
| `categories` | Categorie principali | → subcategories |
| `subcategories` | Sottocategorie | → transactions, budgets |
| `transactions` | Transazioni finanziarie | ← users, subcategories |
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
