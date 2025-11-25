#!/bin/bash
set -e

APP_DIR="/var/www/aaud-system"
WEB_ROOT="/var/www/aaud-frontend"
PM2_NAME="aaud-backend"

echo "📦 [1/4] Compilando frontend (npm run build)..."
cd "$APP_DIR"
npm run build

echo "📁 [2/4] Actualizando archivos estáticos en $WEB_ROOT ..."
echo "$SUDO_PASSWORD" | sudo -S rm -rf "$WEB_ROOT"/*
echo "$SUDO_PASSWORD" | sudo -S cp -r "$APP_DIR"/dist/* "$WEB_ROOT"/

echo "🚀 [3/4] Reiniciando backend con PM2..."
cd "$APP_DIR"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start server/Server.js --name "$PM2_NAME" --update-env
fi

echo "💾 [4/4] Guardando configuración de PM2..."
pm2 save

echo "✔️ Deploy finalizado."
