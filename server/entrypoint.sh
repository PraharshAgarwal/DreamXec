#!/bin/sh
set -e

# Strip any accidental outer quotes around database URLs
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(echo "$DATABASE_URL" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  export DATABASE_URL
fi

if [ -n "$DIRECT_URL" ]; then
  DIRECT_URL=$(echo "$DIRECT_URL" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  export DIRECT_URL
fi

echo "📦 Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "⚠️ prisma migrate deploy encountered an error. Attempting to resolve baseline migration..."
  npx prisma migrate resolve --applied 0_init 2>/dev/null || true
  npx prisma migrate deploy || echo "⚠️ Warning: prisma migrate deploy could not complete automatically. Proceeding with application startup..."
fi

echo "🚀 Starting Express server with PM2 Cluster Mode..."
exec npx pm2-runtime start ecosystem.config.js --env production
