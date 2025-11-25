#!/bin/bash

echo "Building all workspaces..."

# Build frontend packages
echo "Building frontend packages..."
pnpm install
pnpm --filter @chat/shared type-check
pnpm --filter @chat/ui type-check
pnpm --filter web build

# Build backend
echo "Building backend..."
cd apps/backend
mvn clean package -DskipTests
cd ../..

echo "Build completed successfully!"
