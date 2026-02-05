#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/aaud-system"
WEB_ROOT="/var/www/aaud-system/server/public"
PM2_NAME="aaud-backend"

# Opcional: rama por si luego quieres hacer git pull
GIT_BRANCH="main"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# 0) Ir al directorio de la app
cd "$APP_DIR"

# 1) Instalar dependencias si hace falta
if [ -f "package-lock.json" ]; then
  log "📦 [1/5] Instalando dependencias (npm ci)..."
  npm ci
else
  log "📦 [1/5] Instalando dependencias (npm install)..."
  npm install
fi

# 1.1) Auditoría de seguridad (no rompe deploy)
log "🔍 [1.1/5] Ejecutando npm audit..."

if npm audit --audit-level=moderate; then
  log "✅ No se detectaron vulnerabilidades relevantes."
else
  log "⚠️ Vulnerabilidades detectadas, ejecutando npm audit fix..."
  npm audit fix || log "⚠️ npm audit fix no pudo resolver todo, continúo deploy."
fi

# 2) Prisma (solo si está instalado)
if npx prisma -v >/dev/null 2>&1; then
  if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    log "🗄️ [2/5] Ejecutando migraciones Prisma..."
    npx prisma migrate deploy || log "⚠️ prisma migrate deploy falló, revisa logs."
  else
    log "ℹ️ No hay migrations en prisma/migrations, salto migrate deploy."
  fi

  log "🔧 [2/5] Generando cliente Prisma..."
  npx prisma generate || log "⚠️ prisma generate falló, revisa logs."
else
  log "ℹ️ Prisma no encontrado, salto migraciones/generate."
fi

# 3) Build del frontend
log "🧱 [3/5] Compilando frontend (npm run build)..."
npm run build

# 4) Copiar build al web root
log "📁 [4/5] Actualizando archivos estáticos en $WEB_ROOT ..."

# Crear directorio si no existe
if [ ! -d "$WEB_ROOT" ]; then
  sudo mkdir -p "$WEB_ROOT"
fi

# Limpiar y copiar
sudo rm -rf "$WEB_ROOT"/*
sudo cp -r "$APP_DIR"/dist/. "$WEB_ROOT"/

# 5) PM2
log "🚀 [5/5] Reiniciando backend con PM2..."

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start server/Server.js --name "$PM2_NAME" --update-env
fi

pm2 save

log "✅ Deploy finalizado."
