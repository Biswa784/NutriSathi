"""
AI-based Indian Thali Recommendation System
Suggests balanced meals based on calorie goals and meal types
"""
import random
from typing import List, Dict, Optional
from datetime import datetime

class ThaliRecommender:
    """
    Intelligent meal recommendation engine for Indian Thali system.
    Uses rule-based AI to suggest balanced, culturally appropriate meals.
    """
    
    # Traditional Indian Thali composition rules
    THALI_RULES = {
        'breakfast': {
            'main_carb': 0.45,      # 45% calories from main carb
            'protein': 0.25,        # 25% from protein
            'healthy_fat': 0.15,    # 15% from healthy fats
            'beverage': 0.10,       # 10% from beverage/accompaniment
            'fruit': 0.05           # 5% from fruit/light item
        },
        'lunch': {
            'grain': 0.30,          # 30% rice/roti
            'dal_protein': 0.25,    # 25% dal/protein curry
            'vegetable': 0.20,      # 20% sabzi
            'side_protein': 0.15,   # 15% paneer/egg/meat
            'accompaniment': 0.10   # 10% raita/salad/chutney
        },
        'evening_snack': {
            'main_item': 0.70,      # 70% main snack
            'beverage': 0.20,       # 20% tea/coffee/juice
            'light_bite': 0.10      # 10% small accompaniment
        },
        'dinner': {
            'grain': 0.25,          # 25% lighter grain portion
            'protein_curry': 0.30,  # 30% protein (dal/paneer/chicken)
            'vegetable': 0.25,      # 25% mixed vegetables
            'soup_light': 0.15,     # 15% soup or light item
            'accompaniment': 0.05   # 5% pickle/raita
        }
    }
    
    # Food categories for intelligent grouping
    FOOD_CATEGORIES = {
        'grains': ['Rice', 'Roti', 'Paratha', 'Naan', 'Poha', 'Upma', 'Khichdi'],
        'proteins': ['Dal', 'Paneer', 'Chicken', 'Egg', 'Fish', 'Rajma', 'Chana'],
        'vegetables': ['Aloo', 'Gobi', 'Palak', 'Bhindi', 'Mixed Veg'],
        'breakfast_items': ['Idli', 'Dosa', 'Poha', 'Upma', 'Paratha'],
        'snacks': ['Samosa', 'Vada Pav', 'Pav Bhaji', 'Pakora', 'Dhokla'],
        'curries': ['Curry', 'Masala', 'Bhurji', 'Makhani'],
        'light_items': ['Raita', 'Salad', 'Curd', 'Soup'],
        'beverages': ['Tea', 'Coffee', 'Lassi', 'Juice']
    }
    
    def __init__(self, dishes_data: List[Dict]):
        """Initialize with available dishes from database"""
        self.dishes = dishes_data
        self.categorized_dishes = self._categorize_dishes()
    
    def _categorize_dishes(self) -> Dict[str, List[Dict]]:
        """Categorize dishes for intelligent selection"""
        categorized = {category: [] for category in self.FOOD_CATEGORIES.keys()}
        categorized['all'] = self.dishes
        
        for dish in self.dishes:
            name = dish['name']
            
            # Categorize based on name patterns
            for category, keywords in self.FOOD_CATEGORIES.items():
                if any(keyword.lower() in name.lower() for keyword in keywords):
                    categorized[category].append(dish)
        
        return categorized
    
    def recommend_thali(
        self, 
        meal_type: str, 
        calorie_goal: int,
        dietary_preference: Optional[str] = None,
        health_goal: Optional[str] = None,
        allergies: Optional[List[str]] = None
    ) -> Dict:
        """
        Generate AI-based Thali recommendations
        
        Args:
            meal_type: 'breakfast', 'lunch', 'evening_snack', 'dinner'
            calorie_goal: Target calories for this meal
            dietary_preference: 'Vegetarian', 'Vegan', 'Non-Vegetarian', etc.
            health_goal: 'Weight Loss', 'Muscle Building', etc.
            allergies: List of ingredients to avoid
        
        Returns:
            Dictionary with recommended items and metadata
        """
        meal_type_normalized = meal_type.lower().replace(' ', '_').replace('-', '_')
        
        # Apply dietary filters
        available_dishes = self._filter_dishes(dietary_preference, allergies)
        
        if not available_dishes:
            return self._get_fallback_recommendation(calorie_goal, meal_type)
        
        # Generate recommendations based on meal type
        if meal_type_normalized == 'breakfast':
            return self._recommend_breakfast(calorie_goal, available_dishes, health_goal)
        elif meal_type_normalized == 'lunch':
            return self._recommend_lunch(calorie_goal, available_dishes, health_goal)
        elif meal_type_normalized in ['evening_snack', 'snack']:
            return self._recommend_snack(calorie_goal, available_dishes, health_goal)
        elif meal_type_normalized == 'dinner':
            return self._recommend_dinner(calorie_goal, available_dishes, health_goal)
        else:
            return self._recommend_generic(calorie_goal, available_dishes, meal_type)
    
    def _filter_dishes(self, dietary_preference: Optional[str], allergies: Optional[List[str]]) -> List[Dict]:
        """Filter dishes based on dietary preferences and allergies"""
        filtered = self.dishes.copy()
        
        # Filter by dietary preference
        if dietary_preference:
            if dietary_preference.lower() == 'vegetarian':
                filtered = [d for d in filtered if not any(
                    meat in d['name'].lower() 
                    for meat in ['chicken', 'fish', 'mutton', 'egg', 'meat']
                )]
            elif dietary_preference.lower() == 'vegan':
                filtered = [d for d in filtered if not any(
                    non_vegan in d['name'].lower() 
                    for non_vegan in ['chicken', 'fish', 'paneer', 'egg', 'ghee', 'butter', 'curd']
                )]
        
        # Filter by allergies
        if allergies:
            for allergen in allergies:
                filtered = [d for d in filtered if allergen.lower() not in d['name'].lower()]
        
        return filtered
    
    def _recommend_breakfast(self, calorie_goal: int, dishes: List[Dict], health_goal: Optional[str]) -> Dict:
        """Generate breakfast thali recommendation"""
        recommendations = []
        remaining_calories = calorie_goal
        rules = self.THALI_RULES['breakfast']
        
        # 1. Main carb (45% - Dosa/Idli/Paratha/Poha)
        main_cal = calorie_goal * rules['main_carb']
        main_dish = self._select_best_match(
            dishes, main_cal, 
            preferred_categories=['breakfast_items', 'grains']
        )
        if main_dish:
            recommendations.append({
                **main_dish,
                'category': 'Main Dish',
                'note': 'Primary energy source for the morning'
            })
            remaining_calories -= main_dish['calories']
        
        # 2. Protein (25% - Dal/Egg/Paneer)
        protein_cal = calorie_goal * rules['protein']
        protein_dish = self._select_best_match(
            [d for d in dishes if d.get('protein', 0) > 10], 
            protein_cal,
            exclude=[main_dish['name']] if main_dish else []
        )
        if protein_dish:
            recommendations.append({
                **protein_dish,
                'category': 'Protein',
                'note': 'Keeps you full and energized'
            })
            remaining_calories -= protein_dish['calories']
        
        # 3. Healthy fat/side
        if remaining_calories > 50:
            side_dish = self._select_best_match(
                dishes, remaining_calories * 0.5,
                exclude=[r['name'] for r in recommendations]
            )
            if side_dish:
                recommendations.append({
                    **side_dish,
                    'category': 'Side',
                    'note': 'Adds flavor and nutrition'
                })
                remaining_calories -= side_dish['calories']
        
        total_cals = sum(r['calories'] for r in recommendations)
        
        return {
            'meal_type': 'Breakfast',
            'calorie_goal': calorie_goal,
            'recommended_items': recommendations,
            'total_calories': round(total_cals),
            'total_protein': round(sum(r.get('protein', 0) for r in recommendations)),
            'total_carbs': round(sum(r.get('carbs', 0) for r in recommendations)),
            'total_fat': round(sum(r.get('fat', 0) for r in recommendations)),
            'balance_score': self._calculate_balance_score(recommendations),
            'thali_note': f"Traditional Indian breakfast thali - {len(recommendations)} items",
            'health_tip': self._get_health_tip('breakfast', health_goal)
        }
    
    def _recommend_lunch(self, calorie_goal: int, dishes: List[Dict], health_goal: Optional[str]) -> Dict:
        """Generate lunch thali recommendation"""
        recommendations = []
        rules = self.THALI_RULES['lunch']
        
        # 1. Grain - Rice or Roti (30%)
        grain_cal = calorie_goal * rules['grain']
        grain = self._select_best_match(dishes, grain_cal, preferred_categories=['grains'])
        if grain:
            recommendations.append({
                **grain,
                'category': 'Grain (Staple)',
                'note': 'Foundation of the thali'
            })
        
        # 2. Dal/Protein (25%)
        dal_cal = calorie_goal * rules['dal_protein']
        dal = self._select_best_match(
            [d for d in dishes if 'dal' in d['name'].lower() or 'rajma' in d['name'].lower()],
            dal_cal,
            exclude=[grain['name']] if grain else []
        )
        if dal:
            recommendations.append({
                **dal,
                'category': 'Dal (Lentils)',
                'note': 'Plant-based protein powerhouse'
            })
        
        # 3. Vegetable curry (20%)
        veg_cal = calorie_goal * rules['vegetable']
        veg = self._select_best_match(
            dishes, veg_cal,
            preferred_categories=['vegetables', 'curries'],
            exclude=[r['name'] for r in recommendations]
        )
        if veg:
            recommendations.append({
                **veg,
                'category': 'Sabzi (Vegetable)',
                'note': 'Rich in vitamins and fiber'
            })
        
        # 4. Side protein (15%)
        side_cal = calorie_goal * rules['side_protein']
        side = self._select_best_match(
            [d for d in dishes if d.get('protein', 0) > 8],
            side_cal,
            exclude=[r['name'] for r in recommendations]
        )
        if side:
            recommendations.append({
                **side,
                'category': 'Protein Side',
                'note': 'Additional protein for satiety'
            })
        
        total_cals = sum(r['calories'] for r in recommendations)
        
        return {
            'meal_type': 'Lunch',
            'calorie_goal': calorie_goal,
            'recommended_items': recommendations,
            'total_calories': round(total_cals),
            'total_protein': round(sum(r.get('protein', 0) for r in recommendations)),
            'total_carbs': round(sum(r.get('carbs', 0) for r in recommendations)),
            'total_fat': round(sum(r.get('fat', 0) for r in recommendations)),
            'balance_score': self._calculate_balance_score(recommendations),
            'thali_note': f"Complete Indian thali - {len(recommendations)} items for balanced nutrition",
            'health_tip': self._get_health_tip('lunch', health_goal)
        }
    
    def _recommend_snack(self, calorie_goal: int, dishes: List[Dict], health_goal: Optional[str]) -> Dict:
        """Generate evening snack recommendation"""
        recommendations = []
        
        # Light snack recommendation
        snack = self._select_best_match(
            dishes, calorie_goal * 0.8,
            preferred_categories=['snacks', 'breakfast_items']
        )
        if snack:
            recommendations.append({
                **snack,
                'category': 'Snack',
                'note': 'Light bite to curb evening hunger'
            })
        
        total_cals = sum(r['calories'] for r in recommendations)
        
        return {
            'meal_type': 'Evening Snack',
            'calorie_goal': calorie_goal,
            'recommended_items': recommendations,
            'total_calories': round(total_cals),
            'total_protein': round(sum(r.get('protein', 0) for r in recommendations)),
            'total_carbs': round(sum(r.get('carbs', 0) for r in recommendations)),
            'total_fat': round(sum(r.get('fat', 0) for r in recommendations)),
            'balance_score': self._calculate_balance_score(recommendations),
            'thali_note': f"Evening snack - keep it light",
            'health_tip': self._get_health_tip('snack', health_goal)
        }
    
    def _recommend_dinner(self, calorie_goal: int, dishes: List[Dict], health_goal: Optional[str]) -> Dict:
        """Generate dinner thali recommendation"""
        recommendations = []
        rules = self.THALI_RULES['dinner']
        
        # Lighter grain portion for dinner (25%)
        grain_cal = calorie_goal * rules['grain']
        grain = self._select_best_match(dishes, grain_cal, preferred_categories=['grains'])
        if grain:
            recommendations.append({
                **grain,
                'category': 'Grain',
                'note': 'Light grain for easy digestion'
            })
        
        # Protein curry (30%)
        protein_cal = calorie_goal * rules['protein_curry']
        protein = self._select_best_match(
            [d for d in dishes if d.get('protein', 0) > 10],
            protein_cal,
            preferred_categories=['proteins', 'curries'],
            exclude=[grain['name']] if grain else []
        )
        if protein:
            recommendations.append({
                **protein,
                'category': 'Protein Curry',
                'note': 'Protein for overnight muscle repair'
            })
        
        # Vegetables (25%)
        veg_cal = calorie_goal * rules['vegetable']
        veg = self._select_best_match(
            dishes, veg_cal,
            preferred_categories=['vegetables'],
            exclude=[r['name'] for r in recommendations]
        )
        if veg:
            recommendations.append({
                **veg,
                'category': 'Vegetable',
                'note': 'Fiber-rich for digestion'
            })
        
        total_cals = sum(r['calories'] for r in recommendations)
        
        return {
            'meal_type': 'Dinner',
            'calorie_goal': calorie_goal,
            'recommended_items': recommendations,
            'total_calories': round(total_cals),
            'total_protein': round(sum(r.get('protein', 0) for r in recommendations)),
            'total_carbs': round(sum(r.get('carbs', 0) for r in recommendations)),
            'total_fat': round(sum(r.get('fat', 0) for r in recommendations)),
            'balance_score': self._calculate_balance_score(recommendations),
            'thali_note': f"Light dinner thali - {len(recommendations)} items for good sleep",
            'health_tip': self._get_health_tip('dinner', health_goal)
        }
    
    def _recommend_generic(self, calorie_goal: int, dishes: List[Dict], meal_type: str) -> Dict:
        """Generic recommendation for any meal type"""
        recommendations = []
        
        # Select 2-3 items that fit the calorie goal
        items = self._select_multiple_items(dishes, calorie_goal, count=3)
        for item in items:
            recommendations.append({
                **item,
                'category': 'Suggested Item',
                'note': 'Balanced choice for your goal'
            })
        
        total_cals = sum(r['calories'] for r in recommendations)
        
        return {
            'meal_type': meal_type,
            'calorie_goal': calorie_goal,
            'recommended_items': recommendations,
            'total_calories': round(total_cals),
            'total_protein': round(sum(r.get('protein', 0) for r in recommendations)),
            'total_carbs': round(sum(r.get('carbs', 0) for r in recommendations)),
            'total_fat': round(sum(r.get('fat', 0) for r in recommendations)),
            'balance_score': self._calculate_balance_score(recommendations),
            'thali_note': f"Suggested meal combination",
            'health_tip': "Eat mindfully and stay hydrated"
        }
    
    def _select_best_match(
        self, 
        dishes: List[Dict], 
        target_calories: int,
        preferred_categories: Optional[List[str]] = None,
        exclude: Optional[List[str]] = None
    ) -> Optional[Dict]:
        """Select dish that best matches target calories"""
        if not dishes:
            return None
        
        exclude = exclude or []
        available = [d for d in dishes if d['name'] not in exclude]
        
        if not available:
            return None
        
        # Prioritize preferred categories
        if preferred_categories:
            preferred = []
            for category in preferred_categories:
                if category in self.categorized_dishes:
                    preferred.extend(self.categorized_dishes[category])
            
            if preferred:
                preferred = [d for d in preferred if d['name'] not in exclude and d in available]
                if preferred:
                    available = preferred
        
        # Find closest match to target calories (within 20% tolerance)
        tolerance = target_calories * 0.20
        candidates = [
            d for d in available 
            if abs(d['calories'] - target_calories) <= tolerance
        ]
        
        if not candidates:
            # If no close match, get closest one
            candidates = sorted(available, key=lambda d: abs(d['calories'] - target_calories))[:3]
        
        # Return random from best candidates for variety
        return random.choice(candidates) if candidates else None
    
    def _select_multiple_items(self, dishes: List[Dict], target_calories: int, count: int = 3) -> List[Dict]:
        """Select multiple items that together approximate target calories"""
        if not dishes or count <= 0:
            return []
        
        selected = []
        remaining = target_calories
        available = dishes.copy()
        
        for _ in range(count):
            if not available:
                break
            
            target_per_item = remaining / (count - len(selected))
            item = self._select_best_match(
                available, target_per_item,
                exclude=[s['name'] for s in selected]
            )
            
            if item:
                selected.append(item)
                remaining -= item['calories']
                available = [d for d in available if d['name'] != item['name']]
        
        return selected
    
    def _calculate_balance_score(self, items: List[Dict]) -> int:
        """Calculate nutritional balance score (0-100)"""
        if not items:
            return 0
        
        total_cals = sum(i['calories'] for i in items)
        if total_cals == 0:
            return 0
        
        # Calculate macronutrient percentages
        protein_cals = sum(i.get('protein', 0) for i in items) * 4
        carb_cals = sum(i.get('carbs', 0) for i in items) * 4
        fat_cals = sum(i.get('fat', 0) for i in items) * 9
        
        protein_pct = (protein_cals / total_cals) * 100 if total_cals > 0 else 0
        carb_pct = (carb_cals / total_cals) * 100 if total_cals > 0 else 0
        fat_pct = (fat_cals / total_cals) * 100 if total_cals > 0 else 0
        
        # Ideal ranges: Protein 20-30%, Carbs 45-55%, Fat 20-30%
        score = 100
        
        # Deduct for imbalance
        if protein_pct < 15 or protein_pct > 35:
            score -= 20
        if carb_pct < 40 or carb_pct > 60:
            score -= 15
        if fat_pct < 15 or fat_pct > 35:
            score -= 15
        
        # Bonus for variety
        if len(items) >= 3:
            score += 10
        
        return max(0, min(100, score))
    
    def _get_health_tip(self, meal_type: str, health_goal: Optional[str]) -> str:
        """Get contextual health tip"""
        tips = {
            'breakfast': {
                'Weight Loss': 'High protein breakfast keeps you full longer',
                'Muscle Building': 'Start your day with protein for muscle recovery',
                'default': 'Never skip breakfast - it kickstarts your metabolism'
            },
            'lunch': {
                'Weight Loss': 'Fill half your plate with vegetables',
                'Muscle Building': 'Include lean protein in every lunch',
                'default': 'Eat lunch mindfully without distractions'
            },
            'snack': {
                'Weight Loss': 'Choose protein-rich snacks to avoid overeating at dinner',
                'Muscle Building': 'Post-workout snack helps muscle recovery',
                'default': 'Healthy snacks prevent unhealthy cravings'
            },
            'dinner': {
                'Weight Loss': 'Lighter dinner aids weight loss and better sleep',
                'Muscle Building': 'Slow-digesting protein before bed supports overnight recovery',
                'default': 'Eat dinner 2-3 hours before bedtime'
            }
        }
        
        meal_tips = tips.get(meal_type, tips['breakfast'])
        return meal_tips.get(health_goal, meal_tips['default'])
    
    def _get_fallback_recommendation(self, calorie_goal: int, meal_type: str) -> Dict:
        """Fallback when no dishes match criteria"""
        return {
            'meal_type': meal_type,
            'calorie_goal': calorie_goal,
            'recommended_items': [],
            'total_calories': 0,
            'total_protein': 0,
            'total_carbs': 0,
            'total_fat': 0,
            'balance_score': 0,
            'thali_note': 'No suitable dishes found. Try adjusting your preferences.',
            'health_tip': 'Consult a nutritionist for personalized meal planning'
        }
