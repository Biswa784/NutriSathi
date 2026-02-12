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
  const [timeRange, setTimeRange] = useState('week')
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [backendCalories, setBackendCalories] = useState<any>(null)
  const [goals, setGoals] = useState<NutritionGoal>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65
  })

  // Calculate AI-suggested goals using backend API (same as Dashboard)
  const calculateSuggestedGoals = () => {
    if (!backendCalories || !backendCalories.tdee) {
      return {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65
      }
    }

    // Use TDEE from backend (exactly same as Dashboard)
    const dailyCalories = backendCalories.tdee
    const dailyProtein = backendCalories.protein || 100
    const dailyCarbs = backendCalories.carbs || 250
    const dailyFat = backendCalories.fat || 65

    // Adjust for time range
    let multiplierByRange = 1
    if (timeRange === 'week') {
      multiplierByRange = 7
    } else if (timeRange === 'month') {
      multiplierByRange = 30
    }

    return {
      calories: Math.round(dailyCalories * multiplierByRange),
      protein: Math.round(dailyProtein * multiplierByRange),
      carbs: Math.round(dailyCarbs * multiplierByRange),
      fat: Math.round(dailyFat * multiplierByRange)
    }
  }

  // Update goals when backend calories or time range changes
  useEffect(() => {
    const suggestedGoals = calculateSuggestedGoals()
    setGoals(suggestedGoals)
  }, [backendCalories, timeRange])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nutrisathi_token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      console.log('Fetching meals with token:', token ? 'Present' : 'Missing')
      
      const mealsResponse = await fetch('http://localhost:8000/meals', { headers })
      console.log('Meals response status:', mealsResponse.status)
      
      if (!mealsResponse.ok) {
        throw new Error(`Failed to fetch meals: ${mealsResponse.status}`)
      }
      
      const mealsData = await mealsResponse.json()
      console.log('Fetched meals:', mealsData.length, 'meals')
      setMeals(mealsData)

      try {
        const profileResponse = await fetch('http://localhost:8000/auth/me', { headers })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          console.log('Fetched profile:', profileData)
          setUserProfile(profileData)
        }
      } catch (error) {
        console.log('No user profile available:', error)
      }

      // Fetch calorie calculation from backend (same as Dashboard)
      try {
        const calorieResponse = await fetch('http://localhost:8000/ai/calculate-calories', {
          method: 'POST',
          headers
        })
        if (calorieResponse.ok) {
          const calorieData = await calorieResponse.json()
          console.log('Fetched calorie calculation:', calorieData)
          setBackendCalories(calorieData)
        }
      } catch (error) {
        console.log('No calorie calculation available:', error)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeRangeData = () => {
    const now = new Date()
    const data: { [key: string]: { calories: number; protein: number; carbs: number; fat: number; count: number } } = {}

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

  const calculateCalorieBurn = () => {
    // Use backend calculation if available (matches Dashboard exactly)
    if (backendCalories && backendCalories.bmr && backendCalories.tdee) {
      return {
        bmr: backendCalories.bmr,
        tdee: backendCalories.tdee
      }
    }

    // Fallback to local calculation if backend data not available
    if (!userProfile.weight || !userProfile.height || !userProfile.age || !userProfile.gender) {
      return { bmr: 0, tdee: 0 }
    }

    let bmr = 0
    if (userProfile.gender === 'male') {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5
    } else {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161
    }

    const activityMultipliers: { [key: string]: number} = {
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

  const getNutrientDeficiencies = () => {
    if (meals.length === 0) return []

    const avgProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0) / meals.length
    const avgCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) / meals.length
    const avgFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0) / meals.length

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
      count: currentWeekMeals.length
    }

    const lastWeekStats = {
      calories: lastWeekMeals.reduce((sum, m) => sum + (m.calories || 0), 0) / Math.max(lastWeekMeals.length, 1),
      protein: lastWeekMeals.reduce((sum, m) => sum + (m.protein || 0), 0) / Math.max(lastWeekMeals.length, 1),
      count: lastWeekMeals.length
    }

    return { current: currentWeekStats, last: lastWeekStats }
  }

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

