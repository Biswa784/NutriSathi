from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
import json
import os
import secrets
import csv
from datetime import datetime, timedelta
from pathlib import Path

# Import the Thali Recommender
from app.services.thali_recommender import ThaliRecommender
from app.services.calorie_calculator import CalorieCalculator

app = FastAPI(title="NutriSathi API", version="0.1.0")

# CORS for local dev (frontend on Vite default: 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage for demo (replace with database later)
meals_db = []
users_db: Dict[str, dict] = {}  # email -> user data
sessions_db: Dict[str, dict] = {}  # token -> session data

security = HTTPBearer(auto_error=False)

# Load dishes from CSV
def load_dishes_from_csv():
    """Load dishes from data/dishes.csv"""
    dishes = []
    csv_path = Path(__file__).parent.parent.parent / "data" / "dishes.csv"
    
    if csv_path.exists():
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('name'):  # Skip empty rows
                        dishes.append({
                            "name": row['name'],
                            "cuisine": row.get('cuisine', ''),
                            "serving_size": float(row.get('serving_g', 100)),
                            "unit": "g",
                            "calories": float(row.get('calories_kcal', 0)),
                            "protein": float(row.get('protein_g', 0)),
                            "carbs": float(row.get('carbs_g', 0)),
                            "fat": float(row.get('fat_g', 0))
                        })
        except Exception as e:
            print(f"Warning: Could not load dishes.csv: {e}")
    
    # Fallback to sample dishes if CSV is empty or failed
    if not dishes:
        dishes = [
            {"name": "Dal Tadka", "serving_size": 200, "unit": "g", "calories": 220, "protein": 12, "carbs": 26, "fat": 8},
            {"name": "Roti (Whole Wheat)", "serving_size": 50, "unit": "g", "calories": 120, "protein": 4, "carbs": 22, "fat": 2},
            {"name": "Chicken Curry", "serving_size": 200, "unit": "g", "calories": 320, "protein": 28, "carbs": 10, "fat": 18},
            {"name": "Masala Dosa", "serving_size": 180, "unit": "g", "calories": 280, "protein": 7, "carbs": 45, "fat": 8},
            {"name": "Idli", "serving_size": 70, "unit": "g", "calories": 60, "protein": 2, "carbs": 12, "fat": 0.5}
        ]
    
    return dishes

dishes_db = load_dishes_from_csv()

# Initialize AI services
thali_recommender = ThaliRecommender(dishes_db)
calorie_calculator = CalorieCalculator()

class Meal(BaseModel):
    name: str
    serving_size: float
    unit: str = "g"
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    meal_type: Optional[str] = None

class MealResponse(BaseModel):
    id: int
    name: str
    serving_size: float
    unit: str
    calories: Optional[float]
    protein: Optional[float]
    carbs: Optional[float]
    fat: Optional[float]
    timestamp: str
    user_email: Optional[str] = None
    meal_type: Optional[str] = None

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    dietary_preference: Optional[str] = None
    health_goal: Optional[str] = None
    allergies: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    name: str
    email: str
    created_at: str
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    dietary_preference: Optional[str] = None
    health_goal: Optional[str] = None
    allergies: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class ThaliRequest(BaseModel):
    meal_type: str  # 'breakfast', 'lunch', 'evening_snack', 'dinner'
    calorie_goal: int
    dietary_preference: Optional[str] = None
    health_goal: Optional[str] = None
    allergies: Optional[str] = None

class ThaliRecommendationItem(BaseModel):
    name: str
    serving_size: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    category: str
    note: str

class ThaliRecommendationResponse(BaseModel):
    meal_type: str
    calorie_goal: int
    recommended_items: List[ThaliRecommendationItem]
    total_calories: int
    total_protein: int
    total_carbs: int
    total_fat: int
    balance_score: int
    thali_note: str
    health_tip: str

class CalorieCalculationRequest(BaseModel):
    weight: float  # in kg
    height: float  # in cm
    age: int
    gender: str  # 'male' or 'female'
    activity_level: Optional[str] = 'moderately_active'
    health_goal: Optional[str] = 'maintain_weight'

class MealCalories(BaseModel):
    breakfast: int
    lunch: int
    evening_snack: int
    dinner: int

class MealSplitPercentages(BaseModel):
    breakfast: int
    lunch: int
    evening_snack: int
    dinner: int

class MacroNutrient(BaseModel):
    grams: int
    calories: int
    percentage: int

class MacroTargets(BaseModel):
    protein: MacroNutrient
    carbs: MacroNutrient
    fat: MacroNutrient

class CalorieInsights(BaseModel):
    tips: List[str]
    bmi: float
    water_intake_liters: float
    estimated_weekly_change_kg: float

