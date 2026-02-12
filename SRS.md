# Software Requirements Specification (SRS)
## NutriSathi - AI-Powered Nutrition Companion

**Version:** 1.0  
**Date:** December 8, 2025  
**Status:** In Development  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for **NutriSathi**, an AI-powered nutrition companion application designed to help users achieve their health goals through personalized meal plans, calorie tracking, and AI-driven nutritional recommendations.

### 1.2 Scope
NutriSathi is a web-based application with the following scope:
- **Frontend:** React + TypeScript (Vite) - Responsive UI for web browsers
- **Backend:** FastAPI (Python) - REST API for business logic
- **Database:** PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Target Users:** Health-conscious individuals seeking personalized nutrition guidance
- **Geographic Focus:** Indian market (10 languages supported)

### 1.3 Document Conventions
- **User** = End-user of the application
- **System** = NutriSathi application (frontend + backend)
- **API** = Application Programming Interface
- **UI** = User Interface

---

## 2. Overall Description

### 2.1 Product Perspective
NutriSathi is a standalone web application that operates independently. It interfaces with:
- Google Cloud Translate API (for multilingual support)
- External image services (Unsplash for food/health imagery)

### 2.2 Product Features Summary
1. **User Authentication** - Sign in/Sign up functionality
2. **Multilingual Interface** - 10 Indian languages supported
3. **BMI Calculator** - Calculate Body Mass Index and health insights
4. **AI Meal Planner** - AI-powered meal recommendations
5. **Calorie Tracking** - Track daily calorie intake
6. **Gamification** - Achievement/progress tracking
7. **Mood-based Recommendations** - AI suggests meals based on mood
8. **Thali Recommender** - Traditional Indian meal recommendations
9. **Responsive Design** - Mobile, tablet, and desktop support

### 2.3 User Classes and Characteristics

| User Class | Description | Key Needs |
|-----------|-------------|-----------|
| **Health-conscious Users** | People actively managing their diet and fitness | Personalized meal plans, easy tracking |
| **Fitness Enthusiasts** | Users focused on gym/workout goals | Calorie counting, macro tracking |
| **General Users** | People exploring nutrition habits | Simple tools, educational content |
| **Non-English Speakers** | Users preferring Indian languages | Multilingual interface |

### 2.4 Operating Environment
- **Frontend:** Chrome, Firefox, Safari, Edge (latest versions)
- **Backend:** Linux/Windows server with Python 3.11+
- **Database:** PostgreSQL 12+
- **Network:** Internet connectivity required

---

## 3. Functional Requirements

### 3.1 User Management (FR-1)

#### FR-1.1 User Registration
- **Description:** New users can create an account
- **Actors:** End User
- **Preconditions:** User not already registered
- **Steps:**
  1. User navigates to Sign Up page
  2. User enters email, password, confirm password
  3. System validates input (email format, password strength)
  4. System creates user account in database
  5. System sends confirmation email (optional)
- **Postconditions:** User account created, user can log in
- **Priority:** High

#### FR-1.2 User Login
- **Description:** Registered users can log in
- **Actors:** End User
- **Preconditions:** User account exists
- **Steps:**
  1. User enters email and password
  2. System verifies credentials
  3. System creates session/JWT token
  4. System redirects to dashboard
- **Postconditions:** User authenticated, session established
- **Priority:** High

#### FR-1.3 User Profile Management
- **Description:** Users can view and edit profile information
- **Actors:** End User
- **Preconditions:** User logged in
- **Functional Requirements:**
  - View personal information (email, age, gender, height, weight)
  - Edit profile details
  - Update password
  - Delete account
- **Priority:** Medium

---

### 3.2 Multilingual Support (FR-2)

#### FR-2.1 Language Selection
- **Description:** Users can select their preferred language
- **Actors:** End User
- **Supported Languages:**
  - English (en)
  - Hindi (hi)
  - Bengali (bn)
  - Tamil (ta)
  - Telugu (te)
  - Marathi (mr)
  - Gujarati (gu)
  - Urdu (ur)
  - Punjabi (pa)
  - Odia (od)
