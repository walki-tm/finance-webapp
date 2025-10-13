# 📍 Finance WebApp - Mappa Pagine e Componenti

> **Aggiornato**: 31 Agosto 2025  
> **Versione**: 2.1.0

## 🗺️ Struttura Generale

```
Finance WebApp/
├── 🌐 Frontend (React + Vite)
├── 🔧 Backend (Node.js + Express)
├── 🗄️ Database (PostgreSQL + Prisma)
└── 💾 Backup System (PowerShell Scripts)
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
  - **Features**: CRUD completo, materializzazione automatica, gestione gruppi
  - **Integration**: Budgeting system, scheduler, real-time updates

#### Sistema di Schedulazione Automatica
- **Frequenze**: MONTHLY (mensile), YEARLY (annuale), ONE_TIME (una tantum)
- **Modalità**: MANUAL (richiede conferma utente), AUTOMATIC (auto-materializzazione)
- **Scheduler**: Auto-controllo ogni ora, materializzazione transazioni in scadenza
- **Integrazione Budgeting**: Applicazione automatica ai budget quando `appliedToBudget = true`

#### Roadmap Enhancement (Priorità Future)
**FASE 1 - Enhancement Immediate**:
- Modal completo con tutti i campi (categoria, subcategoria, date picker)
- Badge e filtri rapidi per visualizzazione (Mensili, Annuali, Auto, Manuali)
- Anteprima prossime occorrenze nelle card

**FASE 2 - UX Professional**:
- Notifiche visual feedback e status indicators
- Azioni rapide nelle cards (hover actions, quick buttons)
- Colori personalizzati gruppi

**FASE 3 - Advanced Features**:
- Timeline/calendario view
- Drag & drop avanzato con react-beautiful-dnd
- Statistiche e analytics avanzate

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

### 🏦 Loans Management System ⭐ NUOVO
**Directory**: `src/features/loans/`

#### Sistema Completo Prestiti e Mutui
- **File**: `pages/LoansPage.jsx`
  - **Scopo**: Gestione completa prestiti, mutui e finanziamenti
  - **Features**: Lista prestiti, dashboard statistiche, azioni rapide
- **File**: `components/LoanCard.jsx`
  - **Scopo**: Card prestito con progress bar e dettagli
  - **Features**: Progresso pagamenti, rate rimanenti, azioni quick
- **File**: `components/LoanModal.jsx`
  - **Scopo**: Modal completo per creazione/modifica prestiti
  - **Features**: Calcoli automatici, simulazioni, integrazione budgeting
- **File**: `components/LoansDashboard.jsx`
  - **Scopo**: Dashboard principale con overview prestiti
  - **Features**: KPI totali, grafici progresso, scadenze rate
- **File**: `components/PaymentModal.jsx`
  - **Scopo**: Registrazione pagamenti rate
  - **Features**: Calcolo automatico, pagamenti extra, ricalcoli saldo
- **File**: `components/AmortizationTable.jsx`
  - **Scopo**: Piano di ammortamento dettagliato
  - **Features**: Schedule completo, calcoli interessi/capitale

#### Hooks Specializzati Loans
- **File**: `useLoans.js`
  - **Scopo**: State management prestiti
  - **Features**: CRUD, calcoli automatici, simulazioni estinzione
- **File**: `useLoanDetails.js`
  - **Scopo**: Dettagli prestito singolo
  - **Features**: Piano ammortamento, pagamenti, statistiche
- **File**: `useLoanPayments.js`
  - **Scopo**: Gestione pagamenti rate
  - **Features**: Registrazione, tracking, ricalcoli

#### Backend Services Avanzati
- **File**: `loanService.js`
  - **Scopo**: Business logic prestiti
  - **Features**: CRUD operations, integrazione budgeting
- **File**: `loanCalculationService.js`
  - **Scopo**: Calcoli matematici ammortamento
  - **Features**: Formula francese, simulazioni, validazioni
- **File**: `loanBudgetingService.js`
  - **Scopo**: Integrazione con planned transactions
  - **Features**: Auto-generazione rate, sincronizzazione

#### Database Schema Loans
- **Tabelle**: `loans`, `loan_payments`
- **Relazioni**: User, Subcategory, PlannedTransaction
- **Enums**: LoanType, RateType, PaymentFrequency, LoanStatus, PaymentStatus
- **Features**: Calcoli automatici, tracking pagamenti, ammortamento

#### Formule Matematiche
- **Ammortamento Francese**: `P × [r × (1+r)^n] / [(1+r)^n - 1]`
- **Calcolo Interessi**: `Debito_residuo × tasso_mensile`
- **Simulazione Estinzione**: `(Rate_rimanenti × Rata_mensile) - Debito_attuale`

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
| Loans | `loans.js` | `/api/loans/*` | CRUD prestiti, calcoli ammortamento, pagamenti |
| Budgets | `budgets.js` | `/api/budgets/*` | CRUD budget, operazioni batch |

### 🎮 Controllers
**Directory**: `server/src/controllers/`

| Controller | File | Responsabilità |
|------------|------|---------|
| Auth | `authController.js` | Gestione autenticazione |
| Categories | `categoriesController.js` | Gestione categorie |
| Transactions | `transactionsController.js` | Gestione transazioni |
| Planned Transactions | `plannedTransactionsController.js` | Gestione transazioni pianificate e gruppi |
| Loans | `loansController.js` | Gestione prestiti, calcoli e pagamenti |
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
| Loans | `loanService.js` | Business logic prestiti e integrazione budgeting |
| Loan Calculations | `loanCalculationService.js` | Formule matematiche ammortamento francese |
| Loan Budgeting | `loanBudgetingService.js` | Integrazione prestiti con planned transactions |
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
| `planned_transactions` | Transazioni pianificate | ← users, subcategories, transaction_groups, loans |
| `transaction_groups` | Gruppi per organizzare transazioni pianificate | ← users, → planned_transactions |
| `loans` | Prestiti e mutui | ← users, subcategories, → loan_payments, planned_transactions |
| `loan_payments` | Rate e pagamenti prestiti | ← loans |
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
| useLoans | `features/loans/useLoans.js` | Loans | Gestione CRUD prestiti e calcoli |
| useLoanDetails | `features/loans/useLoanDetails.js` | Loans | Dettagli prestito e piano ammortamento |
| useLoanPayments | `features/loans/useLoanPayments.js` | Loans | Gestione pagamenti e tracking rate |

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
2. **Transactions** - Gestione transazioni (Register + Planned)
3. **Categories** - Gestione categorie
4. **Budgeting** - Pianificazione budget
5. **Loans** - Gestione prestiti e mutui

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

## 💾 BACKUP SYSTEM

### Struttura Sistema Backup Integrato
**Directories**: `backup/` (legacy), `server/backups/` (nuovo sistema)

#### Backend API Backup System ⭐ NUOVO
| File | Tipo | Scopo |
|------|------|-------|
| `server/src/controllers/backupController.js` | JS | Controller API per backup |
| `server/src/routes/backup.js` | JS | Route `/api/backup` |
| `server/backups/finance-backup-*.json` | JSON | File backup strutturati |

#### Sistema Legacy PowerShell
| File | Tipo | Scopo |
|------|------|-------|
| `backup_facile.bat` | BAT | Esecuzione backup con doppio click |
| `ripristina_facile.bat` | BAT | Ripristino backup con doppio click |
| `finance_db_backup_simple.ps1` | PowerShell | Script backup principale |
| `ripristina_backup_simple.ps1` | PowerShell | Script ripristino interattivo |
| `README_BACKUP.txt` | TXT | Documentazione sistema backup |
| `backup_log.txt` | LOG | Log operazioni backup |
| `finance_webapp_backup_*.dump` | DUMP | File backup database |

### Funzionalità Sistema Nuovo (Basato su Prisma)
- **Backup Integrato Frontend**: Icona backup nel dashboard principale
- **Compatibilità Windows**: Nessuna dipendenza da pg_dump
- **Export JSON Strutturato**: Dati completi utente in formato leggibile
- **Sicurezza JWT**: Solo dati utente autenticato nel backup
- **Metadati e Statistiche**: Timestamp, conteggi, struttura preservata
- **UI Intuitiva**: Stati di caricamento e notifiche di successo

### Dati Inclusi nel Backup
- **Transazioni**: Tutte le transazioni dell'utente
- **Categorie e Sottocategorie**: Configurazione personalizzata
- **Account**: Multi-account e configurazioni
- **Prestiti**: Loans completi con pagamenti
- **Budgeting**: Configurazioni budget e pianificazioni
- **Transazioni Pianificate**: Con gruppi e schedulazioni
- **Trasferimenti**: Storia trasferimenti tra account

### Configurazione Database
- **Host**: localhost:5432
- **Database**: finance_webapp
- **User**: postgres
- **Formato Nuovo**: JSON strutturato
- **Formato Legacy**: PostgreSQL Custom (.dump)
- **Compressione Legacy**: Abilitata (-Fc)

---

**📝 Note**: Questa mappa viene aggiornata automaticamente quando vengono aggiunte nuove pagine o componenti al progetto.
