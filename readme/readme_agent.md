# Feature Modules Convention

Il codice sotto `src/features` è organizzato per funzionalità.
Ogni feature vive in una cartella dedicata:

```
src/features/<nome>/
  components/
  hooks/
  pages/
```

- **components**: componenti React specifici della feature.
- **hooks**: hook React riutilizzabili all'interno della feature.
- **pages**: pagine principali esposte dal router per quella feature.

Moduli condivisi come l'interfaccia utente (`ui`), le icone (`icons`) e i toast
(`toast`) seguono la stessa struttura e possono essere importati da altre
feature, ad esempio:

// ```js
// import { Button } from '../features/ui';
// import SvgIcon from '../features/icons/components/SvgIcon.jsx';
// import { useToast } from '../features/toast';
// ```

Questa convenzione mantiene separati i domini applicativi e facilita la
scalabilità del progetto.

## API layer

Il modulo `src/lib/api.js` centralizza le chiamate verso il backend.
Ogni metodo è documentato con JSDoc per parametri, risposta e possibili
errori. Configura la variabile d'ambiente `VITE_API_URL` per definire la
base delle richieste.

# Linee Guida di Contributo

## Struttura del repository
- **Frontend**: cartella `src/` con l'applicazione React e le feature organizzate in moduli.
- **Backend**: cartella `server/` con l'API Express e le relative route, controller e servizi.
- **Scripts**: cartella `scripts/` per script di supporto come la generazione della lista di icone.

## Convenzioni di naming e organizzazione
- Le feature vivono in cartelle dedicate sotto `src/features/<nome>/` suddivise in `components/`, `hooks/` e `pages/`.
- I componenti React usano nomi in PascalCase e sono salvati come `NomeComponente.jsx`.
- Gli hook personalizzati risiedono in `hooks/` e seguono il formato camelCase con prefisso `use`, es. `useTransactions.js`, accompagnati da test `useTransactions.test.js`.

## Aggiungere un nuovo tab
1. Creare la nuova feature nella cartella `src/features/<nome>/` con i relativi componenti e pagine.
2. Aggiornare `src/lib/tabs.js` aggiungendo una voce `{ key, label, component, icon }` per il tab.
3. Se il tab richiede nuove API, creare la route corrispondente in `server/src/routes/` e montarla in `server/src/index.js`.

## Requisiti di test
Prima di ogni commit eseguire:
- Test unitari: `npm test -- --run`.
- Test di integrazione: `npm run test:integration` (se disponibile).
- Linting del codice: `npm run lint` (se disponibile).