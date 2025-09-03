# 📝 Finance WebApp - Changelog

Tutte le modifiche importanti al progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto segue il [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
