@echo off
chcp 65001 >nul
title OpenBusinessOS - Iniciar Servicos
echo ============================================================
echo   OpenBusinessOS - Iniciar Servicos
echo ============================================================
echo.

:: --- 1. Docker (Postgres + Redis + MinIO) ---
echo [1/4] Verificando Docker...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ERRO: Docker nao esta rodando. Inicie o Docker Desktop.
    pause
    exit /b 1
)

echo    Subindo PostgreSQL, Redis e MinIO...
docker compose up -d postgres redis minio
if %ERRORLEVEL% NEQ 0 (
    echo    ERRO: Falha ao subir containers Docker.
    pause
    exit /b 1
)
echo    OK - Containers rodando.
echo.

:: --- 2. Aguardar PostgreSQL ---
echo [2/4] Aguardando PostgreSQL...
timeout /t 5 /nobreak >nul
:check_pg
docker exec obos-postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    Aguardando...
    timeout /t 2 /nobreak >nul
    goto check_pg
)
echo    OK - PostgreSQL pronto.
echo.

:: --- 3. API (NestJS) ---
echo [3/4] Iniciando API (NestJS) na porta 3001...
cd /d "%~dp0apps\api"

:: Migrate + Seed se necessario
echo    Executando migrations...
call npx prisma migrate deploy 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    Primeira execucao - criando banco...
    call npx prisma migrate dev --name init
)

echo    Iniciando API...
start "OpenBusinessOS API" cmd /k "npx nest start"
echo    OK - API rodando em http://localhost:3001/api/v1/docs
echo.

:: --- 4. Frontend (Next.js) ---
echo [4/4] Iniciando Frontend (Next.js) na porta 3000...
cd /d "%~dp0apps\web"
start "OpenBusinessOS Web" cmd /k "npx next dev"
echo    OK - Frontend rodando em http://localhost:3000
echo.

echo ============================================================
echo   Todos os servicos estao rodando!
echo.
echo   Frontend:  http://localhost:3000
echo   API Docs:  http://localhost:3001/api/v1/docs
echo   MinIO:     http://localhost:9001 (minio123 / minio123)
echo.
echo   Demo login: demo@openbusinessos.com / demo123
echo ============================================================
echo.
echo   Pressione qualquer tecla para abrir o navegador...
pause >nul
start http://localhost:3000
