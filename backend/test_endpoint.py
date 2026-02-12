import requests
import json

url = "http://localhost:8000/ai/recommend-mood"
payload = {
    "mood": "happy",
    "num_recommendations": 4
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    if response.ok:
        print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
