#!/bin/bash
# Reset database script

echo "⚠️  This will delete all data and reset the database!"
read -p "Are you sure? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
fi

cd backend

echo "🗑️  Resetting database..."
npx prisma migrate reset --force

echo "✅ Database reset complete!"
echo "🌱 Seed data has been inserted."

