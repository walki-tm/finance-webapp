# 📝 Finance WebApp - Changelog

Tutte le modifiche importanti al progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto segue il [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0] - 2026-01-07 - **UI IMPROVEMENTS & BACKUP SYSTEM** 💾

### 🎉 New Major Features
- **Sistema Backup Automatico**: Implementazione completa sistema backup automatico con rotazione
  - Backup automatico all'avvio server (se ultimo backup > 5 giorni)
  - Scheduled backup giornaliero alle 5:00 AM (timezone Italia)
  - Rotazione automatica: mantiene max 5 backup, elimina i più vecchi
  - Servizio `backupService.js` con `node-cron` per scheduling
  - Backup JSON completi di tutti i dati utente
  - Logs dettagliati per monitoring e troubleshooting

### 🎨 UI/UX Improvements
- **Preferenza Tema Persistente**: Sistema salvataggio preferenza tema UI
  - Campo `theme` aggiunto al model User nel database
  - Endpoint API `PATCH /api/user-settings/theme` per aggiornamento
  - Tema salvato automaticamente quando utente cambia light/dark
  - Caricamento automatico tema salvato al login
  - Persistenza tema attraverso refresh e logout/login
  - Hook `useTheme` aggiornato con integrazione AuthContext

- **Pulsante "Paga" Universale**: Esteso pulsante pagamento a tutte le transazioni pianificate
  - Pulsante "Paga" visibile per TUTTE le transazioni attive (non solo scadute)
  - Disponibile in menu azioni (3 puntini) in tutti i contesti:
    - Card transazioni pianificate singole
    - Transazioni pianificate nei gruppi
    - Widget "Prossime Transazioni" nella dashboard
  - Rimosse restrizioni su frequenza e stato scadenza
  - Maggiore flessibilità per utente nel pagamento anticipato

- **Auto-Refresh Transazioni**: Fix refresh automatico lista transazioni
  - Lista transazioni si aggiorna immediatamente dopo aggiunta/modifica
  - Nessun refresh manuale necessario
  - Migliorata user experience con feedback immediato

### 🔧 Technical Improvements
- **Database Schema**: Migration `add_user_theme` per campo theme su User
- **Backend Services**: 
  - `backupService.js`: Servizio completo backup con scheduling
  - `userSettingsController.js`: Endpoint aggiornamento tema
  - `authService.js`: Login/register restituiscono campo theme
- **Frontend Architecture**:
  - `useTheme.js`: Integrazione con AuthContext per persistenza
  - `AuthContext.jsx`: Funzione `updateUser()` per aggiornamenti user
  - `api.js`: Metodo `updateTheme()` per chiamate API

### 🐛 Bug Fixes
- **Fix Materializzazione Dashboard**: Risolto errore "Planned transaction not found"
  - Correzione passaggio parametri in `handleMaterialize`
  - Passaggio oggetto completo invece di solo ID
  - Fix in `UpcomingPlannedTransactions.jsx`

- **Fix Auto-Refresh Loop**: Rimozione commenti "TEMPORARY FIX" disabilitati
  - Riattivato refresh automatico transazioni dopo salvataggio/eliminazione
  - Fix in `App.jsx` per funzioni `saveTx` e `delTx`

### 📝 Files Added
#### Backend
- `server/src/services/backupService.js` - Servizio backup automatico completo
- `server/test_backup_rotation.js` - Script test rotazione backup

### 📝 Files Modified
#### Backend
- `server/prisma/schema.prisma` - Aggiunto campo `theme` a model User
- `server/src/index.js` - Inizializzazione backup service
- `server/src/controllers/userSettingsController.js` - Endpoint tema
- `server/src/routes/userSettings.js` - Route tema
- `server/src/services/authService.js` - Restituzione tema in login/register
- `server/package.json` - Dipendenza `node-cron` aggiunta

#### Frontend
- `src/context/AuthContext.jsx` - Funzione `updateUser()` per aggiornamenti
- `src/features/app/useTheme.js` - Integrazione AuthContext
- `src/lib/api.js` - Metodo `updateTheme()`
- `src/App.jsx` - Rimozione pulsante backup manuale, fix auto-refresh
- `src/features/transactions/components/PlannedTransactionCard.jsx` - Pulsante Paga sempre visibile
- `src/features/transactions/components/TransactionGroupCard.jsx` - Pulsante Paga nei gruppi
- `src/features/dashboard/components/UpcomingPlannedTransactions.jsx` - Paga in dashboard, fix materializzazione

### 🎯 Impact
- **Data Safety**: Backup automatici garantiscono sicurezza dati senza intervento manuale
- **User Experience**: Tema persistente e refresh automatico migliorano UX significativamente
- **Flexibility**: Pulsante "Paga" universale offre maggiore controllo all'utente
- **Automation**: Sistema backup completamente automatizzato riduce overhead operativo
- **Consistency**: Preferenze tema consistenti attraverso sessioni e dispositivi

Questa release migliora significativamente l'affidabilità del sistema con backup automatici e l'esperienza utente con preferenze persistenti e interfaccia più flessibile.

## [3.2.0] - 2025-10-30 - **BATCH CATEGORY TRANSFER FEATURE** 🔄

### 🎉 New Major Feature
- **Batch Category Transfer System**: Sistema completo per trasferire in blocco tutte le transazioni tra sottocategorie
  - Trasferimento atomico di tutte le transazioni (normali e pianificate) da una sottocategoria ad un'altra
  - Modal dedicato con processo guidato in 2 step (selezione + conferma)
  - Preview del numero di transazioni da trasferire
  - Validazione completa per evitare errori
  - Conferma esplicita con testo "TRASFERISCI" per sicurezza
  - Aggiornamento automatico categoria principale se necessario

