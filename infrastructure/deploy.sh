#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/var/www/aaud-system
FRONTEND_ROOT="$APP_DIR/shared/frontend"
RELEASES="$FRONTEND_ROOT/releases"
CURRENT="$FRONTEND_ROOT/current"
PUBLISH="$APP_DIR/infrastructure/lib/frontend-publish.cjs"
BACKUP_DIR=/var/backups/aaud-system
BACKUP_FILE="$BACKUP_DIR/predeploy_$(date +%Y%m%d_%H%M%S)_$$.backup"
SCHEMA=apps/backend/prisma/schema.prisma
PM2_NAME=aaud-backend
HEALTH_URL=http://127.0.0.1:3000/health
PUBLIC_URL=http://127.0.0.1/
HOST=system.aaud.local

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }
pm2_cmd() { if command -v pm2 >/dev/null 2>&1; then pm2 "$@"; else npx pm2 "$@"; fi; }

# Bloqueo durante todo el deploy, incluida la publicación.
exec 9>/tmp/aaud-system-deploy.lock
flock -n 9 || fail 'Ya hay otro despliegue en curso'

for cmd in node npm npx git flock curl pg_dump apache2ctl; do
  command -v "$cmd" >/dev/null 2>&1 || fail "Falta comando: $cmd"
done
cd "$APP_DIR"
[[ -f "$PUBLISH" && -f infrastructure/lib/frontend-release.cjs ]] || fail 'Faltan scripts de publicación'
[[ -L "$CURRENT" ]] || fail 'current no existe o no es un enlace simbólico'
node "$PUBLISH" verify "$CURRENT"

# Evitar ejecutar este script mientras Apache siga sirviendo el directorio antiguo.
APACHE_ROOT=$(apache2ctl -S 2>&1) \
  || fail 'No se pudo consultar la configuración de Apache'

[[ "$APACHE_ROOT" == *'system.aaud.local'* ]] \
  || fail 'VirtualHost AAUD no detectado'
APACHE_CONF=/etc/apache2/sites-enabled/system.aaud.local.conf

[[ -r "$APACHE_CONF" ]] \
  || fail "No se puede leer la configuración de Apache: $APACHE_CONF"

if ! grep -Eq '^[[:space:]]*DocumentRoot[[:space:]]+/var/www/aaud-system/shared/frontend/current[[:space:]]*$' "$APACHE_CONF"; then
  fail 'Apache aún no usa shared/frontend/current. No se realizará el despliegue.'
fi

mkdir -p "$BACKUP_DIR" "$RELEASES"
AVAILABLE_KB=$(df -Pk "$BACKUP_DIR" | awk 'NR==2 {print $4}')
[[ "$AVAILABLE_KB" -gt 512000 ]] || fail 'Espacio insuficiente para respaldo'

log 'Respaldo de PostgreSQL...'
sudo -u postgres pg_dump -Fc aaud_system -f "$BACKUP_FILE" || fail 'Falló respaldo de base de datos'
[[ -s "$BACKUP_FILE" ]] || fail 'Respaldo vacío'
# La retención se gestiona por separado; no borrar respaldos en un deploy fallido.

log 'Actualizando repositorio...'
PREVIOUS_COMMIT=$(git rev-parse HEAD)
git fetch origin main
git reset --hard origin/main
# NO usar git clean -fd sin excluir los datos persistentes.
git clean -fd \
  -e /shared/ \
  -e /apps/backend/public/uploads/
CURRENT_COMMIT=$(git rev-parse HEAD)

log 'Instalando dependencias y migrando...'
npm ci --include=dev
npx prisma migrate status --schema="$SCHEMA" || true
npx prisma migrate deploy --schema="$SCHEMA"
npx prisma generate --schema="$SCHEMA"
npx prisma validate --schema="$SCHEMA"
npx prisma migrate status --schema="$SCHEMA"
npm run prisma:seed:permissions -w apps/backend

log 'Compilando frontend...'
npm run build -w apps/frontend
RELEASE_NAME="release-$(date +%Y%m%d-%H%M%S)-${CURRENT_COMMIT:0:12}-$$"
RELEASE_PATH="$RELEASES/$RELEASE_NAME"
node "$PUBLISH" prepare "$APP_DIR/apps/frontend/dist" "$RELEASES" "$RELEASE_NAME" "$CURRENT"
node "$PUBLISH" verify "$RELEASE_PATH"

log 'Reiniciando backend y comprobando /health...'
if pm2_cmd describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2_cmd restart "$PM2_NAME" --update-env
else
  pm2_cmd start apps/backend/src/Server.js --name "$PM2_NAME"
fi
for i in $(seq 1 10); do
  HTTP_CODE=$(curl --max-time 4 -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)
  [[ "$HTTP_CODE" == 200 ]] && break
  [[ "$i" == 10 ]] && fail 'Backend no respondió. Frontend anterior permanece activo.'
  sleep 3
done

log 'Publicando frontend mediante cambio atómico de enlace...'
PREVIOUS_RELEASE=$(readlink -f "$CURRENT")
node "$PUBLISH" switch "$CURRENT" "$RELEASE_PATH"

# Verificar que Apache sirve exactamente el index.html del release nuevo.
PUBLISHED_HTML=$(mktemp)
trap 'rm -f "$PUBLISHED_HTML"' EXIT

if ! curl --max-time 8 -fsS \
    -H "Host: $HOST" \
    -H "Cache-Control: no-cache" \
    "$PUBLIC_URL" -o "$PUBLISHED_HTML" \
    || ! cmp -s "$PUBLISHED_HTML" "$RELEASE_PATH/index.html"; then

    log 'La publicación HTTP no coincide con el release nuevo. Restaurando...'
    node "$PUBLISH" switch "$CURRENT" "$PREVIOUS_RELEASE" \
      || fail 'ROLLBACK MANUAL NECESARIO: falló la restauración'

    fail 'Frontend revertido por fallo de verificación'
fi

log 'Frontend publicado y verificado correctamente'

pm2_cmd save
log "Deploy completado: $CURRENT_COMMIT"
log "Frontend anterior: $PREVIOUS_RELEASE"
log "Frontend nuevo: $RELEASE_PATH"
log "Backup: $BACKUP_FILE"
log "Commit anterior: $PREVIOUS_COMMIT"
