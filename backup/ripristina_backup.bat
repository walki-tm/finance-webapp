@echo off
title Finance WebApp - Ripristino Database
color 0A

echo.
echo ===================================================
echo  Finance WebApp - Ripristino Database
echo ===================================================
echo.
echo ⚠️  ATTENZIONE: Il ripristino cancellerà TUTTI i dati attuali!
echo.
echo Backup disponibili:
echo.

cd /d "C:\Users\miche\Desktop\Finanza\app\finance-webapp\finance-webapp\backup"

:: Mostra i backup disponibili
setlocal enabledelayedexpansion
set count=0
for %%f in (finance_webapp_backup_*.dump) do (
    set /a count+=1
    echo [!count!] %%f
    set "file!count!=%%f"
)

if %count%==0 (
    echo ❌ Nessun backup trovato!
    pause
    exit /b 1
)

echo.
set /p choice="Inserisci il numero del backup da ripristinare (1-%count%) o 'q' per uscire: "

if /i "%choice%"=="q" (
    echo Operazione annullata.
    pause
    exit /b 0
)

:: Verifica che la scelta sia valida
if %choice% lss 1 goto invalid
if %choice% gtr %count% goto invalid

:: Ottieni il nome del file selezionato
call set "selected=%%file%choice%%%"

echo.
echo Hai selezionato: %selected%
echo.
echo ⚠️  ULTIMA CONFERMA: Questo cancellerà tutti i dati attuali!
set /p confirm="Digita 'RIPRISTINA' (tutto maiuscolo) per confermare: "

if not "%confirm%"=="RIPRISTINA" (
    echo Ripristino annullato.
    pause
    exit /b 0
)

echo.
echo 🔄 Ripristinando database da %selected%...
echo.

:: Elimina e ricrea il database
echo ⏳ Eliminazione database esistente...
set "PGPASSWORD=finance!" && "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS finance_webapp;"

echo ⏳ Creazione nuovo database...
set "PGPASSWORD=finance!" && "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE finance_webapp;"

echo ⏳ Ripristino dati dal backup...
set "PGPASSWORD=finance!" && "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -h localhost -p 5432 -U postgres -d finance_webapp --clean --if-exists "%selected%"

if %errorlevel%==0 (
    echo.
    echo ✅ Ripristino completato con successo!
    echo.
    echo 💡 Ricordati di riavviare l'applicazione Finance WebApp
) else (
    echo.
    echo ❌ Errore durante il ripristino!
    echo Controlla che PostgreSQL sia avviato e le credenziali siano corrette.
)

echo.
pause
exit /b %errorlevel%

:invalid
echo ❌ Selezione non valida!
pause
exit /b 1
