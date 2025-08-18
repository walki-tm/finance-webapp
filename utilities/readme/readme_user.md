# Finance Webapp

## Requisiti

- Node.js ≥ 18
- npm ≥ 9

## Installazione e comandi principali

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Avvia l'ambiente di sviluppo:
   ```bash
   npm run dev
   ```
3. Genera la build di produzione:
   ```bash
   npm run build
   ```

## Configurazione dell'ambiente

Crea un file `.env.development` nella radice del progetto e imposta la variabile:

```bash
VITE_API_URL=http://localhost:3001
```

`VITE_API_URL` indica l'endpoint base del backend a cui l'applicazione si collega.

## Aggiunta di nuove tab

1. Crea la pagina React in `src/features/<nome-tab>/pages`.
2. Importa la pagina in `src/lib/tabs.js` e aggiungi un oggetto all'array `tabs` con chiave, etichetta, componente e icona.

## Funzionalità

- **Dashboard**: riepilogo delle transazioni con grafici interattivi e analisi per periodo.
- **Budgeting**: definizione dei budget annuali per sottocategoria e confronto con la spesa effettiva.
