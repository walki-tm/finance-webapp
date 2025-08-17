# DOVE SONO I DATI?
# - LOCALE = WORKING DIRECTORY + INDEX + COMMITS NEL TUO REPO LOCALE
# - REMOTO = BRANCH SU GITHUB (origin/<branch>)
# - 'git push' COPIA I TUOI COMMITS LOCALI NEL REMOTO
# - 'git pull' PRENDE I COMMITS DAL REMOTO E LI UNISCE NEL TUO LOCALE

# VERIFICA IN CHE BRANCH SEI (LOCALE)
git status
git branch

# ALLINEA I RIFERIMENTI REMOTI (NON MODIFICA I FILE LOCALI)
git fetch --all --prune

# PASSA AL BRANCH main (LOCALE) E ALLINEA COL REMOTO
git checkout main
git pull origin main

# CREA UN NUOVO BRANCH PER LAVORARE SU UNA FEATURE (LOCALE)
git checkout -b feature/nome-feature

# PUBBLICA IL BRANCH REMOTAMENTE (CREA origin/feature/nome-feature)
git push -u origin feature/nome-feature

# AGGIUNGI E COMMITTA LE MODIFICHE (LOCALE)
git add .
git commit -m "descrizione chiara della modifica"

# PUSH SUL BRANCH CORRENTE (INVIA I COMMITS LOCALI AL REMOTO)
git push

# PUSH DIRETTO SU main (USA SOLO SE SICURO E SE IL FLUSSO LO PERMETTE)
git checkout main
git pull origin main
git merge feature/nome-feature   # UNISCE IL BRANCH NEL main (LOCALE)
# RISOLVI EVENTUALI CONFLITTI -> git add <file_conflitto> -> git commit
git push origin main             # ORA main LOCALE -> REMOTO

# ALTERNATIVA: MERGE VIA PULL REQUEST
# - PUSH DEL BRANCH -> APRI PR SU GITHUB -> MERGE DA INTERFACCIA -> POI:
git checkout main
git pull origin main             # SINCRONIZZA main LOCALE AL MERGE REMOTO

# AGGIORNA IL TUO BRANCH CON LE ULTIME DI main (EVITA CONFLITTI FUTURI)
git checkout feature/nome-feature
git fetch origin
git merge origin/main
# (oppure rebase, se preferisci storia lineare)
git rebase origin/main
# in caso di conflitti: risolvi -> git add -> git rebase --continue

# ROLLBACK NON DISTRUTTIVO (CREA UN NUOVO COMMIT CHE ANNULLA QUELLO INDESIDERATO)
git revert <ID_COMMIT>
git push                         # DOVE: LOCALE -> REMOTO

# ROLLBACK DISTRUTTIVO (RISCRIVE LA STORIA LOCALE; ATTENZIONE!)
# - QUESTO SPOSTA IL PUNTATORE LOCALE; IL REMOTO RESTA FERMO FINCHÉ NON FORZI
git reset --hard HEAD~1          # TORNA DI 1 COMMIT (LOCALE)
# PER ALLINEARE IL REMOTO (OPERAZIONE PERICOLOSA, EVITA SU BRANCH CONDIVISI)
git push --force-with-lease

# RIPRISTINA FILE DA REMOTO/ALTRO BRANCH SENZA CAMBIARE BRANCH ATTUALE
git checkout origin/main -- path/del/file

# SALVA MODIFICHE TEMPORANEE SENZA COMMITTARE (LOCALE)
git stash
git stash pop

# VEDI LOG BREVE CON ID COMMIT (PER REVERT/RESET)
git log --oneline --graph --decorate --all
