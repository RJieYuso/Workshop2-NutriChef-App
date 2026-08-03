
import requests
import json

URL = "http://localhost:5002/api/ai/recommend"

payload = {
    "ingredients": ["chicken breast"],
    "health_conditions": [],
    "dietary_restrictions": [],
    "allergies": [],
    "top_n": 1
}

print(f"🚀 Sending request to {URL}...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(URL, json=payload)
    
    print(f"\nResponse Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        recipes = data.get('recommendations', [])
        print(f"Received {len(recipes)} recipes.\n")
        
        for i, recipe in enumerate(recipes):
            print(f"Recipe {i+1}: {recipe.get('recipe_name')}")
            print(f"Ingredients: {recipe.get('ingredients')}")
            print(f"Missing Ingredients List (Backend Calculated): {recipe.get('missing_ingredients')}")
            print(f"Missing Count: {recipe.get('missing_ingredients_count')}")
            
            # Local Check Logic Replication
            recipe_ings = recipe.get('ingredients', [])
            missing_backend = recipe.get('missing_ingredients', [])
            
            for ing in recipe_ings:
                # Check if this ingredient matches any in the missing list
                is_missing_backend_check = False
                for missing_item in missing_backend:
                    if missing_item.lower() in ing.lower():
                        is_missing_backend_check = True
                        break
                
                print(f"  - '{ing}' -> Backend says missing? {is_missing_backend_check}")
            
            print("-" * 40)
            
    else:
        print("Error:", response.text)

except Exception as e:
    print(f"Request failed: {e}")
