#!/bin/bash
set -e

echo "🗄️  Starting PostgreSQL data restore from backup.dump ..."

# 注意：这里的环境变量由 docker-compose.yml 自动注入：
# - POSTGRES_USER
# - POSTGRES_PASSWORD
# - POSTGRES_DB

pg_restore \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -v \
    /docker-entrypoint-initdb.d/backup.dump

echo "✅  PostgreSQL restore completed successfully."