"""
AI-Based Mood-Based Meal Recommendation System for NutriSathi
Recommends foods based on user's emotional state and nutritional science
"""
import random
from typing import List, Dict, Optional
from datetime import datetime


class MoodRecommender:
    """
    Intelligent mood-based meal recommendation engine.
    Uses nutritional science, psychology, and Ayurvedic principles.
    """
    
    # Mood-to-nutrient mapping based on scientific research
    MOOD_NUTRIENT_PROFILE = {
        'happy': {
            'description': 'Maintain positivity and energy',
            'key_nutrients': ['complex_carbs', 'b_vitamins', 'antioxidants'],
            'macros': {'protein': (0.15, 0.25), 'carbs': (0.50, 0.65), 'fat': (0.20, 0.35)},
            'ayurvedic': 'sattvic',  # Pure, balanced foods
            'properties': ['light', 'energizing', 'colorful'],
            'avoid': ['heavy', 'fried', 'excessive_sugar']
        },
        'sad': {
            'description': 'Boost serotonin and mood naturally',
            'key_nutrients': ['tryptophan', 'omega_3', 'complex_carbs', 'b_vitamins', 'vitamin_d'],
            'macros': {'protein': (0.20, 0.30), 'carbs': (0.45, 0.60), 'fat': (0.25, 0.35)},
            'ayurvedic': 'rajasic',  # Stimulating, warming
            'properties': ['comfort', 'warming', 'moderate_protein'],
            'avoid': ['caffeine', 'alcohol', 'processed_sugar']
        },
        'tired': {
            'description': 'Restore energy with slow-release fuel',
            'key_nutrients': ['iron', 'b_vitamins', 'complex_carbs', 'magnesium', 'protein'],
            'macros': {'protein': (0.25, 0.35), 'carbs': (0.40, 0.55), 'fat': (0.20, 0.30)},
            'ayurvedic': 'rajasic',  # Energizing
            'properties': ['energy_boosting', 'iron_rich', 'moderate_fat'],
            'avoid': ['simple_sugars', 'heavy_cream', 'excessive_carbs']
        },
        'stressed': {
            'description': 'Calm the nervous system',
            'key_nutrients': ['magnesium', 'b_vitamins', 'omega_3', 'vitamin_c', 'complex_carbs'],
            'macros': {'protein': (0.20, 0.30), 'carbs': (0.40, 0.55), 'fat': (0.25, 0.35)},
            'ayurvedic': 'sattvic',  # Calming, grounding
            'properties': ['calming', 'moderate_portions', 'nutrient_dense'],
            'avoid': ['caffeine', 'alcohol', 'spicy', 'fried']
        },
        'sick': {
            'description': 'Support immune system and digestion',
            'key_nutrients': ['vitamin_c', 'zinc', 'protein', 'probiotics', 'antioxidants'],
            'macros': {'protein': (0.20, 0.30), 'carbs': (0.45, 0.60), 'fat': (0.15, 0.25)},
            'ayurvedic': 'sattvic',  # Light, easily digestible
            'properties': ['light', 'easily_digestible', 'warm', 'hydrating'],
            'avoid': ['dairy', 'fried', 'heavy', 'cold']
        }
    }
    
    # Food category scoring for each mood
    MOOD_FOOD_CATEGORIES = {
        'happy': {
            'preferred': ['Fruits', 'Salads', 'Grains', 'Yogurt', 'Smoothies'],
            'moderate': ['Chicken', 'Fish', 'Vegetables', 'Rice'],
            'avoid': ['Deep-fried', 'Heavy desserts']
        },
        'sad': {
            'preferred': ['Dal', 'Khichdi', 'Chicken', 'Eggs', 'Whole grains', 'Nuts'],
            'moderate': ['Rice', 'Roti', 'Vegetables', 'Paneer'],
            'avoid': ['Junk food', 'Alcohol', 'Excessive sweets']
        },
        'tired': {
            'preferred': ['Eggs', 'Chicken', 'Fish', 'Spinach', 'Lentils', 'Nuts', 'Quinoa'],
            'moderate': ['Brown rice', 'Sweet potato', 'Vegetables'],
            'avoid': ['White bread', 'Pastries', 'Candy', 'Soda']
        },
        'stressed': {
            'preferred': ['Almonds', 'Walnuts', 'Green vegetables', 'Oats', 'Chamomile tea', 'Berries'],
            'moderate': ['Fish', 'Eggs', 'Whole grains', 'Yogurt'],
            'avoid': ['Coffee', 'Energy drinks', 'Spicy food', 'Alcohol']
        },
        'sick': {
            'preferred': ['Soup', 'Khichdi', 'Ginger tea', 'Dal', 'Steamed vegetables', 'Curd'],
            'moderate': ['Rice', 'Idli', 'Banana', 'Applesauce'],
            'avoid': ['Dairy', 'Fried', 'Spicy', 'Cold drinks', 'Ice cream']
        }
    }
    
    # Keyword-based dish classification
    FOOD_KEYWORDS = {
        'protein_rich': ['chicken', 'egg', 'fish', 'paneer', 'dal', 'rajma', 'chana', 'soya', 'tofu'],
        'complex_carbs': ['brown rice', 'oats', 'quinoa', 'whole wheat', 'roti', 'chapati', 'khichdi'],
        'simple_carbs': ['white rice', 'maida', 'sugar', 'naan', 'kulcha'],
        'healthy_fats': ['nuts', 'seeds', 'avocado', 'olive', 'ghee (small)'],
        'comfort_food': ['khichdi', 'dal rice', 'curd rice', 'porridge', 'soup'],
        'light': ['salad', 'soup', 'steamed', 'boiled', 'grilled', 'idli', 'dhokla'],
        'heavy': ['fried', 'deep fried', 'cream', 'butter chicken', 'biryani', 'paratha'],
        'warming': ['ginger', 'garlic', 'pepper', 'cinnamon', 'turmeric', 'soup'],
        'cooling': ['cucumber', 'curd', 'mint', 'coconut', 'watermelon'],
        'iron_rich': ['spinach', 'palak', 'methi', 'beet', 'liver'],
        'vitamin_c': ['lemon', 'orange', 'amla', 'tomato', 'capsicum'],
        'digestive': ['ginger', 'ajwain', 'jeera', 'curd', 'buttermilk', 'khichdi']
    }
    
    def __init__(self, dishes_data: List[Dict]):
        """Initialize with available dishes from database"""
        self.dishes = dishes_data
        self.categorized_dishes = self._categorize_by_mood()
    
    def _categorize_by_mood(self) -> Dict[str, Dict[str, List[Dict]]]:
        """Pre-categorize dishes for efficient mood-based filtering"""
        mood_dishes = {mood: {'preferred': [], 'moderate': [], 'avoid': []} for mood in self.MOOD_NUTRIENT_PROFILE.keys()}
        
        for dish in self.dishes:
            name_lower = dish['name'].lower()
            
            # Calculate macros percentages
            total_cals = dish.get('calories', 0)
            if total_cals > 0:
                protein_pct = (dish.get('protein', 0) * 4) / total_cals
                carbs_pct = (dish.get('carbs', 0) * 4) / total_cals
                fat_pct = (dish.get('fat', 0) * 9) / total_cals
            else:
                protein_pct = carbs_pct = fat_pct = 0
            
            dish['macro_percentages'] = {
                'protein': protein_pct,
                'carbs': carbs_pct,
                'fat': fat_pct
            }
            
            # Categorize for each mood
            for mood, profile in self.MOOD_NUTRIENT_PROFILE.items():
                category_score = self._score_dish_for_mood(dish, name_lower, mood, profile)
                
                if category_score >= 0.7:
                    mood_dishes[mood]['preferred'].append(dish)
                elif category_score >= 0.4:
                    mood_dishes[mood]['moderate'].append(dish)
                else:
                    mood_dishes[mood]['avoid'].append(dish)
        
        return mood_dishes
    
    def _score_dish_for_mood(self, dish: Dict, name_lower: str, mood: str, profile: Dict) -> float:
        """Score how well a dish matches a mood profile (0-1)"""
        score = 0.5  # Start neutral
        
        # Check macro alignment
        protein_range = profile['macros']['protein']
        carbs_range = profile['macros']['carbs']
        fat_range = profile['macros']['fat']
        
        macro_pct = dish['macro_percentages']
        
        # Reward if macros are within ideal range
        if protein_range[0] <= macro_pct['protein'] <= protein_range[1]:
            score += 0.2
        if carbs_range[0] <= macro_pct['carbs'] <= carbs_range[1]:
            score += 0.2
        if fat_range[0] <= macro_pct['fat'] <= fat_range[1]:
            score += 0.1
        
        # Check keyword matches
        for keyword_category in profile.get('properties', []):
            if keyword_category in self.FOOD_KEYWORDS:
                for keyword in self.FOOD_KEYWORDS[keyword_category]:
                    if keyword in name_lower:
                        score += 0.1
        
        # Check avoid keywords (penalize)
        for avoid_keyword in profile.get('avoid', []):
            if avoid_keyword.replace('_', ' ') in name_lower:
                score -= 0.3
        
        # Check food category preferences
        food_cats = self.MOOD_FOOD_CATEGORIES.get(mood, {})
        for pref_cat in food_cats.get('preferred', []):
            if pref_cat.lower() in name_lower:
                score += 0.2
        
        for avoid_cat in food_cats.get('avoid', []):
            if avoid_cat.lower() in name_lower:
                score -= 0.4
        
        return max(0, min(1, score))  # Clamp between 0-1
    
    def recommend_by_mood(
        self,
        mood: str,
        calorie_range: tuple = (200, 800),
        dietary_preference: Optional[str] = None,
        allergies: Optional[List[str]] = None,
        num_recommendations: int = 4
    ) -> Dict:
        """
        Generate mood-based meal recommendations
        
        Args:
            mood: User's current mood ('happy', 'sad', 'tired', 'stressed', 'sick')
            calorie_range: (min, max) calorie range for recommended dishes
            dietary_preference: 'Vegetarian', 'Vegan', 'Non-Vegetarian'
            allergies: List of ingredients to avoid
            num_recommendations: Number of dishes to recommend
        
        Returns:
            Dictionary with recommended dishes and mood insights
        """
        mood_normalized = mood.lower().replace(' ', '_').replace('-', '_')
        
        if mood_normalized not in self.MOOD_NUTRIENT_PROFILE:
            raise ValueError(f"Invalid mood. Choose from: {list(self.MOOD_NUTRIENT_PROFILE.keys())}")
        
        mood_profile = self.MOOD_NUTRIENT_PROFILE[mood_normalized]
        
        # Get pre-categorized dishes for this mood
        mood_specific = self.categorized_dishes.get(mood_normalized, {})
        candidate_pool = mood_specific.get('preferred', []) + mood_specific.get('moderate', [])
        
        # Apply filters
        filtered_candidates = self._apply_filters(
            candidate_pool,
            calorie_range,
            dietary_preference,
            allergies
        )
        
        if not filtered_candidates:
            # Fallback to all dishes if filters too restrictive
            filtered_candidates = self._apply_filters(
                self.dishes,
                calorie_range,
                dietary_preference,
                allergies
            )
        
        # Score and rank candidates
        scored_dishes = []
        for dish in filtered_candidates:
            score = self._score_dish_for_mood(
                dish,
                dish['name'].lower(),
                mood_normalized,
                mood_profile
            )
            scored_dishes.append((score, dish))
        
        # Sort by score (descending)
        scored_dishes.sort(key=lambda x: x[0], reverse=True)
        
        # Select top recommendations with variety
        recommendations = self._select_diverse_dishes(
            scored_dishes,
            num_recommendations
        )
        
        # Calculate totals
        total_calories = sum(d.get('calories', 0) for d in recommendations)
        total_protein = sum(d.get('protein', 0) for d in recommendations)
        total_carbs = sum(d.get('carbs', 0) for d in recommendations)
        total_fat = sum(d.get('fat', 0) for d in recommendations)
        
        # Generate mood-specific insights
        mood_insights = self._generate_mood_insights(
            mood_normalized,
            mood_profile,
            recommendations
        )
        
        return {
            'mood': mood,
            'mood_description': mood_profile['description'],
            'key_nutrients': mood_profile['key_nutrients'],
            'ayurvedic_type': mood_profile['ayurvedic'],
            'recommended_dishes': [
                {
                    'name': dish['name'],
                    'serving_size': dish.get('serving_size', 100),
                    'unit': dish.get('unit', 'g'),
                    'calories': dish.get('calories', 0),
                    'protein': dish.get('protein', 0),
                    'carbs': dish.get('carbs', 0),
                    'fat': dish.get('fat', 0),
                    'mood_benefit': self._get_dish_mood_benefit(dish, mood_normalized),
                    'cuisine': dish.get('cuisine', 'Indian')
                }
                for dish in recommendations
            ],
            'total_calories': round(total_calories, 1),
            'total_protein': round(total_protein, 1),
            'total_carbs': round(total_carbs, 1),
            'total_fat': round(total_fat, 1),
            'mood_insights': mood_insights,
            'wellness_tip': self._get_wellness_tip(mood_normalized),
            'timestamp': datetime.now().isoformat()
        }
    
    def _apply_filters(
        self,
        dishes: List[Dict],
        calorie_range: tuple,
        dietary_preference: Optional[str],
        allergies: Optional[List[str]]
    ) -> List[Dict]:
        """Apply dietary and allergen filters"""
        filtered = dishes
        
        # Calorie filter
        min_cal, max_cal = calorie_range
        filtered = [d for d in filtered if min_cal <= d.get('calories', 0) <= max_cal]
        
        # Dietary preference filter
        if dietary_preference:
            pref_lower = dietary_preference.lower()
            non_veg_keywords = ['chicken', 'fish', 'meat', 'egg', 'prawn', 'mutton', 'lamb']
            dairy_keywords = ['paneer', 'cheese', 'butter', 'ghee', 'curd', 'milk', 'cream']
            
            if 'veg' in pref_lower:
                # Exclude non-veg
                filtered = [
                    d for d in filtered
                    if not any(keyword in d['name'].lower() for keyword in non_veg_keywords)
                ]
            
            if 'vegan' in pref_lower:
                # Exclude dairy and non-veg
                filtered = [
                    d for d in filtered
                    if not any(keyword in d['name'].lower() for keyword in non_veg_keywords + dairy_keywords)
                ]
        
        # Allergy filter
        if allergies:
            for allergen in allergies:
                allergen_lower = allergen.lower()
                filtered = [
                    d for d in filtered
                    if allergen_lower not in d['name'].lower()
                ]
        
        return filtered
    
    def _select_diverse_dishes(
        self,
        scored_dishes: List[tuple],
        num_recommendations: int
    ) -> List[Dict]:
        """Select diverse dishes to avoid repetition"""
        selected = []
        used_categories = set()
        
        for score, dish in scored_dishes:
            if len(selected) >= num_recommendations:
                break
            
            # Extract category from name (simple heuristic)
            name_words = dish['name'].lower().split()
            category = name_words[0] if name_words else ''
            
            # Prefer variety
            if category not in used_categories or len(selected) < num_recommendations // 2:
                selected.append(dish)
                used_categories.add(category)
        
        # If not enough variety, add remaining
        while len(selected) < num_recommendations and len(selected) < len(scored_dishes):
            for score, dish in scored_dishes:
                if dish not in selected:
                    selected.append(dish)
                    break
        
        return selected
    
    def _get_dish_mood_benefit(self, dish: Dict, mood: str) -> str:
        """Generate a benefit description for why this dish helps the mood"""
        name_lower = dish['name'].lower()
        
        benefits = {
            'happy': [
                "Provides sustained energy to keep spirits high",
                "Rich in mood-maintaining nutrients",
                "Light and refreshing to support positivity"
            ],
            'sad': [
                "Contains tryptophan to boost serotonin naturally",
                "Comfort food that's nutritionally balanced",
                "Warming and satisfying to lift mood"
            ],
            'tired': [
                "High in iron and B-vitamins for energy",
                "Slow-release carbs prevent energy crashes",
                "Protein-rich to combat fatigue"
            ],
            'stressed': [
                "Contains magnesium to calm nerves",
                "Helps reduce cortisol (stress hormone)",
                "Grounding and nourishing for relaxation"
            ],
            'sick': [
                "Easy to digest, gentle on stomach",
                "Boosts immune system with key nutrients",
                "Hydrating and healing properties"
            ]
        }
        
        # Choose random benefit from mood category
        mood_benefits = benefits.get(mood, ["Nutritionally balanced for your wellbeing"])
        return random.choice(mood_benefits)
    
    def _generate_mood_insights(
        self,
        mood: str,
        mood_profile: Dict,
        recommendations: List[Dict]
    ) -> List[str]:
        """Generate actionable insights for the mood"""
        insights = []
        
        # Calculate average macros
        if recommendations:
            avg_protein = sum(d.get('protein', 0) for d in recommendations) / len(recommendations)
            avg_carbs = sum(d.get('carbs', 0) for d in recommendations) / len(recommendations)
            
            if mood == 'sad' and avg_protein > 15:
                insights.append("✅ High protein content supports neurotransmitter production for better mood")
            
            if mood == 'tired' and avg_carbs > 30:
                insights.append("⚡ Complex carbs provide sustained energy release")
            
            if mood == 'stressed':
                insights.append("🧘 These foods contain calming nutrients like magnesium and B-vitamins")
            
            if mood == 'sick':
                insights.append("🌿 Light, digestible options support recovery and immune function")
            
            if mood == 'happy':
                insights.append("😊 Balanced nutrition helps maintain your positive energy")
        
        # Add Ayurvedic insight
        ayur_type = mood_profile['ayurvedic']
        ayur_desc = {
            'sattvic': 'Sattvic (pure, calming) foods for balance and clarity',
            'rajasic': 'Rajasic (stimulating, energizing) foods for vitality'
        }
        insights.append(f"🕉️ {ayur_desc.get(ayur_type, 'Balanced foods')}")
        
        return insights
    
    def _get_wellness_tip(self, mood: str) -> str:
        """Get a wellness tip for the mood"""
        tips = {
            'happy': "💡 Stay hydrated and maintain regular meals to keep energy steady",
            'sad': "💡 Combine these foods with sunlight exposure and gentle exercise for best results",
            'tired': "💡 Pair these meals with 7-8 hours of sleep and stay hydrated throughout the day",
            'stressed': "💡 Practice deep breathing before meals and eat slowly in a calm environment",
            'sick': "💡 Eat small, frequent meals and increase fluid intake for faster recovery"
        }
        return tips.get(mood, "💡 Listen to your body and eat mindfully")
