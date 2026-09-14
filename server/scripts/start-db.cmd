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
REM Lean memory settings — this machine runs close to full, and the default
REM buffers are far larger than a development database needs.
"%MYSQLD%" --datadir="%DATADIR%" --port=3310 ^
  --innodb-buffer-pool-size=32M --key-buffer-size=8M --max-connections=20 ^
  --performance-schema=OFF --table-open-cache=64 --tmp-table-size=8M --console
