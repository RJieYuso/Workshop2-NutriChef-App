# Project Code Appendix

This appendix contains the key source code modules for the NutriChef application, including both Backend (Python/Flask) and Frontend (React Native) components.

## Table of Contents
1. [Backend - DeepSeek Recommender](#backend---deepseek-recommender)
2. [Backend - Food Freshness Service](#backend---food-freshness-service)
3. [Backend - API Server](#backend---api-server)
4. [Frontend - Recipe Screen](#frontend---recipe-screen)
5. [Frontend - Scan Food Screen](#frontend---scan-food-screen)

---

## Backend Modules

### Backend - DeepSeek Recommender
**File:** `backend/api/deepseek_recommender.py`
**Description:** Handles interaction with the DeepSeek API for recipe generation, including prompt engineering, JSON parsing, and fallback logic.

```python
import re
from typing import List, Dict, Optional
import time
import base64
import requests
import json

class DeepSeekRecipeRecommender:
    def __init__(self, api_key: str = None):
        """Initialize DeepSeek AI with your API key"""
        # Use your actual DeepSeek API key
        self.api_key = api_key or "sk-8f10377379364c449cc16ffa318e1e39"
        self.base_url = "https://api.deepseek.com/v1/chat/completions"
        
        print(f"🔑 Using DeepSeek API key: {self.api_key[:15]}...")
        
        if not self.api_key or self.api_key == "YOUR_DEEPSEEK_API_KEY_HERE":
            raise ValueError("Please set your DeepSeek API key")
        
        # Test API connection
        if self._test_api_connection():
            print("✅ DeepSeek API connected successfully!")
            self.api_available = True
        else:
            print("⚠️ DeepSeek API check failed, but enabling AI for retry attempts")
            self.api_available = True
    
    def _test_api_connection(self) -> bool:
        """Test if DeepSeek API is accessible with better timeout"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            test_payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "user", "content": "Say 'Hello' in one word."}
                ],
                "max_tokens": 10,
                "temperature": 0.1
            }
            
            print("🔄 Testing DeepSeek API connection...")
            response = requests.post(
                self.base_url, 
                headers=headers, 
                json=test_payload,
                timeout=80  # Increased timeout for connection test
            )
            
            print(f"📊 Connection test status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ DeepSeek API connection successful!")
                return True
            else:
                print(f"❌ DeepSeek API returned status {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            print("❌ DeepSeek API timeout - but this might be temporary")
            # Return True anyway, as the API might just be slow
            return True
        except Exception as e:
            print(f"❌ DeepSeek API test failed: {e}")
            return False
    
    def recommend_recipes(self, 
                         available_ingredients: List[str], 
                         dietary_restrictions: Optional[List[str]] = None,
                         allergies: Optional[List[str]] = None,
                         health_conditions: Optional[List[str]] = None,
                         calorie_target: Optional[int] = None,
                         meal_type: Optional[str] = None,
                         top_n: int = 3,
                         servings: str = "2") -> List[Dict]:
        """
        Get AI-powered recipe recommendations from DeepSeek with complete user data
        """
        
        if dietary_restrictions is None:
            dietary_restrictions = []
        if allergies is None:
            allergies = []
        if health_conditions is None:
            health_conditions = []
            
        print(f"DeepSeek AI Request:")
        print(f"   Ingredients: {available_ingredients}")
        print(f"   Dietary: {dietary_restrictions}")
        print(f"   Allergies: {allergies}")
        print(f"   Health: {health_conditions}")
        print(f"   Calories: {calorie_target}")
        print(f"   Meal Type: {meal_type}")
        print(f"   Servings: {servings}")
        
        # Try to use real DeepSeek AI
        if self.api_available:
            try:
                recipes = self._get_deepseek_recipes(
                    available_ingredients, 
                    dietary_restrictions,
                    allergies,
                    health_conditions,
                    calorie_target,
                    meal_type,
                    top_n,
                    servings
                )
            except Exception as e:
                print(f"DeepSeek API error: {e}")
                # Fallback to smart recipes - DISABLED AS PER USER REQUEST
                print("❌ DeepSeek API Failed. Smart fallback is DISABLED.")
                recipes = []
        else:
            # Smart fallback is disabled
            print("❌ API Not Available and Smart Fallback is DISABLED.")
            recipes = []
        
        # Calculate missing ingredients for each recipe and add metadata
        print(f"Calculating missing ingredients for {len(recipes)} recipes...")
        for recipe in recipes:
            missing_list, missing_count = self._calculate_missing_ingredients(recipe, available_ingredients)
            recipe['missing_ingredients'] = missing_list
            recipe['missing_ingredients_count'] = missing_count
            
            # LOG SOURCE for User
            source = recipe.get('source', 'Unknown')
            print(f"   - {recipe.get('recipe_name', 'Unknown')}: {missing_count} missing ingredients | SOURCE: {source}")
        
        # Sort recipes by missing ingredients count (ascending - fewer missing items first)
        recipes.sort(key=lambda r: r.get('missing_ingredients_count', 999))
        print(f"Recipes sorted by missing ingredients count")
        
        # DEBUG LOGGING TO FILE
        try:
            with open('debug_log.txt', 'w', encoding='utf-8') as f:
                f.write(f"Timestamp: {time.time()}\n")
                f.write(f"Available Ingredients: {available_ingredients}\n")
                f.write(f"Normalized Available: {[ing.lower().strip() for ing in available_ingredients]}\n")
                for r in recipes:
                    f.write(f"\nRecipe: {r.get('recipe_name')}\n")
                    f.write(f"Original Ingredients: {r.get('ingredients')}\n")
                    f.write(f"Calculated Missing: {r.get('missing_ingredients')}\n")
        except Exception as e:
            print(f"Failed to write debug log: {e}")

        return recipes

    
    def _calculate_missing_ingredients(self, recipe: Dict, available_ingredients: List[str]) -> tuple:
        """Calculate missing ingredients for a recipe"""
        recipe_ingredients = recipe.get('ingredients', [])
        missing = []
        
        # Normalize available ingredients to lowercase for comparison
        available_lower = [ing.lower().strip() for ing in available_ingredients]
        
        # Basic pantry staples that we don't count as "missing"
        pantry_staples = ['salt', 'pepper', 'oil', 'water', 'olive oil', 'vegetable oil', 
                         'black pepper', 'sea salt', 'cooking oil', 'sugar']
        
        for ingredient_str in recipe_ingredients:
            # Check if ingredient is marked with asterisk (AI marks missing ingredients)
            if '*' in ingredient_str:
                # Extract ingredient name (remove asterisk and quantity)
                ingredient_name = ingredient_str.replace('*', '').strip()
                # Remove quantity (e.g., "2 cups", "1 tbsp")
                parts = ingredient_name.split()
                if len(parts) > 1:
                    # Try to find the actual ingredient name (skip numbers and measurements)
                    common_units = ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'of', 
                                  'inch', 'cm', 'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
                                  'pinch', 'dash', 'handful', 'sprig', 'can', 'bottle', 'package', 'pack',
                                  'bunch', 'head', 'stick', 'stalk']
                    ingredient_name = ' '.join([p for p in parts if not p[0].isdigit() and 
                                                p.lower() not in common_units])
                
                ingredient_lower = ingredient_name.lower().strip()
                
                # VERIFY: Even if AI marked it missing, check if we actually have it
                # (AI sometimes hallucinates or misses items in the prompt)
                is_actually_available = False
                for avail in available_lower:
                    if avail in ingredient_lower or ingredient_lower in avail:
                        is_actually_available = True
                        break
                
                # Don't count pantry staples as missing AND check if we actually have it
                if not is_actually_available and ingredient_lower not in pantry_staples:
                    missing.append(ingredient_name)
            else:
                # Parse ingredient string to extract ingredient name
                ingredient_str_clean = ingredient_str.strip()
                parts = ingredient_str_clean.split()
                
                if len(parts) > 1:
                    # Skip quantity and measurement units to get ingredient name
                    common_units = ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'of', 
                                  'inch', 'cm', 'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
                                  'pinch', 'dash', 'handful', 'sprig', 'can', 'bottle', 'package', 'pack',
                                  'bunch', 'head', 'stick', 'stalk']
                    ingredient_name = ' '.join([p for p in parts if not p[0].isdigit() and 
                                                p.lower() not in common_units])
                else:
                    ingredient_name = ingredient_str_clean
                
                ingredient_lower = ingredient_name.lower().strip().rstrip(',')
                
                # Check if ingredient is available
                is_available = False
                for avail in available_lower:
                    if avail in ingredient_lower or ingredient_lower in avail:
                        is_available = True
                        break
                
                # If not available and not a pantry staple, mark as missing
                if not is_available and ingredient_lower not in pantry_staples:
                    missing.append(ingredient_name)
        
        return missing, len(missing)

    
    def _get_deepseek_recipes(self, 
                             ingredients: List[str], 
                             dietary_restrictions: List[str],
                             allergies: List[str],
                             health_conditions: List[str],
                             calorie_target: Optional[int],
                             meal_type: Optional[str],
                             top_n: int,
                             servings: str) -> List[Dict]:
        """Get recipes from DeepSeek AI with retry logic and complete user data"""
        
        print(f"\n🤖 CALLING DEEPSEEK API...")
        print(f"   Ingredients: {ingredients}")
        print(f"   Meal Type: {meal_type}")
        print(f"   Servings: {servings}")
        print(f"   Timeout: 80s")
        
        # Build minimal prompt for speed
        prompt_parts = []
        prompt_parts.append(f"Create exactly {top_n} {meal_type or ''} recipes using: {', '.join(ingredients)}.")
        
        # Requirements
        prompt_parts.append(f"REQUIREMENTS: The recipe MUST specify ingredient quantities suitable for {servings} people.")
        
        # Ingredients section
        prompt_parts.append(f"\nAVAILABLE INGREDIENTS: {', '.join(ingredients)}")
        
        # Dietary restrictions
        if dietary_restrictions:
            prompt_parts.append(f"DIETARY RESTRICTIONS: {', '.join(dietary_restrictions)}")
            # STRICT INSTRUCTION FOR DIETARY RESTRICTIONS
            prompt_parts.append("CRITICAL: Dietary restrictions take PRECEDENCE over available ingredients.")
            prompt_parts.append("   - If user is Vegetarian/Vegan, DO NOT use meat/fish even if they are in the available ingredients list.")
            prompt_parts.append("   - If ingredients conflict with diet, IGNORE the conflicting ingredient.")
        
        # Allergies (MUST AVOID)
        if allergies:
            prompt_parts.append(f"ALLERGIES TO AVOID: {', '.join(allergies)} - DO NOT USE THESE INGREDIENTS")
        
        # Health conditions
        if health_conditions:
            prompt_parts.append(f"HEALTH CONDITIONS: {', '.join(health_conditions)}")
            # Strict instruction for health conditions too if they imply dietary restrictions
            prompt_parts.append("CRITICAL: Health conditions take PRECEDENCE over available ingredients.")

        # Calorie target
        if calorie_target:
            prompt_parts.append(f"CALORIE TARGET: Aim for around {calorie_target} calories per recipe")
        
        # Recipe requirements
        prompt_parts.append(f"""
RECIPE REQUIREMENTS:
- 30 min max cook time.
- Practical & Healthy.
- Use available ingredients primarily.

OUTPUT JSON ONLY (No Markdown, No Comments, No Trailing Commas):
{{
    "recipes": [
        {{
            "recipe_name": "Name",
            "prep_time": "10m",
            "cook_time": "20m", 
            "total_time": "30m",
            "ingredients": ["item 1", "item 2"],
            "instructions": ["Step 1", "Step 2", "Step 3 (Brief)"],
            "nutrition": "300 cal, 20g protein",
            "difficulty": "Easy",
            "tags": ["Quick"]
        }}
    ]
}}
"""
        )
        
        prompt = "\n".join(prompt_parts)
        
        # Add retry logic
        max_retries = 2
        for attempt in range(max_retries):
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 2500,
                    "temperature": 0.9,
                    "stream": False
                }
                
                print(f"🔄 Calling DeepSeek API... (Attempt {attempt + 1})")
                response = requests.post(
                    self.base_url, 
                    headers=headers, 
                    json=payload,
                    timeout=80  # Increased timeout
                )
                
                if response.status_code != 200:
                    print(f"❌ API returned status {response.status_code}: {response.text}")
                    if attempt < max_retries - 1:
                        print("🔄 Retrying...")
                        continue
                    raise Exception(f"API returned status {response.status_code}")
                
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                print(f"✅ DeepSeek response received, parsing...")
                
                # Extract JSON from response
                json_text = self._extract_json(ai_response)
                recipes_data = json.loads(json_text)
                
                # Add AI metadata
                for recipe in recipes_data.get('recipes', []):
                    recipe['ai_generated'] = True
                    recipe['similarity_score'] = 0.95
                    recipe['source'] = 'DeepSeek AI'
                    recipe['dietary_compatible'] = True
                    recipe['allergy_safe'] = True if not allergies else False
                
                ai_recipes = recipes_data.get('recipes', [])
                print(f"🎉 Generated {len(ai_recipes)} AI recipes with DeepSeek!")
                return ai_recipes[:top_n]
                
            except requests.exceptions.Timeout:
                print(f"❌ Timeout on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                else:
                    raise
            except Exception as e:
                print(f"❌ DEEPSEEK API FAILED: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                raise
        
        raise Exception("All API call attempts failed")
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from AI response"""
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json_match.group()
        
        # If no JSON found, try to clean the response
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        return text

    # ... [Additional methods for meal plan, substitutions, and image analysis omitted for brevity] ...
```

### Backend - Food Freshness Service
**File:** `backend/api/food_freshness_service.py`
**Description:** Manages loading the TensorFlow model and performing image classification for food freshness.

```python
import os
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from tensorflow.keras import layers, models, applications

class FoodFreshnessService:
    def __init__(self, model_path='models/food_freshness_model_final.h5'):
        self.model_path = model_path
        self.model = None
        self.class_names = [
            'freshapples', 'freshbanana', 'freshbittergroud', 'freshcapsicum', 'freshcucumber',
            'freshmeat', 'freshokra', 'freshoranges', 'freshpotato', 'freshtomato',
            'rottenapples', 'rottenbanana', 'rottenbittergroud', 'rottencapsicum', 'rottencucumber',
            'rottenokra', 'rottenoranges', 'rottenpotato', 'rottentomato', 'spoiledmeat'
        ]
        self.input_shape = (224, 224)

    def build_model(self):
        """Rebuild the model architecture"""
        input_shape = (self.input_shape[0], self.input_shape[1], 3)
        base_model = applications.MobileNetV2(
            input_shape=input_shape,
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False
        
        model = models.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.2),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(len(self.class_names), activation='softmax')
        ])
        return model

    def load_model(self):
        """Load the model if not already loaded"""
        if self.model is None:
            try:
                base_dir = os.path.dirname(os.path.abspath(__file__))
                abs_path = os.path.join(base_dir, self.model_path)
                print(f"🔄 Loading Food Freshness Model weights from: {abs_path}")
                self.model = self.build_model()
                self.model.load_weights(abs_path)
                print("✅ Food Freshness Model loaded successfully!")
                return True
            except Exception as e:
                print(f"❌ Failed to load Food Freshness Model: {e}")
                return False
        return True

    def preprocess_image(self, image_file):
        """Preprocess image for model input"""
        try:
            if isinstance(image_file, bytes):
                img = Image.open(io.BytesIO(image_file))
            else:
                img = Image.open(image_file)
            
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            img = img.resize(self.input_shape)
            img_array = np.array(img)
            img_array = img_array / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            return img_array
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            raise

    def predict(self, image_file):
        """Predict freshness of food from image file"""
        if self.model is None:
            if not self.load_model():
                raise Exception("Model could not be loaded")
        
        processed_img = self.preprocess_image(image_file)
        predictions = self.model.predict(processed_img)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        predicted_class = self.class_names[predicted_idx]
        
        is_fresh = predicted_class.startswith('fresh')
        status = 'FRESH' if is_fresh else 'ROTTEN'
        display_name = predicted_class.replace('fresh', '').replace('rotten', '').replace('spoiled', '')
        display_name = display_name.capitalize()
        
        return {
            'prediction': predicted_class,
            'confidence': confidence,
            'status': status,
            'item': display_name
        }
```

### Backend - API Server
**File:** `backend/api/deepseek_api.py`
**Description:** Flask API server exposing endpoints for the mobile app, managing DeepSeek integration and Food Scanning routes.

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from deepseek_recommender import DeepSeekRecipeRecommender
from food_freshness_service import FoodFreshnessService

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Services
try:
    API_KEY = os.environ.get("DEEPSEEK_API_KEY")
    deepseek_recommender = DeepSeekRecipeRecommender(API_KEY)
    ai_loaded = deepseek_recommender.api_available
except Exception as e:
    ai_loaded = False

try:
    food_freshness_service = FoodFreshnessService()
    freshness_loaded = food_freshness_service.load_model()
except Exception as e:
    freshness_loaded = False

@app.route('/api/ai/recommend', methods=['POST'])
def ai_recommend_recipes():
    """AI-powered recipe recommendations endpoint"""
    try:
        if not ai_loaded:
            return jsonify({'success': False, 'error': 'AI service not available'}), 503
        
        data = request.get_json(silent=True) or {}
        ingredients = data.get('ingredients', [])
        
        # ... [Validation logic] ...
        
        recommendations = deepseek_recommender.recommend_recipes(
            available_ingredients=ingredients,
            dietary_restrictions=data.get('dietary_restrictions', []),
            allergies=data.get('allergies', []),
            health_conditions=data.get('health_conditions', []),
            top_n=data.get('top_n', 3),
            meal_type=data.get('meal_type'),
            servings=data.get('servings', "2")
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/scan-food', methods=['POST'])
def scan_food():
    """Scan food for freshness"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file'}), 400
            
        image_file = request.files['image']
        
        # 1. Local Vision Model
        local_result = food_freshness_service.predict(image_file)
        
        # 2. Enrich with DeepSeek AI (omitted for brevity)
        # enriched_result = deepseek_recommender.enrich_food_info(...)
        
        return jsonify({
            'success': True,
            'result': local_result # simplified
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
```

---

## Frontend Modules

### Frontend - Recipe Screen
**File:** `nutrichef-global/src/screens/RecipeScreen.js`
**Description:** Main screen for recipe generation. Handles user input for ingredients, fridge inventory selection, and calling the backend API.

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
// ... imports ...

export default function RecipeScreen({ navigation }) {
    const [ingredients, setIngredients] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // ... State management for fridge items ...

    const handleGenerate = async () => {
        // Collect ingredients from input and selected fridge items
        // ... logic ...

        setLoading(true);
        try {
            // Call backend API
            const response = await generateRecipes(finalIngredientList, healthConditions, 3, null, peopleCount);
            if (response && response.recommendations) {
                setRecipes(response.recommendations);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate recipes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Add Extra Ingredients</Text>
                    <TextInput
                        style={styles.input}
                        value={ingredients}
                        onChangeText={setIngredients}
                        placeholder="e.g. Rice, Spices"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Cooking Plan...' : 'Generate Recipes'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.results}>
                    {recipes.map((recipe, index) => (
                        <TouchableOpacity key={index} onPress={() => navigation.navigate('RecipeDetail', { recipe })}>
                            <View style={styles.recipeCard}>
                                <Text style={styles.recipeTitle}>{recipe.recipe_name}</Text>
                                <Text style={styles.recipeDesc}>{recipe.total_time}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
// ... styles ...
```

### Frontend - Scan Food Screen
**File:** `nutrichef-global/src/screens/ScanFoodScreen.js`
**Description:** Screen that uses the device camera to take pictures of food and send them to the backend for freshness analysis.

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { scanFood } from '../services/api';

const ScanFoodScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const pickImage = async (source) => {
        // ... ImagePicker logic (camera/gallery) ...
        const pickerResult = await ImagePicker.launchCameraAsync(options);
        
        if (!pickerResult.canceled) {
            const selectedImage = pickerResult.assets[0].uri;
            setImage(selectedImage);
            handleScan(selectedImage);
        }
    };

    const handleScan = async (imageUri) => {
        setLoading(true);
        try {
            const data = await scanFood(imageUri);
            if (data.success && data.result) {
                setResult(data.result);
            } else {
                Alert.alert("Scan Failed", data.error);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to connect.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.imageContainer}>
                {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <Text>No image</Text>}
            </View>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => pickImage('camera')}>
                    <Text style={styles.buttonText}>Take Picture</Text>
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" />}

            {result && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>{result.item_name}</Text>
                    <Text style={{ color: result.status === 'FRESH' ? 'green' : 'red' }}>
                        {result.status}
                    </Text>
                    <Text>Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
                </View>
            )}
        </SafeAreaView>
    );
};
export default ScanFoodScreen;
```
