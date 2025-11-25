#!/bin/bash

echo "Setting up the project..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required but not installed. Installing..." >&2; npm install -g pnpm; }
command -v mvn >/dev/null 2>&1 || { echo "Maven is required but not installed. Aborting." >&2; exit 1; }
command -v java >/dev/null 2>&1 || { echo "Java is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "Installing frontend dependencies..."
pnpm install

echo "Installing backend dependencies..."
cd apps/backend
mvn clean install -DskipTests
cd ../..

# Copy environment files
echo "Setting up environment files..."
if [ ! -f apps/backend/.env ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "Created apps/backend/.env from .env.example"
fi

echo "Setup completed successfully!"
echo ""
echo "To start development:"
echo "  Frontend: pnpm dev:web"
echo "  Backend:  pnpm dev:backend"
echo "  Docker:   pnpm docker:up"
