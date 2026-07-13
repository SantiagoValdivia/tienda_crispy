@echo off
chcp 65001 >nul
title Panel de Administracion - Cargar Base de Datos
color 0B

echo =====================================================
echo   CREANDO TABLAS EN ORACLE XE
echo =====================================================
echo.
echo Esto va a crear las tablas: usuarios, stock, movimientos
echo y cargar datos de ejemplo en tu Oracle XE local.
echo.

where sqlplus >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encontro "sqlplus" en el PATH de esta PC.
    echo.
    echo Esto normalmente significa que Oracle XE no esta en el PATH,
    echo o que necesitas abrir esta ventana desde "SQL Command Line"
    echo en vez de hacer doble clic.
    echo.
    echo Alternativa: abre SQL Developer, conectate a tu Oracle XE,
    echo abre el archivo oracle\schema.sql y ejecutalo manualmente
    echo boton "Run Script" o F5.
    echo.
    pause
    exit /b 1
)

set /p ORAPASS=Escribe tu password de Oracle (usuario system) y presiona Enter: 

echo.
echo Conectando y ejecutando script...
echo.

sqlplus system/%ORAPASS% @"%~dp0oracle\schema.sql"

echo.
echo =====================================================
echo Si arriba ves las tablas USUARIOS y STOCK con datos,
echo la base de datos quedo lista correctamente.
echo Si viste un error de login, tu password no era correcto.
echo =====================================================
echo.
pause