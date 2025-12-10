#!/bin/bash
# Clean Docker environment script

echo "🧹 Cleaning Docker environment..."

echo "🛑 Stopping all containers..."
docker compose down

echo "🗑️  Removing volumes..."
docker compose down -v

echo "🧼 Pruning Docker system..."
docker system prune -f

echo "✅ Docker environment cleaned!"
echo ""
echo "To rebuild from scratch:"
echo "  docker compose up --build"

