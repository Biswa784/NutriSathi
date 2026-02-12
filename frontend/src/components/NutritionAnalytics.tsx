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
  meal_type?: string
  timestamp: string
}

interface NutritionGoal {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface UserProfile {
  weight?: number
  height?: number
  age?: number
  gender?: string
  activity_level?: string
}

export default function NutritionAnalytics() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week') // day, week, month
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [goals, setGoals] = useState<NutritionGoal>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Fetch meals
      const mealsResponse = await fetch('http://localhost:8000/meals', { headers })
      const mealsData = await mealsResponse.json()
      setMeals(mealsData)

      // Fetch user profile
      try {
        const profileResponse = await fetch('http://localhost:8000/auth/me', { headers })
        const profileData = await profileResponse.json()
        setUserProfile(profileData)
      } catch (error) {
        console.log('No user profile available')
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMeals = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const response = await fetch('http://localhost:8000/meals', { headers })
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

  // Calculate calorie burn based on activity level
  const calculateCalorieBurn = () => {
    if (!userProfile.weight || !userProfile.height || !userProfile.age || !userProfile.gender) {
      return { bmr: 0, tdee: 0 }
    }

    // BMR calculation using Mifflin-St Jeor Equation
    let bmr = 0
    if (userProfile.gender === 'male') {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5
    } else {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    }

    const multiplier = activityMultipliers[userProfile.activity_level || 'sedentary'] || 1.2
    const tdee = bmr * multiplier

    return { bmr: Math.round(bmr), tdee: Math.round(tdee) }
  }

  // Meal timing analysis
  const getMealTimingAnalysis = () => {
    const mealsByTime = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    const caloriesByTime = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }

    meals.forEach(meal => {
      const mealType = meal.meal_type?.toLowerCase() || 'snack'
      if (mealType in mealsByTime) {
        mealsByTime[mealType as keyof typeof mealsByTime]++
        caloriesByTime[mealType as keyof typeof caloriesByTime] += meal.calories || 0
      }
    })

    const avgCaloriesByTime = Object.entries(caloriesByTime).map(([type, total]) => ({
      type,
      avg: mealsByTime[type as keyof typeof mealsByTime] > 0 
        ? Math.round(total / mealsByTime[type as keyof typeof mealsByTime]) 
        : 0,
      count: mealsByTime[type as keyof typeof mealsByTime]
    }))

    return avgCaloriesByTime.sort((a, b) => b.avg - a.avg)
  }

  // Nutrient deficiency detection
  const getNutrientDeficiencies = () => {
    if (meals.length === 0) return []

    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
    const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0)
    const avgProtein = totalProtein / meals.length
    const avgCarbs = totalCarbs / meals.length
    const avgFat = totalFat / meals.length

    const deficiencies = []

    if (avgProtein < 20) {
      deficiencies.push({ nutrient: 'Protein', severity: 'high', message: 'Very low protein intake. Add eggs, chicken, fish, or legumes.' })
    } else if (avgProtein < 30) {
      deficiencies.push({ nutrient: 'Protein', severity: 'medium', message: 'Low protein. Consider adding more protein-rich foods.' })
    }

    if (avgCarbs < 30) {
      deficiencies.push({ nutrient: 'Carbohydrates', severity: 'medium', message: 'Low carb intake. Add whole grains, fruits, or vegetables.' })
    }

    if (avgFat < 10) {
      deficiencies.push({ nutrient: 'Healthy Fats', severity: 'medium', message: 'Low fat intake. Include nuts, avocados, or olive oil.' })
    }