class CalorieMetadata(BaseModel):
    formula_used: str
    activity_level: str
    health_goal: str
    calculated_at: str

class CalorieCalculationResponse(BaseModel):
    daily_calories: int
    bmr: int
    tdee: int
    adjustment: int
    meal_calories: MealCalories
    meal_split_percentages: MealSplitPercentages
    macros: MacroTargets
    insights: CalorieInsights
    metadata: CalorieMetadata

# Auth helper functions
def create_session(email: str) -> str:
    """Create a new session token"""
    token = secrets.token_urlsafe(32)
    sessions_db[token] = {
        "email": email,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    return token

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Get current user from token (optional)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    session = sessions_db.get(token)
    
    if not session:
        return None
    
    # Check expiration
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now() > expires_at:
        del sessions_db[token]
        return None
    
    email = session["email"]
    user = users_db.get(email)
    
    if not user:
        return None
    
    # Return dict with email for easy lookup
    return {"email": email, "data": user}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"name": "NutriSathi API", "version": "0.1.0"}

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    """Register a new user"""
    # Check if user already exists
    if user_data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = {
        "name": user_data.name,
        "email": user_data.email,
        "password": user_data.password,
        "created_at": datetime.now().isoformat(),
        "gender": user_data.gender,
        "age": user_data.age,
        "height": user_data.height,
        "weight": user_data.weight,
        "activity_level": user_data.activity_level,
        "dietary_preference": user_data.dietary_preference,
        "health_goal": user_data.health_goal,
        "allergies": user_data.allergies
    }
    users_db[user_data.email] = user
    
    # Create session
    token = create_session(user_data.email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
            gender=user.get("gender"),
            age=user.get("age"),
            height=user.get("height"),
            weight=user.get("weight"),
            activity_level=user.get("activity_level"),
            dietary_preference=user.get("dietary_preference"),
            health_goal=user.get("health_goal"),
            allergies=user.get("allergies")
        )
    )