- **Implementation:** 
  - Frontend dropdown selector
  - Built-in fallback translations
  - Google Cloud Translate API integration
- **Priority:** High

#### FR-2.2 Dynamic Translation
- **Description:** System translates UI content to selected language
- **Actors:** System
- **Preconditions:** User selects language, Google credentials configured
- **Process:**
  1. Frontend sends selected language and text keys to backend
  2. Backend calls Google Cloud Translate API
  3. Backend returns translated content
  4. Frontend displays translations
  5. Fallback to built-in translations if API unavailable
- **Priority:** High

---

### 3.3 BMI Calculator (FR-3)

#### FR-3.1 BMI Calculation
- **Description:** Users can calculate their Body Mass Index
- **Actors:** End User
- **Preconditions:** User logged in
- **Input Requirements:**
  - Height (cm)
  - Weight (kg)
- **Calculation:** BMI = Weight(kg) / (Height(m))²
- **Output:**
  - BMI value
  - Health category (Underweight, Normal, Overweight, Obese)
  - Personalized health insights
- **Priority:** High

#### FR-3.2 BMI History
- **Description:** System stores and displays BMI history
- **Actors:** System, End User
- **Preconditions:** User has calculated BMI at least once
- **Requirements:**
  - Store calculation timestamp
  - Display trend chart
  - Allow deletion of old records
- **Priority:** Medium

---

### 3.4 AI Meal Planner (FR-4)

#### FR-4.1 Personalized Meal Recommendations
- **Description:** AI provides personalized meal suggestions
- **Actors:** AI System, End User
- **Preconditions:** User profile completed, user preferences set
- **Input:**
  - Dietary preferences (vegetarian, non-vegetarian, vegan)
  - Health goals (weight loss, muscle gain, maintenance)
  - Allergies/restrictions
  - Calorie target
- **Output:**
  - Daily meal plan (breakfast, lunch, dinner, snacks)
  - Nutritional information
  - Recipe suggestions
- **Priority:** High

#### FR-4.2 Mood-based Recommendations
- **Description:** System suggests meals based on user's mood
- **Actors:** AI System, End User
- **Preconditions:** User has set up mood tracking
- **Mood Options:**
  - Happy
  - Sad
  - Stressed
  - Energetic
  - Tired
- **Process:**
  1. User selects mood
  2. AI analyzes mood data
  3. System recommends mood-appropriate meals
- **Priority:** Medium

#### FR-4.3 Thali Recommender
- **Description:** System recommends traditional Indian meal combinations
- **Actors:** AI System, End User
- **Input:**
  - User location/region
  - Dietary preferences
  - Health goals
- **Output:**
  - Traditional thali combinations
  - Nutritional breakdown
  - Regional variants
- **Priority:** Medium

---

### 3.5 Calorie Tracking (FR-5)

#### FR-5.1 Add Meal Entry
- **Description:** Users can log meals and track calories
- **Actors:** End User
- **Preconditions:** User logged in
- **Input:**
  - Meal name
  - Food items
  - Quantity/portions
  - Timestamp
- **Process:**
  1. User enters meal details
  2. System calculates calories (using food database)
  3. System stores entry
  4. System updates daily calorie total
- **Priority:** High

#### FR-5.2 Calorie Alert
- **Description:** System alerts user when approaching daily target
- **Actors:** System, End User
- **Preconditions:** User has set daily calorie target
- **Thresholds:**
  - 75% of target: Warning
  - 90% of target: Strong warning
  - 100% of target: Exceeded notification
- **Priority:** Medium

#### FR-5.3 Daily Summary
- **Description:** System displays daily nutrition summary
- **Actors:** System
- **Display Information:**
  - Total calories consumed
  - Macronutrient breakdown (proteins, carbs, fats)
  - Progress towards daily goal
  - Charts/graphs
- **Priority:** High

---

### 3.6 Gamification (FR-6)

#### FR-6.1 Achievement Tracking
- **Description:** System tracks and displays user achievements
- **Actors:** System, End User
- **Achievements:**
  - First meal logged
  - 7-day streak
  - 30-day streak
  - Calorie goal met (daily)
  - BMI milestone reached
