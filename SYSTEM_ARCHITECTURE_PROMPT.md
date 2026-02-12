# System Architecture Design Prompt - NutriSathi

## Executive Summary
Design a production-grade system architecture for **NutriSathi**, an AI-powered nutrition companion web application built with a modern tech stack. The application uses React + TypeScript frontend, FastAPI backend, and PostgreSQL database, with AI-driven meal recommendations based on user mood, health goals, and calorie tracking.

---

## Actual Technology Stack (Current Implementation)

### Frontend
- **Framework:** React 19.1.1 + TypeScript 5.9.2
- **Build Tool:** Vite 7.1.3
- **Styling:** Tailwind CSS 4.1.17 with PostCSS
- **UI Components:** React Icons 5.5.0
- **Barcode Scanning:** @zxing/browser & @zxing/library
- **Runtime:** Node.js 16+ (npm-based)
- **Deployment Target:** Web browsers (Chrome, Firefox, Safari, Edge)

### Backend
- **Framework:** FastAPI 0.111.0
- **ASGI Server:** Uvicorn 0.30.1 with standard extras
- **Language:** Python 3.11+
- **ORM:** SQLAlchemy 2.0.32
- **Migrations:** Alembic 1.13.2
- **Database Driver:** psycopg-binary 3.2.1 (PostgreSQL 12+)
- **Data Validation:** Pydantic 2.8.2
- **Authentication:** JWT tokens with bcrypt 4.1.2
- **File Uploads:** python-multipart 0.0.9
- **HTTP Client:** httpx 0.27.0
- **Image Processing:** Pillow 10.4.0
- **Environment:** python-dotenv 1.0.1
- **External APIs:** Google Cloud Translate 3.11.1, Requests 2.32.3

### Database
- **Primary DB:** PostgreSQL 12+
- **ORM Abstraction:** SQLAlchemy 2.0.32 with async support ready
- **Migrations:** Alembic for schema versioning

### AI/ML Services
- **Mood Recommender:** Python service (in-memory processing)
- **Calorie Calculator:** Python service
- **Thali Recommender:** Python service
- **Calorie Alert Service:** Python service
- **Translation:** Google Cloud Translate API (optional fallback)

### Infrastructure (Current)
- **Local Dev:** Docker-free setup (direct Python/Node.js)
- **Backend Port:** 8000 (Uvicorn)
- **Frontend Port:** 5173 (Vite dev server)

---

## Project Structure
```
nutrisathi/
├── backend/                          # FastAPI application
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point (1178 lines)
│   │   ├── db/
│   │   │   ├── models.py            # SQLAlchemy models (User, Meal, BMI, etc.)
│   │   │   ├── session.py           # Database session management
│   │   │   ├── base.py              # Base model
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── mood_recommender.py  # AI mood-based meal recommendations
│   │   │   ├── calorie_calculator.py # Calorie computation
│   │   │   ├── thali_recommender.py # Traditional Indian meal recommendations
│   │   │   └── calorie_alert_service.py
│   │   ├── api/                     # (Placeholder for future v1 routes)
│   │   └── ml/                      # (Placeholder for ML models)
│   ├── alembic/                     # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Container image spec
│   ├── alembic.ini                  # Migration config
│   └── test_*.py                    # Test files

├── frontend/                        # React + Vite application
│   ├── src/
│   │   ├── main.tsx                # React app entry point
│   │   ├── App.tsx                 # Main component (4423 lines)
│   │   ├── components/
│   │   │   ├── LandingPage.tsx      # Marketing landing page
│   │   │   ├── Dashboard.tsx        # User dashboard
│   │   │   ├── MoodRecommender.tsx  # Mood-based recommendations
│   │   │   ├── MealHistory.tsx      # Meal logging history
│   │   │   ├── NutritionAnalytics.new.tsx
│   │   │   ├── Gamification.tsx
│   │   │   ├── BarcodeScanner.tsx   # @zxing barcode scanner
│   │   │   ├── FoodConfirmation.tsx
│   │   │   └── ...other components
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── index.html

├── fastapi-sqlite-alembic/          # Reference template (DB best practices)
├── data/
│   ├── dishes.csv                  # Dish nutrition database
│   └── labels/
├── docs/                           # Architecture & feature docs
├── SRS.md                          # Software Requirements Specification
├── MOOD_RECOMMENDATION_FEATURE.md
├── PROJECT_SUMMARY.md
├── README.md
└── package.json
```

---

## Current Feature Set & API Endpoints

### Core Features
1. **User Management** - Sign up, login, profile management
2. **Meal Logging** - Add meals with calories, macros, meal type
3. **BMI Tracker** - Calculate and track BMI history
4. **Calorie Tracking** - Daily calorie intake monitoring with alerts
5. **Gamification** - Achievements, streaks, progress tracking
6. **Mood Recommender** - AI suggests meals based on 5 moods (Happy, Sad, Tired, Stressed, Sick)
7. **Thali Recommender** - Traditional Indian meal combinations
8. **Calorie Calculator** - AI-powered meal planning
9. **Barcode Scanner** - Product lookup via barcode (with fallback manual entry)
10. **Multilingual Support** - 10 Indian languages with Google Cloud Translate

