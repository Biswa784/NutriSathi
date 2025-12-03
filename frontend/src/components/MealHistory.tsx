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

export default function MealHistory() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, week, month

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

  const getFilteredMeals = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return meals.filter(meal => {
      const mealDate = new Date(meal.timestamp)
      switch (filter) {
        case 'today':
          return mealDate >= today
        case 'week':
          return mealDate >= weekAgo
        case 'month':
          return mealDate >= monthAgo
        default:
          return true
      }
    })
  }

  const getTotalNutrition = () => {
    const filteredMeals = getFilteredMeals()
    return filteredMeals.reduce(
      (total, meal) => ({
        calories: (total.calories || 0) + (meal.calories || 0),
        protein: (total.protein || 0) + (meal.protein || 0),
        carbs: (total.carbs || 0) + (meal.carbs || 0),
        fat: (total.fat || 0) + (meal.fat || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const filteredMeals = getFilteredMeals()
  const totalNutrition = getTotalNutrition()

  return (
    <div className="max-w-4xl w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Meal History</h2>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { key: 'all', label: 'All Time', count: meals.length },
            { key: 'today', label: 'Today', count: meals.filter(m => new Date(m.timestamp) >= new Date(new Date().setHours(0,0,0,0))).length },
            { key: 'week', label: 'This Week', count: meals.filter(m => new Date(m.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
            { key: 'month', label: 'This Month', count: meals.filter(m => new Date(m.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Nutrition Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Calories</div>
            <div className="text-2xl font-bold text-blue-800">
              {Math.round(totalNutrition.calories || 0)} kcal
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Protein</div>
            <div className="text-2xl font-bold text-green-800">
              {totalNutrition.protein?.toFixed(1) || 0}g
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Total Carbs</div>
            <div className="text-2xl font-bold text-yellow-800">
              {totalNutrition.carbs?.toFixed(1) || 0}g
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Total Fat</div>
            <div className="text-2xl font-bold text-red-800">
              {totalNutrition.fat?.toFixed(1) || 0}g
            </div>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        {filteredMeals.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No meals logged yet</h3>
            <p className="text-gray-500">Start logging your meals to see your nutrition history!</p>
          </div>
        ) : (
          filteredMeals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{meal.name}</h3>
                  <p className="text-sm text-gray-500">
                    {meal.serving_size}{meal.unit} • {formatDate(meal.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    {Math.round(meal.calories || 0)} kcal
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Protein</div>
                  <div className="font-semibold text-green-600">{meal.protein?.toFixed(1) || 0}g</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Carbs</div>
                  <div className="font-semibold text-yellow-600">{meal.carbs?.toFixed(1) || 0}g</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Fat</div>
                  <div className="font-semibold text-red-600">{meal.fat?.toFixed(1) || 0}g</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
