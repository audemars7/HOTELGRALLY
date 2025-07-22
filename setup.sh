#!/bin/bash

set -e

echo "🏨 Configurando Sistema de Gestión Hotelera"
echo "=========================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm"
    exit 1
fi

echo "✅ Node.js y npm encontrados"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker Desktop."
    exit 1
fi

# Verificar si docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose no está instalado. Por favor instala Docker Compose."
    exit 1
fi

echo "🐳 Docker y docker-compose encontrados"

echo "🚀 Levantando servicios de base de datos (PostgreSQL y Redis)..."
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
RETRIES=20
until docker exec hotel_postgres pg_isready -U hotel_user > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Esperando... ($RETRIES)"
  sleep 2
  ((RETRIES--))
done
if [ $RETRIES -eq 0 ]; then
  echo "❌ PostgreSQL no está listo. Verifica los contenedores Docker."
  exit 1
fi

echo "✅ PostgreSQL está listo."

# Instalar dependencias del proyecto principal
echo "📦 Instalando dependencias del proyecto principal..."
npm install

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# Configurar variables de entorno
if [ ! -f .env ]; then
    echo "📝 Configurando variables de entorno del backend..."
    cp env.example .env
    echo "⚠️  Por favor edita el archivo backend/.env con tus credenciales de base de datos si es necesario."
fi

# Inicializar base de datos y seed
echo "🗄️  Ejecutando migraciones y seed de la base de datos..."
npm run db:setup

cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install

# Configurar variables de entorno del frontend
if [ ! -f .env.local ]; then
    echo "📝 Configurando variables de entorno del frontend..."
    cp env.example .env.local
fi

cd ..

echo ""
echo "✅ Instalación y configuración completadas!"
echo ""
echo "🌐 El sistema estará disponible en:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "¿Deseas iniciar el sistema en modo desarrollo ahora? (s/n)"
read -r iniciar
if [[ "$iniciar" =~ ^[sS]$ ]]; then
  npm run dev
else
  echo "Puedes iniciar el sistema manualmente con: npm run dev"
fi