    return deficiencies
  }

  // Weekly trends comparison
  const getWeeklyComparison = () => {
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    currentWeekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(currentWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const currentWeekMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp)
      return mealDate >= currentWeekStart
    })

    const lastWeekMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp)
      return mealDate >= lastWeekStart && mealDate < currentWeekStart
    })

    const currentWeekStats = {
      calories: currentWeekMeals.reduce((sum, m) => sum + (m.calories || 0), 0) / Math.max(currentWeekMeals.length, 1),
      protein: currentWeekMeals.reduce((sum, m) => sum + (m.protein || 0), 0) / Math.max(currentWeekMeals.length, 1),
      carbs: currentWeekMeals.reduce((sum, m) => sum + (m.carbs || 0), 0) / Math.max(currentWeekMeals.length, 1),
      count: currentWeekMeals.length
    }

    const lastWeekStats = {
      calories: lastWeekMeals.reduce((sum, m) => sum + (m.calories || 0), 0) / Math.max(lastWeekMeals.length, 1),
      protein: lastWeekMeals.reduce((sum, m) => sum + (m.protein || 0), 0) / Math.max(lastWeekMeals.length, 1),
      carbs: lastWeekMeals.reduce((sum, m) => sum + (m.carbs || 0), 0) / Math.max(lastWeekMeals.length, 1),
      count: lastWeekMeals.length
    }

    return { current: currentWeekStats, last: lastWeekStats }
  }

  // Export to PDF
  const exportToPDF = () => {
    const timeRangeData = getTimeRangeData()
    const { bmr, tdee } = calculateCalorieBurn()
    const weekComparison = getWeeklyComparison()

    let content = `NUTRITION ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

=== SUMMARY ===
Total Meals Logged: ${meals.length}
Average Calories: ${meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / meals.length) : 0} kcal
Average Protein: ${meals.length > 0 ? (meals.reduce((sum, meal) => sum + (meal.protein || 0), 0) / meals.length).toFixed(1) : 0}g
Average Carbs: ${meals.length > 0 ? (meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) / meals.length).toFixed(1) : 0}g
Average Fat: ${meals.length > 0 ? (meals.reduce((sum, meal) => sum + (meal.fat || 0), 0) / meals.length).toFixed(1) : 0}g

=== CALORIE BURN ESTIMATION ===
Basal Metabolic Rate (BMR): ${bmr} kcal/day
Total Daily Energy Expenditure (TDEE): ${tdee} kcal/day

=== WEEKLY COMPARISON ===
Current Week: ${weekComparison.current.count} meals, ${Math.round(weekComparison.current.calories)} avg kcal
Last Week: ${weekComparison.last.count} meals, ${Math.round(weekComparison.last.calories)} avg kcal
Change: ${weekComparison.current.count - weekComparison.last.count} meals

=== MEAL DATA ===
${Object.entries(timeRangeData).map(([date, data]) => 
  `${date}: ${Math.round(data.calories)} kcal, ${data.protein.toFixed(1)}g protein, ${data.count} meals`
).join('\n')}

=== RECENT MEALS ===
${meals.slice(-10).reverse().map(meal => 
  `${new Date(meal.timestamp).toLocaleString()} - ${meal.name}: ${meal.calories || 0} kcal`
).join('\n')}
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutrition-analytics-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
  const { bmr, tdee } = calculateCalorieBurn()
  const mealTimingAnalysis = getMealTimingAnalysis()
  const nutrientDeficiencies = getNutrientDeficiencies()
  const weekComparison = getWeeklyComparison()

  if (isLoading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'40px'}}>
        <div style={{fontSize:48}}>⏳</div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:'1200px',width:'100%',display:'flex',flexDirection:'column',gap:'16px'}}>
      {/* Header */}
      <div style={{background:'#fff',borderRadius:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',padding:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h2 style={{fontSize:'24px',fontWeight:'bold',color:'#1f2937',margin:0}}>Nutrition Analytics</h2>
          <button
            onClick={exportToPDF}
            style={{padding:'8px 16px',background:'#4f46e5',color:'#fff',borderRadius:'8px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}
          >
            <span>📄</span>
            <span>Export Report</span>
          </button>
        </div>
        
        {/* Time Range Selector */}
        <div style={{display:'flex',gap:'8px',marginBottom:'24px'}}>
          {[
            { key: 'day', label: 'Daily' },
            { key: 'week', label: 'Weekly' },
            { key: 'month', label: 'Monthly' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              style={{
                padding:'8px 16px',
                borderRadius:'8px',
                fontWeight:500,
                border:'none',
                cursor:'pointer',
                background: timeRange === key ? '#4f46e5' : '#f3f4f6',
                color: timeRange === key ? '#fff' : '#6b7280'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Goals Section */}
        <div style={{marginBottom:'24px'}}>
          <h3 style={{fontSize:'18px',fontWeight:600,color:'#1f2937',marginBottom:'16px'}}>Daily Nutrition Goals</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'16px'}}>
            {[
              { key: 'calories', label: 'Calories', value: goals.calories, unit: 'kcal' },
              { key: 'protein', label: 'Protein', value: goals.protein, unit: 'g' },
              { key: 'carbs', label: 'Carbs', value: goals.carbs, unit: 'g' },
              { key: 'fat', label: 'Fat', value: goals.fat, unit: 'g' }
            ].map(({ key, label, value, unit }) => (
              <div key={key} style={{background:'#f9fafb',padding:'16px',borderRadius:'8px'}}>
                <div style={{fontSize:'14px',color:'#6b7280',fontWeight:500}}>{label}</div>
                <div style={{fontSize:'20px',fontWeight:700,color:'#1f2937',margin:'4px 0'}}>{value} {unit}</div>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setGoals(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{marginTop:'8px',width:'100%',padding:'4px 8px',fontSize:'14px',border:'1px solid #d1d5db',borderRadius:'4px'}}
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Comparison */}
      {weekComparison.last.count > 0 && (
        <div style={{background:'linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)',borderRadius:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',padding:'24px'}}>
          <h3 style={{fontSize:'18px',fontWeight:600,color:'#1f2937',marginBottom:'16px'}}>📊 Weekly Trends</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px'}}>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>Average Calories</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:'24px',fontWeight:700,color:'#1f2937'}}>{Math.round(weekComparison.current.calories)}</div>
                <div style={{
                  display:'flex',
                  alignItems:'center',
                  fontSize:'14px',
                  fontWeight:600,
                  color: weekComparison.current.calories > weekComparison.last.calories ? '#dc2626' : '#16a34a'
                }}>
                  {weekComparison.current.calories > weekComparison.last.calories ? '↑' : '↓'}
                  {Math.abs(Math.round(weekComparison.current.calories - weekComparison.last.calories))} kcal
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>vs last week: {Math.round(weekComparison.last.calories)} kcal</div>
            </div>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>Average Protein</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:'24px',fontWeight:700,color:'#1f2937'}}>{weekComparison.current.protein.toFixed(1)}g</div>
                <div style={{
                  display:'flex',
                  alignItems:'center',
                  fontSize:'14px',
                  fontWeight:600,
                  color: weekComparison.current.protein > weekComparison.last.protein ? '#16a34a' : '#dc2626'
                }}>
                  {weekComparison.current.protein > weekComparison.last.protein ? '↑' : '↓'}
                  {Math.abs((weekComparison.current.protein - weekComparison.last.protein)).toFixed(1)}g
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>vs last week: {weekComparison.last.protein.toFixed(1)}g</div>
            </div>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>Meals Logged</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:'24px',fontWeight:700,color:'#1f2937'}}>{weekComparison.current.count}</div>
                <div style={{
                  display:'flex',
                  alignItems:'center',
                  fontSize:'14px',
                  fontWeight:600,
                  color: weekComparison.current.count > weekComparison.last.count ? '#16a34a' : '#dc2626'
                }}>
                  {weekComparison.current.count > weekComparison.last.count ? '↑' : '↓'}
                  {Math.abs(weekComparison.current.count - weekComparison.last.count)} meals
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>vs last week: {weekComparison.last.count} meals</div>
            </div>
          </div>
        </div>
      )}

      {/* Calorie Burn Estimation */}
      {(bmr > 0 || tdee > 0) && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 Calorie Burn Estimation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Basal Metabolic Rate (BMR)</div>
              <div className="text-3xl font-bold text-orange-600">{bmr}</div>
              <div className="text-xs text-gray-500 mt-1">Calories burned at rest per day</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Daily Energy Expenditure (TDEE)</div>
              <div className="text-3xl font-bold text-yellow-600">{tdee}</div>
              <div className="text-xs text-gray-500 mt-1">Total calories burned per day (including activity)</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-700">
              💡 Based on your profile, you burn approximately <strong>{tdee} calories per day</strong>. 
              {meals.length > 0 && (
                <span> Your average intake is <strong>{Math.round(meals.reduce((sum, m) => sum + (m.calories || 0), 0) / meals.length)} kcal</strong> per meal.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nutrient Deficiency Alerts */}
      {nutrientDeficiencies.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Nutrient Deficiency Alerts</h3>
          <div className="space-y-3">
            {nutrientDeficiencies.map((def, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg ${
                  def.severity === 'high' ? 'bg-red-100 border border-red-300' : 'bg-yellow-100 border border-yellow-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{def.severity === 'high' ? '🚨' : '⚡'}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{def.nutrient} Deficiency</div>
                    <div className="text-sm text-gray-700 mt-1">{def.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal Timing Analysis */}
      {mealTimingAnalysis.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⏰ Meal Timing Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mealTimingAnalysis.map((item, index) => {
              const icons: { [key: string]: string } = {
                breakfast: '🌅',
                lunch: '☀️',
                dinner: '🌙',
                snack: '🍎'
              }
              const isBest = index === 0
              const isWorst = index === mealTimingAnalysis.length - 1
              
              return (
                <div 
                  key={item.type}
                  className={`p-4 rounded-lg ${
                    isBest ? 'bg-green-100 border-2 border-green-400' : 
                    isWorst ? 'bg-gray-100 border border-gray-300' : 
                    'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{icons[item.type]}</span>
                    {isBest && <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded">BEST</span>}
                    {isWorst && item.count > 0 && <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded">LOWEST</span>}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 capitalize">{item.type}</div>
                  <div className="text-2xl font-bold text-gray-800">{item.avg}</div>
                  <div className="text-xs text-gray-500">avg kcal ({item.count} meals)</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700">
            💡 <strong>Insight:</strong> Your {mealTimingAnalysis[0]?.type || 'meals'} tend to be most calorie-dense. 
            Consider balancing your intake throughout the day for better energy levels.
          </div>
        </div>
      )}

      {/* Visual Charts - Line Chart for Calories Over Time */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Calorie Trends</h3>
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 800 250">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="50"
                y1={50 + i * 40}
                x2="750"
                y2={50 + i * 40}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 500, 1000, 1500, 2000].reverse().map((val, i) => (
              <text
                key={val}
                x="40"
                y={55 + i * 40}
                fontSize="12"
                fill="#6b7280"
                textAnchor="end"
              >
                {val}
              </text>
            ))}

            {/* Line chart */}
            {Object.entries(timeRangeData).length > 1 && (
              <polyline
                points={Object.entries(timeRangeData).map(([date, data], index) => {
                  const x = 50 + (index * (700 / (Object.entries(timeRangeData).length - 1)))
                  const y = 210 - ((data.calories / 2000) * 160)
                  return `${x},${Math.max(50, Math.min(210, y))}`
                }).join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {Object.entries(timeRangeData).map(([date, data], index) => {
              const x = 50 + (index * (700 / Math.max(Object.entries(timeRangeData).length - 1, 1)))
              const y = 210 - ((data.calories / 2000) * 160)
              return (
                <g key={date}>
                  <circle
                    cx={x}
                    cy={Math.max(50, Math.min(210, y))}
                    r="5"
                    fill="#4f46e5"
                  />
                  <text
                    x={x}
                    y="235"
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {date.substring(0, 6)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Calorie intake over time (Goal: {goals.calories} kcal)
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
