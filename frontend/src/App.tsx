import React, { useEffect, useMemo, useState } from 'react';
import NutritionAnalytics from './components/NutritionAnalytics.new';
import MealHistory from './components/MealHistory';
import DailySummaryCard from './components/DailySummaryCard';
import LandingPage from './components/LandingPage';
import BarcodeScanner from './components/BarcodeScanner';
import FoodConfirmation from './components/FoodConfirmation';

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

type View = 'landing' | 'dashboard' | 'history' | 'analytics' | 'analytics-old' | 'gamification' | 'recommendations' | 'settings' | 'bmi-analyzer' | 'ai-calorie-plan';

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
  const [view, setView] = useState<View>('landing');
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
  const [mealsList, setMealsList] = useState<any[]>([]);
  const [currentMealType, setCurrentMealType] = useState('Breakfast');
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  // Barcode scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [scannedFoodData, setScannedFoodData] = useState<any | null>(null);

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

  // Date filter state for Dashboard
  const [selectedDateFilter, setSelectedDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Tracker-specific date filter state
  const [trackerDateFilter, setTrackerDateFilter] = useState('today');
  const [trackerCustomDate, setTrackerCustomDate] = useState('');
  const [showTrackerDatePicker, setShowTrackerDatePicker] = useState(false);
  const [showTrackerDropdown, setShowTrackerDropdown] = useState(false);

  // AI Plan expanded state
  const [showExpandedAIPlan, setShowExpandedAIPlan] = useState(false);

  // Hydration tracker state
  const [waterGlasses, setWaterGlasses] = useState(0);
  const waterGoal = 8; // 8 glasses per day

  // Get filtered date based on selection
  const getFilteredDate = () => {
    const today = new Date();
    switch (selectedDateFilter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      case 'twoDaysAgo':
        const twoDays = new Date(today);
        twoDays.setDate(twoDays.getDate() - 2);
        return twoDays.toISOString().split('T')[0];
      case 'custom':
        return customDate || today.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  };

  // Get tracker filtered date
  const getTrackerFilteredDate = () => {
    const today = new Date();
    switch (trackerDateFilter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      case 'twoDaysAgo':
        const twoDays = new Date(today);
        twoDays.setDate(twoDays.getDate() - 2);
        return twoDays.toISOString().split('T')[0];
      case 'custom':
        return trackerCustomDate || today.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  };

  // Get tracker date label for display
  const getTrackerDateLabel = () => {
    switch (trackerDateFilter) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'twoDaysAgo': return '2 days ago';
      case 'custom': {
        if (!trackerCustomDate) return 'Choose a date...';
        const date = new Date(trackerCustomDate);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      default: return 'Today';
    }
  };

  // Get formatted date for viewing label
  const getTrackerFormattedDate = () => {
    const dateStr = getTrackerFilteredDate();
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

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

  // Calculate today's totals only
  const todayTotals = useMemo(() => {
    const today = new Date().toDateString();
    const todayMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp).toDateString();
      return mealDate === today;
    });
    return todayMeals.reduce((acc, m) => {
      acc.calories += Number(m.calories ?? 0);
      acc.protein += Number(m.protein ?? 0);
      acc.carbs += Number(m.carbs ?? 0);
      acc.fat += Number(m.fat ?? 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  // Calculate consumed calories per meal type from tracker selected date's meals
  useEffect(() => {
    const selectedDate = getTrackerFilteredDate();
    const selectedDateObj = new Date(selectedDate).toDateString();
    
    const selectedDayMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp).toDateString();
      return mealDate === selectedDateObj;
    });

    console.log('🔍 Tracker Date:', selectedDateObj);
    console.log('🔍 Selected Day Meals:', selectedDayMeals);

    const consumed = {
      breakfast: 0,
      lunch: 0,
      evening_snack: 0,
      dinner: 0
    };

    selectedDayMeals.forEach(meal => {
      const calories = meal.calories || 0;
      const mealType = (meal.meal_type || '').toLowerCase().trim();
      
      console.log('🔍 Meal:', meal.name, '| Type:', meal.meal_type, '| Normalized:', mealType, '| Calories:', calories);
      
      // Normalize meal type matching
      if (mealType === 'breakfast') {
        consumed.breakfast += calories;
      } else if (mealType === 'lunch') {
        consumed.lunch += calories;
      } else if (mealType === 'evening snack' || mealType === 'snack' || mealType === 'evening_snack') {
        consumed.evening_snack += calories;
      } else if (mealType === 'dinner') {
        consumed.dinner += calories;
      } else {
        console.warn('⚠️ Unmatched meal type:', mealType, 'for meal:', meal.name);
      }
    });

    console.log('📊 Consumed Calories:', consumed);
    setConsumedCalories(consumed);
  }, [meals, trackerDateFilter, trackerCustomDate]);

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
      const responseData = await res.json();
      
      // Handle new response format {meal: {...}, calorie_warning: {...}}
      const created = responseData.meal || responseData;
      setMeals(prev => [created, ...prev]);
      
      // Refresh all data including stats
      await loadAll();
      
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

  // Barcode scanning functions
  async function handleBarcodeScanned(barcode: string) {
    console.log('🔍 Scanning barcode:', barcode);
    setShowBarcodeScanner(false);
    setBarcodeLoading(true);
    setBarcodeError(null);

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('📡 Fetching from:', `${API_BASE}/foods/barcode/${barcode}`);
      const res = await fetch(`${API_BASE}/foods/barcode/${barcode}`, { 
        method: 'GET',
        headers 
      });
      
      console.log('📥 Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ Error response:', errorData);
        
        if (res.status === 404) {
          throw new Error('Product not found in database. Try another barcode or manual entry.');
        }
        if (res.status === 504) {
          throw new Error('Request timeout. Please check your internet connection.');
        }
        throw new Error(errorData.detail || 'Failed to fetch food data');
      }

      const foodData = await res.json();
      console.log('✅ Food data received:', foodData);
      setScannedFoodData(foodData);
    } catch (err: any) {
      console.error('❌ Barcode scan error:', err);
      setBarcodeError(err?.message ?? 'Failed to scan barcode. Please try again.');
      setTimeout(() => setBarcodeError(null), 5000);
    } finally {
      setBarcodeLoading(false);
    }
  }

  async function handleBarcodeMealConfirm(mealType: string, servings: number) {
    if (!scannedFoodData) {
      console.error('❌ No scanned food data available');
      return;
    }

    const payload = {
      name: scannedFoodData.name,
      serving_size: servings * 100, // Assuming 100g per serving
      unit: 'g',
      calories: Math.round(scannedFoodData.calories * servings),
      protein: parseFloat((scannedFoodData.protein * servings).toFixed(1)),
      carbs: parseFloat((scannedFoodData.carbs * servings).toFixed(1)),
      fat: parseFloat((scannedFoodData.fat * servings).toFixed(1)),
      meal_type: mealType.charAt(0).toUpperCase() + mealType.slice(1)
    };

    console.log('🍽️ Logging barcode meal:', payload);
    await submitMeal(payload);
    setScannedFoodData(null);
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

  // Clear profile error when switching views or on mount
  useEffect(() => {
    // Always clear profile errors when not in settings or when entering settings
    setProfileError(null);
    setProfileSuccess(null);
  }, [view]);

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

  // Show landing page if not authenticated and view is 'landing'
  if (!isAuthenticated && view === 'landing') {
    return (
      <LandingPage
        onNavigateLogin={() => setView('dashboard')}
        onNavigateSignup={() => setView('dashboard')}
        isAuthenticated={isAuthenticated}
        onNavigateDashboard={() => setView('dashboard')}
      />
    );
  }

  // Show auth UI if not authenticated (and view is not 'landing')
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{width:48,height:48,background:'#2563eb',borderRadius:12,margin:'0 auto 12px'}}></div>
            <h2 style={{margin:0,fontSize:24}}>NutriSathi</h2>
            <p style={{color:'#6b7280',margin:'8px 0 0',fontSize:14}}>Your nutrition companion</p>
          </div>

          <div style={{marginBottom:16,textAlign:'center'}}>
            <button
              onClick={() => setView('landing')}
              style={{
                background:'transparent',
                border:'none',
                color:'#6b7280',
                fontSize:13,
                cursor:'pointer',
                textDecoration:'underline'
              }}
            >
              ← Back to Home
            </button>
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
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>

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
          <button className={view === 'ai-calorie-plan' ? 'active' : ''} onClick={()=>setView('ai-calorie-plan')} style={{background: view === 'ai-calorie-plan' ? '#667eea' : '', color: view === 'ai-calorie-plan' ? '#fff' : ''}}>🤖 AI Calorie Plan</button>
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
                color:'#fff',
                border:'none',
                borderRadius:'10px',
                display:'flex',
                alignItems:'center',
                gap:'6px',
                padding:'10px 20px',
                fontSize:'14px',
                fontWeight:'600',
                cursor:'pointer',
                transition:'transform 0.2s',
                boxShadow:'0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              title="Log meal with voice"
            >
              <span style={{fontSize:'18px'}}>🎤</span>
              <span>Voice Log</span>
            </button>
            <button 
              onClick={() => setShowBarcodeScanner(true)}
              style={{
                background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color:'#fff',
                border:'none',
                borderRadius:'10px',
                display:'flex',
                alignItems:'center',
                gap:'6px',
                padding:'10px 20px',
                fontSize:'14px',
                fontWeight:'600',
                cursor:'pointer',
                transition:'transform 0.2s',
                boxShadow:'0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              title="Scan barcode to log meal"
            >
              <span style={{fontSize:'18px'}}>📷</span>
              <span>Scan Barcode</span>
            </button>
            <button 
              onClick={() => setShowLogger(true)}
              style={{
                background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color:'#fff',
                border:'none',
                borderRadius:'10px',
                display:'flex',
                alignItems:'center',
                gap:'6px',
                padding:'10px 20px',
                fontSize:'14px',
                fontWeight:'600',
                cursor:'pointer',
                transition:'transform 0.2s',
                boxShadow:'0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{fontSize:'18px'}}>➕</span>
              <span>Log Meal</span>
            </button>
            {error && <div style={{background:'#fff1f2',color:'#991b1b',padding:'6px 10px',borderRadius:8}}>{error}</div>}
            {!error && stats && (
              <div style={{
                display:'flex',
                alignItems:'center',
                gap:'8px',
                padding:'10px 20px',
                background:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius:'10px',
                fontSize:'14px',
                fontWeight:'600',
                color:'#92400e',
                boxShadow:'0 2px 8px rgba(251, 191, 36, 0.3)'
              }}>
                <span style={{fontSize:'18px'}}>🔥</span>
                <span>Level {stats.level} • XP {stats.currentXP}/{stats.xpToNextLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {view === 'dashboard' && (
          <>
            {/* Daily Health Summary */}
            <DailySummaryCard
              userName={user?.name}
              totalCaloriesToday={todayTotals.calories}
              calorieTarget={calorieData?.tdee ?? 2200}
              macros={{
                protein: todayTotals.protein,
                carbs: todayTotals.carbs,
                fat: todayTotals.fat
              }}
              mealsLogged={meals.filter(m => new Date(m.timestamp).toDateString() === new Date().toDateString()).length}
              level={stats?.level}
              currentXP={stats?.currentXP}
              xpToNextLevel={stats?.xpToNextLevel}
              onViewReport={() => setView('analytics')}
            />

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
                  onClick={() => setView('settings')}
                  className="btn"
                  style={{background:'#f59e0b',color:'#fff',padding:'10px 16px',fontSize:14,fontWeight:600}}
                >
                  ✏️ Complete Profile Now
                </button>
              </div>
            )}
            
            {/* THREE COMPACT CARDS IN A ROW - Dashboard Top Section */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:16}}>
              
              {/* CARD 1: AI Daily Calorie Plan */}
              <div 
                onClick={() => calorieData ? setShowExpandedAIPlan(true) : setView('settings')}
                className="card" 
                style={{
                  background:'linear-gradient(135deg, #e6edff 0%, #d9e4ff 100%)',
                  border:'2px solid #667eea',
                  borderRadius:16,
                  padding:20,
                  cursor:'pointer',
                  transition:'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,126,234,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🤖</div>
                    <div>
                      <h3 style={{margin:0,fontSize:16,fontWeight:700,color:'#667eea'}}>AI Daily Calorie Plan</h3>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>See today's calorie target, BMR, TDEE and adjustment</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      calorieData ? setShowExpandedAIPlan(true) : setView('settings');
                    }}
                    style={{
                      padding:'8px 16px',
                      background:'#667eea',
                      color:'#fff',
                      border:'none',
                      borderRadius:8,
                      fontSize:13,
                      fontWeight:600,
                      cursor:'pointer',
                      whiteSpace:'nowrap'
                    }}
                  >
                    View Plan →
                  </button>
                </div>

                {calorieData ? (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:12}}>
                    <div style={{background:'#fff',borderRadius:12,padding:16,border:'2px solid #667eea',textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>Daily Target</div>
                      <div style={{fontSize:24,fontWeight:700,color:'#667eea',lineHeight:1}}>{calorieData.daily_calories}</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>kcal</div>
                    </div>
                    <div style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #e5e7eb',textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>BMR</div>
                      <div style={{fontSize:24,fontWeight:700,color:'#10b981',lineHeight:1}}>{calorieData.bmr}</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>at rest</div>
                    </div>
                    <div style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #e5e7eb',textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>TDEE</div>
                      <div style={{fontSize:24,fontWeight:700,color:'#3b82f6',lineHeight:1}}>{calorieData.tdee}</div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>maintain</div>
                    </div>
                    <div style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #e5e7eb',textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>Adjustment</div>
                      <div style={{fontSize:24,fontWeight:700,color:calorieData.adjustment < 0 ? '#ef4444' : '#10b981',lineHeight:1}}>
                        {calorieData.adjustment > 0 ? '+' : ''}{calorieData.adjustment}
                      </div>
                      <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>for goal</div>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign:'center',padding:'30px 0',color:'#6b7280',fontSize:14}}>
                    Complete your profile to unlock your personalized AI calorie plan
                  </div>
                )}
              </div>

              {/* CARD 2: Hydration Tracker */}
              <div className="card" style={{background:'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',border:'2px solid #3b82f6',borderRadius:16,padding:20}}>
                <h3 style={{margin:0,fontSize:18,fontWeight:700,color:'#1e40af',marginBottom:4}}>Hydration</h3>
                <h3 style={{margin:0,fontSize:18,fontWeight:700,color:'#1e40af',marginBottom:16}}>Tracker</h3>

                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
                  {/* Water Bottle */}
                  <div style={{flex:'0 0 auto'}}>
                    <div style={{position:'relative',width:80,height:160}}>
                      <div style={{
                        position:'absolute',
                        top:25,
                        left:25,
                        width:30,
                        height:110,
                        border:'4px solid #1e40af',
                        borderRadius:'6px 6px 10px 10px',
                        background:'#fff',
                        overflow:'hidden'
                      }}>
                        <div style={{
                          position:'absolute',
                          bottom:0,
                          left:0,
                          right:0,
                          height:`${(waterGlasses / waterGoal) * 100}%`,
                          background:'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                          transition:'height 0.5s ease'
                        }} />
                      </div>
                      <div style={{
                        position:'absolute',
                        top:16,
                        left:31,
                        width:18,
                        height:14,
                        background:'#1e40af',
                        borderRadius:'3px 3px 0 0'
                      }} />
                    </div>
                  </div>

                  {/* Counter & Controls */}
                  <div style={{flex:1,textAlign:'center'}}>
                    <div style={{fontSize:56,fontWeight:700,color:'#1e40af',lineHeight:1,marginBottom:4}}>
                      {waterGlasses}
                      <span style={{fontSize:30,color:'#60a5fa'}}>/{waterGoal}</span>
                    </div>
                    <div style={{fontSize:14,color:'#1e3a8a',fontWeight:600,marginBottom:20}}>glasses today</div>

                    <div style={{display:'flex',gap:14,justifyContent:'center',marginBottom:20}}>
                      <button
                        onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                        disabled={waterGlasses === 0}
                        style={{
                          width:52,
                          height:52,
                          borderRadius:'50%',
                          border:'none',
                          background: waterGlasses === 0 ? '#e5e7eb' : '#fff',
                          color: waterGlasses === 0 ? '#9ca3af' : '#6b7280',
                          fontSize:32,
                          fontWeight:700,
                          cursor: waterGlasses === 0 ? 'not-allowed' : 'pointer',
                          boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => setWaterGlasses(Math.min(waterGoal + 5, waterGlasses + 1))}
                        style={{
                          width:52,
                          height:52,
                          borderRadius:'50%',
                          border:'none',
                          background:'#10b981',
                          color:'#fff',
                          fontSize:32,
                          fontWeight:700,
                          cursor:'pointer',
                          boxShadow:'0 2px 12px rgba(16,185,129,0.3)'
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{height:8,background:'rgba(255,255,255,0.3)',borderRadius:4,overflow:'hidden',marginBottom:8}}>
                      <div style={{
                        height:'100%',
                        width:`${Math.min((waterGlasses / waterGoal) * 100, 100)}%`,
                        background:'#3b82f6',
                        borderRadius:4,
                        transition:'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{fontSize:12,color:'#1e3a8a',fontWeight:600}}>
                      {Math.round((waterGlasses / waterGoal) * 100)}% of daily goal
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Recommended Recipes */}
              <div className="card" style={{background:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',border:'2px solid #f59e0b',borderRadius:16,padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <h3 style={{margin:0,fontSize:18,fontWeight:700,color:'#92400e'}}>Recommended Recipes</h3>
                  <div style={{display:'flex',gap:8}}>
                    <button style={{width:32,height:32,borderRadius:'50%',border:'1px solid #f59e0b',background:'#fff',color:'#f59e0b',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                    <button style={{width:32,height:32,borderRadius:'50%',border:'1px solid #f59e0b',background:'#fff',color:'#f59e0b',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
                  </div>
                </div>

                <div style={{display:'flex',overflowX:'auto',gap:12,paddingBottom:4,scrollbarWidth:'none'}}>
                  {[
                    { name: 'Healthion Salads', recipes: 142, icon: '🥗' },
                    { name: 'Healthy Smoothies', recipes: 188, icon: '🥤' },
                    { name: 'Smoothies, x', recipes: 138, icon: '🥗' }
                  ].map((recipe, idx) => (
                    <div
                      key={idx}
                      style={{
                        minWidth:140,
                        flexShrink:0,
                        background:'#fff',
                        borderRadius:12,
                        padding:12,
                        textAlign:'center',
                        cursor:'pointer',
                        border:'2px solid #fbbf24',
                        transition:'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width:'100%',
                        height:100,
                        borderRadius:8,
                        background:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        fontSize:52,
                        marginBottom:8
                      }}>
                        {recipe.icon}
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:'#92400e',marginBottom:4}}>{recipe.name}</div>
                      <div style={{fontSize:11,color:'#78350f'}}>{recipe.recipes} recipes</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
          <MealHistory />
        )}

        {view === 'analytics' && (
          <NutritionAnalytics />
        )}

        {view === 'analytics-old' && (
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

        {view === 'ai-calorie-plan' && (
          <div>
            {calorieData ? (
              <>
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                  <div>
                    <h2 style={{margin:0,color:'#667eea',fontSize:28,display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:32}}>🤖</span>
                      AI Daily Calorie Plan
                    </h2>
                    <div style={{fontSize:15,color:'#6b7280',marginTop:6}}>
                      Scientifically calculated using Mifflin-St Jeor formula
                    </div>
                  </div>
                  <button
                    onClick={calculateCalories}
                    className="btn"
                    style={{background:'#667eea',color:'#fff',padding:'10px 18px',fontSize:14,fontWeight:600}}
                    disabled={calorieLoading}
                  >
                    {calorieLoading ? 'Calculating...' : '🔄 Refresh Plan'}
                  </button>
                </div>

                {/* Calculation Metadata */}
                <div style={{fontSize:13,color:'#6b7280',marginBottom:24,padding:12,background:'#f8fafc',borderRadius:8,textAlign:'center'}}>
                  📅 Calculated {new Date(calorieData.metadata.calculated_at).toLocaleString()} • 
                  🏃 Activity: {calorieData.metadata.activity_level.replace('_', ' ')} • 
                  🎯 Goal: {calorieData.metadata.health_goal.replace('_', ' ')}
                </div>

                {/* Main Stats Grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:16,marginBottom:20}}>
                  <div className="card" style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'#fff',border:'none'}}>
                    <div style={{fontSize:14,opacity:0.9,marginBottom:8}}>🎯 Daily Target</div>
                    <div style={{fontSize:36,fontWeight:700}}>{calorieData.daily_calories}</div>
                    <div style={{fontSize:14,opacity:0.85,marginTop:4}}>kcal per day</div>
                  </div>
                  
                  <div className="card" style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',color:'#fff',border:'none'}}>
                    <div style={{fontSize:14,opacity:0.9,marginBottom:8}}>💤 BMR (Basal Metabolic Rate)</div>
                    <div style={{fontSize:36,fontWeight:700}}>{calorieData.bmr}</div>
                    <div style={{fontSize:14,opacity:0.85,marginTop:4}}>kcal at rest</div>
                  </div>
                  
                  <div className="card" style={{background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',color:'#fff',border:'none'}}>
                    <div style={{fontSize:14,opacity:0.9,marginBottom:8}}>⚡ TDEE (Total Daily Energy)</div>
                    <div style={{fontSize:36,fontWeight:700}}>{calorieData.tdee}</div>
                    <div style={{fontSize:14,opacity:0.85,marginTop:4}}>kcal to maintain</div>
                  </div>
                  
                  <div className="card" style={{background:calorieData.adjustment < 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',color:'#fff',border:'none'}}>
                    <div style={{fontSize:14,opacity:0.9,marginBottom:8}}>📊 Adjustment for Goal</div>
                    <div style={{fontSize:36,fontWeight:700}}>
                      {calorieData.adjustment > 0 ? '+' : ''}{calorieData.adjustment}
                    </div>
                    <div style={{fontSize:14,opacity:0.85,marginTop:4}}>kcal {calorieData.adjustment < 0 ? 'deficit' : 'surplus'}</div>
                  </div>
                </div>

                {/* Macro Targets */}
                <div className="card" style={{marginBottom:20}}>
                  <h3 style={{margin:0,marginBottom:16,color:'#374151'}}>🎯 Daily Macro Targets</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16}}>
                    <div style={{padding:20,background:'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',borderRadius:12,textAlign:'center',border:'2px solid #ec4899'}}>
                      <div style={{fontSize:13,color:'#9f1239',marginBottom:8,fontWeight:600}}>PROTEIN ({calorieData.macros.protein.percentage}%)</div>
                      <div style={{fontSize:32,fontWeight:700,color:'#ec4899',marginBottom:4}}>{calorieData.macros.protein.grams}g</div>
                      <div style={{fontSize:13,color:'#9f1239',opacity:0.8}}>{calorieData.macros.protein.calories} kcal</div>
                      <div style={{marginTop:8,padding:8,background:'#fff',borderRadius:6,fontSize:12,color:'#6b7280'}}>
                        4 kcal per gram
                      </div>
                    </div>
                    
                    <div style={{padding:20,background:'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',borderRadius:12,textAlign:'center',border:'2px solid #06b6d4'}}>
                      <div style={{fontSize:13,color:'#164e63',marginBottom:8,fontWeight:600}}>CARBS ({calorieData.macros.carbs.percentage}%)</div>
                      <div style={{fontSize:32,fontWeight:700,color:'#06b6d4',marginBottom:4}}>{calorieData.macros.carbs.grams}g</div>
                      <div style={{fontSize:13,color:'#164e63',opacity:0.8}}>{calorieData.macros.carbs.calories} kcal</div>
                      <div style={{marginTop:8,padding:8,background:'#fff',borderRadius:6,fontSize:12,color:'#6b7280'}}>
                        4 kcal per gram
                      </div>
                    </div>
                    
                    <div style={{padding:20,background:'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',borderRadius:12,textAlign:'center',border:'2px solid #10b981'}}>
                      <div style={{fontSize:13,color:'#065f46',marginBottom:8,fontWeight:600}}>FAT ({calorieData.macros.fat.percentage}%)</div>
                      <div style={{fontSize:32,fontWeight:700,color:'#10b981',marginBottom:4}}>{calorieData.macros.fat.grams}g</div>
                      <div style={{fontSize:13,color:'#065f46',opacity:0.8}}>{calorieData.macros.fat.calories} kcal</div>
                      <div style={{marginTop:8,padding:8,background:'#fff',borderRadius:6,fontSize:12,color:'#6b7280'}}>
                        9 kcal per gram
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meal-wise Calorie Tracker */}
                <div style={{marginBottom:24}}>
                  {/* Header with Date Filter */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
                        🍽️
                      </div>
                      <h3 style={{margin:0,fontSize:22,fontWeight:700,color:'#1f2937'}}>Meal-wise Calorie Tracker</h3>
                    </div>
                    
                    {/* Date Filter Dropdown */}
                    <div style={{position:'relative'}}>
                      <button
                        onClick={() => setShowTrackerDropdown(!showTrackerDropdown)}
                        style={{
                          display:'flex',
                          alignItems:'center',
                          gap:8,
                          padding:'10px 16px',
                          background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color:'#fff',
                          border:'none',
                          borderRadius:20,
                          fontSize:14,
                          fontWeight:600,
                          cursor:'pointer',
                          boxShadow:'0 4px 12px rgba(102,126,234,0.3)',
                          transition:'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <span style={{fontSize:16}}>📅</span>
                        <span>{getTrackerDateLabel()}</span>
                        <span style={{fontSize:12,opacity:0.8}}>▼</span>
                      </button>

                      {/* Dropdown Menu */}
                      {showTrackerDropdown && (
                        <>
                          {/* Backdrop */}
                          <div
                            onClick={() => setShowTrackerDropdown(false)}
                            style={{
                              position:'fixed',
                              top:0,
                              left:0,
                              right:0,
                              bottom:0,
                              zIndex:999
                            }}
                          />
                          
                          {/* Menu */}
                          <div style={{
                            position:'absolute',
                            top:'100%',
                            right:0,
                            marginTop:8,
                            background:'#fff',
                            borderRadius:12,
                            boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
                            border:'1px solid #e5e7eb',
                            minWidth:200,
                            zIndex:1000,
                            overflow:'hidden'
                          }}>
                            <button
                              onClick={() => {
                                setTrackerDateFilter('today');
                                setShowTrackerDropdown(false);
                              }}
                              style={{
                                width:'100%',
                                padding:'12px 16px',
                                background: trackerDateFilter === 'today' ? '#f3f4f6' : 'transparent',
                                border:'none',
                                textAlign:'left',
                                fontSize:14,
                                fontWeight: trackerDateFilter === 'today' ? 600 : 400,
                                color:'#374151',
                                cursor:'pointer',
                                transition:'background 0.15s ease',
                                display:'flex',
                                alignItems:'center',
                                gap:8
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.background = trackerDateFilter === 'today' ? '#f3f4f6' : 'transparent'}
                            >
                              {trackerDateFilter === 'today' && <span style={{color:'#667eea'}}>✓</span>}
                              <span>Today</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setTrackerDateFilter('yesterday');
                                setShowTrackerDropdown(false);
                              }}
                              style={{
                                width:'100%',
                                padding:'12px 16px',
                                background: trackerDateFilter === 'yesterday' ? '#f3f4f6' : 'transparent',
                                border:'none',
                                textAlign:'left',
                                fontSize:14,
                                fontWeight: trackerDateFilter === 'yesterday' ? 600 : 400,
                                color:'#374151',
                                cursor:'pointer',
                                transition:'background 0.15s ease',
                                display:'flex',
                                alignItems:'center',
                                gap:8
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.background = trackerDateFilter === 'yesterday' ? '#f3f4f6' : 'transparent'}
                            >
                              {trackerDateFilter === 'yesterday' && <span style={{color:'#667eea'}}>✓</span>}
                              <span>Yesterday</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setTrackerDateFilter('twoDaysAgo');
                                setShowTrackerDropdown(false);
                              }}
                              style={{
                                width:'100%',
                                padding:'12px 16px',
                                background: trackerDateFilter === 'twoDaysAgo' ? '#f3f4f6' : 'transparent',
                                border:'none',
                                textAlign:'left',
                                fontSize:14,
                                fontWeight: trackerDateFilter === 'twoDaysAgo' ? 600 : 400,
                                color:'#374151',
                                cursor:'pointer',
                                transition:'background 0.15s ease',
                                display:'flex',
                                alignItems:'center',
                                gap:8
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.background = trackerDateFilter === 'twoDaysAgo' ? '#f3f4f6' : 'transparent'}
                            >
                              {trackerDateFilter === 'twoDaysAgo' && <span style={{color:'#667eea'}}>✓</span>}
                              <span>2 days ago</span>
                            </button>
                            
                            <div style={{height:1,background:'#e5e7eb',margin:'4px 0'}} />
                            
                            <div style={{padding:'12px 16px'}}>
                              <label style={{fontSize:12,color:'#6b7280',fontWeight:600,display:'block',marginBottom:6}}>Choose a date</label>
                              <input
                                type="date"
                                value={trackerCustomDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  setTrackerCustomDate(e.target.value);
                                  setTrackerDateFilter('custom');
                                  setShowTrackerDropdown(false);
                                }}
                                style={{
                                  width:'100%',
                                  padding:'8px 10px',
                                  border:'1px solid #d1d5db',
                                  borderRadius:6,
                                  fontSize:13,
                                  fontFamily:'inherit',
                                  cursor:'pointer'
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Viewing Date Strip */}
                  <div style={{
                    textAlign:'center',
                    padding:'10px 16px',
                    background:'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderRadius:20,
                    marginBottom:16,
                    fontSize:13,
                    fontWeight:600,
                    color:'#0c4a6e',
                    border:'1px solid #bae6fd'
                  }}>
                    <span style={{opacity:0.7}}>Viewing:</span> {getTrackerFormattedDate()}
                  </div>

                  <div style={{display:'grid',gap:14}}>
                    {/* Breakfast Card */}
                    <div style={{
                      background:'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
                      borderRadius:16,
                      padding:18,
                      border:'2px solid #fecaca',
                      boxShadow:'0 4px 12px rgba(254,202,202,0.3)',
                      transition:'all 0.3s ease'
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{
                            width:40,
                            height:40,
                            borderRadius:10,
                            background:'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            fontSize:20,
                            boxShadow:'0 4px 8px rgba(251,146,60,0.3)'
                          }}>
                            🌅
                          </div>
                          <div>
                            <div style={{fontSize:16,fontWeight:700,color:'#7c2d12'}}>Breakfast</div>
                            <div style={{fontSize:12,color:'#9a3412',opacity:0.8}}>{calorieData.meal_split_percentages.breakfast}% of daily • Morning fuel & energy</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:20,fontWeight:700,color:'#ea580c'}}>
                            {consumedCalories.breakfast}<span style={{fontSize:14,color:'#9a3412',opacity:0.7}}>/{calorieData.meal_calories.breakfast}</span>
                          </div>
                          <div style={{fontSize:11,color:'#9a3412',opacity:0.7}}>kcal consumed</div>
                        </div>
                      </div>
                      
                      <div style={{position:'relative',height:28,background:'rgba(251,146,60,0.15)',borderRadius:14,overflow:'hidden',border:'1px solid rgba(251,146,60,0.2)'}}>
                        <div style={{
                          position:'absolute',
                          top:0,
                          left:0,
                          height:'100%',
                          width:`${Math.min((consumedCalories.breakfast / calorieData.meal_calories.breakfast) * 100, 100)}%`,
                          background: consumedCalories.breakfast > calorieData.meal_calories.breakfast 
                            ? 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)' 
                            : 'linear-gradient(90deg, #fb923c 0%, #f97316 100%)',
                          borderRadius:14,
                          transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1), 0 0 12px rgba(251,146,60,0.4)'
                        }}>
                          <div style={{
                            position:'absolute',
                            top:0,
                            left:0,
                            right:0,
                            height:'50%',
                            background:'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                            borderRadius:'14px 14px 0 0'
                          }} />
                        </div>
                        <div style={{
                          position:'absolute',
                          top:'50%',
                          left:12,
                          transform:'translateY(-50%)',
                          fontSize:12,
                          fontWeight:700,
                          color:consumedCalories.breakfast > calorieData.meal_calories.breakfast * 0.3 ? '#fff' : '#7c2d12',
                          textShadow:consumedCalories.breakfast > calorieData.meal_calories.breakfast * 0.3 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          zIndex:10
                        }}>
                          {Math.round((consumedCalories.breakfast / calorieData.meal_calories.breakfast) * 100)}% consumed
                        </div>
                      </div>

                      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:12}}>
                        <div style={{color:'#9a3412',display:'flex',alignItems:'center',gap:4}}>
                          ✅ <span style={{fontWeight:600}}>Over by {consumedCalories.breakfast > calorieData.meal_calories.breakfast ? (consumedCalories.breakfast - calorieData.meal_calories.breakfast) : 0} kcal</span>
                        </div>
                        <div style={{color:'#15803d',fontWeight:600}}>
                          📊 {calorieData.meal_calories.breakfast - consumedCalories.breakfast > 0 ? (calorieData.meal_calories.breakfast - consumedCalories.breakfast) : 0} kcal remaining
                        </div>
                      </div>
                    </div>

                    {/* Lunch Card */}
                    <div style={{
                      background:'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      borderRadius:16,
                      padding:18,
                      border:'2px solid #bfdbfe',
                      boxShadow:'0 4px 12px rgba(191,219,254,0.3)',
                      transition:'all 0.3s ease'
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{
                            width:40,
                            height:40,
                            borderRadius:10,
                            background:'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            fontSize:20,
                            boxShadow:'0 4px 8px rgba(59,130,246,0.3)'
                          }}>
                            ☀️
                          </div>
                          <div>
                            <div style={{fontSize:16,fontWeight:700,color:'#1e3a8a'}}>Lunch</div>
                            <div style={{fontSize:12,color:'#1e40af',opacity:0.8}}>{calorieData.meal_split_percentages.lunch}% of daily • Main meal & nutrition</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:20,fontWeight:700,color:'#2563eb'}}>
                            {consumedCalories.lunch}<span style={{fontSize:14,color:'#1e40af',opacity:0.7}}>/{calorieData.meal_calories.lunch}</span>
                          </div>
                          <div style={{fontSize:11,color:'#1e40af',opacity:0.7}}>kcal consumed</div>
                        </div>
                      </div>
                      
                      <div style={{position:'relative',height:28,background:'rgba(59,130,246,0.15)',borderRadius:14,overflow:'hidden',border:'1px solid rgba(59,130,246,0.2)'}}>
                        <div style={{
                          position:'absolute',
                          top:0,
                          left:0,
                          height:'100%',
                          width:`${Math.min((consumedCalories.lunch / calorieData.meal_calories.lunch) * 100, 100)}%`,
                          background: consumedCalories.lunch > calorieData.meal_calories.lunch 
                            ? 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)' 
                            : 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
                          borderRadius:14,
                          transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1), 0 0 12px rgba(59,130,246,0.4)'
                        }}>
                          <div style={{
                            position:'absolute',
                            top:0,
                            left:0,
                            right:0,
                            height:'50%',
                            background:'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                            borderRadius:'14px 14px 0 0'
                          }} />
                        </div>
                        <div style={{
                          position:'absolute',
                          top:'50%',
                          left:12,
                          transform:'translateY(-50%)',
                          fontSize:12,
                          fontWeight:700,
                          color:consumedCalories.lunch > calorieData.meal_calories.lunch * 0.3 ? '#fff' : '#1e3a8a',
                          textShadow:consumedCalories.lunch > calorieData.meal_calories.lunch * 0.3 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          zIndex:10
                        }}>
                          {Math.round((consumedCalories.lunch / calorieData.meal_calories.lunch) * 100)}% consumed
                        </div>
                      </div>

                      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:12}}>
                        <div style={{color:'#1e40af',display:'flex',alignItems:'center',gap:4}}>
                          {consumedCalories.lunch > calorieData.meal_calories.lunch ? '⚠️' : '✅'} <span style={{fontWeight:600}}>On track</span>
                        </div>
                        <div style={{color:'#15803d',fontWeight:600}}>
                          📊 {calorieData.meal_calories.lunch - consumedCalories.lunch > 0 ? (calorieData.meal_calories.lunch - consumedCalories.lunch) : 0} kcal remaining
                        </div>
                      </div>
                    </div>

                    {/* Evening Snack Card */}
                    <div style={{
                      background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius:16,
                      padding:18,
                      border:'2px solid #bbf7d0',
                      boxShadow:'0 4px 12px rgba(187,247,208,0.3)',
                      transition:'all 0.3s ease'
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{
                            width:40,
                            height:40,
                            borderRadius:10,
                            background:'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            fontSize:20,
                            boxShadow:'0 4px 8px rgba(16,185,129,0.3)'
                          }}>
                            🍵
                          </div>
                          <div>
                            <div style={{fontSize:16,fontWeight:700,color:'#064e3b'}}>Evening Snack</div>
                            <div style={{fontSize:12,color:'#065f46',opacity:0.8}}>{calorieData.meal_split_percentages.evening_snack}% of daily • Light refreshment</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:20,fontWeight:700,color:'#059669'}}>
                            {consumedCalories.evening_snack}<span style={{fontSize:14,color:'#065f46',opacity:0.7}}>/{calorieData.meal_calories.evening_snack}</span>
                          </div>
                          <div style={{fontSize:11,color:'#065f46',opacity:0.7}}>kcal consumed</div>
                        </div>
                      </div>
                      
                      <div style={{position:'relative',height:28,background:'rgba(16,185,129,0.15)',borderRadius:14,overflow:'hidden',border:'1px solid rgba(16,185,129,0.2)'}}>
                        <div style={{
                          position:'absolute',
                          top:0,
                          left:0,
                          height:'100%',
                          width:`${Math.min((consumedCalories.evening_snack / calorieData.meal_calories.evening_snack) * 100, 100)}%`,
                          background: consumedCalories.evening_snack > calorieData.meal_calories.evening_snack 
                            ? 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)' 
                            : 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                          borderRadius:14,
                          transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1), 0 0 12px rgba(16,185,129,0.4)'
                        }}>
                          <div style={{
                            position:'absolute',
                            top:0,
                            left:0,
                            right:0,
                            height:'50%',
                            background:'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                            borderRadius:'14px 14px 0 0'
                          }} />
                        </div>
                        <div style={{
                          position:'absolute',
                          top:'50%',
                          left:12,
                          transform:'translateY(-50%)',
                          fontSize:12,
                          fontWeight:700,
                          color:consumedCalories.evening_snack > calorieData.meal_calories.evening_snack * 0.3 ? '#fff' : '#064e3b',
                          textShadow:consumedCalories.evening_snack > calorieData.meal_calories.evening_snack * 0.3 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          zIndex:10
                        }}>
                          {Math.round((consumedCalories.evening_snack / calorieData.meal_calories.evening_snack) * 100)}% consumed
                        </div>
                      </div>

                      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:12}}>
                        <div style={{color:'#065f46',display:'flex',alignItems:'center',gap:4}}>
                          {consumedCalories.evening_snack > calorieData.meal_calories.evening_snack ? '⚠️' : '✅'} <span style={{fontWeight:600}}>On track</span>
                        </div>
                        <div style={{color:'#15803d',fontWeight:600}}>
                          📊 {calorieData.meal_calories.evening_snack - consumedCalories.evening_snack > 0 ? (calorieData.meal_calories.evening_snack - consumedCalories.evening_snack) : 0} kcal remaining
                        </div>
                      </div>
                    </div>

                    {/* Dinner Card */}
                    <div style={{
                      background:'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                      borderRadius:16,
                      padding:18,
                      border:'2px solid #ddd6fe',
                      boxShadow:'0 4px 12px rgba(221,214,254,0.3)',
                      transition:'all 0.3s ease'
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{
                            width:40,
                            height:40,
                            borderRadius:10,
                            background:'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            fontSize:20,
                            boxShadow:'0 4px 8px rgba(139,92,246,0.3)'
                          }}>
                            🌙
                          </div>
                          <div>
                            <div style={{fontSize:16,fontWeight:700,color:'#4c1d95'}}>Dinner</div>
                            <div style={{fontSize:12,color:'#5b21b6',opacity:0.8}}>{calorieData.meal_split_percentages.dinner}% of daily • Evening meal</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:20,fontWeight:700,color:'#7c3aed'}}>
                            {consumedCalories.dinner}<span style={{fontSize:14,color:'#5b21b6',opacity:0.7}}>/{calorieData.meal_calories.dinner}</span>
                          </div>
                          <div style={{fontSize:11,color:'#5b21b6',opacity:0.7}}>kcal consumed</div>
                        </div>
                      </div>
                      
                      <div style={{position:'relative',height:28,background:'rgba(139,92,246,0.15)',borderRadius:14,overflow:'hidden',border:'1px solid rgba(139,92,246,0.2)'}}>
                        <div style={{
                          position:'absolute',
                          top:0,
                          left:0,
                          height:'100%',
                          width:`${Math.min((consumedCalories.dinner / calorieData.meal_calories.dinner) * 100, 100)}%`,
                          background: consumedCalories.dinner > calorieData.meal_calories.dinner 
                            ? 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)' 
                            : 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)',
                          borderRadius:14,
                          transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1), 0 0 12px rgba(139,92,246,0.4)'
                        }}>
                          <div style={{
                            position:'absolute',
                            top:0,
                            left:0,
                            right:0,
                            height:'50%',
                            background:'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                            borderRadius:'14px 14px 0 0'
                          }} />
                        </div>
                        <div style={{
                          position:'absolute',
                          top:'50%',
                          left:12,
                          transform:'translateY(-50%)',
                          fontSize:12,
                          fontWeight:700,
                          color:consumedCalories.dinner > calorieData.meal_calories.dinner * 0.3 ? '#fff' : '#4c1d95',
                          textShadow:consumedCalories.dinner > calorieData.meal_calories.dinner * 0.3 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          zIndex:10
                        }}>
                          {Math.round((consumedCalories.dinner / calorieData.meal_calories.dinner) * 100)}% consumed
                        </div>
                      </div>

                      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:12}}>
                        <div style={{color:'#5b21b6',display:'flex',alignItems:'center',gap:4}}>
                          {consumedCalories.dinner > calorieData.meal_calories.dinner ? '⚠️' : '✅'} <span style={{fontWeight:600}}>On track</span>
                        </div>
                        <div style={{color:'#15803d',fontWeight:600}}>
                          📊 {calorieData.meal_calories.dinner - consumedCalories.dinner > 0 ? (calorieData.meal_calories.dinner - consumedCalories.dinner) : 0} kcal remaining
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Daily Summary Card */}
                  <div style={{
                    marginTop:20,
                    background:'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
                    borderRadius:20,
                    padding:24,
                    border:'3px solid #fbbf24',
                    boxShadow:'0 8px 24px rgba(251,191,36,0.25), 0 0 0 1px rgba(251,191,36,0.1)',
                    position:'relative',
                    overflow:'hidden'
                  }}>
                    {/* Decorative elements */}
                    <div style={{
                      position:'absolute',
                      top:-20,
                      right:-20,
                      width:100,
                      height:100,
                      borderRadius:'50%',
                      background:'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
                      pointerEvents:'none'
                    }} />
                    <div style={{
                      position:'absolute',
                      bottom:-30,
                      left:-30,
                      width:120,
                      height:120,
                      borderRadius:'50%',
                      background:'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
                      pointerEvents:'none'
                    }} />

                    <div style={{position:'relative',zIndex:1}}>
                      {/* Header */}
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                        <div style={{
                          width:48,
                          height:48,
                          borderRadius:12,
                          background:'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          fontSize:24,
                          boxShadow:'0 4px 12px rgba(251,191,36,0.4)'
                        }}>
                          📊
                        </div>
                        <div>
                          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:'#78350f'}}>Daily Calorie Summary</h3>
                          <div style={{fontSize:13,color:'#92400e',opacity:0.8}}>Track your overall progress</div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
                        {/* Total Consumed */}
                        <div style={{background:'rgba(255,255,255,0.7)',borderRadius:12,padding:16,border:'2px solid #fde047',backdropFilter:'blur(10px)'}}>
                          <div style={{fontSize:12,color:'#92400e',fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                            🔥 <span>Consumed</span>
                          </div>
                          <div style={{fontSize:26,fontWeight:700,color:'#ea580c',lineHeight:1}}>
                            {consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner}
                          </div>
                          <div style={{fontSize:11,color:'#92400e',opacity:0.7,marginTop:4}}>kcal eaten</div>
                        </div>

                        {/* Daily Target */}
                        <div style={{background:'rgba(255,255,255,0.7)',borderRadius:12,padding:16,border:'2px solid #fde047',backdropFilter:'blur(10px)'}}>
                          <div style={{fontSize:12,color:'#92400e',fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                            🎯 <span>Target</span>
                          </div>
                          <div style={{fontSize:26,fontWeight:700,color:'#0ea5e9',lineHeight:1}}>
                            {calorieData.daily_calories}
                          </div>
                          <div style={{fontSize:11,color:'#92400e',opacity:0.7,marginTop:4}}>kcal goal</div>
                        </div>

                        {/* Remaining */}
                        <div style={{background:'rgba(255,255,255,0.7)',borderRadius:12,padding:16,border:'2px solid #fde047',backdropFilter:'blur(10px)'}}>
                          <div style={{fontSize:12,color:'#92400e',fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                            {calorieData.daily_calories - (consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) >= 0 ? '✅' : '⚠️'} <span>Remaining</span>
                          </div>
                          <div style={{fontSize:26,fontWeight:700,color:calorieData.daily_calories - (consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) >= 0 ? '#10b981' : '#ef4444',lineHeight:1}}>
                            {Math.abs(calorieData.daily_calories - (consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner))}
                          </div>
                          <div style={{fontSize:11,color:'#92400e',opacity:0.7,marginTop:4}}>
                            {calorieData.daily_calories - (consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) >= 0 ? 'kcal left' : 'kcal over'}
                          </div>
                        </div>
                      </div>

                      {/* Overall Progress Bar */}
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                          <span style={{fontSize:13,fontWeight:600,color:'#78350f'}}>Overall Daily Progress</span>
                          <span style={{fontSize:13,fontWeight:700,color:'#ea580c'}}>
                            {Math.round(((consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) / calorieData.daily_calories) * 100)}%
                          </span>
                        </div>
                        <div style={{
                          position:'relative',
                          height:32,
                          background:'rgba(251,191,36,0.2)',
                          borderRadius:16,
                          overflow:'hidden',
                          border:'2px solid rgba(251,191,36,0.3)'
                        }}>
                          <div style={{
                            position:'absolute',
                            top:0,
                            left:0,
                            height:'100%',
                            width:`${Math.min(((consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) / calorieData.daily_calories) * 100, 100)}%`,
                            background: (consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) > calorieData.daily_calories
                              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                              : 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                            borderRadius:16,
                            transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow:'inset 0 2px 4px rgba(0,0,0,0.1), 0 0 16px rgba(251,191,36,0.5)'
                          }}>
                            {/* Glossy overlay */}
                            <div style={{
                              position:'absolute',
                              top:0,
                              left:0,
                              right:0,
                              height:'50%',
                              background:'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
                              borderRadius:'16px 16px 0 0'
                            }} />
                            {/* Animated shimmer effect */}
                            <div style={{
                              position:'absolute',
                              top:0,
                              left:'-100%',
                              width:'100%',
                              height:'100%',
                              background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                              animation:'shimmer 2s infinite',
                              borderRadius:16
                            }} />
                          </div>
                        </div>

                        {/* Status message */}
                        <div style={{marginTop:12,textAlign:'center'}}>
                          {(consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) > calorieData.daily_calories ? (
                            <div style={{
                              display:'inline-flex',
                              alignItems:'center',
                              gap:6,
                              padding:'8px 16px',
                              background:'rgba(239,68,68,0.1)',
                              borderRadius:20,
                              border:'1px solid rgba(239,68,68,0.3)'
                            }}>
                              <span style={{fontSize:16}}>⚠️</span>
                              <span style={{fontSize:13,fontWeight:600,color:'#991b1b'}}>
                                You've exceeded your daily target by {(consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) - calorieData.daily_calories} kcal
                              </span>
                            </div>
                          ) : (consumedCalories.breakfast + consumedCalories.lunch + consumedCalories.evening_snack + consumedCalories.dinner) >= calorieData.daily_calories * 0.8 ? (
                            <div style={{
                              display:'inline-flex',
                              alignItems:'center',
                              gap:6,
                              padding:'8px 16px',
                              background:'rgba(16,185,129,0.1)',
                              borderRadius:20,
                              border:'1px solid rgba(16,185,129,0.3)'
                            }}>
                              <span style={{fontSize:16}}>🎉</span>
                              <span style={{fontSize:13,fontWeight:600,color:'#065f46'}}>
                                Great progress! You're on track to meet your daily goal
                              </span>
                            </div>
                          ) : (
                            <div style={{
                              display:'inline-flex',
                              alignItems:'center',
                              gap:6,
                              padding:'8px 16px',
                              background:'rgba(59,130,246,0.1)',
                              borderRadius:20,
                              border:'1px solid rgba(59,130,246,0.3)'
                            }}>
                              <span style={{fontSize:16}}>💪</span>
                              <span style={{fontSize:13,fontWeight:600,color:'#1e40af'}}>
                                Keep going! You have plenty of calories remaining for today
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <style>{`
                  @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                  }
                `}</style>

                {/* Personalized Insights */}
                <div className="card" style={{marginBottom:20,background:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',border:'2px solid #f59e0b'}}>
                  <h3 style={{margin:0,marginBottom:16,color:'#92400e',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:24}}>💡</span>
                    <span>Personalized Insights</span>
                  </h3>
                  <div style={{display:'grid',gap:12}}>
                    {calorieData.insights.tips.map((tip: string, idx: number) => (
                      <div key={idx} style={{fontSize:14,color:'#92400e',lineHeight:1.7,paddingLeft:20,position:'relative',background:'rgba(255,255,255,0.5)',padding:12,borderRadius:8}}>
                        <span style={{position:'absolute',left:12,fontSize:16}}>✓</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="card" style={{marginBottom:20}}>
                  <h3 style={{margin:0,marginBottom:16,color:'#374151'}}>📈 Health Metrics</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:16}}>
                    <div style={{padding:16,background:'#f0fdf4',borderRadius:10,border:'1px solid #86efac'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#065f46',marginBottom:6}}>BMI (Body Mass Index)</div>
                      <div style={{fontSize:28,fontWeight:700,color:'#10b981'}}>{calorieData.insights.bmi}</div>
                      <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Indian Standards</div>
                    </div>
                    
                    <div style={{padding:16,background:'#eff6ff',borderRadius:10,border:'1px solid #93c5fd'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1e40af',marginBottom:6}}>Daily Water Goal</div>
                      <div style={{fontSize:28,fontWeight:700,color:'#3b82f6'}}>{calorieData.insights.water_intake_liters}L</div>
                      <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>per day</div>
                    </div>
                    
                    <div style={{padding:16,background:calorieData.insights.estimated_weekly_change_kg < 0 ? '#f0fdf4' : '#eff6ff',borderRadius:10,border:calorieData.insights.estimated_weekly_change_kg < 0 ? '1px solid #86efac' : '1px solid #93c5fd'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:6}}>Est. Weekly Change</div>
                      <div style={{fontSize:28,fontWeight:700,color:calorieData.insights.estimated_weekly_change_kg < 0 ? '#059669' : '#2563eb'}}>
                        {calorieData.insights.estimated_weekly_change_kg > 0 ? '+' : ''}{calorieData.insights.estimated_weekly_change_kg}kg
                      </div>
                      <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>
                        {calorieData.insights.estimated_weekly_change_kg < 0 ? 'Weight loss' : 'Weight gain'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* How It Works */}
                <div className="card" style={{background:'#f8fafc',border:'1px solid #e5e7eb'}}>
                  <h3 style={{margin:0,marginBottom:16,color:'#374151'}}>🔬 How We Calculate Your Plan</h3>
                  <div style={{display:'grid',gap:12}}>
                    <div style={{padding:12,background:'#fff',borderRadius:8,borderLeft:'4px solid #667eea'}}>
                      <div style={{fontWeight:600,fontSize:14,color:'#667eea',marginBottom:4}}>1. BMR Calculation (Mifflin-St Jeor)</div>
                      <div style={{fontSize:13,color:'#6b7280',lineHeight:1.6}}>
                        Your Basal Metabolic Rate is the calories your body burns at rest. Calculated using your weight, height, age, and gender.
                      </div>
                    </div>
                    
                    <div style={{padding:12,background:'#fff',borderRadius:8,borderLeft:'4px solid #10b981'}}>
                      <div style={{fontWeight:600,fontSize:14,color:'#10b981',marginBottom:4}}>2. Activity Multiplier</div>
                      <div style={{fontSize:13,color:'#6b7280',lineHeight:1.6}}>
                        BMR × Activity Level = TDEE (Total Daily Energy Expenditure). This is what you need to maintain your current weight.
                      </div>
                    </div>
                    
                    <div style={{padding:12,background:'#fff',borderRadius:8,borderLeft:'4px solid #f59e0b'}}>
                      <div style={{fontWeight:600,fontSize:14,color:'#f59e0b',marginBottom:4}}>3. Goal Adjustment</div>
                      <div style={{fontSize:13,color:'#6b7280',lineHeight:1.6}}>
                        Based on your health goal (lose/gain weight or maintain), we adjust your TDEE to create a sustainable calorie target.
                      </div>
                    </div>
                    
                    <div style={{padding:12,background:'#fff',borderRadius:8,borderLeft:'4px solid #ec4899'}}>
                      <div style={{fontWeight:600,fontSize:14,color:'#ec4899',marginBottom:4}}>4. Macro Distribution</div>
                      <div style={{fontSize:13,color:'#6b7280',lineHeight:1.6}}>
                        Optimal protein, carbs, and fat ratios based on your goal. Protein for muscle, carbs for energy, healthy fats for hormones.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card" style={{textAlign:'center',padding:40}}>
                <div style={{fontSize:48,marginBottom:16}}>🤖</div>
                <h3 style={{color:'#667eea',marginBottom:12}}>No AI Calorie Plan Yet</h3>
                <div style={{color:'#6b7280',marginBottom:24,fontSize:15}}>
                  Complete your profile to get your personalized AI-powered calorie plan
                </div>
                <button
                  onClick={() => setView('settings')}
                  className="btn"
                  style={{background:'#667eea',color:'#fff',padding:'12px 24px',fontSize:15,fontWeight:600}}
                >
                  Complete Profile
                </button>
              </div>
            )}
          </div>
        )}

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

                    {/* Success/Error Messages */}
                    {profileSuccess && (
                      <div style={{background:'#d1fae5',color:'#065f46',padding:'10px 12px',borderRadius:8,marginTop:12,fontSize:14}}>
                        ✓ {profileSuccess}
                      </div>
                    )}
                    {profileError && (
                      <div className="error-msg" style={{marginTop:12}}>{profileError}</div>
                    )}

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
                    } else {
                      // Show all dishes when clicking without text
                      setFilteredDishes(dishes.slice(0, 10));
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Type dish name or click to browse..."
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
                    <div style={{
                      padding:'8px 12px',
                      background:'#f8fafc',
                      borderBottom:'2px solid #e5e7eb',
                      fontSize:12,
                      fontWeight:600,
                      color:'#6b7280',
                      position:'sticky',
                      top:0
                    }}>
                      {filteredDishes.length === dishes.length ? 'All Dishes' : `${filteredDishes.length} dishes found`}
                    </div>
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

              <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:16,paddingTop:16,borderTop:'2px solid #e5e7eb'}}>
                <button 
                  className="btn" 
                  onClick={()=>{
                    // Add current form to meals list
                    if (!form.name.trim()) {
                      setLogError('Please enter a meal name');
                      return;
                    }
                    const newMeal = {
                      id: Date.now(),
                      name: form.name,
                      serving_size: form.serving_size,
                      unit: form.unit,
                      calories: form.calories,
                      protein: form.protein,
                      carbs: form.carbs,
                      fat: form.fat
                    };
                    setMealsList([...mealsList, newMeal]);
                    // Reset form
                    setForm({ name: '', serving_size: 100, unit: 'g', calories: '', protein: '', carbs: '', fat: '', meal_type: form.meal_type });
                    setBaseServing(100);
                    setBaseNutrition(null);
                    setLogError(null);
                  }}
                  style={{background:'#10b981',flex:1}}
                  disabled={logging}
                >
                  + Add More
                </button>
                <button 
                  className="btn" 
                  onClick={async ()=>{
                    if (!form.name.trim() && mealsList.length === 0) {
                      setLogError('Please add at least one meal');
                      return;
                    }
                    
                    setLogging(true);
                    setLogError(null);
                    
                    try {
                      // Add current form if filled
                      let mealsToLog = [...mealsList];
                      if (form.name.trim()) {
                        mealsToLog.push({
                          id: Date.now(),
                          name: form.name,
                          serving_size: form.serving_size,
                          unit: form.unit,
                          calories: form.calories,
                          protein: form.protein,
                          carbs: form.carbs,
                          fat: form.fat
                        });
                      }
                      
                      // Log all meals
                      for (const meal of mealsToLog) {
                        const payload: any = {
                          name: meal.name || 'Meal',
                          serving_size: Number(meal.serving_size) || 0,
                          unit: meal.unit || 'g',
                          meal_type: form.meal_type || 'Breakfast'
                        };
                        if (meal.calories !== '') payload.calories = Number(meal.calories);
                        if (meal.protein !== '') payload.protein = Number(meal.protein);
                        if (meal.carbs !== '') payload.carbs = Number(meal.carbs);
                        if (meal.fat !== '') payload.fat = Number(meal.fat);
                        
                        const headers: any = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        
                        await fetch(`${API_BASE}/meals`, { 
                          method: 'POST', 
                          headers, 
                          body: JSON.stringify(payload) 
                        });
                      }
                      
                      // Refresh data
                      await loadAll();
                      
                      // Reset and close
                      setShowLogger(false);
                      setForm({ name:'', serving_size:100, unit:'g', calories:'', protein:'', carbs:'', fat:'', meal_type: 'Breakfast' });
                      setMealsList([]);
                      setBaseServing(100);
                      setBaseNutrition(null);
                    } catch (err: any) {
                      setLogError(err?.message ?? 'Failed to log meals');
                    } finally {
                      setLogging(false);
                    }
                  }}
                  style={{flex:1}}
                  disabled={logging}
                >
                  {logging ? 'Saving...' : `Save ${mealsList.length > 0 ? `(${mealsList.length + (form.name.trim() ? 1 : 0)} meals)` : ''}`}
                </button>
                <button className="btn" style={{background:'#ef4444'}} onClick={()=>{ if(!logging){ setShowLogger(false); setMealsList([]); } }}>Cancel</button>
              </div>
              
              {/* Show added meals list */}
              {mealsList.length > 0 && (
                <div style={{marginTop:16,padding:12,background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#15803d',marginBottom:8}}>
                    Meals to log ({mealsList.length}):
                  </div>
                  {mealsList.map((meal, idx) => (
                    <div key={meal.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',background:'#fff',borderRadius:6,marginBottom:4}}>
                      <div style={{fontSize:13}}>
                        <strong>{meal.name}</strong> - {meal.serving_size}{meal.unit}
                        {meal.calories && <span style={{color:'#6b7280',marginLeft:8}}>{meal.calories} kcal</span>}
                      </div>
                      <button 
                        onClick={()=>setMealsList(mealsList.filter(m => m.id !== meal.id))}
                        style={{background:'#fee2e2',color:'#991b1b',border:'none',padding:'4px 8px',borderRadius:4,cursor:'pointer',fontSize:12}}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {logError && <div style={{color:'#991b1b',marginTop:8,fontSize:13}}>{logError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Expanded AI Plan Modal - Full screen overlay */}
      {showExpandedAIPlan && calorieData && (
        <div 
          style={{
            position:'fixed',
            top:0,
            left:0,
            right:0,
            bottom:0,
            background:'rgba(0,0,0,0.7)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            zIndex:9999,
            padding:20
          }}
          onClick={() => setShowExpandedAIPlan(false)}
        >
          <div 
            style={{
              background:'#fff',
              borderRadius:20,
              maxWidth:1200,
              maxHeight:'90vh',
              overflow:'auto',
              position:'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowExpandedAIPlan(false)}
              style={{
                position:'sticky',
                top:16,
                right:16,
                float:'right',
                width:36,
                height:36,
                borderRadius:'50%',
                border:'none',
                background:'#ef4444',
                color:'#fff',
                fontSize:20,
                cursor:'pointer',
                zIndex:10,
                boxShadow:'0 4px 12px rgba(239,68,68,0.4)'
              }}
            >
              ×
            </button>

            {/* Content - Full AI Calorie Plan */}
            <div style={{padding:32}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:24}}>
                <div>
                  <h2 style={{margin:0,color:'#667eea',fontSize:28}}>🤖 AI Daily Calorie Plan</h2>
                  <div style={{fontSize:15,color:'#6b7280',marginTop:6}}>
                    Scientifically calculated using Mifflin-St Jeor formula
                  </div>
                </div>
                <button
                  onClick={calculateCalories}
                  style={{
                    padding:'10px 18px',
                    fontSize:14,
                    background:'#667eea',
                    color:'#fff',
                    border:'none',
                    borderRadius:10,
                    cursor:'pointer',
                    fontWeight:600
                  }}
                  disabled={calorieLoading}
                >
                  {calorieLoading ? 'Calculating...' : '🔄 Refresh'}
                </button>
              </div>

              <div style={{fontSize:13,color:'#6b7280',marginBottom:24,textAlign:'center'}}>
                Calculated {new Date(calorieData.metadata.calculated_at).toLocaleString()} • 
                Activity: {calorieData.metadata.activity_level.replace('_', ' ')} • 
                Goal: {calorieData.metadata.health_goal.replace('_', ' ')}
              </div>

              {/* This would contain the full expanded content - you can copy the entire meal tracker section here */}
              <div style={{textAlign:'center',padding:40,color:'#6b7280'}}>
                <p>Full AI Calorie Plan with Meal-wise tracker would go here.</p>
                <p>You can copy the entire meal distribution section from the original code.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Barcode Loading Overlay */}
      {barcodeLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: 40,
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite'
              }}
            />
            <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>
              Looking up product...
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Barcode Error Notification */}
      {barcodeError && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px 24px',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 10002,
            fontSize: 15,
            fontWeight: 600,
            maxWidth: 400
          }}
        >
          {barcodeError}
        </div>
      )}

      {/* Food Confirmation Modal */}
      {scannedFoodData && (
        <FoodConfirmation
          foodData={scannedFoodData}
          onConfirm={handleBarcodeMealConfirm}
          onCancel={() => setScannedFoodData(null)}
        />
      )}
    </div>
    </>
  );
};

export default App;
