#!/bin/bash
set -e

APP_DIR="/var/www/aaud-system"
WEB_ROOT="$APP_DIR/apps/backend/public"
PM2_NAME="aaud-backend"

cd "$APP_DIR"

echo "🧹 Limpiando repo..."
git fetch origin main
git reset --hard origin/main
git clean -fd

echo "📦 Instalando dependencias..."
npm ci --include=dev

echo "💾 Backup rápido antes del deploy..."
sudo -u postgres pg_dump -Fc aaud_system > /var/backups/aaud-system/predeploy_$(date +%F_%H-%M).backup

echo "📦 Último backup creado:"
ls -lh /var/backups/aaud-system/predeploy_*.backup | tail -1

echo "🚀 Verificando estado de migraciones (informativo)..."
npx prisma migrate status --schema=apps/backend/prisma/schema.prisma || true

echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma

echo "🔧 Generando cliente Prisma..."
npx prisma generate --schema=apps/backend/prisma/schema.prisma

echo "🌱 Sembrando catálogo de permisos..."
npm run prisma:seed:permissions -w apps/backend

echo "🧱 Compilando frontend..."
npm run build -w apps/frontend

echo "📁 Actualizando frontend..."
mkdir -p "$WEB_ROOT"
rsync -a --delete apps/frontend/dist/ "$WEB_ROOT/"

echo "🚀 Reiniciando backend..."

if pm2 describe "$PM2_NAME" > /dev/null; then
  pm2 restart "$PM2_NAME"
else
  pm2 start apps/backend/src/Server.js --name "$PM2_NAME"
fi

pm2 save

echo "✅ Deploy finalizado"
