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
  meal_type?: string
  user_email?: string
}

interface GroupedMeals {
  [date: string]: Meal[]
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
      const token = localStorage.getItem('nutrisathi_token')
      const headers: any = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('http://localhost:8000/meals', { headers })
      const data = await response.json()
      console.log('Fetched meals:', data) // Debug log
      setMeals(data)
    } catch (error) {
      console.error('Failed to fetch meals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMeal = async (mealId: number) => {
    if (!confirm('Are you sure you want to delete this meal?')) return
    
    try {
      const token = localStorage.getItem('nutrisathi_token')
      const headers: any = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`http://localhost:8000/meals/${mealId}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        setMeals(meals.filter(m => m.id !== mealId))
      }
    } catch (error) {
      console.error('Failed to delete meal:', error)
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

  // Group meals by date
  const groupMealsByDate = (meals: Meal[]): GroupedMeals => {
    return meals.reduce((groups: GroupedMeals, meal) => {
      const mealDate = new Date(meal.timestamp)
      const dateKey = mealDate.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(meal)
      
      return groups
    }, {})
  }

  // Format date for display
  const formatDateHeading = (dateKey: string): string => {
    const date = new Date(dateKey)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format time for meal entry
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get meal type emoji
  const getMealTypeEmoji = (mealType?: string) => {
    if (!mealType) return '🍽️'
    const type = mealType.toLowerCase()
    if (type.includes('breakfast')) return '🌅'
    if (type.includes('lunch')) return '🌞'
    if (type.includes('dinner')) return '🌙'
    if (type.includes('snack')) return '🍎'
    return '🍽️'
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
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'32px'}}>
        <div style={{border:'3px solid #e5e7eb',borderTop:'3px solid #4f46e5',borderRadius:'50%',width:'32px',height:'32px',animation:'spin 1s linear infinite'}}></div>
      </div>
    )
  }

  const filteredMeals = getFilteredMeals()
  const totalNutrition = getTotalNutrition()
  const groupedMeals = groupMealsByDate(filteredMeals)
  const sortedDates = Object.keys(groupedMeals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div style={{maxWidth:'1280px',width:'100%',margin:'0 auto',padding:'0 16px'}}>
      {/* Header */}
      <div style={{background:'#fff',borderRadius:'16px',boxShadow:'0 4px 6px rgba(0,0,0,0.07)',padding:'24px',marginBottom:'24px'}}>
        <h2 style={{fontSize:'32px',fontWeight:'700',color:'#1f2937',marginBottom:'20px',display:'flex',alignItems:'center',gap:'12px'}}>
          📖 Meal History
        </h2>
        
        {/* Filter Tabs */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'24px'}}>
          {[
            { key: 'all', label: 'All Time', count: meals.length },
            { key: 'today', label: 'Today', count: meals.filter(m => new Date(m.timestamp) >= new Date(new Date().setHours(0,0,0,0))).length },
            { key: 'week', label: 'This Week', count: meals.filter(m => new Date(m.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
            { key: 'month', label: 'This Month', count: meals.filter(m => new Date(m.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding:'10px 20px',
                fontSize:'14px',
                fontWeight:'600',
                borderRadius:'10px',
                border:'none',
                cursor:'pointer',
                transition:'all 0.2s',
                background: filter === key ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                color: filter === key ? '#fff' : '#6b7280',
                boxShadow: filter === key ? '0 4px 12px rgba(102,126,234,0.4)' : 'none',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {label} <span style={{fontSize:'11px',opacity:0.8}}>({count})</span>
            </button>
          ))}
        </div>

        {/* Nutrition Summary */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'16px'}}>
          <div style={{background:'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',padding:'16px',borderRadius:'12px',border:'2px solid #93c5fd'}}>
            <div style={{fontSize:'13px',color:'#1e40af',fontWeight:'600',marginBottom:'4px'}}>Total Calories</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#1e3a8a'}}>
              {Math.round(totalNutrition.calories || 0)}
            </div>
            <div style={{fontSize:'11px',color:'#3b82f6',marginTop:'4px'}}>kcal</div>
          </div>
          <div style={{background:'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',padding:'16px',borderRadius:'12px',border:'2px solid #6ee7b7'}}>
            <div style={{fontSize:'13px',color:'#065f46',fontWeight:'600',marginBottom:'4px'}}>Total Protein</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#064e3b'}}>
              {totalNutrition.protein?.toFixed(1) || 0}
            </div>
            <div style={{fontSize:'11px',color:'#059669',marginTop:'4px'}}>grams</div>
          </div>
          <div style={{background:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',padding:'16px',borderRadius:'12px',border:'2px solid #fcd34d'}}>
            <div style={{fontSize:'13px',color:'#92400e',fontWeight:'600',marginBottom:'4px'}}>Total Carbs</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#78350f'}}>
              {totalNutrition.carbs?.toFixed(1) || 0}
            </div>
            <div style={{fontSize:'11px',color:'#d97706',marginTop:'4px'}}>grams</div>
          </div>
          <div style={{background:'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',padding:'16px',borderRadius:'12px',border:'2px solid #fca5a5'}}>
            <div style={{fontSize:'13px',color:'#991b1b',fontWeight:'600',marginBottom:'4px'}}>Total Fat</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#7f1d1d'}}>
              {totalNutrition.fat?.toFixed(1) || 0}
            </div>
            <div style={{fontSize:'11px',color:'#dc2626',marginTop:'4px'}}>grams</div>
          </div>
        </div>
      </div>

      {/* Grouped Meals by Date */}
      <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
        {filteredMeals.length === 0 ? (
          <div style={{background:'#fff',borderRadius:'16px',boxShadow:'0 4px 6px rgba(0,0,0,0.07)',padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:'80px',marginBottom:'16px'}}>🍽️</div>
            <h3 style={{fontSize:'24px',fontWeight:'700',color:'#4b5563',marginBottom:'8px'}}>No meals logged yet</h3>
            <p style={{color:'#6b7280'}}>Start logging your meals to see your nutrition history!</p>
          </div>
        ) : (
          sortedDates.map((dateKey, index) => {
            const dateMeals = groupedMeals[dateKey]
            const dayTotal = dateMeals.reduce(
              (sum, meal) => ({
                calories: sum.calories + (meal.calories || 0),
                protein: sum.protein + (meal.protein || 0),
                carbs: sum.carbs + (meal.carbs || 0),
                fat: sum.fat + (meal.fat || 0)
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            )

            return (
              <div
                key={dateKey}
                style={{
                  background:'#fff',
                  borderRadius:'20px',
                  boxShadow:'0 10px 25px rgba(0,0,0,0.1)',
                  border:'1px solid #f3f4f6',
                  overflow:'hidden',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Date Header */}
                <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',padding:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                    <div>
                      <h3 style={{fontSize:'24px',fontWeight:'700',color:'#fff',margin:'0 0 4px 0'}}>
                        {formatDateHeading(dateKey)}
                      </h3>
                      <p style={{fontSize:'14px',color:'rgba(255,255,255,0.9)',margin:0}}>
                        {dateMeals.length} meal{dateMeals.length !== 1 ? 's' : ''} logged
                      </p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'32px',fontWeight:'700',color:'#fff'}}>
                        {Math.round(dayTotal.calories)}
                      </div>
                      <div style={{fontSize:'13px',color:'rgba(255,255,255,0.9)'}}>kcal total</div>
                    </div>
                  </div>
                  
                  {/* Day Summary */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                    <div style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(10px)',borderRadius:'10px',padding:'8px',textAlign:'center'}}>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.9)'}}>Protein</div>
                      <div style={{fontSize:'18px',fontWeight:'700',color:'#fff'}}>{dayTotal.protein.toFixed(0)}g</div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(10px)',borderRadius:'10px',padding:'8px',textAlign:'center'}}>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.9)'}}>Carbs</div>
                      <div style={{fontSize:'18px',fontWeight:'700',color:'#fff'}}>{dayTotal.carbs.toFixed(0)}g</div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(10px)',borderRadius:'10px',padding:'8px',textAlign:'center'}}>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.9)'}}>Fat</div>
                      <div style={{fontSize:'18px',fontWeight:'700',color:'#fff'}}>{dayTotal.fat.toFixed(0)}g</div>
                    </div>
                  </div>
                </div>

                {/* Meals List */}
                <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
                  {dateMeals.map((meal) => (
                    <div
                      key={meal.id}
                      style={{
                        background:'linear-gradient(135deg, #fafafa 0%, #fff 100%)',
                        borderRadius:'12px',
                        padding:'16px',
                        border:'2px solid #f3f4f6',
                        transition:'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#c7d2fe'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#f3f4f6'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{display:'flex',alignItems:'start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
                        {/* Left: Meal Info */}
                        <div style={{display:'flex',alignItems:'start',gap:'12px',flex:'1',minWidth:'250px'}}>
                          <div style={{fontSize:'40px'}}>{getMealTypeEmoji(meal.meal_type)}</div>
                          <div style={{flex:'1'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                              <h4 style={{fontSize:'18px',fontWeight:'700',color:'#1f2937',margin:0}}>{meal.name}</h4>
                              <span style={{padding:'4px 10px',background:'#e0e7ff',color:'#4338ca',fontSize:'12px',fontWeight:'600',borderRadius:'12px'}}>
                                {meal.meal_type || 'Meal'}
                              </span>
                            </div>
                            <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'12px',fontSize:'14px',color:'#6b7280'}}>
                              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                <span style={{fontWeight:'600'}}>⏰</span>
                                {formatTime(meal.timestamp)}
                              </span>
                              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                <span style={{fontWeight:'600'}}>🍽️</span>
                                {meal.serving_size}{meal.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Nutrition & Actions */}
                        <div style={{display:'flex',alignItems:'start',gap:'16px',flexWrap:'wrap'}}>
                          {/* Nutrition Grid */}
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',minWidth:'180px'}}>
                            <div style={{background:'#eff6ff',borderRadius:'8px',padding:'8px',textAlign:'center',border:'1px solid #dbeafe'}}>
                              <div style={{fontSize:'11px',color:'#2563eb',fontWeight:'500'}}>Calories</div>
                              <div style={{fontSize:'18px',fontWeight:'700',color:'#1e3a8a'}}>{Math.round(meal.calories || 0)}</div>
                            </div>
                            <div style={{background:'#f0fdf4',borderRadius:'8px',padding:'8px',textAlign:'center',border:'1px solid #dcfce7'}}>
                              <div style={{fontSize:'11px',color:'#16a34a',fontWeight:'500'}}>Protein</div>
                              <div style={{fontSize:'18px',fontWeight:'700',color:'#14532d'}}>{meal.protein?.toFixed(1) || 0}g</div>
                            </div>
                            <div style={{background:'#fefce8',borderRadius:'8px',padding:'8px',textAlign:'center',border:'1px solid #fef08a'}}>
                              <div style={{fontSize:'11px',color:'#ca8a04',fontWeight:'500'}}>Carbs</div>
                              <div style={{fontSize:'18px',fontWeight:'700',color:'#713f12'}}>{meal.carbs?.toFixed(1) || 0}g</div>
                            </div>
                            <div style={{background:'#fef2f2',borderRadius:'8px',padding:'8px',textAlign:'center',border:'1px solid #fecaca'}}>
                              <div style={{fontSize:'11px',color:'#dc2626',fontWeight:'500'}}>Fat</div>
                              <div style={{fontSize:'18px',fontWeight:'700',color:'#7f1d1d'}}>{meal.fat?.toFixed(1) || 0}g</div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            style={{
                              padding:'8px 16px',
                              background:'#fee2e2',
                              color:'#991b1b',
                              borderRadius:'8px',
                              fontWeight:'600',
                              fontSize:'14px',
                              border:'none',
                              cursor:'pointer',
                              transition:'all 0.2s',
                              whiteSpace:'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fecaca'
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(220,38,38,0.25)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fee2e2'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                            title="Delete meal"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
