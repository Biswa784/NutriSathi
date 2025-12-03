# NutriSathi - AI Dietary Coach + Gamified Nutrition Tracker

**One-Line Description:** An intelligent nutrition tracking application that helps users log meals, calculate personalized calorie needs, get AI-based Indian meal recommendations, and stay motivated through gamification.

---

## 📋 Project Description

NutriSathi is a comprehensive web-based nutrition management platform designed to help users achieve their health goals through smart calorie tracking, AI-powered meal recommendations, and gamified engagement. The application combines scientific calorie calculation (Mifflin-St Jeor equation) with culturally relevant Indian meal planning to provide personalized nutrition guidance.

The platform features an intuitive interface with real-time progress tracking, voice-enabled meal logging, and intelligent Indian Thali (traditional meal plate) recommendations. Users can track their daily nutrition, monitor meal-wise calorie consumption, and receive instant feedback on their dietary habits.

---

## 🎯 Problem Statement

**Challenge:** People struggle to understand nutrition in culturally relevant terms and lack personalized guidance for their dietary goals.

**Specific Issues Addressed:**
1. **Generic calorie advice** - Most apps don't account for individual metabolic rates, activity levels, and specific health goals
2. **Cultural disconnect** - Western-focused nutrition apps don't align with Indian eating patterns and traditional meals
3. **Complexity barrier** - Users find it difficult to calculate macros and understand portion sizes
4. **Low engagement** - Traditional calorie tracking apps are boring and demotivating
5. **Time-consuming logging** - Manual entry of every meal detail is tedious

**Solution:** NutriSathi provides AI-calculated personalized calorie targets with meal-wise distribution, culturally appropriate Indian meal recommendations, gamified tracking with XP and streaks, and voice-enabled quick meal logging.

---

## ✨ Key Features

### Core Functionality
- ✅ **User Authentication** - Secure signup/login with token-based sessions
- ✅ **Meal Logging** - Log meals with nutritional information (calories, protein, carbs, fat)
- ✅ **Nutrition Dashboard** - Visual cards showing daily calorie, protein, carbs, fat totals
- ✅ **Meal History** - View, track, and delete past meal entries
- ✅ **User Profile Management** - Store weight, height, age, gender, activity level, dietary preferences, health goals, allergies

### Smart Meal Logging
- ✅ **Quick-Pick from Database** - 500+ Indian dishes with pre-loaded nutrition data
- ✅ **Auto-Suggestions** - Type-ahead search filters dishes as you type
- ✅ **Portion Scaling** - Automatically adjusts macros based on serving size
- ✅ **Meal Type Selection** - Categorize meals as Breakfast, Lunch, Evening Snack, or Dinner
- ✅ **Voice Recognition** - Speak meal names for hands-free logging (Web Speech API)

### AI-Powered Features
- ✅ **AI Calorie Calculator** - Scientifically calculates personalized daily calorie needs
- ✅ **BMR Calculation** - Basal Metabolic Rate using Mifflin-St Jeor equation
- ✅ **TDEE Calculation** - Total Daily Energy Expenditure with activity multipliers
- ✅ **Goal-Based Adjustments** - Automatic calorie deficit/surplus for weight loss or muscle gain
- ✅ **Meal-Wise Distribution** - Splits daily calories into 4 meals (Breakfast 25%, Lunch 35%, Snack 10%, Dinner 30%)
- ✅ **Macro Targets** - Calculates protein, carbs, and fat in grams and calories
- ✅ **AI Thali Recommendations** - Suggests balanced Indian meal combinations based on calorie goals

### Progress Tracking
- ✅ **Real-Time Progress Bars** - Visual meal-wise calorie tracking with animated fills
- ✅ **Dynamic Color Coding** - Green (plenty left) → Yellow (on track) → Red (approaching/exceeded)
- ✅ **Consumed vs Target Display** - Shows calories consumed out of target for each meal
- ✅ **Overall Daily Progress** - Combined progress bar showing total daily consumption
- ✅ **Percentage Indicators** - Shows meal split percentages and consumption percentages
- ✅ **Smart Status Badges** - "PLENTY LEFT", "ON TRACK", "ALMOST THERE", "EXCEED"

