"""Quick test script for authentication endpoints"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_auth_flow():
    print("🧪 Testing NutriSathi Authentication Flow\n")
    
    # Test 1: Health check
    print("1️⃣ Testing health endpoint...")
    r = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {r.status_code} - {r.json()}\n")
    
    # Test 2: Signup
    print("2️⃣ Testing signup...")
    signup_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        auth_response = r.json()
        print(f"   Token: {auth_response['token'][:20]}...")
        print(f"   User: {auth_response['user']['name']} ({auth_response['user']['email']})\n")
        token = auth_response['token']
    else:
        print(f"   Error: {r.text}\n")
        return
    
    # Test 3: Login
    print("3️⃣ Testing login...")
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Login successful!\n")
    else:
        print(f"   Error: {r.text}\n")
    
    # Test 4: Get current user
    print("4️⃣ Testing /auth/me...")
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        print(f"   User: {user['name']} ({user['email']})\n")
    else:
        print(f"   Error: {r.text}\n")
    
    # Test 5: Log a meal (authenticated)
    print("5️⃣ Testing meal logging (authenticated)...")
    meal_data = {
        "name": "Breakfast Bowl",
        "serving_size": 200,
        "unit": "g",
        "calories": 350,
        "protein": 15,
        "carbs": 45,
        "fat": 12
    }
    r = requests.post(f"{BASE_URL}/meals", json=meal_data, headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        meal = r.json()
        print(f"   Logged: {meal['name']} - {meal['calories']} kcal\n")
    else:
        print(f"   Error: {r.text}\n")
    
    # Test 6: Get meals (authenticated)
    print("6️⃣ Testing get meals (should see only user's meals)...")
    r = requests.get(f"{BASE_URL}/meals", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        meals = r.json()
        print(f"   Found {len(meals)} meal(s)")
        for meal in meals:
            print(f"   - {meal['name']} ({meal.get('user_email', 'N/A')})\n")
    else:
        print(f"   Error: {r.text}\n")
    
    # Test 7: Logout
    print("7️⃣ Testing logout...")
    r = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Logged out successfully!\n")
    else:
        print(f"   Error: {r.text}\n")
    
    # Test 8: Try to access with invalid token
    print("8️⃣ Testing access after logout (should fail)...")
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 401:
        print(f"   ✅ Correctly rejected invalid token\n")
    else:
        print(f"   Response: {r.text}\n")
    
    print("✅ Authentication flow test completed!")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend. Is it running on http://127.0.0.1:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")
