import React, { useState, useEffect } from 'react'
import { FiArrowLeft, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import CalorieAlert from './CalorieAlert'

interface Dish {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image?: string
  category?: string
  emoji?: string
}

interface Meal {
  name: string
  serving_size: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type?: string
}

interface Message {
  text: string
  type: 'error' | 'success' | 'info' | ''
}

interface MealLoggerProps {
  onBack: () => void
  onMealLogged?: () => void
}

export default function MealLogger({ onBack, onMealLogged }: MealLoggerProps) {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selectedDish, setSelectedDish] = useState<string>('')
  const [servingSize, setServingSize] = useState<number>(100)
  const [mealType, setMealType] = useState<string>('lunch')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<Message>({ text: '', type: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [calorieWarning, setCalorieWarning] = useState<any>(null)

  // Mock categories - replace with actual categories from your data
  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snacks']

  useEffect(() => {
    fetchDishes()
  }, [])

  const fetchDishes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(import.meta.env.VITE_API_URL ? 
        `${import.meta.env.VITE_API_URL}/dishes` : 'http://localhost:8000/dishes')
      const data = await response.json()
      setDishes(data)
    } catch (error) {
      console.error('Failed to fetch dishes:', error)
      setMessage({ text: 'Failed to load dishes. Please try again.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDishSelect = (dishName: string) => {
    setSelectedDish(dishName)
    const dish = dishes.find(d => d.name === dishName)
    if (dish) {
      setMessage({ 
        text: `${dish.name} selected (${servingSize}g)`, 
        type: 'info' as const
      })
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDish) {
      setMessage({ text: 'Please select a dish', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setCalorieWarning(null) // Clear previous warning
    try {
      const dish = dishes.find(d => d.name === selectedDish)
      if (!dish) {
        setMessage({ text: 'Dish not found', type: 'error' })
        return
      }

      const meal: Meal = {
        name: dish.name,
        serving_size: servingSize,
        unit: 'g',
        calories: Math.round((dish.calories * servingSize) / 100),
        protein: +((dish.protein * servingSize) / 100).toFixed(1),
        carbs: +((dish.carbs * servingSize) / 100).toFixed(1),
        fat: +((dish.fat * servingSize) / 100).toFixed(1),
        meal_type: mealType
      }

      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(import.meta.env.VITE_API_URL ? 
        `${import.meta.env.VITE_API_URL}/meals` : 'http://localhost:8000/meals', {
        method: 'POST',
        headers,
        body: JSON.stringify(meal),
      })

      if (!response.ok) throw new Error('Failed to log meal')
      
      const data = await response.json()
      
      // Check if there's a calorie warning
      if (data.calorie_warning) {
        setCalorieWarning(data.calorie_warning)
      }
      
      setMessage({ 
        text: 'Meal logged successfully!', 
        type: 'success' 
      })
      setSelectedDish('')
      setServingSize(100)
      
      // Notify parent to refresh meals
      if (onMealLogged) {
        onMealLogged()
      }
    } catch (error) {
      console.error('Error logging meal:', error)
      setMessage({ 
        text: 'Failed to log meal. Please try again.', 
        type: 'error' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleServingSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setServingSize(value)
      if (selectedDish) {
        const dish = dishes.find(d => d.name === selectedDish)
        if (dish) {
          setMessage({ 
            text: `${dish.name} selected (${value}g)`, 
            type: 'info' 
          })
        }
      }
    }
  }

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const selectedDishData = dishes.find(dish => dish.name === selectedDish)

  return (
    <div className="max-w-4xl w-full mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Log Your Meal</h1>
          <p className="text-gray-600 mt-1">Track your nutrition by logging your meals</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Search and Dish Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filter */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a dish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 text-sm rounded-full capitalize ${
                        selectedCategory === category
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dish Grid */}
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <FiLoader className="animate-spin h-8 w-8 text-primary-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredDishes.map((dish) => (
                    <button
                      key={dish.id || dish.name}
                      onClick={() => setSelectedDish(dish.name)}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                        selectedDish === dish.name
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-2">
                        <span className="text-xl">{dish.emoji || '🍽️'}</span>
                      </div>
                      <span className="text-sm font-medium text-center">{dish.name}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {Math.round(dish.calories)} kcal
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Selected Dish and Nutrition */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-5 sticky top-6">
                <h3 className="font-medium text-gray-900 mb-4">Meal Details</h3>
                
                {selectedDishData ? (
                  <div className="space-y-4">
                    {/* Meal Type Selector */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setMealType(type)}
                            className={`px-4 py-2 text-sm rounded-lg capitalize transition-all ${
                              mealType === type
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{selectedDishData.name}</h4>
                          <p className="text-sm text-gray-500">Serving size</p>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            value={servingSize}
                            onChange={handleServingSizeChange}
                            className="w-20 px-2 py-1 text-right border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <span className="ml-2 text-sm text-gray-500">g</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Calories</span>
                          <span className="font-medium">
                            {Math.round((selectedDishData.calories * servingSize) / 100)} kcal
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Protein</span>
                          <span className="font-medium">
                            {((selectedDishData.protein * servingSize) / 100).toFixed(1)}g
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Carbs</span>
                          <span className="font-medium">
                            {((selectedDishData.carbs * servingSize) / 100).toFixed(1)}g
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Fat</span>
                          <span className="font-medium">
                            {((selectedDishData.fat * servingSize) / 100).toFixed(1)}g
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <FiLoader className="animate-spin mr-2" />
                          Logging...
                        </>
                      ) : (
                        'Log This Meal'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">
                      Select a dish to view nutrition information
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calorie Warning Alert */}
      {calorieWarning && (
        <div className="mt-6">
          <CalorieAlert 
            warning={calorieWarning} 
            onDismiss={() => setCalorieWarning(null)} 
          />
        </div>
      )}

      {/* Message Alert */}
      {message.text && (
        <div
          className={`fixed bottom-6 right-6 max-w-sm p-4 rounded-lg shadow-lg ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-800 border-l-4 border-red-500' 
              : message.type === 'success'
              ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
              : 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex items-start">
            {message.type === 'error' ? (
              <FiAlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            ) : message.type === 'success' ? (
              <FiCheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div>
              <p className="text-sm font-medium">
                {message.type === 'error' 
                  ? 'Error' 
                  : message.type === 'success'
                  ? 'Success!'
                  : 'Info'}
              </p>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