### Gamification System
- ✅ **XP Points** - Earn experience points for logging meals
- ✅ **Level System** - Progress through levels based on XP accumulation
- ✅ **Daily Streaks** - Track consecutive days of meal logging
- ✅ **Achievement Tracking** - Milestone-based rewards and badges
- ✅ **Motivational Feedback** - Encouragement messages and progress insights

### Health Analytics
- ✅ **BMI Calculator** - Body Mass Index calculation and health category
- ✅ **Health Metrics** - BMI status, water intake recommendations, weight change predictions
- ✅ **Nutrition Analytics** - Protein-per-kg analysis for muscle building
- ✅ **Personalized Insights** - Context-aware tips based on user's health goals

---

## 🤖 AI/ML Features Implemented

### 1. **AI Calorie Calculator** (Rule-Based AI)
- **Algorithm:** Mifflin-St Jeor equation (scientifically validated formula)
- **Inputs:** Weight, height, age, gender, activity level, health goal
- **Outputs:** 
  - BMR (Basal Metabolic Rate)
  - TDEE (Total Daily Energy Expenditure)
  - Daily calorie target with goal-based adjustments
  - Meal-wise calorie distribution
  - Macronutrient targets (protein, carbs, fat)
  - BMI and health insights
- **Why Rule-Based:** 90%+ accuracy, instant results, explainable, zero API costs

### 2. **AI Thali Recommendation Engine** (Rule-Based AI)
- **Algorithm:** Multi-criteria decision system with nutritional balancing
- **Features:**
  - Analyzes 500+ Indian dishes from database
  - Matches dishes to calorie targets (±20% tolerance)
  - Considers meal type (breakfast/lunch/snack/dinner)
  - Respects dietary preferences (vegetarian/vegan/non-veg)
  - Filters by allergies
  - Applies traditional Thali composition rules
  - Prioritizes appropriate food categories per meal
  - Calculates balance score (protein, carbs, fat ratios)
  - Randomizes selections for variety
- **Outputs:** 2-4 balanced dish recommendations with nutritional breakdown

### 3. **Voice Recognition AI** (Browser API)
- **Technology:** Web Speech API (browser-native AI)
- **Features:**
  - Real-time speech-to-text conversion
  - Automatic dish name parsing
  - Hands-free meal logging
  - Works offline (device-level processing)

### 4. **Smart Search & Suggestions**
- **Algorithm:** Real-time fuzzy text matching
- **Features:**
  - Type-ahead filtering
  - Case-insensitive search
  - Partial name matching
  - Instant dish suggestions from database

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19.1.1 with TypeScript
- **Build Tool:** Vite 7.1.3
- **Styling:** 
  - Tailwind CSS 4.1.17 (PostCSS 8.5.6)
  - Custom CSS with animations
  - Gradient-based premium UI
- **Icons:** React Icons 5.5.0
- **State Management:** React Hooks (useState, useEffect, useMemo)
- **Browser APIs:** 
  - Web Speech API (voice recognition)
  - Local Storage (session persistence)

### Backend
- **Framework:** FastAPI 0.111.0
- **Server:** Uvicorn 0.30.1 with async support
- **Language:** Python 3.x
- **Validation:** Pydantic 2.8.2
- **Authentication:** JWT-like token-based sessions (HTTPBearer)

### Database
- **Current:** In-memory storage (dictionaries/lists)
- **Structure:**
  - `meals_db` - List of meal entries
  - `users_db` - Dictionary (email → user data)
  - `sessions_db` - Dictionary (token → session data)
  - `dishes_db` - List of 500+ Indian dishes loaded from CSV
- **Future:** PostgreSQL with SQLAlchemy ORM and Alembic migrations (setup ready)

### Data Storage
- **Dishes:** CSV file (`data/dishes.csv`) with 500+ Indian dishes
- **Format:** Name, Cuisine, Serving (g), Calories, Protein, Carbs, Fat

