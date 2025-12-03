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

export default function NutritionAnalytics() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('day') // day, week, month
  const [goals, setGoals] = useState<NutritionGoal>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65
  })

  useEffect(() => {
    fetchMeals()
  }, [])

  const fetchMeals = async () => {
    try {
      const response = await fetch('http://localhost:8000/meals')
      const data = await response.json()
      setMeals(data)
    } catch (error) {
      console.error('Failed to fetch meals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeRangeData = () => {
    const now = new Date()
    const data: { [key: string]: { calories: number; protein: number; carbs: number; fat: number; count: number } } = {}

    // Add today's entry first
    if (timeRange === 'day') {
      const today = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      data[today] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
    }

    meals.forEach(meal => {
      const mealDate = new Date(meal.timestamp)
      let key = ''

      if (timeRange === 'day') {
        key = mealDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (timeRange === 'week') {
        const weekStart = new Date(mealDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        key = mealDate.toLocaleDateString('en-US', { month: 'short' })
      }

      if (!data[key]) {
        data[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
      }

      data[key].calories += meal.calories || 0
      data[key].protein += meal.protein || 0
      data[key].carbs += meal.carbs || 0
      data[key].fat += meal.fat || 0
      data[key].count += 1
    })

    return data
  }

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100)
  }

  const getInsights = () => {
    if (meals.length === 0) return []

    const insights = []
    const avgCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / meals.length
    const avgProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0) / meals.length

    if (avgCalories < 1500) {
      insights.push({ type: 'info', message: 'Your average calorie intake is on the lower side. Consider adding nutrient-dense foods.' })
    } else if (avgCalories > 2500) {
      insights.push({ type: 'warning', message: 'Your average calorie intake is higher than typical recommendations.' })
    }

    if (avgProtein < 100) {
      insights.push({ type: 'tip', message: 'Try to include more protein-rich foods like lean meats, eggs, or legumes.' })
    }

    if (meals.length >= 3) {
      insights.push({ type: 'success', message: `Great job! You've logged ${meals.length} meals. Consistency is key to tracking nutrition.` })
    }

    return insights
  }

  const timeRangeData = getTimeRangeData()
  const insights = getInsights()

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
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Nutrition Analytics</h2>
        
        {/* Time Range Selector */}
        <div className="flex space-x-2 mb-6">
          {[
            { key: 'day', label: 'Daily' },
            { key: 'week', label: 'Weekly' },
            { key: 'month', label: 'Monthly' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Goals Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Nutrition Goals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'calories', label: 'Calories', value: goals.calories, unit: 'kcal', color: 'blue' },
              { key: 'protein', label: 'Protein', value: goals.protein, unit: 'g', color: 'green' },
              { key: 'carbs', label: 'Carbs', value: goals.carbs, unit: 'g', color: 'yellow' },
              { key: 'fat', label: 'Fat', value: goals.fat, unit: 'g', color: 'red' }
            ].map(({ key, label, value, unit, color }) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 font-medium">{label}</div>
                <div className="text-xl font-bold text-gray-800">{value} {unit}</div>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setGoals(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calories Progress */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Calories Progress</h3>
          <div className="space-y-4">
            {Object.entries(timeRangeData).map(([date, data]) => {
              const progress = getProgressPercentage(data.calories, goals.calories)
              return (
                <div key={date} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{date}</span>
                    <span className="text-gray-600">{Math.round(data.calories)} / {goals.calories} kcal</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Protein Progress */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Protein Progress</h3>
          <div className="space-y-4">
            {Object.entries(timeRangeData).map(([date, data]) => {
              const progress = getProgressPercentage(data.protein, goals.protein)
              return (
                <div key={date} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{date}</span>
                    <span className="text-gray-600">{data.protein.toFixed(1)} / {goals.protein}g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrition Insights</h3>
        {insights.length === 0 ? (
          <p className="text-gray-500">Log more meals to get personalized nutrition insights!</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  insight.type === 'success' ? 'bg-green-50 text-green-700' :
                  insight.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  insight.type === 'tip' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {insight.type === 'success' ? '🎉' :
                     insight.type === 'warning' ? '⚠️' :
                     insight.type === 'tip' ? '💡' : 'ℹ️'}
                  </span>
                  <span className="text-sm">{insight.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{meals.length}</div>
            <div className="text-sm text-gray-600">Total Meals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / meals.length) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {meals.length > 0 ? (meals.reduce((sum, meal) => sum + (meal.protein || 0), 0) / meals.length).toFixed(1) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Protein (g)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {meals.length > 0 ? (meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) / meals.length).toFixed(1) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Carbs (g)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
