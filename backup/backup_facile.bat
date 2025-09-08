@echo off
title Finance WebApp - Backup Database
color 0A
echo.
echo =================================
echo  Finance WebApp - Backup Database
echo =================================
echo.
cd /d "C:\Users\miche\Desktop\Finanza\app\finance-webapp\finance-webapp\backup"
PowerShell.exe -ExecutionPolicy Bypass -File "finance_db_backup_simple.ps1" -Force
echo.
echo ✅ Backup completato! I tuoi dati sono al sicuro su OneDrive.
echo.
pause
