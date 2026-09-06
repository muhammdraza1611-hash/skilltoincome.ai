# 🎓 SkillToIncome AI

> AI-powered platform to help students and beginners convert their skills into income with personalized career paths, roadmaps, and income predictions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![Angular](https://img.shields.io/badge/angular-20-red.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)

---

## 🌟 Features

### 🎯 Core Features
- **AI Career Analysis** - Get personalized career recommendations based on your skills
- **Skills Assessment** - Comprehensive skills evaluation and tracking
- **Career Roadmaps** - Step-by-step guidance to achieve your career goals
- **Income Predictions** - AI-powered income forecasting based on skills and experience
- **Portfolio Analyzer** - Analyze your portfolio and get improvement suggestions
- **AI Mentor Chat** - 24/7 AI-powered career guidance and mentorship

### 💼 Job Board (NEW!)
- **Remote Job Listings** - Browse remote job opportunities from Remotive.io
- **AI-Powered Job Matching** - Get job recommendations based on your skills (0-100% match score)
- **Smart Search & Filters** - Search by title, company, location, and skills
- **Save Jobs** - Bookmark interesting opportunities
- **Application Tracking** - Track your job applications
- **Direct Apply Links** - No paywall, direct links to company career pages

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL / SQLite** - Database
- **Pydantic** - Data validation
- **httpx** - Async HTTP client
- **OpenAI API** - AI-powered features
- **Loguru** - Logging

### Frontend
- **Angular 20** - Modern TypeScript framework
- **Angular Material** - UI component library
- **RxJS** - Reactive programming
- **Signals** - Angular state management
- **TypeScript** - Type-safe JavaScript

### APIs & Services
- **Remotive.io API** - Remote job listings (FREE)
- **OpenAI GPT** - AI career analysis and chat
- **GitHub API** - Portfolio analysis

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/skilltoincome-ai.git
cd skilltoincome-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env with your configuration

# Run migrations (if using PostgreSQL)
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file (if needed)
# Edit src/environments/environment.ts

# Start development server
npm run start
```

Frontend will be available at: http://localhost:4200

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=sqlite:///./skilltoincome.db
# For PostgreSQL: postgresql://user:password@host:port/dbname

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# CORS
ALLOWED_ORIGINS=http://localhost:4200

# GitHub (Optional - for portfolio analysis)
GITHUB_TOKEN=your-github-token
```

### Frontend Environment

Edit `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1'
};
```

---

## 📁 Project Structure

```
skilltoincome-ai/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   └── v1/         # API version 1
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment template
│
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Core services
│   │   │   ├── features/   # Feature modules
│   │   │   ├── shared/     # Shared components
│   │   │   └── app.routes.ts
│   │   └── environments/   # Environment configs
│   ├── package.json        # Node dependencies
│   └── angular.json        # Angular config
│
├── docs/                   # Documentation
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

---

## 🎯 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
```
POST   /api/v1/auth/register     # Register new user
POST   /api/v1/auth/login        # Login
POST   /api/v1/auth/logout       # Logout
```

#### Skills
```
GET    /api/v1/skills/           # Get all skills
POST   /api/v1/skills/           # Add skill
PUT    /api/v1/skills/{id}       # Update skill
DELETE /api/v1/skills/{id}       # Delete skill
```

#### Careers
```
POST   /api/v1/careers/analyze   # AI career analysis
GET    /api/v1/careers/          # Get career paths
```

#### Roadmaps
```
POST   /api/v1/roadmaps/generate # Generate AI roadmap
GET    /api/v1/roadmaps/         # Get user roadmaps
```

#### Jobs
```
POST   /api/v1/jobs/sync         # Sync jobs from Remotive.io
POST   /api/v1/jobs/browse       # Browse jobs with filters
GET    /api/v1/jobs/recommended  # AI-recommended jobs
POST   /api/v1/jobs/save         # Save/bookmark job
POST   /api/v1/jobs/apply        # Mark job as applied
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 🚢 Deployment

### Option 1: Railway (Recommended)

#### Backend on Railway
1. Create new project on Railway
2. Connect your GitHub repository
3. Select `backend` as root directory
4. Add environment variables
5. Deploy!

#### Frontend on Railway/Vercel
1. Create new project
2. Connect repository
3. Select `frontend` as root directory
4. Build command: `npm run build`
5. Deploy!

### Option 2: Docker
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Database: Supabase (PostgreSQL)
1. Create project on Supabase
2. Copy connection string
3. Update `DATABASE_URL` in backend `.env`
4. Run migrations: `alembic upgrade head`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Muhammad Husnain Raza**
- GitHub: [@YOUR_GITHUB_USERNAME](https://github.com/YOUR_GITHUB_USERNAME)
- Email: meharraza371@gmail.com

---

## 🙏 Acknowledgments

- OpenAI for GPT API
- Remotive.io for job listings API
- FastAPI and Angular communities
- All contributors

---

## 📞 Support

For support, email meharraza371@gmail.com or open an issue on GitHub.

---

## 🗺️ Roadmap

- [ ] Add more job sources (Arbeitnow, RemoteLeaf)
- [ ] Email notifications for job alerts
- [ ] Resume builder and parser
- [ ] Interview preparation AI
- [ ] Mobile app (React Native)
- [ ] Community features (forums, networking)
- [ ] Premium features (advanced analytics)

---

**⭐ If you find this project useful, please give it a star!**
