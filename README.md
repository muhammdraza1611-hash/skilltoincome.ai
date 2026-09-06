# SkillToIncome AI 🚀

> AI-powered SaaS platform helping students and beginners convert their skills into income.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20 (Standalone, Signals, Material) |
| Backend | Python FastAPI |
| Database | PostgreSQL + SQLAlchemy (async) |
| Caching | Redis |
| AI | OpenAI GPT-4o-mini / Google Gemini |
| Auth | JWT + Refresh Tokens |
| Deploy | Docker + Docker Compose |

## Features

- 🧠 **AI Career Analysis** — Personalized career path recommendations
- 🗺️ **Roadmap Generator** — 30/60/90-day and 6-month AI roadmaps
- 💰 **Income Prediction** — Freelance & salary potential estimates
- 🎯 **Freelance Finder** — Fiverr/Upwork niches and gig ideas
- 📊 **Progress Tracker** — Daily logging with streak system
- 📁 **Portfolio Analyzer** — AI scores and improvement tips
- 🤖 **AI Mentor Chat** — Context-aware career chatbot
- 🛡️ **Admin Panel** — User management and platform analytics

## Quick Start

```bash
cp .env.example .env
# Add your OPENAI_API_KEY to .env
docker-compose up -d
```

- App: http://localhost:80
- API Docs: http://localhost:8000/api/docs

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full setup guide.

## Project Structure

```
skilltoincome-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API route handlers
│   │   ├── ai/              # AI client + prompts
│   │   ├── core/            # Config, security, deps
│   │   ├── db/              # Database session
│   │   ├── models/          # SQLAlchemy models
│   │   ├── repositories/    # Data access layer
│   │   ├── schemas/         # Pydantic DTOs
│   │   └── services/        # Business logic
│   ├── tests/
│   └── alembic/             # DB migrations
├── frontend/
│   └── src/app/
│       ├── core/            # Services, guards, store
│       ├── features/        # Page components
│       ├── layout/          # Shell, sidebar, topbar
│       └── shared/          # Reusable components
├── docs/
└── docker-compose.yml
```
