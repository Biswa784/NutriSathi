from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import os
import secrets
import csv
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path
import bcrypt

# Optional Google Translate import - used by /translate endpoint
try:
    from google.cloud import translate_v2 as translate
except Exception:
    translate = None

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current time in IST (without timezone info for SQLite compatibility)"""
    return datetime.now(IST).replace(tzinfo=None)

# Import database
from app.db.session import get_db, engine
from app.db.base import Base
from app.db import models

# Import the Thali Recommender
from app.services.thali_recommender import ThaliRecommender
from app.services.calorie_calculator import CalorieCalculator
from app.services.mood_recommender import MoodRecommender
from app.services.calorie_alert_service import CalorieAlertService
import traceback

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NutriSathi API", version="0.1.0")

# Global exception handler - TEMPORARILY DISABLED FOR DEBUGGING
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     print(f"GLOBAL EXCEPTION: {type(exc).__name__}: {exc}")
#     traceback.print_exc()
#     return JSONResponse(
#         status_code=500,
#         content={"detail": str(exc), "type": type(exc).__name__}
#     )

# CORS for local dev (frontend on Vite default: 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
mood_recommender = MoodRecommender(dishes_db)
# Note: CalorieAlertService will be initialized per-request with database session

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

class MoodRequest(BaseModel):
    mood: str  # 'happy', 'sad', 'tired', 'stressed', 'sick'
    calorie_range: Optional[List[int]] = None
    dietary_preference: Optional[str] = None
    allergies: Optional[str] = None
    num_recommendations: Optional[int] = 4

class MoodDishItem(BaseModel):
    name: str
    serving_size: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    mood_benefit: str
    cuisine: str

class MoodRecommendationResponse(BaseModel):
    mood: str
    mood_description: str
    key_nutrients: List[str]
    ayurvedic_type: str
    recommended_dishes: List[MoodDishItem]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    mood_insights: List[str]
    wellness_tip: str
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
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_session(db: Session, user_id: int) -> str:
    """Create a new session token"""
    token = secrets.token_urlsafe(32)
    expires_at = get_ist_now() + timedelta(days=7)
    
    db_session = models.Session(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(db_session)
    db.commit()
    
    return token

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """Get current user from token (optional)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # Find session in database
    session = db.query(models.Session).filter(
        models.Session.token == token
    ).first()
    
    if not session:
        return None
    
    # Check expiration
    if get_ist_now() > session.expires_at:
        db.delete(session)
        db.commit()
        return None
    
    # Get user - use eager loading to avoid lazy loading issues
    user = db.query(models.User).filter(
        models.User.id == session.user_id
    ).first()
    
    if not user:
        return None
    
    # IMPORTANT: Convert to dict immediately while session is active
    # to avoid detached instance errors
    user_dict = {
        "email": user.email,
        "name": user.name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "gender": user.gender,
        "age": user.age,
        "height": user.height,
        "weight": user.weight,
        "activity_level": user.activity_level,
        "dietary_preference": user.dietary_preference,
        "health_goal": user.health_goal,
        "allergies": user.allergies,
        "id": user.id
    }
    
    # Explicitly refresh to ensure all data is loaded
    db.refresh(user)
    
    return user_dict

@app.get("/health")
async def health_check():
    return {"status": "ok"}


class TranslateRequest(BaseModel):
    target: str
    texts: Dict[str, str]


@app.post("/translate")
async def translate_texts(req: TranslateRequest):
    """Translate a dict of keyed texts to the target language using Google Cloud Translate.

    Request body: { "target": "hi", "texts": { "home": "Home", "about": "About" } }
    Response: { "translations": { "home": "होम", "about": "के बारे में" } }
    """
    if translate is None:
        raise HTTPException(status_code=503, detail="google-cloud-translate library is not available on the server. Please install it and set GOOGLE_APPLICATION_CREDENTIALS.")

    # Validate
    target = req.target or "en"
    texts = req.texts or {}
    if not texts:
        return {"translations": {}}

    try:
        client = translate.Client()
        values = list(texts.values())
        # The client.translate can accept list and returns list of dicts
        translated = client.translate(values, target_language=target)

        # translated may be a list of dicts in the same order
        result = {}
        keys = list(texts.keys())
        for i, item in enumerate(translated):
            translated_text = item.get("translatedText") if isinstance(item, dict) else str(item)
            # Map back to original key
            result[keys[i]] = translated_text

        return {"translations": result}

    except Exception as e:
        # Provide helpful error message for missing credentials
        msg = str(e)
        if "Could not automatically determine credentials" in msg or "project" in msg.lower():
            raise HTTPException(status_code=502, detail="Translation failed: Google credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account JSON file.")
        raise HTTPException(status_code=500, detail=f"Translation failed: {msg}")

