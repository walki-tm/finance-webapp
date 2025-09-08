# Finance WebApp - Database Restore Script Simple
# 
# Scopo: Ripristina backup del database PostgreSQL
# - Lista backup disponibili
# - Ripristina backup selezionato
#
# @author Finance WebApp Team
# @created 2025-09-07

# Configurazione
$BackupDir = "C:\Users\miche\Desktop\Finanza\app\finance-webapp\finance-webapp\backup"
$DatabaseConfig = @{
    Host = "localhost"
    Port = "5432"
    Username = "postgres"
    DatabaseName = "finance_webapp"
    Password = "finance!"
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " Finance WebApp - Ripristino Database" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ATTENZIONE: Il ripristino cancellerà TUTTI i dati attuali!" -ForegroundColor Red
Write-Host ""

# Lista backup disponibili
Write-Host "Backup disponibili:" -ForegroundColor Yellow
Write-Host ""

$BackupFiles = Get-ChildItem -Path $BackupDir -Filter "finance_webapp_backup_*.dump" | 
               Sort-Object CreationTime -Descending

if ($BackupFiles.Count -eq 0) {
    Write-Host "ERRORE: Nessun backup trovato!" -ForegroundColor Red
    Read-Host "Premi Invio per uscire"
    exit 1
}

for ($i = 0; $i -lt $BackupFiles.Count; $i++) {
    $file = $BackupFiles[$i]
    $fileSize = [math]::Round($file.Length / 1MB, 2)
    $created = $file.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
    
    Write-Host "[$($i + 1)] $($file.Name)" -ForegroundColor White
    Write-Host "    Data: $created - Dimensione: $fileSize MB" -ForegroundColor Gray
    Write-Host ""
}

# Selezione backup
do {
    $selection = Read-Host "Inserisci il numero del backup da ripristinare (1-$($BackupFiles.Count)) o 'q' per uscire"
    
    if ($selection -eq 'q' -or $selection -eq 'Q') {
        Write-Host "Operazione annullata." -ForegroundColor Yellow
        exit 0
    }
    
    try {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $BackupFiles.Count) {
            $selectedFile = $BackupFiles[$index]
            break
        } else {
            Write-Host "Selezione non valida!" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Input non valido!" -ForegroundColor Red
    }
} while ($true)

Write-Host ""
Write-Host "Hai selezionato: $($selectedFile.Name)" -ForegroundColor White
Write-Host ""
Write-Host "ULTIMA CONFERMA: Questo cancellerà tutti i dati attuali!" -ForegroundColor Red

$confirm = Read-Host "Digita 'RIPRISTINA' (tutto maiuscolo) per confermare"

if ($confirm -ne "RIPRISTINA") {
    Write-Host "Ripristino annullato." -ForegroundColor Yellow
    Read-Host "Premi Invio per uscire"
    exit 0
}

Write-Host ""
Write-Host "Ripristinando database da $($selectedFile.Name)..." -ForegroundColor Cyan
Write-Host ""

try {
    # Imposta la password come variabile d'ambiente
    $env:PGPASSWORD = $DatabaseConfig.Password
    
    # Path agli strumenti PostgreSQL
    $psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    $pgRestorePath = "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"
    
    Write-Host "Eliminazione database esistente..." -ForegroundColor Yellow
    $dropArgs = @(
        "-h", $DatabaseConfig.Host,
        "-p", $DatabaseConfig.Port,
        "-U", $DatabaseConfig.Username,
        "-d", "postgres",
        "-c", "DROP DATABASE IF EXISTS $($DatabaseConfig.DatabaseName);"
    )
    & $psqlPath @dropArgs
    
    Write-Host "Creazione nuovo database..." -ForegroundColor Yellow
    $createArgs = @(
        "-h", $DatabaseConfig.Host,
        "-p", $DatabaseConfig.Port,
        "-U", $DatabaseConfig.Username,
        "-d", "postgres",
        "-c", "CREATE DATABASE $($DatabaseConfig.DatabaseName);"
    )
    & $psqlPath @createArgs
    
    Write-Host "Ripristino dati dal backup..." -ForegroundColor Yellow
    $restoreArgs = @(
        "-h", $DatabaseConfig.Host,
        "-p", $DatabaseConfig.Port,
        "-U", $DatabaseConfig.Username,
        "-d", $DatabaseConfig.DatabaseName,
        "--clean",
        "--if-exists",
        $selectedFile.FullName
    )
    & $pgRestorePath @restoreArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Ripristino completato con successo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "INFO: Ricordati di riavviare l'applicazione Finance WebApp" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERROR: Errore durante il ripristino! Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host ""
    Write-Host "ERROR: Errore durante il ripristino: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    # Rimuovi la password dall'ambiente
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Read-Host "Premi Invio per chiudere"
