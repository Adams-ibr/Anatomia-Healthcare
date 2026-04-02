#!/bin/bash

# Deployment Script for Anatomia Healthcare

set -e # Exit immediately if a command exits with a non-zero status.

echo "🚀 Starting Deployment Process..."

# 1. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Type Check
echo "🔍 Running type checks..."
npm run check

# 3. Build Application
echo "🏗️ Building application..."
npm run build

# 4. Database Migration (Optional - requires DATABASE_URL)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL is not set. Skipping database push."
  echo "👉 Please run 'npm run db:push' manually after setting the environment variable."
else
  echo "🗄️  Pushing database schema to Supabase..."
  npm run db:push
fi

# 5. Vercel Deployment Instructions
echo "✅ Build successful!"
echo ""
echo "☁️  To deploy to Vercel, run:"
echo "   vercel deploy"
echo ""
echo "   (Ensure you have installed the Vercel CLI: npm i -g vercel)"