### 🛡️ Enhanced Delete Protection
- **Smart Delete with Transaction Check**: Protezione intelligente eliminazione sottocategorie
  - Controllo automatico transazioni collegate prima dell'eliminazione
  - Errore 409 se esistono transazioni associate
  - Dialog automatico che propone il batch transfer come soluzione
  - Prevenzione perdita accidentale di dati

### 🎯 Use Cases
Questa feature è pensata per diversi scenari reali:
1. **Riorganizzazione**: Cambiato sistema di categorizzazione e vuoi consolidare categorie
2. **Merge categorie**: Unificare sottocategorie simili o duplicate
3. **Correzione errori**: Hai categorizzato male un gruppo di transazioni e vuoi sistemarle
4. **Pulizia**: Eliminare una sottocategoria ma mantenere tutte le transazioni
5. **Migrazione dati**: Spostare transazioni storiche verso nuove categorie

### 🔧 Backend Implementation
- **Service Layer**: 
  - `transferTransactionsBatch()` in `categoryService.js`
  - Transazione atomica database per garantire coerenza
  - Aggiornamento batch di `transactions` e `planned_transactions`
  - Validazione completa (sottocategorie esistono, IDs diversi, transazioni disponibili)
- **Controller & Validation**:
  - Endpoint POST `/api/categories/batch-transfer`
  - Schema Zod per validazione input rigorosa
  - Gestione errori con messaggi descrittivi
- **Enhanced Delete Service**:
  - `deleteSubcategoryService()` ora controlla transazioni collegate
  - Errore 409 con dettagli (count transazioni, subcategoryId)
  - Impedisce eliminazioni accidentali

### 🎨 Frontend Implementation
- **BatchTransferModal Component**:
  - UI professionale con design moderno
  - Processo guidato in 2 step per evitare errori
  - Step 1: Selezione origine e destinazione con dropdown filtrati
  - Step 2: Riepilogo e conferma con campo di sicurezza
  - Gestione loading states e error handling
  - Dark mode support completo
- **Integration**:
  - Pulsante "Trasferisci Transazioni" nella pagina Categorie
  - Integrazione nel dialog delete per proporre transfer automatico
  - API client method `batchTransferCategories()`
  - Refresh automatico dati dopo trasferimento

### 📝 Files Added
- `src/features/categories/components/BatchTransferModal.jsx` - Modal component completo

### 📝 Files Modified
#### Backend
- `server/src/services/categoryService.js` - Aggiunto `transferTransactionsBatch()` e controllo delete
- `server/src/controllers/categoriesController.js` - Aggiunto `batchTransferTransactions()` controller
- `server/src/routes/categories.js` - Aggiunta route `/batch-transfer`

#### Frontend
- `src/lib/api.js` - Aggiunto `batchTransferCategories()` API method
- `src/features/categories/pages/Categories.jsx` - Integrato modal e pulsante
- `src/features/categories/pages/SubCategoriesTab.jsx` - Enhanced delete con proposta transfer

### ⚡ Technical Details
- **Atomicità**: Tutte le operazioni avvengono in una singola transazione database
- **Rollback**: Se qualcosa fallisce, nessuna modifica viene applicata
- **Performance**: Batch update ottimizzato per grandi volumi di transazioni
- **Consistency**: Aggiornamento automatico di `main` category se sottocategorie sono di categorie diverse
- **Scope**: Include sia `transactions` che `planned_transactions`

### 🏆 Impact
- **Data Management**: Gestione più flessibile e potente delle categorie
- **Error Prevention**: Impossibile eliminare accidentalmente sottocategorie con dati
- **User Experience**: Processo guidato intuitivo con conferme esplicite
- **Data Integrity**: Transazioni atomiche garantiscono coerenza
- **Time Saving**: Operazioni che richiedevano ore ora richiedono secondi

Questa feature risponde a una necessità reale degli utenti che devono riorganizzare le proprie categorie dopo periodi di utilizzo o correggere errori di categorizzazione di massa.

## [3.1.1] - 2025-10-13 - **PLANNED TRANSACTIONS EDIT FIX** 🛠️

### 🚑 Critical Bug Fixes
- **Planned Transactions Edit Issue**: Risolto problema critico con la modifica delle transazioni pianificate
  - **FIX CRITICO**: Correzione passaggio parametri in `PlannedTransactionCard.jsx` - `onEdit()` ora chiama `onEdit(transaction)`
  - **FIX CRITICO**: Aggiunto ID della transazione nel payload di salvataggio per distinguere create/update
  - **FIX CRITICO**: Corretta conversione tipi dati nel payload (`amount` da string a number, `startDate` da string a Date)
  - **FIX CRITICO**: Mappatura corretta campi backend (`applyToBudget` → `appliedToBudget`, `sub` → `subName`)
  - **FIX CRITICO**: Risolto problema case-sensitivity nel filtro sottocategorie (EXPENSE vs expense)
  - **FIX**: Migliorato mapping delle sottocategorie nel caricamento dati iniziali
  - **FIX**: Corretto reset subcategoria per evitare interferenze con dati iniziali

### 🔧 Technical Improvements
- **Enhanced Validation**: Migliorata validazione Zod nel backend con debug dettagliato
- **Robust Field Mapping**: Gestione robusta mapping campi con fallback (`initial.subId` || `initial.subcategory?.id`)
- **Debug System**: Aggiunto sistema di debug avanzato per troubleshooting futuro
- **Data Normalization**: Normalizzazione automatica dei valori per consistency

