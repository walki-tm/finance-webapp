# GENERA IL CLIENT PRISMA (DOPO AVER CLONATO/PULLATO O DOPO CAMBI ALLO SCHEMA)
npx prisma generate

# APRI L'INTERFACCIA PRISMA STUDIO (ISPEZIONA/MODIFICA DATI LOCALI)
npx prisma studio

# CREA UNA NUOVA MIGRAZIONE (AMBIENTE DI SVILUPPO)
# USA QUANDO MODIFICHI schema.prisma (ES. AGGIUNGI CAMPI/TABELLE/ENUM)
npx prisma migrate dev --name descrizione_migrazione

# APPLICA MIGRAZIONI IN PRODUZIONE (ATTENZIONE!)
# (In dev spesso basta migrate dev; in prod usare 'deploy' su env di prod)
npx prisma migrate deploy

# VERIFICA LO STATO DELLE MIGRAZIONI
npx prisma migrate status

# RESEED (SE HAI UNO SCRIPT DI SEED CONFIGURATO)
npm run seed
# oppure
npx prisma db seed

# RESET COMPLETO DEL DB DI SVILUPPO (CANCELLA I DATI! SOLO IN DEV)
npx prisma migrate reset

# 1) MODIFICA LO SCHEMA (schema.prisma)
#   - ESEMPIO: AGGIUNGI UN COLORE HEX A Category
#   model Category {
#     id        String   @id @default(cuid())
#     userId    String
#     main      MainCategory
#     name      String
#     iconKey   String?
#     colorHex  String?   // <--- AGGIUNTO
#     createdAt DateTime @default(now())
#     updatedAt DateTime @updatedAt
#     ...
#   }

# 2) CREA LA MIGRAZIONE (LOCALE) E APPLICALA AL DB DI SVILUPPO
npx prisma migrate dev --name add-colorhex-to-category

# 3) RIGENERA IL CLIENT (SE NON GIÀ FATTO DAL PASSO PRECEDENTE)
npx prisma generate

# 4) AGGIORNA IL CODICE APP (BACKEND/FRONTEND) PER USARE IL NUOVO CAMPO
#   - BACKEND: includi colorHex nei select/create/update
#   - FRONTEND: aggiungi il campo nelle API e nello stato UI

# 5) COMMIT E PUSH DELLA MIGRAZIONE E DEL CODICE
git add .
git commit -m "feat(db): add colorHex to Category + UI wiring"
git push

# 6) IN PRODUZIONE/AMBIENTI REMOTI: APPLICA LE MIGRAZIONI
npx prisma migrate deploy

# QUANDO MODIFICHI ENUM O RINOMINI CAMPI SERVE UNA MIGRAZIONE
# - VALUTA IMPATTO SUI DATI ESISTENTI (POTREBBERO SERVIRE SCRIPT DI MIGRAZIONE)
# - TESTA IN LOCALE, POI DEPLOY
npx prisma migrate dev --name rename-field-or-update-enum
npx prisma generate

# ERRORE DI CONNESSIONE: CONTROLLA LA STRINGA DATABASE_URL IN .env
# ESEMPI POSTGRES:
# DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# ALLINEA CLIENT E SCHEMA SE SONO "OUT OF DATE"
npx prisma generate

# SE MIGRAZIONI INCASTRATE IN DEV
npx prisma migrate reset
