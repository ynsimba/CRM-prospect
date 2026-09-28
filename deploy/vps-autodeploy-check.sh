#!/usr/bin/env bash
#
# Déploie SafeCom si origin/main a avancé.
# GitHub Actions ne peut pas ouvrir le SSH du VPS, et le compte utilisé ici
# ne peut pas enregistrer de secret Actions : le VPS interroge donc main.
#
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/safecheck-crm}"
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=safe.directory
export GIT_CONFIG_VALUE_0="$APP_ROOT"

cd "$APP_ROOT"
git fetch --prune origin main
local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse origin/main)"
if [ "$local_sha" = "$remote_sha" ]; then
  exit 0
fi

echo "Déploiement ${local_sha:0:7} -> ${remote_sha:0:7}"
exec /bin/bash "$APP_ROOT/deploy/vps-deploy-crm.sh"