### 📝 Files Modified
- `src/features/transactions/components/PlannedTransactionCard.jsx` - Fix chiamata onEdit con parametri
- `src/features/transactions/components/PlannedTransactionModal.jsx` - Fix mapping dati e validazione
- `src/features/transactions/usePlannedTransactions.js` - Debug payload salvataggio
- `server/src/controllers/plannedTransactionsController.js` - Debug validazione backend

### 🏆 Impact
- **User Experience**: Risolto completamente il problema del pulsante "Aggiorna Transazione" disabilitato
- **Data Integrity**: Tutte le modifiche alle transazioni pianificate ora vengono salvate correttamente
- **Field Pre-population**: Tutti i campi (inclusa sottocategoria) vengono precompilati correttamente in edit mode
- **Validation**: Eliminati errori "Invalid body" durante il salvataggio

Questa release risolve un bug critico che impediva la modifica delle transazioni pianificate esistenti, rendendo nuovamente funzionale una delle feature core dell'applicazione.

## [3.1.0] - 2025-10-04 - **STABILITY FIXES & ACCOUNTS SYSTEM** 🔧

### 🚑 Critical Fixes (Correzioni Critiche)
- **Planned Transactions Infinite Loop**: Risolto completamente il loop infinito che causava blocco dell'app
  - Implementato pattern singleton per evitare chiamate API multiple simultanee
  - Fix delle date `next_execution` che erano undefined causando errori nei calcoli
  - Risolto bug "Planned transaction not found" nella materializzazione
  - Aggiunta protezione anti-loop con limite di 10 render consecutivi
- **useBalance Hook Critical Error**: Risolto errore `loadBalance is not defined` che causava pagina bianca
  - Rimossa logica duplicata negli useEffect che causava confusione
  - Definita correttamente funzione `loadBalance` con `useCallback`
  - Semplificata architettura hook per maggiore manutenibilità

### 🏦 Major Feature: Accounts Management System
- **Sistema Conti Completo**: Implementazione sistema gestione multi-account
  - Nuove tabelle database: `accounts`, `transfers` con relazioni complete
  - Tipi conto: CURRENT, INVESTMENTS, SAVINGS, POCKET con icone automatiche
  - Gestione completa CRUD conti con controller e servizi backend
  - Componenti frontend: `AccountCard`, `AccountModal`, `AccountsPage`
  - Integration completa con sistema transazioni esistente
- **Trasferimenti tra Conti**: Sistema trasferimenti con tracking completo
  - API per trasferimenti con validazione automatica conti
  - Aggiornamento automatico saldi conti coinvolti
  - Storico trasferimenti con note e categorizzazione

### ⚡ Performance & Stability (Performance e Stabilità)
- **Dashboard Calculations**: Ottimizzati calcoli Dashboard con protezioni avanzate
  - Limitazioni iterazioni per prevenire loop infiniti nei calcoli proiezioni
  - Gestione errori con fallback su date invalide
  - Guard clauses per dati corrotti o incompleti
- **Singleton Pattern Implementation**: Implementato pattern singleton per planned transactions
  - Singola chiamata API condivisa per tutte le istanze del hook
  - Gestione globale stato con subscriber pattern
  - Eliminazione race conditions e sovrapposizioni chiamate API
- **Memory Management**: Migliorata gestione memoria e cleanup
  - Cleanup automatico event listeners e timeouts
  - Prevenzione memory leaks in componenti con stati complessi

### 🔄 Enhanced Planned Transactions
- **Frequency Support Expansion**: Esteso supporto frequenze transazioni pianificate
  - Aggiunte: WEEKLY, QUARTERLY, SEMIANNUAL oltre a MONTHLY, YEARLY
  - Supporto completo REPEAT con contatore ripetizioni
  - Calcoli corretti per tutte le frequenze supportate
- **Date Normalization**: Sistema normalizzazione date automatica
  - Fix globale per `next_execution` undefined che causava errori
  - Calcoli data coerenti per tutte le frequenze
  - Gestione corretta timezone e cambio mese
- **Budget Integration**: Migliorata integrazione con sistema budgeting
  - Gestione automatica applicazione/rimozione budget su attivazione/disattivazione
  - Controllo conflitti per transazioni multiple su stessa categoria
  - Modalità applicazione budget: divide, specific con target month

### 🔧 Database & Schema
- **Schema Extensions**: Estensioni schema database per accounts system
  - Migration `add_accounts_and_transfers`: Tabelle accounts e transfers
  - Migration `add_account_to_loans`: Collegamento prestiti a conti specifici
  - Aggiornamento relazioni planned_transactions per supporto accountId
- **Query Optimizations**: Ottimizzazioni query per performance
  - Rimozione orderBy problematico su group.sortOrder che causava loop
  - Indici ottimizzati per query accounts e transfers
  - Batch operations per aggiornamenti saldi multipli

### 🔍 Debug & Troubleshooting
- **Comprehensive Debug Scripts**: Script completi per analisi e risoluzione problemi
  - `diagnose_db.js`: Analisi completa database per problemi performance
  - `fix_planned_transactions.js`: Fix automatico dati corrotti planned transactions
  - `test_planned_transactions_api.js`: Test completo API planned transactions
  - Suite completa script per debugging e maintenance
- **Error Handling**: Gestione errori migliorata across tutta l'applicazione
  - Logging dettagliato per debugging senza spam console
  - Fallback graceful per API calls fallimentari
  - User feedback migliorato per errori e operazioni async

### 🎨 UI/UX Improvements
- **Account Management UI**: Interface completa gestione conti
  - Cards responsive con indicatori tipo conto e saldo
  - Modali create/edit con validazione real-time
  - Pagina dedicata accounts con statistiche e overview
