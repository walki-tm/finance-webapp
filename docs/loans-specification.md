# 🏦 Sistema Prestiti/Mutui - Specifiche Funzionali

> **📋 Versione**: 1.0  
> **📅 Data**: 2025-08-30  
> **👥 Target**: Mutui casa e Prestiti personali  

---

## 🎯 Obiettivi del Sistema

### Scopo Principale
Gestire prestiti e mutui con calcolo automatico delle rate, integrazione con il sistema di budgeting esistente e monitoraggio in tempo reale dei pagamenti e residui.

### Benefici Attesi
- **Visibilità completa**: Piano di ammortamento dettagliato
- **Automazione budgeting**: Rate integrate automaticamente nelle spese pianificate
- **Controllo finanziario**: Monitoraggio capitale/interessi, simulazioni estinzioni
- **Alert intelligenti**: Notifiche scadenze e opportunità di risparmio

---

## 🏗️ Requisiti Funzionali

### RF-01: Gestione Anagrafica Prestito
**Descrizione**: L'utente può creare, modificare e eliminare prestiti/mutui  

**Dati Required**:
- Nome prestito (es: "Mutuo Casa", "Prestito Auto")
- Tipo: MUTUO | PRESTITO_PERSONALE
- Banca/Ente erogante
- Importo iniziale (€)
- Data erogazione
- Durata (mesi)
- TAN (Tasso Annuo Nominale) %
- TAEG (Tasso Annuo Effettivo Globale) % [opzionale]
- Tipo tasso: FISSO | VARIABILE
- Frequenza rate: MENSILE | TRIMESTRALE | SEMESTRALE
- Data prima rata
- **Categoria principale spesa** (per integrazione budgeting) *[OBBLIGATORIO]*
- **Sottocategoria spesa** (per categorizzazione rate) *[OBBLIGATORIO]*

**Dati Optional**:
- Spese accessorie (perizie, notaio, etc.)
- Note/Descrizione
- Categoria spesa (integrazione con sistema esistente)

### RF-02: Calcolo Piano di Ammortamento
**Descrizione**: Sistema calcola automaticamente il piano di ammortamento completo

**Funzionalità**:
- Calcolo rata con formula ammortamento francese (rate costanti)
- Suddivisione quota capitale/interessi per ogni rata
- Calcolo residuo debito per ogni scadenza
- Totale interessi pagati vs. da pagare
- Durata effettiva residua

**Formule**:
```
Rata = C × [i × (1+i)^n] / [(1+i)^n - 1]
Dove: C = Capitale, i = tasso mensile, n = numero rate
```

### RF-03: Gestione Pagamenti
**Descrizione**: Tracciamento stato pagamenti rate con possibilità di registrazione manuale

**Stati Rata**:
- `PLANNED`: Rata pianificata (futura)
- `DUE`: Rata scaduta (non pagata)
- `PAID`: Rata pagata regolarmente
- `PAID_LATE`: Rata pagata in ritardo
- `PARTIAL`: Rata pagata parzialmente

**Funzionalità**:
- Registrazione pagamento rata (data, importo effettivo)
- Gestione pagamenti parziali o in anticipo
- Calcolo automatico penali ritardo [opzionale]
- Storico completo pagamenti

### RF-04: Integrazione Budgeting
**Descrizione**: Le rate dei prestiti si integrano automaticamente con il sistema di budgeting esistente

**Comportamenti**:
- Auto-creazione `PlannedTransaction` per ogni rata futura
- Aggiornamento automatico budget alla scadenza rate
- Sincronizzazione bidirezionale: modifica prestito → aggiorna planned transactions
- Categorizzazione automatica rate (capitale vs. interessi)

### RF-05: Simulazioni e Modifiche
**Descrizione**: Calcoli predittivi per gestione dinamica del prestito

**Simulazioni**:
- Estinzione anticipata (parziale/totale)
- Modifica durata prestito
- Impatto variazioni tasso (per tassi variabili)
- Confronto scenari diversi

**Modifiche Supportate**:
- Estinzione anticipata (con ricalcolo piano)
- Modifica tasso (per variabili o rinegoziazioni)
- Sospensione/ripresa pagamenti [avanzato]

### RF-06: Dashboard e Reporting
**Descrizione**: Visualizzazioni comprehensive per monitoraggio prestiti

**Dashboard Prestiti**:
- Card riassuntive per prestito (residuo, prossima rata, progresso)
- Calendario scadenze prossime rate
- Grafici: evoluzione debito residuo, capitale vs. interessi pagati

