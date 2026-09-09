#!/usr/bin/env bash
# ==============================================================================
# Free Mind Foundation — Automated 2:00 AM Database Backup & 7-Day Pruning Script
# Runs daily at 2:00 AM via cron (/etc/cron.d/fmf-db-backup)
# Destination: /root/fmf-backups/
# Retention: Deletes backup files older than 7 days (-mtime +7)
# ==============================================================================

set -e

BACKUP_DIR="/root/fmf-backups"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/fmf_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure backup destination directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] 🚀 Starting automated database backup..." >> "${LOG_FILE}"

# Change to application directory
cd "${APP_DIR}"

# Determine DB password & container name from .env or environment
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_PASS="${DB_ROOT_PASSWORD:-RootPassword123}"
DB_NAME="${DB_NAME:-fmf_db}"

# Execute mysqldump inside Docker container and compress with gzip
if docker compose exec -T db mysqldump -u root "-p${DB_PASS}" --single-transaction --quick "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"; then
  FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Backup created successfully: ${BACKUP_FILE} (${FILE_SIZE})" >> "${LOG_FILE}"
else
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ Backup failed during mysqldump execution!" >> "${LOG_FILE}"
  exit 1
fi

# Prune backup files older than 7 days
echo "[$(date +'%Y-%m-%d %H:%M:%S')] 🧹 Cleaning up backup files older than 7 days..." >> "${LOG_FILE}"
PRUNED_COUNT=$(find "${BACKUP_DIR}" -name "fmf_backup_*.sql.gz" -type f -mtime +7 -print | wc -l)
find "${BACKUP_DIR}" -name "fmf_backup_*.sql.gz" -type f -mtime +7 -delete

echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Cleanup complete. Pruned ${PRUNED_COUNT} old backup file(s)." >> "${LOG_FILE}"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] 🎉 Backup cycle finished successfully." >> "${LOG_FILE}"
