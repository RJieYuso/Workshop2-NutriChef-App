// Setup type definitions for built-in Supabase runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DeepSeek API Configuration
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Health check endpoint
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname.endsWith('/health')) {
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
        if (!DEEPSEEK_API_KEY) {
            throw new Error('DEEPSEEK_API_KEY not set');
        }

        const { ingredients, health_conditions = [], dietary_restrictions = [], allergies = [], top_n = 3, calorie_target } = await req.json();

        if (!ingredients || !ingredients.length) {
            throw new Error('Ingredients list cannot be empty');
        }

        console.log(`🤖 DeepSeek Request: Ingredients=${ingredients}, TopN=${top_n}`);

        // Build the Prompt
        let prompt = `You are a professional chef and nutritionist. Create ${top_n} detailed recipes.\n`;
        prompt += `\nAVAILABLE INGREDIENTS: ${ingredients.join(', ')}`;
        if (dietary_restrictions.length) prompt += `\nDIETARY RESTRICTIONS: ${dietary_restrictions.join(', ')}`;
        if (allergies.length) prompt += `\nALLERGIES TO AVOID: ${allergies.join(', ')} - DO NOT USE THESE INGREDIENTS`;
        if (health_conditions.length) prompt += `\nHEALTH CONDITIONS: ${health_conditions.join(', ')}`;
        if (calorie_target) prompt += `\nCALORIE TARGET: Aim for around ${calorie_target} calories per recipe`;

        prompt += `
RECIPE REQUIREMENTS:
- Must use ONLY or primarily the available ingredients
- Must respect all dietary restrictions and allergies
- Must consider health conditions in nutrition planning
- Practical for home cooking with clear instructions

For each recipe, provide:
- Recipe name
- Prep time (e.g., "15 mins")
- Cook time (e.g., "30 mins") 
- Total time
- List of ingredients with quantities
- Step-by-step cooking instructions
- Nutritional information (calories, protein, carbs, fat)
- Difficulty level (Easy/Medium/Hard)
- Tags (e.g., ["quick", "healthy", "vegetarian"])

Return ONLY valid JSON in this format:
{
    "recipes": [
        {
            "recipe_name": "Recipe Name",
            "prep_time": "X mins",
            "cook_time": "X mins",
            "total_time": "X mins",
            "ingredients": ["1 cup ingredient", "2 tbsp sauce"],
            "instructions": ["Step 1", "Step 2"],
            "nutrition": "Calories: X, Protein: Xg, Carbs: Xg, Fat: Xg",
            "difficulty": "Easy/Medium/Hard",
            "tags": ["tag1", "tag2"]
        }
    ]
}
`;

        // Call DeepSeek API with Retry Logic
        let aiRecipes = [];
        let success = false;
        let errorMsg = "";

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt + 1}: Calling DeepSeek API...`);

                // Timeout using AbortController (60 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(DEEPSEEK_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 4000,
                        temperature: 0.7,
                        stream: false
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API returned status ${response.status}: ${errText}`);
                }

                const data = await response.json();
                const content = data.choices[0].message.content;

                // Extract JSON
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : content;
                const parsed = JSON.parse(jsonStr);

                aiRecipes = parsed.recipes || [];
                // Add metadata
                aiRecipes = aiRecipes.map((r: any) => ({
                    ...r,
                    ai_generated: true,
                    source: 'DeepSeek AI',
                    similarity_score: 0.95
                }));

                success = true;
                break; // Success!
            } catch (err: any) {
                console.error(`❌ Attempt ${attempt + 1} Failed: ${err.message}`);
                errorMsg = err.message;
                if (err.name === 'AbortError') console.error("Protocol Timeout");
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s
            }
        }

        if (!success) {
            console.log("⚠️ Falling back to smart recipes due to API failure.");
            aiRecipes = getFallbackRecipes(ingredients, top_n);
        }

        return new Response(JSON.stringify({
            success: true,
            recommendations: aiRecipes.slice(0, top_n),
            count: aiRecipes.length,
            ai_generated: success,
            source: success ? 'DeepSeek AI' : 'Smart Fallback',
            debug_error: success ? null : errorMsg
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error(`❌ Function Error: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

function getFallbackRecipes(ingredients: string[], top_n: number) {
    const recipes = [];
    const ings = ingredients.map(i => i.toLowerCase());

    if (ings.some(i => ['chicken', 'beef', 'fish'].some(p => i.includes(p)))) {
        recipes.push({
            "recipe_name": "Simple Stir Fry",
            "prep_time": "15 mins",
            "cook_time": "15 mins",
            "total_time": "30 mins",
            "ingredients": ["Protein", "Vegetables", "Soy Sauce"],
            "instructions": ["Cook protein", "Add veggies", "Season"],
            "nutrition": "Calories: 400",
            "difficulty": "Easy",
            "tags": ["fallback", "quick"],
            "ai_generated": false,
            "source": "Smart Fallback"
        });
    }
    // Add generic fallback if list is short
    if (recipes.length < top_n) {
        recipes.push({
            "recipe_name": "Quick Ingredient Bowl",
            "prep_time": "5 mins",
            "cook_time": "10 mins",
            "total_time": "15 mins",
            "ingredients": ingredients.slice(0, 3),
            "instructions": ["Combine ingredients", "Cook thoroughly", "Enjoy"],
            "nutrition": "Calories: 350",
            "difficulty": "Easy",
            "tags": ["fallback"],
            "ai_generated": false,
            "source": "Smart Fallback"
        });
    }
    return recipes.slice(0, top_n);
}
