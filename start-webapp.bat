@echo off
echo Starting Finance WebApp...
echo.

REM Store process IDs in temporary files
set SERVER_PID_FILE=%TEMP%\finance-server.pid
set CLIENT_PID_FILE=%TEMP%\finance-client.pid

REM Start server
echo Starting server on port 3001...
cd server
start /B cmd /c "npm run dev > NUL 2>&1 & echo %ERRORLEVEL%"
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO LIST ^| findstr /C:"PID:"') do (
    echo %%a > %SERVER_PID_FILE%
    goto :server_started
)
:server_started

REM Wait a bit for server to start
timeout /t 3 /nobreak > NUL

REM Start client
echo Starting client on port 5173...
cd ..\client
start /B cmd /c "npm run dev > NUL 2>&1"
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO LIST ^| findstr /C:"PID:"') do (
    echo %%a > %CLIENT_PID_FILE%
    goto :client_started
)
:client_started

cd ..

echo.
echo ========================================
echo Finance WebApp is running!
echo Server: http://localhost:3001
echo Client: http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop all processes
echo.

REM Wait for Ctrl+C
pause

REM Cleanup is handled by stop-webapp.bat