### AI/ML Services
- **CalorieCalculator** (`backend/app/services/calorie_calculator.py`)
  - Mifflin-St Jeor BMR formula
  - Activity multipliers (5 levels: sedentary to extra active)
  - Health goal adjustments (5 goals: aggressive loss to bulking)
  - Meal distribution logic
  - Macro calculation
- **ThaliRecommender** (`backend/app/services/thali_recommender.py`)
  - Rule-based recommendation engine
  - Category classification
  - Nutritional balancing algorithm
  - Dietary filter system

### Development Tools
- **Package Manager:** npm (frontend), pip (backend)
- **Type Safety:** TypeScript (frontend), Pydantic (backend)
- **API Documentation:** Auto-generated by FastAPI
- **Hot Reload:** Vite HMR (frontend), Uvicorn --reload (backend)

---

## 🏗️ Architecture & Workflow

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  React Frontend │ ◄─────► │  FastAPI Backend│
│   (Port 5173)   │  HTTP   │   (Port 8000)   │
│                 │  REST   │                 │
└─────────────────┘         └────────┬────────┘
        │                            │
        │ Local                      │ CSV Load
        │ Storage                    │
        ▼                            ▼
┌─────────────────┐         ┌─────────────────┐
│  Session Tokens │         │  dishes.csv     │
│  User State     │         │  500+ dishes    │
└─────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  AI Services    │
                            │  - Calorie Calc │
                            │  - Thali Engine │
                            └─────────────────┘
