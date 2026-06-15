# 🥗 Nutrivora AI (Calorique)

**AI-Powered Diet, Nutrition, Meal Tracking & Goal Management Mobile Application**

> Transform your nutrition with intelligent Indian-food-first meal planning, personalized AI diet generation, and smart macro tracking — all in one cross-platform mobile app.

---

## 📖 Overview

Nutrivora AI is a modern, AI-driven nutrition and meal tracking mobile application built with **React Native Expo**. It helps users generate personalized diet plans, track daily meals, monitor fitness goals, analyze macros, and receive intelligent nutrition recommendations powered by **Google Gemini AI**.

### 🎯 Who Is This For?

- 🏋️ Gym enthusiasts pursuing muscle gain or fat loss
- 🇮🇳 Anyone seeking Indian-food-optimized nutrition plans
- 📊 Health-conscious individuals tracking calories and macros
- 💰 Budget-conscious users wanting affordable meal plans
- 🤖 Users seeking AI-powered personalized nutrition coaching

---

## ✨ Core Features

### 🔐 Authentication
- Google Sign-In via Firebase
- Email/Password authentication
- JWT session management with auto-refresh
- Secure token storage

### 🤖 AI Diet Generator
- **Muscle gain**, **fat loss**, **lean bulk**, and **maintenance** diets
- Budget-friendly meal plans with Indian food focus
- Powered by **Google Gemini AI**
- Personalized based on age, weight, height, activity level, and preferences

### 🍽️ Daily Meal Tracking
- Log **Breakfast, Lunch, Dinner, and Snacks**
- Automatic macro calculation (Calories, Protein, Carbs, Fats)
- Food search via **Spoonacular API**
- Barcode scanner via **OpenFoodFacts API**

### 🎯 Goal Tracking
- Weight goals with progress visualization
- Daily calorie and macro targets
- Water intake tracking
- Streak system for consistency

### 📊 Dashboard Analytics
- Daily calorie ring chart
- Macro progress bars
- Weekly trend analysis
- Goal completion percentage
- Water intake tracker

### 🧠 AI Coach
- Interactive nutrition coaching
- Smart meal suggestions based on remaining macros
- Healthy food alternatives
- Diet modification recommendations

---

## 🛠️ Tech Stack

### Frontend
| Technology         | Purpose                    |
| ------------------ | -------------------------- |
| React Native Expo  | Cross-platform mobile UI   |
| TypeScript         | Type safety                |
| NativeWind         | Tailwind CSS styling       |
| Zustand            | Client state management    |
| TanStack Query v5  | Server state & caching     |
| React Navigation   | Screen navigation          |
| React Hook Form    | Form management            |
| Zod                | Schema validation          |

### Backend
| Technology         | Purpose                    |
| ------------------ | -------------------------- |
| Node.js            | Server runtime             |
| Express.js         | HTTP framework             |
| TypeScript         | Type safety                |
| MongoDB Atlas      | Database                   |
| Mongoose           | ODM                        |
| Firebase Admin SDK | Auth verification          |
| jsonwebtoken       | JWT management             |

### AI & APIs
| Service            | Purpose                    |
| ------------------ | -------------------------- |
| Google Gemini API  | AI diet generation & coach |
| Spoonacular API    | Food nutrition data        |
| OpenFoodFacts API  | Barcode food scanning      |
| Cloudinary         | Image storage              |
| Firebase FCM       | Push notifications         |

---

## 📂 Project Structure

```
Calorique/
├── Architecture.md        # System architecture (master doc)
├── api.md                 # Complete API endpoint reference
├── frontend.md            # Frontend architecture & patterns
├── backend.md             # Backend architecture & schemas
├── Readme.md              # This file
│
├── src/                   # Frontend (React Native Expo)
│   ├── api/               # API client & endpoint functions
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state stores
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript interfaces
│   ├── utils/             # Utility functions
│   └── App.tsx            # App entry point
│
└── server/                # Backend (Express.js)
    ├── config/            # DB, Firebase, Cloudinary config
    ├── controllers/       # Request handlers
    ├── services/          # Business logic
    ├── repositories/      # Database operations
    ├── middleware/         # Auth, validation, error handling
    ├── models/            # Mongoose schemas
    ├── routes/            # API route definitions
    ├── validations/       # Input validation schemas
    ├── jobs/              # Background cron jobs
    ├── utils/             # Helpers & utilities
    ├── app.ts             # Express app setup
    └── server.ts          # Server entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18 LTS
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account
- Firebase project
- API keys for Gemini, Spoonacular

### Environment Variables

Create a `.env` file in the `server/` directory:

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-secret>
FIREBASE_PROJECT_ID=<your-project-id>
GEMINI_API_KEY=<your-key>
SPOONACULAR_API_KEY=<your-key>
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/calorique.git
cd calorique

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install

# Start backend development server
npm run dev

# Start frontend (in a new terminal)
cd ..
npx expo start
```

---

## 📚 Documentation

| Document                                 | Description                                           |
| ---------------------------------------- | ----------------------------------------------------- |
| [Architecture.md](./Architecture.md)     | System architecture, diagrams, flows                  |
| [api.md](./api.md)                       | Complete API endpoint reference with schemas           |
| [frontend.md](./frontend.md)             | Frontend architecture, state management, navigation   |
| [backend.md](./backend.md)               | Backend architecture, DB schemas, security, services  |

---

## 🗺️ Roadmap

### Phase 1 — MVP (3 Weeks)
- [x] Project architecture & documentation
- [ ] Authentication (Firebase + JWT)
- [ ] Meal tracking CRUD
- [ ] Goal setting & tracking
- [ ] Dashboard with analytics
- [ ] Spoonacular API integration

### Phase 2 — AI Features (2 Weeks)
- [ ] Gemini AI diet generation
- [ ] AI meal suggestions
- [ ] Streak & gamification system

### Phase 3 — Advanced (2 Weeks)
- [ ] Barcode food scanner
- [ ] AI food image recognition
- [ ] Google Fit integration

### Phase 4 — Monetization (1 Week)
- [ ] Premium subscription (in-app purchase)
- [ ] AdMob integration
- [ ] Affiliate product recommendations

---

## 💰 Monetization

| Tier    | Features                                              | Price       |
| ------- | ----------------------------------------------------- | ----------- |
| Free    | Basic calorie tracking, meal logging, goal tracking   | Free        |
| Premium | AI diet plans, AI coach, advanced analytics, barcode  | ₹199/month  |
|         | scanner, food image analysis, unlimited saved diets   | ₹1,499/year |

---

## 🔮 Future Vision

Nutrivora AI aims to evolve into a complete **AI-powered Indian fitness nutrition ecosystem**:

- 🏃 AI Fitness Coach (workout + nutrition combined)
- 🛒 Smart Grocery Planner (auto-generated shopping lists)
- ⌚ Wearable Integration (Google Fit, Apple Health)
- 👥 Community Challenges (streaks, competitions, rewards)
- 📸 Food Image Recognition (camera → instant nutrition)
- 🌐 Social Fitness Network (share meals, compete with friends)

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built with ❤️ for the Indian fitness community*
