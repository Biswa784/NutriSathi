"""
AI-Driven Daily Calorie Calculator for NutriSathi
Uses Mifflin-St Jeor equation (scientifically proven formula used by nutritionists)
"""
from typing import Dict, Optional
from datetime import datetime


class CalorieCalculator:
    """
    Calculate daily calorie needs using the Mifflin-St Jeor equation and activity multipliers.
    This is the most accurate formula used by professional nutritionists.
    """
    
    # Activity level multipliers (based on scientific research)
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,          # Little or no exercise
        'lightly_active': 1.375,   # Light exercise 1-3 days/week
        'moderately_active': 1.55, # Moderate exercise 3-5 days/week
        'very_active': 1.725,      # Hard exercise 6-7 days/week
        'extra_active': 1.9        # Very hard exercise & physical job
    }
    
    # Health goal adjustments (calorie deficit/surplus)
    HEALTH_GOAL_ADJUSTMENTS = {
        'weight_loss': -500,           # 500 cal deficit for ~0.5kg/week loss
        'aggressive_weight_loss': -750, # 750 cal deficit for ~0.75kg/week loss
        'maintain_weight': 0,          # No adjustment
        'muscle_gain': +300,           # 300 cal surplus for lean muscle gain
        'bulking': +500                # 500 cal surplus for faster muscle gain
    }
    
    # Default meal distribution percentages (based on nutritionist recommendations)
    DEFAULT_MEAL_SPLIT = {
        'breakfast': 0.25,      # 25%
        'lunch': 0.35,          # 35%
        'evening_snack': 0.10,  # 10%
        'dinner': 0.30          # 30%
    }
    
    # Alternative meal splits based on health goals
    GOAL_BASED_MEAL_SPLITS = {
        'weight_loss': {
            'breakfast': 0.30,      # Bigger breakfast
            'lunch': 0.35,          # Moderate lunch
            'evening_snack': 0.05,  # Smaller snack
            'dinner': 0.30          # Moderate dinner
        },
        'muscle_gain': {
            'breakfast': 0.25,
            'lunch': 0.30,
            'evening_snack': 0.15,  # Pre-workout snack
            'dinner': 0.30
        },
        'maintain_weight': {
            'breakfast': 0.25,
            'lunch': 0.35,
            'evening_snack': 0.10,
            'dinner': 0.30
        }
    }
    
    def __init__(self):
        """Initialize the calorie calculator"""
        pass
    
    def calculate_bmr(self, weight: float, height: float, age: int, gender: str) -> float:
        """
        Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation.
        
        BMR is the number of calories your body burns at rest.
        
        Formula:
        - Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
        - Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
        
        Args:
            weight: Weight in kilograms
            height: Height in centimeters
            age: Age in years
            gender: 'male' or 'female'
        
        Returns:
            BMR in calories/day
        """
        if not all([weight, height, age, gender]):
            raise ValueError("Missing required parameters for BMR calculation")
        
        # Mifflin-St Jeor equation
        bmr = (10 * weight) + (6.25 * height) - (5 * age)
        
        if gender.lower() in ['male', 'm', 'man']:
            bmr += 5
        elif gender.lower() in ['female', 'f', 'woman']:
            bmr -= 161
        else:
            # Default to average if gender not specified
            bmr -= 78  # Average of male (+5) and female (-161)
        
        return round(bmr, 1)
    
    def calculate_tdee(
        self, 
        weight: float, 
        height: float, 
        age: int, 
        gender: str,
        activity_level: str = 'moderately_active'
    ) -> float:
        """
        Calculate Total Daily Energy Expenditure (TDEE).
        
        TDEE = BMR × Activity Multiplier
        This is the total calories you burn in a day including activity.
        
        Args:
            weight: Weight in kg
            height: Height in cm
            age: Age in years
            gender: 'male' or 'female'
            activity_level: Activity level key
        
        Returns:
            TDEE in calories/day
        """
        bmr = self.calculate_bmr(weight, height, age, gender)
        
        # Get activity multiplier
        multiplier = self.ACTIVITY_MULTIPLIERS.get(
            activity_level.lower(), 
            1.55  # Default to moderately active
        )
        
        tdee = bmr * multiplier
        return round(tdee, 1)
    
    def calculate_daily_calories(
        self,
        weight: float,
        height: float,
        age: int,
        gender: str,
        activity_level: str = 'moderately_active',
        health_goal: str = 'maintain_weight'
    ) -> Dict:
        """
        Calculate recommended daily calorie intake based on user profile and goals.
        
        This is the main "AI" function that considers all factors.
        
        Args:
            weight: Weight in kg
            height: Height in cm
            age: Age in years
            gender: 'male' or 'female'
            activity_level: Activity level
            health_goal: Health goal
        
        Returns:
            Dictionary with calorie recommendations and breakdown
        """
        # Calculate TDEE (maintenance calories)
        tdee = self.calculate_tdee(weight, height, age, gender, activity_level)
        bmr = self.calculate_bmr(weight, height, age, gender)
        
        # Adjust for health goal
        goal_key = health_goal.lower() if health_goal else 'maintain_weight'
        adjustment = self.HEALTH_GOAL_ADJUSTMENTS.get(goal_key, 0)
        
        # Final daily calorie target
        daily_calories = tdee + adjustment
        
        # Ensure minimum safe calorie intake (BMR * 1.2)
        min_safe_calories = bmr * 1.2
        if daily_calories < min_safe_calories:
            daily_calories = min_safe_calories
        
        daily_calories = round(daily_calories)
        
        # Get meal split based on health goal
        meal_split = self.GOAL_BASED_MEAL_SPLITS.get(
            goal_key,
            self.DEFAULT_MEAL_SPLIT
        )
        
        # Calculate calories per meal
        meal_calories = {
            'breakfast': round(daily_calories * meal_split['breakfast']),
            'lunch': round(daily_calories * meal_split['lunch']),
            'evening_snack': round(daily_calories * meal_split['evening_snack']),
            'dinner': round(daily_calories * meal_split['dinner'])
        }
        
        # Ensure meal calories sum to total (adjust for rounding)
        total_meal_calories = sum(meal_calories.values())
        difference = daily_calories - total_meal_calories
        if difference != 0:
            # Add difference to largest meal (usually lunch)
            meal_calories['lunch'] += difference
        
        # Calculate macronutrient targets
        macros = self._calculate_macros(daily_calories, health_goal)
        
        # Generate personalized insights
        insights = self._generate_insights(
            daily_calories, tdee, bmr, health_goal, activity_level, weight, height, age, gender
        )
        
        return {
            'daily_calories': daily_calories,
            'bmr': round(bmr),
            'tdee': round(tdee),
            'adjustment': adjustment,
            'meal_calories': meal_calories,
            'meal_split_percentages': {
                'breakfast': round(meal_split['breakfast'] * 100),
                'lunch': round(meal_split['lunch'] * 100),
                'evening_snack': round(meal_split['evening_snack'] * 100),
                'dinner': round(meal_split['dinner'] * 100)
            },
            'macros': macros,
            'insights': insights,
            'metadata': {
                'formula_used': 'Mifflin-St Jeor',
                'activity_level': activity_level,
                'health_goal': health_goal,
                'calculated_at': datetime.now().isoformat()
            }
        }
    
    def _calculate_macros(self, daily_calories: int, health_goal: str) -> Dict:
        """
        Calculate recommended macronutrient distribution.
        
        Based on health goal:
        - Weight Loss: High protein (30%), Moderate carbs (40%), Moderate fat (30%)
        - Muscle Gain: High protein (30%), High carbs (45%), Moderate fat (25%)
        - Maintain: Balanced (25% protein, 45% carbs, 30% fat)
        """
        if 'weight_loss' in health_goal.lower():
            protein_percent = 0.30
            carbs_percent = 0.40
            fat_percent = 0.30
        elif 'muscle' in health_goal.lower() or 'bulk' in health_goal.lower():
            protein_percent = 0.30
            carbs_percent = 0.45
            fat_percent = 0.25
        else:
            protein_percent = 0.25
            carbs_percent = 0.45
            fat_percent = 0.30
        
        # Calculate grams (protein = 4 cal/g, carbs = 4 cal/g, fat = 9 cal/g)
        protein_grams = round((daily_calories * protein_percent) / 4)
        carbs_grams = round((daily_calories * carbs_percent) / 4)
        fat_grams = round((daily_calories * fat_percent) / 9)
        
        return {
            'protein': {
                'grams': protein_grams,
                'calories': protein_grams * 4,
                'percentage': round(protein_percent * 100)
            },
            'carbs': {
                'grams': carbs_grams,
                'calories': carbs_grams * 4,
                'percentage': round(carbs_percent * 100)
            },
            'fat': {
                'grams': fat_grams,
                'calories': fat_grams * 9,
                'percentage': round(fat_percent * 100)
            }
        }
    
    def _generate_insights(
        self, 
        daily_calories: int,
        tdee: float,
        bmr: float,
        health_goal: str,
        activity_level: str,
        weight: float,
        height: float,
        age: int,
        gender: str
    ) -> Dict:
        """Generate personalized insights and recommendations"""
        insights = []
        
        # BMI calculation
        height_m = height / 100
        bmi = weight / (height_m ** 2)
        
        # Insight 1: Calorie breakdown
        if daily_calories < tdee:
            deficit = tdee - daily_calories
            insights.append(f"You're in a {deficit} calorie deficit for weight loss (~{round(deficit * 7 / 7700, 2)}kg/week)")
        elif daily_calories > tdee:
            surplus = daily_calories - tdee
            insights.append(f"You're in a {surplus} calorie surplus for muscle gain (~{round(surplus * 7 / 7700, 2)}kg/week)")
        else:
            insights.append("You're eating at maintenance to maintain current weight")
        
        # Insight 2: Activity level
        activity_tips = {
            'sedentary': "Consider adding light exercise to boost metabolism",
            'lightly_active': "Good start! Try increasing activity to 3-5 days/week",
            'moderately_active': "Great activity level! Keep it consistent",
            'very_active': "Excellent! Make sure to fuel your workouts properly",
            'extra_active': "Amazing dedication! Ensure adequate recovery and nutrition"
        }
        insights.append(activity_tips.get(activity_level, "Stay active!"))
        
        # Insight 3: BMI context
        if bmi < 18.5:
            insights.append("Your BMI suggests you're underweight. Consider a calorie surplus with strength training")
        elif bmi >= 25:
            insights.append("Focus on a moderate calorie deficit with regular exercise for healthy weight loss")
        
        # Insight 4: Water intake
        water_liters = round(weight * 0.033, 1)
        insights.append(f"Aim for {water_liters}L of water daily (based on your weight)")
        
        # Insight 5: Meal timing
        if 'weight_loss' in health_goal.lower():
            insights.append("Eat a bigger breakfast and lighter dinner for better weight loss results")
        elif 'muscle' in health_goal.lower():
            insights.append("Spread protein intake across all meals and snacks for optimal muscle growth")
        
        return {
            'tips': insights,
            'bmi': round(bmi, 1),
            'water_intake_liters': water_liters,
            'estimated_weekly_change_kg': self._calculate_weekly_change(daily_calories, tdee)
        }
    
    def _calculate_weekly_change(self, daily_calories: int, tdee: float) -> float:
        """
        Calculate estimated weekly weight change.
        ~7700 calories = 1kg of body weight
        """
        daily_difference = daily_calories - tdee
        weekly_difference = daily_difference * 7
        kg_change = round(weekly_difference / 7700, 2)
        return kg_change
    
    def get_meal_calorie_target(
        self,
        daily_calories: int,
        meal_type: str,
        health_goal: str = 'maintain_weight'
    ) -> int:
        """
        Get calorie target for a specific meal.
        
        Args:
            daily_calories: Total daily calories
            meal_type: 'breakfast', 'lunch', 'evening_snack', or 'dinner'
            health_goal: Health goal for customized split
        
        Returns:
            Calorie target for the meal
        """
        goal_key = health_goal.lower() if health_goal else 'maintain_weight'
        meal_split = self.GOAL_BASED_MEAL_SPLITS.get(goal_key, self.DEFAULT_MEAL_SPLIT)
        
        percentage = meal_split.get(meal_type.lower(), 0.25)
        return round(daily_calories * percentage)
