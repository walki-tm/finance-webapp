# 🤖 Finance WebApp - README per Agenti AI

> **⚠️ IMPORTANTE**: Leggi questo documento PRIMA di effettuare qualsiasi modifica al progetto.

## 🎯 Guida Rapida per Agenti AI

### 📋 Prima di Iniziare
1. **Leggi sempre** `.conventions.md` per le regole del progetto
2. **Consulta** `page-map.md` per la struttura completa
3. **Non modificare** funzionalità esistenti senza esplicita richiesta
4. **Mantieni** la struttura e l'architettura attuali
---

## 🏗️ Architettura del Progetto

### Stack Tecnologico
```
Frontend: React 18 + Vite + TailwindCSS
Backend: Node.js + Express + Prisma ORM  
Database: PostgreSQL
Auth: JWT
UI: Custom components + Lucide Icons
```

### Struttura Directory
```
/
├── src/                    # Frontend React
├── server/                 # Backend Node.js
├── .conventions.md         # ⚠️ REGOLE OBBLIGATORIE
├── page-map.md            # Mappa completa progetto
└── readme_agent.md        # Questo file
```

---

## 🚨 Regole Critiche

### ❌ NON FARE MAI
- Non modificare la struttura database senza approvazione
- Non cambiare il sistema di autenticazione
- Non rimuovere funzionalità esistenti
- Non modificare API endpoints esistenti
- Non cambiare lo schema Prisma
- Non aggiungere dipendenze non necessarie

### ✅ SEMPRE FARE
- Seguire le convenzioni in `.conventions.md`
- Mantenere compatibilità backward
- Aggiungere documentazione per nuovo codice
- Testare modifiche prima del commit, chiedere all'utente se può testare personalmente
- Chiedere all'utente se si può procedere al commit
- Usare TypeScript dove appropriato
- Seguire pattern esistenti

---

## 🔍 Punti di Attenzione

### 🔐 Autenticazione
- **Sistema**: JWT con context React
- **Middleware**: `server/src/middleware/auth.js`
- **Context**: `src/context/AuthContext.jsx`
- **⚠️ Non modificare** senza esplicita richiesta

### ⚡ Performance e Ottimizzazioni
- **Database**: Ottimizzazioni query N+1 implementate in `batchAccumulateBudgets`
- **Toast System**: Feedback UI immediato per operazioni budgeting
- **Real-time Sync**: Refresh automatico dati budgeting per tutte le operazioni CRUD
- **Background Processing**: Operazioni async ottimizzate per UX fluida

### 📊 State Management
- **Pattern**: Custom hooks per feature
- **Hook globali**: `src/features/app/`
- **Hook feature**: `src/features/[feature]/use[Feature].js`
- **Context**: Solo per auth, resto tramite hooks

### 🎨 UI Components
- **Base**: `src/components/ui/`
- **Feature-specific**: `src/features/[feature]/components/`
- **Styling**: TailwindCSS con classi utility
- **Icone**: Lucide React

### 🔧 API Structure
- **Pattern**: REST con Prisma ORM
- **Validation**: Zod schemas
- **Error handling**: Middleware centralizzato
- **Auth**: Bearer token JWT

---

## 📝 Come Lavorare sul Progetto

### 1. Analisi Request
```
1. Leggi .conventions.md
2. Controlla page-map.md per contesto
3. Identifica file interessati
4. Pianifica modifiche minimal
```

### 2. Modifica Codice
```
1. Mantieni struttura esistente
2. Segui pattern consolidati
3. Aggiungi documentazione inline
4. Testa funzionalità
```

### 3. Validazione
```
1. Controlla convenzioni rispettate
2. Verifica backward compatibility
3. Aggiorna documentazione se necessario
4. Testa che tutto funzioni
```

---

## 🗂️ File Chiave da Conoscere

### Frontend
| File | Scopo | Attenzione |
|------|-------|------------|
| `src/App.jsx` | Root component | ⚠️ Non modificare layout |
| `src/context/AuthContext.jsx` | Auth state | ⚠️ Sistema critico |
| `src/features/*/use*.js` | Custom hooks | Pattern consolidato |
| `src/components/ui/` | UI base | Componenti riutilizzabili |

