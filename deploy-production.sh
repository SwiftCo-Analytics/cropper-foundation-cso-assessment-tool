#!/bin/bash

# CSO Self-Assessment Tool - Production Deployment Script
# Run this script on your production server after uploading files

set -e  # Exit on any error (except where explicitly handled)

# Find npm if not in PATH (common on some hosting platforms)
if ! command -v npm &> /dev/null; then
    # Try common npm locations
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
    elif [ -f "/usr/local/bin/npm" ]; then
        export PATH="/usr/local/bin:$PATH"
    elif [ -f "/opt/nodejs/bin/npm" ]; then
        export PATH="/opt/nodejs/bin:$PATH"
    else
        echo "❌ ERROR: npm not found. Please ensure Node.js and npm are installed."
        echo "   You may need to:"
        echo "   1. Install Node.js on your server"
        echo "   2. Add npm to your PATH"
        echo "   3. Or run this script from a directory where npm is available"
        exit 1
    fi
fi

echo "🚀 Starting production deployment..."

# Switch to the site directory (update this path for your xcloud setup)
# cd /var/www/selfassess.csogo.org
# Or use the current directory if running from the app root
APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

# Load .env file if it exists
# This function loads environment variables from .env files
load_env_file() {
    if [ -f "$1" ]; then
        echo "📄 Loading environment variables from $1..."
        set -a  # automatically export all variables
        # Source the file, but only export lines that look like KEY=value
        # This works if the .env file is in bash-compatible format
        # For more complex .env files, ensure variables are exported manually
        . "$1" 2>/dev/null || {
            # If sourcing fails, try a more permissive approach
            while IFS= read -r line || [ -n "$line" ]; do
                # Skip comments and empty lines
                [[ "$line" =~ ^[[:space:]]*# ]] && continue
                [[ -z "${line// }" ]] && continue
                # Only process lines with = sign
                if [[ "$line" =~ = ]]; then
                    # Try to export the line
                    eval "export $line" 2>/dev/null || true
                fi
            done < "$1"
        }
        set +a
        return 0
    fi
    return 1
}

# Try loading .env files (in order of preference)
if ! load_env_file ".env.production"; then
    load_env_file ".env"
fi

echo "📦 Installing dependencies..."
# Install all dependencies (including devDependencies needed for build)
# Using --legacy-peer-deps to handle dependency conflicts
# Remove node_modules first to ensure clean install
if [ -d "node_modules" ]; then
    echo "🧹 Cleaning existing node_modules for fresh install..."
    rm -rf node_modules
fi
# Ensure devDependencies are installed (needed for build)
# Temporarily unset NODE_ENV if it's set to production (npm skips devDeps when NODE_ENV=production)
OLD_NODE_ENV="$NODE_ENV"
unset NODE_ENV
npm install --legacy-peer-deps
export NODE_ENV="$OLD_NODE_ENV"

echo "🗄️ Setting up database schema..."
# Ensure DATABASE_URL is set in environment
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL environment variable not set"
    echo "   Make sure it's configured in your environment variables or .env file"
    echo "   Example: export DATABASE_URL='mysql://user:pass@localhost:3306/dbname'"
    exit 1
fi

# Generate Prisma client first
echo "📦 Generating Prisma client..."
./node_modules/.bin/prisma generate

# Use db push to create schema directly (no migrations needed for fresh DB with imported data)
echo "📊 Pushing database schema..."
./node_modules/.bin/prisma db push --accept-data-loss

# Import data from postgres-export.json if it exists (for initial setup)
if [ -f "postgres-export.json" ]; then
    echo "📥 Found postgres-export.json - preparing to import data..."
    
    # Prisma client already generated above, but regenerate to be safe
    echo "📦 Regenerating Prisma client..."
    ./node_modules/.bin/prisma generate
    
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

# Verify build completed successfully
if [ ! -d ".next" ]; then
    echo "❌ ERROR: Build failed - .next directory not found"
    exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ ERROR: Build failed - BUILD_ID file not found"
    exit 1
fi

# Check if standalone build was used (optional)
if [ -d ".next/standalone" ]; then
    echo "ℹ️  Standalone build detected - using standalone server"
    echo "   To use standalone: npm run build:standalone && npm run start:standalone"
else
    echo "ℹ️  Standard build detected - using next start"
    echo "   This is the recommended approach for most deployments"
fi

echo "✅ Build verification passed"

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart the Node.js application (via xcloud dashboard or process manager)"
echo "2. Check application logs for any errors"
echo "3. Verify the application is running"
echo ""
echo "💡 To start/restart the app:"
if [ -d ".next/standalone" ]; then
    echo "   - Run: npm run start:standalone (for standalone build)"
else
    echo "   - Run: npm start (for standard build)"
fi
echo "   - Or use your xcloud process manager (PM2, systemd, etc.)"
echo ""
echo "⚠️  IMPORTANT: If npm is not in your PATH on the server:"
echo "   1. Find npm location: which npm or find / -name npm 2>/dev/null"
echo "   2. Add it to PATH: export PATH=\"/path/to/node/bin:\$PATH\""
echo "   3. Or use full path: /path/to/npm start"

