import { useState, useEffect } from 'react'

interface Meal {
  id: number
  name: string
  serving_size: number
  unit: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  timestamp: string
}

interface NutritionGoal {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Recommendation {
  id: string
  name: string
  description: string
  reason: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  difficulty: 'easy' | 'medium' | 'hard'
  prepTime: string
  ingredients: string[]
  instructions: string[]
  image?: string
}

export default function SmartRecommendations() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [goals, setGoals] = useState<NutritionGoal>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65
  })
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [mealsResponse, goalsResponse] = await Promise.all([
        fetch('http://localhost:8000/meals'),
        fetch('http://localhost:8000/gamification/stats')
      ])
      
      const mealsData = await mealsResponse.json()
      const statsData = await goalsResponse.json()
      
      setMeals(mealsData)
      
      // Generate smart recommendations based on current nutrition status
      const recs = generateRecommendations(mealsData, statsData)
      setRecommendations(recs)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      // Generate recommendations even if backend fails
      const recs = generateRecommendations([], {})
      setRecommendations(recs)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = (meals: Meal[], stats: any): Recommendation[] => {
    const today = new Date().toDateString()
    const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === today)
    
    // Calculate today's nutrition
    const todayNutrition = todayMeals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    // Calculate remaining needs
    const remaining = {
      calories: Math.max(0, goals.calories - todayNutrition.calories),
      protein: Math.max(0, goals.protein - todayNutrition.protein),
      carbs: Math.max(0, goals.carbs - todayNutrition.carbs),
      fat: Math.max(0, goals.fat - todayNutrition.fat)
    }

    const allRecommendations: Recommendation[] = [
      // High Protein Recommendations
      {
        id: 'protein-bowl',
        name: 'Protein Power Bowl 🥗',
        description: 'High-protein meal with lean chicken, quinoa, and vegetables',
        reason: 'Boost your protein intake to meet daily goals',
        nutrition: { calories: 450, protein: 35, carbs: 45, fat: 15 },
        category: 'lunch',
        difficulty: 'easy',
        prepTime: '20 min',
        ingredients: ['Chicken breast', 'Quinoa', 'Broccoli', 'Cherry tomatoes', 'Olive oil'],
        instructions: [
          'Cook quinoa according to package instructions',
          'Grill chicken breast until cooked through',
          'Steam broccoli until tender-crisp',
          'Combine all ingredients in a bowl',
          'Drizzle with olive oil and season to taste'
        ]
      },
      {
        id: 'greek-yogurt-parfait',
        name: 'Greek Yogurt Protein Parfait 🍓',
        description: 'Creamy yogurt with berries and nuts for protein boost',
        reason: 'Perfect protein-rich breakfast or snack',
        nutrition: { calories: 280, protein: 25, carbs: 22, fat: 12 },
        category: 'breakfast',
        difficulty: 'easy',
        prepTime: '5 min',
        ingredients: ['Greek yogurt', 'Mixed berries', 'Almonds', 'Honey', 'Granola'],
        instructions: [
          'Layer Greek yogurt in a glass',
          'Add mixed berries',
          'Sprinkle with granola and almonds',
          'Drizzle with honey',
          'Serve immediately'
        ]
      },
      // High Calorie Recommendations
      {
        id: 'nutrient-dense-smoothie',
        name: 'Nutrient-Dense Smoothie Bowl 🥤',
        description: 'Calorie-rich smoothie with healthy fats and protein',
        reason: 'Great way to add calories and nutrients',
        nutrition: { calories: 520, protein: 18, carbs: 65, fat: 22 },
        category: 'breakfast',
        difficulty: 'easy',
        prepTime: '10 min',
        ingredients: ['Banana', 'Peanut butter', 'Oats', 'Milk', 'Chia seeds', 'Honey'],
        instructions: [
          'Blend banana, peanut butter, and milk',
          'Add oats and blend until smooth',
          'Pour into a bowl',
          'Top with chia seeds and honey',
          'Garnish with fresh fruit'
        ]
      },
      // Balanced Meal Recommendations
      {
        id: 'balanced-dinner',
        name: 'Balanced Mediterranean Plate 🍽️',
        description: 'Well-rounded meal with fish, grains, and vegetables',
        reason: 'Balanced nutrition for overall health',
        nutrition: { calories: 480, protein: 28, carbs: 52, fat: 18 },
        category: 'dinner',
        difficulty: 'medium',
        prepTime: '25 min',
        ingredients: ['Salmon fillet', 'Brown rice', 'Asparagus', 'Lemon', 'Herbs', 'Olive oil'],
        instructions: [
          'Season salmon with herbs and lemon',
          'Bake salmon at 400°F for 15 minutes',
          'Cook brown rice according to package',
          'Sauté asparagus in olive oil',
          'Plate and serve with lemon wedges'
        ]
      },
      // Quick Snack Recommendations - EXPANDED!
      {
        id: 'energy-balls',
        name: 'Energy Protein Balls 🍫',
        description: 'Homemade protein balls for quick energy boost',
        reason: 'Perfect snack to fill nutrition gaps',
        nutrition: { calories: 180, protein: 8, carbs: 22, fat: 8 },
        category: 'snack',
        difficulty: 'easy',
        prepTime: '15 min',
        ingredients: ['Dates', 'Nuts', 'Protein powder', 'Coconut', 'Chocolate chips'],
        instructions: [
          'Soak dates in warm water for 10 minutes',
          'Blend dates and nuts in food processor',
          'Mix in protein powder and coconut',
          'Form into balls',
          'Roll in coconut and refrigerate'
        ]
      },
      {
        id: 'trail-mix',
        name: 'Custom Trail Mix 🥜',
        description: 'Nutritious mix of nuts, seeds, and dried fruits',
        reason: 'Great protein and healthy fats for energy',
        nutrition: { calories: 220, protein: 6, carbs: 18, fat: 16 },
        category: 'snack',
        difficulty: 'easy',
        prepTime: '5 min',
        ingredients: ['Almonds', 'Walnuts', 'Pumpkin seeds', 'Dried cranberries', 'Dark chocolate chips'],
        instructions: [
          'Mix all ingredients in a bowl',
          'Portion into small containers',
          'Store in an airtight container',
          'Enjoy as a quick snack'
        ]
      },
      {
        id: 'hummus-veggies',
        name: 'Hummus & Veggie Sticks 🥕',
        description: 'Creamy hummus with fresh vegetable sticks',
        reason: 'Fiber-rich snack with plant protein',
        nutrition: { calories: 160, protein: 6, carbs: 20, fat: 8 },
        category: 'snack',
        difficulty: 'easy',
        prepTime: '10 min',
        ingredients: ['Chickpeas', 'Tahini', 'Lemon', 'Garlic', 'Carrots', 'Cucumber', 'Bell peppers'],
        instructions: [
          'Blend chickpeas, tahini, lemon, and garlic',
          'Cut vegetables into sticks',
          'Serve hummus with veggie sticks',
          'Season with salt and pepper to taste'
        ]
      },
      {
        id: 'apple-nut-butter',
        name: 'Apple with Nut Butter 🍎',
        description: 'Fresh apple slices with almond or peanut butter',
        reason: 'Simple, nutritious snack with natural sugars',
        nutrition: { calories: 200, protein: 4, carbs: 25, fat: 12 },
        category: 'snack',
        difficulty: 'easy',
        prepTime: '3 min',
        ingredients: ['Apple', 'Almond butter', 'Cinnamon', 'Honey (optional)'],
        instructions: [
          'Wash and slice apple',
          'Spread almond butter on slices',
          'Sprinkle with cinnamon',
          'Drizzle with honey if desired'
        ]
      },
      {
        id: 'yogurt-berries',
        name: 'Berry Yogurt Cup 🫐',
        description: 'Greek yogurt topped with fresh berries and granola',
        reason: 'Protein-rich snack with antioxidants',
        nutrition: { calories: 150, protein: 15, carbs: 18, fat: 4 },
        category: 'snack',
        difficulty: 'easy',
        prepTime: '5 min',
        ingredients: ['Greek yogurt', 'Mixed berries', 'Granola', 'Honey'],
        instructions: [
          'Scoop yogurt into a cup',
          'Top with fresh berries',
          'Sprinkle with granola',
          'Drizzle with honey'
        ]
      },
      // Vegetarian Options
      {
        id: 'lentil-curry',
        name: 'Spicy Lentil Curry 🍛',
        description: 'Protein-rich vegetarian curry with lentils and vegetables',
        reason: 'Great plant-based protein source',
        nutrition: { calories: 420, protein: 22, carbs: 68, fat: 8 },
        category: 'dinner',
        difficulty: 'medium',
        prepTime: '30 min',
        ingredients: ['Red lentils', 'Onion', 'Tomatoes', 'Ginger', 'Garlic', 'Spices'],
        instructions: [
          'Sauté onion, ginger, and garlic',
          'Add spices and cook until fragrant',
          'Add lentils and tomatoes',
          'Simmer until lentils are tender',
          'Serve with rice or bread'
        ]
      },
      // Additional Breakfast Options
      {
        id: 'oatmeal-bowl',
        name: 'Superfood Oatmeal Bowl 🥣',
        description: 'Nutritious oatmeal with fruits, nuts, and seeds',
        reason: 'Perfect start to your day with complex carbs and fiber',
        nutrition: { calories: 320, protein: 12, carbs: 55, fat: 10 },
        category: 'breakfast',
        difficulty: 'easy',
        prepTime: '8 min',
        ingredients: ['Oats', 'Milk', 'Banana', 'Berries', 'Chia seeds', 'Honey', 'Almonds'],
        instructions: [
          'Cook oats with milk until creamy',
          'Top with sliced banana and berries',
          'Sprinkle with chia seeds and almonds',
          'Drizzle with honey',
          'Serve warm'
        ]
      },
      // Additional Lunch Options
      {
        id: 'quinoa-salad',
        name: 'Fresh Quinoa Garden Salad 🌱',
        description: 'Light and refreshing quinoa salad with vegetables',
        reason: 'Great for a healthy, protein-rich lunch',
        nutrition: { calories: 380, protein: 18, carbs: 48, fat: 14 },
        category: 'lunch',
        difficulty: 'easy',
        prepTime: '15 min',
        ingredients: ['Quinoa', 'Cucumber', 'Cherry tomatoes', 'Red onion', 'Feta cheese', 'Olive oil', 'Lemon'],
        instructions: [
          'Cook quinoa and let it cool',
          'Chop vegetables and mix with quinoa',
          'Add crumbled feta cheese',
          'Dress with olive oil and lemon juice',
          'Season with salt and pepper'
        ]
      }
    ]

    // Always return all recommendations - let the frontend filtering handle it
    // Add personalized reasons based on current nutrition status
    const personalizedRecs = allRecommendations.map(rec => ({
      ...rec,
      reason: getPersonalizedReason(rec, remaining, todayNutrition)
    }))

    return personalizedRecs
  }

  const getPersonalizedReason = (rec: Recommendation, remaining: any, today: any): string => {
    if (remaining.protein > 30) {
      return `You need ${Math.round(remaining.protein)}g more protein today. This meal provides ${rec.nutrition.protein}g!`
    }
    if (remaining.calories > 500) {
      return `You're ${Math.round(remaining.calories)} calories short today. This meal adds ${rec.nutrition.calories} calories!`
    }
    if (remaining.carbs > 50) {
      return `Boost your energy with ${rec.nutrition.carbs}g of healthy carbs!`
    }
    return rec.reason
  }

  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory
    const difficultyMatch = selectedDifficulty === 'all' || rec.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🤖 Smart Recommendations</h2>
        <p className="text-green-100">AI-powered meal suggestions based on your nutrition goals</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filter Recommendations</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecommendations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            {/* Recipe Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{rec.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  rec.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  rec.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {rec.difficulty}
                </span>
              </div>

              {/* Personalized Reason */}
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-700 font-medium">💡 {rec.reason}</p>
              </div>

              {/* Nutrition Info */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-800">{rec.nutrition.calories}</div>
                  <div className="text-xs text-gray-500">cal</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">{rec.nutrition.protein}g</div>
                  <div className="text-xs text-gray-500">protein</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-yellow-600">{rec.nutrition.carbs}g</div>
                  <div className="text-xs text-gray-500">carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-red-600">{rec.nutrition.fat}g</div>
                  <div className="text-xs text-gray-500">fat</div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>⏱️ {rec.prepTime}</span>
                <span>🍽️ {rec.category}</span>
              </div>

              {/* Ingredients Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Ingredients:</h4>
                <div className="flex flex-wrap gap-1">
                  {rec.ingredients.slice(0, 4).map((ingredient, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                      {ingredient}
                    </span>
                  ))}
                  {rec.ingredients.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                      +{rec.ingredients.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  🍽️ Cook This
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  📖 View Recipe
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Recommendations */}
      {filteredRecommendations.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-4xl mb-4">🤔</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Recommendations Found</h3>
          <p className="text-gray-600">Try adjusting your filters or log more meals to get personalized suggestions!</p>
        </div>
      )}
    </div>
  )
}
