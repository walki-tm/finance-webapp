# 💾 Finance WebApp - Sistema Backup Database Manuale

> **🔒 IMPORTANTE**: I backup sono essenziali per proteggere i tuoi dati finanziari. Questo sistema semplifica il processo con doppio click.

## 📋 Panoramica del Sistema

### Caratteristiche Principali
- ✅ **Backup manuali** semplificati con doppio click
- ✅ **Compressione** format PostgreSQL custom (.dump)
- ✅ **Rotazione automatica** - mantiene solo gli ultimi 5 backup
- ✅ **Logging completo** di tutte le operazioni
- ✅ **Ripristino semplice** con selezione interattiva
- ✅ **Interface semplificata** con file BAT

### File del Sistema
```
finance-webapp/backup/
├── backup_facile.bat               # Doppio click per backup
├── ripristina_facile.bat           # Doppio click per ripristino (RACCOMANDATO)
├── finance_db_backup_simple.ps1    # Script backup PowerShell
├── ripristina_backup_simple.ps1    # Script ripristino PowerShell
├── README_BACKUP.txt               # Istruzioni rapide
├── backup_log.txt                  # Log operazioni backup
└── finance_webapp_backup_*.dump    # File backup (max 5)
```

---

## 🚀 Come Usare il Sistema (SUPER FACILE!)

### 🎯 **Per Fare Backup:**
1. Vai nella cartella `finance-webapp/backup/`
2. **Doppio click** su `backup_facile.bat`
3. Aspetta che finisca (vedrai "SUCCESS: Processo backup completato")
4. Premi un tasto per chiudere

### 🔄 **Per Ripristinare:**
1. **CHIUDI** l'applicazione Finance WebApp
2. Vai nella cartella `finance-webapp/backup/`
3. **Doppio click** su `ripristina_facile.bat`
4. Scegli il numero del backup (es: 1, 2, 3...)
5. Digita `RIPRISTINA` per confermare
6. **RIAVVIA** l'applicazione Finance WebApp

---

## ⚠️ ATTENZIONI IMPORTANTI

### ⚠️ **Il Ripristino:**
- **CANCELLA** tutti i dati attuali del database
- **NON È REVERSIBILE** senza un altro backup
- **CHIUDI SEMPRE** l'app prima del ripristino

### 📅 **Frequenza Consigliata:**
- **Backup ogni 15 giorni** (1° e 15 del mese)
- **Backup extra** prima di aggiornamenti importanti
- **Test ripristino** una volta al mese

---

## 🔧 Personalizzazione Avanzata

### Cambiare Numero Backup da Mantenere
Modifica `finance_db_backup_simple.ps1`:
```powershell
# Cerca questa riga (circa linea 24):
$MaxBackups = 5

# Cambia il numero (es: mantenere 10 backup):
$MaxBackups = 10
```

### Cambiare Password Database
Se cambi la password del database, aggiorna in `finance_db_backup_simple.ps1`:
```powershell
# Cerca DatabaseConfig (circa linea 17-22):
$DatabaseConfig = @{
    Host = "localhost"
    Port = "5432"
    Username = "postgres"
    DatabaseName = "finance_webapp"
    Password = "nuova_password_qui"
}
```

---

## 🛠️ Risoluzione Problemi

### Problema: "pg_dump non trovato"
**Soluzione**: PostgreSQL non è nel PATH di Windows
1. Apri "Variabili d'ambiente"
2. Aggiungi al PATH: `C:\Program Files\PostgreSQL\17\bin`
3. Riavvia PowerShell

### Problema: "Password richiesta"
**Soluzione**: Controlla password nel file `finance_db_backup_simple.ps1`

### Problema: "Ripristino fallisce"
**Soluzione**: 
1. Assicurati che l'app Finance WebApp sia chiusa
2. Controlla che PostgreSQL sia avviato
3. Prova con un backup diverso

---

## 📊 Monitoraggio e Log

### Controllo Backup Eseguiti
```powershell
# Vai nella cartella backup
cd "C:\Users\miche\Desktop\Finanza\app\finance-webapp\finance-webapp\backup"

# Vedi ultimi backup
Get-ChildItem -Filter "*.dump" | Sort-Object CreationTime -Descending

# Controlla log
Get-Content backup_log.txt -Tail 10
```

### Dimensione Backup
```powershell
# Calcola dimensione totale backup
$files = Get-ChildItem -Filter "*.dump"
$totalMB = ($files | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Totale backup: $([math]::Round($totalMB, 2)) MB"
```

---

## 🆘 Emergenza: Perdita Database Completa

### 1. 😌 **NON PANICO!**
I tuoi backup sono al sicuro nella cartella `backup/`.

### 2. 🔍 **Verifica Backup Disponibili**
1. Vai in `finance-webapp/backup/`
2. Doppio click su `ripristina_facile.bat`
3. Vedrai la lista dei backup disponibili

### 3. ⚡ **Ripristina Backup Più Recente**
1. Scegli il backup più recente (numero 1)
2. Digita `RIPRISTINA`
3. Aspetta che finisca
4. Riavvia l'applicazione

### 4. ✅ **Verifica Tutto OK**
1. Login nell'app
2. Controlla che ci siano le tue transazioni
3. Verifica categorie e budget

---

## 📞 Comandi di Riferimento Rapido

### File da Usare:
- **`backup_facile.bat`** → Per fare backup
- **`ripristina_facile.bat`** → Per ripristinare

### Promemoria:
- **Backup ogni 15 giorni**
- **Sempre chiudere l'app prima del ripristino**
- **Testare il ripristino una volta al mese**

---

## 💡 Tips e Suggerimenti

### 📅 **Aggiungi Promemoria**
Crea un evento ricorrente nel calendario:
- **Titolo**: "Backup Finance App"
- **Frequenza**: Ogni 15 giorni
- **Nota**: Doppio click su `backup_facile.bat`

### 🔄 **Prima di Aggiornamenti**
Sempre fare un backup extra prima di:
- Aggiornamenti Windows
- Modifiche importanti ai dati
- Installazione nuovo software

### 🧪 **Test Periodici**
Una volta al mese:
1. Fai un backup
2. Prova il ripristino su un backup vecchio
3. Verifica che funzioni tutto
4. Ripristina il backup recente

---

**✅ Il tuo sistema di backup è semplice e affidabile!**

> **🎯 Ricorda**: Due doppi click e sei protetto. `backup_facile.bat` per salvare, `ripristina_facile.bat` per recuperare.

---

**📝 Versione**: 2.0.0 (Sistema Manuale)  
**📅 Ultimo aggiornamento**: 7 Settembre 2025  
**🔗 Files correlati**: `backup_facile.bat`, `ripristina_facile.bat`