- **Error States**: Stati errore migliorati per planned transactions
  - Messaggi errore descrittivi per problemi specifici
  - Loading states durante operazioni async
  - Recovery automatico da stati errore temporanei

### 📚 Files Added (Nuovi File)
#### Backend - Accounts System
- `server/src/controllers/accountsController.js` - Controller REST API accounts
- `server/src/services/accountService.js` - Business logic accounts
- `server/src/services/accountBalanceService.js` - Gestione saldi accounts
- `server/src/services/transferService.js` - Gestione trasferimenti
- `server/src/routes/accounts.js` - Routes API accounts
- `server/src/routes/transfers.js` - Routes API transfers

#### Frontend - Accounts System  
- `src/features/accounts/` - Feature completa accounts management
  - `components/AccountCard.jsx` - Card singolo account
  - `components/AccountModal.jsx` - Modal create/edit account
  - `pages/AccountsPage.jsx` - Pagina principale accounts
  - `services/accounts.api.js` - API client accounts
  - `useAccounts.js` - Hook gestione stato accounts
- `src/lib/accountIcons.js` - Sistema icone accounts

#### Debug & Scripts
- `server/diagnose_db.js` - Script diagnostica database
- `server/fix_planned_transactions.js` - Fix automatico planned transactions
- `server/test_planned_transactions_api.js` - Test suite API
- `server/ultra_deep_diagnostics.js` - Diagnostica approfondita
- `FREEZE_TROUBLESHOOTING.md` - Documentazione troubleshooting

### 📝 Files Modified (File Modificati Principali)
#### Core Application
- `server/prisma/schema.prisma` - Schema esteso con accounts e transfers
- `src/App.jsx` - Integrazione accounts system nella navigazione
- `src/lib/api.js` - Client API esteso con endpoints accounts
- `src/lib/constants.js` - Costanti per accounts management

#### Planned Transactions Fixes
- `src/features/transactions/usePlannedTransactions.js` - Singleton pattern implementation
- `server/src/services/plannedTransactionService.js` - Query fixes e frequency support
- `server/src/controllers/plannedTransactionsController.js` - Validation schema esteso

#### Balance & Performance
- `src/features/app/useBalance.js` - Fix critico loadBalance undefined
- `src/features/dashboard/pages/Dashboard.jsx` - Ottimizzazioni calcoli
- `server/src/services/transactionService.js` - Integration accounts system

### 🏆 Impact (Impatto Utente)
- **Stability**: App completamente stabile, risolti tutti i loop infiniti che causavano blocchi
- **Multi-Account Support**: Gestione completa conti multipli per organizzazione finanziaria avanzata
- **Performance**: Migliorata reattività app con singleton pattern e ottimizzazioni query
- **User Experience**: Interface più robusta con gestione errori migliorata e feedback utente
- **Data Integrity**: Sistemi di fix automatico e validazione per garantire coerenza dati

Questa release segna una **svolta significativa nella stabilità** dell'applicazione, risolvendo i problemi critici che impedivano l'uso normale dell'app e aggiungendo il sistema accounts che era una delle funzionalità più richieste per la gestione finanziaria avanzata.

## [3.0.0] - 2025-09-07 - **FINANCE APP V1 RELEASE** 🎉

### 🚀 Added (Nuove Funzionalità Principali)
- **🎯 Savings Goals System**: Sistema completo di gestione obiettivi di risparmio
  - Creazione, modifica ed eliminazione obiettivi personalizzati
  - Tracking progresso con visualizzazioni intuitive e progress bars
  - Sistema di aggiunta e prelievo saldi con storico transazioni
  - Stati dinamici: ACTIVE, COMPLETED con gestione automatica completamento
  - Target date opzionale per flessibilità massima nella pianificazione
  - Integrazione completa con sistema categorie esistente

### 💰 Advanced Goal Management (Gestione Avanzata Obiettivi)
- **Goal Lifecycle Management**: Gestione completa ciclo di vita obiettivi
  - Auto-completamento quando saldo raggiunge target amount
  - Possibilità prelievi anche da obiettivi completati
  - Sistema "Ripeti Obiettivo" per riutilizzo goals completati
  - Opzione eliminazione definitiva dopo completamento
- **Flexible Goal Structure**: Struttura flessibile e adattiva
  - Target date opzionale (può essere NULL per goals long-term)
  - Supporto obiettivi senza scadenza per risparmi generici
  - Categorie e sottocategorie per organizzazione e tracking
  - Note personalizzate per ogni goal

### 🎨 UI/UX (Interfaccia Utente Premium)
- **Responsive Goal Cards**: Cards responsive con design moderno
  - Layout adaptive: 3 colonne desktop, 2 tablet, 1 mobile
  - Progress indicators con colori dinamici (verde/giallo/rosso)
  - Quick actions integrate: Add, Withdraw, History su ogni card
  - Stati visuali chiari per goals attivi vs completati
- **Dashboard Statistics**: Dashboard statistiche interattive e cliccabili
  - Cards statistiche: Totali, Attivi, Completati, Progresso Medio
  - Filtri dinamici cliccando su ogni statistica
  - Reset filtri con pulsante "Mostra Tutti"
- **Advanced Modals**: Sistema modali avanzato e user-friendly
  - `GoalModal`: Creazione/editing goals con validazione real-time
  - `AddBalanceModal`: Aggiunta saldo con notes opzionali
  - `WithdrawModal`: Prelievo con selezione categoria per transazione
  - `GoalHistoryModal`: Storico dettagliato movimenti goal
  - `CompletedGoalConfirmDialog`: Dialog conferma per goals completati

