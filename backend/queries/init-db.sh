#!/bin/sh
set -eu

echo "Waiting for PostgreSQL to become ready..."
until pg_isready -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 1
done

echo "Applying session_token migration..."
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
  -v ON_ERROR_STOP=1 \
  -f /migrations/001_add_session_token.sql

echo "Database migration completed."
