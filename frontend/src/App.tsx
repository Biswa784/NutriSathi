import React, { useEffect, useMemo, useState } from 'react';

type Meal = {
  id: number;
  name: string;
  serving_size: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp: string;
  user_email?: string;
  meal_type?: string;
};

type User = {
  name: string;
  email: string;
  created_at: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  activity_level?: string;
  dietary_preference?: string;
  health_goal?: string;
  allergies?: string;
};

type View = 'dashboard' | 'history' | 'analytics' | 'gamification' | 'recommendations' | 'settings' | 'bmi-analyzer';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const App: React.FC = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // App state
  const [view, setView] = useState<View>('dashboard');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logger state
  const [showLogger, setShowLogger] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', serving_size: 100, unit: 'g', calories: '', protein: '', carbs: '', fat: '', meal_type: 'Breakfast' });
  const [baseServing, setBaseServing] = useState<number>(100);
  const [baseNutrition, setBaseNutrition] = useState<{calories: number, protein: number, carbs: number, fat: number} | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDishes, setFilteredDishes] = useState<any[]>([]);
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    name: '', 
    email: '', 
    currentPassword: '', 
    newPassword: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    activity_level: '',
    dietary_preference: '',
    health_goal: '',
    allergies: ''
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Thali recommendation state
  const [thaliRequest, setThaliRequest] = useState({
    meal_type: 'lunch',
    calorie_goal: 500,
    dietary_preference: '',
    health_goal: '',
    allergies: ''
  });
  const [thaliRecommendation, setThaliRecommendation] = useState<any>(null);
  const [thaliLoading, setThaliLoading] = useState(false);
  const [thaliError, setThaliError] = useState<string | null>(null);

  // Calorie calculation state
  const [calorieData, setCalorieData] = useState<any>(null);
  const [calorieLoading, setCalorieLoading] = useState(false);
  const [calorieError, setCalorieError] = useState<string | null>(null);

  // Meal-wise calorie tracking state
  const [consumedCalories, setConsumedCalories] = useState<{
    breakfast: number;
    lunch: number;
    evening_snack: number;
    dinner: number;
  }>({ breakfast: 0, lunch: 0, evening_snack: 0, dinner: 0 });

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceTranscript(transcript);
          processVoiceInput(transcript);
        };
        
        recognitionInstance.onerror = (event: any) => {
          setVoiceError('Voice recognition error: ' + event.error);
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Load token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('nutrisathi_token');
    const savedUser = localStorage.getItem('nutrisathi_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('nutrisathi_token');
        localStorage.removeItem('nutrisathi_user');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAll();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setProfileForm({ 
        name: user.name, 
        email: user.email, 
        currentPassword: '', 
        newPassword: '',
        gender: user.gender || '',
        age: user.age?.toString() || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        activity_level: user.activity_level || '',
        dietary_preference: user.dietary_preference || '',
        health_goal: user.health_goal || '',
        allergies: user.allergies || ''
      });
    }
  }, [user]);

  async function handleAuth(type: 'login' | 'signup') {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/signup';
      const payload = type === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password };
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(errData.detail || 'Authentication failed');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('nutrisathi_token', data.token);
      localStorage.setItem('nutrisathi_user', JSON.stringify(data.user));
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err: any) {
      setAuthError(err?.message ?? 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('nutrisathi_token');
      localStorage.removeItem('nutrisathi_user');
      setMeals([]);
      setDishes([]);
      setStats(null);
    }
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [mealsRes, dishesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/meals`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/dishes`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/gamification/stats`, { headers }).then(r => r.json()).catch(() => null),
      ]);
      setMeals(Array.isArray(mealsRes) ? mealsRes.slice().reverse() : []);
      setDishes(Array.isArray(dishesRes) ? dishesRes : []);
      setStats(statsRes ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    return meals.reduce((acc, m) => {
      acc.calories += Number(m.calories ?? 0);
      acc.protein += Number(m.protein ?? 0);
      acc.carbs += Number(m.carbs ?? 0);
      acc.fat += Number(m.fat ?? 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  // Calculate consumed calories per meal type from today's meals
  useEffect(() => {
    const today = new Date().toDateString();
    const todaysMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp).toDateString();
      return mealDate === today;
    });

    const consumed = {
      breakfast: 0,
      lunch: 0,
      evening_snack: 0,
      dinner: 0
    };

    todaysMeals.forEach(meal => {
      const calories = meal.calories || 0;
      const mealType = meal.meal_type?.toLowerCase();
      
      if (mealType === 'breakfast') {
        consumed.breakfast += calories;
      } else if (mealType === 'lunch') {
        consumed.lunch += calories;
      } else if (mealType === 'evening snack' || mealType === 'snack') {
        consumed.evening_snack += calories;
      } else if (mealType === 'dinner') {
        consumed.dinner += calories;
      }
    });

    setConsumedCalories(consumed);
  }, [meals]);

  async function submitMeal(payload: any) {
    setLogging(true); setLogError(null);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/meals`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) throw new Error('Failed to log');
      const created = await res.json();
      setMeals(prev => [created, ...prev]);
      
      const s = await fetch(`${API_BASE}/gamification/stats`, { 
        headers 
      }).then(r => r.json()).catch(() => null);
      setStats(s);
      setShowLogger(false);
      setForm({ name:'', serving_size:100, unit:'g', calories:'', protein:'', carbs:'', fat:'', meal_type: 'Breakfast' });
      setBaseServing(100);
      setBaseNutrition(null);
    } catch (err: any) {
      setLogError(err?.message ?? 'Failed to log meal');
    } finally {
      setLogging(false);
    }
  }

  async function deleteMeal(mealId: number) {
    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/meals/${mealId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('Failed to delete meal');

      // Remove from local state
      setMeals(prev => prev.filter(m => m.id !== mealId));

      // Refresh stats
      const s = await fetch(`${API_BASE}/gamification/stats`, { headers }).then(r => r.json()).catch(() => null);
      setStats(s);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete meal');
    }
  }

  // Voice recognition functions
  function startVoiceRecognition() {
    if (!recognition) {
      setVoiceError('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    setVoiceError(null);
    setVoiceTranscript('');
    setIsListening(true);
    recognition.start();
  }

  function stopVoiceRecognition() {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  }

  function processVoiceInput(transcript: string) {
    // Parse voice input for meal details
    // Examples: "I ate 200 grams of chicken curry for lunch"
    //          "Log 150 grams of rice"
    //          "I had paneer tikka for dinner 250 grams"
    
    const lowerTranscript = transcript.toLowerCase();
    
    // Extract serving size (look for numbers followed by grams/g/kg)
    let servingSize = 100;
    const servingMatch = lowerTranscript.match(/(\\d+)\\s*(grams?|g|kg)/i);
    if (servingMatch) {
      servingSize = parseInt(servingMatch[1]);
      if (servingMatch[2].startsWith('kg')) {
        servingSize *= 1000;
      }
    }

    // Extract meal type
    let mealType = form.meal_type;
    if (lowerTranscript.includes('breakfast')) mealType = 'Breakfast';
    else if (lowerTranscript.includes('lunch')) mealType = 'Lunch';
    else if (lowerTranscript.includes('dinner')) mealType = 'Dinner';
    else if (lowerTranscript.includes('snack')) mealType = 'Evening Snack';

    // Extract food name - try to match with existing dishes
    let foodName = '';
    const words = transcript.split(' ');
    
    // Try to find matching dish from database
    for (const dish of dishes) {
      const dishNameLower = dish.name.toLowerCase();
      if (lowerTranscript.includes(dishNameLower)) {
        foodName = dish.name;
        // Auto-fill nutrition if dish found
        selectDish(dish, servingSize, mealType);
        return;
      }
    }

    // If no exact match, try partial matching (2-3 word combinations)
    for (let i = 0; i < words.length - 1; i++) {
      const combo2 = (words[i] + ' ' + words[i + 1]).toLowerCase();
      const combo3 = i < words.length - 2 ? (words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]).toLowerCase() : '';
      
      for (const dish of dishes) {
        const dishNameLower = dish.name.toLowerCase();
        if (dishNameLower.includes(combo2) || (combo3 && dishNameLower.includes(combo3))) {
          selectDish(dish, servingSize, mealType);
          return;
        }
      }
    }

    // If no match found, just set the raw transcript as name
    foodName = transcript.replace(/\\d+\\s*(grams?|g|kg)/gi, '').replace(/for (breakfast|lunch|dinner|snack)/gi, '').trim();
    
    setForm(prev => ({
      ...prev,
      name: foodName,
      serving_size: servingSize,
      meal_type: mealType
    }));
  }

  // Update thaliRequest when user changes
  useEffect(() => {
    if (user) {
      setThaliRequest(prev => ({
        ...prev,
        dietary_preference: user.dietary_preference || '',
        health_goal: user.health_goal || '',
        allergies: user.allergies || ''
      }));
    }
  }, [user]);

  // Thali recommendation function
  async function getThaliRecommendation() {
    setThaliLoading(true);
    setThaliError(null);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/ai/recommend-thali`, {
        method: 'POST',
        headers,
        body: JSON.stringify(thaliRequest)
      });

      if (!res.ok) throw new Error('Failed to get recommendation');
      
      const data = await res.json();
      setThaliRecommendation(data);
    } catch (err: any) {
      setThaliError(err?.message || 'Failed to get recommendation');
    } finally {
      setThaliLoading(false);
    }
  }

  // Calorie calculation function
  async function calculateCalories() {
    if (!user?.weight || !user?.height || !user?.age || !user?.gender) {
      setCalorieError('Please complete your profile (weight, height, age, gender) to calculate calories');
      return;
    }

    setCalorieLoading(true);
    setCalorieError(null);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/ai/calculate-calories`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to calculate calories' }));
        throw new Error(errData.detail || 'Failed to calculate calories');
      }
      
      const data = await res.json();
      setCalorieData(data);
    } catch (err: any) {
      setCalorieError(err?.message || 'Failed to calculate calories');
    } finally {
      setCalorieLoading(false);
    }
  }

  // Auto-calculate calories when user profile changes
  useEffect(() => {
    if (user && user.weight && user.height && user.age && user.gender) {
      calculateCalories();
    }
  }, [user?.weight, user?.height, user?.age, user?.gender, user?.activity_level, user?.health_goal]);

  const recommendations = useMemo(() => {
    if (!dishes || dishes.length === 0) return [];
    const sorted = [...dishes].sort((a,b) => (b.protein||0) - (a.protein||0));
    return sorted.slice(0,6);
  }, [dishes]);

  const healthMetrics = useMemo(() => {
    if (!user?.height || !user?.weight) return null;
    
    const heightInMeters = user.height / 100;
    const bmi = user.weight / (heightInMeters * heightInMeters);
    
    let bmiCategory = '';
    let bmiColor = '';
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = '#3b82f6';
    } else if (bmi < 25) {
      bmiCategory = 'Normal';
      bmiColor = '#10b981';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = '#f59e0b';
    } else {
      bmiCategory = 'Obese';
      bmiColor = '#ef4444';
    }
    
    return { bmi: bmi.toFixed(1), bmiCategory, bmiColor };
  }, [user?.height, user?.weight]);

  const analyticsData = useMemo(() => {
    if (meals.length === 0) return null;

    // Get unique days
    const days = new Set(meals.map(m => new Date(m.timestamp).toDateString()));
    const numDays = days.size || 1;

    // Daily averages
    const dailyAvg = {
      calories: Math.round(totals.calories / numDays),
      protein: Math.round(totals.protein / numDays),
      carbs: Math.round(totals.carbs / numDays),
      fat: Math.round(totals.fat / numDays)
    };

    // Macro percentages (based on calories: P=4cal/g, C=4cal/g, F=9cal/g)
    const proteinCal = totals.protein * 4;
    const carbsCal = totals.carbs * 4;
    const fatCal = totals.fat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal || 1;

    const macroRatio = {
      protein: Math.round((proteinCal / totalMacroCal) * 100),
      carbs: Math.round((carbsCal / totalMacroCal) * 100),
      fat: Math.round((fatCal / totalMacroCal) * 100)
    };

    // Meal frequency by time of day
    const mealsByTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    meals.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      if (hour >= 5 && hour < 12) mealsByTime.morning++;
      else if (hour >= 12 && hour < 17) mealsByTime.afternoon++;
      else if (hour >= 17 && hour < 21) mealsByTime.evening++;
      else mealsByTime.night++;
    });

    // Meal frequency by meal type
    const mealsByType = { breakfast: 0, lunch: 0, snack: 0, dinner: 0, other: 0 };
    const caloriesByType = { breakfast: 0, lunch: 0, snack: 0, dinner: 0, other: 0 };
    meals.forEach(m => {
      const calories = m.calories || 0;
      switch(m.meal_type) {
        case 'Breakfast':
          mealsByType.breakfast++;
          caloriesByType.breakfast += calories;
          break;
        case 'Lunch':
          mealsByType.lunch++;
          caloriesByType.lunch += calories;
          break;
        case 'Evening Snack':
          mealsByType.snack++;
          caloriesByType.snack += calories;
          break;
        case 'Dinner':
          mealsByType.dinner++;
          caloriesByType.dinner += calories;
          break;
        default:
          mealsByType.other++;
          caloriesByType.other += calories;
      }
    });

    // Top meals by calories
    const topMeals = [...meals]
      .filter(m => m.calories)
      .sort((a, b) => (b.calories || 0) - (a.calories || 0))
      .slice(0, 5);

    // Recommendations based on user goals
    const recommendations = [];
    if (user?.health_goal === 'Weight Loss' && dailyAvg.calories > 2000) {
      recommendations.push('Consider reducing daily calorie intake to 1500-1800 kcal for weight loss');
    }
    if (user?.health_goal === 'Muscle Building' && dailyAvg.protein < 150) {
      recommendations.push('Increase protein intake to 1.6-2.2g per kg body weight for muscle building');
    }
    if (macroRatio.carbs > 60) {
      recommendations.push('Your carb intake is high. Consider balancing with more protein and healthy fats');
    }
    if (macroRatio.protein < 15) {
      recommendations.push('Protein intake is low. Aim for 15-30% of total calories from protein');
    }
    if (mealsByTime.night > meals.length * 0.3) {
      recommendations.push('Try to avoid heavy meals late at night for better digestion');
    }

    return { dailyAvg, macroRatio, mealsByTime, mealsByType, caloriesByType, topMeals, recommendations, numDays };
  }, [meals, totals, user]);

  function handleMealNameChange(value: string) {
    setForm({...form, name: value});
    if (value.trim().length >= 2) {
      const matches = dishes.filter(d => 
        d.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setFilteredDishes(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredDishes([]);
    }
  }

  function selectDish(dish: any, customServingSize?: number, customMealType?: string) {
    const servingSize = customServingSize || dish.serving_size || 100;
    setForm({
      name: dish.name,
      serving_size: servingSize,
      unit: dish.unit || 'g',
      calories: dish.calories?.toString() || '',
      protein: dish.protein?.toString() || '',
      carbs: dish.carbs?.toString() || '',
      fat: dish.fat?.toString() || '',
      meal_type: customMealType || form.meal_type
    });
    // Save base serving and nutrition for scaling
    setBaseServing(dish.serving_size || 100);
    setBaseNutrition({
      calories: dish.calories || 0,
      protein: dish.protein || 0,
      carbs: dish.carbs || 0,
      fat: dish.fat || 0
    });
    
    // Scale nutrition if custom serving size provided
    if (customServingSize && dish.serving_size) {
      const ratio = customServingSize / dish.serving_size;
      setForm(prev => ({
        ...prev,
        calories: Math.round((dish.calories || 0) * ratio).toString(),
        protein: Math.round((dish.protein || 0) * ratio).toString(),
        carbs: Math.round((dish.carbs || 0) * ratio).toString(),
        fat: Math.round((dish.fat || 0) * ratio).toString()
      }));
    }
    
    setShowSuggestions(false);
    setFilteredDishes([]);
  }

  function handleServingSizeChange(newServingSize: number) {
    if (baseNutrition && baseServing > 0) {
      const ratio = newServingSize / baseServing;
      setForm({
        ...form,
        serving_size: newServingSize,
        calories: Math.round(baseNutrition.calories * ratio).toString(),
        protein: Math.round(baseNutrition.protein * ratio).toString(),
        carbs: Math.round(baseNutrition.carbs * ratio).toString(),
        fat: Math.round(baseNutrition.fat * ratio).toString()
      });
    } else {
      setForm({...form, serving_size: newServingSize});
    }
  }

  async function handleProfileUpdate() {
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      if (!user?.email) {
        setProfileError('Not logged in');
        return;
      }

      const authToken = token || localStorage.getItem('nutrisathi_token');
      if (!authToken) {
        setProfileError('No authentication token found. Please login again.');
        return;
      }

      // Call backend to update profile
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: profileForm.name,
          gender: profileForm.gender || undefined,
          age: profileForm.age ? parseInt(profileForm.age) : undefined,
          height: profileForm.height ? parseFloat(profileForm.height) : undefined,
          weight: profileForm.weight ? parseFloat(profileForm.weight) : undefined,
          activity_level: profileForm.activity_level || undefined,
          dietary_preference: profileForm.dietary_preference || undefined,
          health_goal: profileForm.health_goal || undefined,
          allergies: profileForm.allergies || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update profile');
      }

      const updatedUserData = await response.json();
      
      // Update local state with response from backend
      const updatedUser = {
        ...user,
        name: updatedUserData.name,
        gender: updatedUserData.gender,
        age: updatedUserData.age,
        height: updatedUserData.height,
        weight: updatedUserData.weight,
        activity_level: updatedUserData.activity_level,
        dietary_preference: updatedUserData.dietary_preference,
        health_goal: updatedUserData.health_goal,
        allergies: updatedUserData.allergies
      };
      
      setUser(updatedUser);
      localStorage.setItem('nutrisathi_user', JSON.stringify(updatedUser));
      setProfileSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(null), 3000);
      
      // Auto-calculate calories after profile update
      if (updatedUser.weight && updatedUser.height && updatedUser.age && updatedUser.gender) {
        setTimeout(() => calculateCalories(), 500);
      }
    } catch (err: any) {
      setProfileError(err?.message ?? 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  // Show auth UI if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{width:48,height:48,background:'#2563eb',borderRadius:12,margin:'0 auto 12px'}}></div>
            <h2 style={{margin:0,fontSize:24}}>NutriSathi</h2>
            <p style={{color:'#6b7280',margin:'8px 0 0',fontSize:14}}>Your nutrition companion</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={authView === 'login' ? 'active' : ''} 
              onClick={() => { setAuthView('login'); setAuthError(null); }}
            >
              Login
            </button>
            <button 
              className={authView === 'signup' ? 'active' : ''} 
              onClick={() => { setAuthView('signup'); setAuthError(null); }}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleAuth(authView); }}>
            {authView === 'signup' && (
              <div>
                <label>Name</label>
                <input 
                  type="text" 
                  value={authForm.name} 
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  required
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label>Email</label>
              <input 
                type="email" 
                value={authForm.email} 
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label>Password</label>
              <input 
                type="password" 
                value={authForm.password} 
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {authError && <div className="error-msg">{authError}</div>}

            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Please wait...' : (authView === 'login' ? 'Login' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div style={{width:36,height:36,background:'#2563eb',borderRadius:8}}></div>
          <h1>NutriSathi</h1>
        </div>

        <div className="profile">
          <div style={{
            width:44,
            height:44,
            borderRadius:10,
            background:'#c7d2fe',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontWeight:700,
            fontSize:18,
            color:'#2563eb'
          }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <div style={{fontWeight:700}}>{user?.name ?? 'User'}</div>
            <div style={{color:'#6b7280',fontSize:12}}>{user?.email ?? ''}</div>
          </div>
        </div>

        <nav className="nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={()=>setView('dashboard')}>Dashboard</button>
          <button onClick={()=>{ setShowLogger(true); }}>Log Meal</button>
          <button className={view === 'history' ? 'active' : ''} onClick={()=>setView('history')}>History</button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={()=>setView('analytics')}>Analytics</button>
          <button className={view === 'bmi-analyzer' ? 'active' : ''} onClick={()=>setView('bmi-analyzer')}>BMI Analyzer</button>
          <button className={view === 'gamification' ? 'active' : ''} onClick={()=>setView('gamification')}>Gamification</button>
          <button className={view === 'recommendations' ? 'active' : ''} onClick={()=>setView('recommendations')}>Recommendations</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={()=>setView('settings')}>Profile</button>
          <button onClick={handleLogout} style={{marginTop:20,background:'#ef4444'}}>Logout</button>
        </nav>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <h2 style={{margin:0}}>Welcome back!</h2>
            <div style={{color:'#6b7280',marginTop:6}}>Manage meals, track nutrition, and stay motivated.</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button 
              className="btn" 
              onClick={() => {
                setShowLogger(true);
                setTimeout(() => startVoiceRecognition(), 300);
              }}
              style={{
                background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display:'flex',
                alignItems:'center',
                gap:6,
                padding:'10px 16px'
              }}
              title="Log meal with voice"
            >
              <span style={{fontSize:18}}>🎤</span>
              <span>Voice Log</span>
            </button>
            <button className="btn" onClick={() => setShowLogger(true)}>+ Log Meal</button>
            {error && <div style={{background:'#fff1f2',color:'#991b1b',padding:'6px 10px',borderRadius:8}}>{error}</div>}
            {!error && stats && (
              <div style={{fontSize:12,color:'#6b7280'}}>Level {stats.level} • XP {stats.currentXP}/{stats.xpToNextLevel}</div>
            )}
          </div>
        </div>

        {/* Content */}
        {view === 'dashboard' && (
          <>
            {/* Stats Overview */}
            <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))'}}>
              <div className="card" style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'#fff'}}>
                <div style={{opacity:0.9,fontSize:13,marginBottom:8}}>Total Calories</div>
                <div style={{fontSize:28,fontWeight:700}}>{totals.calories}</div>
                <div style={{opacity:0.8,fontSize:12,marginTop:4}}>kcal today</div>
                {user?.health_goal === 'Weight Loss' && (
                  <div style={{opacity:0.9,fontSize:11,marginTop:6,background:'rgba(255,255,255,0.2)',padding:'4px 8px',borderRadius:4,display:'inline-block'}}>
                    Target: ~1500-1800 kcal
                  </div>
                )}
              </div>

              <div className="card" style={{background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',color:'#fff'}}>
                <div style={{opacity:0.9,fontSize:13,marginBottom:8}}>Protein</div>
                <div style={{fontSize:28,fontWeight:700}}>{totals.protein}g</div>
                <div style={{opacity:0.8,fontSize:12,marginTop:4}}>
                  {user?.weight ? `${Math.round((totals.protein / user.weight) * 10) / 10}g per kg` : 'today'}
                </div>
              </div>

              <div className="card" style={{background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',color:'#fff'}}>
                <div style={{opacity:0.9,fontSize:13,marginBottom:8}}>Meals Logged</div>
                <div style={{fontSize:28,fontWeight:700}}>{meals.length}</div>
                <div style={{opacity:0.8,fontSize:12,marginTop:4}}>
                  {stats ? `Level ${stats.level} • ${stats.currentStreak}d streak` : 'all time'}
                </div>
              </div>

              <div className="card" style={{background:'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',color:'#fff'}}>
                <div style={{opacity:0.9,fontSize:13,marginBottom:8}}>Progress</div>
                <div style={{fontSize:28,fontWeight:700}}>{stats?.currentXP ?? 0} XP</div>
                <div style={{opacity:0.8,fontSize:12,marginTop:4}}>
                  {stats ? `${stats.xpToNextLevel - stats.currentXP} to Level ${stats.level + 1}` : 'Keep logging!'}
                </div>
              </div>
            </div>

            {/* AI Daily Calorie Calculator */}
            {!calorieData && user && (!user.weight || !user.height || !user.age || !user.gender || !user.activity_level || !user.health_goal) && (
              <div className="card" style={{marginTop:16,background:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',border:'2px solid #f59e0b',padding:20}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
                    📊
                  </div>
                  <div>
                    <h3 style={{margin:0,color:'#92400e',fontSize:18,fontWeight:700}}>Complete Your Profile to See Progress Bars</h3>
                    <div style={{fontSize:13,color:'#78350f',marginTop:4}}>
                      Fill in your profile details to unlock AI calorie tracking and meal-wise progress bars
                    </div>
                  </div>
                </div>
                <div style={{fontSize:13,color:'#78350f',marginBottom:12}}>
                  <strong>Missing information:</strong>
                  <ul style={{margin:'8px 0',paddingLeft:20}}>
                    {!user.weight && <li>Weight</li>}
                    {!user.height && <li>Height</li>}
                    {!user.age && <li>Age</li>}
                    {!user.gender && <li>Gender</li>}
                    {!user.activity_level && <li>Activity Level</li>}
                    {!user.health_goal && <li>Health Goal</li>}
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="btn"
                  style={{background:'#f59e0b',color:'#fff',padding:'10px 16px',fontSize:14,fontWeight:600}}
                >
                  ✏️ Complete Profile Now
                </button>
              </div>
            )}
            
            {calorieData && (
              <div className="card" style={{marginTop:16,background:'linear-gradient(135deg, #667eea20 0%, #764ba210 100%)',border:'2px solid #667eea'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:16}}>
                  <div>
                    <h3 style={{margin:0,color:'#667eea',fontSize:20}}>🤖 AI Daily Calorie Plan</h3>
                    <div style={{fontSize:13,color:'#6b7280',marginTop:4}}>
                      Scientifically calculated using Mifflin-St Jeor formula
                    </div>
                  </div>
                  <button
                    onClick={calculateCalories}
                    className="btn"
                    style={{padding:'6px 12px',fontSize:12,background:'#667eea'}}
                    disabled={calorieLoading}
                  >
                    {calorieLoading ? 'Calculating...' : '🔄 Refresh'}
                  </button>
                </div>

                {/* Main Calorie Targets */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:12,marginBottom:16}}>
                  <div style={{padding:16,background:'#fff',borderRadius:10,textAlign:'center',border:'2px solid #667eea'}}>
                    <div style={{fontSize:13,color:'#6b7280',marginBottom:6}}>Daily Target</div>
                    <div style={{fontSize:32,fontWeight:700,color:'#667eea'}}>{calorieData.daily_calories}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>calories</div>
                  </div>
                  <div style={{padding:16,background:'#fff',borderRadius:10,textAlign:'center'}}>
                    <div style={{fontSize:13,color:'#6b7280',marginBottom:6}}>BMR</div>
                    <div style={{fontSize:28,fontWeight:700,color:'#10b981'}}>{calorieData.bmr}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>calories at rest</div>
                  </div>
                  <div style={{padding:16,background:'#fff',borderRadius:10,textAlign:'center'}}>
                    <div style={{fontSize:13,color:'#6b7280',marginBottom:6}}>TDEE</div>
                    <div style={{fontSize:28,fontWeight:700,color:'#3b82f6'}}>{calorieData.tdee}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>maintenance</div>
                  </div>
                  <div style={{padding:16,background:'#fff',borderRadius:10,textAlign:'center'}}>
                    <div style={{fontSize:13,color:'#6b7280',marginBottom:6}}>Adjustment</div>
                    <div style={{fontSize:28,fontWeight:700,color:calorieData.adjustment < 0 ? '#ef4444' : '#10b981'}}>
                      {calorieData.adjustment > 0 ? '+' : ''}{calorieData.adjustment}
                    </div>
                    <div style={{fontSize:11,color:'#6b7280'}}>for goal</div>
                  </div>
                </div>

                {/* Meal Distribution with Progress Bars - UPGRADED PREMIUM UI */}
                <div style={{background:'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',padding:20,borderRadius:16,marginBottom:20,boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                    <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(102,126,234,0.4)'}}>
                      <span style={{fontSize:20}}>📊</span>
                    </div>
                    <h4 style={{margin:0,fontSize:20,fontWeight:700,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                      Meal-wise Calorie Tracker
                    </h4>
                  </div>
                  <div style={{display:'grid',gap:16}}>
                    {/* Breakfast Progress Bar - PREMIUM */}
                    {(() => {
                      const target = calorieData.meal_calories.breakfast;
                      const consumed = consumedCalories.breakfast;
                      const remaining = Math.max(0, target - consumed);
                      const percentage = Math.min(100, (consumed / target) * 100);
                      const isOver = consumed > target;
                      
                      return (
                        <div style={{
                          padding:16,
                          background:isOver ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          borderRadius:16,
                          border:isOver ? '2px solid #dc2626' : '2px solid #f59e0b',
                          boxShadow:isOver ? '0 8px 25px rgba(220,38,38,0.25)' : '0 8px 25px rgba(245,158,11,0.25)',
                          transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position:'relative',
                          overflow:'hidden'
                        }}>
                          {/* Animated glow effect */}
                          <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',animation:'shimmer 3s infinite',pointerEvents:'none'}} />
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,position:'relative',zIndex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:44,height:44,borderRadius:12,background:isOver ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(245,158,11,0.4)',fontSize:22}}>
                                🌅
                              </div>
                              <div>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <span style={{fontWeight:700,fontSize:16,color:'#92400e'}}>Breakfast</span>
                                  <span style={{fontSize:11,background:'rgba(255,255,255,0.9)',color:'#92400e',padding:'3px 8px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                                    {calorieData.meal_split_percentages.breakfast}% of daily
                                  </span>
                                </div>
                                <div style={{fontSize:12,color:'#78350f',marginTop:2,fontWeight:500}}>
                                  Morning fuel & energy
                                </div>
                              </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:20,fontWeight:800,color:isOver ? '#dc2626' : '#92400e',letterSpacing:'-0.5px'}}>
                                {consumed}
                                <span style={{fontSize:14,fontWeight:600,color:'#78350f',marginLeft:2}}>/ {target}</span>
                              </div>
                              <div style={{fontSize:11,color:'#78350f',fontWeight:600,marginTop:2}}>
                                {Math.round(percentage)}% consumed
                              </div>
                            </div>
                          </div>
                          
                          {/* Premium Progress Bar */}
                          <div style={{position:'relative',height:24,background:'rgba(251,191,36,0.2)',borderRadius:12,overflow:'hidden',boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1)',marginBottom:10}}>
                            <div style={{
                              position:'absolute',
                              left:0,
                              top:0,
                              bottom:0,
                              width:`${percentage}%`,
                              background:isOver ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)' : percentage < 50 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : percentage < 80 ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              borderRadius:12,
                              transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
                              boxShadow:isOver ? '0 2px 10px rgba(220,38,38,0.5)' : percentage < 50 ? '0 2px 10px rgba(16,185,129,0.5)' : percentage < 80 ? '0 2px 10px rgba(245,158,11,0.5)' : '0 2px 10px rgba(239,68,68,0.5)',
                              overflow:'hidden'
                            }}>
                              {/* Animated shine effect on bar */}
                              <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',animation:'shimmer 2s infinite'}} />
                            </div>
                          </div>
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
                            <div style={{fontSize:13,color:isOver ? '#dc2626' : '#065f46',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                              {isOver ? (
                                <>
                                  <span style={{fontSize:16}}>⚠️</span>
                                  <span>Over by <strong>{consumed - target} kcal</strong></span>
                                </>
                              ) : (
                                <>
                                  <span style={{fontSize:16}}>✅</span>
                                  <span><strong>{remaining} kcal</strong> remaining</span>
                                </>
                              )}
                            </div>
                            <div style={{fontSize:11,color:'#78350f',fontWeight:600,background:'rgba(255,255,255,0.6)',padding:'4px 10px',borderRadius:8}}>
                              {isOver ? 'EXCEED' : percentage > 90 ? 'ALMOST THERE' : percentage > 50 ? 'ON TRACK' : 'PLENTY LEFT'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Lunch Progress Bar - PREMIUM */}
                    {(() => {
                      const target = calorieData.meal_calories.lunch;
                      const consumed = consumedCalories.lunch;
                      const remaining = Math.max(0, target - consumed);
                      const percentage = Math.min(100, (consumed / target) * 100);
                      const isOver = consumed > target;
                      
                      return (
                        <div style={{
                          padding:16,
                          background:isOver ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          borderRadius:16,
                          border:isOver ? '2px solid #dc2626' : '2px solid #3b82f6',
                          boxShadow:isOver ? '0 8px 25px rgba(220,38,38,0.25)' : '0 8px 25px rgba(59,130,246,0.25)',
                          transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position:'relative',
                          overflow:'hidden'
                        }}>
                          <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',animation:'shimmer 3s infinite',pointerEvents:'none'}} />
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,position:'relative',zIndex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:44,height:44,borderRadius:12,background:isOver ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(59,130,246,0.4)',fontSize:22}}>
                                ☀️
                              </div>
                              <div>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <span style={{fontWeight:700,fontSize:16,color:'#1e40af'}}>Lunch</span>
                                  <span style={{fontSize:11,background:'rgba(255,255,255,0.9)',color:'#1e40af',padding:'3px 8px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                                    {calorieData.meal_split_percentages.lunch}% of daily
                                  </span>
                                </div>
                                <div style={{fontSize:12,color:'#1e3a8a',marginTop:2,fontWeight:500}}>
                                  Main meal & nutrition
                                </div>
                              </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:20,fontWeight:800,color:isOver ? '#dc2626' : '#1e40af',letterSpacing:'-0.5px'}}>
                                {consumed}
                                <span style={{fontSize:14,fontWeight:600,color:'#1e3a8a',marginLeft:2}}>/ {target}</span>
                              </div>
                              <div style={{fontSize:11,color:'#1e3a8a',fontWeight:600,marginTop:2}}>
                                {Math.round(percentage)}% consumed
                              </div>
                            </div>
                          </div>
                          
                          <div style={{position:'relative',height:24,background:'rgba(147,197,253,0.2)',borderRadius:12,overflow:'hidden',boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1)',marginBottom:10}}>
                            <div style={{
                              position:'absolute',
                              left:0,
                              top:0,
                              bottom:0,
                              width:`${percentage}%`,
                              background:isOver ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)' : percentage < 50 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : percentage < 80 ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              borderRadius:12,
                              transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
                              boxShadow:isOver ? '0 2px 10px rgba(220,38,38,0.5)' : percentage < 50 ? '0 2px 10px rgba(16,185,129,0.5)' : percentage < 80 ? '0 2px 10px rgba(59,130,246,0.5)' : '0 2px 10px rgba(239,68,68,0.5)',
                              overflow:'hidden'
                            }}>
                              <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',animation:'shimmer 2s infinite'}} />
                            </div>
                          </div>
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
                            <div style={{fontSize:13,color:isOver ? '#dc2626' : '#065f46',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                              {isOver ? (
                                <>
                                  <span style={{fontSize:16}}>⚠️</span>
                                  <span>Over by <strong>{consumed - target} kcal</strong></span>
                                </>
                              ) : (
                                <>
                                  <span style={{fontSize:16}}>✅</span>
                                  <span><strong>{remaining} kcal</strong> remaining</span>
                                </>
                              )}
                            </div>
                            <div style={{fontSize:11,color:'#1e3a8a',fontWeight:600,background:'rgba(255,255,255,0.6)',padding:'4px 10px',borderRadius:8}}>
                              {isOver ? 'EXCEED' : percentage > 90 ? 'ALMOST THERE' : percentage > 50 ? 'ON TRACK' : 'PLENTY LEFT'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Evening Snack Progress Bar - PREMIUM */}
                    {(() => {
                      const target = calorieData.meal_calories.evening_snack;
                      const consumed = consumedCalories.evening_snack;
                      const remaining = Math.max(0, target - consumed);
                      const percentage = Math.min(100, (consumed / target) * 100);
                      const isOver = consumed > target;
                      
                      return (
                        <div style={{
                          padding:16,
                          background:isOver ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                          borderRadius:16,
                          border:isOver ? '2px solid #dc2626' : '2px solid #10b981',
                          boxShadow:isOver ? '0 8px 25px rgba(220,38,38,0.25)' : '0 8px 25px rgba(16,185,129,0.25)',
                          transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position:'relative',
                          overflow:'hidden'
                        }}>
                          <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',animation:'shimmer 3s infinite',pointerEvents:'none'}} />
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,position:'relative',zIndex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:44,height:44,borderRadius:12,background:isOver ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(16,185,129,0.4)',fontSize:22}}>
                                🍵
                              </div>
                              <div>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <span style={{fontWeight:700,fontSize:16,color:'#065f46'}}>Evening Snack</span>
                                  <span style={{fontSize:11,background:'rgba(255,255,255,0.9)',color:'#065f46',padding:'3px 8px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                                    {calorieData.meal_split_percentages.evening_snack}% of daily
                                  </span>
                                </div>
                                <div style={{fontSize:12,color:'#064e3b',marginTop:2,fontWeight:500}}>
                                  Light refreshment
                                </div>
                              </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:20,fontWeight:800,color:isOver ? '#dc2626' : '#065f46',letterSpacing:'-0.5px'}}>
                                {consumed}
                                <span style={{fontSize:14,fontWeight:600,color:'#064e3b',marginLeft:2}}>/ {target}</span>
                              </div>
                              <div style={{fontSize:11,color:'#064e3b',fontWeight:600,marginTop:2}}>
                                {Math.round(percentage)}% consumed
                              </div>
                            </div>
                          </div>
                          
                          <div style={{position:'relative',height:24,background:'rgba(110,231,183,0.2)',borderRadius:12,overflow:'hidden',boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1)',marginBottom:10}}>
                            <div style={{
                              position:'absolute',
                              left:0,
                              top:0,
                              bottom:0,
                              width:`${percentage}%`,
                              background:isOver ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)' : percentage < 50 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : percentage < 80 ? 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)' : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              borderRadius:12,
                              transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
                              boxShadow:isOver ? '0 2px 10px rgba(220,38,38,0.5)' : '0 2px 10px rgba(16,185,129,0.5)',
                              overflow:'hidden'
                            }}>
                              <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',animation:'shimmer 2s infinite'}} />
                            </div>
                          </div>
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
                            <div style={{fontSize:13,color:isOver ? '#dc2626' : '#065f46',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                              {isOver ? (
                                <>
                                  <span style={{fontSize:16}}>⚠️</span>
                                  <span>Over by <strong>{consumed - target} kcal</strong></span>
                                </>
                              ) : (
                                <>
                                  <span style={{fontSize:16}}>✅</span>
                                  <span><strong>{remaining} kcal</strong> remaining</span>
                                </>
                              )}
                            </div>
                            <div style={{fontSize:11,color:'#064e3b',fontWeight:600,background:'rgba(255,255,255,0.6)',padding:'4px 10px',borderRadius:8}}>
                              {isOver ? 'EXCEED' : percentage > 90 ? 'ALMOST THERE' : percentage > 50 ? 'ON TRACK' : 'PLENTY LEFT'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Dinner Progress Bar - PREMIUM */}
                    {(() => {
                      const target = calorieData.meal_calories.dinner;
                      const consumed = consumedCalories.dinner;
                      const remaining = Math.max(0, target - consumed);
                      const percentage = Math.min(100, (consumed / target) * 100);
                      const isOver = consumed > target;
                      
                      return (
                        <div style={{
                          padding:16,
                          background:isOver ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)',
                          borderRadius:16,
                          border:isOver ? '2px solid #dc2626' : '2px solid #8b5cf6',
                          boxShadow:isOver ? '0 8px 25px rgba(220,38,38,0.25)' : '0 8px 25px rgba(139,92,246,0.25)',
                          transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position:'relative',
                          overflow:'hidden'
                        }}>
                          <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',animation:'shimmer 3s infinite',pointerEvents:'none'}} />
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,position:'relative',zIndex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:44,height:44,borderRadius:12,background:isOver ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(139,92,246,0.4)',fontSize:22}}>
                                🌙
                              </div>
                              <div>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <span style={{fontWeight:700,fontSize:16,color:'#5b21b6'}}>Dinner</span>
                                  <span style={{fontSize:11,background:'rgba(255,255,255,0.9)',color:'#5b21b6',padding:'3px 8px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                                    {calorieData.meal_split_percentages.dinner}% of daily
                                  </span>
                                </div>
                                <div style={{fontSize:12,color:'#4c1d95',marginTop:2,fontWeight:500}}>
                                  Evening nourishment
                                </div>
                              </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:20,fontWeight:800,color:isOver ? '#dc2626' : '#5b21b6',letterSpacing:'-0.5px'}}>
                                {consumed}
                                <span style={{fontSize:14,fontWeight:600,color:'#4c1d95',marginLeft:2}}>/ {target}</span>
                              </div>
                              <div style={{fontSize:11,color:'#4c1d95',fontWeight:600,marginTop:2}}>
                                {Math.round(percentage)}% consumed
                              </div>
                            </div>
                          </div>
                          
                          <div style={{position:'relative',height:24,background:'rgba(196,181,253,0.2)',borderRadius:12,overflow:'hidden',boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1)',marginBottom:10}}>
                            <div style={{
                              position:'absolute',
                              left:0,
                              top:0,
                              bottom:0,
                              width:`${percentage}%`,
                              background:isOver ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)' : percentage < 50 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : percentage < 80 ? 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)' : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              borderRadius:12,
                              transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
                              boxShadow:isOver ? '0 2px 10px rgba(220,38,38,0.5)' : percentage < 50 ? '0 2px 10px rgba(16,185,129,0.5)' : percentage < 80 ? '0 2px 10px rgba(139,92,246,0.5)' : '0 2px 10px rgba(239,68,68,0.5)',
                              overflow:'hidden'
                            }}>
                              <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',animation:'shimmer 2s infinite'}} />
                            </div>
                          </div>
                          
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
                            <div style={{fontSize:13,color:isOver ? '#dc2626' : '#065f46',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                              {isOver ? (
                                <>
                                  <span style={{fontSize:16}}>⚠️</span>
                                  <span>Over by <strong>{consumed - target} kcal</strong></span>
                                </>
                              ) : (
                                <>
                                  <span style={{fontSize:16}}>✅</span>
                                  <span><strong>{remaining} kcal</strong> remaining</span>
                                </>
                              )}
                            </div>
                            <div style={{fontSize:11,color:'#4c1d95',fontWeight:600,background:'rgba(255,255,255,0.6)',padding:'4px 10px',borderRadius:8}}>
                              {isOver ? 'EXCEED' : percentage > 90 ? 'ALMOST THERE' : percentage > 50 ? 'ON TRACK' : 'PLENTY LEFT'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}                    
                  </div>
                  
                  {/* Overall Progress Summary - PREMIUM UPGRADED */}
                  {(() => {
                    const totalTarget = calorieData.daily_calories;
                    const totalConsumed = consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner;
                    const totalRemaining = Math.max(0, totalTarget - totalConsumed);
                    const totalPercentage = Math.min(100, (totalConsumed / totalTarget) * 100);
                    const isOver = totalConsumed > totalTarget;
                    
                    return (
                      <div style={{
                        marginTop:20,
                        padding:20,
                        background:isOver ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius:16,
                        border:isOver ? '2px solid #dc2626' : '2px solid #667eea',
                        boxShadow:isOver ? '0 10px 30px rgba(220,38,38,0.3)' : '0 10px 30px rgba(102,126,234,0.4)',
                        position:'relative',
                        overflow:'hidden'
                      }}>
                        {/* Animated background glow */}
                        <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',animation:'shimmer 4s infinite',pointerEvents:'none'}} />
                        
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,position:'relative',zIndex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:48,height:48,borderRadius:14,background:isOver ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #ffffff30 0%, #ffffff10 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 15px rgba(0,0,0,0.2)'}}>
                              {isOver ? '⚠️' : '📈'}
                            </div>
                            <div>
                              <span style={{fontSize:16,fontWeight:700,color:isOver ? '#7f1d1d' : '#ffffff',letterSpacing:'0.5px'}}>
                                TOTAL DAILY PROGRESS
                              </span>
                              <div style={{fontSize:12,color:isOver ? '#991b1b' : 'rgba(255,255,255,0.9)',marginTop:2,fontWeight:500}}>
                                {isOver ? 'Exceeded daily target' : 'Stay on track!'}
                              </div>
                            </div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:24,fontWeight:900,color:isOver ? '#7f1d1d' : '#ffffff',letterSpacing:'-1px'}}>
                              {totalConsumed}
                              <span style={{fontSize:16,fontWeight:600,marginLeft:4}}>/ {totalTarget}</span>
                            </div>
                            <div style={{fontSize:13,color:isOver ? '#991b1b' : 'rgba(255,255,255,0.95)',fontWeight:700,marginTop:2}}>
                              {Math.round(totalPercentage)}% of daily goal
                            </div>
                          </div>
                        </div>
                        
                        {/* Premium mega progress bar */}
                        <div style={{position:'relative',height:28,background:isOver ? 'rgba(127,29,29,0.3)' : 'rgba(255,255,255,0.2)',borderRadius:14,overflow:'hidden',boxShadow:'inset 0 3px 6px rgba(0,0,0,0.2)',marginBottom:12,zIndex:1}}>
                          <div style={{
                            position:'absolute',
                            left:0,
                            top:0,
                            bottom:0,
                            width:`${totalPercentage}%`,
                            background: isOver ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 30%, #f87171 60%, #ef4444 100%)' :
                                       totalPercentage < 50 ? 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)' : 
                                       totalPercentage < 80 ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)' : 
                                       'linear-gradient(90deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)',
                            borderRadius:14,
                            transition:'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease',
                            boxShadow:isOver ? '0 0 20px rgba(220,38,38,0.6), inset 0 1px 2px rgba(255,255,255,0.3)' : '0 0 20px rgba(255,255,255,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                            overflow:'hidden'
                          }}>
                            {/* Multiple animated shine layers */}
                            <div style={{position:'absolute',top:0,left:'-100%',width:'200%',height:'100%',background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',animation:'shimmer 1.5s infinite'}} />
                            <div style={{position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)',borderRadius:'12px 12px 0 0'}} />
                          </div>
                        </div>
                        
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
                          <div style={{fontSize:14,color:isOver ? '#7f1d1d' : '#ffffff',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
                            {isOver ? (
                              <>
                                <span style={{fontSize:20}}>🔥</span>
                                <span><strong>{totalConsumed - totalTarget} kcal</strong> over daily target</span>
                              </>
                            ) : (
                              <>
                                <span style={{fontSize:20}}>💪</span>
                                <span><strong>{totalRemaining} kcal</strong> remaining for today</span>
                              </>
                            )}
                          </div>
                          <div style={{
                            fontSize:12,
                            fontWeight:700,
                            background:isOver ? 'rgba(127,29,29,0.4)' : 'rgba(255,255,255,0.25)',
                            color:isOver ? '#7f1d1d' : '#ffffff',
                            padding:'6px 14px',
                            borderRadius:10,
                            backdropFilter:'blur(10px)',
                            boxShadow:'0 2px 10px rgba(0,0,0,0.15)'
                          }}>
                            {isOver ? '⚠️ EXCEEDED' : totalPercentage > 90 ? '🎯 ALMOST THERE' : totalPercentage > 50 ? '✨ ON TRACK' : '🚀 GREAT START'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Macro Targets */}
                <div style={{background:'#fff',padding:16,borderRadius:10,marginBottom:16}}>
                  <h4 style={{margin:0,marginBottom:12,color:'#374151'}}>🎯 Daily Macro Targets</h4>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:12}}>
                    <div style={{padding:12,background:'#fce7f3',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>PROTEIN ({calorieData.macros.protein.percentage}%)</div>
                      <div style={{fontSize:24,fontWeight:700,color:'#ec4899'}}>{calorieData.macros.protein.grams}g</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>{calorieData.macros.protein.calories} kcal</div>
                    </div>
                    <div style={{padding:12,background:'#cffafe',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>CARBS ({calorieData.macros.carbs.percentage}%)</div>
                      <div style={{fontSize:24,fontWeight:700,color:'#06b6d4'}}>{calorieData.macros.carbs.grams}g</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>{calorieData.macros.carbs.calories} kcal</div>
                    </div>
                    <div style={{padding:12,background:'#d1fae5',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>FAT ({calorieData.macros.fat.percentage}%)</div>
                      <div style={{fontSize:24,fontWeight:700,color:'#10b981'}}>{calorieData.macros.fat.grams}g</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>{calorieData.macros.fat.calories} kcal</div>
                    </div>
                  </div>
                </div>

                {/* Personalized Insights */}
                <div style={{background:'#fef3c7',padding:16,borderRadius:10,borderLeft:'4px solid #f59e0b'}}>
                  <h4 style={{margin:0,marginBottom:12,color:'#92400e',display:'flex',alignItems:'center',gap:6}}>
                    <span>💡</span>
                    <span>Personalized Insights</span>
                  </h4>
                  <div style={{display:'grid',gap:8}}>
                    {calorieData.insights.tips.map((tip: string, idx: number) => (
                      <div key={idx} style={{fontSize:13,color:'#92400e',lineHeight:1.6,paddingLeft:16,position:'relative'}}>
                        <span style={{position:'absolute',left:0}}>•</span>
                        {tip}
                      </div>
                    ))}
                    <div style={{marginTop:8,padding:10,background:'#fff',borderRadius:6,display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:8}}>
                      <div style={{fontSize:12}}>
                        <span style={{fontWeight:600,color:'#92400e'}}>BMI:</span>
                        <span style={{marginLeft:6,color:'#92400e'}}>{calorieData.insights.bmi}</span>
                      </div>
                      <div style={{fontSize:12}}>
                        <span style={{fontWeight:600,color:'#92400e'}}>Water Goal:</span>
                        <span style={{marginLeft:6,color:'#92400e'}}>{calorieData.insights.water_intake_liters}L/day</span>
                      </div>
                      <div style={{fontSize:12}}>
                        <span style={{fontWeight:600,color:'#92400e'}}>Est. Weekly:</span>
                        <span style={{marginLeft:6,color:calorieData.insights.estimated_weekly_change_kg < 0 ? '#059669' : '#2563eb'}}>
                          {calorieData.insights.estimated_weekly_change_kg > 0 ? '+' : ''}{calorieData.insights.estimated_weekly_change_kg}kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Info */}
                <div style={{marginTop:12,fontSize:11,color:'#6b7280',textAlign:'center'}}>
                  Calculated {new Date(calorieData.metadata.calculated_at).toLocaleString()} • 
                  Activity: {calorieData.metadata.activity_level.replace('_', ' ')} • 
                  Goal: {calorieData.metadata.health_goal.replace('_', ' ')}
                </div>
              </div>
            )}

            {/* Calorie Calculation Error or Missing Data */}
            {calorieError && (
              <div className="card" style={{marginTop:16,background:'#fef2f2',border:'1px solid #fecaca'}}>
                <div style={{color:'#991b1b',fontSize:14,fontWeight:500,marginBottom:8}}>
                  ⚠️ {calorieError}
                </div>
                {calorieError.includes('Profile incomplete') || calorieError.includes('Missing') ? (
                  <div style={{fontSize:13,color:'#7f1d1d',marginBottom:12,lineHeight:1.5}}>
                    Your profile has the data locally, but it needs to be saved to our server. 
                    Please click "Edit Profile" and then "Save Profile" to sync your data.
                  </div>
                ) : null}
                <button
                  onClick={() => setView('settings')}
                  className="btn"
                  style={{marginTop:4,background:'#dc2626'}}
                >
                  Go to Profile Settings
                </button>
              </div>
            )}

            {!calorieData && !calorieError && user && (!user.weight || !user.height || !user.age || !user.gender) && (
              <div className="card" style={{marginTop:16,background:'#eff6ff',border:'1px solid #bfdbfe'}}>
                <div style={{display:'flex',alignItems:'start',gap:12}}>
                  <div style={{fontSize:32}}>🤖</div>
                  <div style={{flex:1}}>
                    <h4 style={{margin:0,marginBottom:6,color:'#1e40af'}}>Get Your AI Calorie Plan</h4>
                    <div style={{fontSize:14,color:'#1e40af',marginBottom:12,lineHeight:1.6}}>
                      Complete your profile to get scientifically calculated daily calorie targets, 
                      meal-wise distribution, and personalized nutrition insights!
                    </div>
                    <button
                      onClick={() => setView('settings')}
                      className="btn-primary"
                      style={{background:'#2563eb'}}
                    >
                      Complete Profile Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Meal Breakdown by Type */}
            {meals.length > 0 && (() => {
              const mealsByType = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
              const caloriesByType = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
              meals.forEach(m => {
                const cal = m.calories || 0;
                if (m.meal_type === 'Breakfast') { mealsByType.breakfast++; caloriesByType.breakfast += cal; }
                else if (m.meal_type === 'Lunch') { mealsByType.lunch++; caloriesByType.lunch += cal; }
                else if (m.meal_type === 'Evening Snack') { mealsByType.snack++; caloriesByType.snack += cal; }
                else if (m.meal_type === 'Dinner') { mealsByType.dinner++; caloriesByType.dinner += cal; }
              });
              
              return (
                <div className="card" style={{marginTop:12}}>
                  <h3 style={{marginTop:0,marginBottom:16}}>Today's Meals</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
                    <div style={{padding:16,background:'#fef3c7',borderRadius:8,borderLeft:'4px solid #f59e0b'}}>
                      <div style={{fontSize:24,marginBottom:6}}>🌅</div>
                      <div style={{fontWeight:600,color:'#92400e'}}>Breakfast</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#92400e',marginTop:4}}>{caloriesByType.breakfast} kcal</div>
                      <div style={{fontSize:12,color:'#92400e',opacity:0.8,marginTop:2}}>{mealsByType.breakfast} meal{mealsByType.breakfast !== 1 ? 's' : ''}</div>
                    </div>
                    
                    <div style={{padding:16,background:'#dbeafe',borderRadius:8,borderLeft:'4px solid #3b82f6'}}>
                      <div style={{fontSize:24,marginBottom:6}}>☀️</div>
                      <div style={{fontWeight:600,color:'#1e40af'}}>Lunch</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#1e40af',marginTop:4}}>{caloriesByType.lunch} kcal</div>
                      <div style={{fontSize:12,color:'#1e40af',opacity:0.8,marginTop:2}}>{mealsByType.lunch} meal{mealsByType.lunch !== 1 ? 's' : ''}</div>
                    </div>
                    
                    <div style={{padding:16,background:'#d1fae5',borderRadius:8,borderLeft:'4px solid #10b981'}}>
                      <div style={{fontSize:24,marginBottom:6}}>🍵</div>
                      <div style={{fontWeight:600,color:'#065f46'}}>Snacks</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#065f46',marginTop:4}}>{caloriesByType.snack} kcal</div>
                      <div style={{fontSize:12,color:'#065f46',opacity:0.8,marginTop:2}}>{mealsByType.snack} meal{mealsByType.snack !== 1 ? 's' : ''}</div>
                    </div>
                    
                    <div style={{padding:16,background:'#e9d5ff',borderRadius:8,borderLeft:'4px solid #8b5cf6'}}>
                      <div style={{fontSize:24,marginBottom:6}}>🌙</div>
                      <div style={{fontWeight:600,color:'#5b21b6'}}>Dinner</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#5b21b6',marginTop:4}}>{caloriesByType.dinner} kcal</div>
                      <div style={{fontSize:12,color:'#5b21b6',opacity:0.8,marginTop:2}}>{mealsByType.dinner} meal{mealsByType.dinner !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Macro Progress */}
            {meals.length > 0 && (
              <div className="card" style={{marginTop:12}}>
                <h3 style={{marginTop:0,marginBottom:16}}>Macronutrient Breakdown</h3>
                <div style={{display:'grid',gap:12}}>
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:14,fontWeight:600}}>💪 Protein</span>
                      <span style={{fontSize:14,fontWeight:700,color:'#ec4899'}}>{totals.protein}g</span>
                    </div>
                    <div style={{height:12,background:'#fce7f3',borderRadius:6,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'#ec4899',width:`${Math.min((totals.protein / 150) * 100, 100)}%`,borderRadius:6}}></div>
                    </div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>Recommended: 100-150g/day</div>
                  </div>
                  
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:14,fontWeight:600}}>🍚 Carbs</span>
                      <span style={{fontSize:14,fontWeight:700,color:'#06b6d4'}}>{totals.carbs}g</span>
                    </div>
                    <div style={{height:12,background:'#cffafe',borderRadius:6,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'#06b6d4',width:`${Math.min((totals.carbs / 250) * 100, 100)}%`,borderRadius:6}}></div>
                    </div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>Recommended: 200-250g/day</div>
                  </div>
                  
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:14,fontWeight:600}}>🥑 Fats</span>
                      <span style={{fontSize:14,fontWeight:700,color:'#10b981'}}>{totals.fat}g</span>
                    </div>
                    <div style={{height:12,background:'#d1fae5',borderRadius:6,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'#10b981',width:`${Math.min((totals.fat / 70) * 100, 100)}%`,borderRadius:6}}></div>
                    </div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>Recommended: 50-70g/day</div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Insights */}
            {user && (healthMetrics || user.health_goal) && (
              <div className="card" style={{marginTop:12,background:'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',border:'1px solid #bfdbfe'}}>
                <h3 style={{marginTop:0,marginBottom:12,color:'#1e40af'}}>💡 Health Insights</h3>
                <div style={{display:'grid',gap:8}}>
                  {healthMetrics && (
                    <div style={{padding:12,background:'#fff',borderRadius:6}}>
                      <span style={{fontWeight:600,fontSize:14}}>Your BMI: </span>
                      <span style={{fontSize:14,fontWeight:700,color:healthMetrics.bmiColor}}>{healthMetrics.bmi}</span>
                      <span style={{fontSize:14,color:healthMetrics.bmiColor,marginLeft:6}}>({healthMetrics.bmiCategory})</span>
                    </div>
                  )}
                  {user.health_goal && (
                    <div style={{padding:12,background:'#fff',borderRadius:6}}>
                      <span style={{fontWeight:600,fontSize:14}}>Goal: </span>
                      <span style={{fontSize:14}}>{user.health_goal}</span>
                    </div>
                  )}
                  {user.activity_level && (
                    <div style={{padding:12,background:'#fff',borderRadius:6}}>
                      <span style={{fontWeight:600,fontSize:14}}>Activity Level: </span>
                      <span style={{fontSize:14}}>{user.activity_level}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="card" style={{marginTop:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h3 style={{margin:0}}>Recent Meals</h3>
                {meals.length > 6 && (
                  <button className="btn" style={{padding:'6px 12px',fontSize:13}} onClick={()=>setView('history')}>View All</button>
                )}
              </div>
              {meals.length === 0 ? (
                <div style={{textAlign:'center',padding:40}}>
                  <div style={{fontSize:48,marginBottom:12}}>🍽️</div>
                  <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>No meals logged yet</div>
                  <div style={{color:'#6b7280',marginBottom:16}}>Start tracking your nutrition journey</div>
                  <button className="btn" onClick={()=>setShowLogger(true)}>Log Your First Meal</button>
                </div>
              ) : (
                <div style={{display:'grid',gap:10}}>
                  {meals.slice(0,6).map(m => (
                    <div key={m.id} style={{
                      padding:12,
                      background:'#f8fafc',
                      borderRadius:8,
                      borderLeft:'3px solid #2563eb',
                      position:'relative'
                    }}>
                      <button
                        onClick={() => deleteMeal(m.id)}
                        style={{
                          position:'absolute',
                          top:8,
                          right:8,
                          background:'#fee2e2',
                          color:'#991b1b',
                          border:'none',
                          borderRadius:6,
                          padding:'4px 8px',
                          fontSize:12,
                          cursor:'pointer',
                          fontWeight:600
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                      >
                        Delete
                      </button>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,paddingRight:60}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:16}}>
                            {m.meal_type === 'Breakfast' ? '🌅' : 
                             m.meal_type === 'Lunch' ? '☀️' : 
                             m.meal_type === 'Evening Snack' ? '🍵' : 
                             m.meal_type === 'Dinner' ? '🌙' : '🍽️'}
                          </span>
                          <div style={{fontWeight:600,fontSize:15}}>{m.name}</div>
                        </div>
                        <div style={{
                          background:'#dbeafe',
                          color:'#2563eb',
                          padding:'4px 10px',
                          borderRadius:6,
                          fontSize:13,
                          fontWeight:600
                        }}>
                          {m.calories ?? '—'} kcal
                        </div>
                      </div>
                      <div style={{color:'#6b7280',fontSize:12,marginBottom:6}}>
                        {new Date(m.timestamp).toLocaleString()} • {m.serving_size} {m.unit}
                      </div>
                      {(m.protein || m.carbs || m.fat) && (
                        <div style={{fontSize:12,color:'#6b7280',display:'flex',gap:12}}>
                          {m.protein && <span style={{background:'#fce7f3',color:'#9f1239',padding:'2px 6px',borderRadius:4}}>P: {m.protein}g</span>}
                          {m.carbs && <span style={{background:'#cffafe',color:'#164e63',padding:'2px 6px',borderRadius:4}}>C: {m.carbs}g</span>}
                          {m.fat && <span style={{background:'#d1fae5',color:'#065f46',padding:'2px 6px',borderRadius:4}}>F: {m.fat}g</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === 'history' && (
          <div>
            <h3>Meal History</h3>
            <div className="card" style={{marginTop:10}}>
              {meals.length === 0 ? <div style={{color:'#6b7280'}}>No meals logged.</div> : (
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{textAlign:'left',borderBottom:'2px solid #e5e7eb'}}>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Time</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Meal Type</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Name</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Serving</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Calories</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Protein</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Carbs</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Fat</th>
                      <th style={{padding:'10px 8px',fontWeight:600}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map(m => {
                      const getMealTypeDisplay = (type?: string) => {
                        switch(type) {
                          case 'Breakfast': return '🌅 Breakfast';
                          case 'Lunch': return '☀️ Lunch';
                          case 'Evening Snack': return '🍵 Snack';
                          case 'Dinner': return '🌙 Dinner';
                          default: return '—';
                        }
                      };
                      return (
                      <tr key={m.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'10px 8px',fontSize:13,color:'#6b7280'}}>
                          {new Date(m.timestamp).toLocaleString()}
                        </td>
                        <td style={{padding:'10px 8px',fontSize:13}}>
                          {getMealTypeDisplay(m.meal_type)}
                        </td>
                        <td style={{padding:'10px 8px',fontWeight:500}}>{m.name}</td>
                        <td style={{padding:'10px 8px',fontSize:13,color:'#6b7280'}}>
                          {m.serving_size} {m.unit}
                        </td>
                        <td style={{padding:'10px 8px',fontWeight:600,color:'#2563eb'}}>
                          {m.calories ?? '—'}
                        </td>
                        <td style={{padding:'10px 8px'}}>{m.protein ?? '—'}g</td>
                        <td style={{padding:'10px 8px'}}>{m.carbs ?? '—'}g</td>
                        <td style={{padding:'10px 8px'}}>{m.fat ?? '—'}g</td>
                        <td style={{padding:'10px 8px'}}>
                          <button
                            onClick={() => deleteMeal(m.id)}
                            style={{
                              background:'#fee2e2',
                              color:'#991b1b',
                              border:'none',
                              borderRadius:6,
                              padding:'6px 12px',
                              fontSize:12,
                              cursor:'pointer',
                              fontWeight:600
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div>
            <h3>Nutrition Analytics</h3>
            
            {/* Overview Stats */}
            <div className="grid" style={{marginTop:10,gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))'}}>
              <div className="card" style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Total Calories</div>
                <div style={{fontSize:24,fontWeight:700,marginTop:8}}>{totals.calories}</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>kcal • {meals.length} meals</div>
              </div>
              <div className="card" style={{background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Protein</div>
                <div style={{fontSize:24,fontWeight:700,marginTop:8}}>{totals.protein}g</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>{analyticsData?.macroRatio.protein || 0}% of total</div>
              </div>
              <div className="card" style={{background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Carbs</div>
                <div style={{fontSize:24,fontWeight:700,marginTop:8}}>{totals.carbs}g</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>{analyticsData?.macroRatio.carbs || 0}% of total</div>
              </div>
              <div className="card" style={{background:'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Fat</div>
                <div style={{fontSize:24,fontWeight:700,marginTop:8}}>{totals.fat}g</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>{analyticsData?.macroRatio.fat || 0}% of total</div>
              </div>
            </div>

            {analyticsData && (
              <>
                {/* Daily Averages */}
                <div className="card" style={{marginTop:12}}>
                  <h4 style={{margin:0,marginBottom:12}}>Daily Averages ({analyticsData.numDays} {analyticsData.numDays === 1 ? 'day' : 'days'})</h4>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:12}}>
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Calories/Day</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#2563eb'}}>{analyticsData.dailyAvg.calories}</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>kcal</div>
                    </div>
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Protein/Day</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#ec4899'}}>{analyticsData.dailyAvg.protein}g</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>avg</div>
                    </div>
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Carbs/Day</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#06b6d4'}}>{analyticsData.dailyAvg.carbs}g</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>avg</div>
                    </div>
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8,textAlign:'center'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Fat/Day</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#10b981'}}>{analyticsData.dailyAvg.fat}g</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>avg</div>
                    </div>
                  </div>
                </div>

                {/* Macro Ratio Visualization */}
                <div className="card" style={{marginTop:12}}>
                  <h4 style={{margin:0,marginBottom:12}}>Macronutrient Distribution</h4>
                  <div style={{display:'flex',height:40,borderRadius:8,overflow:'hidden',marginBottom:12}}>
                    <div style={{background:'#ec4899',width:`${analyticsData.macroRatio.protein}%`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:600}}>
                      {analyticsData.macroRatio.protein}%
                    </div>
                    <div style={{background:'#06b6d4',width:`${analyticsData.macroRatio.carbs}%`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:600}}>
                      {analyticsData.macroRatio.carbs}%
                    </div>
                    <div style={{background:'#10b981',width:`${analyticsData.macroRatio.fat}%`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:600}}>
                      {analyticsData.macroRatio.fat}%
                    </div>
                  </div>
                  <div style={{display:'flex',gap:16,fontSize:13}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:12,height:12,borderRadius:3,background:'#ec4899'}}></div>
                      <span>Protein ({analyticsData.macroRatio.protein}%)</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:12,height:12,borderRadius:3,background:'#06b6d4'}}></div>
                      <span>Carbs ({analyticsData.macroRatio.carbs}%)</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:12,height:12,borderRadius:3,background:'#10b981'}}></div>
                      <span>Fat ({analyticsData.macroRatio.fat}%)</span>
                    </div>
                  </div>
                </div>

                {/* Meal Frequency by Time */}
                <div className="card" style={{marginTop:12}}>
                  <h4 style={{margin:0,marginBottom:12}}>Meal Frequency by Time of Day</h4>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:12}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>🌅 Morning (5-12)</div>
                      <div style={{height:100,background:'#f1f5f9',borderRadius:8,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:8}}>
                        <div style={{width:40,background:'#3b82f6',borderRadius:4,height:`${(analyticsData.mealsByTime.morning / meals.length) * 100}%`,minHeight:20}}></div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,marginTop:6}}>{analyticsData.mealsByTime.morning}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>☀️ Afternoon (12-17)</div>
                      <div style={{height:100,background:'#f1f5f9',borderRadius:8,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:8}}>
                        <div style={{width:40,background:'#f59e0b',borderRadius:4,height:`${(analyticsData.mealsByTime.afternoon / meals.length) * 100}%`,minHeight:20}}></div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,marginTop:6}}>{analyticsData.mealsByTime.afternoon}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>🌆 Evening (17-21)</div>
                      <div style={{height:100,background:'#f1f5f9',borderRadius:8,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:8}}>
                        <div style={{width:40,background:'#8b5cf6',borderRadius:4,height:`${(analyticsData.mealsByTime.evening / meals.length) * 100}%`,minHeight:20}}></div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,marginTop:6}}>{analyticsData.mealsByTime.evening}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>🌙 Night (21-5)</div>
                      <div style={{height:100,background:'#f1f5f9',borderRadius:8,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:8}}>
                        <div style={{width:40,background:'#6366f1',borderRadius:4,height:`${(analyticsData.mealsByTime.night / meals.length) * 100}%`,minHeight:20}}></div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,marginTop:6}}>{analyticsData.mealsByTime.night}</div>
                    </div>
                  </div>
                </div>

                {/* Meal Type Distribution */}
                <div className="card" style={{marginTop:12}}>
                  <h4 style={{margin:0,marginBottom:12}}>Meals by Type</h4>
                  <div style={{display:'grid',gap:12}}>
                    {analyticsData.mealsByType.breakfast > 0 && (
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontSize:24}}>🌅</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                            <span style={{fontWeight:600,fontSize:14}}>Breakfast</span>
                            <span style={{fontSize:13,color:'#6b7280'}}>{analyticsData.mealsByType.breakfast} meals • {analyticsData.caloriesByType.breakfast} kcal</span>
                          </div>
                          <div style={{height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#f59e0b',width:`${(analyticsData.caloriesByType.breakfast / totals.calories) * 100}%`,borderRadius:4}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {analyticsData.mealsByType.lunch > 0 && (
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontSize:24}}>☀️</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                            <span style={{fontWeight:600,fontSize:14}}>Lunch</span>
                            <span style={{fontSize:13,color:'#6b7280'}}>{analyticsData.mealsByType.lunch} meals • {analyticsData.caloriesByType.lunch} kcal</span>
                          </div>
                          <div style={{height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#3b82f6',width:`${(analyticsData.caloriesByType.lunch / totals.calories) * 100}%`,borderRadius:4}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {analyticsData.mealsByType.snack > 0 && (
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontSize:24}}>🍵</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                            <span style={{fontWeight:600,fontSize:14}}>Evening Snack</span>
                            <span style={{fontSize:13,color:'#6b7280'}}>{analyticsData.mealsByType.snack} meals • {analyticsData.caloriesByType.snack} kcal</span>
                          </div>
                          <div style={{height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#10b981',width:`${(analyticsData.caloriesByType.snack / totals.calories) * 100}%`,borderRadius:4}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {analyticsData.mealsByType.dinner > 0 && (
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontSize:24}}>🌙</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                            <span style={{fontWeight:600,fontSize:14}}>Dinner</span>
                            <span style={{fontSize:13,color:'#6b7280'}}>{analyticsData.mealsByType.dinner} meals • {analyticsData.caloriesByType.dinner} kcal</span>
                          </div>
                          <div style={{height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#8b5cf6',width:`${(analyticsData.caloriesByType.dinner / totals.calories) * 100}%`,borderRadius:4}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {analyticsData.mealsByType.other > 0 && (
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{fontSize:24}}>🍽️</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                            <span style={{fontWeight:600,fontSize:14}}>Other</span>
                            <span style={{fontSize:13,color:'#6b7280'}}>{analyticsData.mealsByType.other} meals • {analyticsData.caloriesByType.other} kcal</span>
                          </div>
                          <div style={{height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#6b7280',width:`${(analyticsData.caloriesByType.other / totals.calories) * 100}%`,borderRadius:4}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Meals */}
                {analyticsData.topMeals.length > 0 && (
                  <div className="card" style={{marginTop:12}}>
                    <h4 style={{margin:0,marginBottom:12}}>Highest Calorie Meals</h4>
                    <div style={{display:'grid',gap:8}}>
                      {analyticsData.topMeals.map((meal, idx) => (
                        <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'#f8fafc',borderRadius:6}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:14}}>{meal.name}</div>
                            <div style={{fontSize:12,color:'#6b7280'}}>
                              P: {meal.protein || 0}g • C: {meal.carbs || 0}g • F: {meal.fat || 0}g
                            </div>
                          </div>
                          <div style={{fontSize:18,fontWeight:700,color:'#2563eb'}}>{meal.calories} kcal</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analyticsData.recommendations.length > 0 && (
                  <div className="card" style={{marginTop:12,background:'#eff6ff',borderLeft:'4px solid #2563eb'}}>
                    <h4 style={{margin:0,marginBottom:12,color:'#1e40af'}}>💡 Personalized Recommendations</h4>
                    <div style={{display:'grid',gap:8}}>
                      {analyticsData.recommendations.map((rec, idx) => (
                        <div key={idx} style={{padding:'10px 12px',background:'#fff',borderRadius:6,fontSize:14,color:'#374151',borderLeft:'3px solid #3b82f6'}}>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!analyticsData && (
              <div className="card" style={{marginTop:12,textAlign:'center',padding:40}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>No data yet</div>
                <div style={{color:'#6b7280'}}>Start logging meals to see detailed analytics</div>
              </div>
            )}
          </div>
        )}

        {view === 'bmi-analyzer' && (() => {
          // BMI Calculation with Indian Standards
          const height = user?.height || 0;
          const weight = user?.weight || 0;
          const age = user?.age || 0;
          const gender = user?.gender || '';
          
          if (!height || !weight) {
            return (
              <div>
                <h3>⚖️ BMI & Body Composition Analyzer</h3>
                <div className="card" style={{marginTop:12,textAlign:'center',padding:40}}>
                  <div style={{fontSize:48,marginBottom:12}}>📊</div>
                  <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>Complete Your Profile</div>
                  <div style={{color:'#6b7280',marginBottom:16}}>Please add your height and weight in the Profile section to use the BMI Analyzer</div>
                  <button className="btn" onClick={()=>setView('settings')}>Go to Profile</button>
                </div>
              </div>
            );
          }

          const heightInMeters = height / 100;
          const bmi = weight / (heightInMeters * heightInMeters);
          
          // Indian BMI Standards
          let bmiCategory = '';
          let bmiColor = '';
          let riskLevel = '';
          let riskColor = '';
          
          if (bmi < 18.5) {
            bmiCategory = 'Underweight';
            bmiColor = '#3b82f6';
            riskLevel = 'Low to Moderate Risk';
            riskColor = '#3b82f6';
          } else if (bmi < 23) {
            bmiCategory = 'Normal';
            bmiColor = '#10b981';
            riskLevel = 'Low Risk';
            riskColor = '#10b981';
          } else if (bmi < 27) {
            bmiCategory = 'Overweight';
            bmiColor = '#f59e0b';
            riskLevel = 'Moderate Risk';
            riskColor = '#f59e0b';
          } else {
            bmiCategory = 'Obese';
            bmiColor = '#ef4444';
            riskLevel = 'High Risk';
            riskColor = '#ef4444';
          }

          // Body Composition Estimates (Formula-based)
          // Body Fat Percentage estimation using Deurenberg formula
          let bodyFatPercentage = 0;
          if (gender === 'Male') {
            bodyFatPercentage = (1.20 * bmi) + (0.23 * age) - 16.2;
          } else if (gender === 'Female') {
            bodyFatPercentage = (1.20 * bmi) + (0.23 * age) - 5.4;
          } else {
            bodyFatPercentage = (1.20 * bmi) + (0.23 * age) - 10.8;
          }

          // Lean Body Mass
          const fatMass = (bodyFatPercentage / 100) * weight;
          const leanMass = weight - fatMass;

          // Basal Metabolic Rate (BMR) - Mifflin-St Jeor Equation
          let bmr = 0;
          if (gender === 'Male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
          } else if (gender === 'Female') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
          } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 78;
          }

          // Ideal Weight Range (Indian standards)
          const minIdealWeight = 18.5 * (heightInMeters * heightInMeters);
          const maxIdealWeight = 23 * (heightInMeters * heightInMeters);

          // Health Recommendations
          const recommendations = [];
          if (bmi < 18.5) {
            recommendations.push('Increase calorie intake with nutrient-dense foods');
            recommendations.push('Include protein-rich foods: eggs, chicken, paneer, dal');
            recommendations.push('Eat frequent small meals (5-6 times a day)');
            recommendations.push('Add healthy fats: nuts, avocado, olive oil');
            recommendations.push('Consider strength training to build muscle mass');
          } else if (bmi >= 23 && bmi < 27) {
            recommendations.push('Reduce calorie intake by 300-500 kcal/day');
            recommendations.push('Increase physical activity: 30-45 min daily exercise');
            recommendations.push('Focus on whole grains, vegetables, and lean proteins');
            recommendations.push('Limit processed foods and sugary drinks');
            recommendations.push('Practice portion control');
          } else if (bmi >= 27) {
            recommendations.push('Consult a healthcare provider or nutritionist');
            recommendations.push('Create a structured weight loss plan (500-750 kcal deficit)');
            recommendations.push('Increase daily activity: walking, cycling, swimming');
            recommendations.push('Focus on high-fiber, low-calorie foods');
            recommendations.push('Monitor blood pressure and blood sugar regularly');
            recommendations.push('Consider joining a support group or program');
          } else {
            recommendations.push('Maintain your current healthy weight');
            recommendations.push('Continue balanced diet with variety of nutrients');
            recommendations.push('Exercise regularly: 150 min/week moderate activity');
            recommendations.push('Stay hydrated: 8-10 glasses of water daily');
            recommendations.push('Get adequate sleep: 7-9 hours per night');
          }

          return (
            <div>
              <h3>⚖️ BMI & Body Composition Analyzer</h3>
              
              {/* BMI Score Card */}
              <div className="card" style={{marginTop:12,background:`linear-gradient(135deg, ${bmiColor}20 0%, ${bmiColor}10 100%)`,border:`2px solid ${bmiColor}`}}>
                <div style={{textAlign:'center',padding:20}}>
                  <div style={{fontSize:14,color:'#6b7280',marginBottom:8}}>Your BMI (Indian Standards)</div>
                  <div style={{fontSize:56,fontWeight:700,color:bmiColor}}>{bmi.toFixed(1)}</div>
                  <div style={{fontSize:24,fontWeight:600,color:bmiColor,marginTop:8}}>{bmiCategory}</div>
                  <div style={{fontSize:14,color:'#6b7280',marginTop:12}}>
                    Height: {height} cm • Weight: {weight} kg
                  </div>
                </div>
              </div>

              {/* BMI Scale */}
              <div className="card" style={{marginTop:12}}>
                <h4 style={{margin:0,marginBottom:16}}>BMI Classification (Indian Standards)</h4>
                <div style={{display:'grid',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:10,background:bmi < 18.5 ? '#eff6ff' : '#f9fafb',borderRadius:8,border:bmi < 18.5 ? '2px solid #3b82f6' : '1px solid #e5e7eb'}}>
                    <div style={{width:80,fontSize:13,fontWeight:600,color:'#3b82f6'}}>{'< 18.5'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>Underweight</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>May indicate malnutrition or health issues</div>
                    </div>
                  </div>
                  
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:10,background:bmi >= 18.5 && bmi < 23 ? '#f0fdf4' : '#f9fafb',borderRadius:8,border:bmi >= 18.5 && bmi < 23 ? '2px solid #10b981' : '1px solid #e5e7eb'}}>
                    <div style={{width:80,fontSize:13,fontWeight:600,color:'#10b981'}}>18.5 - 23</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>Normal</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>Healthy weight range for Asian population</div>
                    </div>
                  </div>
                  
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:10,background:bmi >= 23 && bmi < 27 ? '#fffbeb' : '#f9fafb',borderRadius:8,border:bmi >= 23 && bmi < 27 ? '2px solid #f59e0b' : '1px solid #e5e7eb'}}>
                    <div style={{width:80,fontSize:13,fontWeight:600,color:'#f59e0b'}}>23 - 27</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>Overweight</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>Increased risk of metabolic diseases</div>
                    </div>
                  </div>
                  
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:10,background:bmi >= 27 ? '#fef2f2' : '#f9fafb',borderRadius:8,border:bmi >= 27 ? '2px solid #ef4444' : '1px solid #e5e7eb'}}>
                    <div style={{width:80,fontSize:13,fontWeight:600,color:'#ef4444'}}>≥ 27</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>Obese</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>High risk of chronic diseases</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Composition */}
              <div className="card" style={{marginTop:12}}>
                <h4 style={{margin:0,marginBottom:16}}>Body Composition Analysis</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
                  <div style={{padding:16,background:'#f0f9ff',borderRadius:8,borderLeft:'4px solid #0284c7'}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Body Fat %</div>
                    <div style={{fontSize:24,fontWeight:700,color:'#0284c7'}}>{bodyFatPercentage.toFixed(1)}%</div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>
                      {gender === 'Male' ? 'Healthy: 10-20%' : gender === 'Female' ? 'Healthy: 18-28%' : 'Varies by gender'}
                    </div>
                  </div>
                  
                  <div style={{padding:16,background:'#f0fdf4',borderRadius:8,borderLeft:'4px solid #10b981'}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Lean Mass</div>
                    <div style={{fontSize:24,fontWeight:700,color:'#10b981'}}>{leanMass.toFixed(1)} kg</div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>Muscle + Bone + Organs</div>
                  </div>
                  
                  <div style={{padding:16,background:'#fef3c7',borderRadius:8,borderLeft:'4px solid #f59e0b'}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Fat Mass</div>
                    <div style={{fontSize:24,fontWeight:700,color:'#f59e0b'}}>{fatMass.toFixed(1)} kg</div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>Total body fat weight</div>
                  </div>
                  
                  <div style={{padding:16,background:'#fce7f3',borderRadius:8,borderLeft:'4px solid #ec4899'}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>BMR</div>
                    <div style={{fontSize:24,fontWeight:700,color:'#ec4899'}}>{Math.round(bmr)}</div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>kcal/day at rest</div>
                  </div>
                </div>
              </div>

              {/* Health Risk Assessment */}
              <div className="card" style={{marginTop:12,background:'#fef3c7',borderLeft:'4px solid #f59e0b'}}>
                <h4 style={{margin:0,marginBottom:12,color:'#92400e'}}>⚠️ Health Risk Assessment</h4>
                <div style={{padding:12,background:'#fff',borderRadius:6,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:600}}>Risk Level:</span>
                    <span style={{fontWeight:700,fontSize:16,color:riskColor}}>{riskLevel}</span>
                  </div>
                </div>
                <div style={{fontSize:13,color:'#92400e'}}>
                  {bmi < 18.5 && 'Being underweight may lead to weakened immunity, osteoporosis, and nutritional deficiencies.'}
                  {bmi >= 18.5 && bmi < 23 && 'You are at low risk. Maintain your healthy lifestyle to prevent future health issues.'}
                  {bmi >= 23 && bmi < 27 && 'Moderate risk of developing type 2 diabetes, hypertension, and cardiovascular diseases.'}
                  {bmi >= 27 && 'High risk of chronic diseases including diabetes, heart disease, stroke, and certain cancers. Immediate lifestyle changes recommended.'}
                </div>
              </div>

              {/* Ideal Weight Range */}
              <div className="card" style={{marginTop:12}}>
                <h4 style={{margin:0,marginBottom:12}}>🎯 Ideal Weight Range</h4>
                <div style={{padding:16,background:'#f0fdf4',borderRadius:8}}>
                  <div style={{fontSize:14,color:'#6b7280',marginBottom:8}}>For your height ({height} cm), the healthy weight range is:</div>
                  <div style={{fontSize:28,fontWeight:700,color:'#10b981'}}>
                    {minIdealWeight.toFixed(1)} - {maxIdealWeight.toFixed(1)} kg
                  </div>
                  <div style={{fontSize:13,color:'#6b7280',marginTop:8}}>
                    Current: {weight} kg • 
                    {weight < minIdealWeight && ` Need to gain: ${(minIdealWeight - weight).toFixed(1)} kg`}
                    {weight >= minIdealWeight && weight <= maxIdealWeight && ' ✅ Within healthy range'}
                    {weight > maxIdealWeight && ` Need to lose: ${(weight - maxIdealWeight).toFixed(1)} kg`}
                  </div>
                </div>
              </div>

              {/* Personalized Recommendations */}
              <div className="card" style={{marginTop:12,background:'#eff6ff',borderLeft:'4px solid #2563eb'}}>
                <h4 style={{margin:0,marginBottom:12,color:'#1e40af'}}>💡 Personalized Recommendations</h4>
                <div style={{display:'grid',gap:8}}>
                  {recommendations.map((rec, idx) => (
                    <div key={idx} style={{padding:'10px 12px',background:'#fff',borderRadius:6,fontSize:14,color:'#374151',display:'flex',gap:10}}>
                      <span style={{color:'#2563eb',fontWeight:700}}>{idx + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="card" style={{marginTop:12,background:'#f9fafb',border:'1px solid #e5e7eb'}}>
                <div style={{fontSize:12,color:'#6b7280',lineHeight:1.6}}>
                  <strong>Disclaimer:</strong> This analyzer uses formula-based calculations and Indian BMI standards. 
                  Body composition estimates are approximate. For accurate measurements and personalized medical advice, 
                  please consult a healthcare professional or certified nutritionist. This tool is for informational purposes only.
                </div>
              </div>
            </div>
          );
        })()}

        {view === 'gamification' && (
          <div>
            <h3>Gamification</h3>
            <div className="card" style={{marginTop:10}}>
              {stats ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div style={{
                    background:'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    padding:20,
                    borderRadius:12,
                    color:'#fff'
                  }}>
                    <div style={{fontSize:13,opacity:0.9}}>Level</div>
                    <div style={{fontSize:32,fontWeight:700,marginTop:6}}>{stats.level}</div>
                    <div style={{fontSize:12,opacity:0.8,marginTop:6}}>XP: {stats.currentXP} / {stats.xpToNextLevel}</div>
                  </div>
                  <div style={{
                    background:'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                    padding:20,
                    borderRadius:12,
                    color:'#fff'
                  }}>
                    <div style={{fontSize:13,opacity:0.9}}>Streak</div>
                    <div style={{fontSize:32,fontWeight:700,marginTop:6}}>{stats.currentStreak}</div>
                    <div style={{fontSize:12,opacity:0.8,marginTop:6}}>Longest: {stats.longestStreak} days</div>
                  </div>
                </div>
              ) : <div style={{color:'#6b7280'}}>No stats yet.</div>}
            </div>
          </div>
        )}

        {view === 'recommendations' && (
          <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <h3 style={{margin:0}}>🍽️ AI Thali Recommendations</h3>
                  <div style={{fontSize:14,color:'#6b7280',marginTop:4}}>
                    Get personalized Indian meal suggestions based on your goals
                  </div>
                </div>
              </div>

              {/* Input Form */}
              <div className="card" style={{marginTop:12,background:'linear-gradient(135deg, #667eea20 0%, #764ba210 100%)',border:'2px solid #667eea'}}>
                <h4 style={{margin:0,marginBottom:16,color:'#667eea'}}>🎯 Set Your Meal Parameters</h4>
                
                <div style={{display:'grid',gap:16}}>
                  {/* Meal Type */}
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>
                      Meal Type
                    </label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:8}}>
                      {['breakfast', 'lunch', 'evening_snack', 'dinner'].map(type => (
                        <button
                          key={type}
                          onClick={() => setThaliRequest({...thaliRequest, meal_type: type})}
                          style={{
                            padding:'10px',
                            borderRadius:8,
                            border: thaliRequest.meal_type === type ? '2px solid #667eea' : '1px solid #e5e7eb',
                            background: thaliRequest.meal_type === type ? '#eff6ff' : '#fff',
                            color: thaliRequest.meal_type === type ? '#667eea' : '#6b7280',
                            fontWeight: thaliRequest.meal_type === type ? 600 : 400,
                            cursor:'pointer',
                            fontSize:13
                          }}
                        >
                          {type === 'breakfast' && '🌅 Breakfast'}
                          {type === 'lunch' && '☀️ Lunch'}
                          {type === 'evening_snack' && '🍵 Snack'}
                          {type === 'dinner' && '🌙 Dinner'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calorie Goal */}
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>
                      Calorie Goal for this Meal
                    </label>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <input
                        type="range"
                        min="200"
                        max="1000"
                        step="50"
                        value={thaliRequest.calorie_goal}
                        onChange={(e) => setThaliRequest({...thaliRequest, calorie_goal: parseInt(e.target.value)})}
                        style={{flex:1}}
                      />
                      <div style={{
                        minWidth:100,
                        padding:'8px 12px',
                        background:'#667eea',
                        color:'#fff',
                        borderRadius:8,
                        fontWeight:700,
                        fontSize:16,
                        textAlign:'center'
                      }}>
                        {thaliRequest.calorie_goal} kcal
                      </div>
                    </div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>
                      Recommended: Breakfast 300-500, Lunch 500-700, Snack 150-300, Dinner 400-600
                    </div>
                  </div>

                  {/* Quick Calorie Presets */}
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>
                      Quick Presets
                    </label>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {[
                        {label: 'Light (300)', value: 300},
                        {label: 'Moderate (500)', value: 500},
                        {label: 'Heavy (700)', value: 700}
                      ].map(preset => (
                        <button
                          key={preset.value}
                          onClick={() => setThaliRequest({...thaliRequest, calorie_goal: preset.value})}
                          className="btn"
                          style={{
                            padding:'6px 12px',
                            fontSize:12,
                            background: thaliRequest.calorie_goal === preset.value ? '#667eea' : '#e5e7eb',
                            color: thaliRequest.calorie_goal === preset.value ? '#fff' : '#374151'
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Get Recommendation Button */}
                  <button
                    onClick={getThaliRecommendation}
                    disabled={thaliLoading}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '12px 24px',
                      fontSize: 16,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span style={{fontSize: 20}}>🤖</span>
                    <span>{thaliLoading ? 'Generating Thali...' : 'Get AI Recommendation'}</span>
                  </button>
                </div>

                {thaliError && (
                  <div className="error-msg" style={{marginTop:12}}>
                    {thaliError}
                  </div>
                )}
              </div>

              {/* Recommendation Results */}
              {thaliRecommendation && (
                <>
                  {/* Summary Card */}
                  <div className="card" style={{marginTop:16,background:'linear-gradient(135deg, #10b98120 0%, #10b98110 100%)',border:'2px solid #10b981'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:12}}>
                      <div>
                        <h4 style={{margin:0,color:'#047857',fontSize:18}}>
                          ✨ Your Personalized {thaliRecommendation.meal_type} Thali
                        </h4>
                        <div style={{fontSize:14,color:'#6b7280',marginTop:4}}>
                          {thaliRecommendation.thali_note}
                        </div>
                      </div>
                      <div style={{
                        padding:'8px 16px',
                        background:'#10b981',
                        color:'#fff',
                        borderRadius:8,
                        fontWeight:700,
                        fontSize:14
                      }}>
                        Score: {thaliRecommendation.balance_score}/100
                      </div>
                    </div>

                    {/* Macros Summary */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:12,marginTop:16}}>
                      <div style={{padding:12,background:'#fff',borderRadius:8,textAlign:'center'}}>
                        <div style={{fontSize:24,fontWeight:700,color:'#667eea'}}>{thaliRecommendation.total_calories}</div>
                        <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Calories</div>
                        <div style={{fontSize:11,color:'#10b981',marginTop:2}}>
                          Goal: {thaliRequest.calorie_goal}
                        </div>
                      </div>
                      <div style={{padding:12,background:'#fff',borderRadius:8,textAlign:'center'}}>
                        <div style={{fontSize:24,fontWeight:700,color:'#f59e0b'}}>{thaliRecommendation.total_protein}g</div>
                        <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Protein</div>
                      </div>
                      <div style={{padding:12,background:'#fff',borderRadius:8,textAlign:'center'}}>
                        <div style={{fontSize:24,fontWeight:700,color:'#3b82f6'}}>{thaliRecommendation.total_carbs}g</div>
                        <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Carbs</div>
                      </div>
                      <div style={{padding:12,background:'#fff',borderRadius:8,textAlign:'center'}}>
                        <div style={{fontSize:24,fontWeight:700,color:'#ec4899'}}>{thaliRecommendation.total_fat}g</div>
                        <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Fat</div>
                      </div>
                    </div>

                    {/* Health Tip */}
                    <div style={{
                      marginTop:16,
                      padding:12,
                      background:'#fef3c7',
                      borderRadius:8,
                      borderLeft:'4px solid #f59e0b'
                    }}>
                      <div style={{fontSize:13,fontWeight:600,color:'#92400e',marginBottom:4}}>
                        💡 Health Tip
                      </div>
                      <div style={{fontSize:14,color:'#92400e'}}>
                        {thaliRecommendation.health_tip}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Items */}
                  <div className="card" style={{marginTop:16}}>
                    <h4 style={{margin:0,marginBottom:16}}>🍽️ Recommended Items ({thaliRecommendation.recommended_items.length})</h4>
                    
                    <div style={{display:'grid',gap:12}}>
                      {thaliRecommendation.recommended_items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding:16,
                            background:'#f8fafc',
                            borderRadius:8,
                            border:'1px solid #e5e7eb',
                            transition:'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:8}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:16,color:'#1f2937',marginBottom:4}}>
                                {item.name}
                              </div>
                              <div style={{
                                display:'inline-block',
                                padding:'4px 10px',
                                background:'#667eea',
                                color:'#fff',
                                borderRadius:6,
                                fontSize:11,
                                fontWeight:600,
                                marginBottom:8
                              }}>
                                {item.category}
                              </div>
                              <div style={{fontSize:13,color:'#6b7280',fontStyle:'italic'}}>
                                💭 {item.note}
                              </div>
                            </div>
                            <div style={{
                              padding:'8px 12px',
                              background:'#10b981',
                              color:'#fff',
                              borderRadius:8,
                              fontWeight:700,
                              fontSize:16,
                              minWidth:80,
                              textAlign:'center'
                            }}>
                              {Math.round(item.calories)} kcal
                            </div>
                          </div>

                          <div style={{display:'flex',gap:16,marginTop:12,paddingTop:12,borderTop:'1px solid #e5e7eb'}}>
                            <div style={{fontSize:12,color:'#6b7280'}}>
                              <span style={{fontWeight:600,color:'#374151'}}>Serving:</span> {item.serving_size}{item.unit}
                            </div>
                            <div style={{fontSize:12,color:'#6b7280'}}>
                              <span style={{fontWeight:600,color:'#f59e0b'}}>Protein:</span> {Math.round(item.protein)}g
                            </div>
                            <div style={{fontSize:12,color:'#6b7280'}}>
                              <span style={{fontWeight:600,color:'#3b82f6'}}>Carbs:</span> {Math.round(item.carbs)}g
                            </div>
                            <div style={{fontSize:12,color:'#6b7280'}}>
                              <span style={{fontWeight:600,color:'#ec4899'}}>Fat:</span> {Math.round(item.fat)}g
                            </div>
                          </div>

                          {/* Quick Log Button */}
                          <button
                            onClick={() => {
                              // Map backend meal type to frontend format
                              const mealTypeMap: any = {
                                'breakfast': 'Breakfast',
                                'lunch': 'Lunch',
                                'evening_snack': 'Evening Snack',
                                'dinner': 'Dinner'
                              };
                              
                              selectDish({
                                name: item.name,
                                serving_size: item.serving_size,
                                unit: item.unit,
                                calories: item.calories,
                                protein: item.protein,
                                carbs: item.carbs,
                                fat: item.fat
                              }, item.serving_size, mealTypeMap[thaliRequest.meal_type] || 'Lunch');
                              setShowLogger(true);
                            }}
                            className="btn"
                            style={{
                              marginTop:12,
                              width:'100%',
                              background:'#667eea',
                              display:'flex',
                              alignItems:'center',
                              justifyContent:'center',
                              gap:6
                            }}
                          >
                            <span>➕</span>
                            <span>Log This Item</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Try Again Button */}
                  <button
                    onClick={getThaliRecommendation}
                    className="btn"
                    style={{
                      marginTop:16,
                      width:'100%',
                      background:'#6b7280',
                      padding:'12px',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:8
                    }}
                  >
                    <span>🔄</span>
                    <span>Generate New Recommendation</span>
                  </button>
                </>
              )}

              {/* Feature Info */}
              {!thaliRecommendation && !thaliLoading && (
                <div className="card" style={{marginTop:16,background:'#f0f9ff',border:'1px solid #0284c7'}}>
                  <h4 style={{margin:0,marginBottom:12,color:'#0369a1'}}>ℹ️ How It Works</h4>
                  <ul style={{margin:0,paddingLeft:20,color:'#374151',fontSize:14,lineHeight:1.8}}>
                    <li>Select your meal type and calorie goal</li>
                    <li>AI analyzes your preferences (diet, health goals, allergies)</li>
                    <li>Get a balanced Indian Thali with multiple items</li>
                    <li>Each recommendation follows traditional thali composition</li>
                    <li>Optimized for nutrition balance and your specific needs</li>
                    <li>One-click logging to your meal tracker</li>
                  </ul>
                </div>
              )}
            </div>
        )}

        {view === 'settings' && (
          <div>
            <h3>Profile & Settings</h3>
            
            {/* Profile Overview Card */}
            <div className="card" style={{marginTop:10}}>
              <div style={{display:'flex',gap:20,alignItems:'center',marginBottom:20}}>
                <div style={{
                  width:80,
                  height:80,
                  borderRadius:16,
                  background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontSize:32,
                  fontWeight:700,
                  color:'#fff',
                  boxShadow:'0 4px 12px rgba(102,126,234,0.3)'
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div style={{flex:1}}>
                  <h3 style={{margin:0,marginBottom:4}}>{user?.name ?? 'User'}</h3>
                  <div style={{color:'#6b7280',fontSize:14,marginBottom:8}}>{user?.email ?? ''}</div>
                  <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
                </div>
                <button 
                  className="btn" 
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  style={{background: isEditingProfile ? '#6b7280' : '#2563eb'}}
                >
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* Always Visible Profile Details */}
              <div style={{borderTop:'1px solid #e5e7eb',paddingTop:16}}>
                <h4 style={{margin:0,marginBottom:12,fontSize:16}}>Personal Information</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Gender</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.gender || 'Not specified'}</div>
                  </div>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Age</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.age ? `${user.age} years` : 'Not specified'}</div>
                  </div>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Height</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.height ? `${user.height} cm` : 'Not specified'}</div>
                  </div>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Weight</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.weight ? `${user.weight} kg` : 'Not specified'}</div>
                  </div>
                </div>
              </div>

              <div style={{borderTop:'1px solid #e5e7eb',paddingTop:16,marginTop:16}}>
                <h4 style={{margin:0,marginBottom:12,fontSize:16}}>Health & Lifestyle</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Activity Level</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.activity_level || 'Not specified'}</div>
                  </div>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Dietary Preference</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.dietary_preference || 'Not specified'}</div>
                  </div>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Health Goal</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#374151'}}>{user?.health_goal || 'Not specified'}</div>
                  </div>
                </div>
                {user?.allergies && (
                  <div style={{marginTop:12,padding:12,background:'#fef3c7',borderRadius:8,borderLeft:'3px solid #f59e0b'}}>
                    <div style={{fontSize:12,color:'#92400e',fontWeight:600,marginBottom:4}}>⚠️ Allergies/Restrictions</div>
                    <div style={{fontSize:14,color:'#92400e'}}>{user.allergies}</div>
                  </div>
                )}
              </div>

              {/* Success/Error Messages */}
              {profileSuccess && (
                <div style={{background:'#d1fae5',color:'#065f46',padding:'10px 12px',borderRadius:8,marginTop:16,fontSize:14}}>
                  ✓ {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="error-msg" style={{marginTop:16}}>{profileError}</div>
              )}

              {/* Edit Profile Form */}
              {isEditingProfile && (
                <div style={{background:'#f8fafc',padding:16,borderRadius:8,marginTop:16}}>
                  <h4 style={{margin:0,marginBottom:12}}>Edit Profile Information</h4>
                  <div style={{display:'grid',gap:12}}>
                    {/* Basic Info */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div>
                        <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Name</label>
                        <input 
                          value={profileForm.name} 
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                        />
                      </div>
                      <div>
                        <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Email</label>
                        <input 
                          type="email"
                          value={profileForm.email} 
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                        />
                      </div>
                    </div>

                    {/* Physical Info */}
                    <div style={{borderTop:'1px solid #e5e7eb',paddingTop:12}}>
                      <h5 style={{margin:0,marginBottom:8,fontSize:14}}>Physical Information</h5>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:12}}>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Gender</label>
                          <select 
                            value={profileForm.gender} 
                            onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb',background:'#fff'}}
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Age (years)</label>
                          <input 
                            type="number"
                            value={profileForm.age} 
                            onChange={(e) => setProfileForm({...profileForm, age: e.target.value})}
                            placeholder="e.g., 25"
                            min="0"
                            max="120"
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Height (cm)</label>
                          <input 
                            type="number"
                            value={profileForm.height} 
                            onChange={(e) => setProfileForm({...profileForm, height: e.target.value})}
                            placeholder="e.g., 170"
                            min="0"
                            max="300"
                            step="0.1"
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Weight (kg)</label>
                          <input 
                            type="number"
                            value={profileForm.weight} 
                            onChange={(e) => setProfileForm({...profileForm, weight: e.target.value})}
                            placeholder="e.g., 70"
                            min="0"
                            max="500"
                            step="0.1"
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Health & Lifestyle */}
                    <div style={{borderTop:'1px solid #e5e7eb',paddingTop:12}}>
                      <h5 style={{margin:0,marginBottom:8,fontSize:14}}>Health & Lifestyle</h5>
                      <div style={{display:'grid',gap:12}}>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Activity Level</label>
                          <select 
                            value={profileForm.activity_level} 
                            onChange={(e) => setProfileForm({...profileForm, activity_level: e.target.value})}
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb',background:'#fff'}}
                          >
                            <option value="">Select...</option>
                            <option value="Sedentary">Sedentary (little or no exercise)</option>
                            <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                            <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                            <option value="Very Active">Very Active (6-7 days/week)</option>
                            <option value="Extremely Active">Extremely Active (physical job + exercise)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Dietary Preference</label>
                          <select 
                            value={profileForm.dietary_preference} 
                            onChange={(e) => setProfileForm({...profileForm, dietary_preference: e.target.value})}
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb',background:'#fff'}}
                          >
                            <option value="">Select...</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Pescatarian">Pescatarian</option>
                            <option value="Keto">Keto</option>
                            <option value="Paleo">Paleo</option>
                            <option value="No Preference">No Preference</option>
                          </select>
                        </div>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Health Goal</label>
                          <select 
                            value={profileForm.health_goal} 
                            onChange={(e) => setProfileForm({...profileForm, health_goal: e.target.value})}
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb',background:'#fff'}}
                          >
                            <option value="">Select...</option>
                            <option value="Weight Loss">Weight Loss</option>
                            <option value="Weight Gain">Weight Gain</option>
                            <option value="Muscle Building">Muscle Building</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Better Nutrition">Better Nutrition</option>
                            <option value="Disease Management">Disease Management</option>
                          </select>
                        </div>
                        <div>
                          <label style={{fontSize:13,color:'#6b7280',display:'block',marginBottom:4}}>Allergies/Restrictions</label>
                          <input 
                            value={profileForm.allergies} 
                            onChange={(e) => setProfileForm({...profileForm, allergies: e.target.value})}
                            placeholder="e.g., Peanuts, Dairy, Gluten"
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{borderTop:'1px solid #e5e7eb',paddingTop:12,marginTop:4}}>
                      <h5 style={{margin:0,marginBottom:8,fontSize:14}}>Change Password (Optional)</h5>
                      <div style={{display:'grid',gap:8}}>
                        <div>
                          <label style={{fontSize:12,color:'#6b7280',display:'block',marginBottom:4}}>Current Password</label>
                          <input 
                            type="password"
                            value={profileForm.currentPassword} 
                            onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})}
                            placeholder="Leave blank to keep current"
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:12,color:'#6b7280',display:'block',marginBottom:4}}>New Password</label>
                          <input 
                            type="password"
                            value={profileForm.newPassword} 
                            onChange={(e) => setProfileForm({...profileForm, newPassword: e.target.value})}
                            placeholder="Leave blank to keep current"
                            style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb'}}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
                      <button 
                        className="btn" 
                        onClick={() => setIsEditingProfile(false)}
                        style={{background:'#6b7280'}}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={handleProfileUpdate}
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Overview */}
            <div className="grid" style={{marginTop:12}}>
              <div className="card" style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Total Meals Logged</div>
                <div style={{fontSize:28,fontWeight:700,marginTop:8}}>{meals.length}</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>All time</div>
              </div>
              <div className="card" style={{background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Current Level</div>
                <div style={{fontSize:28,fontWeight:700,marginTop:8}}>{stats?.level ?? 1}</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>XP: {stats?.currentXP ?? 0}/{stats?.xpToNextLevel ?? 100}</div>
              </div>
              <div className="card" style={{background:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',color:'#fff'}}>
                <div style={{fontSize:13,opacity:0.9}}>Current Streak</div>
                <div style={{fontSize:28,fontWeight:700,marginTop:8}}>{stats?.currentStreak ?? 0}</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:4}}>days in a row</div>
              </div>
            </div>

            {/* Health Metrics */}
            {healthMetrics && (
              <div className="card" style={{marginTop:12}}>
                <h4 style={{margin:0,marginBottom:12}}>Health Metrics</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12}}>
                  <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>BMI (Body Mass Index)</div>
                    <div style={{fontSize:24,fontWeight:700,color:healthMetrics.bmiColor}}>{healthMetrics.bmi}</div>
                    <div style={{fontSize:13,color:healthMetrics.bmiColor,marginTop:4}}>{healthMetrics.bmiCategory}</div>
                  </div>
                  {user?.activity_level && (
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Activity Level</div>
                      <div style={{fontSize:16,fontWeight:600,color:'#374151',marginTop:4}}>{user.activity_level}</div>
                    </div>
                  )}
                  {user?.dietary_preference && (
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Dietary Preference</div>
                      <div style={{fontSize:16,fontWeight:600,color:'#374151',marginTop:4}}>{user.dietary_preference}</div>
                    </div>
                  )}
                  {user?.health_goal && (
                    <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Health Goal</div>
                      <div style={{fontSize:16,fontWeight:600,color:'#374151',marginTop:4}}>{user.health_goal}</div>
                    </div>
                  )}
                </div>
                {user?.allergies && (
                  <div style={{marginTop:12,padding:12,background:'#fef3c7',borderRadius:8,borderLeft:'3px solid #f59e0b'}}>
                    <div style={{fontSize:12,color:'#92400e',fontWeight:600,marginBottom:4}}>⚠️ Allergies/Restrictions</div>
                    <div style={{fontSize:14,color:'#92400e'}}>{user.allergies}</div>
                  </div>
                )}
              </div>
            )}

            {/* App Settings */}
            <div className="card" style={{marginTop:12}}>
              <h4 style={{margin:0,marginBottom:12}}>Application Settings</h4>
              <div style={{display:'grid',gap:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>Demo Mode</div>
                    <div style={{color:'#6b7280',fontSize:12}}>Using in-memory storage. Data resets on server restart.</div>
                  </div>
                  <div style={{background:'#fef3c7',color:'#92400e',padding:'4px 12px',borderRadius:6,fontSize:12,fontWeight:600}}>Active</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>Version</div>
                    <div style={{color:'#6b7280',fontSize:12}}>Current application version</div>
                  </div>
                  <div style={{fontSize:14,color:'#6b7280',fontWeight:600}}>v0.1.0</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>Danger Zone</div>
                    <div style={{color:'#6b7280',fontSize:12}}>Permanently delete your account and all data</div>
                  </div>
                  <button className="btn" style={{background:'#ef4444',fontSize:13}}>Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{height:24}} />

        <div className="footer">© {new Date().getFullYear()} NutriSathi. All rights reserved.</div>
      </main>

      {/* Meal Logger Modal */}
      {showLogger && (
        <div className="modal-overlay" onClick={() => { if (!logging) { setShowLogger(false); setShowSuggestions(false); } }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h3 style={{margin:0}}>Log a Meal</h3>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {dishes.length > 0 && (
                  <div style={{fontSize:12,color:'#6b7280',background:'#f1f5f9',padding:'4px 10px',borderRadius:6}}>
                    {dishes.length} dishes available
                  </div>
                )}
                <button
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  disabled={logging}
                  className="btn"
                  style={{
                    background: isListening ? '#ef4444' : '#10b981',
                    padding: '6px 12px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title={isListening ? 'Stop listening' : 'Log meal by voice'}
                >
                  <span style={{fontSize: 16}}>{isListening ? '⏹️' : '🎤'}</span>
                  <span>{isListening ? 'Listening...' : 'Voice'}</span>
                </button>
              </div>
            </div>

            {/* Voice Status */}
            {isListening && (
              <div style={{
                padding: 12,
                background: 'linear-gradient(135deg, #10b98120 0%, #10b98110 100%)',
                border: '2px solid #10b981',
                borderRadius: 8,
                marginBottom: 12,
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                <div style={{fontSize: 14, fontWeight: 600, color: '#047857', marginBottom: 4}}>
                  🎤 Listening... Speak now!
                </div>
                <div style={{fontSize: 12, color: '#6b7280'}}>
                  Say something like: "I ate 200 grams of chicken curry for lunch"
                </div>
              </div>
            )}

            {voiceTranscript && (
              <div style={{
                padding: 12,
                background: '#f0f9ff',
                border: '1px solid #0284c7',
                borderRadius: 8,
                marginBottom: 12
              }}>
                <div style={{fontSize: 12, fontWeight: 600, color: '#0284c7', marginBottom: 4}}>
                  Voice Input:
                </div>
                <div style={{fontSize: 14, color: '#374151'}}>"{voiceTranscript}"</div>
              </div>
            )}

            {voiceError && (
              <div style={{
                padding: 12,
                background: '#fef2f2',
                border: '1px solid #ef4444',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                color: '#991b1b'
              }}>
                {voiceError}
              </div>
            )}

            <div style={{display:'grid',gap:8,marginTop:8}}>
              <label style={{fontSize:13}}>Meal Type</label>
              <select 
                value={form.meal_type} 
                onChange={(e)=>setForm({...form,meal_type:e.target.value})}
                style={{width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,background:'#fff',cursor:'pointer'}}
              >
                <option value="Breakfast">🌅 Breakfast</option>
                <option value="Lunch">☀️ Lunch</option>
                <option value="Evening Snack">🍵 Evening Snack</option>
                <option value="Dinner">🌙 Dinner</option>
              </select>
              <label style={{fontSize:13}}>Meal Name</label>
              <div style={{position:'relative'}}>
                <input 
                  value={form.name} 
                  onChange={(e)=>handleMealNameChange(e.target.value)}
                  onFocus={(e)=>{
                    if(e.target.value.trim().length >= 2) {
                      const matches = dishes.filter(d => 
                        d.name.toLowerCase().includes(e.target.value.toLowerCase())
                      ).slice(0, 8);
                      setFilteredDishes(matches);
                      setShowSuggestions(matches.length > 0);
                    }
                  }}
                  placeholder="Start typing to see suggestions..."
                  style={{width:'100%'}}
                />
                {showSuggestions && filteredDishes.length > 0 && (
                  <div style={{
                    position:'absolute',
                    top:'100%',
                    left:0,
                    right:0,
                    background:'#fff',
                    border:'1px solid #e5e7eb',
                    borderRadius:8,
                    marginTop:4,
                    maxHeight:280,
                    overflowY:'auto',
                    boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
                    zIndex:1000
                  }}>
                    {filteredDishes.map((dish, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectDish(dish)}
                        style={{
                          padding:'10px 12px',
                          cursor:'pointer',
                          borderBottom: idx < filteredDishes.length - 1 ? '1px solid #f1f5f9' : 'none',
                          transition:'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{dish.name}</div>
                        <div style={{fontSize:12,color:'#6b7280',display:'flex',gap:12,flexWrap:'wrap'}}>
                          <span style={{color:'#2563eb',fontWeight:600}}>{dish.calories || '—'} kcal</span>
                          {dish.protein && <span>P: {dish.protein}g</span>}
                          {dish.carbs && <span>C: {dish.carbs}g</span>}
                          {dish.fat && <span>F: {dish.fat}g</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:13}}>Serving size</label>
                  <input type="number" value={form.serving_size} onChange={(e)=>handleServingSizeChange(parseFloat(e.target.value||'0'))} />
                </div>
                <div style={{width:80}}>
                  <label style={{fontSize:13}}>Unit</label>
                  <input value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})} />
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                <div>
                  <label style={{fontSize:13}}>Calories</label>
                  <input type="number" value={form.calories} onChange={(e)=>setForm({...form,calories:e.target.value})} />
                </div>
                <div>
                  <label style={{fontSize:13}}>Protein (g)</label>
                  <input type="number" value={form.protein} onChange={(e)=>setForm({...form,protein:e.target.value})} />
                </div>
                <div>
                  <label style={{fontSize:13}}>Carbs (g)</label>
                  <input type="number" value={form.carbs} onChange={(e)=>setForm({...form,carbs:e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{fontSize:13}}>Fat (g)</label>
                <input type="number" value={form.fat} onChange={(e)=>setForm({...form,fat:e.target.value})} />
              </div>

              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
                <button className="btn" onClick={async ()=>{
                  const payload:any = {
                    name: form.name || 'Meal',
                    serving_size: Number(form.serving_size) || 0,
                    unit: form.unit || 'g',
                    meal_type: form.meal_type || 'Breakfast'
                  };
                  if (form.calories !== '') payload.calories = Number(form.calories);
                  if (form.protein !== '') payload.protein = Number(form.protein);
                  if (form.carbs !== '') payload.carbs = Number(form.carbs);
                  if (form.fat !== '') payload.fat = Number(form.fat);
                  await submitMeal(payload);
                }}>{logging ? 'Logging...' : 'Save'}</button>
                <button className="btn" style={{background:'#ef4444'}} onClick={()=>{ if(!logging)setShowLogger(false); }}>Cancel</button>
              </div>
              {logError && <div style={{color:'#991b1b'}}>{logError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
