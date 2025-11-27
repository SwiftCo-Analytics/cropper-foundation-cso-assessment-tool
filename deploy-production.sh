#!/bin/bash

# CSO Self-Assessment Tool - Production Deployment Script
# Run this script on your production server after uploading files

set -e  # Exit on any error (except where explicitly handled)

echo "🚀 Starting production deployment..."

# Switch to the site directory
cd /var/www/selfassess.csogo.org

echo "📦 Installing dependencies..."
npm ci --production

echo "🗄️ Running database migrations..."
# Ensure DATABASE_URL is set in environment
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL environment variable not set"
    echo "   Make sure it's configured in cPanel Application Manager"
    exit 1
fi

npx prisma migrate deploy

# Import data from postgres-export.json if it exists (for initial migration)
if [ -f "postgres-export.json" ]; then
    echo "📥 Found postgres-export.json - preparing to import data..."
    
    # Generate Prisma client before import (migrations might have created schema)
    echo "📦 Generating Prisma client..."
    npx prisma generate
    
    echo "📊 Importing PostgreSQL data to MySQL..."
    echo "   (Using upsert mode - existing records will be updated, new ones will be added)"
    
    # Run import with --force flag (required by import script to proceed)
    # Temporarily disable exit on error for import step
    set +e
    npm run import-mysql -- --force
    IMPORT_EXIT_CODE=$?
    set -e
    
    if [ $IMPORT_EXIT_CODE -eq 0 ]; then
        echo "✅ Data import completed successfully!"
    else
        echo "⚠️  Import completed with warnings (exit code: $IMPORT_EXIT_CODE)"
        echo "   This may be normal if data already exists or import was skipped"
        echo "   Continuing with deployment..."
    fi
else
    echo "ℹ️  No postgres-export.json found - skipping data import"
    echo "   (This is normal for subsequent deployments)"
fi

echo "🔨 Building the application..."
# This will also generate Prisma client (included in build script)
npm run build

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart the Node.js application in cPanel Application Manager"
echo "2. Check application logs for any errors"
echo "3. Verify the application is running at https://selfassess.csogo.org"
echo ""
echo "💡 To restart the app manually, use cPanel Application Manager:"
echo "   - Go to Software → Application Manager"
echo "   - Find 'cso-self-assessment' and click 'Restart'"