```

### User Flow

1. **Authentication Flow:**
   - User signs up with email/password
   - Backend generates secure token
   - Token stored in browser (localStorage + state)
   - Token sent in Authorization header for protected routes

2. **Profile Setup Flow:**
   - User fills profile: weight, height, age, gender
   - Selects activity level (5 options)
   - Chooses health goal (5 options)
   - Sets dietary preference & allergies
   - Backend validates and stores

3. **Calorie Calculation Flow:**
   - Auto-triggered when profile is complete
   - Backend CalorieCalculator runs Mifflin-St Jeor
   - Calculates BMR → applies activity multiplier → TDEE
   - Applies health goal adjustment
   - Distributes calories across 4 meals
   - Calculates macros (protein 25%, carbs 50%, fat 25%)
   - Returns comprehensive calorie plan

4. **Meal Logging Flow:**
   - User clicks "Log Meal" or "Voice Log"
   - Types dish name → auto-suggestions appear
   - Selects dish → nutrition auto-fills
   - Adjusts serving size → macros scale proportionally
   - Selects meal type (Breakfast/Lunch/Snack/Dinner)
   - Submits → saved to backend
   - Frontend updates immediately (optimistic UI)
   - Progress bars recalculate automatically

5. **Progress Tracking Flow:**
   - On page load/meal update: filter today's meals
   - Group by meal type, sum calories
   - Calculate percentage: (consumed / target) * 100
   - Update progress bar width with smooth animation
   - Apply color coding based on thresholds
   - Show status badges

6. **Thali Recommendation Flow:**
   - User selects meal type (4 options)
   - Sets calorie goal with slider (200-1000 kcal)
   - Backend ThaliRecommender analyzes:
     - Filters by dietary preference
     - Excludes allergens
     - Searches for dishes matching calorie target (±20%)
     - Prioritizes appropriate categories
     - Balances macros (protein 20-30%, carbs 45-55%, fat 20-30%)
     - Randomizes for variety
   - Returns 2-4 balanced items
   - User can one-click log any item

---

## 🧮 How Calorie Calculation Works

### Step-by-Step Process

**1. Calculate BMR (Basal Metabolic Rate)**
- Formula (Mifflin-St Jeor):
  - **Men:** BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
  - **Women:** BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
- This is calories burned at rest (sleeping/sitting all day)

**2. Calculate TDEE (Total Daily Energy Expenditure)**
- Formula: TDEE = BMR × Activity Multiplier
- Activity Multipliers:
  - Sedentary (little/no exercise): 1.2
  - Lightly Active (1-3 days/week): 1.375
  - Moderately Active (3-5 days/week): 1.55
  - Very Active (6-7 days/week): 1.725
  - Extra Active (athlete + physical job): 1.9

**3. Apply Health Goal Adjustment**
- Weight Loss: -500 kcal (targets ~0.5 kg/week loss)
- Aggressive Weight Loss: -750 kcal (~0.75 kg/week)
- Maintain Weight: 0 kcal (no change)
- Muscle Gain: +300 kcal (lean muscle growth)
- Bulking: +500 kcal (faster muscle gain)
- **Formula:** Daily Target = TDEE + Goal Adjustment

**4. Distribute Across Meals**

Default Split (Maintain Weight):
- Breakfast: 25% (fuel for morning)
- Lunch: 35% (largest meal for energy)
- Evening Snack: 10% (light refreshment)
- Dinner: 30% (moderate evening meal)

Weight Loss Split (front-loaded):
- Breakfast: 30% (bigger breakfast)
- Lunch: 35% (moderate lunch)
- Evening Snack: 5% (minimal snack)
- Dinner: 30% (moderate dinner)

Muscle Gain Split (pre-workout focus):
- Breakfast: 25%
- Lunch: 30%
- Evening Snack: 15% (pre-workout fuel)
- Dinner: 30%

**5. Calculate Macros**
- Protein: 25% of calories → grams = (calories × 0.25) / 4
- Carbs: 50% of calories → grams = (calories × 0.50) / 4
- Fat: 25% of calories → grams = (calories × 0.25) / 9
- (Note: Protein & Carbs = 4 cal/g, Fat = 9 cal/g)

### Example Calculation

**User Profile:**
- Weight: 70 kg
- Height: 170 cm
- Age: 25
- Gender: Male
- Activity: Moderately Active
- Goal: Weight Loss

**Calculation:**
1. BMR = (10×70) + (6.25×170) - (5×25) + 5 = 1,667 kcal
2. TDEE = 1,667 × 1.55 = 2,584 kcal
3. Daily Target = 2,584 - 500 = 2,084 kcal
4. Meal Distribution:
   - Breakfast: 625 kcal (30%)
   - Lunch: 729 kcal (35%)
   - Snack: 104 kcal (5%)
   - Dinner: 625 kcal (30%)
5. Macros:
   - Protein: 130g (520 kcal, 25%)
   - Carbs: 260g (1,042 kcal, 50%)
   - Fat: 58g (522 kcal, 25%)

---

## 🍛 How Thali Recommendations Work

### Recommendation Algorithm

**1. Input Processing**
- Receive: meal_type, calorie_goal, dietary_preference, health_goal, allergies
- Normalize meal type (handle spaces/hyphens)
- Parse allergies list

**2. Dish Filtering**
- Filter by dietary preference:
  - Vegetarian → exclude meat/fish/egg dishes
  - Vegan → exclude dairy/meat/fish/egg
  - Non-veg → include all
- Exclude dishes with allergen keywords
- Result: Safe candidate pool

**3. Calorie Matching**
- Set tolerance: ±20% of target
- For each dish: check if calories within tolerance
- Example: 500 kcal target → accept 400-600 kcal dishes
- Score dishes by closeness to target

**4. Category Prioritization**

Traditional Thali Composition Rules:
- **Breakfast:** 45% main carb, 25% protein, 15% fat, 10% beverage, 5% fruit
- **Lunch:** 30% grain, 25% dal/protein, 20% vegetable, 15% side protein, 10% accompaniment
- **Snack:** 70% main item, 20% beverage, 10% light bite
- **Dinner:** 25% grain, 30% protein curry, 25% vegetables, 15% soup/light, 5% accompaniment

**5. Intelligent Selection**
- Group dishes by category (grains, proteins, vegetables, etc.)
- Pick from preferred categories per meal type
- Randomize within category for variety
- Avoid duplicate selections
- Aim for 2-4 complementary items

**6. Portion Scaling**
- Calculate required portions to meet calorie target
- Scale servings proportionally
- Ensure realistic portion sizes

**7. Balance Scoring**
- Calculate macro ratios:
  - Protein: 20-30% = ideal
  - Carbs: 45-55% = ideal
  - Fat: 20-30% = ideal
- Score based on closeness to ideal ratios
- Return score 0-100

**8. Output Generation**
- Compile recommended items with:
  - Name, category, serving size
  - Calories, protein, carbs, fat per item
  - Contextual note (role in thali)
- Calculate totals
- Generate health tip based on health goal
- Return complete recommendation

### Example Recommendation

**Input:**
- Meal Type: Lunch
- Calorie Goal: 700 kcal
- Dietary: Vegetarian
- Health Goal: Muscle Gain

**Output:**
```
Recommended Thali:
1. Chapati (2 pieces) - 240 kcal (Grain - Main carb source)
2. Moong Dal Tadka - 180 kcal (Protein - Muscle building lentils)
3. Paneer Bhurji - 200 kcal (Protein - High protein main)
4. Mixed Veg Curry - 80 kcal (Vegetables - Vitamins and fiber)

