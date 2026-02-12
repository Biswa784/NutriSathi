from app.services.mood_recommender import MoodRecommender
import csv
from pathlib import Path

# Load dishes
dishes = []
csv_path = Path('..') / 'data' / 'dishes.csv'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('name'):
            dishes.append({
                "name": row['name'],
                "cuisine": row.get('cuisine', ''),
                "serving_size": float(row.get('serving_g', 100)),
                "unit": "g",
                "calories": float(row.get('calories_kcal', 0)),
                "protein": float(row.get('protein_g', 0)),
                "carbs": float(row.get('carbs_g', 0)),
                "fat": float(row.get('fat_g', 0))
            })

print(f"Loaded {len(dishes)} dishes")

# Test MoodRecommender
try:
    mr = MoodRecommender(dishes)
    print("✓ MoodRecommender initialized")
    
    result = mr.recommend_by_mood('happy')
    print(f"✓ Got {len(result['recommended_dishes'])} recommendations")
    print(f"✓ Mood: {result['mood']}")
    print(f"✓ Description: {result['mood_description']}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
