# Finance WebApp - Backup Sistema Semplice

## File Disponibili:
- backup_facile.bat          -> Fa il backup del database
- ripristina_backup.bat      -> Ripristina il database da un backup

## Come Fare Backup:
1. Fai doppio click su "backup_facile.bat"
2. Aspetta che finisca (vedrai "SUCCESS: Processo backup completato")
3. Premi un tasto per chiudere

## Come Ripristinare:
1. Fai doppio click su "ripristina_backup.bat"
2. Scegli il numero del backup da ripristinare
3. Digita "RIPRISTINA" per confermare
4. Aspetta che finisca
5. Riavvia l'applicazione Finance WebApp

## Frequenza Consigliata:
- Backup ogni 15 giorni (1° e 15 del mese)
- Backup extra prima di aggiornamenti importanti

## ATTENZIONE:
- Il ripristino CANCELLA tutti i dati attuali!
- Assicurati di aver chiuso l'applicazione prima del ripristino
- I backup vengono salvati nella cartella del progetto

## Risoluzione Problemi:
- Se backup/ripristino non funziona, verifica che PostgreSQL sia avviato
- Controlla che la password del database sia corretta (finance!)
- Assicurati che l'app Finance WebApp sia chiusa durante il ripristino

Data: 7 Settembre 2025
