import sys
sys.path.insert(0, '.')

try:
    print("1. Importing modules...")
    from app.main import dishes_db, mood_recommender
    
    print(f"2. Dishes loaded: {len(dishes_db)}")
    print(f"3. MoodRecommender type: {type(mood_recommender)}")
    
    print("4. Testing recommend_by_mood...")
    result = mood_recommender.recommend_by_mood('happy')
    
    print(f"✓ Success! Got {len(result['recommended_dishes'])} recommendations")
    print(f"✓ Mood: {result['mood']}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
