# 📊 Dynamic Calorie Tracking Feature - Complete Guide

## ✅ Feature Overview

Your NutriSathi app now has a **fully functional dynamic calorie tracking system** that:

1. **Tracks consumed calories** per meal type (Breakfast, Lunch, Evening Snack, Dinner)
2. **Shows progress bars** that update in real-time when you log meals
3. **Color-codes progress** based on consumption percentage
4. **Displays remaining calories** for each meal and overall daily target
5. **Warns when over budget** with red indicators

---

## 🎯 How It Works

### 1. **State Management** (React State)

Located in `frontend/src/App.tsx`:

```typescript
// Tracks calories consumed for each meal type
const [consumedCalories, setConsumedCalories] = useState<{
  breakfast: number;
  lunch: number;
  evening_snack: number;
  dinner: number;
}>({ breakfast: 0, lunch: 0, evening_snack: 0, dinner: 0 });
```

### 2. **Automatic Calculation** (useEffect Hook)

The system automatically calculates consumed calories from today's logged meals:

```typescript
useEffect(() => {
  // Filters meals to today only
  const today = new Date().toDateString();
  const todaysMeals = meals.filter(meal => {
    const mealDate = new Date(meal.timestamp).toDateString();
    return mealDate === today;
  });

  // Sums calories by meal type
  const consumed = { breakfast: 0, lunch: 0, evening_snack: 0, dinner: 0 };
  
  todaysMeals.forEach(meal => {
    const calories = meal.calories || 0;
    const mealType = meal.meal_type?.toLowerCase();
    
    // Maps meal types to categories
    if (mealType === 'breakfast') consumed.breakfast += calories;
    else if (mealType === 'lunch') consumed.lunch += calories;
    else if (mealType === 'evening snack' || mealType === 'snack') consumed.evening_snack += calories;
    else if (mealType === 'dinner') consumed.dinner += calories;
  });

  setConsumedCalories(consumed);
}, [meals]); // Recalculates whenever meals change
```

### 3. **Progress Bar Logic**

Each meal has a progress bar that shows:

```typescript
const target = calorieData.meal_calories.breakfast; // Target calories
const consumed = consumedCalories.breakfast;         // Calories eaten
const remaining = Math.max(0, target - consumed);    // Calories left
const percentage = Math.min(100, (consumed / target) * 100); // Progress %
const isOver = consumed > target;                    // Over budget?
```

### 4. **Color Coding System**

Progress bars change color based on consumption:

- **🟢 Green (0-50%)**: Plenty of calories remaining
- **🟡 Yellow/Orange (50-80%)**: Getting close to target
- **🔴 Red (80-100%)**: Almost at target
- **⚫ Dark Red (>100%)**: Over budget!

```typescript
const barColor = percentage < 50 ? '#10b981'   // Green
               : percentage < 80 ? '#f59e0b'   // Orange
               : percentage < 100 ? '#ef4444'  // Red
               : '#991b1b';                    // Dark red
```

---

## 🎨 UI Components

### Individual Meal Progress Bars

Each meal type has:
- **Emoji indicator** (🌅 Breakfast, ☀️ Lunch, 🍵 Snack, 🌙 Dinner)
- **Meal name** with percentage badge
- **Consumed/Target display** (e.g., "450 / 742 kcal")
- **Animated progress bar** (smooth transition on update)
- **Status message**: 
  - Green: "✓ 292 kcal remaining"
  - Red: "⚠️ Over by 50 kcal"

### Overall Daily Progress

A special summary bar shows:
- **Total consumed vs. target** (e.g., "1,800 / 2,968 kcal (61%)")
- **Gradient progress bar** (color changes based on progress)
- **Daily remaining message**: "1,168 kcal remaining for today"

---

## 🔄 Real-Time Updates

### When You Log a Meal:

1. **User logs meal** via "Log Meal" button
2. **Meal saved to backend** (`POST /meals`)
3. **Frontend updates meals array** (`setMeals(prev => [created, ...prev])`)
4. **useEffect detects change** (dependency: `[meals]`)
5. **Consumed calories recalculated** automatically
6. **Progress bars update** with smooth animation (CSS transition: `0.3s ease`)
7. **Colors adjust** based on new percentage

### Example Flow:

```
Log: Poha (300 kcal) for Breakfast
↓
Breakfast: 0 → 300 kcal consumed
↓
Progress bar: 0% → 40% (green)
↓
Message: "742 kcal remaining" → "442 kcal remaining"
```

---

## 🧮 Integration with AI Calorie Calculator

