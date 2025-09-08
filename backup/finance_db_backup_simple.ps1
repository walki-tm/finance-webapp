# Finance WebApp - Database Backup Script
# 
# Scopo: Backup automatico database PostgreSQL
# - Backup il 1 e 15 di ogni mese
# - Mantiene solo gli ultimi 5 backup
# - Salva in formato compresso (.dump)
#
# @author Finance WebApp Team
# @created 2025-09-07

param(
    [switch]$Force = $false
)

# Configurazione
$BackupDir = "C:\Users\miche\Desktop\Finanza\app\finance-webapp\finance-webapp\backup"
$DatabaseConfig = @{
    Host = "localhost"
    Port = "5432"
    Username = "postgres"
    DatabaseName = "finance_webapp"
    Password = "finance!"
}
$MaxBackups = 5
$LogFile = "$BackupDir\backup_log.txt"

# Funzione per logging
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Verifica se oggi e giorno di backup
function Should-RunBackup {
    $Today = Get-Date
    return ($Today.Day -eq 1 -or $Today.Day -eq 15) -or $Force
}

# Crea directory backup se non esiste
function Ensure-BackupDirectory {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-Log "Directory backup creata: $BackupDir"
    }
}

# Esegue il backup del database
function Start-DatabaseBackup {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFileName = "finance_webapp_backup_$Timestamp.dump"
    $BackupPath = "$BackupDir\$BackupFileName"
    
    Write-Log "Inizio backup database: $($DatabaseConfig.DatabaseName)"
    
    try {
        # Imposta la password come variabile d'ambiente per evitare prompt
        $env:PGPASSWORD = $DatabaseConfig.Password
        
        # Comando pg_dump
        $pg_dump_args = @(
            "-h", $DatabaseConfig.Host,
            "-p", $DatabaseConfig.Port,
            "-U", $DatabaseConfig.Username,
            "-Fc",  # Formato custom compresso
            "-v",   # Verbose
            $DatabaseConfig.DatabaseName
        )
        
        Write-Log "Eseguendo pg_dump..."
        
        # Esegue il backup usando il path corretto (output diretto al file)
        & $global:PgDumpPath @pg_dump_args -f $BackupPath
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupPath)) {
            $FileSize = (Get-Item $BackupPath).Length
            $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
            Write-Log "SUCCESS: Backup completato con successo: $BackupFileName ($FileSizeMB MB)"
            return $true
        } else {
            Write-Log "ERROR: Errore durante il backup. Exit code: $LASTEXITCODE"
            return $false
        }
    }
    catch {
        Write-Log "ERROR: Errore durante il backup: $($_.Exception.Message)"
        return $false
    }
    finally {
        # Rimuovi la password dall'ambiente
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Rimuove backup vecchi mantenendo solo gli ultimi N
function Remove-OldBackups {
    Write-Log "Controllo backup vecchi..."
    
    $BackupFiles = Get-ChildItem -Path $BackupDir -Filter "finance_webapp_backup_*.dump" | 
                   Sort-Object CreationTime -Descending
    
    if ($BackupFiles.Count -gt $MaxBackups) {
        $FilesToDelete = $BackupFiles | Select-Object -Skip $MaxBackups
        
        foreach ($file in $FilesToDelete) {
            Remove-Item -Path $file.FullName -Force
            Write-Log "DELETED: Rimosso backup vecchio: $($file.Name)"
        }
        
        Write-Log "Mantenuti $MaxBackups backup piu recenti"
    } else {
        Write-Log "Numero backup attuali: $($BackupFiles.Count) (max: $MaxBackups)"
    }
}

# Verifica dipendenze
function Test-Dependencies {
    Write-Log "Verifica dipendenze..."
    
    # Controlla se pg_dump e disponibile (prima nel PATH, poi nel percorso standard)
    $pgDumpPath = $null
    
    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        $pgDumpPath = "pg_dump"
        Write-Log "SUCCESS: pg_dump trovato nel PATH"
    }
    catch {
        # Prova il percorso standard di PostgreSQL
        $standardPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
        if (Test-Path $standardPath) {
            $pgDumpPath = $standardPath
            Write-Log "SUCCESS: pg_dump trovato in $standardPath"
        } else {
            Write-Log "ERROR: pg_dump non trovato. Installa PostgreSQL client tools."
            Write-Log "Download: https://www.postgresql.org/download/windows/"
            return $false
        }
    }
    
    # Salva il path per usarlo nella funzione backup
    $global:PgDumpPath = $pgDumpPath
    return $true
}

# Main execution
function Main {
    Write-Log "=== Finance WebApp Database Backup Script ==="
    Write-Log "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    # Verifica se deve eseguire il backup
    if (-not (Should-RunBackup)) {
        Write-Log "INFO: Oggi non e giorno di backup (1 o 15 del mese). Usa -Force per forzare."
        return
    }
    
    # Verifica dipendenze
    if (-not (Test-Dependencies)) {
        return
    }
    
    # Crea directory se necessaria
    Ensure-BackupDirectory
    
    # Esegue il backup
    $BackupSuccess = Start-DatabaseBackup
    
    if ($BackupSuccess) {
        # Rimuove backup vecchi
        Remove-OldBackups
        Write-Log "SUCCESS: Processo backup completato con successo"
    } else {
        Write-Log "ERROR: Processo backup fallito"
        exit 1
    }
    
    Write-Log "=== Fine processo backup ==="
    Write-Log ""
}

# Esegue lo script
Main
