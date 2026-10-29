#!/bin/sh
set -eu

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 1
done

echo "Applying database migrations..."
psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -f /app/backend/queries/migrations/001_add_session_token.sql

echo "Creating admin user if needed..."
node /app/backend/dist/scripts/seed-admin.js

echo "Starting API..."
exec node /app/backend/dist/index.js
