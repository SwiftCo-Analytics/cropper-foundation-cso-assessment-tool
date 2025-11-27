#!/bin/bash

# CSO Self-Assessment Tool - Deployment Script
# This script prepares your Next.js app for cPanel deployment

echo "🚀 Preparing CSO Self-Assessment Tool for cPanel deployment..."

# Create production build directory
echo "📁 Creating production build directory..."
rm -rf production-build
mkdir production-build

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
npm run build

# Copy necessary files to production directory
echo "📋 Copying files to production directory..."

# Copy built application
cp -r .next production-build/
cp -r public production-build/

# Copy source files needed at runtime
cp -r src/generated production-build/src/
mkdir -p production-build/prisma
cp prisma/schema.prisma production-build/prisma/

# Copy server files
cp app.js production-build/
cp package.json production-build/
cp server.js production-build/

# Copy environment template
cp env.production.example production-build/.env.production

echo "✅ Production build ready!"
echo ""
echo "Next steps:"
echo "1. Edit production-build/.env.production with your database credentials"
echo "2. Upload the contents of production-build/ to your cPanel directory"
echo "3. Set up MySQL database in cPanel"
echo "4. Register the Node.js application in cPanel"
echo "5. Run database migrations on the server"
echo ""
echo "📁 Files are ready in: production-build/"