- **Preconditions:** User has completed qualifying action
- **Priority:** Low

#### FR-6.2 Progress Statistics
- **Description:** System displays user progress metrics
- **Actors:** System
- **Metrics:**
  - Days active
  - Total meals logged
  - Weight trend
  - Calorie consistency
- **Priority:** Low

---

### 3.7 Landing Page (FR-7)

#### FR-7.1 Landing Page Display
- **Description:** Professional landing page with product information
- **Actors:** Anonymous User, End User
- **Sections:**
  - Navigation bar with language selector
  - Hero section with CTA buttons
  - About section with product info
  - BMI calculator preview
  - AI meal planner preview
  - Footer
- **Features:**
  - Floating nutritional info cards with animations
  - Responsive design
  - Professional styling
- **Priority:** High

#### FR-7.2 Navigation
- **Description:** Easy navigation between sections
- **Actors:** End User
- **Navigation Items:**
  - Home
  - About
  - BMI Calculator
  - AI Planner
  - Sign In
  - Sign Up
- **Priority:** High

---

## 4. Non-Functional Requirements

### 4.1 Performance (NFR-1)
- **Page Load Time:** < 3 seconds on 4G network
- **API Response Time:** < 500ms for standard requests
- **Search Response:** < 1 second for meal search
- **Database Query:** < 100ms for indexed queries
- **Concurrent Users:** Support 1000+ concurrent users

### 4.2 Security (NFR-2)
- **Authentication:** JWT tokens with 24-hour expiration
- **Password:** Minimum 8 characters, hashed with bcrypt
- **HTTPS:** All communications encrypted with TLS 1.2+
- **Input Validation:** All user inputs validated and sanitized
- **SQL Injection:** Parameterized queries, ORM usage
- **CORS:** Configured for frontend domain only
- **Data Privacy:** GDPR compliance, user data encryption

### 4.3 Usability (NFR-3)
- **User Interface:** Intuitive and easy to navigate
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile Responsive:** Works on screens 320px and above
- **Language Support:** 10 languages with proper character support
- **Loading States:** Clear feedback during async operations

### 4.4 Reliability (NFR-4)
- **Uptime:** 99.5% availability
- **Error Handling:** Graceful error messages to users
- **Data Backup:** Daily automated backups
- **Fallback Mechanisms:** Built-in translation fallbacks
- **Database Redundancy:** Master-slave replication (future)

### 4.5 Scalability (NFR-5)
- **Horizontal Scaling:** Stateless backend for load balancing
- **Database Scaling:** Connection pooling, read replicas
- **Caching:** Redis for session and data caching
- **CDN:** Static assets served via CDN
- **Microservices:** Modular API design for future microservices

### 4.6 Maintainability (NFR-6)
- **Code Quality:** ESLint for TypeScript, black for Python
- **Documentation:** Comprehensive code comments
- **Testing:** Unit tests, integration tests, E2E tests
- **Version Control:** Git with meaningful commit messages
- **API Versioning:** Semantic versioning (v1, v2, etc.)

### 4.7 Compatibility (NFR-7)
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Operating Systems:** Windows, macOS, Linux
- **Python Version:** 3.11+
- **Node.js:** 16+
- **Database:** PostgreSQL 12+

---

## 5. Data Requirements

### 5.1 User Data
```
- User ID (UUID)
- Email (unique)
- Password (hashed)
- Full Name
- Age
- Gender
- Height (cm)
- Weight (kg)
- Dietary Preferences
- Health Goals
- Allergies/Restrictions
- Preferred Language
- Created At
- Updated At
```

### 5.2 Meal Data
```
- Meal ID (UUID)
- User ID (FK)
- Meal Name
- Food Items (JSON)
- Portions
- Calories
- Protein (g)
- Carbs (g)
- Fat (g)
- Timestamp
- Meal Type (breakfast, lunch, dinner, snack)
```

### 5.3 BMI Records
```
- BMI ID (UUID)
- User ID (FK)
- Height (cm)
- Weight (kg)
- BMI Value
- Category (Underweight, Normal, Overweight, Obese)
- Created At
```

