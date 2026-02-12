# NutriSathi System Architecture Prompt
## Based on ACTUAL Technologies Currently Used

---

## 🎯 Project Context

**NutriSathi** is an AI-powered nutrition companion web application. This prompt is based on the **actual tech stack currently implemented**, not theoretical recommendations.

---

## 🛠️ ACTUAL Technology Stack (Currently Implemented)

### Frontend Stack
```
✅ React 19.1.1 (UI Framework)
✅ TypeScript 5.9.2 (Type Safety)
✅ Vite 7.1.3 (Build Tool & Dev Server)
✅ Tailwind CSS 4.1.17 (Styling - Utility-first)
✅ PostCSS 8.5.6 (CSS Processing)
✅ React Icons 5.5.0 (Icon Library)
✅ @zxing/browser 0.1.5 (Barcode Scanning)
✅ @zxing/library 0.21.3 (Barcode Detection)
✅ Node.js 16+ (Runtime)
✅ npm (Package Manager)
```

### Backend Stack
```
✅ FastAPI 0.111.0 (Python Web Framework)
✅ Uvicorn 0.30.1 (ASGI Server)
✅ Python 3.11+ (Language)
✅ Pydantic 2.8.2 (Data Validation)
✅ SQLAlchemy 2.0.32 (ORM)
✅ Alembic 1.13.2 (Database Migrations)
✅ psycopg-binary 3.2.1 (PostgreSQL Driver)
✅ bcrypt 4.1.2 (Password Hashing)
✅ python-multipart 0.0.9 (File Upload)
✅ httpx 0.27.0 (HTTP Client)
✅ Pillow 10.4.0 (Image Processing)
✅ requests 2.32.3 (HTTP Library)
✅ python-dotenv 1.0.1 (Environment Variables)
✅ google-cloud-translate 3.11.1 (Optional Translation API)
```

### Database Stack
```
✅ PostgreSQL 12+ (Primary Database)
✅ SQLAlchemy ORM (Data Layer Abstraction)
✅ Alembic (Schema Migrations)
✅ Connection Pooling (psycopg)
```

### AI/ML Services (In-Memory Processing)
```
✅ MoodRecommender (5-mood classification with multi-criteria scoring)
✅ CalorieCalculator (Nutritional computation)
✅ ThaliRecommender (Traditional Indian meal combinations)
✅ CalorieAlertService (Notification logic)
```

### External Services (Integrated)
```
✅ Google Cloud Translate API (Optional - has fallback)
✅ Unsplash Images (Food/health photos)
✅ Barcode Lookup API (Product database)
```

### What is NOT Used
```
❌ Redis (No caching layer)
❌ Docker (Local dev uses direct Python/Node.js)
❌ Kubernetes (No container orchestration)
❌ ELK Stack (No centralized logging)
❌ Prometheus/Grafana (No metrics/monitoring)
❌ Elasticsearch (No search engine)
❌ Message Queues (Celery/RabbitMQ - no async jobs)
❌ Microservices (Monolithic architecture)
❌ GraphQL (REST API only)
❌ WebSockets (No real-time features)
❌ Mobile App (Web-only, responsive design)
```

---

## 📐 Architecture Design Requirements

### 1. Overall Architecture
Design a **monolithic REST API architecture** with:
- **Frontend:** Single Page Application (SPA) using React components
- **Backend:** Unified FastAPI application with organized route modules
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Services:** In-memory AI services (no separate microservices)
- **Scalability:** Stateless backend, horizontal scaling ready

### 2. Frontend Architecture

**Current Implementation:**
- React 19 SPA with TypeScript
- Vite dev server (hot reload on port 5173)
- Tailwind CSS utility-first styling
- Component-based structure
- React Hooks for state management (useState, useEffect, useContext)
- Fetch API for backend calls

**Requirements:**
- Detail component organization (Landing, Dashboard, Meal Logger, etc.)
- State management flow (how data flows between components)
- API integration pattern (fetch wrapper, error handling, retry logic)
- Responsive design approach (mobile-first, grid/flexbox)
- Asset loading strategy (images from Unsplash, lazy loading)
- Error boundary implementation
- Form validation approach
- Barcode scanner integration (@zxing library)

