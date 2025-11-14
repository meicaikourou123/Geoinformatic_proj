#!/bin/bash
set -e
echo "Restoring PostgreSQL 17 data from backup.dump ..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/backup.dump
echo "Restore complete."