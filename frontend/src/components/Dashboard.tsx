import React, { useEffect, useState } from 'react';
import { FiActivity, FiAward, FiCalendar, FiPlus, FiTrendingUp } from 'react-icons/fi';

type View = 'home' | 'log-meal' | 'history' | 'analytics' | 'gamification' | 'recommendations';

interface DashboardProps {
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Mock data - replace with actual data from your API
  const userStats = {
    dailyCalories: 1850,
    dailyGoal: 2200,
    protein: 120,
    carbs: 200,
    fat: 65,
    streak: 7,
    mealsLogged: 21,
  };

  const quickActions = [
    {
      title: 'Log Meal',
      icon: <FiPlus className="w-6 h-6" />,
      action: () => onNavigate('log-meal' as View),
      bg: 'from-blue-50 to-blue-100 text-blue-700',
      accent: 'bg-white/20',
    },
    {
      title: 'View History',
      icon: <FiCalendar className="w-6 h-6" />,
      action: () => onNavigate('history' as View),
      bg: 'from-purple-50 to-purple-100 text-purple-700',
      accent: 'bg-white/20',
    },
    {
      title: 'Analytics',
      icon: <FiTrendingUp className="w-6 h-6" />,
      action: () => onNavigate('analytics' as View),
      bg: 'from-green-50 to-green-100 text-green-700',
      accent: 'bg-white/20',
    },
    {
      title: 'Achievements',
      icon: <FiAward className="w-6 h-6" />,
      action: () => onNavigate('gamification' as View),
      bg: 'from-yellow-50 to-yellow-100 text-yellow-700',
      accent: 'bg-white/20',
    },
  ];

  const progress = Math.min(100, (userStats.dailyCalories / userStats.dailyGoal) * 100);

  // Remote data
  const [stats, setStats] = useState<null | any>(null);
  const [meals, setMeals] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // mount animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}` : 'http://localhost:8000';

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [sRes, mRes] = await Promise.all([
          fetch(`${API}/gamification/stats`),
          fetch(`${API}/meals`),
        ]);

        if (!sRes.ok) throw new Error('Failed to load stats');
        if (!mRes.ok) throw new Error('Failed to load meals');

        const sJson = await sRes.json();
        const mJson = await mRes.json();

        setStats(sJson);
        setMeals(Array.isArray(mJson) ? mJson.reverse().slice(0, 5) : []);
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Welcome back, User! 👋</h1>
            <p className="text-gray-600 mt-1">Here's your nutrition summary for today</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 px-3 py-1 rounded-full shadow-sm">
              <FiAward className="w-5 h-5" />
              <span className="text-sm font-medium">Streak: {stats?.currentStreak ?? userStats.streak} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Calories</p>
              <p className="text-2xl font-bold">{userStats.dailyCalories}<span className="text-sm font-normal text-gray-500"> / {userStats.dailyGoal} kcal</span></p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
              <FiActivity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${progress > 90 ? 'bg-red-500' : progress > 75 ? 'bg-yellow-500' : 'bg-blue-500'} transition-all duration-700 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
            <div className="text-xs text-gray-500 mt-2 text-right">{Math.round(progress)}%</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Protein</p>
              <p className="text-2xl font-bold">{userStats.protein}<span className="text-sm font-normal text-gray-500">g</span></p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-green-50 to-green-100 text-green-600">
              <FiTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Carbs</p>
              <p className="text-2xl font-bold">{userStats.carbs}<span className="text-sm font-normal text-gray-500">g</span></p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600">
              <FiTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 transform transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Fat</p>
              <p className="text-2xl font-bold">{userStats.fat}<span className="text-sm font-normal text-gray-500">g</span></p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600">
              <FiTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`flex flex-col items-center justify-center p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br ${action.bg}`}
          >
            <div className={`p-3 rounded-full ${action.accent} mb-3 backdrop-blur-sm`}>
              {action.icon}
            </div>
            <span className="font-medium">{action.title}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            // simple skeletons
            [1, 2, 3].map((n) => (
              <div key={n} className="p-4">
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-4 text-red-600">Failed to load activity: {error}</div>
          ) : meals.length === 0 ? (
            <div className="p-6 text-gray-500">No recent activity. Start by logging your first meal!</div>
          ) : (
            meals.map((meal: any, idx: number) => (
              <div key={meal.id} className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-sky-50 to-white text-sky-600 mr-3 shadow-inner">
                    <FiPlus className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-sm text-gray-500">{new Date(meal.timestamp).toLocaleString()} • {meal.calories ?? '—'} kcal</p>
                  </div>
                  <div className="text-sm text-gray-400">#{idx + 1}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 text-center border-t border-gray-100">
          <button
            onClick={() => onNavigate('history' as View)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View all activity →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
