#!/usr/bin/env sh
# Appelle l’API cron des campagnes (pour Render Cron Job ou exécution manuelle).
# Variables requises : SERVICE_URL (URL de l’app, ex. https://careerai-xxxx.onrender.com), CRON_SECRET.

set -e
if [ -z "$SERVICE_URL" ] || [ -z "$CRON_SECRET" ]; then
  echo "Erreur: définis SERVICE_URL et CRON_SECRET (variables d’environnement)."
  exit 1
fi
URL="${SERVICE_URL%/}/api/cron/run-campaigns?secret=${CRON_SECRET}"
echo "Appel: $SERVICE_URL/api/cron/run-campaigns"
curl -s -X GET "$URL"
echo ""
