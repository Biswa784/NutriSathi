"""
High Calorie Meal Detection & Correction Suggestion Service
Detects when meals exceed target calories and suggests corrections
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta


class CalorieAlertService:
    """
    Service to detect high calorie meals and provide intelligent suggestions
    """
    
    def __init__(self, meals_db: List[dict], users_db: Dict[str, dict]):
        self.meals_db = meals_db
        self.users_db = users_db
    
    def _get_user_daily_target(self, email: str) -> int:
        """Get user's daily calorie target (default: 2000 kcal)"""
        user = self.users_db.get(email, {})
        return user.get('daily_calorie_target', 2000)
    
    def _get_meal_type_target(self, daily_target: int, meal_type: str) -> int:
        """
        Calculate target calories for specific meal type
        
        Typical distribution:
        - Breakfast: 25% (500 kcal for 2000 kcal/day)
        - Lunch: 35% (700 kcal)
        - Dinner: 30% (600 kcal)
        - Snack: 10% (200 kcal)
        """
        distribution = {
            'breakfast': 0.25,
            'lunch': 0.35,
            'dinner': 0.30,
            'snack': 0.10
        }
        
        meal_type_lower = meal_type.lower()
        percentage = distribution.get(meal_type_lower, 0.30)  # Default to dinner
        
        return int(daily_target * percentage)
    
    def _get_today_meals(self, email: str) -> List[dict]:
        """Get all meals logged today by user"""
        today = datetime.now().date()
        user_meals = [m for m in self.meals_db if m.get('user') == email]
        
        today_meals = []
        for meal in user_meals:
            meal_date_str = meal.get('timestamp', '')
            if meal_date_str:
                try:
                    meal_date = datetime.fromisoformat(meal_date_str.replace('Z', '+00:00')).date()
                    if meal_date == today:
                        today_meals.append(meal)
                except Exception:
                    pass
        
        return today_meals
    
    def _calculate_remaining_calories(self, email: str, current_meal_calories: float) -> Dict:
        """Calculate how many calories are left for the day"""
        daily_target = self._get_user_daily_target(email)
        today_meals = self._get_today_meals(email)
        
        # Sum calories from previous meals today (excluding current meal)
        consumed_calories = sum(m.get('calories', 0) for m in today_meals)
        
        # Add current meal
        total_consumed = consumed_calories + current_meal_calories
        remaining = daily_target - total_consumed
        
        return {
            'daily_target': daily_target,
            'consumed_before': consumed_calories,
            'current_meal': current_meal_calories,
            'total_consumed': total_consumed,
            'remaining': remaining,
            'percentage_consumed': round((total_consumed / daily_target) * 100, 1)
        }
    
    def _get_lighter_recommendations(self, meal_type: str, target_calories: int) -> List[str]:
        """Provide lighter meal suggestions for next meal"""
        recommendations = {
            'breakfast': [
                f"Try a lighter breakfast tomorrow: Oats with fruits (~{int(target_calories * 0.8)} kcal)",
                f"Consider: 2 Idlis with sambar (~{int(target_calories * 0.7)} kcal)",
                f"Option: Vegetable upma with chutney (~{int(target_calories * 0.75)} kcal)"
            ],
            'lunch': [
                f"Consider a lighter lunch: Grilled chicken salad (~{int(target_calories * 0.8)} kcal)",
                f"Try: Dal with 1 roti and vegetables (~{int(target_calories * 0.75)} kcal)",
                f"Option: Vegetable pulao with raita (~{int(target_calories * 0.8)} kcal)"
            ],
            'dinner': [
                f"Lighter dinner suggestion: Grilled fish with vegetables (~{int(target_calories * 0.7)} kcal)",
                f"Try: Vegetable soup with 1 roti (~{int(target_calories * 0.6)} kcal)",
                f"Option: Paneer tikka with salad (~{int(target_calories * 0.75)} kcal)"
            ],
            'snack': [
                f"Healthier snack: Handful of nuts (~{int(target_calories * 0.5)} kcal)",
                f"Try: Fresh fruit salad (~{int(target_calories * 0.4)} kcal)",
                f"Option: Greek yogurt with berries (~{int(target_calories * 0.6)} kcal)"
            ]
        }
        
        return recommendations.get(meal_type.lower(), recommendations['dinner'])
    
    def _suggest_next_meal_type(self, current_meal_type: str) -> str:
        """Determine which meal comes next"""
        meal_sequence = ['breakfast', 'snack', 'lunch', 'snack', 'dinner']
        
        current_lower = current_meal_type.lower()
        if current_lower in meal_sequence:
            current_index = meal_sequence.index(current_lower)
            if current_index < len(meal_sequence) - 1:
                return meal_sequence[current_index + 1]
        
        return 'dinner'  # Default to dinner if uncertain
    
    def check_meal_calories(
        self, 
        email: str, 
        meal_calories: float, 
        meal_type: str
    ) -> Optional[Dict]:
        """
        Check if meal exceeds target and return warning with suggestions
        
        Args:
            email: User's email
            meal_calories: Calories in the current meal
            meal_type: Type of meal (breakfast/lunch/dinner/snack)
        
        Returns:
            Warning dict if meal exceeds target, None otherwise
        """
        daily_target = self._get_user_daily_target(email)
        meal_target = self._get_meal_type_target(daily_target, meal_type)
        
        # Check if meal exceeds its target
        if meal_calories <= meal_target:
            return None  # No warning needed
        
        excess_calories = int(meal_calories - meal_target)
        
        # Calculate remaining calories for the day
        calorie_breakdown = self._calculate_remaining_calories(email, meal_calories)
        
        # Determine next meal type
        next_meal_type = self._suggest_next_meal_type(meal_type)
        next_meal_target = self._get_meal_type_target(daily_target, next_meal_type)
        
        # Get lighter recommendations
        recommendations = self._get_lighter_recommendations(next_meal_type, next_meal_target)
        
        # Build warning message
        warning = {
            'alert': True,
            'severity': 'high' if excess_calories > meal_target * 0.5 else 'medium',
            'message': f"Your {meal_type} exceeded your target by {excess_calories} kcal.",
            'meal_type': meal_type,
            'meal_calories': int(meal_calories),
            'meal_target': meal_target,
            'excess_calories': excess_calories,
            'daily_summary': {
                'daily_target': calorie_breakdown['daily_target'],
                'total_consumed': int(calorie_breakdown['total_consumed']),
                'remaining': int(calorie_breakdown['remaining']),
                'percentage_consumed': calorie_breakdown['percentage_consumed']
            },
            'suggestion': {
                'next_meal_type': next_meal_type,
                'next_meal_target': next_meal_target,
                'question': f"Would you like a lighter {next_meal_type} recommendation?",
                'recommendations': recommendations
            }
        }
        
        return warning
    
    def get_daily_summary(self, email: str) -> Dict:
        """Get summary of calories consumed today"""
        daily_target = self._get_user_daily_target(email)
        today_meals = self._get_today_meals(email)
        
        total_calories = sum(m.get('calories', 0) for m in today_meals)
        remaining = daily_target - total_calories
        
        # Breakdown by meal type
        meal_breakdown = {}
        for meal in today_meals:
            meal_type = meal.get('meal_type', 'other')
            if meal_type not in meal_breakdown:
                meal_breakdown[meal_type] = 0
            meal_breakdown[meal_type] += meal.get('calories', 0)
        
        return {
            'daily_target': daily_target,
            'total_consumed': int(total_calories),
            'remaining': int(remaining),
            'percentage_consumed': round((total_calories / daily_target) * 100, 1),
            'meal_breakdown': {k: int(v) for k, v in meal_breakdown.items()},
            'meals_logged': len(today_meals),
            'status': 'over_target' if total_calories > daily_target else 'on_track'
        }
