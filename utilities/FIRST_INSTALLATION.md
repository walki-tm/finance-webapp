# 🚀 Finance WebApp - Guida Prima Installazione

> **📋 IMPORTANTE**: Segui questa guida passo-passo per installare correttamente la Finance WebApp sul tuo sistema.

## 📋 Requisiti di Sistema

### Software Necessari
- **Node.js** (versione 18 o superiore) - [Download](https://nodejs.org/)
- **PostgreSQL** (versione 13 o superiore) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)
- **Editor di codice** (consigliato: VS Code) - [Download](https://code.visualstudio.com/)

### Sistema Operativo
- ✅ Windows 10/11
- ✅ macOS 10.15+  
- ✅ Linux Ubuntu 20.04+

---

## 📥 1. Download e Setup Iniziale

### Clone della Repository
```bash
# Clona la repository
git clone https://github.com/[username]/finance-webapp.git

# Naviga nella directory
cd finance-webapp

# Verifica struttura progetto
ls -la
```

### Verifica Node.js
```bash
# Verifica versione Node.js (deve essere 18+)
node --version

# Verifica versione npm
npm --version
```

---

## 🗄️ 2. Setup Database PostgreSQL

### Installazione PostgreSQL
1. **Scarica** PostgreSQL dal sito ufficiale
2. **Installa** seguendo il wizard (ricorda username/password!)
3. **Avvia** il servizio PostgreSQL

### Creazione Database
```bash
# Accedi a PostgreSQL (sostituisci 'postgres' con il tuo username)
psql -U postgres

# Crea il database
CREATE DATABASE finance_webapp;

# Crea utente (opzionale, ma consigliato per sicurezza)
CREATE USER finance_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE finance_webapp TO finance_user;

# Esci da PostgreSQL
\q
```

### Verifica Connessione
```bash
# Test connessione al database
psql -U postgres -d finance_webapp -c "SELECT version();"
```

---

## ⚙️ 3. Configurazione Backend

### Navigazione e Installazione Dipendenze
```bash
# Vai nella directory server
cd server

# Installa dipendenze
npm install

# Verifica che tutte le dipendenze siano installate
npm list
```

### Configurazione File .env
```bash
# Crea file .env nella directory server
touch .env

# O su Windows:
echo. > .env
```

**Contenuto del file `.env`:**
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/finance_webapp"

# JWT Secret (genera una chiave sicura!)
JWT_SECRET="your_very_long_and_secure_jwt_secret_key_here_2024"

# Server Configuration  
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

### Setup Database Schema
```bash
# Genera il client Prisma
npx prisma generate

# Esegui le migrations per creare le tabelle
npx prisma migrate dev --name init

# Verifica schema database
npx prisma studio
```

### Test Backend
```bash
# Avvia il server di sviluppo
npm run dev

# Il server dovrebbe avviarsi su http://localhost:3001
# Verifica nei log che non ci siano errori
```

---

## 🎨 4. Configurazione Frontend

### Navigazione e Installazione
```bash
# Torna alla directory root (da server/)
cd ..

# Vai nella directory src (frontend)
cd src

# Installa dipendenze frontend
npm install

# Verifica installazione
npm list
```

### Configurazione Environment Frontend
```bash
# Crea file .env nella directory src
touch .env

# O su Windows:
echo. > .env
```

**Contenuto del file `.env` (frontend):**
```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Finance WebApp
VITE_APP_VERSION=2.1.0
```

### Test Frontend
```bash
# Avvia il server di sviluppo frontend
npm run dev

# Il frontend dovrebbe avviarsi su http://localhost:5173
# Apri il browser e verifica che l'app si carichi
```

---

## 🧪 5. Test Completo del Sistema

### Verifica Connessione Database
```bash
# Dalla directory server
cd server

# Test connessione database
npx prisma db push
npx prisma studio

# Dovrebbe aprirsi l'interfaccia web di Prisma Studio
```

### Test API Backend
```bash
# Test endpoint health
curl http://localhost:3001/health

# O visita nel browser:
# http://localhost:3001/health
```

### Test Integrazione Frontend-Backend
1. **Apri** l'app nel browser: `http://localhost:5173`
2. **Registra** un nuovo utente
3. **Login** con le credenziali
4. **Crea** una categoria di test
5. **Aggiungi** una transazione di prova

---

## 🔧 6. Comandi Utili di Sviluppo

### Backend (da /server)
```bash
# Avvia server sviluppo
npm run dev

# Avvia server produzione
npm start

# Database migrations
npx prisma migrate dev

# Reset database (ATTENZIONE: cancella tutti i dati!)
npx prisma migrate reset

# Seed database con dati di esempio
npx prisma db seed

# Aprire Prisma Studio
npx prisma studio

# Generare client Prisma dopo modifiche schema
npx prisma generate
```

### Frontend (da /src)
```bash
# Avvia server sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build produzione
npm run preview

# Lint codice
npm run lint

# Fix lint automatico
npm run lint:fix
```

### Git e Version Control
```bash
# Verifica status
git status

# Aggiungi modifiche
git add .

# Commit con messaggio
git commit -m "feat: prima installazione completata"

# Push su repository
git push origin main
```

---

## 🐛 7. Risoluzione Problemi Comuni

### Problema: "Port already in use"
```bash
# Trova processo sulla porta 3001
netstat -ano | findstr :3001

# Termina processo (sostituisci PID)
taskkill /PID [process_id] /F
```

### Problema: "Database connection error"
1. **Verifica** che PostgreSQL sia avviato
2. **Controlla** le credenziali nel file `.env`
3. **Testa** connessione manuale con `psql`

### Problema: "Module not found"
```bash
# Pulisci cache npm
npm cache clean --force

# Rimuovi node_modules e reinstalla
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Prisma Client not generated"
```bash
# Rigenera client Prisma
npx prisma generate

# Se persiste, reinstalla
npm uninstall @prisma/client
npm install @prisma/client
```

---

## 🔐 8. Configurazione Sicurezza Produzione

### JWT Secret Sicuro
```bash
# Genera secret sicuro (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# O online: https://generate-secret.vercel.app/64
```

### Variabili Ambiente Produzione
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/finance_webapp"
JWT_SECRET="your_super_secure_production_jwt_secret"
CORS_ORIGIN="https://your-frontend-domain.com"
```

---

## 📚 9. Struttura Progetto Finale

```
finance-webapp/
├── src/                    # Frontend React + Vite
│   ├── components/        
│   ├── features/          
│   ├── hooks/             
│   ├── lib/               
│   ├── pages/             
│   └── styles/            
├── server/                # Backend Node.js + Express
│   ├── src/               
│   │   ├── controllers/   
│   │   ├── middleware/    
│   │   ├── routes/        
│   │   └── services/      
│   ├── prisma/           
│   └── tests/            
├── Utilities/            # Script e documentazione
├── .conventions.md       # Regole del progetto
├── page-map.md          # Mappa del progetto
└── readme_agent.md      # Info per AI agents
```

---

## ✅ 10. Checklist Finale

### Prima di iniziare lo sviluppo:
- [ ] Node.js installato e funzionante
- [ ] PostgreSQL installato e avviato
- [ ] Database `finance_webapp` creato
- [ ] File `.env` configurati (backend e frontend)
- [ ] Dipendenze installate (backend e frontend)
- [ ] Migrations database eseguite
- [ ] Backend avviato su porta 3001
- [ ] Frontend avviato su porta 5173
- [ ] Test login/registrazione funzionante
- [ ] Prima transazione creata con successo

### Per sviluppo continuo:
- [ ] Git repository configurato
- [ ] Editor configurato con ESLint/Prettier
- [ ] Backup automatico configurato (vedi BACKUP.md)
- [ ] Documentazione letta (`.conventions.md`, `readme_agent.md`)

---

## 🆘 Supporto

### In caso di problemi:
1. **Controlla** i log di errore nel terminale
2. **Verifica** che tutti i servizi siano avviati
3. **Consulta** la documentazione in `.conventions.md`
4. **Controlla** le issue su GitHub del progetto

### Log utili da controllare:
- **Backend**: Output del terminale dove hai avviato `npm run dev`
- **Frontend**: Console del browser (F12 → Console)
- **Database**: Log di PostgreSQL

---

**🎉 Congratulazioni!** Se hai completato tutti i passaggi, la tua Finance WebApp è pronta per l'uso!

> **💡 Prossimi passi**: Leggi `BACKUP.md` per configurare i backup automatici e familiarizza con `.conventions.md` per le regole di sviluppo.

---

**📝 Versione**: 1.0.0  
**📅 Ultimo aggiornamento**: 7 Settembre 2025
