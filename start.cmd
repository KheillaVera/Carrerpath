@echo off
REM Double-click this file to run PathAura.
cd /d "%~dp0"
call npm start
echo.
echo PathAura has stopped. Press any key to close this window.
pause >nul