The system uses data from your **AI Calorie Calculator**:

### Required Data Structure:

```typescript
calorieData = {
  daily_calories: 2968,           // Total daily target
  meal_calories: {
    breakfast: 742,                // 25% of daily
    lunch: 1039,                   // 35% of daily  
    evening_snack: 297,            // 10% of daily
    dinner: 890                    // 30% of daily
  },
  meal_split_percentages: {
    breakfast: 25,
    lunch: 35,
    evening_snack: 10,
    dinner: 30
  }
}
```

This data is fetched from `POST /ai/calculate-calories` and stored in `calorieData` state.

---

## 🎯 Meal Type Mapping

The system handles different meal type formats:

| Meal Type in DB | Mapped To         |
|-----------------|-------------------|
| "Breakfast"     | breakfast         |
| "Lunch"         | lunch             |
| "Evening Snack" | evening_snack     |
| "Snack"         | evening_snack     |
| "Dinner"        | dinner            |

**Case insensitive**: "BREAKFAST" = "breakfast" = "Breakfast"

---

## 📱 User Experience

### Visual Feedback:

1. **Border color changes**: 
   - Normal: Original color (orange/blue/green/purple)
   - Over budget: Red border (#dc2626)

2. **Text color changes**:
   - Normal: Meal-specific color
   - Over budget: Red (#dc2626)

3. **Progress bar fills**:
   - Smooth animation (0.3s)
   - Color gradient shows health of consumption

4. **Icons and badges**:
   - Percentage badge shows meal split
   - Emoji helps identify meal type quickly

### Example States:

**Breakfast (Normal):**
```
🌅 Breakfast [25%]                    300 / 742 kcal
[████████░░░░░░░░░░░░░░░░░░░] 40%
✓ 442 kcal remaining
```

**Breakfast (Over):**
```
🌅 Breakfast [25%]                    800 / 742 kcal
[████████████████████████████] 108%
⚠️ Over by 58 kcal
```

---

## 🛠️ Technical Implementation Details

### File Structure:

```
frontend/src/App.tsx
├── State (lines 107-112)
│   └── consumedCalories state
├── Logic (lines 261-300)
│   └── useEffect for calculation
└── UI (lines 1019-1195)
    ├── Breakfast progress bar
    ├── Lunch progress bar
    ├── Evening Snack progress bar
    ├── Dinner progress bar
    └── Overall daily progress
```

### Performance:

- **useMemo** for totals calculation (prevents re-render)
- **useEffect** with `[meals]` dependency (only runs when meals change)
- **CSS transitions** for smooth animations (no JavaScript animation)

### Data Flow:

```
Meals Array (from API)
    ↓
useEffect (filter today's meals)
    ↓
Calculate per-meal-type totals
    ↓
setConsumedCalories(...)
    ↓
Re-render progress bars
    ↓
User sees updated UI
```

---

## 🚀 How to Use

### For Users:

1. **Complete your profile** with weight, height, age, gender
2. **View your AI calorie plan** on the dashboard
3. **Log meals** using the "Log Meal" button
4. **Select correct meal type** (Breakfast/Lunch/Evening Snack/Dinner)
5. **Watch progress bars update** automatically!

### For Developers:

**To customize meal splits:**
- Edit `backend/app/services/calorie_calculator.py`
- Modify `GOAL_BASED_MEAL_SPLITS` dictionary

**To change color thresholds:**
- Edit the `barColor` calculation in each progress bar
- Current: 50%, 80%, 100%

**To add new meal types:**
1. Update `consumedCalories` state to include new type
2. Add mapping in `useEffect` calculation
3. Add new progress bar UI component
4. Update backend meal type validation

---

## ✨ Key Features

### ✅ What's Already Implemented:

1. ✅ **State management** for consumed calories per meal
2. ✅ **Automatic calculation** from logged meals  
3. ✅ **Progress bars** for each meal type
4. ✅ **Color-coded visual feedback** (green → yellow → red)
5. ✅ **Remaining calorie display** with messages
6. ✅ **Over-budget warnings** in red
7. ✅ **Overall daily progress** summary bar
8. ✅ **Real-time updates** when logging meals
9. ✅ **Smooth animations** (CSS transitions)
10. ✅ **Today-only filtering** (resets at midnight)

### 🎁 Bonus Features Included:

- **Gradient progress bars** for overall progress
- **Emoji indicators** for quick meal identification
- **Percentage badges** showing meal split
- **Responsive design** (works on mobile)
- **Accessibility** (color + text indicators)

---

## 🐛 Edge Cases Handled

1. **No meals logged**: Shows 0/target with green bar at 0%
2. **Over budget**: Shows red warning with exact overage
3. **Exactly at target**: Shows 100% with success message
4. **Previous days**: Only today's meals count
5. **Invalid meal types**: Ignored (no crash)
6. **Missing calorie data**: Treated as 0 calories
7. **Decimal calories**: Handled correctly (no rounding errors)

---

## 📊 Example Scenarios

### Scenario 1: Weight Loss Day

**Target**: 2,468 kcal (500 deficit)
**Consumed**: 1,850 kcal

```
Breakfast:  600 / 617 kcal  [███████████████████████████░] 97%
Lunch:      700 / 864 kcal  [████████████████████░░░░░░░] 81%  
Snack:       50 / 247 kcal  [████░░░░░░░░░░░░░░░░░░░░░░░] 20%
Dinner:     500 / 741 kcal  [█████████████████░░░░░░░░░░] 67%

Daily: 1,850 / 2,468 kcal (75%) - ✓ 618 kcal remaining
```

### Scenario 2: Cheat Day (Over Budget)

**Target**: 2,968 kcal
**Consumed**: 3,200 kcal

```
Breakfast:  900 / 742 kcal  [████████████████████████████] 121% ⚠️
Lunch:    1,100 / 1,039 kcal [████████████████████████████] 106% ⚠️
Snack:      300 / 297 kcal  [████████████████████████████] 101% ⚠️
Dinner:     900 / 890 kcal  [████████████████████████████] 101% ⚠️

Daily: 3,200 / 2,968 kcal (108%) - ⚠️ 232 kcal over daily target
```

---

## 🔧 Troubleshooting

### Progress bars not updating?

**Check:**
1. Meal type is correct ("Breakfast", "Lunch", "Evening Snack", "Dinner")
2. Meal has calorie data (not 0 or null)
3. Meal timestamp is today
4. Browser console for errors

### Colors not changing?

**Check:**
1. `calorieData` is loaded (AI calculator ran)
2. `consumedCalories` state is updating
3. CSS transitions are supported

### Wrong totals?

**Check:**
1. Meal type case sensitivity
2. Multiple meals logged (should sum up)
3. Old meals from yesterday (should be filtered out)

---

## 🎓 Learning Resources

### Technologies Used:

- **React Hooks**: `useState`, `useEffect`, `useMemo`
- **TypeScript**: Type-safe state management
- **CSS**: Inline styles with dynamic values
- **Date handling**: `new Date().toDateString()`

### Concepts Demonstrated:

1. **Reactive programming**: UI updates automatically
2. **Derived state**: Consumed calories calculated from meals
3. **Component composition**: Reusable progress bar pattern
4. **Performance optimization**: useMemo, useEffect dependencies
5. **User feedback**: Visual indicators, color coding, messages

---

## 📈 Future Enhancements (Optional)

### Potential Additions:

1. **Macro tracking per meal** (protein/carbs/fat bars)
2. **Historical view** (see past days' consumption)
3. **Meal planning** (suggest meals to hit targets)
4. **Notifications** (alerts when close to/over budget)
5. **Charts** (line graph of daily consumption over time)
6. **Streaks** (days staying within budget)
7. **Export data** (CSV/PDF report)
8. **Meal templates** (quick log common meals)

### Easy Modifications:

**Change color thresholds:**
```typescript
// Currently: 50%, 80%, 100%
// Change to: 60%, 90%, 100%
const barColor = percentage < 60 ? '#10b981' : ...
```

**Change meal splits:**
```python
# backend/app/services/calorie_calculator.py
GOAL_BASED_MEAL_SPLITS = {
    'weight_loss': {
        'breakfast': 0.30,  # Change from 0.25
        'lunch': 0.35,
        'evening_snack': 0.05,  # Change from 0.10
        'dinner': 0.30
    }
}
```

---

## 🎉 Summary

Your dynamic calorie tracking feature is **fully implemented and working**! 

### What happens when you log a meal:

1. ✅ Meal saved to database
2. ✅ Frontend updates immediately
3. ✅ Consumed calories recalculated
4. ✅ Progress bars animate smoothly
5. ✅ Colors update based on progress
6. ✅ Messages show remaining/over calories
7. ✅ Overall daily progress updates

### No additional setup needed - just:

1. Complete your profile
2. Generate your AI calorie plan
3. Start logging meals
4. Watch the magic happen! 🪄

---

**Questions or issues?** The feature is production-ready and fully functional!