### 🔧 Technical Architecture (Architettura Tecnica Avanzata)
- **Database Schema**: Estensione schema con nuova tabella `savings_goals`
  - Relazioni: `users`, `categories`, `subcategories`
  - Migrations Prisma per aggiornamento schema esistente
  - Indici ottimizzati per query performance
- **Backend Services**: Servizi backend completi e scalabili
  - `savingsGoalService.js`: Business logic completa con validazioni
  - `savingsGoalsController.js`: REST API endpoints con error handling
  - Routes integration in `server/src/routes/savingsGoals.js`
  - Support per operazioni CRUD, transactions tracking, repeat functionality
- **Frontend Architecture**: Architettura frontend modulare e scalabile
  - Feature-based organization in `src/features/savings-goals/`
  - Custom hooks: `useSavingsGoals.js` per state management
  - Component separation: pages/, components/, hooks/
  - API client integration con error handling robusto

### 📊 Advanced Features (Funzionalità Avanzate)
- **Real-time Progress Tracking**: Tracking progresso in tempo reale
  - Calcolo automatico percentuali completamento
  - Aggiornamento dinamico UI senza refresh necessari
  - Notifiche completamento automatico obiettivi
- **Transaction Integration**: Integrazione completa con sistema transazioni
  - Prelievi generano transazioni nel sistema principale
  - Selezione categoria/sottocategoria per classificazione spese
  - Storico completo movimenti per ogni goal
- **Repeat Goals System**: Sistema ripetizione obiettivi innovativo
  - Riutilizzo goals completati con un click
  - Reset automatico saldo e status su repeat
  - Mantenimento metadati (nome, target, categoria, note)

### 🧹 Code Quality (Qualità del Codice)
- **Debug Cleanup**: Pulizia completa console debug per produzione
  - Rimossi tutti `console.log` di debug da hooks e componenti
  - Performance migliorata eliminando output console spam
  - Esperienza utente più pulita nelle DevTools
- **Documentation**: Documentazione completa e professionale
  - Commenti inline con pattern JSDoc
  - README e documentazione architetturale
  - Esempi e guide implementazione

### 🚀 New Tab Integration (Integrazione Nuova Sezione)
- **Navigation Enhancement**: Aggiunta sezione "Goals" alla navigazione principale
  - Tab dedicato nella UI principale con icona Target
  - Integrazione seamless con resto dell'applicazione
  - Consistent design con tabs esistenti

### 📱 Mobile Optimization (Ottimizzazione Mobile)
- **Responsive Design**: Design completamente responsive
  - Layout adaptive per tutti i device sizes
  - Touch-friendly interactions e buttons
  - Modali ottimizzati per mobile viewport

### 🔐 Security & Validation (Sicurezza e Validazione)
- **Input Validation**: Validazione robusta input utente
  - Validazione amounts con controlli negativi/zero
  - Sanitizzazione input per prevenzione injection
  - Error handling graceful con feedback utente
- **Authorization**: Controlli autorizzazione completi
  - Controlli ownership goals per sicurezza
  - Middleware auth su tutti gli endpoints
  - Isolation dati per user context

### 💾 Database Migrations (Migrazioni Database)
- **Schema Evolution**: Evoluzione controlled dello schema database
  - Migration `20250904221659_add_savings_goals/` per tabelle iniziali
  - Migration `20250907002501_make_target_date_optional/` per flessibilità date
  - Backward compatibility mantenuta

### 📋 Files Added (Nuovi File)
#### Backend
- `server/src/controllers/savingsGoalsController.js` - REST API controller
- `server/src/services/savingsGoalService.js` - Business logic service
- `server/src/routes/savingsGoals.js` - API routes definition
- `server/prisma/migrations/20250904221659_add_savings_goals/` - Schema migration
- `server/prisma/migrations/20250907002501_make_target_date_optional/` - Flexibility migration

#### Frontend
- `src/features/savings-goals/` - Complete feature directory
  - `pages/SavingsGoals.jsx` - Main page component
  - `components/GoalCard.jsx` - Goal card component
  - `components/GoalModal.jsx` - Create/edit modal
  - `components/AddBalanceModal.jsx` - Add balance modal
  - `components/WithdrawModal.jsx` - Withdraw modal
  - `components/GoalHistoryModal.jsx` - History modal
  - `components/CompletedGoalConfirmDialog.jsx` - Confirmation dialog
  - `useSavingsGoals.js` - Custom hook for state management

### 📋 Files Modified (File Modificati)
#### Core Application
- `server/prisma/schema.prisma` - Database schema extension
- `src/lib/tabs.js` - Navigation tabs with Goals integration
- `src/lib/api.js` - API client with savings goals endpoints

#### Performance & Cleanup
- `src/App.jsx` - Debug cleanup
- `src/features/app/useBalance.js` - Debug cleanup
- `src/features/app/useBudgets.js` - Debug cleanup
- `src/features/dashboard/useUpcomingPlannedTransactions.js` - Debug cleanup
- `src/features/icons/components/SvgIcon.jsx` - Debug cleanup
- `src/features/transactions/pages/Transactions.jsx` - Debug cleanup
- `src/features/toast/useToast.js` - Debug cleanup

### 🎯 Impact (Impatto Utente)
- **Financial Planning**: Strumento completo per pianificazione finanziaria personale
- **Goal Achievement**: Sistema motivazionale per raggiungimento obiettivi di risparmio
- **User Experience**: Interfaccia moderna, intuitiva e completamente responsive
- **Data Organization**: Organizzazione intelligente dati finanziari con categorizzazione
- **Long-term Value**: Sistema scalabile per crescita e evoluzione future