Total: 700 kcal | Protein: 35g | Carbs: 85g | Fat: 20g
Balance Score: 92/100 (Excellent protein balance)
Health Tip: Great protein distribution for muscle recovery!
```

---

## 🎨 UI Overview

### Design System

**Color Palette:**
- Primary Purple: #667eea → #764ba2 (gradients)
- Success Green: #10b981
- Warning Yellow: #f59e0b
- Danger Red: #ef4444
- Neutral Grays: #f9fafb → #111827

**Component Library:**

1. **Dashboard Cards**
   - Gradient backgrounds
   - Box shadows for depth
   - Icon + metric + label structure
   - Responsive grid layout

2. **Progress Bars (Premium Design)**
   - Height: 24px (meal bars), 28px (overall)
   - Animated shimmer effects (3s infinite)
   - Smooth width transitions (0.6s cubic-bezier)
   - Multi-layer visual effects (gradient + shine + top highlight)
   - Color-coded by consumption level
   - Rounded corners (12-14px)

3. **Modal Dialogs**
   - Centered overlay with backdrop blur
   - Close button (X) top-right
   - Max-width constraints for readability
   - Smooth fade-in animations

4. **Form Controls**
   - Consistent padding (10-16px)
   - Focus states with purple ring
   - Error states in red
   - Labels with descriptive text

5. **Buttons**
   - Primary: Purple gradient
   - Success: Green
   - Danger: Red
   - Hover states with darker shade
   - Disabled states with opacity

### Key Screens

**1. Dashboard (Home)**
- Quick stats cards: Calories, Protein, Meals Logged, Progress
- "Log Meal" and "Voice Log" buttons
- Recent meals list (last 6)
- AI Calorie Plan card (if profile complete)
- Meal-wise progress bars (4 bars + overall)

**2. Meal Logger (Modal)**
- Dish name input with auto-suggestions
- Serving size adjuster
- Unit selector (g/ml/pieces)
- Auto-calculated nutrition display
- Meal type selector (4 options)
- Voice input button
- Submit button with loading state

**3. Profile/Settings**
- Personal info: Name, Email
- Body metrics: Weight, Height, Age, Gender
- Activity level dropdown (5 levels)
- Health goal dropdown (5 goals)
- Dietary preference dropdown
- Allergies text field
- Save button

**4. Recommendations**
- Meal type selector (4 buttons with emojis)
- Calorie goal slider (200-1000 kcal)
- Quick preset buttons (Light 300, Moderate 500, Heavy 700)
- "Get AI Recommendation" button
- Results display:
  - Summary card with balance score
  - Macro cards (4 cards)
  - Health tip box
  - Item cards with "Log This" buttons

**5. Meal History**
- Chronological list of all meals
- Date/time stamps
- Nutrition details per meal
- Delete buttons
- Pagination (if many meals)

**6. Analytics**
- Nutrition trend charts
- BMI display with health category
- Daily averages
- Goal progress tracking

**7. Gamification**
- Current level and XP
- Progress to next level
- Daily streak counter
- Achievement badges
- Leaderboard (future)

### Animations & Interactions

- **Shimmer Effect:** Moving shine across progress bars and cards
- **Width Transitions:** Smooth progress bar fills (0.6s)
- **Color Transitions:** Gradual color shifts based on progress (0.3s)
- **Hover States:** Cards lift slightly on hover
- **Loading States:** Spinner icons during API calls
- **Success Feedback:** Green checkmarks for completed actions
- **Error Feedback:** Red messages for failures

---

## 🚀 Future Upgrades Planned

### Immediate Enhancements
1. **Database Migration:** Move from in-memory to PostgreSQL
2. **Meal Photo Upload:** Computer vision for automatic dish recognition
3. **Barcode Scanner:** Scan packaged foods for instant nutrition
4. **Recipe Integration:** Add recipes with step-by-step instructions
5. **Shopping List:** Generate grocery lists from meal plans

### AI/ML Improvements
6. **ML-Based Recommendations:** Train model on user preferences and success patterns
7. **Portion Size Detection:** Image-based portion estimation
8. **Smart Meal Timing:** Suggest optimal meal timing based on activity patterns
9. **Predictive Analytics:** Forecast weight trends and suggest adjustments

### Social & Engagement
10. **Social Features:** Share progress, challenge friends
11. **Community Recipes:** User-contributed dishes and reviews
12. **Nutritionist Chat:** Connect with certified nutritionists
13. **Meal Plans:** Pre-made weekly meal plans for specific goals

### Platform Expansion
14. **Mobile Apps:** Native Android (Kotlin/Java) and iOS (Swift) apps
15. **Wearable Integration:** Sync with fitness trackers (Fitbit, Apple Watch)
16. **Smart Home:** Integrate with smart kitchen scales
17. **Offline Mode:** Full functionality without internet

### Advanced Features
18. **Macro Cycling:** Advanced periodization for athletes
19. **Intermittent Fasting:** Track fasting windows and eating periods
20. **Supplement Tracking:** Log vitamins, protein powder, etc.
21. **Water Intake Tracker:** Hydration monitoring with reminders
22. **Sleep & Recovery:** Correlate nutrition with sleep quality

### Business Features
23. **Premium Subscription:** Advanced analytics, unlimited meal plans
24. **Corporate Wellness:** B2B platform for companies
25. **White-Label:** Customizable for gyms and health clinics
26. **API Access:** For third-party integrations

---

## 📦 Setup Instructions

### Prerequisites
- **Node.js** 16+ and npm
- **Python** 3.8+ and pip
- **Git** (for cloning)

### Backend Setup

```powershell
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