@app.get("/calories/daily-summary")
async def get_daily_calorie_summary(current_user: Optional[dict] = Depends(get_current_user)):
    """Get daily calorie summary with warnings and recommendations"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    summary = calorie_alert_service.get_daily_summary(current_user["email"])
    return summary

@app.get("/")
async def root():
    return {"name": "NutriSathi API", "version": "0.1.0"}

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with hashed password
    db_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        gender=user_data.gender,
        age=user_data.age,
        height=user_data.height,
        weight=user_data.weight,
        activity_level=user_data.activity_level,
        dietary_preference=user_data.dietary_preference,
        health_goal=user_data.health_goal,
        allergies=user_data.allergies
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create session
    token = create_session(db, db_user.id)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            name=db_user.name,
            email=db_user.email,
            created_at=db_user.created_at.isoformat(),
            gender=db_user.gender,
            age=db_user.age,
            height=db_user.height,
            weight=db_user.weight,
            activity_level=db_user.activity_level,
            dietary_preference=db_user.dietary_preference,
            health_goal=db_user.health_goal,
            allergies=db_user.allergies
        )
    )

@app.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login an existing user"""
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    token = create_session(db, user.id)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            name=user.name,
            email=user.email,
            created_at=user.created_at.isoformat(),
            gender=user.gender,
            age=user.age,
            height=user.height,
            weight=user.weight,
            activity_level=user.activity_level,
            dietary_preference=user.dietary_preference,
            health_goal=user.health_goal,
            allergies=user.allergies
        )
    )

@app.post("/auth/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout user"""
    if credentials:
        token = credentials.credentials
        session = db.query(models.Session).filter(
            models.Session.token == token
        ).first()
        if session:
            db.delete(session)
            db.commit()
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
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if not current_user:
        raise HTTPException(
            status_code=401, 
            detail="Session expired. Please log out and log back in."
        )
    
    user = db.query(models.User).filter(
        models.User.id == current_user['id']
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    if updates.name is not None:
        user.name = updates.name
    if updates.gender is not None:
        user.gender = updates.gender
    if updates.age is not None:
        user.age = updates.age
    if updates.height is not None:
        user.height = updates.height
    if updates.weight is not None:
        user.weight = updates.weight
    if updates.activity_level is not None:
        user.activity_level = updates.activity_level
    if updates.dietary_preference is not None:
        user.dietary_preference = updates.dietary_preference
    if updates.health_goal is not None:
        user.health_goal = updates.health_goal
    if updates.allergies is not None:
        user.allergies = updates.allergies
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat(),
        gender=user.gender,
        age=user.age,
        height=user.height,
        weight=user.weight,
        activity_level=user.activity_level,
        dietary_preference=user.dietary_preference,
        health_goal=user.health_goal,
        allergies=user.allergies
    )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: Optional[dict] = Depends(get_current_user)):
    """Get current user info"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserResponse(
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        gender=current_user.get("gender"),
        age=current_user.get("age"),
        height=current_user.get("height"),
        weight=current_user.get("weight"),
        activity_level=current_user.get("activity_level"),
        dietary_preference=current_user.get("dietary_preference"),
        health_goal=current_user.get("health_goal"),
        allergies=current_user.get("allergies")
    )

@app.get("/auth/profile", response_model=UserResponse)
async def get_user_profile(current_user: Optional[dict] = Depends(get_current_user)):
    """Get current user profile - same as /auth/me"""
    if not current_user:
        # Return a minimal response instead of throwing 401
        # This prevents the "Not authenticated" error from showing
        raise HTTPException(status_code=401, detail="Authentication required")
    
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

@app.post("/meals")
async def log_meal(
    meal: Meal,
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a new meal and check for calorie warnings"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to log meals")
    
    # Create meal in database
    db_meal = models.Meal(
        user_id=current_user["id"],
        name=meal.name,
        serving_size=meal.serving_size,
        unit=meal.unit,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fat=meal.fat,
        meal_type=meal.meal_type
    )
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    
    # Create response
    meal_response = MealResponse(
        id=db_meal.id,
        name=db_meal.name,
        serving_size=db_meal.serving_size,
        unit=db_meal.unit,
        calories=db_meal.calories,
        protein=db_meal.protein,
        carbs=db_meal.carbs,
        fat=db_meal.fat,
        timestamp=db_meal.timestamp.isoformat(),
        user_email=current_user["email"],
        meal_type=db_meal.meal_type
    )
    
    # Check for high calorie warning
    calorie_warning = None
    if meal.calories and meal.meal_type:
        # Get user's meals for calorie calculation
        user_meals = db.query(models.Meal).filter(
            models.Meal.user_id == current_user["id"]
        ).all()
        
        # Convert to list format for CalorieAlertService
        meals_list = [
            {
                "calories": m.calories,
                "meal_type": m.meal_type,
                "timestamp": m.timestamp.isoformat(),
                "user_email": current_user["email"]
            }
            for m in user_meals if m.calories
        ]
        
        # Get user data
        user = db.query(models.User).filter(
            models.User.id == current_user["id"]
        ).first()
        
        users_dict = {
            current_user["email"]: {
                "weight": user.weight,
                "height": user.height,
                "age": user.age,
                "gender": user.gender,
                "activity_level": user.activity_level,
                "health_goal": user.health_goal
            }
        } if user else {}
        
        # Create service instance with current data
        alert_service = CalorieAlertService(meals_list, users_dict)
        calorie_warning = alert_service.check_meal_calories(
            email=current_user["email"],
            meal_calories=meal.calories,
            meal_type=meal.meal_type
        )
    
    # Return meal with optional warning
    response = {
        "meal": meal_response.dict(),
        "calorie_warning": calorie_warning
    }
    
    return response

@app.delete("/meals/{meal_id}")
async def delete_meal(
    meal_id: int,
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a logged meal"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Find the meal
    meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id,
        models.Meal.user_id == current_user["id"]
    ).first()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    # Delete the meal
    db.delete(meal)
    db.commit()
    
    return {"message": "Meal deleted successfully", "id": meal_id}

@app.get("/meals", response_model=List[MealResponse])
async def get_meals(
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all meals for the current user"""
    if not current_user:
        return []
    
    meals = db.query(models.Meal).filter(
        models.Meal.user_id == current_user["id"]
    ).order_by(models.Meal.timestamp.desc()).all()
    
    return [
        MealResponse(
            id=meal.id,
            name=meal.name,
            serving_size=meal.serving_size,
            unit=meal.unit,
            calories=meal.calories,
            protein=meal.protein,
            carbs=meal.carbs,
            fat=meal.fat,
            timestamp=meal.timestamp.isoformat(),
            user_email=current_user["email"],
            meal_type=meal.meal_type
        )
        for meal in meals
    ]

