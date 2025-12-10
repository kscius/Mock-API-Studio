#!/bin/bash
# Development startup script

echo "🚀 Starting Mock API Studio in development mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start database and Redis
echo "📦 Starting PostgreSQL and Redis..."
docker compose up db redis -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Backend setup complete!"

# Return to root
cd ..

echo ""
echo "✅ Development environment ready!"
echo ""
echo "To start the services:"
echo "  Backend:  cd backend && npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  Database: postgresql://mockapi:mockapi@localhost:5432/mockapi"
echo "  Redis:    redis://localhost:6379"
echo ""

