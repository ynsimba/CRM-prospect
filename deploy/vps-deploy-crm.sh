#!/usr/bin/env bash
#
# Mise à jour production SafeCom (crm.safecheckrdc.com).
# Lancé par le timer safecheck-crm-autodeploy, ou manuellement :
#   bash /var/www/safecheck-crm/deploy/vps-deploy-crm.sh
#
# Ne recrée pas la base, ne re-seed pas, ne touche pas les fichiers .env.
#
set -euo pipefail

export HOME="${HOME:-/root}"
export COMPOSER_HOME="${COMPOSER_HOME:-/root/.composer}"
export COMPOSER_ALLOW_SUPERUSER=1
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/bin:${PATH:-}"

APP_ROOT="${APP_ROOT:-/var/www/safecheck-crm}"
DOMAIN="${DOMAIN:-crm.safecheckrdc.com}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
PHP_BIN="${PHP_BIN:-/usr/bin/php8.4}"
LOCK="${APP_ROOT}/backend/storage/deploy.lock"
STATE_DIR="${APP_ROOT}/deploy/state"

export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=safe.directory
export GIT_CONFIG_VALUE_0="$APP_ROOT"

if [ ! -d "$APP_ROOT/.git" ]; then
  echo "ERREUR: $APP_ROOT n'est pas un dépôt git." >&2
  exit 1
fi
if [ ! -f "$APP_ROOT/backend/.env" ] || [ ! -f "$APP_ROOT/.env.production" ]; then
  echo "ERREUR: fichier d'environnement manquant. Ne pas lancer sur une installation incomplète." >&2
  exit 1
fi

mkdir -p "$(dirname "$LOCK")" "$STATE_DIR"
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "Un autre déploiement CRM est déjà en cours."
  exit 0
fi

cd "$APP_ROOT"
rm -f "$STATE_DIR/deploy-revision.txt"

echo "==> Git $DEPLOY_BRANCH"
git fetch --prune origin
git checkout "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"
echo "    HEAD=$(git rev-parse --short HEAD) $(git log -1 --pretty=%s)"

echo "==> Backend Laravel"
cd "$APP_ROOT/backend"
composer install --no-dev --optimize-autoloader --no-interaction --no-progress
"$PHP_BIN" artisan migrate --force
"$PHP_BIN" artisan optimize:clear
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache

echo "==> Frontend Next.js"
cd "$APP_ROOT"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

echo "==> Permissions"
if id safecheck >/dev/null 2>&1; then
  chown -R safecheck:safecheck "$APP_ROOT"
fi
chmod 640 "$APP_ROOT/backend/.env" "$APP_ROOT/.env.production"
chmod -R ug+rwX "$APP_ROOT/backend/storage" "$APP_ROOT/backend/bootstrap/cache"

echo "==> Services"
install -m 644 "$APP_ROOT/deploy/systemd/safecheck-crm-autodeploy.service" /etc/systemd/system/safecheck-crm-autodeploy.service
install -m 644 "$APP_ROOT/deploy/systemd/safecheck-crm-autodeploy.timer" /etc/systemd/system/safecheck-crm-autodeploy.timer
systemctl daemon-reload
systemctl enable --now safecheck-crm-autodeploy.timer
systemctl restart safecheck-crm.service
systemctl reload php8.4-fpm
systemctl reload nginx

echo "==> Smoke"
ok=0
for _ in $(seq 1 40); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://${DOMAIN}/login" || true)"
  if [ "$code" = "200" ]; then
    ok=1
    break
  fi
  sleep 2
done
echo "HTTP ${code:-000}  https://${DOMAIN}/login"
if [ "$ok" != "1" ]; then
  echo "ERREUR: la page de connexion ne répond pas 200." >&2
  exit 1
fi
curl -fsS -o /dev/null "http://127.0.0.1:8091/up"
echo "HTTP 200  http://127.0.0.1:8091/up"

sha="$(git -C "$APP_ROOT" rev-parse HEAD)"
mkdir -p "$STATE_DIR"
printf '%s' "$sha" > "$STATE_DIR/deploy-revision.txt"
if id safecheck >/dev/null 2>&1; then
  chown safecheck:safecheck "$STATE_DIR/deploy-revision.txt" || true
fi
echo "==> OK ${sha:0:7}"
