# 🎨 Nutrivora AI (Calorique) — Master UI/UX Generation Prompt

This document contains a comprehensive, highly-detailed master prompt designed for state-of-the-art UI/UX generators (such as Lovable, Bolt.new, v0.dev, or Figma AI) to create a premium, interactive, and visually stunning frontend prototype for **Nutrivora AI (Calorique)**.

---

## 🚀 The Master Prompt

> [!TIP]
> Copy the entire block below and paste it into your favorite AI UI generation tool (e.g., Lovable.dev, Bolt.new, or v0.dev) to generate a fully styled, functional React/Native-styled web prototype.

```text
Create a premium, state-of-the-art mobile app interface prototype (designed as a responsive web preview of a React Native Expo application) for "Nutrivora AI" (also known as Calorique), an AI-driven, Indian-food-focused diet planner and macro tracker. 

### 🎨 DESIGN SYSTEM & AESTHETIC
- **Style**: Ultra-modern, premium dark-mode first design with glassmorphism cards, soft glowing dropshadows, and a clean, high-tech fitness feel.
- **Typography**: Clean modern sans-serif (e.g., Inter or Outfit), hierarchy with bold headers and readable body text.
- **Color Palette**:
  - Primary (Health): Vibrant Emerald Green (#4CAF50 / HSL 122, 39%, 49%) for positive actions, goals achieved, and success status.
  - Secondary (Energy): Warm Orange (#FF9800 / HSL 36, 100%, 50%) for calories and energy indicators.
  - Accent (Hydration): Sky Blue (#2196F3 / HSL 207, 90%, 54%) for water logging.
  - Backgrounds: Deep Slate Dark (#121212) for the base, with elevated Glassmorphism/Acrylic card surfaces (#1E1E1E with slight transparency and borders).
- **Macro-Specific Color Codes**:
  - Protein: Pink/Magenta (#E91E63)
  - Carbs: Orange (#FF9800)
  - Fats: Purple (#9C27B0)
  - Fiber: Wood Brown (#795548)

---

### 📱 NAVIGATION ARCHITECTURE
Implement a multi-view application layout. In the responsive container, show a sleek mobile mock screen frame with a high-fidelity bottom tab bar containing:
1. 🏠 **Home** (Dashboard & Daily Overview)
2. 🍳 **Meals** (Meal Logging & Search)
3. 🤖 **AI Coach** (Diet Generator & Chatbot)
4. 📈 **Analytics** (Goals & Weight Tracking)
5. 👤 **Profile** (User Settings & Premium Upsell)

---

### 🖥️ DETAILED SCREEN SPECIFICATIONS

#### 1. HOME: The Dashboard (Active Tab by default)
- **Calorie Summary Card**: A large, beautiful circular progress ring displaying "1,450 / 2,100 kcal" with a glowing orange ring. Underneath, show small labels for "Remaining: 650 kcal".
- **Macro Progress Grid**: Clean horizontal progress bars for:
  - Protein: 85g / 130g (Pink, with a tag "Target: 2.0g/kg")
  - Carbs: 180g / 220g (Orange)
  - Fats: 45g / 65g (Purple)
- **Daily Streak Counter**: A hot glowing flame badge with a number: "🔥 7 Day Streak!" that pulses gently on hover.
- **Hydration Widget**: Interactive glassmorphism water tracker. Show progress as filled water droplets (e.g., "5 / 10 glasses, 1.25L"). Include a quick "+" button that updates the glass count with a splash sound effect or water ripple animation.
- **AI Suggestion Box**: A card labeled "Gemini Smart Coach" showing a recommendation: "💡 You're 30g short on protein today. Try adding 150g of Paneer or Greek Yogurt to your snack!"

#### 2. MEALS: Logging & Search Screen
- **Meal Logs Timeline**: Categorized card groups for today's meals:
  - **Breakfast**: "Oatmeal with Almonds & Banana" (350 kcal)
  - **Lunch**: "2 Roti, Dal Tadka, Mixed Veg, Cucumber Salad" (550 kcal)
  - **Dinner**: (Empty state) "Not logged yet. Tap '+' to add dinner"
  - **Snacks**: "Whey Protein Shake & Roasted Chana" (280 kcal)
- **Quick Add Modal**: Tapping '+' opens a slide-up panel:
  - **Search Bar**: Autocomplete search input. Searching "Paneer" shows instant dropdown items with calorie breakdowns (e.g., "Paneer Tikka - 260 kcal per 100g").
  - **Barcode Scanner Toggle**: A camera icon button labeled "Scan Barcode". Clicking it simulates a camera scanner viewport with a green laser line anim, then returns a mock food item (e.g., "Amul Amul Butter - 100 kcal").
  - **Portion Size Slider**: Responsive slider to adjust grams or servings, dynamically updating the calculated calories/macros in real-time.

#### 3. AI COACH: Diet Generator & Chat
- **Segmented Control**: Switch between [Generate Diet Plan] and [Chat with Coach].
- **Diet Generator Form**:
  - Selection options for Goal (Muscle Gain, Fat Loss, Lean Bulk, Maintenance).
  - Indian Diet budget tier buttons: (Basic / Budget-Friendly, Standard, Premium/Organic).
  - Interactive allergy tags (Lactose, Gluten, Nuts) and Diet Type (Veg, Non-Veg, Eggetarian).
  - "Generate with Gemini AI" action button with a glowing particle loading state.
- **Generated Diet Results Screen**: Shows a weekly planner grid. Clicking a day displays 4 beautiful cards (Breakfast, Lunch, Dinner, Snack) customized with Indian food portions, and a "Swap Food" button that uses AI to find a matching calorie alternative.
- **AI Coach Chatbot**: High-fidelity messaging interface. 
  - Chat bubbles showing messages from "Aria, your AI Dietitian".
  - Quick action chips below: "Suggest high-protein snacks", "Modify dinner to be cheaper", "Create a pre-workout meal".
  - Typable chat bar with active typing indicators.

#### 4. ANALYTICS: Goals & Progress Tracker
- **Calorie Trend Chart**: A smooth, glowing line chart displaying the past 7 days of calorie intake against the target line.
- **Weight Progress Widget**: Display weight change (e.g., "Current: 72.4 kg | Target: 70.0 kg") with a line chart showing progress over 4 weeks.
- **Goal Configurator**: Section to toggle daily targets (Calorie Goals, Water Intake Targets) using stepper components.

#### 5. PROFILE & PREMIUM UPSELL: Settings
- **User Avatar & Profile Header**: Premium avatar design with name ("Rahul Sharma"), badge: "Free Tier".
- **Premium Subscription Card**: An eye-catching card styled in deep purple/gold colors. Headline: "Go Premium with Nutrivora AI". List benefits with checkmarks: "Unlimited Gemini Diet Generation, 24/7 AI Coach Chat, Barcode Scanning, Food Image Analysis". Shows pricing tags: "₹199/month" or "₹1,499/year".
- **Settings List**: Clean item toggles for Theme Selection (Light/Dark), Firebase Auth settings, and Notification reminders (Meal & Water alerts).

---

### ✨ MICRO-INTERACTIONS & FEEDBACK
- Implement hover states on all cards (subtle scale up + increased shadow glow).
- Implement interactive states (switching tabs displays new screens with smooth fade animations).
- Implement functional state counters: incrementing water intake should update the total volume, searching paneer should show a mock food list, and chatting should insert new user bubbles into the chat screen.
```