### 3. Backend API Design

**Current Implementation:**
- FastAPI framework with Python 3.11+
- Uvicorn ASGI server (port 8000)
- RESTful endpoints (no GraphQL)
- Pydantic for request/response validation
- JWT authentication (24-hour tokens)
- CORS middleware for frontend integration
- In-memory service classes

**API Endpoints (Current):**
```
Authentication:
  POST /register - User registration
  POST /login - User login with JWT

Meals:
  GET /meals - List user meals (with date filtering)
  POST /meals - Log a meal
  DELETE /meals/{meal_id} - Delete meal

BMI:
  POST /bmi - Calculate and store BMI
  GET /bmi/history - User BMI history

AI Recommendations:
  POST /ai/recommend-mood - Get mood-based meal recommendations
  POST /ai/recommend-thali - Get traditional thali recommendations
  POST /ai/calorie-plan - Get AI meal plan

Utilities:
  GET /health - Health check
  POST /translate - Translate UI strings
  GET /dishes - Get available dishes database
  GET /gamification/stats - User achievements

User Profile:
  GET /users/profile - Get user profile
  PUT /users/profile - Update user profile
```

**Requirements:**
- Define complete OpenAPI/Swagger spec for all endpoints
- Document request/response models for each endpoint
- Define status codes (200, 201, 400, 401, 404, 500)
- Implement error handling with meaningful messages
- Add request validation with Pydantic
- Implement JWT token refresh logic
- Rate limiting strategy (if needed)

### 4. Database Schema Design

**Current Tables:**
```
users:
  - id (UUID)
  - email (UNIQUE, VARCHAR)
  - password_hash (VARCHAR)
  - name (VARCHAR)
  - age (INT)
  - gender (VARCHAR)
  - height (FLOAT)
  - weight (FLOAT)
  - dietary_preference (VARCHAR)
  - health_goal (VARCHAR)
  - allergies (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

meals:
  - id (UUID)
  - user_id (FK -> users)
  - name (VARCHAR)
  - serving_size (FLOAT)
  - unit (VARCHAR)
  - calories (FLOAT)
  - protein (FLOAT)
  - carbs (FLOAT)
  - fat (FLOAT)
  - meal_type (VARCHAR: Breakfast, Lunch, Evening Snack, Dinner)
  - timestamp (TIMESTAMP)

bmi_records:
  - id (UUID)
  - user_id (FK -> users)
  - height (FLOAT)
  - weight (FLOAT)
  - bmi_value (FLOAT)
  - category (VARCHAR: Underweight, Normal, Overweight, Obese)
  - created_at (TIMESTAMP)

achievements:
  - id (UUID)
  - user_id (FK -> users)
  - achievement_name (VARCHAR)
  - badge (VARCHAR)
  - earned_at (TIMESTAMP)

preferences:
  - id (UUID)
  - user_id (FK -> users)
  - preferred_language (VARCHAR: en, hi, bn, ta, te, mr, gu, ur, pa, od)
  - theme (VARCHAR)
  - notifications_enabled (BOOLEAN)
  - created_at (TIMESTAMP)
```

**Requirements:**
- Provide SQLAlchemy model definitions for each table
- Define indices for performance (user_id, email, created_at, timestamp)
- Document foreign key relationships and cascading rules
- Specify constraints (NOT NULL, UNIQUE, CHECK)
- Migration strategy using Alembic

### 5. AI/ML Services Architecture

**Current Services (In-Memory Processing):**

**a) MoodRecommender**
- Accepts: mood (happy/sad/tired/stressed/sick), vegetarian filter, num_recommendations
- Process: Multi-criteria scoring algorithm
- Output: Top N dishes with mood benefits and insights
- Storage: References dishes from CSV database

**b) CalorieCalculator**
- Accepts: Food items, portions, meal type
- Process: Lookup nutrition data, aggregate macros
- Output: Total calories, protein, carbs, fat

