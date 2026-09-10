@echo off
REM Starts PathAura's own MariaDB instance.
REM
REM It uses its own data directory (server\.database) and its own port (3310), so it
REM does not touch XAMPP's databases and does not clash with any MySQL already running.
REM Leave this window open while you work; close it (or press Ctrl+C) to stop the database.

set MYSQLD=C:\xampp\mysql\bin\mysqld.exe
set DATADIR=%~dp0..\.database

if not exist "%MYSQLD%" (
  echo Could not find %MYSQLD%
  echo Edit this script and point MYSQLD at your mysqld.exe.
  exit /b 1
)

echo Starting PathAura database on port 3310...
echo Data directory: %DATADIR%
echo.
"%MYSQLD%" --datadir="%DATADIR%" --port=3310 --console
