import React, { useState } from 'react';

interface CalorieWarning {
  alert: boolean;
  severity: 'high' | 'medium' | 'low';
  message: string;
  meal_type: string;
  meal_calories: number;
  meal_target: number;
  excess_calories: number;
  daily_summary: {
    daily_target: number;
    total_consumed: number;
    remaining: number;
    percentage_consumed: number;
  };
  suggestion: {
    next_meal_type: string;
    next_meal_target: number;
    question: string;
    recommendations: string[];
  };
}

interface CalorieAlertProps {
  warning: CalorieWarning;
  onDismiss?: () => void;
}

export default function CalorieAlert({ warning, onDismiss }: CalorieAlertProps) {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const severityColors = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      button: 'bg-red-100 hover:bg-red-200 text-red-700'
    },
    medium: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: 'text-orange-500',
      button: 'bg-orange-100 hover:bg-orange-200 text-orange-700'
    },
    low: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
      button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
    }
  };

  const colors = severityColors[warning.severity];
  const { daily_summary, suggestion } = warning;

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 mb-6 shadow-lg animate-slideDown`}>
      {/* Header with Warning Icon */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`${colors.icon} text-3xl flex-shrink-0`}>
          ⚠️
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
            Calorie Alert
          </h3>
          <p className={`text-lg ${colors.text} font-medium`}>
            {warning.message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className={`${colors.text} hover:opacity-70 text-2xl leading-none`}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      </div>

      {/* Meal Details */}
      <div className={`${colors.bg} rounded-lg p-4 mb-4 border ${colors.border}`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm opacity-70">Your {warning.meal_type}</p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {warning.meal_calories}
            </p>
            <p className="text-xs opacity-70">kcal</p>
          </div>
          <div>
            <p className="text-sm opacity-70">Target</p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {warning.meal_target}
            </p>
            <p className="text-xs opacity-70">kcal</p>
          </div>
          <div>
            <p className="text-sm opacity-70">Exceeded by</p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              +{warning.excess_calories}
            </p>
            <p className="text-xs opacity-70">kcal</p>
          </div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className={colors.text}>Daily Progress</span>
          <span className={`font-bold ${colors.text}`}>
            {daily_summary.total_consumed} / {daily_summary.daily_target} kcal
            ({daily_summary.percentage_consumed}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              daily_summary.percentage_consumed > 100
                ? 'bg-red-500'
                : daily_summary.percentage_consumed > 80
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{
              width: `${Math.min(daily_summary.percentage_consumed, 100)}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-70">
          <span>Remaining: {daily_summary.remaining} kcal</span>
          {daily_summary.remaining < 0 && (
            <span className="text-red-600 font-bold">
              Over target!
            </span>
          )}
        </div>
      </div>

      {/* Recommendation Section */}
      <div className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}>
        <p className={`font-medium ${colors.text} mb-3`}>
          {suggestion.question}
        </p>
        
        {!showRecommendations ? (
          <button
            onClick={() => setShowRecommendations(true)}
            className={`${colors.button} px-6 py-2 rounded-lg font-medium transition-all`}
          >
            Yes, show me lighter options
          </button>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm font-medium ${colors.text}`}>
              Lighter {suggestion.next_meal_type} options (~{suggestion.next_meal_target} kcal target):
            </p>
            <ul className="space-y-2">
              {suggestion.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-2 ${colors.text} text-sm`}
                >
                  <span className="text-green-500 font-bold">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowRecommendations(false)}
              className="text-sm underline opacity-70 hover:opacity-100"
            >
              Hide recommendations
            </button>
          </div>
        )}
      </div>

      {/* Additional Tips */}
      <div className="mt-4 text-sm opacity-70">
        <p className="flex items-center gap-2">
          <span>💡</span>
          <span>
            Tip: Consider going for a 15-minute walk to help balance your calorie intake!
          </span>
        </p>
      </div>
    </div>
  );
}