**c) ThaliRecommender**
- Accepts: Meal type, calorie goal, dietary preference, health goal
- Process: Rule-based thali combinations
- Output: Traditional meal recommendations with nutrition

**d) CalorieAlertService**
- Accepts: Daily calorie total, daily goal
- Process: Compare and generate alerts
- Output: Alert messages at 75%, 90%, 100%+

**Requirements:**
- Detail algorithm pseudocode for each service
- Specify input/output data models
- Document scoring criteria and weights
- Provide example calculations
- Define error handling

### 6. Authentication & Security

**Current Implementation:**
- JWT tokens (Bearer token in Authorization header)
- bcrypt password hashing (salt rounds: 10+)
- CORS middleware
- HTTPS/TLS (in production)

**Requirements:**
- JWT token generation and validation flow
- Password reset mechanism
- Token refresh strategy
- Session timeout handling
- Input validation and sanitization
- SQL injection prevention (via SQLAlchemy ORM)
- XSS protection
- CSRF token handling (if needed)

### 7. Data Flow Diagrams

**Sequence Diagram 1: User Registration & Login**
```
Frontend → Backend: POST /register {email, password, name}
           → Validate input
           → Hash password with bcrypt
           → Store in DB
           ← Return success/error
Frontend → Backend: POST /login {email, password}
           → Query user by email
           → Compare password with hash
           → Generate JWT token
           ← Return token
Frontend: Store token in localStorage/sessionStorage
          Use token in Authorization header for all requests
```

**Sequence Diagram 2: Meal Logging**
```
User → Frontend: Enter meal details
Frontend → Validation: Check form inputs
Frontend → Backend: POST /meals {name, serving_size, calories, ...}
           → Validate with Pydantic
           → Calculate daily totals
           → Check alerts
           → Store in database
           → Compute gamification stats
           ← Return updated meal list + daily summary
Frontend: Update UI with new meal and daily stats
```

**Sequence Diagram 3: Mood Recommendation**
```
User → Frontend: Select mood (e.g., "sad")
Frontend → Backend: POST /ai/recommend-mood {mood: "sad"}
           → Load dish database (CSV)
           → Run MoodRecommender algorithm
           → Score all dishes against mood criteria
           → Filter top 5 by score
           → Generate mood insights
           → Fetch user preferences (vegetarian)
           ← Return recommendations JSON
Frontend: Display dishes with mood benefits and insights
```

**Sequence Diagram 4: Translation (i18n)**
```
User → Frontend: Click language dropdown (Hindi)
Frontend → Backend: POST /translate {target: "hi", texts: {...}}
           → Check if fallback translations exist
           → If yes, return immediately
           → If API key set, call Google Cloud Translate
           → Map language codes
           → Return translated strings
           ← Return translations JSON
Frontend: Update UI text in selected language
Store: Save language preference in user preferences table
```

### 8. Deployment Architecture

**Development:**
- Backend: Uvicorn on localhost:8000
- Frontend: Vite dev server on localhost:5173
- Database: Local PostgreSQL instance
- No Docker (direct Python/Node.js execution)

**Production (Recommended):**
```
Option A: Single Cloud Provider
AWS: Elastic Beanstalk (Backend) + RDS (PostgreSQL) + S3 (Static assets)
Azure: App Service (Backend) + Azure Database for PostgreSQL + Blob Storage
GCP: Cloud Run (Backend) + Cloud SQL (PostgreSQL) + Cloud Storage

Option B: On-Premises / VPS
Server 1: Backend (Uvicorn behind Nginx reverse proxy)
Server 2: PostgreSQL database with backups
Server 3: Static assets (Nginx CDN)
```

**Infrastructure Components:**
- Web Server: Nginx reverse proxy (production)
- App Server: Uvicorn (multiple workers for scaling)
- Database: PostgreSQL with connection pooling
- Static Assets: CDN or cloud storage
- SSL/TLS: Let's Encrypt or cloud provider certificates
- Backups: Daily automated PostgreSQL backups

### 9. CI/CD Pipeline

**Stages:**
1. **Lint & Format Check:**
   - Backend: Black (Python formatter)
   - Frontend: ESLint + Prettier (TypeScript)

