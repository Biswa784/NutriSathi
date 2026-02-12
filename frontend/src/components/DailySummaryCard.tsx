import React from 'react';

interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

interface DailySummaryCardProps {
  userName?: string;
  totalCaloriesToday: number;
  calorieTarget: number;
  macros: MacroData;
  mealsLogged: number;
  level?: number;
  currentXP?: number;
  xpToNextLevel?: number;
  onViewReport?: () => void;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  userName,
  totalCaloriesToday,
  calorieTarget,
  macros,
  mealsLogged,
  level,
  currentXP,
  xpToNextLevel,
  onViewReport
}) => {
  // Calculate time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate total calories from macros (approximation)
  const caloriesFromProtein = macros.protein * 4;
  const caloriesFromCarbs = macros.carbs * 4;
  const caloriesFromFat = macros.fat * 9;
  const totalMacroCalories = caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;
  
  // Calculate percentages based on calories (for display in legend)
  const proteinPercent = totalMacroCalories > 0 ? Math.round((caloriesFromProtein / totalMacroCalories) * 100) : 0;
  const carbsPercent = totalMacroCalories > 0 ? Math.round((caloriesFromCarbs / totalMacroCalories) * 100) : 0;
  const fatPercent = totalMacroCalories > 0 ? Math.round((caloriesFromFat / totalMacroCalories) * 100) : 0;
  const caloriesPercent = calorieTarget > 0 ? Math.round((totalCaloriesToday / calorieTarget) * 100) : 0;
  const saltPercent = 10; // Placeholder - you can wire this to actual data

  // Donut chart configuration
  const size = 280;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the actual arc sizes based on the percentages
  // The total circumference represents 100% of all nutrients combined
  const totalPercent = proteinPercent + carbsPercent + fatPercent + caloriesPercent + saltPercent;
  
  // Normalize to fit in the full circle (total should be 100%)
  const normalizePercent = (percent: number) => {
    return totalPercent > 0 ? (percent / totalPercent) * 100 : 0;
  };
  
  // Define segments with normalized arc sizes for the circle
  const segments = [
    { 
      name: 'Proteins', 
      percent: proteinPercent, 
      arcSize: normalizePercent(proteinPercent), 
      color: '#10b981', 
      grams: `${macros.protein}g` 
    },
    { 
      name: 'Macronutrient', 
      percent: carbsPercent, 
      arcSize: normalizePercent(carbsPercent), 
      color: '#f8b4b4', 
      grams: `${macros.carbs}g` 
    },
    { 
      name: 'Fat', 
      percent: fatPercent, 
      arcSize: normalizePercent(fatPercent), 
      color: '#fbbf24', 
      grams: `${macros.fat}g` 
    },
    { 
      name: 'Calories', 
      percent: caloriesPercent, 
      arcSize: normalizePercent(caloriesPercent), 
      color: '#93c5fd', 
      grams: '' 
    },
    { 
      name: 'Salt', 
      percent: saltPercent, 
      arcSize: normalizePercent(saltPercent), 
      color: '#c7d2fe', 
      grams: '' 
    }
  ];

  let cumulativePercent = 0;

  const createArc = (arcSize: number, color: string, offset: number) => {
    const strokeDasharray = `${(arcSize / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -offset * circumference / 100;
    
    return (
      <circle
        key={`${color}-${offset}`}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ 
          transition: 'all 0.8s ease-in-out',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      />
    );
  };

  // Get nutrition status message
  const getNutritionStatus = () => {
    return "Hey onwista is live laters to assist you personalize your lean-mag, healthy our, nutrition and volution.";
  };

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #f3e5f5 100%)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        marginBottom: '24px'
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '64px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left Side - Greeting and Info */}
        <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
          <h2 
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#2c3e50',
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px'
            }}
          >
            {getGreeting()}, {userName || 'Alex'}!
          </h2>
          
          <h3 
            style={{
              fontSize: '16px',
              fontWeight: '400',
              color: '#7f8c8d',
              margin: '0 0 24px 0'
            }}
          >
            Your daily health summary
          </h3>

          <p 
            style={{
              fontSize: '14px',
              color: '#95a5a6',
              lineHeight: '1.7',
              margin: '0 0 32px 0',
              maxWidth: '450px'
            }}
          >
            {getNutritionStatus()}
          </p>

          <button
            onClick={onViewReport}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              padding: '14px 32px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              textTransform: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            Get started
          </button>
        </div>

        {/* Right Side - Chart and Legend in White Card */}
        <div 
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            flex: '1 1 500px',
            minWidth: '300px'
          }}
        >
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '48px'
            }}
          >
            {/* Donut Chart */}
            <div style={{ position: 'relative' }}>
              <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#f0f0f0"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                
                {/* Segments */}
                {segments.map((segment, index) => {
                  const arc = createArc(
                    segment.arcSize,
                    segment.color,
                    cumulativePercent
                  );
                  cumulativePercent += segment.arcSize;
                  return arc;
                })}
              </svg>
              
              {/* Center Text */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <div 
                  style={{
                    fontSize: '14px',
                    color: '#95a5a6',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}
                >
                  Calories:
                </div>
                <div 
                  style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: '#2c3e50',
                    lineHeight: '1',
                    marginBottom: '8px'
                  }}
                >
                  {totalCaloriesToday.toLocaleString()}
                </div>
                <div 
                  style={{
                    fontSize: '16px',
                    color: '#95a5a6',
                    fontWeight: '400'
                  }}
                >
                  / {calorieTarget.toLocaleString()} kcal
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {segments.map((segment) => (
                <div
                  key={segment.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '150px'
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: segment.color,
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div 
                      style={{
                        fontSize: '14px',
                        color: '#2c3e50',
                        marginBottom: '2px'
                      }}
                    >
                      {segment.name}
                    </div>
                  </div>
                  <div 
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#7f8c8d',
                      minWidth: '45px',
                      textAlign: 'right'
                    }}
                  >
                    {segment.percent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryCard;
