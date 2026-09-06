# SkillToIncome AI - Deployment Guide

## Prerequisites
- Docker & Docker Compose
- OpenAI API key (or Gemini API key)
- Domain name (for production)

---

## Quick Start (Docker)

### 1. Clone & Configure
```bash
git clone <your-repo>
cd skilltoincome-ai
cp .env.example .env
```

Edit `.env`:
```env
POSTGRES_PASSWORD=your-strong-db-password
SECRET_KEY=your-64-char-random-secret-key
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key
```

### 2. Launch
```bash
docker-compose up -d
```

Services:
- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your local settings

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
# App runs at http://localhost:4200
```

---

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Running Tests
```bash
cd backend
pip install aiosqlite pytest-asyncio
pytest tests/ -v --cov=app
```

---

## Production Deployment

### Environment Variables (Production)
```env
DEBUG=false
SECRET_KEY=<64+ char random string>
POSTGRES_PASSWORD=<strong password>
OPENAI_API_KEY=<your key>
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

### With SSL (using Traefik/Nginx proxy)
Add to docker-compose.yml or use a reverse proxy like:
- Traefik with Let's Encrypt
- Nginx with Certbot
- AWS ALB / CloudFront

### Switching AI Provider
```env
# Use OpenAI (default)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Use Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│  Angular 20     │───▶│  FastAPI Backend  │
│  (Port 80)      │    │  (Port 8000)      │
└─────────────────┘    └──────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
             ┌──────────┐           ┌──────────┐
             │ PostgreSQL│           │  Redis   │
             │ (Port 5432)           │ (Port 6379)
             └──────────┘           └──────────┘
```

## API Version
All endpoints are prefixed with `/api/v1/`
Swagger UI: `GET /api/docs`
