import React, { useState } from 'react';

interface FoodData {
  name: string;
  brand?: string;
  serving_size?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  barcode: string;
}

interface FoodConfirmationProps {
  foodData: FoodData;
  onConfirm: (mealType: string, servings: number) => void;
  onCancel: () => void;
}

const FoodConfirmation: React.FC<FoodConfirmationProps> = ({ foodData, onConfirm, onCancel }) => {
  const [mealType, setMealType] = useState<string>('breakfast');
  const [servings, setServings] = useState<number>(1);

  const handleConfirm = () => {
    onConfirm(mealType, servings);
  };

  const totalCalories = (foodData.calories || 0) * servings;
  const totalProtein = (foodData.protein || 0) * servings;
  const totalCarbs = (foodData.carbs || 0) * servings;
  const totalFat = (foodData.fat || 0) * servings;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          maxWidth: 500,
          width: '100%',
          padding: 28,
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#667eea', flex: 1 }}>
              {foodData.name}
            </h2>
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 28,
                cursor: 'pointer',
                color: '#6b7280',
                padding: 0,
                marginLeft: 12
              }}
            >
              ×
            </button>
          </div>
          {foodData.brand && (
            <div style={{ fontSize: 15, color: '#6b7280', fontWeight: 500 }}>
              {foodData.brand}
            </div>
          )}
          {foodData.serving_size && (
            <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>
              Serving size: {foodData.serving_size}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#d1d5db', marginTop: 4, fontFamily: 'monospace' }}>
            Barcode: {foodData.barcode}
          </div>
        </div>

        {/* Nutrition Info */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
                {Math.round(totalCalories)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                Calories
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
                {totalProtein.toFixed(1)}g
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                Protein
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
                {totalCarbs.toFixed(1)}g
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                Carbs
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
                {totalFat.toFixed(1)}g
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                Fat
              </div>
            </div>
          </div>
        </div>

        {/* Meal Type Selection */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 10
            }}
          >
            Meal Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                style={{
                  padding: '12px 16px',
                  background:
                    mealType === type
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#f3f4f6',
                  color: mealType === type ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Servings */}
        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 10
            }}
          >
            Number of Servings
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setServings(Math.max(0.5, servings - 0.5))}
              style={{
                width: 44,
                height: 44,
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 10,
                fontSize: 22,
                fontWeight: 600,
                color: '#667eea',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              −
            </button>
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#667eea'
              }}
            >
              {servings}
            </div>
            <button
              onClick={() => setServings(servings + 0.5)}
              style={{
                width: 44,
                height: 44,
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 10,
                fontSize: 22,
                fontWeight: 600,
                color: '#667eea',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            Log This Meal
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodConfirmation;
