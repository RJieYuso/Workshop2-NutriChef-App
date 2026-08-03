import { createClient } from '@supabase/supabase-js';
import Config from '../config';

// Use ANON/PUBLIC key, NOT service key!
const supabase = createClient(
    Config.SUPABASE_URL,
    Config.SUPABASE_ANON_KEY
);

export const supabaseAuth = {
    signUp: async (email, password) => {
        return await supabase.auth.signUp({ email, password });
    },

    signIn: async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    },

    signInWithGoogle: async () => {
        return await supabase.auth.signInWithOAuth({ provider: 'google' });
    },

    signOut: async () => {
        return await supabase.auth.signOut();
    }
};

export const supabaseDB = {
    // Read operations that are safe for mobile
    getUserInventory: async (userId) => {
        console.log("Supabase Fetching for:", userId);
        const response = await supabase
            .from('user_inventory')
            .select('*')
            .eq('user_id', userId)
            .order('expiration_date', { ascending: true });

        console.log("Supabase Response:", JSON.stringify(response, null, 2));
        return response;
    },

    getItemsExpiringSoon: async (userId, days = 3) => {
        // This logic relies on valid date strings in DB
        return await supabase
            .from('user_inventory')
            .select('*')
            .eq('user_id', userId)
            .order('expiry_date', { ascending: true })
            .limit(5);
    },

    updateUserInventory: async (inventoryId, updates) => {
        console.log("Updating inventory:", inventoryId, updates);
        const { data, error } = await supabase
            .from('user_inventory')
            .update(updates)
            .eq('inventory_id', inventoryId)
            .select();

        if (error) console.error("Supabase update error:", error);
        return { data, error };
    },

    addItemToInventory: async (itemName, userId, shelfLifeString = null) => {
        // Default 7 days
        let daysToAdd = 7;

        // Try to parse shelf life string (e.g. "3-4 weeks", "5 days")
        if (shelfLifeString) {
            try {
                const lowerStr = shelfLifeString.toLowerCase();
                // Regex to find the first number and the unit
                const match = lowerStr.match(/(\d+).*?(day|week|month|year)/);

                if (match) {
                    const number = parseInt(match[1]);
                    const unit = match[2];

                    if (unit.startsWith('day')) daysToAdd = number;
                    else if (unit.startsWith('week')) daysToAdd = number * 7;
                    else if (unit.startsWith('month')) daysToAdd = number * 30;
                    else if (unit.startsWith('year')) daysToAdd = number * 365;
                }
            } catch (e) {
                console.log("Error parsing shelf life:", e);
            }
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysToAdd);

        const newItem = {
            user_id: userId,
            ingredient_name: itemName,
            quantity_grams: 1, // Default to 1
            expiration_date: expiryDate.toISOString().split('T')[0]
        };

        return await supabaseDB.addUserInventory(newItem);
    },

    addUserInventory: async (newItem) => {
        console.log("Adding inventory:", newItem);
        const { data, error } = await supabase
            .from('user_inventory')
            .insert([newItem])
            .select();
        if (error) console.error("Supabase insert error:", error);
        return { data, error };
    },

    deleteUserInventory: async (inventoryId) => {
        console.log("Deleting inventory:", inventoryId);
        const { error } = await supabase
            .from('user_inventory')
            .delete()
            .eq('inventory_id', inventoryId);
        if (error) console.error("Supabase delete error:", error);
        return { error };
    },

    saveRecipe: async (recipe, userId) => {
        console.log("Saving recipe:", recipe.recipe_name, "for user:", userId);

        // Parse nutrition string to JSONB
        const parseNutrition = (nutritionStr) => {
            if (!nutritionStr) return null;
            const obj = {};
            nutritionStr.split(',').forEach(part => {
                const [key, value] = part.split(':').map(s => s.trim());
                if (key && value) {
                    obj[key.toLowerCase()] = value;
                }
            });
            return obj;
        };

        // Map AI recipe format to database schema
        const recipeData = {
            name: recipe.recipe_name,
            prep_time: recipe.prep_time || null,
            cook_time: recipe.cook_time || null,
            total_time: recipe.total_time || null,
            ingredients_json: recipe.ingredients || [],
            directions: recipe.instructions ? recipe.instructions.join('\n') : '',
            nutrition_facts: parseNutrition(recipe.nutrition),
            user_id: userId // Add user_id to payload
        };

        const { data, error } = await supabase
            .from('recipes')
            .insert([recipeData])
            .select();

        if (error) console.error("Supabase save recipe error:", error);
        return { data, error };
    },

    saveMealPlan: async (planData, userId) => {
        console.log("Saving meal plan for user:", userId);
        const { data, error } = await supabase
            .from('saved_meal_plans')
            .insert([{
                user_id: userId,
                plan_data: planData
            }])
            .select();

        if (error) console.error("Supabase save meal plan error:", error);
        return { data, error };
    },

    getSavedMealPlans: async (userId) => {
        console.log("Fetching saved meal plans for:", userId);
        const { data, error } = await supabase
            .from('saved_meal_plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) console.error("Supabase get saved plans error:", error);
        return { data, error };
    },

    getSavedRecipes: async (userId) => {
        console.log("Fetching saved recipes for user:", userId);
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('user_id', userId) // Filter by user_id
            .order('recipe_id', { ascending: false });

        if (error) console.error("Supabase get recipes error:", error);
        return { data, error };
    },

    deleteRecipe: async (recipeId) => {
        console.log("Deleting recipe:", recipeId);
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('recipe_id', recipeId);

        if (error) console.error("Supabase delete recipe error:", error);
        return { error };
    },

    getUserProfile: async (userId) => {
        console.log("Fetching profile for:", userId);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) console.error("Supabase get profile error:", error);
        return { data, error };
    },

    updateUserProfile: async (userId, updates) => {
        console.log("Updating profile:", userId, updates);
        // Use update instead of upsert to avoid overwriting existing fields with defaults
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('user_id', userId)
            .select();

        if (error) console.error("Supabase update profile error:", error);
        return { data, error };
    }
};

export default supabase;