### 🏆 Milestone Achievement
**FINANCE APP V1** rappresenta il primo release completo della Finance WebApp con:
- ✅ Sistema transazioni completo
- ✅ Planned transactions con schedulazione automatica
- ✅ Sistema prestiti e mutui con ammortamento
- ✅ Budgeting avanzato con real-time sync
- ✅ **Savings Goals Management (NEW!)**
- ✅ Dashboard analytics e reporting
- ✅ UI/UX responsive e professionale
- ✅ Performance ottimizzate per produzione
- ✅ Code quality e documentazione completa

Questa release stabilisce **Finance WebApp** come soluzione completa per gestione finanziaria personale con funzionalità enterprise-grade e user experience consumer-friendly.

## [2.1.1] - 2025-09-03

### 🐛 Fixed (Correzioni Critiche)
- **Dashboard Loop Infiniti**: Risolti problemi di performance e stability
  - `DashboardFilters.jsx`: Rimossa dipendenza `onFiltersChange` dal `useEffect` per evitare loop infiniti
  - `Dashboard.jsx`: Memoizzati callback `handleFiltersChange` e `handleFilterMainChange` con `useCallback`
  - `useFilteredDashboardData.js`: Destrutturate dipendenze primitive negli array di dipendenze per stabilità render
- **Gestione Errori API**: Migliorata resilienza nell'hook `useUpcomingPlannedTransactions`
  - Gestione graceful di errori JSON parsing e risposte HTTP non-JSON
  - Prevenzione crash applicazione per endpoint non disponibili o errori di rete
  - Logging migliorato per debugging senza spam in console

### ⚡ Performance (Ottimizzazioni)
- **Render Stabilization**: Eliminati re-render inutili causati da oggetti che cambiano referenza
- **Memory Management**: Callback e filtri memoizzati correttamente per evitare memory leaks
- **Console Cleanup**: Rimossi log di debug che causavano spam nelle DevTools

### 🔧 Technical (Miglioramenti Tecnici)
- **State Management**: Pattern migliorati per gestione state reattiva senza loop infiniti
- **Error Boundaries**: Gestione errori più robusta per API calls e parsing dati
- **Code Quality**: Commenti migliorati e documentazione dei fix applicati

## [2.1.0] - 2025-09-03

### 🚀 Added (Novità)
- **Sistema Saldo Ottimizzato**: Implementazione completa bilanciamento saldo con cache intelligente
  - Hook `useBalance` centralizzato per gestione saldo applicazione
  - Saldo spostato nella topbar per visibilità costante
  - Cache intelligente con TTL 30 secondi + invalidazione automatica
  - Performance testate: 12k+ transazioni, prima query 339ms, successive istantanee

### ⚡ Performance (Ottimizzazioni Significative)
- **Calcolo Saldo**: Ottimizzazione drastica query database
  - Da 2 query aggregate separate a 1 query singola ottimizzata
  - Sistema caching in memoria con invalidazione automatica
  - Stress test: 10 query parallele completate in 0ms
- **Invalidazione Automatica**: Cache invalidata automaticamente su tutte le operazioni transazioni
  - TransactionService: CRUD manuali
  - PlannedTransactionService: transazioni automatiche  
  - LoanService: estinzioni prestiti
  - Materializzazione planned transactions

### 🐛 Fixed (Correzioni Critiche)
- **Bug Calcolo Saldo**: Risolto errore matematico nel calcolo bilanciamento
  - Prima: `income - outflows` (sbagliato, doppia sottrazione)
  - Ora: `income + outflows` (corretto, outflows già negativi nel DB)
  - Saldo ora matematicamente accurato: €1500 - €55 = €1445 ✅

### 🎨 UI/UX (Miglioramenti Interfaccia)
- **Topbar Saldo**: Saldo sempre visibile in alto a destra
  - Design responsive ottimizzato per desktop/mobile
  - Formattazione importi con separatori migliaia
  - Loading state elegante durante caricamento
  - Indipendente da filtri dashboard

### 🔧 Technical (Architettura Avanzata)
- **BalanceService Ottimizzato**: Service completamente riscritto per performance
  - Query aggregata singola invece di multiple query
  - Cache Map in memoria con gestione TTL
  - Invalidazione selettiva per userId specifico
  - Versione `balanceService.optimized.js` per volumi molto alti (50k+ transazioni)
- **Hook Architettura**: `useBalance` centralizzato per state management
  - Gestione loading, error, success states
  - Auto-refresh e cache management
  - Compatibilità con tutti i componenti

### 📊 Data Synchronization (Sincronizzazione Dati)
- **Aggiornamento Automatico**: Saldo si aggiorna istantaneamente per:
  - ✅ Transazioni manuali dal tab Transazioni
  - ✅ Transazioni automatiche da Planned Transactions
  - ✅ Rate prestiti materializzate automaticamente
  - ✅ Estinzioni prestiti (totali e parziali)
  - ✅ Modifiche/cancellazioni transazioni esistenti
  - ✅ Materializzazione transazioni loan vs non-loan

### 📚 Documentation (Documentazione)
- **Performance Testing**: Script completi testing performance
  - `generateTestTransactions.js`: Generazione 12k transazioni test
  - `testBalancePerformance.js`: Suite test performance completa
  - Metriche performance documentate e validate

### 💾 Database (Ottimizzazioni Query)
- **Indici Esistenti**: Sfruttamento ottimale indici database esistenti
  - `userId + date` per query temporali
  - `userId + main` per filtri categoria
