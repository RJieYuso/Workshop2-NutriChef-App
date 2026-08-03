# NutriChef — AI-Powered Smart Kitchen

**Reduce food waste with hybrid AI: a computer-vision model that tells you whether food is still edible, and a generative-AI chef that turns whatever is in your fridge into dinner.**

[![Watch the NutriChef demo](https://img.youtube.com/vi/gWfcQUtseEQ/hqdefault.jpg)](https://youtu.be/gWfcQUtseEQ)

> Click the thumbnail above to watch the app in action.

---

## Table of Contents

- [The Problem](#the-problem)
- [Hybrid AI at a Glance](#hybrid-ai-at-a-glance)
- [Core Module 1 — Computer Vision: Food Freshness](#core-module-1--computer-vision-food-freshness)
- [Core Module 2 — Generative AI: Recipe Generation](#core-module-2--generative-ai-recipe-generation)
- [My Role](#my-role)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [What This Project Demonstrates](#what-this-project-demonstrates)

---

## The Problem

Roughly **one-third of all food produced globally is thrown away** — and a huge share of that waste happens at home. Two things drive it:

1. **Uncertainty about freshness.** "Best before" dates are conservative, and most people can't reliably tell whether an item is still safe to use.
2. **Decision paralysis at the fridge.** Even with a well-stocked fridge, deciding *what to cook with what you already have* is hard — so food sits until it spoils.

NutriChef attacks both sides of this loop with two complementary AI systems.

---

## Hybrid AI at a Glance

| System | Type | Where it runs | What it does |
|---|---|---|---|
| Food Freshness Detection | Computer vision (TensorFlow / Keras) | Local/backend model | Classifies food from a photo as **fresh / still edible / rotten** |
| Recipe Generation | Generative AI (DeepSeek LLM) | Supabase Edge Function (serverless) | Builds recipes from your actual inventory, respecting diet, allergies, health conditions, and calorie goals |

The two AIs work together in one flow: **scan what you have → get recipes that use it before it goes bad.**

---

## Core Module 1 — Computer Vision: Food Freshness

`ScanModel/` contains a complete, self-contained ML pipeline: data augmentation, transfer-learning training, evaluation, and prediction.

**Model design**
- Transfer learning on **EfficientNetB0** (also benchmarked MobileNetV2 and ResNet50), with a custom classification head (global pooling, dropout, dense layers).
- 3-class output: `fresh`, `still_edible`, `rotten`.
- Input size 224×224, ImageNet-pretrained base frozen first, then fine-tuned.

**Data pipeline**
- Custom food-image dataset with an **on-the-fly augmentation pipeline**: rotation (±30°), width/height shifts, shear, zoom, horizontal flip (`ImageDataGenerator`).
- Train/validation split with seeded shuffling for reproducibility.

**Training**
- **42 epochs** with a step-decayed learning rate (5e-4 → 6.25e-5).
- Peak validation accuracy **~93%** (final **~91%**), tracked in `training_history.json`.

**Artifacts**
- `transfer_learning_model.py` — architecture + fine-tuning logic
- `augment_dataset.py` — augmentation pipeline
- `evaluate_model.py` — evaluation + confusion-matrix generation
- `predict.py` — single/batch inference
- `trained_food_freshness_model_v2.h5` — trained weights, tracked via **Git LFS** (300 MB)

The trained model is intentionally kept out of normal git history and stored with Git LFS so the repo stays lean while the artifact stays reproducible.

---

## Core Module 2 — Generative AI: Recipe Generation

This is the module I focused on. The recipe engine lives in a **serverless Supabase Edge Function** (`supabase/functions/ai-recommend`, TypeScript/Deno) that calls the **DeepSeek LLM**.

**Prompt engineering**
- Structured prompt that injects the user's available ingredients, dietary restrictions, allergies, health conditions, and calorie target.
- Dietary and allergy constraints are given **explicit precedence over available ingredients** — e.g. a vegetarian never gets a meat recipe, even if chicken is in the inventory.
- Forces a **strict JSON output schema** (recipe name, times, ingredients with quantities, steps, nutrition, difficulty, tags) so downstream parsing is deterministic.

**Robustness engineering**
- **Retry logic** (2 attempts) with a **60-second AbortController timeout** on the LLM call.
- Graceful **fallback to rule-based recipes** on API failure — the app never breaks because the AI is slow or down.
- JSON **extraction + sanitization** from the model's raw text output (regex extraction, metadata enrichment, top-N slicing).

**Ranking algorithm**
- Alongside the edge function, I engineered the recommendation ranking: ingredients are normalized, pantry staples (salt, oil, pepper…) are filtered out, and each recipe is scored by **fewest missing ingredients** — so the easiest-to-cook meals surface first (`recipes.sort(key=lambda r: r['missing_ingredients_count'])`).

---

## My Role

**Focus: Generative AI engineering — LLM integration, prompt engineering, structured output, and recommendation ranking.**

- Built the DeepSeek-powered recipe generation flow (serverless edge function + Python recommender with missing-ingredient analysis).
- Designed the prompts and JSON-schema enforcement that make LLM output usable in production.
- Added retry, timeout, and fallback logic so the feature degrades gracefully, not catastrophically.
- Owned the cross-stack integration: app → API layer → LLM → database.

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│         Expo React Native App               │
│   (TestRun/nutrichef-global)                │
│   - React Navigation / Context API          │
│   - Camera, dark mode, i18n, AsyncStorage   │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴─────────┐
        │  Supabase      │        Python backend (optional)
        │  (PostgreSQL,  │        ─ Flask API for CV inference
        │   Auth, Edge   │        & alternate AI routes
        │   Functions)   │
        │        │       │
        │  ┌─────┴───┐   │
        │  │ ai-rec- │   │
        │  │ ommend  │   │
        │  │ ───────►│───┼────────────► DeepSeek LLM
        │  └─────────┘   │
        └────────────────┘
               │
               ▼
      ScanModel (TensorFlow/Keras)
      Food freshness classification
```

Data lives in Supabase/PostgreSQL (`users`, `user_inventory`, `recipes`, `saved_meal_plans`). Full schema in `TestRun/database_schema.sql`.

---

## Key Features

- **Smart inventory** — track items with quantities and expiry dates; expiring items surface first.
- **AI recipe generation** — recipes built from what you actually have, filtered by diet, allergies, health conditions, and calories.
- **Food freshness scanning** — point the camera at food and get a fresh / still-edible / rotten verdict with a confidence score.
- **Saved recipes & meal plans** — persisted in the database.
- **Custom auth** — email/password with session persistence (AsyncStorage).
- **Conversational assistant** — chat with the AI about meal ideas.
- **Polish** — dark mode, multi-language (i18next), swipe-to-delete.

---

## Repository Structure

```
Workshop2-NutriChef/
├── TestRun/
│   ├── nutrichef-global/          # Expo React Native mobile app
│   │   ├── src/
│   │   │   ├── screens/           # Login, Inventory, Recipe, ScanFood, Profile…
│   │   │   ├── services/          # API + Supabase clients
│   │   │   ├── context/           # Auth & settings state
│   │   │   └── config.js          # Environment config
│   │   └── supabase/functions/
│   │       └── ai-recommend/      # DeepSeek edge function (GenAI)
│   ├── database_schema.sql        # PostgreSQL schema
│   ├── vercel.json                # Deployment config
│   └── *.md / *.py / *.ps1        # Docs, scripts, API tests
├── ScanModel/                     # Computer-vision ML pipeline
│   ├── transfer_learning_model.py # Model architecture & fine-tuning
│   ├── augment_dataset.py         # Data augmentation
│   ├── evaluate_model.py          # Evaluation + confusion matrix
│   ├── predict.py                 # Inference
│   ├── trained_food_freshness_model_v2.h5   # Weights (Git LFS)
│   └── training_history.json      # Training metrics
├── app design/                    # UI assets
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, React Navigation, Context API, AsyncStorage, i18next |
| Database | Supabase (PostgreSQL), SQL |
| Generative AI | DeepSeek LLM, TypeScript/Deno Edge Function, prompt engineering |
| Computer Vision | Python, TensorFlow / Keras, EfficientNetB0 transfer learning |
| Backend | Python / Flask, Supabase SDK, Vercel |
| MLOps basics | Data augmentation, LR scheduling, train/val splits, metric tracking, Git LFS |

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/RJieYuso/Workshop2-NutriChef-App.git
cd Workshop2-NutriChef

# 2. Pull the ML model (Git LFS)
git lfs pull

# 3. Run the mobile app
cd TestRun/nutrichef-global
npm install
npx expo start   # scan the QR code with Expo Go
```

**Configuration** — set your own values in `nutrichef-global/src/config.js` (do not commit real keys):

```js
SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
DEEPSEEK_API_KEY: 'YOUR_DEEPSEEK_API_KEY',   // used by the edge function
```

**Deploy the AI edge function:**

```bash
supabase functions deploy ai-recommend --no-verify-jwt
supabase secrets set DEEPSEEK_API_KEY=your_key_here
```

---

## What This Project Demonstrates

- **End-to-end ML ownership** — dataset augmentation, transfer learning, training, evaluation, and shipping a 300 MB model through Git LFS.
- **Practical LLM engineering** — prompt design, constrained JSON output, retry/timeout handling, and rule-based fallbacks for real-world reliability.
- **Full-stack AI integration** — connecting a mobile app, a serverless edge function, a PostgreSQL database, and external AI APIs into one working product.
- **Engineering discipline** — documentation, schema design, testing notes, and clean repo hygiene throughout.

---

*University group project built with React Native, TensorFlow, Supabase, and DeepSeek. Built by a four-person team — see the modules above for the parts I led.*