```powershell
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Environment Variables

**Backend (.env file):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/nutrisathi  # Optional
SECRET_KEY=your-secret-key-here  # For JWT if implementing
```

**Frontend (.env file):**
```
VITE_API_URL=http://localhost:8000
```

### Database Setup (Future)

```powershell
# Install PostgreSQL
# Create database: nutrisathi

# Run migrations (when database is connected)
alembic upgrade head
```

### Data Files

- Place `dishes.csv` in `data/` folder
- Format: `name, cuisine, serving_g, calories_kcal, protein_g, carbs_g, fat_g`
- Currently includes 500+ Indian dishes

---

## 📊 Project Statistics

- **Total Lines of Code:** ~5,000+ (excluding dependencies)
- **Backend Files:** 3 main files + 2 AI services
- **Frontend Components:** 1 main App component + 7 sub-components
- **API Endpoints:** 15+ routes
- **Database Dishes:** 500+ Indian dishes
- **Supported Meal Types:** 4 (Breakfast, Lunch, Snack, Dinner)
- **Activity Levels:** 5 options
- **Health Goals:** 5 options
- **Dietary Preferences:** 3+ options

---

## 🎓 Learning Resources & Credits

**Scientific Formulas:**
- Mifflin-St Jeor equation (1990) - BMR calculation
- Harris-Benedict equation (reference comparison)
- WHO/FAO activity multipliers

**Nutrition Guidelines:**
- ICMR (Indian Council of Medical Research) dietary guidelines
- USDA nutritional database
- Traditional Indian Thali composition

**Technologies:**
- FastAPI documentation
- React documentation
- TypeScript handbook
- Web Speech API MDN docs

---

## 📝 Notes for Android Development

### Key Considerations for Mobile Port

1. **Backend Compatibility:**
   - RESTful API is platform-agnostic
   - Same endpoints work for Android
   - Consider adding FCM (Firebase Cloud Messaging) for notifications

