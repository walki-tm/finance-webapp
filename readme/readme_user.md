# Guida Utente

Esempi d'uso delle funzioni offerte dal modulo `src/lib/api.js`.

```js
import { api } from '../src/lib/api';

// Registrazione
api.register('Mario', 'mario@example.com', 'password123');

// Login
api.login('mario@example.com', 'password123');

// Ottenere le categorie
api.listCategories(token);
```

Configura la variabile d'ambiente `VITE_API_URL` per indicare l'endpoint
base del backend.