2. **Testing:**
   - Backend: pytest unit tests
   - Frontend: Vitest unit tests (or Jest)

3. **Build:**
   - Backend: Create application artifact
   - Frontend: Build with Vite (`npm run build`)

4. **Database Migrations:**
   - Run Alembic migrations on staging
   - Verify schema changes

5. **Deploy:**
   - Blue-green deployment strategy
   - Health check post-deployment
   - Rollback capability

**Tools:**
- Git: Version control
- GitHub Actions: CI/CD automation
- Docker: Containerization (optional)
- Staging environment for testing

### 10. Performance Optimization

**Frontend:**
- Code splitting with Vite
- Lazy loading components
- Image optimization (use Unsplash responsive URLs)
- Tailwind CSS purging unused styles
- Gzip compression for assets

**Backend:**
- Database indices on frequently queried columns
- Query optimization (avoid N+1 queries)
- Connection pooling (psycopg)
- Pagination for list endpoints (limit 50-100)
- Response caching headers for static data
- Async/await for I/O operations

**Target Metrics:**
- Page load: < 3 seconds
- API response: < 500ms
- Database query: < 100ms

### 11. Monitoring & Logging (Future)

**Currently NOT implemented, but recommended:**
- Application logs: Write to files + console
- Error tracking: Sentry (optional)
- Metrics: Prometheus (future)
- Visualization: Grafana (future)
- Centralized logging: ELK Stack (future)
- Distributed tracing: OpenTelemetry (future)

### 12. Testing Strategy

**Unit Tests:**
- Backend: pytest for services, API routes
- Frontend: Vitest for React components

**Integration Tests:**
- Test API endpoint + database flow
- Test authentication flow
- Test meal logging end-to-end

**E2E Tests:**
- Playwright for critical user journeys
- User login → meal logging → recommendations

**Load Testing:**
- Locust for simulating 1000+ concurrent users
- Target: < 500ms response time at load

---

## 📋 Deliverables

### 1. System Architecture Diagram
- Show all components (Frontend, Backend, Database, External Services)
- Show data flow between components
- Format: Mermaid diagram (can export as PNG/JPG)

### 2. API Documentation
- OpenAPI/Swagger spec for all 15+ endpoints
- Request/response models
- Error handling examples
- Authentication headers

### 3. Database Schema
- ERD with all tables and relationships
- SQLAlchemy model code
- Migration instructions
- Indexing strategy

### 4. Sequence Diagrams
- User registration flow
- Meal logging flow
- Mood recommendation flow
- Translation flow

### 5. Deployment Guide
- Development setup instructions
- Production deployment steps
- Environment variables needed
- Backup & recovery procedures

### 6. CI/CD Configuration
- GitHub Actions workflow YAML
- Testing command examples
- Build and deployment scripts

### 7. Performance Optimization Guide
- Frontend optimization checklist
- Backend optimization checklist
- Monitoring setup

---

## 🎯 Success Criteria

✅ Architecture supports 1000+ concurrent users  
✅ API response time < 500ms at normal load  
✅ Database handles 10k+ meals per day  
✅ Deployment can be automated via CI/CD  
✅ All 5 AI services work correctly  
✅ 10 languages render properly without UI breaks  
✅ Barcode scanner works in all modern browsers  
✅ User authentication is secure (JWT + bcrypt)  

---

## Assumptions

1. Users have stable internet connectivity
2. PostgreSQL 12+ is available in production
3. Google Cloud credentials optional (fallback translations provided)
4. Small team (1-4 engineers) maintaining system
5. Budget-conscious (prefer managed services)
6. India-based deployment preferred
7. Mobile-responsive web app sufficient (no native app)

---

## Questions for Architecture Design

1. How to scale to 10k+ concurrent users?
2. Where to implement caching (if needed)?
3. Should AI services be separate microservices or stay in main API?
4. What monitoring/logging stack should be added?
5. How to handle offline usage?
6. Should native mobile app be planned?
7. What's the backup/DR strategy?
8. How to handle real-time notifications?

