# Script principal para iniciar el sistema completo
Write-Host "=== INICIANDO SISTEMA DE GESTIÓN HOTELERA ===" -ForegroundColor Cyan

# Verificar Docker
Write-Host "Verificando Docker..." -ForegroundColor Yellow
docker ps > $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker no está corriendo. Inicia Docker Desktop primero." -ForegroundColor Red
    exit 1
}

# Configurar variables de entorno
Write-Host "Configurando variables de entorno..." -ForegroundColor Green
$env:DATABASE_URL="postgresql://HGRALI_:GRALI712119@localhost:5432/hotel_management"
$env:PORT="5000"
$env:NODE_ENV="development"
$env:FRONTEND_URL="http://localhost:3000"
$env:JWT_SECRET="hotel_jwt_secret_2025_muy_seguro"
$env:REDIS_URL="redis://localhost:6379"

Write-Host "Variables configuradas ✓" -ForegroundColor Green

# Iniciar backend en una nueva ventana
Write-Host "Iniciando backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:DATABASE_URL='postgresql://HGRALI_:GRALI712119@localhost:5432/hotel_management'; npm run dev"

# Esperar un poco
Start-Sleep -Seconds 3

# Iniciar frontend en otra ventana
Write-Host "Iniciando frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host "=== SISTEMA INICIADO ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
Read-Host 