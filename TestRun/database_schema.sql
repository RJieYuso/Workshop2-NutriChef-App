-- Database Schema for NutriChef
-- Corrections based on Live Database Dump

-- Users Table
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    meal_direction TEXT,
    verification_code TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Table (user_inventory)
CREATE TABLE public.user_inventory (
    inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id),
    ingredient_name TEXT NOT NULL,
    quantity_grams INTEGER,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Meal Plans / Recipes (saved_meal_plans)
CREATE TABLE public.saved_meal_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id),
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_inventory_user ON public.user_inventory(user_id);
CREATE INDEX idx_saved_plans_user ON public.saved_meal_plans(user_id);

-- Recipes Table (saved individual recipes)
CREATE TABLE public.recipes (
    recipe_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(user_id),
    name TEXT NOT NULL,
    ingredients_json JSONB,
    directions TEXT,
    nutrition_facts JSONB,
    prep_time TEXT,
    cook_time TEXT,
    total_time TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recipes_user ON public.recipes(user_id);
