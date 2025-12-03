import { useState, useEffect } from 'react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  xpReward: number
  category: 'daily' | 'streak' | 'milestone' | 'special'
}

interface UserStats {
  level: number
  currentXP: number
  xpToNextLevel: number
  totalXP: number
  currentStreak: number
  longestStreak: number
  mealsLogged: number
  daysActive: number
  achievements: Achievement[]
}

export default function Gamification() {
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    mealsLogged: 0,
    daysActive: 0,
    achievements: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      // Fetch gamification stats from backend
      const response = await fetch('http://localhost:8000/gamification/stats')
      const backendStats = await response.json()
      
      // Fetch meals to calculate achievements
      const mealsResponse = await fetch('http://localhost:8000/meals')
      const meals = await mealsResponse.json()
      
      // Generate achievements based on backend stats
      const achievements = generateAchievements(
        backendStats.mealsLogged, 
        backendStats.currentStreak, 
        backendStats.longestStreak, 
        backendStats.level
      )
      
      // Combine backend stats with achievements
      const stats: UserStats = {
        ...backendStats,
        achievements
      }
      
      setUserStats(stats)
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      // Fallback to local calculation if backend fails
      const mealsResponse = await fetch('http://localhost:8000/meals')
      const meals = await mealsResponse.json()
      const stats = calculateUserStats(meals)
      setUserStats(stats)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateUserStats = (meals: any[]): UserStats => {
    if (meals.length === 0) {
      return getDefaultStats()
    }

    // Calculate streaks and days active
    const mealDates = [...new Set(meals.map(m => new Date(m.timestamp).toDateString()))]
    const sortedDates = mealDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const nextDate = i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : null
      
      if (nextDate) {
        const dayDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        if (dayDiff === 1) {
          tempStreak++
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak
          tempStreak = 0
        }
      }
    }
    
    // Check if current streak is active (last meal was today or yesterday)
    const lastMealDate = new Date(sortedDates[sortedDates.length - 1])
    const today = new Date()
    const daysSinceLastMeal = Math.floor((today.getTime() - lastMealDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastMeal <= 1) {
      currentStreak = tempStreak + 1
    }
    
    if (tempStreak > longestStreak) longestStreak = tempStreak

    // Calculate XP and level
    const baseXP = meals.length * 10 // 10 XP per meal
    const streakBonus = Math.floor(currentStreak / 3) * 50 // Bonus XP for streaks
    const totalXP = baseXP + streakBonus
    
    const level = Math.floor(totalXP / 100) + 1
    const currentXP = totalXP % 100
    const xpToNextLevel = 100 - currentXP

    // Generate achievements
    const achievements = generateAchievements(meals.length, currentStreak, longestStreak, level)

    return {
      level,
      currentXP,
      xpToNextLevel,
      totalXP,
      currentStreak,
      longestStreak,
      mealsLogged: meals.length,
      daysActive: mealDates.length,
      achievements
    }
  }

  const getDefaultStats = (): UserStats => {
    return {
      level: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      mealsLogged: 0,
      daysActive: 0,
      achievements: generateAchievements(0, 0, 0, 1)
    }
  }

  const generateAchievements = (mealsCount: number, currentStreak: number, longestStreak: number, level: number): Achievement[] => {
    const achievements: Achievement[] = [
      // Daily achievements
      {
        id: 'first-meal',
        name: 'First Bite! 🍽️',
        description: 'Log your first meal',
        icon: '🍽️',
        unlocked: mealsCount >= 1,
        xpReward: 50,
        category: 'milestone'
      },
      {
        id: 'streak-3',
        name: 'On Fire! 🔥',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        unlocked: currentStreak >= 3,
        xpReward: 100,
        category: 'streak'
      },
      {
        id: 'streak-7',
        name: 'Week Warrior! ⚔️',
        description: 'Maintain a 7-day streak',
        icon: '⚔️',
        unlocked: currentStreak >= 7,
        xpReward: 250,
        category: 'streak'
      },
      {
        id: 'streak-30',
        name: 'Monthly Master! 👑',
        description: 'Maintain a 30-day streak',
        icon: '👑',
        unlocked: currentStreak >= 30,
        xpReward: 1000,
        category: 'streak'
      },
      {
        id: 'meals-10',
        name: 'Decade Diner! 🎯',
        description: 'Log 10 meals',
        icon: '🎯',
        unlocked: mealsCount >= 10,
        xpReward: 150,
        category: 'milestone'
      },
      {
        id: 'meals-50',
        name: 'Half Century! 🏆',
        description: 'Log 50 meals',
        icon: '🏆',
        unlocked: mealsCount >= 50,
        xpReward: 500,
        category: 'milestone'
      },
      {
        id: 'meals-100',
        name: 'Century Club! 💎',
        description: 'Log 100 meals',
        icon: '💎',
        unlocked: mealsCount >= 100,
        xpReward: 1000,
        category: 'milestone'
      },
      {
        id: 'level-5',
        name: 'Rising Star! ⭐',
        description: 'Reach level 5',
        icon: '⭐',
        unlocked: level >= 5,
        xpReward: 300,
        category: 'milestone'
      },
      {
        id: 'level-10',
        name: 'Elite Athlete! 🥇',
        description: 'Reach level 10',
        icon: '🥇',
        unlocked: level >= 10,
        xpReward: 750,
        category: 'milestone'
      },
      {
        id: 'level-20',
        name: 'Legend! 🏅',
        description: 'Reach level 20',
        icon: '🏅',
        unlocked: level >= 20,
        xpReward: 2000,
        category: 'milestone'
      }
    ]

    // Add unlocked timestamps for newly unlocked achievements
    achievements.forEach(achievement => {
      if (achievement.unlocked && !achievement.unlockedAt) {
        achievement.unlockedAt = new Date().toISOString()
        // Show achievement notification
        if (showAchievement === null) {
          setShowAchievement(achievement)
          setTimeout(() => setShowAchievement(null), 3000)
        }
      }
    })

    return achievements
  }

  const getLevelTitle = (level: number): string => {
    if (level < 5) return 'Beginner'
    if (level < 10) return 'Apprentice'
    if (level < 15) return 'Intermediate'
    if (level < 20) return 'Advanced'
    if (level < 25) return 'Expert'
    return 'Master'
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage < 30) return 'bg-red-500'
    if (percentage < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl w-full space-y-6">
      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{showAchievement.icon}</span>
            <div>
              <div className="font-bold">{showAchievement.name}</div>
              <div className="text-sm">+{showAchievement.xpReward} XP!</div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Level and XP */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Gamification Dashboard</h2>
            <p className="text-purple-100">Level up your nutrition journey!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userStats.level}</div>
            <div className="text-sm text-purple-100">{getLevelTitle(userStats.level)}</div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{userStats.currentXP} XP</span>
            <span>{userStats.xpToNextLevel} XP to next level</span>
          </div>
          <div className="w-full bg-purple-300 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor((userStats.currentXP / 100) * 100)}`}
              style={{ width: `${(userStats.currentXP / 100) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.totalXP}</div>
            <div className="text-xs text-purple-100">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.currentStreak}</div>
            <div className="text-xs text-purple-100">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.longestStreak}</div>
            <div className="text-xs text-purple-100">Longest Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.mealsLogged}</div>
            <div className="text-xs text-purple-100">Meals Logged</div>
          </div>
        </div>
      </div>

      {/* Streak Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🔥 Streak Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-600">{userStats.currentStreak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
            {userStats.currentStreak > 0 && (
              <div className="mt-2 text-xs text-orange-500">
                Keep it going! Don't break the chain!
              </div>
            )}
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-blue-600">{userStats.longestStreak}</div>
            <div className="text-sm text-gray-600">Longest Streak</div>
            {userStats.longestStreak > 0 && (
              <div className="mt-2 text-xs text-blue-500">
                Your personal best!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🏅 Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userStats.achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.unlocked 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </span>
                <div className="flex-1">
                  <div className={`font-semibold ${
                    achievement.unlocked ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </div>
                  <div className={`text-sm ${
                    achievement.unlocked ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    +{achievement.xpReward} XP
                  </div>
                </div>
                {achievement.unlocked && (
                  <div className="text-green-500">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Goals */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Next Goals</h3>
        <div className="space-y-4">
          {userStats.achievements
            .filter(a => !a.unlocked)
            .slice(0, 3)
            .map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl opacity-50">{achievement.icon}</span>
                  <div>
                    <div className="font-medium text-gray-700">{achievement.name}</div>
                    <div className="text-sm text-gray-500">{achievement.description}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">+{achievement.xpReward} XP</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
