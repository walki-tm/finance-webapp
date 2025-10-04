# 🚨 GUIDA RISOLUZIONE FREEZE FRONTEND

## 🎯 Problema Identificato
- **Utente specifico**: `m.venezia02@outlook.it`
- **Sintomi**: Frontend si blocca sulla schermata principale
- **Causa**: Loop infinito nei hooks React (NON problemi dati)
- **Stato dati**: ✅ Database pulito, planned transactions corrette

## 🛠️ SOLUZIONI IMMEDIATE

### 1. 🔧 DEBUG BROWSER (PRIMA AZIONE)

1. **Login con utente problematico** (`m.venezia02@outlook.it`)
2. **Apri DevTools** (F12)
3. **Console tab** - Controlla errori ripetuti o loop infiniti
4. **Network tab** - Verifica richieste API in loop
5. **Performance tab** - Identifica processi che bloccano il thread principale

### 2. 🧹 CLEAR STORAGE (SOLUZIONE RAPIDA)

Nella **Console del browser**, esegui:
```javascript
// Clear di tutto il storage locale
localStorage.clear();
sessionStorage.clear();

// Ricarica la pagina
location.reload();
```

**Se questo funziona, il problema era nei dati cached corrotti.**

### 3. 📊 ANALISI LOGS REACT

I **log di debug sono stati aggiunti** ai hooks principali:
- `useBalance.js` - Monitoraggio caricamento saldo
- `usePlannedTransactions.js` - Monitoraggio refresh trigger
- `useUpcomingPlannedTransactions.js` - Monitoraggio caricamenti

**Nella Console, cerca pattern come:**
```
🔄 useBalance: loadBalance chiamata (ripetuto continuamente)
🔄 usePlannedTransactions: Effect caricamento (ripetuto continuamente)
🔄 useUpcomingPlannedTransactions: Effect caricamento (ripetuto continuamente)
```

### 4. 🔍 ISOLAMENTO COMPONENTE

Se il problema persiste, **disabilita temporaneamente** i componenti sospetti:

**Nel file `src/App.jsx` o nel componente principale**, commenta:
```jsx
// Disabilita temporaneamente per test
// <UpcomingPlannedTransactions />
// <BalanceDisplay />
```

**Riabilita uno alla volta** per identificare quale causa il loop.

## 🎯 CAUSE PROBABILI IDENTIFICATE

### 1. **Event Listener Loop** (useBalance.js)
```javascript
// 🚨 Possibile loop infinito qui:
window.addEventListener('balanceRefresh', handleBalanceRefresh)
```

### 2. **RefreshTrigger Loop** (usePlannedTransactions.js)
```javascript
// 🚨 RefreshTrigger potrebbe causare loop:
const [refreshTrigger, setRefreshTrigger] = useState(0)
setRefreshTrigger(prev => prev + 1) // Questo triggera ricaricamenti
```

### 3. **Token/Effect Dependencies**
```javascript
// 🚨 Dipendenze che cambiano potrebbero causare re-render infiniti:
useEffect(() => { ... }, [token, limit])
```

## 🛡️ SOLUZIONI DEFINITIVE

### Se identifichi il loop, applica una di queste correzioni:

#### A. **Dependency Array Fix**
```javascript
// ❌ Problematico:
useEffect(() => { ... }, [callback])

// ✅ Corretto:
useEffect(() => { ... }, [stableValue])
```

#### B. **useCallback Fix**
```javascript
// ❌ Problematico:
const callback = async () => { ... }

// ✅ Corretto:
const callback = useCallback(async () => { ... }, [stableValue])
```

#### C. **Event Listener Cleanup**
```javascript
useEffect(() => {
  const handler = () => { ... }
  window.addEventListener('event', handler)
  
  return () => {
    window.removeEventListener('event', handler) // ✅ SEMPRE cleanup
  }
}, [])
```

## 🔄 SCRIPT DI DEBUG AUTOMATICO

**Copia questo nel browser console per monitoring automatico:**

```javascript
// Monitora loop infiniti
let callCounts = {};
const originalLog = console.log;
console.log = function(...args) {
  const message = args[0];
  if (typeof message === 'string' && message.includes('🔄')) {
    callCounts[message] = (callCounts[message] || 0) + 1;
    if (callCounts[message] > 10) {
      console.error('🚨 INFINITE LOOP DETECTED:', message, 'called', callCounts[message], 'times');
    }
  }
  originalLog.apply(this, args);
};

// Monitora re-renders
let renderCount = 0;
setInterval(() => {
  console.log('📊 Render monitoring - Check for excessive renders in React DevTools');
  renderCount = 0;
}, 5000);
```

## ✅ VERIFICA RISOLUZIONE

1. **Nessun log ripetuto** nella console
2. **Network tab** mostra richieste normali (non infinite)
3. **Performance tab** mostra CPU usage normale
4. **Frontend** si carica e risponde normalmente

## 🎯 SE TUTTO FALLISCE

**Soluzioni estreme:**

1. **Disabilita tutte le planned transactions** per l'utente temporaneamente
2. **Fai logout/login** per resettare tutto lo stato React
3. **Usa un browser diverso** o modalità incognito
4. **Controlla estensioni browser** che potrebbero interferire

## 📞 NEXT STEPS

1. **Applica i fix di debug** che ho aggiunto
2. **Testa con browser fresh** 
3. **Riporta i log** che vedi nella console
4. **Identifica il componente** specifico che causa il loop
5. **Applica la correzione definitiva**

---

**🔧 Log aggiunti nei file:**
- `src/features/app/useBalance.js` - Logs per loadBalance e event listeners
- `src/features/transactions/usePlannedTransactions.js` - Logs per refreshTrigger  
- `src/features/dashboard/useUpcomingPlannedTransactions.js` - Logs per caricamenti

**🎯 Prossima azione**: Testa con l'utente problematico e riporta i log della console!