@app.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login an existing user"""
    user = users_db.get(credentials.email)
    
    if not user or user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    token = create_session(credentials.email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
            gender=user.get("gender"),
            age=user.get("age"),
            height=user.get("height"),
            weight=user.get("weight"),
            activity_level=user.get("activity_level"),
            dietary_preference=user.get("dietary_preference"),
            health_goal=user.get("health_goal"),
            allergies=user.get("allergies")
        )
    )

@app.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    if credentials:
        token = credentials.credentials
        if token in sessions_db:
            del sessions_db[token]
    return {"message": "Logged out successfully"}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    dietary_preference: Optional[str] = None
    health_goal: Optional[str] = None
    allergies: Optional[str] = None

@app.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    updates: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_data = users_db.get(current_user['email'])
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    if updates.name is not None:
        user_data['name'] = updates.name
    if updates.gender is not None:
        user_data['gender'] = updates.gender
    if updates.age is not None:
        user_data['age'] = updates.age
    if updates.height is not None:
        user_data['height'] = updates.height
    if updates.weight is not None:
        user_data['weight'] = updates.weight
    if updates.activity_level is not None:
        user_data['activity_level'] = updates.activity_level
    if updates.dietary_preference is not None:
        user_data['dietary_preference'] = updates.dietary_preference
    if updates.health_goal is not None:
        user_data['health_goal'] = updates.health_goal
    if updates.allergies is not None:
        user_data['allergies'] = updates.allergies
    
    # Save back to users_db
    users_db[current_user['email']] = user_data
    
    return UserResponse(
        name=user_data["name"],
        email=user_data["email"],
        created_at=user_data["created_at"],
        gender=user_data.get("gender"),
        age=user_data.get("age"),
        height=user_data.get("height"),
        weight=user_data.get("weight"),
        activity_level=user_data.get("activity_level"),
        dietary_preference=user_data.get("dietary_preference"),
        health_goal=user_data.get("health_goal"),
        allergies=user_data.get("allergies")
    )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_data = current_user["data"]
    return UserResponse(
        name=user_data["name"],
        email=user_data["email"],
        created_at=user_data["created_at"],
        gender=user_data.get("gender"),
        age=user_data.get("age"),
        height=user_data.get("height"),
        weight=user_data.get("weight"),
        activity_level=user_data.get("activity_level"),
        dietary_preference=user_data.get("dietary_preference"),
        health_goal=user_data.get("health_goal"),
        allergies=user_data.get("allergies")
    )

@app.get("/meals", response_model=List[MealResponse])
async def get_meals(current_user: Optional[dict] = Depends(get_current_user)):
    """Get all logged meals (filtered by user if authenticated)"""
    if current_user:
        # Return only user's meals
        return [meal for meal in meals_db if meal.user_email == current_user["email"]]
    # For demo, return all meals if not authenticated
    return meals_db

@app.post("/meals", response_model=MealResponse)
async def log_meal(meal: Meal, current_user: Optional[dict] = Depends(get_current_user)):
    """Log a new meal"""
    meal_id = len(meals_db) + 1
    timestamp = datetime.now().isoformat()
    
    meal_response = MealResponse(
        id=meal_id,
        name=meal.name,
        serving_size=meal.serving_size,
        unit=meal.unit,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fat=meal.fat,
        timestamp=timestamp,
        user_email=current_user["email"] if current_user else None,
        meal_type=meal.meal_type
    )
    
    meals_db.append(meal_response)
    return meal_response

@app.delete("/meals/{meal_id}")
async def delete_meal(meal_id: int, current_user: Optional[dict] = Depends(get_current_user)):
    """Delete a logged meal"""
    # Find the meal
    meal_to_delete = None
    meal_index = None
    
    for idx, meal in enumerate(meals_db):
        if meal.id == meal_id:
            meal_to_delete = meal
            meal_index = idx
            break
    
    if not meal_to_delete:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    # Check if user owns this meal (if authenticated)
    if current_user and meal_to_delete.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this meal")
    
    # Remove the meal by index
    meals_db.pop(meal_index)
    
    return {"message": "Meal deleted successfully", "id": meal_id}

@app.get("/dishes")
async def get_dishes():
    """Get available dishes for meal selection"""
    return dishes_db

@app.get("/gamification/stats")
async def get_gamification_stats(current_user: Optional[dict] = Depends(get_current_user)):
    """Get user gamification statistics"""
    # Filter meals by user if authenticated
    user_meals = meals_db
    if current_user:
        user_meals = [meal for meal in meals_db if meal.user_email == current_user["email"]]
    
    if not user_meals:
        return {
            "level": 1,
            "currentXP": 0,
            "xpToNextLevel": 100,
            "totalXP": 0,
            "currentStreak": 0,
            "longestStreak": 0,
            "mealsLogged": 0,
            "daysActive": 0
        }
    
    # Calculate streaks
    meal_dates = list(set([meal.timestamp.split('T')[0] for meal in user_meals]))
    meal_dates.sort()
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    for i in range(len(meal_dates)):
        if i > 0:
            current_date = meal_dates[i]
            prev_date = meal_dates[i-1]
            
            # Check if consecutive days
            from datetime import datetime, timedelta
            curr = datetime.strptime(current_date, '%Y-%m-%d')
            prev = datetime.strptime(prev_date, '%Y-%m-%d')
            
            if (curr - prev).days == 1:
                temp_streak += 1
            else:
                if temp_streak > longest_streak:
                    longest_streak = temp_streak
                temp_streak = 0
    
    # Check current streak
    if meal_dates:
        last_meal_date = datetime.strptime(meal_dates[-1], '%Y-%m-%d')
        today = datetime.now().date()
        days_since_last = (today - last_meal_date.date()).days
        
        if days_since_last <= 1:
            current_streak = temp_streak + 1
    
    if temp_streak > longest_streak:
        longest_streak = temp_streak
    
    # Calculate XP
    base_xp = len(user_meals) * 10
    streak_bonus = (current_streak // 3) * 50
    total_xp = base_xp + streak_bonus
    
    level = (total_xp // 100) + 1
    current_xp = total_xp % 100
    xp_to_next = 100 - current_xp
    
    return {
        "level": level,
        "currentXP": current_xp,
        "xpToNextLevel": xp_to_next,
        "totalXP": total_xp,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "mealsLogged": len(user_meals),
        "daysActive": len(meal_dates)
    }

@app.post("/ai/recommend-thali", response_model=ThaliRecommendationResponse)
async def recommend_thali(
    request: ThaliRequest,
    user: Optional[dict] = Depends(get_current_user)
):
    """
    AI-based Indian Thali meal recommendation endpoint.
    
    Generates personalized meal suggestions based on:
    - Meal type (breakfast, lunch, snack, dinner)
    - Calorie goal
    - Dietary preferences
    - Health goals
    - Allergies
    
    Returns a balanced thali with multiple items that match the criteria.
    """
    try:
        # Get user preferences if authenticated
        dietary_pref = request.dietary_preference
        health_goal = request.health_goal
        allergies_list = None
        
        if user:
            user_data = users_db.get(user['email'], {})
            dietary_pref = dietary_pref or user_data.get('dietary_preference')
            health_goal = health_goal or user_data.get('health_goal')
            allergies_str = request.allergies or user_data.get('allergies')
            if allergies_str:
                allergies_list = [a.strip() for a in allergies_str.split(',')]
        
        # Generate recommendation using AI engine
        recommendation = thali_recommender.recommend_thali(
            meal_type=request.meal_type,
            calorie_goal=request.calorie_goal,
            dietary_preference=dietary_pref,
            health_goal=health_goal,
            allergies=allergies_list
        )
        
        return recommendation
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@app.get("/ai/thali-info")
async def get_thali_info():
    """Get information about the Thali recommendation system"""
    return {
        "name": "AI Thali Recommender",
        "version": "1.0",
        "description": "Intelligent Indian meal recommendation system based on traditional Thali concept",
        "features": [
            "Meal-specific recommendations (breakfast, lunch, snack, dinner)",
            "Calorie-based portion control",
            "Dietary preference filtering (vegetarian, vegan, non-veg)",
            "Health goal alignment (weight loss, muscle building, maintenance)",
            "Allergy awareness",
            "Balanced macronutrient distribution",
            "Traditional Indian thali composition"
        ],
        "meal_types": ["breakfast", "lunch", "evening_snack", "dinner"],
        "available_dishes": len(dishes_db),
        "balance_algorithm": "Rule-based AI with nutritional optimization"
    }

@app.post("/ai/calculate-calories", response_model=CalorieCalculationResponse)
async def calculate_daily_calories(
    current_user: Optional[dict] = Depends(get_current_user),
    request: Optional[CalorieCalculationRequest] = None
):
    """
    Calculate daily calorie needs and meal distribution using AI/ML algorithms.
    
    Uses the Mifflin-St Jeor equation (scientifically proven formula) to calculate:
    - BMR (Basal Metabolic Rate)
    - TDEE (Total Daily Energy Expenditure)
    - Daily calorie target based on health goals
    - Meal-by-meal calorie distribution
    - Macronutrient targets
    - Personalized insights
    
    If authenticated and no request body, uses user profile data.
    """
    try:
        # Debug logging
        print(f"DEBUG: current_user = {current_user}")
        print(f"DEBUG: request = {request}")
        
        # If authenticated user, try to use profile data
        if current_user:
            user_data = users_db.get(current_user['email'])
            print(f"DEBUG: user_data = {user_data}")
            
            if not user_data:
                raise HTTPException(status_code=404, detail="User not found in database")
            
            # Check if user has required data
            missing_fields = []
            if not user_data.get('weight'): missing_fields.append('weight')
            if not user_data.get('height'): missing_fields.append('height')
            if not user_data.get('age'): missing_fields.append('age')
            if not user_data.get('gender'): missing_fields.append('gender')
            
            if missing_fields:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Profile incomplete. Missing: {', '.join(missing_fields)}. Please save your profile first."
                )
            
            weight = user_data['weight']
            height = user_data['height']
            age = user_data['age']
            gender = user_data['gender']
            activity_level = user_data.get('activity_level', 'moderately_active')
            health_goal = user_data.get('health_goal', 'maintain_weight')
        
        elif request:
            # Use request data if not authenticated
            weight = request.weight
            height = request.height
            age = request.age
            gender = request.gender
            activity_level = request.activity_level or 'moderately_active'
            health_goal = request.health_goal or 'maintain_weight'
        
        else:
            raise HTTPException(
                status_code=400,
                detail="Either authenticate or provide calculation parameters in request body"
            )
        
        # Calculate using AI engine
        result = calorie_calculator.calculate_daily_calories(
            weight=weight,
            height=height,
            age=age,
            gender=gender,
            activity_level=activity_level,
            health_goal=health_goal
        )
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")

@app.get("/ai/calorie-info")
async def get_calorie_calculator_info():
    """Get information about the calorie calculation system"""
    return {
        "name": "AI Calorie Calculator",
        "version": "1.0",
        "description": "Scientific calorie calculator using Mifflin-St Jeor equation",
        "formula": "Mifflin-St Jeor (most accurate BMR formula used by nutritionists)",
        "features": [
            "BMR calculation (calories burned at rest)",
            "TDEE calculation (total daily energy expenditure)",
            "Activity level adjustments",
            "Health goal-based calorie targets",
            "Automatic meal distribution",
            "Macronutrient targets",
            "Personalized insights and recommendations",
            "BMI calculation",
            "Water intake recommendations",
            "Weight change predictions"
        ],
        "activity_levels": list(CalorieCalculator.ACTIVITY_MULTIPLIERS.keys()),
        "health_goals": list(CalorieCalculator.HEALTH_GOAL_ADJUSTMENTS.keys()),
        "meal_types": ["breakfast", "lunch", "evening_snack", "dinner"],
        "algorithm": "Rule-based scientific formulas with AI-driven personalization"
    }

