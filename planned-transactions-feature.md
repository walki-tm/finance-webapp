# 📅 Planned Transactions - Documentazione Feature

> **Implementato**: 23 Agosto 2025  
> **Versione**: 1.0.0

## 🎯 Panoramica Funzionalità

La funzionalità **Planned Transactions** aggiunge al sistema Finance WebApp la capacità di:
- Creare e gestire transazioni schedulate (mensili, annuali, o una tantum)
- Organizzare transazioni pianificate in gruppi personalizzati
- Auto-materializzare transazioni quando sono in scadenza
- Gestire conferme manuali o automatiche

---

## 🏗️ Architettura Implementata

### Frontend
- **Sub-tab** "Planned" nella pagina Transactions
- **Layout cards** per visualizzazione gruppi e transazioni singole
- **Modal dedicati** per creazione/editing transazioni e gruppi
- **Alert system** per transazioni in scadenza

### Backend  
- **Nuove tabelle database**: `planned_transactions`, `transaction_groups`
- **API REST complete** per CRUD operations
- **Scheduler automatico** per materializzazione
- **Business logic** per calcoli di schedulazione

---

## 🗄️ Schema Database

### Tabella `planned_transactions`
```sql
- id: String (Primary Key)
- userId: String (Foreign Key → users)
- groupId: String? (Foreign Key → transaction_groups)
- main: String (categoria principale)
- subId: String? (Foreign Key → subcategories)
- amount: Decimal
- note: String?
- payee: String?
- frequency: String (MONTHLY|YEARLY|ONE_TIME)
- startDate: DateTime
- endDate: DateTime?
- confirmationMode: String (MANUAL|AUTOMATIC)
- nextDueDate: DateTime (calcolato automaticamente)
- isActive: Boolean
```

### Tabella `transaction_groups`
```sql
- id: String (Primary Key)
- userId: String (Foreign Key → users)
- name: String (nome personalizzato utente)
- sortOrder: Int (per riordinamento)
```

---

## 🔧 API Endpoints

### Transazioni Pianificate
- `GET /api/planned-transactions` - Lista transazioni pianificate
- `POST /api/planned-transactions` - Crea nuova transazione
- `PUT /api/planned-transactions/:id` - Aggiorna transazione
- `DELETE /api/planned-transactions/:id` - Elimina transazione
- `POST /api/planned-transactions/:id/materialize` - Materializza in transazione reale
- `GET /api/planned-transactions/due` - Ottieni transazioni in scadenza
- `PATCH /api/planned-transactions/:id/move` - Sposta in gruppo diverso

### Gruppi di Transazioni
- `GET /api/planned-transactions/groups` - Lista gruppi
- `POST /api/planned-transactions/groups` - Crea nuovo gruppo
- `PUT /api/planned-transactions/groups/:id` - Aggiorna gruppo
- `DELETE /api/planned-transactions/groups/:id` - Elimina gruppo
- `PATCH /api/planned-transactions/groups/reorder` - Riordina gruppi

---

## 🎨 Interfaccia Utente

### Sub-Tab Planned
- **Statistiche rapide**: Totale pianificate, in scadenza, importo mensile
- **Gruppi personalizzati**: Cards espandibili con info aggregate
- **Transazioni singole**: Cards individuali per transazioni non raggruppate
- **Alert scadenze**: Notifiche prominenti per transazioni da confermare

### Funzionalità Cards
- **Aggregated info**: Importo totale, conteggio, prossima scadenza
- **Drag-and-drop**: Spostamento transazioni tra gruppi (da implementare completamente)
- **Quick actions**: Modifica, elimina, materializza

---

## ⚙️ Sistema di Schedulazione

### Frequenze Supportate
- **MONTHLY**: Ripete ogni mese alla stessa data
- **YEARLY**: Ripete ogni anno alla stessa data  
- **ONE_TIME**: Eseguita una sola volta, poi disattivata

### Modalità di Conferma
- **MANUAL**: Richiede conferma utente per materializzazione
- **AUTOMATIC**: Materializza automaticamente alla scadenza

### Logica Auto-Materializzazione
- **Scheduler**: Controllo ogni ora per transazioni in scadenza
- **Calcolo nextDueDate**: Automatico basato su frequency e startDate
- **Gestione endDate**: Disattivazione automatica al raggiungimento
- **Logging**: Tracciamento completo operazioni scheduler

---

## 🔄 Flusso di Utilizzo

### Creazione Transazione Pianificata
1. Click "Nuova Transazione" nel tab Planned
2. Compilazione form con categoria, importo, frequenza, date
3. Selezione modalità conferma (Manual/Automatic)
4. Opzionale: Assegnazione a gruppo esistente
5. Salvataggio e calcolo automatico nextDueDate

### Gestione Gruppi
1. Click "Nuovo Gruppo" per creare contenitore
2. Denominazione personalizzata
3. Drag-and-drop transazioni nel gruppo
4. Visualizzazione statistiche aggregate
5. Riordinamento gruppi tramite UI

### Materializzazione
1. **Automatica**: Scheduler materializza transazioni AUTO in scadenza
2. **Manuale**: Alert nell'UI per conferma utente
3. **Risultato**: Creazione transazione reale nel Register
4. **Update**: Ricalcolo nextDueDate o disattivazione se ONE_TIME

---

## 🧪 Testing e Validazione

### Controlli da Effettuare
- [ ] Compilazione frontend senza errori
- [ ] Generazione migration database
- [ ] Test API endpoints con Postman/curl
- [ ] Verifica funzionamento scheduler
- [ ] Test responsive design
- [ ] Validazione flussi utente completi

### Commands Utili
```bash
# Backend
cd server
npx prisma generate        # Genera client Prisma
npx prisma db push         # Applica schema a DB
npm run dev               # Avvia server

# Frontend  
npm run dev               # Avvia dev server
npm run build             # Test build produzione
```

---

## 🚀 Stato Implementazione

### ✅ Completato
- [x] Schema database con nuove tabelle
- [x] API backend complete per CRUD operations
- [x] Hook frontend per state management
- [x] Struttura base componenti UI
- [x] Sistema di schedulazione automatica
- [x] Integrazione sub-tab in pagina Transactions

### 🔄 Da Completare (Implementazioni Avanzate)
- [ ] Modal completi con tutti i campi (categoria, subcategoria, date)
- [ ] Drag-and-drop effettivo per spostamento tra gruppi
- [ ] Funzionalità avanzate cards (expand/collapse)
- [ ] Filtri e ricerca nelle transazioni pianificate
- [ ] Export/import configurazioni
- [ ] Notifiche push per scadenze

---

## 📝 Note per Sviluppo Futuro

### Principi di Design
- **Cards-first**: Layout focalizzato su visualizzazione card
- **Grouped organization**: Capacità di raggruppamento flessibile
- **Smart scheduling**: Calcoli automatici per date future
- **User control**: Bilanciamento tra automazione e controllo manuale

### Pattern Architetturali
- **Feature-based structure**: Mantenuta organizzazione per feature
- **Custom hooks**: State management isolato e riutilizzabile
- **Service layer**: Business logic separata da presentation
- **Validation-first**: Zod schemas per tutti i dati in input

---

**🔄 Ultimo aggiornamento**: 23 Agosto 2025  
**📝 Versione documentazione**: 1.0.0

> Questa feature estende significativamente le capacità del sistema finanziario, introducendo la dimensione temporale e la pianificazione automatica.
