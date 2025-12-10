# Quick Start Guide - Mock API Studio

Get Mock API Studio running in 5 minutes!

## 🚀 Fastest Start (Docker)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd mock-api-studio

# 2. Start everything
docker compose up --build

# 3. Open your browser
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

That's it! The database will be automatically migrated and seeded with example APIs.

## 🧪 Test It Out

### Try the Seeded APIs

**JSONPlaceholder API:**
```bash
# Get all posts
curl http://localhost:3000/mock/jsonplaceholder/posts

# Get post by ID
curl http://localhost:3000/mock/jsonplaceholder/posts/1

# Get users
curl http://localhost:3000/mock/jsonplaceholder/users
```

**GitHub Mock API:**
```bash
# Get user
curl http://localhost:3000/mock/github/users/octocat

# Get repository
curl http://localhost:3000/mock/github/repos/octocat/sample-repo
```

### Create Your First API

1. **Open the UI:** http://localhost:8080

2. **Click "Create API"**
   - Name: `My Test API`
   - Slug: `test-api`
   - Click "Create"

3. **Add an Endpoint**
   - Click on your new API
   - Click "New Endpoint"
   - Method: `GET`
   - Path: `/hello`
   - Add a response:
     - Status: `200`
     - Body: `{"message": "Hello World!"}`
   - Click "Create Endpoint"

4. **Test Your Endpoint**
```bash
curl http://localhost:3000/mock/test-api/hello
# Response: {"message": "Hello World!"}
```

## 🎯 Common Scenarios

### Scenario 1: Mock a REST API with Parameters

**Create endpoint:** `GET /users/:id`

**Response:**
```json
{
  "status": 200,
  "body": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Test:**
```bash
curl http://localhost:3000/mock/test-api/users/123
```

### Scenario 2: Simulate Slow Network

**Create endpoint:** `GET /slow-endpoint`
- Delay: `3000` ms (3 seconds)

**Test:**
```bash
time curl http://localhost:3000/mock/test-api/slow-endpoint
# Takes ~3 seconds to respond
```

### Scenario 3: Multiple Response Scenarios

**Create endpoint:** `GET /conditional`

**Add multiple responses:**
1. **Success Response** (default)
   - Status: `200`
   - Body: `{"success": true}`
   - ✅ Default

2. **Error Response**
   - Status: `500`
   - Body: `{"error": "Internal Server Error"}`

Toggle which response is default to test different scenarios.

## 📦 Import Example API

1. **Download Example:** Check `examples/example-api.json`

2. **Import:**
   - Click "Import JSON" on Dashboard
   - Select `example-api.json`
   - Click "Import"

3. **Test E-commerce API:**
```bash
# List products
curl http://localhost:3000/mock/ecommerce/api/v1/products

# Get product
curl http://localhost:3000/mock/ecommerce/api/v1/products/1

# Get cart
curl http://localhost:3000/mock/ecommerce/api/v1/cart
```

## 🛠️ Development Mode

For local development without Docker:

```bash
# 1. Start database and Redis
docker compose up db redis -d

# 2. Backend (Terminal 1)
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev

# 3. Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 🔧 Troubleshooting

### Port Already in Use

**Check what's running:**
```bash
docker ps
```

**Stop and clean:**
```bash
docker compose down
docker compose down -v  # Remove volumes
```

### Database Migration Failed

```bash
cd backend
npx prisma migrate reset --force
```

### Redis Connection Failed

```bash
docker compose restart redis
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:3000/api-definitions`
2. Check browser console for errors
3. Verify VITE_API_BASE_URL in frontend/.env

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## 💡 Tips

**Export Before Experimenting:**
Always export your APIs before making major changes. You can re-import them if something goes wrong.

**Use Delays for Realistic Testing:**
Set delays to simulate real-world network conditions.

**Multiple Responses:**
Use multiple responses to test different scenarios (success, error, edge cases).

**Path Parameters:**
Use `:paramName` in paths for dynamic routes (e.g., `/users/:id`).

## 🎉 You're Ready!

Start mocking APIs and happy testing! 🚀