**Reports**:
- Piano ammortamento completo (tabella + export)
- Report annuale tax-friendly (interessi detraibili)
- Analisi performance finanziaria prestiti

### RF-07: Notifiche e Alert
**Descrizione**: Sistema intelligente di notifiche per scadenze e opportunità

**Notifiche**:
- Reminder pre-scadenza rata (7/3/1 giorni prima)
- Alert rata scaduta non pagata
- Notifica opportunity estinzione anticipata conveniente
- Alert variazioni tasso (per tassi variabili)

---

## 🔄 Integrazione con Sistema Esistente

### Planned Transactions
- Ogni rata genera una `PlannedTransaction` di tipo "LOAN_PAYMENT"
- Campo aggiuntivo `loan_id` per collegamento
- Auto-refresh budgeting dopo modifiche prestito

### Categories
- Categoria predefinita "Prestiti/Mutui" 
- Sottocategorie: "Interessi Mutuo", "Capitale Mutuo", "Prestito Personale"

### Notifications
- Estensione sistema notifiche esistente
- Nuovi tipi: `LOAN_PAYMENT_DUE`, `LOAN_RATE_CHANGE`, `LOAN_OPPORTUNITY`

---

## 👤 User Stories

### US-01: Creazione Prestito
```
Come utente,
Voglio creare un nuovo prestito inserendo i parametri finanziari,
Per ottenere automaticamente il piano di ammortamento e l'integrazione nel budgeting.

Acceptance Criteria:
- Form guidato con validazione parametri finanziari
- Calcolo immediato rata e piano ammortamento
- Auto-creazione planned transactions per rate future
- Aggiornamento automatico budget impattati
```

### US-02: Monitoraggio Prestito
```
Come utente,
Voglio visualizzare lo stato attuale dei miei prestiti e prossime scadenze,
Per avere controllo completo della mia situazione debitoria.

Acceptance Criteria:
- Dashboard con card riassuntive per prestito
- Calendario rate in scadenza
- Indicatori progress (% completamento, residuo debito)
- Drill-down su piano ammortamento dettagliato
```

### US-03: Registrazione Pagamento
```
Come utente,
Voglio registrare il pagamento di una rata,
Per aggiornare lo stato del prestito e il budgeting.

Acceptance Criteria:
- Quick action per "Marca rata come pagata"
- Possibilità inserimento importo effettivo vs. pianificato
- Auto-aggiornamento budget e planned transactions
- Storico pagamenti visibile
```

### US-04: Simulazione Estinzione
```
Come utente,
Voglio simulare un'estinzione anticipata,
Per valutare la convenienza economica.

Acceptance Criteria:
- Calcolo risparmio interessi vs. costo estinzione
- Impatto su cash flow futuro
- Confronto scenari (estinzione vs. investimento alternativo)
```

---

## 📊 Modello Dati Concettuale

### Entità Principali

**Loan** (Prestito)
- Anagrafica e parametri finanziari
- Stato attuale (attivo, estinto, sospeso)
- Calcoli derivati (rata, residuo, etc.)

**LoanPayment** (Pagamento Rata)
- Schedule pianificato vs. effettivo
- Suddivisione capitale/interessi
- Stato pagamento e tracking

**LoanModification** (Modifiche Prestito) [opzionale]
- Storico modifiche (estinzioni, variazioni tasso)
- Audit trail per trasparenza

### Relazioni
- `User 1:N Loan` (un utente può avere più prestiti)
- `Loan 1:N LoanPayment` (un prestito ha molte rate)
- `LoanPayment 1:1 PlannedTransaction` (ogni rata genera una planned transaction)
- `Loan N:1 Category` (prestito appartiene a categoria)

---

## 🚀 Implementazione Priority

### MVP (Minimum Viable Product)
1. ✅ CRUD prestiti base
2. ✅ Calcolo piano ammortamento francese
3. ✅ Integrazione con planned transactions
4. ✅ Dashboard riassuntiva prestiti
5. ✅ Registrazione pagamenti base

### V1.1 (Enhancement)
6. Simulazioni estinzione anticipata
7. Notifiche scadenze avanzate
8. Export piano ammortamento
9. Grafici evoluzione debito

### V1.2 (Advanced)
10. Gestione tassi variabili
11. Modifiche prestito dinamiche
12. Analytics comparativa prestiti
13. Tax reporting interessi

---

Questa specifica ti sembra completa? Vuoi che aggiunga o modifichi qualche aspetto prima di procedere con il design del modello dati Prisma?
