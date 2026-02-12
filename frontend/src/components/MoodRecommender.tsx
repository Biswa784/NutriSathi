import React, { useState } from 'react';
import { FaArrowLeft, FaHeart, FaBatteryEmpty, FaExclamationCircle, FaThermometerHalf, FaStar, FaLeaf, FaChartLine } from 'react-icons/fa';

interface MoodRecommenderProps {
  onBack: () => void;
  onLogMeal?: (mealData: any) => void;
}

interface MoodDish {
  name: string;
  serving_size: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mood_benefit: string;
  cuisine: string;
}

interface MoodRecommendation {
  mood: string;
  mood_description: string;
  key_nutrients: string[];
  ayurvedic_type: string;
  recommended_dishes: MoodDish[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  mood_insights: string[];
  wellness_tip: string;
}

type MoodType = 'happy' | 'sad' | 'tired' | 'stressed' | 'sick';

const MOODS = [
  { 
    id: 'happy' as MoodType, 
    label: 'Happy', 
    emoji: '😊', 
    color: 'from-yellow-400 to-orange-400',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    description: 'Light & energizing foods'
  },
  { 
    id: 'sad' as MoodType, 
    label: 'Sad', 
    emoji: '😔', 
    color: 'from-blue-400 to-indigo-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    description: 'Comfort & mood-boosting foods'
  },
  { 
    id: 'tired' as MoodType, 
    label: 'Tired', 
    emoji: '😫', 
    color: 'from-purple-400 to-pink-400',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
    description: 'Energy-boosting foods'
  },
  { 
    id: 'stressed' as MoodType, 
    label: 'Stressed', 
    emoji: '😰', 
    color: 'from-red-400 to-pink-400',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    description: 'Calming & stress-relief foods'
  },
  { 
    id: 'sick' as MoodType, 
    label: 'Sick', 
    emoji: '🤒', 
    color: 'from-green-400 to-teal-400',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    description: 'Light & immune-boosting foods'
  }
];

const MoodRecommender: React.FC<MoodRecommenderProps> = ({ onBack, onLogMeal }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<MoodRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const getRecommendations = async (mood: MoodType) => {
    setLoading(true);
    setError(null);
    
    console.log('API_BASE:', API_BASE);
    console.log('Requesting mood recommendations for:', mood);
    
    try {
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${API_BASE}/ai/recommend-mood`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mood: mood,
          calorie_range: [200, 800],
          num_recommendations: 4
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to get recommendations' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.detail || 'Failed to get recommendations');
      }

      const data = await response.json();
      console.log('Success! Got recommendations:', data);
      setRecommendation(data);
    } catch (err) {
      console.error('Catch block error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      console.error('Mood recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    getRecommendations(mood);
  };

  const handleLogMeal = (dish: MoodDish) => {
    if (onLogMeal) {
      onLogMeal({
        name: dish.name,
        serving_size: dish.serving_size,
        unit: dish.unit,
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat
      });
    }
  };

  const getMoodConfig = () => {
    return MOODS.find(m => m.id === selectedMood) || MOODS[0];
  };

  if (recommendation) {
    const moodConfig = getMoodConfig();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <button
            onClick={() => {
              setRecommendation(null);
              setSelectedMood(null);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
            <span className="font-medium">Try Another Mood</span>
          </button>

          {/* Mood Header Card */}
          <div className={`bg-gradient-to-r ${moodConfig.color} p-6 rounded-2xl shadow-lg text-white mb-6`}>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-6xl">{moodConfig.emoji}</span>
              <div>
                <h1 className="text-3xl font-bold">Feeling {recommendation.mood}?</h1>
                <p className="text-white/90 text-lg">{recommendation.mood_description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <FaLeaf className="w-5 h-5" />
              <span className="font-semibold">Ayurvedic Type: {recommendation.ayurvedic_type}</span>
            </div>
          </div>

          {/* Key Nutrients */}
          <div className="bg-white rounded-xl p-5 shadow-md mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaStar className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg text-gray-800">Key Nutrients for Your Mood</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendation.key_nutrients.map((nutrient, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {nutrient}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Dishes */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHeart className="w-6 h-6 text-pink-500" />
              Personalized Recommendations
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendation.recommended_dishes.map((dish, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{dish.name}</h3>
                      <p className="text-sm text-gray-500">{dish.cuisine} Cuisine</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{Math.round(dish.calories)}</p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-purple-700 font-medium flex items-start gap-2">
                      <FaStar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{dish.mood_benefit}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{Math.round(dish.protein)}g</p>
                      <p className="text-xs text-gray-500">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-yellow-600">{Math.round(dish.carbs)}g</p>
                      <p className="text-xs text-gray-500">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-red-600">{Math.round(dish.fat)}g</p>
                      <p className="text-xs text-gray-500">Fat</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Serving: {dish.serving_size}{dish.unit}
                  </p>

                  <button
                    onClick={() => handleLogMeal(dish)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Log This Meal
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="bg-white rounded-xl p-5 shadow-md mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="w-5 h-5 text-green-600" />
              Total Nutrition (All Dishes)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{Math.round(recommendation.total_calories)}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{Math.round(recommendation.total_protein)}g</p>
                <p className="text-sm text-gray-600">Protein</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{Math.round(recommendation.total_carbs)}g</p>
                <p className="text-sm text-gray-600">Carbs</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{Math.round(recommendation.total_fat)}g</p>
                <p className="text-sm text-gray-600">Fat</p>
              </div>
            </div>
          </div>

          {/* Mood Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 shadow-md mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <FaExclamationCircle className="w-5 h-5 text-blue-600" />
              Insights for You
            </h3>
            <ul className="space-y-2">
              {recommendation.mood_insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Wellness Tip */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
              <FaThermometerHalf className="w-5 h-5 text-green-600" />
              Wellness Tip
            </h3>
            <p className="text-gray-700 leading-relaxed">{recommendation.wellness_tip}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            How Are You Feeling Today?
          </h1>
          <p className="text-gray-600 text-lg">
            Get personalized meal recommendations based on your mood
          </p>
        </div>

        {/* Mood Selection */}
        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className={`group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-3 ${mood.borderColor}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {mood.emoji}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {mood.label}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {mood.description}
                  </p>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${mood.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <FaStar className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">
              Finding the perfect meals for you...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <FaExclamationCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (selectedMood) getRecommendations(selectedMood);
              }}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodRecommender;
