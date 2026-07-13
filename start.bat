@echo off
setlocal

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

:: Convert backslashes to forward slashes to prevent escape character issues (\b, \f)
set "DIR=%~dp0"
set "DIR=%DIR:\=/%"

echo ===================================================
echo           Sort Manager App - One-click Start
echo ===================================================
echo.
echo Starting Backend Server (Spring Boot)...
start "Sort Manager - Backend" cmd /k "cd /d "%DIR%backend" && mvn spring-boot:run"

echo Starting Frontend Server (Vite/React)...
start "Sort Manager - Frontend" cmd /k "cd /d "%DIR%frontend" && npm run dev"

echo.
echo ---------------------------------------------------
echo Services started in new windows:
echo - Frontend URL: http://localhost:5173
echo - Backend API URL: http://localhost:8080
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
