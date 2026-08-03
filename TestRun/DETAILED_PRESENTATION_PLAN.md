# 🎓 NutriChef - Team Presentation & Technical Breakdown

## 🚀 Project Overview
**NutriChef** is an AI-powered smart kitchen ecosystem that combines Computer Vision (food scanning) and Generative AI (recipe creation) to reduce food waste.

---

## 👥 Team Roles & Technical Breakdown

### 1. Fatin - The System Architect (App Core & Auth)
**focus:** *System Integration, Security, and User Experience*

#### � Code Languages Used:
*   **JavaScript (React Native)**: Core application logic and UI components.
*   **Supabase SDK**: For authentication queries.
*   **AsyncStorage**: For local session management.

#### �🗣️ Talking Points (What to Present):
*   "I was responsible for building the application's foundation and ensuring secure access."
*   **Custom Authentication System**: Instead of using pre-built auth UI, I built a custom login implementation to verify credentials directly against our secure database.
*   **App Architecture**: I integrated all the separate modules (Inventory, AI, Scanner) into a seamless Single Page Application (SPA) experience using React Navigation.
*   **User Profiling**: My module captures essential user data, including their "Meal Directions" (Diets/Allergies), which acts as the filter for all recipe generation.
*   **Mobile-Backend Bridge**: I managed the full-stack integration. We run the mobile app using **Expo Go** (scanning a QR code) and connect it to our custom backend (`deepseek_api.py`) using **ngrok**, which acts as a secure tunnel between my laptop and our phones.

#### 🛠️ Technical Implementation (The "Code" Part):
*   **Navigation Stack**: Used `@react-navigation/native` to manage the stack of screens (Login $\rightarrow$ Home $\rightarrow$ Modules). Implemented a `AuthLoading` state to determine which screen to show on launch.
*   **Context API (`AuthContext.js`)**: Created a global state manager that wraps the entire application. This allows any screen to access the `user` object and `signOut` functions without passing props down manually.
*   **Secure Storage**: Implementation of `AsyncStorage` to persist the user's session token locally on the device, so users don't need to log in every time they open the app.
*   **Styling System**: Established the global design tokens (colors, spacing) and dark mode compatibility used across all screens.
*   **User Personalization**: I allow users to set their dietary preferences (Vegan, Allergies) in their profile, which the entire app respects.
*   **Connectivity & DevOps**: Configured **ngrok** to tunnel our local **Python backend** (`deepseek_api.py`) to the public internet, solving the "Network Request Failed" error when testing on physical devices via **Expo Go**.

---

### 2. Dheesee - The Data Manager (Inventory & Personalization)
**focus:** *Database Management, CRUD Operations, and Conversational AI*

#### � Code Languages Used:
*   **JavaScript (React Native)**: UI lists and event handlers.
*   **SQL (PostgreSQL)**: Database table creation and queries.
*   **React Hooks**: Complex state management (`useEffect`, `useState`).

#### �🗣️ Talking Points (What to Present):
*   "My role focused on the dynamic management of user data—specifically the digital pantry and dietary intelligence."
*   **Inventory Logic**: I built the system that allows users to manually track their food, handling the logic for expiration dates and quantities.
*   **Meal Planning Chatbot**: I engaged the "Conversational AI" aspect, adding a dedicated chat button that allows users to discuss meal ideas directly with the AI assistant.

#### 🛠️ Technical Implementation (The "Code" Part):
*   **Supabase (PostgreSQL)**: Architecture of the `inventory` table.
    *   *Code Highlight*: `CASE` statements or SQL filters to sort items by `expiry_date` (Ascending) so users see expiring food first.
*   **Real-time Data Fetching**: usage of `useEffect` hooks in React Native to fetch inventory data the moment the screen focuses.
*   **Swipeable Lists**: Integrated `react-native-gesture-handler` to allow intuitive "Swipe Left to Delete" actions.
*   **Constraint Checking**: Validation logic to prevent negative quantities or invalid dates during manual entry.

---

### 3. Akmal - The AI Vision Engineer (Scanning & Detection)
**focus:** *Computer Vision, Machine Learning Pipeline, and Hybrid AI*

#### 💻 Code Languages Used:
*   **Python (Flask)**: Handling server requests and image processing.
*   **TensorFlow/Keras**: Loading and running the `.h5` model.
*   **JavaScript**: Camera integration (`Expo Camera`).

#### 🗣️ Talking Points (What to Present):
*   "I developed the 'eyes' of the application. My module solves the problem of manual data entry by using AI."
*   **Hybrid AI Approach**: Most apps use just one AI. We use two:
    1.  **Local AI (TensorFlow)**: Runs instantly to check if food is fresh or rotten.
    2.  **Cloud AI (DeepSeek)**: Analyzes the image context to estimate shelf life.
*   **Image Processing**: I handle the camera hardware and image compression before sending data to the server.

#### 🛠️ Technical Implementation (The "Code" Part):
*   **TensorFlow/Keras (Backend)**: The `food_freshness_service.py` service.
    *   *Code Highlight*: Loading the pre-trained `MobileNetV2` model (`.h5` file) to classify images into classes (Fresh Apple, Rotten Banana, etc.).
*   **Flask API Endpoint**: The `/predict-freshness` route. It receives `FormData` (multipart/form-data) containing the image bytes.
*   **Image Pre-processing**: Code that resizes and normalizes the image array (converting to float32, dividing by 255.0) so the neural network can read it.
*   **Expo Image Picker**: Integration of the mobile camera module to capture photos and convert them to Base64/Binary for transmission.

---

### 4. Ho - The Generative AI Engineer (Recipe Logic)
**focus:** *LLM Integration, Prompt Engineering, and Algorithm Design*

#### 💻 Code Languages Used:
*   **Python (Flask)**: Backend API logic.
*   **DeepSeek API**: External LLM integration.
*   **JSON**: Strict data formatting for recipe objects.

#### 🗣️ Talking Points (What to Present):
*   "I built the 'brain' that connects ingredients to meals. My goal was availability-aware cooking."
*   **Smart Receipt Generation**: It's not just random recipes. The module takes selected ingredients + user count $\rightarrow$ generates strict JSON data.
*   **Inventory Deductions**: When a user cooks a recipe, my logic calculates what needs to be removed from the inventory.

#### 🛠️ Technical Implementation (The "Code" Part):
*   **Prompt Engineering**: The specific prompt design in `deepseek_api.py`.
    *   *Technique*: "Few-Shot Prompting" or "JSON Mode enforcement". ensuring the AI returns a valid JSON object with `[name, ingredients, instructions, missing_items]`.
*   **Sorting Algorithm**: The logic that creates 3 "Simple" (few missing items) and 2 "Normal" recipes.
    *   *Code Highlight*: `recipes.sort(key=lambda x: len(x['missing_items']))` — ensuring the "easiest" recipes to cook appear at the top.
*   **Structured Output Parsing**: Using Python's `json.loads()` capabilities to sanitize the AI's raw text response, handling edge cases where the AI might add markdown backticks.
*   **Service Integration**: How the frontend sends the user's *selected* ingredient IDs to the backend to drive the generation context.

---

## 🔁 System Flow (How it all connects) for Group Conclusion
1.  **Fatin** authenticates the user.
2.  **Akmal** scans an apple (Vision AI).
3.  **Dheesee** saves that apple to the SQL Database.
4.  **Ho** pulls that apple from the DB to generate an "Apple Pie" recipe (Generative AI).
