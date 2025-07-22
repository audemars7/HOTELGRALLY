#!/bin/bash

# Script para configurar SSL gratuito con Let's Encrypt
# Ejecutar: chmod +x ssl-setup.sh && ./ssl-setup.sh

echo "🔒 Configurando SSL gratuito con Let's Encrypt..."

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# Solicitar dominio
read -p "🌐 Ingresa tu dominio (ej: mihotel.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Debes ingresar un dominio válido"
    exit 1
fi

echo "📋 Configurando SSL para: $DOMAIN"

# Actualizar sistema
echo "🔄 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar Certbot
echo "📦 Instalando Certbot..."
apt install -y certbot python3-certbot-nginx

# Instalar Nginx si no está instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    apt install -y nginx
fi

# Crear configuración temporal de Nginx
echo "⚙️ Creando configuración temporal de Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        return 200 "Configuración temporal para SSL";
        add_header Content-Type text/plain;
    }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Obtener certificado SSL
echo "🔐 Obteniendo certificado SSL..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Verificar renovación automática
echo "🔄 Configurando renovación automática..."
crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -

# Crear configuración final de Nginx
echo "⚙️ Creando configuración final de Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL configurado por Certbot
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configuración de CORS
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    # Proxy al frontend (Next.js)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/frontend_access.log;
    error_log /var/log/nginx/frontend_error.log;
}
EOF

# Recargar Nginx
nginx -t && systemctl reload nginx

echo "✅ SSL configurado exitosamente!"
echo "🌐 Tu sitio estará disponible en: https://$DOMAIN"
echo "🔒 El certificado se renovará automáticamente"
echo "📋 Para verificar el estado: certbot certificates" 