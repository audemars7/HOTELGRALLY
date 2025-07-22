# Script de verificación del sistema hotelero
Write-Host "=== VERIFICACIÓN DEL SISTEMA HOTELERO ===" -ForegroundColor Cyan

# 1. Verificar Docker
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "   ✓ Docker instalado" -ForegroundColor Green
    
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}"
    if ($containers -match "hotel_postgres") {
        Write-Host "   ✓ PostgreSQL corriendo" -ForegroundColor Green
    } else {
        Write-Host "   ✗ PostgreSQL NO corriendo" -ForegroundColor Red
        Write-Host "   → Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    }
    
    if ($containers -match "hotel_redis") {
        Write-Host "   ✓ Redis corriendo" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Redis NO corriendo" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Docker no disponible" -ForegroundColor Red
}

# 2. Verificar puertos
Write-Host "`n2. Verificando puertos..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr :3000
$port5000 = netstat -ano | findstr :5000

if ($port3000) {
    Write-Host "   ⚠ Puerto 3000 ocupado" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Puerto 3000 libre" -ForegroundColor Green
}

if ($port5000) {
    Write-Host "   ⚠ Puerto 5000 ocupado" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Puerto 5000 libre" -ForegroundColor Green
}

# 3. Verificar backend
Write-Host "`n3. Verificando backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 3
    Write-Host "   ✓ Backend respondiendo" -ForegroundColor Green
    
    $rooms = Invoke-RestMethod -Uri "http://localhost:5000/api/rooms" -TimeoutSec 3
    if ($rooms.success) {
        Write-Host "   ✓ API de habitaciones funcionando" -ForegroundColor Green
        Write-Host "   → Habitaciones encontradas: $($rooms.data.Count)" -ForegroundColor White
    } else {
        Write-Host "   ✗ API de habitaciones con errores" -ForegroundColor Red
        Write-Host "   → Error: $($rooms.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Backend no responde" -ForegroundColor Red
    Write-Host "   → Verifica que esté corriendo en puerto 5000" -ForegroundColor Yellow
}

# 4. Verificar frontend
Write-Host "`n4. Verificando frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Frontend respondiendo" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Frontend no responde" -ForegroundColor Red
    Write-Host "   → Verifica que esté corriendo en puerto 3000" -ForegroundColor Yellow
}

Write-Host "`n=== FIN DE VERIFICACIÓN ===" -ForegroundColor Cyan
Write-Host "Si todo está ✓, abre: http://localhost:3000" -ForegroundColor White 