- **Query Aggregation**: Singola query `SUM(amount)` vs multiple aggregate

### 🔄 Changed (Modifiche Architetturali)
- **App.jsx**: Integrazione hook useBalance nella topbar
- **Dashboard**: Rimozione saldo dalla dashboard (ora in topbar)
- **Cache Strategy**: Passaggio da no-cache a intelligent caching
- **Transaction Services**: Tutti i service ora invalidano cache automaticamente

### 📋 Files Modified (File Modificati Principali)
#### Frontend
- `src/App.jsx` - Integrazione saldo topbar con useBalance
- `src/features/app/useBalance.js` - Hook centralizzato gestione saldo (NUOVO)
- `src/features/dashboard/pages/Dashboard.jsx` - Rimozione saldo (spostato topbar)

#### Backend
- `server/src/services/balanceService.js` - Riscrittura completa con cache intelligente
- `server/src/services/balanceService.optimized.js` - Versione ottimizzata volumi alti (NUOVO)
- `server/src/services/transactionService.js` - Aggiunta invalidazione cache
- `server/src/services/plannedTransactionService.js` - Aggiunta invalidazione cache
- `server/src/services/loanService.js` - Aggiunta invalidazione cache
- `server/src/controllers/transactionsController.js` - Controller con invalidazione

#### Testing & Scripts
- `server/scripts/generateTestTransactions.js` - Generatore transazioni test (NUOVO)
- `server/scripts/testBalancePerformance.js` - Suite test performance (NUOVO)

### 🎯 Impact (Impatto Utente)
- **UX**: Saldo sempre visibile, aggiornamento istantaneo, nessun refresh necessario
- **Performance**: Applicazione reattiva anche con 10k+ transazioni
- **Reliability**: Calcoli matematicamente corretti, cache consistente
- **Scalability**: Sistema pronto per crescita volume dati significativa

---

## [2.0.1] - 2025-09-02

### 🔧 Technical (Miglioramenti Tecnici)
- **Validazione Form Prestiti**: Resa obbligatoria selezione categoria e sottocategoria
  - `categoryMain` ora obbligatorio nel form prestiti
  - `subcategoryId` ora obbligatorio nel form prestiti
  - Validazione con messaggi di errore specifici nell'UI
  - Migliorata UX con evidenziazione errori (bordo rosso)

### 🎨 UI/UX (Miglioramenti Interfaccia)
- **Form Prestiti**: Maggiore chiarezza su campi obbligatori
  - Indicatori visivi di errore per categoria principale e sottocategoria
  - Messaggi di errore descrittivi e contestuali
  - Clearance automatica errori alla selezione valori

### 📚 Documentation (Documentazione)
- **Specifiche Prestiti**: Aggiornate specifiche funzionali
  - Marcati categoria e sottocategoria come campi OBBLIGATORI
  - Chiarificazione integrazione con sistema budgeting

### 💾 Database (Impatti)
- Nessuna modifica schema database (validazione solo frontend)
- Coerenza dati garantita tramite validazione form

### 📋 Files Modified (File Modificati)
#### Frontend
- `src/features/loans/components/LoanFormModal.jsx` - Validazione obbligatoria categoria/sottocategoria

#### Documentation
- `docs/loans-specification.md` - Specifiche aggiornate con campi obbligatori
- `CHANGELOG.md` - Documentazione modifiche (questo file)

---

## [2.0.0] - 2025-08-31

### 🚀 Added (Novità)
- **Loans Management System**: Sistema completo gestione prestiti e mutui
  - Calcoli automatici ammortamento francese
  - Piano di ammortamento dettagliato con rate e interessi
  - Simulazioni estinzione anticipata
  - Integrazione con budgeting tramite planned transactions
- **Planned Transactions Enhancement**: Espansione sistema transazioni pianificate
  - Roadmap implementazione con priorità per enhancement futuri
  - Integrazione completa con loans per auto-generazione rate
  - Schedulazione automatica senza data di fine

### 📚 Documentation (Documentazione Maggiore)
- **Consolidamento Completo**: Riorganizzazione documentazione progetto
  - Consolidati 4 file separati in `page-map.md` unico
  - Rimossi: `PLANNED_TRANSACTIONS_ROADMAP.md`, `PLANNED_TRANSACTIONS_SUMMARY.md`, `planned-transactions-feature.md`, `LOANS_FEATURE_DOCUMENTATION.md`
  - Aggiornato `readme_agent.md` con nuove funzionalità (v2.0.0)
  - Aggiornato `.conventions.md` con convenzioni advanced features (v1.2.0)
- **Page Map Expansion**: `page-map.md` ora include documentazione completa per:
  - Sistema Loans con architettura, formule matematiche e API
  - Planned Transactions con roadmap enhancement e sistema schedulazione
  - Database schema aggiornato con tabelle loans e loan_payments
  - Hook specializzati e backend services avanzati

### 🔧 Technical (Architettura)
- **Database Schema**: Estensione schema con tabelle prestiti
  - `loans` - Prestiti e mutui con calcoli ammortamento
  - `loan_payments` - Rate e pagamenti con tracking stato
  - Relazioni integrate con users, subcategories, planned_transactions
- **Backend Services**: Nuovi servizi matematici e business logic
  - `loanCalculationService.js` - Formule ammortamento francese
  - `loanService.js` - CRUD operations e integrazione budgeting
  - `loanBudgetingService.js` - Sincronizzazione con planned transactions
- **API Expansion**: Nuovi endpoint `/api/loans/*` per gestione completa prestiti

