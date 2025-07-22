# 🚀 Guía de Despliegue - Sistema de Gestión Hotelera

## 📋 Opciones de Despliegue

### 1. **Vercel + Railway** (Recomendado)
- **Frontend**: Vercel (gratis)
- **Backend**: Railway (base de datos PostgreSQL incluida)
- **Dominio**: Personalizado

### 2. **Render** (Todo en una plataforma)
- **Frontend y Backend**: Render
- **Base de datos**: PostgreSQL incluida
- **Dominio**: Personalizado

### 3. **DigitalOcean App Platform**
- **Todo**: DigitalOcean
- **Base de datos**: PostgreSQL
- **Dominio**: Personalizado

## 🛠️ Preparación del Proyecto

### Variables de Entorno

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=https://tu-dominio.com
JWT_SECRET=tu-jwt-secret-super-seguro
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://tu-backend-url.com
```

## 📦 Despliegue en Vercel + Railway

### Paso 1: Desplegar Backend en Railway

1. **Crear cuenta en Railway**: https://railway.app
2. **Conectar repositorio** de GitHub
3. **Crear nueva aplicación** desde el repositorio
4. **Configurar variables de entorno**:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `FRONTEND_URL=https://tu-dominio.com`
5. **Agregar base de datos PostgreSQL**:
   - Crear nueva base de datos PostgreSQL
   - Copiar `DATABASE_URL` a variables de entorno
6. **Desplegar**: Railway detectará automáticamente el proyecto Node.js

### Paso 2: Desplegar Frontend en Vercel

1. **Crear cuenta en Vercel**: https://vercel.com
2. **Importar repositorio** de GitHub
3. **Configurar proyecto**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Configurar variables de entorno**:
   - `NEXT_PUBLIC_API_URL=https://tu-backend-railway-url.com`
5. **Desplegar**

### Paso 3: Configurar Dominio Personalizado

1. **Comprar dominio** en:
   - Namecheap
   - GoDaddy
   - Google Domains
   - Cloudflare

2. **Configurar DNS**:
   - Añadir registro A para el frontend
   - Añadir subdominio para el backend (ej: api.tudominio.com)

## 🌐 Despliegue en Render

### Paso 1: Crear Cuenta
1. Ir a https://render.com
2. Conectar cuenta de GitHub

### Paso 2: Desplegar Base de Datos
1. **Crear nueva base de datos PostgreSQL**
2. **Configurar**:
   - Nombre: `hotel-database`
   - Usuario: `hotel_user`
   - Copiar `DATABASE_URL`

### Paso 3: Desplegar Backend
1. **Crear nuevo Web Service**
2. **Configurar**:
   - Repositorio: Tu repositorio de GitHub
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Variables de entorno:
     - `NODE_ENV=production`
     - `DATABASE_URL` (de la base de datos)
     - `PORT=10000`

### Paso 4: Desplegar Frontend
1. **Crear nuevo Web Service**
2. **Configurar**:
   - Repositorio: Tu repositorio de GitHub
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Variables de entorno:
     - `NEXT_PUBLIC_API_URL=https://tu-backend-render-url.com`

### Paso 5: Configurar Dominio
1. **Ir a Settings > Custom Domains**
2. **Añadir dominio personalizado**
3. **Configurar DNS** según las instrucciones de Render

## 🔧 Despliegue en DigitalOcean App Platform

### Paso 1: Crear Aplicación
1. **Ir a DigitalOcean App Platform**
2. **Conectar repositorio** de GitHub
3. **Seleccionar repositorio**

### Paso 2: Configurar Servicios
1. **Backend Service**:
   - Source Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - Environment Variables: Configurar todas las necesarias

2. **Frontend Service**:
   - Source Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - Environment Variables: `NEXT_PUBLIC_API_URL`

3. **Database**:
   - Crear nueva base de datos PostgreSQL
   - Conectar con el backend

### Paso 3: Configurar Dominio
1. **Ir a Settings > Domains**
2. **Añadir dominio personalizado**
3. **Configurar DNS** según las instrucciones

## 🔒 Configuración de Seguridad

### SSL/HTTPS
- **Vercel**: Automático
- **Railway**: Automático
- **Render**: Automático
- **DigitalOcean**: Automático

### Variables de Entorno Sensibles
- **JWT_SECRET**: Generar con `openssl rand -base64 32`
- **DATABASE_URL**: No compartir públicamente
- **API_KEYS**: Mantener seguras

## 📊 Monitoreo y Logs

### Health Checks
- Backend: `GET /health`
- Frontend: `GET /`

### Logs
- **Vercel**: Dashboard > Functions > Logs
- **Railway**: Dashboard > Deployments > Logs
- **Render**: Dashboard > Services > Logs
- **DigitalOcean**: Dashboard > Apps > Logs

## 🚀 Comandos Útiles

### Desarrollo Local
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Base de datos
docker-compose up -d
```

### Producción
```bash
# Build
npm run build

# Start
npm start

# Migraciones
npx prisma migrate deploy
```

## 📞 Soporte

Si tienes problemas con el despliegue:
1. Revisar logs de la plataforma
2. Verificar variables de entorno
3. Comprobar conectividad de base de datos
4. Revisar configuración de CORS

## 💰 Costos Estimados

### Vercel + Railway
- **Vercel**: Gratis (hasta 100GB/mes)
- **Railway**: $5/mes (base de datos incluida)
- **Dominio**: $10-15/año

### Render
- **Render**: $7/mes (todo incluido)
- **Dominio**: $10-15/año

### DigitalOcean
- **App Platform**: $5/mes
- **Database**: $15/mes
- **Dominio**: $10-15/año 