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