### Current API Endpoints
**Authentication:**
- `POST /register` - User registration
- `POST /login` - User login

**Meals:**
- `GET /meals` - List user meals
- `POST /meals` - Log a meal
- `DELETE /meals/{meal_id}` - Delete meal

**BMI:**
- `POST /bmi` - Calculate BMI
- `GET /bmi/history` - BMI history

**AI Recommendations:**
- `POST /ai/recommend-mood` - Mood-based meal recommendations
- `POST /ai/recommend-thali` - Thali recommendations
- `POST /ai/calorie-plan` - AI-generated meal plan

**Utilities:**
- `GET /health` - Health check
- `POST /translate` - Translation service
- `GET /dishes` - Available dishes
- `GET /gamification/stats` - User achievements

---

## Deliverables Required

### 1. High-Level Architecture Diagram
Show:
- Frontend layer (React SPA)
- Backend API layer (FastAPI/Uvicorn)
- Database layer (PostgreSQL)
- External services (Google Cloud Translate, barcode service)
- Caching layer (Redis for future)
- Static asset storage
- User authentication flow
- AI service components (mood, thali, calorie calculators)

**Format:** Provide in Mermaid and PlantUML syntax.

### 2. Technology Component Breakdown
**Frontend:**
- Single Page Application (SPA) architecture
- State management approach (React hooks, context)
- Internationalization (i18n) strategy for 10 languages
- Styling architecture (Tailwind CSS utility-first)
- Build optimization and code splitting
- Asset loading and caching strategy
- Error handling and retry logic
- API integration pattern

**Backend:**
- API layer organization (routers, endpoints)
- Service layer (business logic separation)
- Database abstraction (SQLAlchemy models, sessions)
- Authentication & authorization (JWT implementation)
- AI service integration (mood recommender, calorie calculator, thali recommender)
- Request/response handling and validation
- Error handling and logging
- Async/await patterns for I/O operations

**Database:**
- Schema design for Users, Meals, BMI Records, Achievements
- Indexing strategy for common queries
- Migration strategy using Alembic
- Backup and recovery procedures

**AI/ML Components:**
- Mood recommender algorithm (multi-criteria scoring)
- Calorie calculator logic
- Thali recommender rules engine
- Integration with Google Cloud Translate API

### 3. Detailed Entity Relationship Diagram (ERD)
Show all tables:
- **users** - id, email, password_hash, name, age, gender, height, weight, dietary_preference, health_goal, allergies, created_at
- **meals** - id, user_id, name, serving_size, unit, calories, protein, carbs, fat, meal_type, timestamp
- **bmi_records** - id, user_id, height, weight, bmi_value, category, created_at
- **achievements** - id, user_id, achievement_name, badge, earned_at
- **preferences** - id, user_id, preferred_language, dietary_restrictions

Include:
- Primary & foreign keys
- Data types and constraints
- Indices for performance
- Relationships and cardinality

Provide SQLAlchemy model code snippets for 2-3 key entities.

### 4. REST API Contract (OpenAPI Specification)
Document:
- Authentication flow (JWT bearer token)
- 5-10 representative endpoints with:
  - HTTP method, path, summary
  - Request body schema (with examples)
  - Response body schema (with examples)
  - Status codes (200, 201, 400, 401, 404, 500)
  - Rate limits (if applicable)

Example structure:
```
POST /ai/recommend-mood
- Request: { mood: string, vegetarian?: boolean, num_recommendations?: int }
- Response: { mood: string, recommended_dishes: [...], mood_insights: [...], wellness_tip: string }
- Status: 200 OK, 400 Bad Request, 500 Server Error
```

### 5. Key Sequence Diagrams
Provide for:
- User login flow (frontend → backend → JWT token)
- Meal logging flow (user → form → API → database)
- Mood recommendation flow (user selects mood → API → algorithm → results)
- Language switching flow (UI → Google Translate API → fallback translations)

### 6. Non-Functional Design

**Performance:**
- Frontend: code splitting, lazy loading, image optimization, CDN for static assets
- Backend: database query optimization, caching (Redis for future), pagination, pagination limits
- Target: API response <500ms, page load <3s on 4G

**Scalability:**
- Stateless backend services (horizontal scaling ready)
- Database connection pooling
- Session management strategy
- Read replicas for high-traffic scenarios
- Queue systems for heavy computations (future)

**Security:**
- TLS encryption (HTTPS)
- JWT token expiration (24 hours)
- Password hashing (bcrypt with salt)
- Input validation and sanitization (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)
- CORS configuration (frontend domain only)
- Rate limiting (future implementation)
- Secrets management (.env variables)

**Observability:**
- Logging: structured logs for backend (FastAPI middleware)
- Monitoring: suggest Prometheus for metrics, Grafana for visualization
- Tracing: suggest OpenTelemetry for distributed tracing
- Health checks: `/health` endpoint for uptime monitoring

### 7. Deployment & Infrastructure as Code

