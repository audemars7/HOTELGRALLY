FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar cliente Prisma
RUN npx prisma generate

# Copiar código fuente
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"] 