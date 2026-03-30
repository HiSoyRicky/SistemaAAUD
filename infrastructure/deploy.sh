#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/aaud-system"
WEB_ROOT="$APP_DIR/apps/backend/public"
PM2_NAME="aaud-backend"
BACKUP_DIR="/var/backups/aaud-system"
BACKUP_FILE="$BACKUP_DIR/predeploy_$(date +%F_%H:%M).backup"
SCHEMA="apps/backend/prisma/schema.prisma"
HEALTH_URL="http://localhost:3000/health"  # ajusta el puerto

# ── Helpers ──────────────────────────────────────────────────────────────────

log()  { echo "[$(date +%H:%M:%S)] $*"; }
fail() { echo "[ERROR] $*" >&2; exit 1; }

# ── Prerequisitos ─────────────────────────────────────────────────────────────

log "Verificando prerequisitos..."
command -v pm2      >/dev/null || fail "pm2 no encontrado"
command -v npx      >/dev/null || fail "npx no encontrado"
command -v rsync    >/dev/null || fail "rsync no encontrado"
command -v pg_dump  >/dev/null || fail "pg_dump no encontrado"

mkdir -p "$BACKUP_DIR"

# Verificar espacio disponible (mínimo 500MB)
AVAILABLE_KB=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
[[ "$AVAILABLE_KB" -gt 512000 ]] || fail "Espacio insuficiente en disco: ${AVAILABLE_KB}KB disponibles"

# ── Backup ────────────────────────────────────────────────────────────────────

log "Creando backup de base de datos..."
sudo -u postgres pg_dump -Fc aaud_system -f "$BACKUP_FILE" \
  || fail "Backup falló — deploy abortado"

# Verificar que el backup tenga contenido real
[[ -s "$BACKUP_FILE" ]] || fail "Backup está vacío — deploy abortado"
log "Backup creado: $(ls -lh "$BACKUP_FILE" | awk '{print $5, $9}')"

# Limpiar backups con más de 7 días
find "$BACKUP_DIR" -name "predeploy_*.backup" -mtime +7 -delete

# ── Git ───────────────────────────────────────────────────────────────────────

log "Actualizando código..."
cd "$APP_DIR"

PREVIOUS_COMMIT=$(git rev-parse HEAD)
log "Commit anterior: $PREVIOUS_COMMIT"

git fetch origin main
git reset --hard origin/main
git clean -fd

CURRENT_COMMIT=$(git rev-parse HEAD)
log "Commit nuevo: $CURRENT_COMMIT"

if [[ "$PREVIOUS_COMMIT" == "$CURRENT_COMMIT" ]]; then
  log "⚠️  Sin cambios en el repositorio — continuando de todas formas"
fi

# ── Dependencias ──────────────────────────────────────────────────────────────

log "Instalando dependencias..."
# --omit=dev si el backend no necesita devDeps en runtime
npm ci --include=dev

# ── Base de datos ─────────────────────────────────────────────────────────────

log "Estado de migraciones:"
npx prisma migrate status --schema="$SCHEMA" || true

log "Ejecutando migraciones..."
npx prisma migrate deploy --schema="$SCHEMA"

log "Generando cliente Prisma..."
npx prisma generate --schema="$SCHEMA"

log "Sembrando catálogo de permisos..."
# Asegúrate de que este seed use upsert, no insert ciego
npm run prisma:seed:permissions -w apps/backend

# ── Frontend ──────────────────────────────────────────────────────────────────

log "Compilando frontend..."
npm run build -w apps/frontend

log "Actualizando archivos del frontend..."
mkdir -p "$WEB_ROOT"
rsync -a --delete apps/frontend/dist/ "$WEB_ROOT/"

# ── Backend ───────────────────────────────────────────────────────────────────

log "Reiniciando backend..."
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME"
else
  pm2 start apps/backend/src/Server.js --name "$PM2_NAME"
fi

pm2 save

# ── Health check ──────────────────────────────────────────────────────────────

log "Verificando salud del servicio..."
MAX_RETRIES=10
RETRY_INTERVAL=3

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null) || HTTP_CODE="000"

  if [[ "$HTTP_CODE" == "200" ]]; then
    log "✅ Servicio respondiendo"
    break
  fi

  if [[ "$i" == "$MAX_RETRIES" ]]; then
    fail "Servicio no respondió tras $((MAX_RETRIES * RETRY_INTERVAL))s — revisa: pm2 logs $PM2_NAME"
  fi

  log "Intento $i/$MAX_RETRIES — HTTP $HTTP_CODE, esperando ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

# ── Resumen ───────────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════"
echo "  Deploy completado"
echo "  Commit: $CURRENT_COMMIT"
echo "  Backup: $BACKUP_FILE"
echo "════════════════════════════════════════"