### 5.4 Achievements
```
- Achievement ID (UUID)
- User ID (FK)
- Achievement Name
- Description
- Earned At
- Badge Icon
```

---

## 6. Interface Requirements

### 6.1 User Interface

#### Landing Page
- **Header:** Navigation bar with logo, menu links, language selector, Sign In/Sign Up buttons
- **Hero Section:** Large title, description, CTA buttons, circular food image, floating nutritional cards
- **About Section:** Product information, benefits, stats
- **BMI Section:** Calculator preview, features
- **AI Planner Section:** Benefits, call to action
- **Footer:** Copyright, links

#### Dashboard
- **Sidebar:** Navigation menu, user profile
- **Main Content:** Daily summary, meal log, charts
- **Widgets:** Calorie progress, macros, achievements

#### Meal Logger
- **Form:** Meal type, food items, quantity, timestamp
- **Autocomplete:** Food database suggestions
- **Nutrition Display:** Calculated macros

### 6.2 API Interface
- **REST Endpoints:** RESTful API design
- **Response Format:** JSON
- **Error Responses:** Consistent error structure with status codes
- **Authentication:** Bearer token in Authorization header

---

## 7. Constraints

### 7.1 Technical Constraints
- Frontend must work without internet for offline caching (future)
- Backend API rate limiting: 100 requests/minute per user
- Maximum meal image upload size: 5MB
- Maximum concurrent database connections: 50

### 7.2 Business Constraints
- Must comply with Indian food naming conventions
- Support Indian dietary practices (vegetarian, vegan, etc.)
- Pricing model: Freemium (future monetization)
- Data residency: India-based servers preferred

### 7.3 Legal Constraints
- GDPR compliance for EU users
- Indian data protection laws compliance
- Terms of Service and Privacy Policy required
- User consent for data collection

---

## 8. Acceptance Criteria

### 8.1 Frontend Acceptance Criteria
- [ ] Landing page loads in < 2 seconds
- [ ] All languages render correctly with proper characters
- [ ] Mobile responsive on 320px width
- [ ] All buttons and links functional
- [ ] Forms validate user input
- [ ] Animations smooth (60fps)

### 8.2 Backend Acceptance Criteria
- [ ] All API endpoints return correct status codes
- [ ] Authentication works with JWT tokens
- [ ] Database migrations run without errors
- [ ] API response time < 500ms
- [ ] Error handling provides useful messages

### 8.3 Integration Acceptance Criteria
- [ ] Frontend-Backend communication successful
- [ ] Database stores all user data correctly
- [ ] Translation API integration working
- [ ] Meal calculations accurate
- [ ] BMI calculations correct

---

## 9. Assumptions and Dependencies

### 9.1 Assumptions
- Users have internet connectivity
- Users have modern browsers
- Google Cloud credentials available (for translations)
- Users have accurate personal data (height, weight)
- No barcode scanning (for phase 2)

### 9.2 Dependencies
- Google Cloud Translate API availability
- PostgreSQL database availability
- Third-party food database (USDA or local equivalent)
- Email service provider (for notifications)

---

## 10. Future Enhancements

### Phase 2 Features
- Barcode scanning for food logging
- Wearable device integration (fitness trackers)
- Social features (friend challenges, community)
- Premium subscription features
- Admin dashboard for content management
- Push notifications
- Offline mode with sync

### Phase 3 Features
- AR meal visualization
- Voice-based meal logging
- Genetics-based recommendations
- Blockchain-based achievement verification
- Marketplace for nutritionists

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **BMI** | Body Mass Index - measure of body fat based on height and weight |
| **Calorie** | Unit of energy in food |
| **Macro** | Macronutrient (protein, carb, fat) |
| **Thali** | Traditional Indian plate/meal with multiple dishes |
| **JWT** | JSON Web Token for authentication |
| **CORS** | Cross-Origin Resource Sharing |
| **ORM** | Object-Relational Mapping |
| **API** | Application Programming Interface |
| **SRS** | Software Requirements Specification |

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Development Team | Initial SRS document |

---

**Document Approval:**
- Product Owner: _______________
- Lead Developer: _______________
- Project Manager: _______________
- Date: _______________
