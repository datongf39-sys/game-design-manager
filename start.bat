@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Checking for Node.js...

REM Try to find node.exe in common locations
set NODE_PATH=

REM Check Program Files
if exist "C:\Program Files\nodejs\node.exe" set "NODE_PATH=C:\Program Files\nodejs"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_PATH=C:\Program Files (x86)\nodejs"

REM Check if node is in PATH
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where node') do (
        set "NODE_PATH=%%~dpi"
        goto :found_node
    )
)

:found_node
if defined NODE_PATH (
    echo Found Node.js at: %NODE_PATH%
    set "PATH=%NODE_PATH%;%PATH%"
) else (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo Starting dev server...
echo Please open http://localhost:5173 in your browser
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
