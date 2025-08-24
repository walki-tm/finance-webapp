# 🗺️ Planned Transactions - Roadmap Funzionalità Avanzate

> **Baseline**: Implementazione base completata  
> **Target**: Sistema completo con UX professionale

## 🎯 Priorità di Implementazione

### 🥇 **FASE 1 - Enhancement Immediate** (Alta Priorità)

#### 1.1 Modal Completo Transazioni Pianificate
- **Scopo**: Estendere PlannedTransactionModal.jsx con tutti i campi
- **Componenti**: CategorySelect, SubcategorySelect, DatePicker avanzato
- **Features**: 
  - Selezione categoria/sottocategoria visuale
  - Date picker per startDate/endDate
  - Toggle per confirmationMode
  - Assegnazione a gruppo esistente
  - Anteprima prossime occorrenze

#### 1.2 Badge & Filtri Rapidi
- **Posizione**: Header PlannedTransactionsTab
- **Filtri**: `Mensili | Annuali | Una tantum | Auto | Manuali | In scadenza`
- **Badge**: Su ogni card con colori distintivi
- **Implementazione**: FilterBar component + logica filtering

#### 1.3 Anteprima Prossime Occorrenze
- **Posizione**: In ogni PlannedTransactionCard
- **Display**: "Prossime: 24/09, 24/10, 24/11" (prossime 3-5 date)
- **Logica**: Funzione calculateNextOccurrences() nel service
- **Styling**: Timeline compatta sotto ogni card

---

### 🥈 **FASE 2 - UX Professional** (Media Priorità)

#### 2.1 Notifiche Interne & Visual Feedback
- **Card scadute**: Border rosso + icona alert
- **Toast automatici**: Quando scheduler materializza transazioni
- **Status indicators**: Colori dinamici basati su stato (attivo/pausa/scaduto)

#### 2.2 Azioni Rapide nelle Cards
- **Hover actions**: Conferma, pausa/riattiva, duplica, sposta, elimina
- **Quick buttons**: Icone overlay al hover su ogni card
- **Keyboard shortcuts**: Tasti rapidi per azioni frequenti

#### 2.3 Colori Personalizzati Gruppi
- **Schema DB**: Aggiungere `colorHex` a TransactionGroup
- **ColorPicker**: Riutilizzare componente esistente dalle categorie
- **Visual impact**: Cards colorate per identificazione rapida

---

### 🥉 **FASE 3 - Advanced Features** (Priorità Future)

#### 3.1 Timeline / Calendario
- **Vista Calendario**: Componente mensile/settimanale con planned transactions
- **Timeline Roadmap**: Vista orizzontale tipo Gantt per prossimi mesi
- **Integrazione**: Date picker calendario per ripianificazione drag-and-drop

#### 3.2 Drag & Drop Avanzato
- **Libreria**: react-beautiful-dnd per drag-and-drop fluido
- **Funzionalità**: 
  - Spostamento tra gruppi
  - Riordinamento dentro gruppi
  - Drag su calendario per ripianificare
- **Visual feedback**: Highlight zone di drop

#### 3.3 Statistiche & Analytics Avanzate
- **Progress bars budget**: Peso delle spese pianificate su reddito
- **Comparazioni**: Pianificato vs reale (collegamento al Register)
- **Dashboard dedicata**: Overview completa planned vs actual

---

## 🛠️ Implementazione Immediata Suggerita

Dato che la base è pronta, ti consiglio di iniziare con la **FASE 1** per rendere l'esperienza utente immediatamente più ricca:

### 1. **Badge e Filtri Rapidi** (30-45 min)
```jsx
// In PlannedTransactionsTab.jsx
const FilterBar = ({ activeFilter, onFilterChange }) => (
  <div className="flex gap-2 mb-4">
    {[
      { key: 'all', label: 'Tutte', color: 'gray' },
      { key: 'monthly', label: 'Mensili', color: 'blue' },
      { key: 'yearly', label: 'Annuali', color: 'green' },
      { key: 'one-time', label: 'Una tantum', color: 'purple' },
      { key: 'auto', label: 'Auto', color: 'orange' },
      { key: 'manual', label: 'Manuali', color: 'slate' },
      { key: 'due', label: 'In scadenza', color: 'red' }
    ].map(filter => (
      <button
        key={filter.key}
        onClick={() => onFilterChange(filter.key)}
        className={`px-3 py-1 rounded-full text-sm transition ${
          activeFilter === filter.key 
            ? `bg-${filter.color}-100 text-${filter.color}-700 border border-${filter.color}-300`
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {filter.label}
      </button>
    ))}
  </div>
)
```

### 2. **Anteprima Prossime Occorrenze** (45-60 min)
Estendere il service per calcolare le prossime date e mostrarle nelle card.

---

## ❓ Domanda per Te

**Quale implementazione preferisci iniziare?**

1. **Badge e filtri rapidi** (visibilità immediata)
2. **Modal completo** (funzionalità completa creazione)
3. **Anteprima occorrenze** (comprensione schedulazione)
4. **Testare prima tutto l'existente** (stabilità base)

Fammi sapere la tua preferenza e procedo con l'implementazione specifica! 🚀

<citations>
<document>
<document_type>RULE</document_type>
<document_id>92FLSyGFtkYFAnM68K7l0P</document_id>
</document>
<document>
<document_type>RULE</document_type>
<document_id>ttTCBoa8JLtMmUwkQgRQ55</document_id>
</document>
</citations>
