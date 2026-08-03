
class RecommenderTest:
    def _calculate_missing_ingredients(self, recipe, available_ingredients):
        recipe_ingredients = recipe.get('ingredients', [])
        missing = []
        
        # Normalize available ingredients to lowercase for comparison
        available_lower = [ing.lower().strip() for ing in available_ingredients]
        
        # Basic pantry staples that we don't count as "missing"
        pantry_staples = ['salt', 'pepper', 'oil', 'water', 'olive oil', 'vegetable oil', 
                         'black pepper', 'sea salt', 'cooking oil', 'sugar']
        
        common_units = ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'of', 
                      'inch', 'cm', 'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
                      'pinch', 'dash', 'handful', 'sprig', 'can', 'bottle', 'package', 'pack',
                      'bunch', 'head', 'stick', 'stalk']

        print(f"DEBUG: Available (normalized): {available_lower}")

        for ingredient_str in recipe_ingredients:
            print(f"\nProcessing: '{ingredient_str}'")
            # Check if ingredient is marked with asterisk (AI marks missing ingredients)
            if '*' in ingredient_str:
                # Extract ingredient name (remove asterisk and quantity)
                ingredient_name = ingredient_str.replace('*', '').strip()
                # Remove quantity (e.g., "2 cups", "1 tbsp")
                parts = ingredient_name.split()
                if len(parts) > 1:
                    # Try to find the actual ingredient name (skip numbers and measurements)
                    ingredient_name = ' '.join([p for p in parts if not p[0].isdigit() and 
                                                p.lower() not in common_units])
                
                ingredient_lower = ingredient_name.lower().strip()
                print(f"  -> Parsed (from *): '{ingredient_lower}'")
                
                # VERIFY: Even if AI marked it missing, check if we actually have it
                # (AI sometimes hallucinates or misses items in the prompt)
                is_actually_available = False
                for avail in available_lower:
                    if avail in ingredient_lower or ingredient_lower in avail:
                        print(f"  -> Match found! '{avail}' <-> '{ingredient_lower}'")
                        is_actually_available = True
                        break
                
                # Don't count pantry staples as missing AND check if we actually have it
                if not is_actually_available and ingredient_lower not in pantry_staples:
                    missing.append(ingredient_name)
                    print(f"  -> Marked as MISSING")
            else:
                # Parse ingredient string to extract ingredient name
                ingredient_str_clean = ingredient_str.strip()
                parts = ingredient_str_clean.split()
                
                if len(parts) > 1:
                    # Skip quantity and measurement units to get ingredient name
                    ingredient_name = ' '.join([p for p in parts if not p[0].isdigit() and 
                                                p.lower() not in common_units])
                else:
                    ingredient_name = ingredient_str_clean
                
                ingredient_lower = ingredient_name.lower().strip().rstrip(',')
                print(f"  -> Parsed: '{ingredient_lower}'")
                
                # Check if ingredient is available
                is_available = False
                for avail in available_lower:
                    if avail in ingredient_lower or ingredient_lower in avail:
                        print(f"  -> Match found! '{avail}' <-> '{ingredient_lower}'")
                        is_available = True
                        break
                
                # If not available and not a pantry staple, mark as missing
                if not is_available and ingredient_lower not in pantry_staples:
                    missing.append(ingredient_name)
                    print(f"  -> Marked as MISSING")
        
        return missing

tester = RecommenderTest()

# Test Case 1: User has "chicken breast", Recipe asks for "chicken breast"
inventory = ["chicken breast"]
recipe = {
    "ingredients": [
        "2 chicken breasts",
        "1 cup rice",
        "salt"
    ]
}
print("--- TEST CASE 1 ---")
missing = tester._calculate_missing_ingredients(recipe, inventory)
print(f"Result Missing: {missing}")

# Test Case 2: User has "chicken breast", Recipe asks for "chicken"
inventory = ["chicken breast"]
recipe = {
    "ingredients": [
        "500g chicken",
        "pepper"
    ]
}
print("\n--- TEST CASE 2 ---")
missing = tester._calculate_missing_ingredients(recipe, inventory)
print(f"Result Missing: {missing}")

# Test Case 3: User has "chicken", Recipe asks for "chicken breast"
inventory = ["chicken"]
recipe = {
    "ingredients": [
        "2 chicken breasts"
    ]
}
print("\n--- TEST CASE 3 ---")
missing = tester._calculate_missing_ingredients(recipe, inventory)
print(f"Result Missing: {missing}")

# Test Case 4: DeepSeek formatted with Asterisk
inventory = ["chicken breast"]
recipe = {
    "ingredients": [
        "* 2 chicken breasts",  # AI thinks it's missing
        "1 tbsp oil"
    ]
}
print("\n--- TEST CASE 4 ---")
missing = tester._calculate_missing_ingredients(recipe, inventory)
print(f"Result Missing: {missing}")