### 🎨 UI/UX (Interfaccia)
- **Navigazione Estesa**: Aggiunto tab "Loans" al sistema di navigazione principale
- **Component Architecture**: Preparazione componenti per loans management
  - `LoanCard.jsx`, `LoanModal.jsx`, `LoansDashboard.jsx`
  - `PaymentModal.jsx`, `AmortizationTable.jsx`
  - Hooks specializzati: `useLoans.js`, `useLoanDetails.js`, `useLoanPayments.js`

### 🗺️ Project Organization (Organizzazione Progetto)
- **Clean Structure**: Eliminazione file ridondanti per struttura più pulita
- **Centralized Documentation**: Tutta la documentazione tecnica ora centralizzata
- **Version Alignment**: Sincronizzazione versioni across documentazione
- **Maintenance**: Struttura ottimizzata per maintenance e aggiornamenti futuri

### 📝 Changed (Modifiche)
- **Documentation Strategy**: Passaggio da documentazione distribuita a centralizzata
- **Version Numbering**: Bump a v2.0.0 per riflettere major feature additions
- **File Organization**: Riduzione da 7 file documentazione a 4 file core

---

## [1.1.0] - 2025-01-30

### 🚀 Added (Novità)
- **Toast System Completo**: Feedback immediato per tutte le operazioni budgeting
- **Performance Monitoring**: Implementazione ottimizzazioni query database
- **Real-time Sync**: Aggiornamento automatico dati budgeting dopo operazioni CRUD

### ⚡ Performance (Ottimizzazioni)
- **Backend Database**: Risolto problema N+1 queries in `batchAccumulateBudgets`
  - Da ~24 query seriali a 3 query batch per transazioni mensili
  - Riduzione tempo risposta da 2-3 secondi a <500ms
- **Batch Operations**: Implementate operazioni batch per validazione sottocategorie
- **Memory Optimization**: Processing in-memory per calcoli accumulo budget
- **Query Optimization**: 
  - Singola query per validazione multipla sottocategorie
  - Batch fetch budget esistenti invece di query individuali
  - Transazione database unica per tutte le upsert

### 🎨 UI/UX (Miglioramenti Interfaccia)
- **Feedback Immediato**: Toast "⏳ Applicando..." subito al click
- **Loading States**: Stati di caricamento visivi per operazioni async
- **Error Handling**: Toast di errore dettagliati con descrizioni specifiche
- **Success Feedback**: Conferme di successo con dettagli operazione

### 🔧 Technical (Miglioramenti Tecnici)
- **Database Layer**: Ottimizzazione `server/src/services/budgetService.js`
- **API Layer**: Miglioramenti `server/src/controllers/plannedTransactionsController.js`
- **Frontend Layer**: Ottimizzazione `src/features/transactions/components/PlannedTransactionsTab.jsx`
- **Real-time Updates**: Sincronizzazione automatica tra transazioni pianificate e budgeting

### 🐛 Fixed (Correzioni)
- **Ritardo Applicazione Budgeting**: Risolto ritardo 2-3 secondi nelle operazioni
- **Missing Sync**: Eliminazione transazione ora aggiorna budgeting in tempo reale
- **Toast Compatibility**: Corretta compatibilità con sistema toast esistente
- **Memory Leaks**: Prevenzione memory leak con cleanup appropriato Promise

### 📚 Documentation (Documentazione)
- **Performance Guidelines**: Aggiornate convenzioni con best practices database
- **Code Examples**: Esempi N+1 vs Batch patterns in `.conventions.md`
- **Agent Guidelines**: Aggiornato `readme_agent.md` con sezione performance
- **Architecture Notes**: Documentate ottimizzazioni e pattern utilizzati

### 🔄 Changed (Modifiche)
- **Toast System**: Migrazione da toast.loading (non esistente) a toast.info + success/error
- **Database Patterns**: Standardizzazione su pattern batch per operazioni multiple
- **Error Handling**: Centralizzazione gestione errori con toast system
- **Async Operations**: Standardizzazione feedback pattern per operazioni asincrone

### 💾 Database (Modifiche Database)
- Nessuna modifica schema database
- Ottimizzazioni a livello query senza impatti strutturali

### 📋 Files Modified (File Modificati)
#### Backend
- `server/src/services/budgetService.js` - Ottimizzazione batchAccumulateBudgets
- `server/src/controllers/plannedTransactionsController.js` - Fix indentazione e ottimizzazioni

#### Frontend  
- `src/features/transactions/components/PlannedTransactionsTab.jsx` - Toast system e sync
- `src/features/transactions/components/BudgetApplicationModal.jsx` - Miglioramenti feedback

#### Documentation
- `readme_agent.md` - Aggiunta sezione performance
- `.conventions.md` - Performance guidelines e esempi
- `CHANGELOG.md` - Creazione changelog (questo file)

---

## [1.0.0] - 2025-01-19

### 🚀 Initial Release
- Implementazione completa sistema transazioni pianificate
- Sistema budgeting con integrazione automatica
- Autenticazione JWT completa
- Dashboard con overview finanziaria
- Gestione categorie e sottocategorie
- Sistema CRUD transazioni
- UI responsive con dark mode
- Backend REST API con Prisma ORM

---

**Legenda:**
- 🚀 **Added**: Nuove funzionalità
- ⚡ **Performance**: Ottimizzazioni performance
- 🎨 **UI/UX**: Miglioramenti interfaccia utente
- 🔧 **Technical**: Modifiche tecniche/architetturali
- 🐛 **Fixed**: Correzioni bug
- 📚 **Documentation**: Aggiornamenti documentazione
- 🔄 **Changed**: Modifiche funzionalità esistenti
- 💾 **Database**: Modifiche schema/struttura database
