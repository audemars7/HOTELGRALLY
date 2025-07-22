# Script de Despliegue - Sistema de Gestion Hotelera
# Ejecutar: .\deploy.ps1

Write-Host "Iniciando proceso de despliegue..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "Error: Debes ejecutar este script desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}

# Funcion para verificar si un comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verificar dependencias
Write-Host "Verificando dependencias..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "Error: Node.js no esta instalado. Por favor instala Node.js desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "Error: npm no esta instalado. Por favor instala npm" -ForegroundColor Red
    exit 1
}

Write-Host "Dependencias verificadas" -ForegroundColor Green

# Funcion para construir el backend
function Build-Backend {
    Write-Host "Construyendo backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    npx prisma generate
    npm run build
    Set-Location ..
    Write-Host "Backend construido exitosamente" -ForegroundColor Green
}

# Funcion para construir el frontend
function Build-Frontend {
    Write-Host "Construyendo frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    npm run build
    Set-Location ..
    Write-Host "Frontend construido exitosamente" -ForegroundColor Green
}

# Funcion para mostrar opciones de despliegue
function Show-DeploymentOptions {
    Write-Host "\nOpciones de Despliegue:" -ForegroundColor Magenta
    Write-Host "1. Vercel + Railway (Recomendado)" -ForegroundColor White
    Write-Host "2. Render (Todo en una plataforma)" -ForegroundColor White
    Write-Host "3. DigitalOcean App Platform" -ForegroundColor White
    Write-Host "4. Solo construir (sin desplegar)" -ForegroundColor White
    $choice = Read-Host "\nSelecciona una opcion (1-4)"
    switch ($choice) {
        "1" { 
            Write-Host "\nInstrucciones para Vercel + Railway:" -ForegroundColor Cyan
            Write-Host "1. Ve a https://railway.app y crea una cuenta" -ForegroundColor White
            Write-Host "2. Conecta tu repositorio de GitHub" -ForegroundColor White
            Write-Host "3. Crea una nueva aplicacion desde el repositorio" -ForegroundColor White
            Write-Host "4. Configura las variables de entorno:" -ForegroundColor White
            Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
            Write-Host "   - PORT=3000" -ForegroundColor Gray
            Write-Host "   - DATABASE_URL=(de la base de datos PostgreSQL)" -ForegroundColor Gray
            Write-Host "5. Ve a https://vercel.com y despliega el frontend" -ForegroundColor White
            Write-Host "6. Configura NEXT_PUBLIC_API_URL con la URL de Railway" -ForegroundColor White
        }
        "2" { 
            Write-Host "\nInstrucciones para Render:" -ForegroundColor Cyan
            Write-Host "1. Ve a https://render.com y crea una cuenta" -ForegroundColor White
            Write-Host "2. Conecta tu repositorio de GitHub" -ForegroundColor White
            Write-Host "3. Crea una nueva base de datos PostgreSQL" -ForegroundColor White
            Write-Host "4. Crea un nuevo Web Service para el backend:" -ForegroundColor White
            Write-Host "   - Root Directory: backend" -ForegroundColor Gray
            Write-Host "   - Build Command: npm install && npm run build" -ForegroundColor Gray
            Write-Host "   - Start Command: npm start" -ForegroundColor Gray
            Write-Host "5. Crea un nuevo Web Service para el frontend:" -ForegroundColor White
            Write-Host "   - Root Directory: frontend" -ForegroundColor Gray
            Write-Host "   - Build Command: npm install && npm run build" -ForegroundColor Gray
            Write-Host "   - Start Command: npm start" -ForegroundColor Gray
        }
        "3" { 
            Write-Host "\nInstrucciones para DigitalOcean:" -ForegroundColor Cyan
            Write-Host "1. Ve a https://cloud.digitalocean.com/apps" -ForegroundColor White
            Write-Host "2. Conecta tu repositorio de GitHub" -ForegroundColor White
            Write-Host "3. Crea una nueva aplicacion" -ForegroundColor White
            Write-Host "4. Configura los servicios (backend, frontend, database)" -ForegroundColor White
        }
        "4" { 
            Write-Host "\nSolo construccion seleccionada" -ForegroundColor Yellow
        }
        default { 
            Write-Host "Opcion invalida" -ForegroundColor Red
            return
        }
    }
}

# Funcion para verificar archivos de configuracion
function Test-ConfigurationFiles {
    Write-Host "\nVerificando archivos de configuracion..." -ForegroundColor Yellow
    $files = @(
        "vercel.json",
        "render.yaml", 
        "railway.json",
        "Dockerfile",
        ".dockerignore",
        "DEPLOYMENT.md"
    )
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Host "OK: $file" -ForegroundColor Green
        } else {
            Write-Host "FALTA: $file" -ForegroundColor Red
        }
    }
}

# Funcion para mostrar informacion del dominio
function Show-DomainInfo {
    Write-Host "\nInformacion sobre dominios:" -ForegroundColor Magenta
    Write-Host "Recomendaciones para comprar dominio:" -ForegroundColor White
    Write-Host "- Namecheap: https://namecheap.com" -ForegroundColor Cyan
    Write-Host "- GoDaddy: https://godaddy.com" -ForegroundColor Cyan
    Write-Host "- Google Domains: https://domains.google" -ForegroundColor Cyan
    Write-Host "- Cloudflare: https://cloudflare.com" -ForegroundColor Cyan
    Write-Host "\nSugerencias de nombres:" -ForegroundColor Yellow
    Write-Host "- hotelgestion.com" -ForegroundColor White
    Write-Host "- mihotel.com" -ForegroundColor White
    Write-Host "- hotelapp.com" -ForegroundColor White
    Write-Host "- reservashotel.com" -ForegroundColor White
}

# Ejecutar proceso
try {
    Test-ConfigurationFiles
    Build-Backend
    Build-Frontend
    Show-DeploymentOptions
    Show-DomainInfo
    Write-Host "\nProceso completado!" -ForegroundColor Green
    Write-Host "Revisa DEPLOYMENT.md para instrucciones detalladas" -ForegroundColor Cyan
    Write-Host "URLs utiles:" -ForegroundColor Yellow
    Write-Host "- Railway: https://railway.app" -ForegroundColor Cyan
    Write-Host "- Vercel: https://vercel.com" -ForegroundColor Cyan
    Write-Host "- Render: https://render.com" -ForegroundColor Cyan
    Write-Host "- DigitalOcean: https://cloud.digitalocean.com" -ForegroundColor Cyan
} catch {
    Write-Host "Error durante el proceso: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 