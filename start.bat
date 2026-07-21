@echo off
setlocal

if exist "%~dp0.env" (
  echo Loading local configuration from .env...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0.env") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

set "MISSING=0"
call :check java "Java runtime"
call :check mvn "Maven"
call :check node "Node.js"
call :check npm "npm"
call :check mysql "MySQL client"

if "%MISSING%"=="1" (
  echo.
  echo One or more required tools are missing from PATH.
  echo Please install the missing tool or update PATH, then run this script again.
  echo.
  pause
  exit /b 1
)

if "%APP_JWT_SECRET%"=="" (
  echo.
  echo Missing APP_JWT_SECRET in .env.
  echo Generate a random secret with at least 32 bytes before starting v1.5.
  echo.
  pause
  exit /b 1
)

echo ===================================================
echo           Sort Manager App - One-click Start
echo ===================================================
echo.
echo Starting Backend Server (Spring Boot)...
start "Sort Manager - Backend" /d "%~dp0backend" cmd /k "mvn package -DskipTests && java -jar target\manager.jar"

echo Starting Frontend Server (Vite/React)...
start "Sort Manager - Frontend" /d "%~dp0frontend" cmd /k npm run dev

echo.
echo ---------------------------------------------------
echo Services started in new windows:
echo - Frontend URL: http://localhost:5173
echo - Backend API URL: http://localhost:8080/api/v1
echo ---------------------------------------------------
echo.
echo Note: To stop the services, just close the two popup windows.
echo.
pause
exit /b 0

:check
where %1 >nul 2>nul
if errorlevel 1 (
  echo Missing %~2: %1
  set "MISSING=1"
)
exit /b 0