### Backend
| File | Scopo | Attenzione |
|------|-------|------------|
| `server/src/index.js` | Server entry | ⚠️ Non modificare setup |
| `server/src/controllers/` | Route handlers | Seguire pattern esistente |
| `server/src/services/` | Business logic | Logica core |
| `server/src/middleware/auth.js` | JWT validation | ⚠️ Sistema critico |
| `server/prisma/schema.prisma` | DB schema | ⚠️ Non modificare senza ok |

---

## 🔄 Pattern Comuni

### Nuovo Componente React
```jsx
/**
 * 📄 NOME COMPONENTE: Descrizione breve
 * 
 * 🎯 Scopo: Cosa fa questo componente
 * 
 * @author Finance WebApp Team
 * @modified [Data] - Aggiunta/modifica descrizione
 */

import React from 'react'
// imports...

export default function ComponentName({ prop1, prop2 }) {
  // 🔸 State hooks
  
  // 🔸 Effect hooks
  
  // 🔸 Handler functions
  
  // 🔸 Render
  return (
    <div className="...">
      {/* contenuto */}
    </div>
  )
}
```

### Nuovo Controller Backend
```javascript
/**
 * 📄 NOME CONTROLLER: Descrizione
 * 
 * 🎯 Scopo: Gestisce [funzionalità]
 * 
 * @author Finance WebApp Team
 * @modified [Data] - Aggiunta/modifica
 */

// 🔸 Import dependencies
import { z } from 'zod'

// 🔸 Import services
// ...

// 🔸 Validation schemas
const schema = z.object({
  // validazione...
})

/**
 * 🎯 CONTROLLER: Descrizione funzione
 */
export async function functionName(req, res, next) {
  try {
    // 🔸 Validazione input
    // 🔸 Business logic  
    // 🔸 Response
  } catch (error) {
    next(error)
  }
}
```

---

## 🛠️ Comandi Utili

### Frontend
```bash
npm run dev          # Avvia dev server
npm run build        # Build produzione  
npm run preview      # Preview build
```

### Backend
```bash
npm run dev          # Avvia server dev
npm run db:migrate   # Applica migrations
npm run db:seed      # Seed database
```

---

## 🔍 Debug e Troubleshooting

### Problemi Comuni

#### Frontend non compila
```bash
# Controlla dipendenze
npm install

# Controlla sintassi JSX
# Verifica import paths
```

#### Backend non parte
```bash
# Controlla .env
# Verifica DATABASE_URL
# Controlla porta disponibile
```

#### Database issues
```bash
# Reset database
npm run db:reset

# Genera Prisma client
npx prisma generate
```

---

## 📚 Risorse di Riferimento

### Documentazione Tecnica
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Prisma Docs](https://prisma.io/docs)
- [Express Docs](https://expressjs.com)

### Progetto Specifico
- `.conventions.md` - Regole obbligatorie
- `page-map.md` - Struttura progetto
- `readme_user.md` - Info per utenti finali

---

## ⚡ Quick Reference

### Aggiungere nuova feature
1. Crea directory in `src/features/[nome]/`
2. Aggiungi `pages/`, `components/`, `hooks/` se necessario
3. Crea hook principale `use[Nome].js`
4. Aggiungi route in backend se serve
5. Aggiorna documentazione

### Modificare API esistente
1. ⚠️ Controlla backward compatibility
2. Aggiorna controller e service
3. Aggiorna validation schema
4. Testa tutti gli endpoint esistenti
5. Aggiorna documentazione API

### Aggiungere nuovo componente UI
1. Aggiungi in `src/components/ui/`
2. Segui pattern esistenti
3. Aggiungi export in `index.js`
4. Documenta props e utilizzo
5. Testa in diversi contesti

---

## 🎯 Obiettivi del Progetto

### Funzionalità Core
- ✅ Autenticazione utenti
- ✅ Gestione categorie/sottocategorie  
- ✅ CRUD transazioni
- ✅ Dashboard overview
- 🔄 Sistema budgeting
- 🔄 Report e analytics

### Principi Architetturali
- **Modularità**: Feature-based organization
- **Scalabilità**: Pattern riutilizzabili
- **Manutenibilità**: Codice ben documentato
- **Performance**: State management ottimizzato
- **UX**: Interfaccia intuitiva e responsive

---

**🔄 Ultimo aggiornamento**: 19 Gennaio 2025  
**📝 Versione**: 1.0.0

> **Ricorda**: Questo progetto ha una struttura consolidata. Cambiamenti strutturali richiedono sempre approvazione esplicita dall'utente.
