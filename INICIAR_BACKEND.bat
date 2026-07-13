@echo off
chcp 65001 >nul
title Panel de Administracion - Backend
color 0A

echo =====================================================
echo   PANEL DE ADMINISTRACION - INICIANDO BACKEND
echo =====================================================
echo.

cd /d "%~dp0backend"

REM ---------------------------------------------------------------
REM 1) Verificar que Node.js esta instalado
REM ---------------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encontro Node.js instalado en esta PC.
    echo Descargalo desde https://nodejs.org y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM 2) Verificar que existe el archivo .env
REM ---------------------------------------------------------------
if not exist ".env" (
    echo [ERROR] No existe el archivo .env dentro de la carpeta backend.
    echo Copia .env.example como .env y completa tu password de Oracle.
    echo.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM 3) Verificar que el password de Oracle ya fue completado
REM ---------------------------------------------------------------
findstr /C:"PON_AQUI_TU_PASSWORD_DE_ORACLE" ".env" >nul 2>nul
if not errorlevel 1 (
    echo [ATENCION] Todavia no configuraste tu password de Oracle.
    echo.
    echo Abre el archivo:  backend\.env
    echo Busca la linea:   ORACLE_PASSWORD=PON_AQUI_TU_PASSWORD_DE_ORACLE
    echo Reemplaza el texto despues del "=" por tu password real de Oracle.
    echo Guarda el archivo y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM 4) Instalar dependencias solo si falta node_modules
REM ---------------------------------------------------------------
if not exist "node_modules" (
    echo [INFO] Primera vez ejecutando el proyecto. Instalando dependencias...
    echo        Esto puede tardar 1-2 minutos, solo pasa una vez.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias. Revisa tu conexion a internet.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente.
    echo.
) else (
    echo [OK] Dependencias ya instaladas, saltando npm install.
    echo.
)

REM ---------------------------------------------------------------
REM 5) Arrancar el servidor
REM ---------------------------------------------------------------
echo [INFO] Iniciando el backend...
echo        Si ves errores de conexion a Oracle, revisa:
echo          - Que el servicio "OracleServiceXE" este iniciado
echo            -^> Panel de Control - Herramientas administrativas - Servicios
echo          - Que tu password en .env sea correcto
echo.
echo Para detener el servidor, presiona Ctrl+C en esta ventana.
echo =====================================================
echo.

call npm start

pause