=== CALORIE BURN ESTIMATION ===
BMR: ${bmr} kcal/day
TDEE: ${tdee} kcal/day

=== WEEKLY COMPARISON ===
Current Week: ${weekComparison.current.count} meals, ${Math.round(weekComparison.current.calories)} avg kcal
Last Week: ${weekComparison.last.count} meals, ${Math.round(weekComparison.last.calories)} avg kcal

=== MEAL DATA ===
${Object.entries(timeRangeData).map(([date, data]) => 
  `${date}: ${Math.round(data.calories)} kcal, ${data.protein.toFixed(1)}g protein, ${data.count} meals`
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

  const timeRangeData = getTimeRangeData()
  const { bmr, tdee } = calculateCalorieBurn()
  const mealTimingAnalysis = getMealTimingAnalysis()
  const nutrientDeficiencies = getNutrientDeficiencies()
  const weekComparison = getWeeklyComparison()

  // Debug logging
  console.log('🔍 Rendering analytics with:', {
    mealsCount: meals.length,
    timeRangeDataEntries: Object.entries(timeRangeData).length,
    timeRangeDataKeys: Object.keys(timeRangeData),
    timeRange
  })

  if (isLoading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'40px'}}>
        <div style={{fontSize:48}}>⏳</div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:'1200px',width:'100%'}}>
      {/* Header */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h2 style={{fontSize:'24px',fontWeight:'bold',margin:0}}>Nutrition Analytics</h2>
          <button
            onClick={exportToPDF}
            className="btn"
            style={{background:'#4f46e5',display:'flex',alignItems:'center',gap:'8px'}}
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
              className="btn"
              style={{
                background: timeRange === key ? '#4f46e5' : '#f3f4f6',
                color: timeRange === key ? '#fff' : '#6b7280'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Goals Section */}
        <div>
          <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'8px'}}>
            {timeRange === 'day' ? 'Daily' : timeRange === 'week' ? 'Weekly' : 'Monthly'} Nutrition Goals
            <span style={{fontSize:'12px',fontWeight:400,color:'#6b7280',marginLeft:'8px'}}>🤖 AI-Suggested</span>
          </h3>
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'16px'}}>
            Based on your profile: {backendCalories && backendCalories.metadata ? 
              `${backendCalories.metadata.weight}kg, ${backendCalories.metadata.height}cm, ${backendCalories.metadata.age}yo, ${backendCalories.metadata.gender}, ${backendCalories.metadata.activity_level.replace('_', ' ')}` : 
              userProfile.weight ? `${userProfile.weight}kg, ${userProfile.height}cm, ${userProfile.age}yo, ${userProfile.gender}, ${userProfile.activity_level || 'sedentary'}` : 
              'Complete your profile for personalized goals'}
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'16px'}}>
            {[
              { key: 'calories', label: 'Calories', value: goals.calories, unit: 'kcal' },
              { key: 'protein', label: 'Protein', value: goals.protein, unit: 'g' },
              { key: 'carbs', label: 'Carbs', value: goals.carbs, unit: 'g' },
              { key: 'fat', label: 'Fat', value: goals.fat, unit: 'g' }
            ].map(({ key, label, value, unit }) => (
              <div key={key} style={{background:'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',padding:'16px',borderRadius:'8px',border:'1px solid #bae6fd'}}>
                <div style={{fontSize:'14px',color:'#0369a1',fontWeight:600}}>{label}</div>
                <div style={{fontSize:'24px',fontWeight:700,margin:'8px 0',color:'#0c4a6e'}}>{value} <span style={{fontSize:'14px',fontWeight:400,color:'#64748b'}}>{unit}</span></div>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setGoals(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{marginTop:'8px',width:'100%',padding:'6px 10px',fontSize:'14px',border:'1px solid #0ea5e9',borderRadius:'6px',background:'#fff'}}
                  min="0"
                  placeholder="Adjust goal"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Comparison */}
      {weekComparison.last.count > 0 && (
        <div className="card" style={{background:'linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)',marginBottom:16}}>
          <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>📊 Weekly Trends</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px'}}>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>Average Calories</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:'24px',fontWeight:700}}>{Math.round(weekComparison.current.calories)}</div>
                <div style={{fontSize:'14px',fontWeight:600,color: weekComparison.current.calories > weekComparison.last.calories ? '#dc2626' : '#16a34a'}}>
                  {weekComparison.current.calories > weekComparison.last.calories ? '↑' : '↓'}
                  {Math.abs(Math.round(weekComparison.current.calories - weekComparison.last.calories))}
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>vs {Math.round(weekComparison.last.calories)} last week</div>
            </div>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>Average Protein</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:'24px',fontWeight:700}}>{weekComparison.current.protein.toFixed(1)}g</div>
                <div style={{fontSize:'14px',fontWeight:600,color: weekComparison.current.protein > weekComparison.last.protein ? '#16a34a' : '#dc2626'}}>
                  {weekComparison.current.protein > weekComparison.last.protein ? '↑' : '↓'}
                  {Math.abs((weekComparison.current.protein - weekComparison.last.protein)).toFixed(1)}g
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>vs {weekComparison.last.protein.toFixed(1)}g last week</div>
            </div>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>Meals Logged</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:'24px',fontWeight:700}}>{weekComparison.current.count}</div>
                <div style={{fontSize:'14px',fontWeight:600,color: weekComparison.current.count > weekComparison.last.count ? '#16a34a' : '#dc2626'}}>
                  {weekComparison.current.count > weekComparison.last.count ? '↑' : '↓'}
                  {Math.abs(weekComparison.current.count - weekComparison.last.count)}
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>vs {weekComparison.last.count} last week</div>
            </div>
          </div>
        </div>
      )}

      {/* Calorie Burn */}
      {(bmr > 0 || tdee > 0) && (
        <div className="card" style={{background:'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',marginBottom:16}}>
          <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>🔥 Calorie Burn Estimation</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px'}}>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px',textAlign:'center'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>BMR</div>
              <div style={{fontSize:'32px',fontWeight:700,color:'#ea580c'}}>{bmr}</div>
              <div style={{fontSize:'12px',color:'#9ca3af'}}>Calories at rest/day</div>
            </div>
            <div style={{background:'#fff',padding:'16px',borderRadius:'8px',textAlign:'center'}}>
              <div style={{fontSize:'14px',color:'#6b7280',marginBottom:'4px'}}>TDEE</div>
              <div style={{fontSize:'32px',fontWeight:700,color:'#d97706'}}>{tdee}</div>
              <div style={{fontSize:'12px',color:'#9ca3af'}}>Total calories/day</div>
            </div>
          </div>
        </div>
      )}

      {/* Nutrient Deficiencies */}
      {nutrientDeficiencies.length > 0 && (
        <div className="card" style={{background:'#fee2e2',borderLeft:'4px solid #dc2626',marginBottom:16}}>
          <h3 style={{fontSize:'18px',fontWeight:600,color:'#991b1b',marginBottom:'16px'}}>⚠️ Nutrient Alerts</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {nutrientDeficiencies.map((def, index) => (
              <div 
                key={index}
                style={{
                  padding:'12px 16px',
                  borderRadius:'8px',
                  background: def.severity === 'high' ? '#fecaca' : '#fed7aa',
                  border: `1px solid ${def.severity === 'high' ? '#dc2626' : '#ea580c'}`
                }}
              >
                <div style={{fontWeight:600,color:'#1f2937',marginBottom:4}}>{def.severity === 'high' ? '🚨' : '⚡'} {def.nutrient} Deficiency</div>
                <div style={{fontSize:'14px',color:'#374151'}}>{def.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal Timing */}
      {mealTimingAnalysis.length > 0 && (
        <div className="card" style={{background:'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',marginBottom:16}}>
          <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>⏰ Meal Timing Analysis</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'12px'}}>
            {mealTimingAnalysis.map((item, index) => {
              const icons: { [key: string]: string } = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
              const isBest = index === 0 && item.count > 0
              
              return (
                <div 
                  key={item.type}
                  style={{
                    padding:'16px',
                    borderRadius:'8px',
                    background: isBest ? '#d1fae5' : '#fff',
                    border: isBest ? '2px solid #10b981' : '1px solid #e5e7eb',
                    textAlign:'center'
                  }}
                >
                  <div style={{fontSize:'32px',marginBottom:8}}>{icons[item.type]}</div>
                  {isBest && <div style={{fontSize:'11px',fontWeight:700,color:'#047857',marginBottom:4}}>BEST</div>}
                  <div style={{fontSize:'14px',fontWeight:600,textTransform:'capitalize',marginBottom:4}}>{item.type}</div>
                  <div style={{fontSize:'24px',fontWeight:700}}>{item.avg}</div>
                  <div style={{fontSize:'12px',color:'#6b7280'}}>avg kcal ({item.count})</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Calorie Trends Chart */}
      <div className="card" style={{marginBottom:16}}>
        <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>📈 Calorie Trends</h3>
        {Object.entries(timeRangeData).length > 0 ? (
          <>
            <div style={{position:'relative',height:'250px',marginBottom:16}}>
              <svg style={{width:'100%',height:'100%'}} viewBox="0 0 800 250">
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="50" y1={50 + i * 40} x2="750" y2={50 + i * 40} stroke="#e5e7eb" strokeWidth="1" />
                ))}
                {[0, 500, 1000, 1500, 2000].reverse().map((val, i) => (
                  <text key={val} x="40" y={55 + i * 40} fontSize="12" fill="#6b7280" textAnchor="end">{val}</text>
                ))}
                {Object.entries(timeRangeData).length > 1 && (
                  <polyline
                    points={Object.entries(timeRangeData).map(([_, data], index) => {
                      const x = 50 + (index * (700 / (Object.entries(timeRangeData).length - 1)))
                      const y = 210 - ((data.calories / 2000) * 160)
                      return `${x},${Math.max(50, Math.min(210, y))}`
                    }).join(' ')}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                  />
                )}
                {Object.entries(timeRangeData).map(([date, data], index) => {
                  const x = 50 + (index * (700 / Math.max(Object.entries(timeRangeData).length - 1, 1)))
                  const y = 210 - ((data.calories / 2000) * 160)
                  return (
                    <g key={date}>
                      <circle cx={x} cy={Math.max(50, Math.min(210, y))} r="5" fill="#4f46e5" />
                      <text x={x} y="235" fontSize="10" fill="#6b7280" textAnchor="middle">{date.substring(0, 6)}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <div style={{fontSize:'12px',color:'#6b7280',textAlign:'center'}}>Calorie intake over time (Goal: {goals.calories} kcal)</div>
          </>
        ) : (
          <div style={{padding:40,textAlign:'center',color:'#6b7280'}}>No data available for selected time range</div>
        )}
      </div>

      {/* Progress Charts */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:'16px',marginBottom:16}}>
        {console.log('📊 Rendering Progress Charts with', Object.entries(timeRangeData).length, 'entries')}
        {/* Calories Progress */}
        <div className="card">
          <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>Calories Progress</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {Object.entries(timeRangeData).map(([date, data]) => {
              const progress = Math.min((data.calories / goals.calories) * 100, 100)
              return (
                <div key={date}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'14px',marginBottom:'8px'}}>
                    <span style={{fontWeight:500}}>{date}</span>
                    <span style={{color:'#6b7280'}}>{Math.round(data.calories)} / {goals.calories} kcal</span>
                  </div>
                  <div style={{width:'100%',background:'#e5e7eb',borderRadius:'9999px',height:'8px',overflow:'hidden'}}>
                    <div 
                      style={{
                        background:'#3b82f6',
                        height:'100%',
                        borderRadius:'9999px',
                        width:`${progress}%`,
                        transition:'width 0.3s'
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Protein Progress */}
        <div className="card">
          <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>Protein Progress</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {Object.entries(timeRangeData).map(([date, data]) => {
              const progress = Math.min((data.protein / goals.protein) * 100, 100)
              return (
                <div key={date}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'14px',marginBottom:'8px'}}>
                    <span style={{fontWeight:500}}>{date}</span>
                    <span style={{color:'#6b7280'}}>{data.protein.toFixed(1)} / {goals.protein}g</span>
                  </div>
                  <div style={{width:'100%',background:'#e5e7eb',borderRadius:'9999px',height:'8px',overflow:'hidden'}}>
                    <div 
                      style={{
                        background:'#16a34a',
                        height:'100%',
                        borderRadius:'9999px',
                        width:`${progress}%`,
                        transition:'width 0.3s'
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {meals.length > 0 && (
        <div className="card" style={{background:'#eff6ff',borderLeft:'4px solid #3b82f6',marginBottom:16}}>
          <h3 style={{fontSize:'18px',fontWeight:600,color:'#1e40af',marginBottom:'16px'}}>💡 Personalized Insights</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {meals.length >= 3 && (
              <div style={{padding:'12px',background:'#dbeafe',borderRadius:'8px',fontSize:'14px'}}>
                🎉 Great job! You've logged <strong>{meals.length} meals</strong>. Consistency is key to tracking nutrition.
              </div>
            )}
            {meals.length > 0 && meals.reduce((sum, m) => sum + (m.protein || 0), 0) / meals.length < 30 && (
              <div style={{padding:'12px',background:'#fef3c7',borderRadius:'8px',fontSize:'14px'}}>
                💪 Try to include more protein-rich foods like lean meats, eggs, or legumes to reach your goals.
              </div>
            )}
            {meals.length > 0 && meals.reduce((sum, m) => sum + (m.calories || 0), 0) / meals.length < 300 && (
              <div style={{padding:'12px',background:'#fef3c7',borderRadius:'8px',fontSize:'14px'}}>
                ℹ️ Your average calorie intake per meal seems low. Consider adding nutrient-dense foods.
              </div>
            )}
            {mealTimingAnalysis.length > 0 && mealTimingAnalysis[0].count > 0 && (
              <div style={{padding:'12px',background:'#d1fae5',borderRadius:'8px',fontSize:'14px'}}>
                ⏰ Your <strong>{mealTimingAnalysis[0].type}</strong> meals tend to be most calorie-dense ({mealTimingAnalysis[0].avg} kcal avg). 
                Consider balancing your intake throughout the day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="card">
        <h3 style={{fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>Summary Statistics</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:'16px',textAlign:'center'}}>
          <div>
            <div style={{fontSize:'32px',fontWeight:700,color:'#4f46e5'}}>{meals.length}</div>
            <div style={{fontSize:'14px',color:'#6b7280'}}>Total Meals</div>
          </div>
          <div>
            <div style={{fontSize:'32px',fontWeight:700,color:'#16a34a'}}>
              {meals.length > 0 ? Math.round(meals.reduce((sum, m) => sum + (m.calories || 0), 0) / meals.length) : 0}
            </div>
            <div style={{fontSize:'14px',color:'#6b7280'}}>Avg Calories</div>
          </div>
          <div>
            <div style={{fontSize:'32px',fontWeight:700,color:'#ea580c'}}>
              {meals.length > 0 ? (meals.reduce((sum, m) => sum + (m.protein || 0), 0) / meals.length).toFixed(1) : 0}g
            </div>
            <div style={{fontSize:'14px',color:'#6b7280'}}>Avg Protein</div>
          </div>
          <div>
            <div style={{fontSize:'32px',fontWeight:700,color:'#0891b2'}}>
              {meals.length > 0 ? (meals.reduce((sum, m) => sum + (m.carbs || 0), 0) / meals.length).toFixed(1) : 0}g
            </div>
            <div style={{fontSize:'14px',color:'#6b7280'}}>Avg Carbs</div>
          </div>
        </div>
      </div>
    </div>
  )
}