@app.get("/dishes")
async def get_dishes():
    """Get available dishes for meal selection"""
    return dishes_db

@app.get("/foods/barcode/{barcode}")
async def get_food_by_barcode(barcode: str):
    """
    Look up food information by barcode using OpenFoodFacts API.
    Returns nutrition data including calories, protein, carbs, and fat.
    """
    print(f"🔍 Looking up barcode: {barcode}")
    
    try:
        # Query OpenFoodFacts API
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        print(f"📡 Fetching from OpenFoodFacts: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"📥 OpenFoodFacts response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ OpenFoodFacts returned status {response.status_code}")
            raise HTTPException(status_code=404, detail="Barcode not found in database")
        
        data = response.json()
        print(f"📦 OpenFoodFacts data status: {data.get('status')}")
        
        # Check if product exists
        if data.get("status") != 1:
            print(f"❌ Product not found in OpenFoodFacts database")
            raise HTTPException(status_code=404, detail="Product not found for this barcode")
        
        product = data.get("product", {})
        nutriments = product.get("nutriments", {})
        
        # Extract nutrition data (per 100g)
        food_data = {
            "name": product.get("product_name") or product.get("product_name_en") or "Unknown Product",
            "brand": product.get("brands", ""),
            "serving_size": product.get("serving_size", "100g"),
            "calories": nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal") or 0,
            "protein": nutriments.get("proteins_100g") or nutriments.get("proteins") or 0,
            "carbs": nutriments.get("carbohydrates_100g") or nutriments.get("carbohydrates") or 0,
            "fat": nutriments.get("fat_100g") or nutriments.get("fat") or 0,
            "barcode": barcode
        }
        
        print(f"✅ Successfully fetched food data: {food_data['name']}")
        return food_data
    
    except HTTPException:
        raise
    except requests.exceptions.Timeout:
        print(f"⏱️ Request timeout for barcode {barcode}")
        raise HTTPException(status_code=504, detail="Request timeout - please try again")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch food data: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/gamification/stats")
async def get_gamification_stats(
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user gamification statistics"""
    if not current_user:
        return {
            "level": 1,
            "currentXP": 0,
            "xpToNextLevel": 100,
            "currentStreak": 0,
            "longestStreak": 0,
            "totalMeals": 0,
            "achievements": []
        }
    
    # Get user meals from database
    user_meals = db.query(models.Meal).filter(
        models.Meal.user_id == current_user["id"]
    ).order_by(models.Meal.timestamp.desc()).all()
    
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
    meal_dates = list(set([meal.timestamp.date().isoformat() for meal in user_meals]))
    meal_dates.sort()
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    for i in range(len(meal_dates)):
        if i > 0:
            current_date = meal_dates[i]
            prev_date = meal_dates[i-1]
            
            # Check if consecutive days
            curr = datetime.fromisoformat(current_date)
            prev = datetime.fromisoformat(prev_date)
            
            if (curr - prev).days == 1:
                temp_streak += 1
            else:
                if temp_streak > longest_streak:
                    longest_streak = temp_streak
                temp_streak = 0
    
    # Check current streak
    if meal_dates:
        last_meal_date = datetime.fromisoformat(meal_dates[-1])
        today = get_ist_now().date()
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
    user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
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
            user_data = db.query(models.User).filter(models.User.email == user['email']).first()
            if user_data:
                dietary_pref = dietary_pref or user_data.dietary_preference
                health_goal = health_goal or user_data.health_goal
                allergies_str = request.allergies or user_data.allergies
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

@app.post("/ai/recommend-mood", response_model=MoodRecommendationResponse)
async def recommend_by_mood(
    request: MoodRequest,
    user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI-based mood-aware meal recommendation endpoint.
    
    Generates personalized meal suggestions based on emotional state using:
    - Nutritional science (mood-nutrient research)
    - Ayurvedic principles (Sattvic/Rajasic classifications)
    - Macro percentage scoring
    - Keyword-based classification
    
    Supported moods:
    - Happy: Light, energizing foods (complex carbs, B-vitamins)
    - Sad: Comfort foods with tryptophan, omega-3
    - Tired: Iron-rich, protein-packed energy boosters
    - Stressed: Calming foods with magnesium, B-vitamins
    - Sick: Light, digestible, immune-supporting foods
    
    Returns balanced recommendations with mood benefits and wellness tips.
    """
    try:
        print(f"DEBUG: Received mood request: {request}")
        print(f"DEBUG: Mood: {request.mood}")
        print(f"DEBUG: User: {user}")
        
        # Get user preferences if authenticated
        dietary_pref = request.dietary_preference
        allergies_list = None
        
        if user:
            user_data = db.query(models.User).filter(models.User.email == user['email']).first()
            if user_data:
                dietary_pref = dietary_pref or user_data.dietary_preference
                allergies_str = request.allergies or user_data.allergies
                if allergies_str:
                    allergies_list = [a.strip() for a in allergies_str.split(',')]
        
        # Parse allergies from string if provided
        if request.allergies and not allergies_list:
            allergies_list = [a.strip() for a in request.allergies.split(',')]
        
        print(f"DEBUG: Calling mood_recommender with mood={request.mood}")
        
        # Convert calorie_range from list to tuple if provided
        calorie_range = tuple(request.calorie_range) if request.calorie_range else (200, 800)
        
        # Generate mood-based recommendation
        recommendation = mood_recommender.recommend_by_mood(
            mood=request.mood,
            calorie_range=calorie_range,
            dietary_preference=dietary_pref,
            allergies=allergies_list,
            num_recommendations=request.num_recommendations or 4
        )
        
        print(f"DEBUG: Got recommendation with {len(recommendation['recommended_dishes'])} dishes")
        
        return recommendation
    
    except ValueError as e:
        print(f"DEBUG: ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"DEBUG: Exception: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Mood recommendation failed: {str(e)}")

@app.post("/ai/calculate-calories", response_model=CalorieCalculationResponse)
async def calculate_daily_calories(
    current_user: Optional[dict] = Depends(get_current_user),
    request: Optional[CalorieCalculationRequest] = None,
    db: Session = Depends(get_db)
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
        # If authenticated user, try to use profile data
        if current_user:
            user = db.query(models.User).filter(
                models.User.id == current_user['id']
            ).first()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found in database")
            
            # Check if user has required data
            missing_fields = []
            if not user.weight: missing_fields.append('weight')
            if not user.height: missing_fields.append('height')
            if not user.age: missing_fields.append('age')
            if not user.gender: missing_fields.append('gender')
            
            if missing_fields:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Profile incomplete. Missing: {', '.join(missing_fields)}. Please save your profile first."
                )
            
            weight = user.weight
            height = user.height
            age = user.age
            gender = user.gender
            activity_level = user.activity_level or 'moderately_active'
            health_goal = user.health_goal or 'maintain_weight'
        
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