**Development:**
- Current: Local Uvicorn + Vite dev server
- Recommended: Docker Compose for local parity with production

**Production Options:**
1. **Small (1-5k users):** 
   - AWS: Elastic Beanstalk (backend) + RDS (PostgreSQL) + S3 (assets)
   - Azure: App Service + Azure Database for PostgreSQL + Blob Storage
   - GCP: Cloud Run + Cloud SQL + Cloud Storage

2. **Medium-Large (5k-100k+ users):**
   - Kubernetes (EKS/AKS/GKE) with Helm charts
   - Managed PostgreSQL (AWS RDS, Azure Database, Google Cloud SQL)
   - Redis managed service (ElastiCache, Azure Cache, Memorystore)
   - CDN (CloudFront, Azure CDN, Cloud CDN)

Provide sample Terraform or Bicep for core infrastructure provisioning.

### 8. CI/CD Pipeline

Suggest GitHub Actions workflows for:
- **Lint & Format Check:** ESLint (frontend), Black (backend)
- **Testing:** pytest (backend), Jest/Vitest (frontend)
- **Build:** Docker image build, frontend bundle
- **Database Migrations:** Alembic pre-deployment
- **Deployment:** Blue-green or canary strategies
- **Health Checks:** Post-deployment validation

### 9. Cost Estimates

Provide sizing for:
- **Startup (1k concurrent users):** Estimated monthly cost
- **Growth (10k users):** Changes needed
- **Scale (100k+ users):** Infrastructure recommendations

Break down by: compute, storage, data transfer, third-party APIs.

### 10. Implementation Roadmap

**Phase 1 (Weeks 1-4):** 
- Database schema finalization & migrations
- API endpoint completion
- Frontend state management optimization

**Phase 2 (Weeks 5-8):**
- Authentication system hardening
- Performance optimization
- Test coverage improvement

**Phase 3 (Weeks 9-12):**
- Containerization (Docker)
- CI/CD setup
- Production deployment

**Phase 4 (Weeks 13+):**
- Monitoring & observability
- Feature additions (wearable integration, advanced ML)

### 11. Testing Strategy

- **Unit Tests:** pytest for backend, Vitest for frontend
- **Integration Tests:** Database + API end-to-end flows
- **E2E Tests:** Playwright for critical user journeys
- **Performance Testing:** Locust for load testing
- **Security Testing:** OWASP top 10 validation

### 12. Assumptions & Constraints

**Assumptions:**
- Users have internet connectivity
- PostgreSQL 12+ available in production
- Google Cloud Translate credentials provided (fallback available)
- Small team (1-4 engineers) maintaining system
- Budget-conscious deployment (prefer managed services)

**Constraints:**
- Data residency: India-based servers preferred
- Compliance: GDPR (EU users) + Indian data protection laws
- Language: 10 Indian languages only (no other countries)
- Barcode scanning: Online-first, fallback manual entry

---

## Questions to Address in Architecture

1. **State Management:** How should frontend state be managed for 10+ views and complex meal logging?
2. **Caching:** Where should caching be implemented (Redis, HTTP caching, browser storage)?
3. **Real-time Updates:** Do achievement/streak notifications need real-time updates (WebSockets vs. polling)?
4. **ML Model Deployment:** Should mood/calorie calculators be served via dedicated microservices or embedded in main API?
5. **Analytics:** What user behavior data should be tracked for product insights?
6. **Backup Strategy:** How often should PostgreSQL be backed up? What RTO/RPO targets?
7. **Secrets Management:** How should API keys (Google Translate, DB credentials) be rotated?
8. **Mobile App:** Is a native mobile app planned, or is responsive web sufficient?

---

## Tone & Audience

- **Target Audience:** Product owner, tech lead, and 2-3 engineers
- **Depth:** Implementation-ready, not academic
- **Focus:** Actionable next steps, clear ownership, measurable outcomes
- **Document Format:** Single Markdown file with embedded diagrams and code snippets

---

## Final Request

**Produce a comprehensive system architecture document that:**
1. ✅ Shows the current technology stack clearly
2. ✅ Provides diagrams (Mermaid/PlantUML) for visual understanding
3. ✅ Includes complete API contract (OpenAPI-style)
4. ✅ Specifies database schema with SQLAlchemy snippets
5. ✅ Defines deployment architecture for 3 platforms (AWS, Azure, GCP)
6. ✅ Provides working Terraform/Bicep examples
7. ✅ Includes CI/CD GitHub Actions workflow
8. ✅ Documents testing strategy and tools
9. ✅ Lists implementation roadmap with milestones
10. ✅ Addresses scaling from 1k to 100k+ users
11. ✅ Highlights trade-offs and alternatives
12. ✅ Provides clear next steps for team

**Constraints:**
- Keep document to 50-80 pages maximum
- Use actual technologies from `requirements.txt` and `package.json`
- Make diagrams and code copy-paste ready
- Focus on practical implementation, not theory

---

**This prompt is based on the actual NutriSathi codebase and can be fed to an AI architect to generate a production-grade system architecture document.**