2. **Storage:**
   - Replace localStorage with SharedPreferences or Room Database
   - Implement offline-first architecture with SQLite
   - Sync data when online

3. **Voice Recognition:**
   - Use Android's SpeechRecognizer API
   - Request RECORD_AUDIO permission
   - Handle offline voice recognition

4. **Camera Integration:**
   - Implement meal photo capture
   - Use ML Kit or TensorFlow Lite for image recognition
   - Offline model for nutrition estimation

5. **UI Framework Options:**
   - **Kotlin + Jetpack Compose** (modern, recommended)
   - **Java + XML layouts** (traditional)
   - **Flutter** (cross-platform Dart)
   - **React Native** (reuse React components)

6. **Authentication:**
   - Store JWT tokens securely in EncryptedSharedPreferences
   - Implement biometric authentication (fingerprint/face)
   - Handle token refresh

7. **Background Tasks:**
   - Use WorkManager for periodic sync
   - Notifications for meal reminders
   - Widget for quick meal logging

8. **Permissions Required:**
   - INTERNET (API calls)
   - CAMERA (meal photos)
   - RECORD_AUDIO (voice input)
   - WRITE_EXTERNAL_STORAGE (save photos)

9. **Recommended Libraries:**
   - **Retrofit** - API calls
   - **Room** - Local database
   - **Glide/Coil** - Image loading
   - **Gson/Moshi** - JSON parsing
   - **Hilt/Koin** - Dependency injection
   - **Jetpack Compose** - UI
   - **Coroutines/Flow** - Async operations

10. **API Modifications Needed:**
    - Add pagination for meal history
    - Implement efficient data sync
    - Add image upload endpoint
    - Support offline mode with conflict resolution

---

## ❓ Additional Information Needed

To make this documentation even more complete, please provide:

1. **Business Context:**
   - Is this a student project, startup MVP, or hackathon entry?
   - Target audience demographics (age, region, tech-savviness)?
   - Any specific health goals focus (athletes, elderly, pregnant women)?

2. **Scope & Timeline:**
   - Current development phase (prototype, beta, production)?
   - Planned launch timeline for Android app?
   - Priority features for mobile version?

3. **Data & Privacy:**
   - Any specific data privacy regulations to comply with (GDPR, HIPAA)?
   - Data retention policies?
   - User data export/delete functionality needed?

4. **Integration Plans:**
   - Need to integrate with any specific health platforms (Google Fit, Apple Health)?
   - Payment gateway requirements for premium features?
   - Third-party analytics (Google Analytics, Mixpanel)?

5. **Branding & Design:**
   - Official logo/brand guidelines?
   - Specific color palette requirements?
   - Accessibility standards to follow?

6. **Technical Constraints:**
   - Minimum Android API level target?
   - Support for tablets and foldables?
   - Offline-first priority or online-preferred?

7. **Existing Assets:**
   - Do you have more dishes in the database or need to source them?
   - Any existing user base or starting fresh?
   - Marketing materials or app store assets prepared?

---

## 🎯 Quick Start Checklist

For developers starting on Android version:

- [ ] Clone this repository
- [ ] Review backend API documentation (available at `/docs` endpoint)
- [ ] Study `CalorieCalculator.py` and `ThaliRecommender.py` logic
- [ ] Understand data models (User, Meal, Dish schemas)
- [ ] Plan offline database schema
- [ ] Design Android UI screens matching web version
- [ ] Implement authentication flow
- [ ] Add meal logging screen
- [ ] Integrate calorie calculator
- [ ] Build progress tracking UI
- [ ] Add voice recognition
- [ ] Implement Thali recommendations
- [ ] Set up background sync
- [ ] Add notifications
- [ ] Test on multiple devices
- [ ] Prepare for Play Store submission

---

**Project Status:** ✅ Web Version Fully Functional | 🚧 Mobile Version In Planning

**License:** [Add your license here]

**Contact:** [Add your contact info]

**Contributors:** [Add contributor names]

---

*This documentation was generated on December 3, 2025. For the most up-to-date information, please refer to the source code and inline comments.*
