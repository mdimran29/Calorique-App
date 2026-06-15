# System Architecture — Nutrivora AI (Calorique)

> Master architecture document. For detailed breakdowns, see:
> [api.md](./api.md) · [backend.md](./backend.md) · [frontend.md](./frontend.md)

---

## 1. System Overview

**Nutrivora AI** is an AI-powered nutrition, diet planning, and meal tracking mobile application targeting the Indian food ecosystem. It combines real-time meal logging, intelligent macro analysis, and Gemini-powered personalized diet generation into a single cross-platform mobile experience.

### Core Problem Statement

Most nutrition apps lack Indian food databases, intelligent meal planning, and affordable personalized coaching. Nutrivora AI solves this by combining AI diet generation with an Indian-food-first approach, providing gym enthusiasts, fitness beginners, and health-conscious users with actionable daily nutrition guidance.

### Product Pillars

| Pillar                | Description                                           |
| --------------------- | ----------------------------------------------------- |
| 🤖 AI-First Nutrition | Gemini-powered diet plans, meal suggestions, coaching |
| 🍛 Indian Food Focus  | Prioritize Indian meals, regional foods, budget diets |
| 📊 Smart Tracking     | Automatic macro calculation, visual analytics         |
| 🔄 Offline Resilient  | Core features work offline with background sync       |
| 📱 Cross-Platform     | Single codebase for iOS and Android via React Native  |

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT LAYER                         │
│                                                                 │
│   React Native Expo (TypeScript)                                │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ Zustand  │  │ TanStack │  │ React    │  │ NativeWind   │  │
│   │ (State)  │  │ Query    │  │ Nav      │  │ (Styling)    │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTPS (REST API)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
│                                                                 │
│   Express.js (TypeScript) — Node.js Runtime                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ Helmet   │  │ Rate     │  │ JWT Auth │  │ Validation   │  │
│   │          │  │ Limiter  │  │ Middleware│  │ Layer        │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                       │                                         │
│   ┌─────────────┬─────┴─────┬──────────────┬───────────────┐   │
│   │ Auth        │ Meal      │ Goal         │ AI            │   │
│   │ Controller  │ Controller│ Controller   │ Controller    │   │
│   └──────┬──────┴─────┬─────┴───────┬──────┴──────┬────────┘   │
│          │            │             │             │             │
│   ┌──────┴──────┬─────┴─────┬───────┴──────┬──────┴────────┐   │
│   │ Auth        │ Meal      │ Goal         │ AI            │   │
│   │ Service     │ Service   │ Service      │ Service       │   │
│   └──────┬──────┴─────┬─────┴───────┬──────┴──────┬────────┘   │
│          │            │             │             │             │
│   ┌──────┴──────┬─────┴─────┬───────┴──────┐      │            │
│   │ User        │ Meal      │ Goal         │      │            │
│   │ Repository  │ Repository│ Repository   │      │            │
│   └─────────────┴───────────┴──────────────┘      │            │
└───────────────────────┼───────────────────────────┼────────────┘
                        │                           │
                        ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│      DATA LAYER              │  │     EXTERNAL SERVICES        │
│                              │  │                              │
│  MongoDB Atlas               │  │  Google Gemini API (AI)      │
│  ┌────────┐ ┌────────┐      │  │  Spoonacular API (Nutrition) │
│  │ Users  │ │ Meals  │      │  │  OpenFoodFacts (Barcode)     │
│  └────────┘ └────────┘      │  │  Firebase Auth               │
│  ┌────────┐ ┌────────┐      │  │  Firebase Cloud Messaging    │
│  │ Goals  │ │Progress│      │  │  Cloudinary (Images)         │
│  └────────┘ └────────┘      │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## 3. Authentication Architecture

### Dual-Layer Auth Flow

```text
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   User       │     │   Firebase Auth  │     │   Backend Server │
│   (Mobile)   │     │   (Google Cloud) │     │   (Express.js)   │
└──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘
       │                      │                        │
       │  1. Google Sign-In   │                        │
       │  ──────────────────► │                        │
       │                      │                        │
       │  2. Firebase Token   │                        │
       │  ◄────────────────── │                        │
       │                      │                        │
       │  3. POST /auth/login { firebaseToken }        │
       │  ─────────────────────────────────────────►   │
       │                      │                        │
       │                      │  4. Verify Token       │
       │                      │  ◄──────────────────   │
       │                      │  ──────────────────►   │
       │                      │                        │
       │  5. JWT Access + Refresh Token                │
       │  ◄─────────────────────────────────────────   │
       │                      │                        │
       │  6. API calls with Bearer JWT                 │
       │  ─────────────────────────────────────────►   │
```

### Token Lifecycle

| Token          | Issued By    | Lifetime | Refresh Strategy               |
| -------------- | ------------ | -------- | ------------------------------ |
| Firebase Token | Firebase SDK | 1 hour   | Auto-refreshed by SDK          |
| Access Token   | Backend      | 15 min   | Silent refresh via interceptor |
| Refresh Token  | Backend      | 30 days  | Re-login required on expiry    |

---

## 4. AI Architecture

### Diet Generation Pipeline

```text
┌────────────────────────────────────────────────────────────────┐
│                   AI DIET GENERATION PIPELINE                   │
│                                                                 │
│  ┌──────────────┐                                              │
│  │ User Profile │  age, gender, height, weight, goal,          │
│  │ Input        │  activity, food preference, budget, allergies│
│  └──────┬───────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                              │
│  │ Macro        │  BMR (Mifflin-St Jeor) → TDEE → Goal-based  │
│  │ Calculator   │  calorie adjustment → Macro split            │
│  └──────┬───────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                              │
│  │ Prompt       │  Structured prompt with user data +          │
│  │ Engineering  │  JSON schema + Indian food context           │
│  └──────┬───────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                              │
│  │ Gemini API   │  gemini-1.5-flash model                      │
│  │ Call         │  Temperature: 0.7, structured output         │
│  └──────┬───────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                              │
│  │ Response     │  Parse JSON → Validate → Store in MongoDB    │
│  │ Parser       │  Return to client                            │
│  └──────────────┘                                              │
└────────────────────────────────────────────────────────────────┘
```

### AI Prompt Inputs → Outputs

| **Inputs**      | **Outputs**            |
| --------------- | ---------------------- |
| Age             | Daily calorie target   |
| Height (cm)     | Macro split (P/C/F)    |
| Weight (kg)     | Meal timing schedule   |
| Fitness goal    | Indian food meals      |
| Activity level  | Per-food macro data    |
| Food preference | Water intake target    |
| Budget          | Nutrition tips         |
| Allergies       | Supplement suggestions |

---

## 5. Database Architecture

### Collections & Relationships

```text
┌──────────────────┐
│     Users         │
│  _id (ObjectId)   │◄──────────────────────────────────┐
│  firebaseUid      │                                    │
│  name, email      │                                    │
│  profile data     │                                    │
└────────┬─────────┘                                    │
         │                                              │
         │ userId (FK)                                  │
         ▼                                              │
┌──────────────────┐  ┌──────────────────┐  ┌──────────┴───────┐
│     Meals         │  │     Goals         │  │   Progress       │
│  _id              │  │  _id              │  │  _id              │
│  userId ──────────│  │  userId ──────────│  │  userId ──────────│
│  date             │  │  targetCalories   │  │  weightHistory[]  │
│  meals[] {        │  │  targetProtein    │  │  calorieHistory[] │
│    type           │  │  targetCarbs      │  │  waterHistory[]   │
│    foods[] {      │  │  targetFats       │  │                   │
│      name         │  │  targetWeight     │  └───────────────────┘
│      calories     │  │  targetWater      │
│      protein      │  └──────────────────┘
│      carbs, fats  │
│    }              │  ┌──────────────────┐
│    totalCalories  │  │   DietPlans       │
│  }                │  │  _id              │
│  dailyTotals{}    │  │  userId ──────────│
└──────────────────┘  │  plan {}           │
                       │  createdAt         │
                       └──────────────────┘
```

### Indexing Strategy

| Collection | Index                     | Type     | Purpose                     |
| ---------- | ------------------------- | -------- | --------------------------- |
| Users      | `{ email: 1 }`            | Unique   | Login lookups               |
| Users      | `{ firebaseUid: 1 }`      | Unique   | Firebase auth linking       |
| Meals      | `{ userId: 1, date: -1 }` | Compound | Fast user+date meal queries |
| Goals      | `{ userId: 1 }`           | Unique   | One goal set per user       |
| Progress   | `{ userId: 1 }`           | Unique   | One progress doc per user   |

---

## 6. Security Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                            │
│                                                              │
│  Layer 1: Transport Security                                 │
│  ├── HTTPS (TLS 1.3) — All traffic encrypted                │
│  └── HSTS headers enforced                                   │
│                                                              │
│  Layer 2: Request Security                                   │
│  ├── Helmet — Security headers (CSP, X-Frame, etc.)         │
│  ├── CORS — Whitelist allowed origins                        │
│  ├── Rate Limiting — 100 req/min per IP                      │
│  └── Request size limit — 10MB max payload                   │
│                                                              │
│  Layer 3: Authentication                                     │
│  ├── Firebase Auth — Identity verification                   │
│  ├── JWT Access Token — API authorization (15 min expiry)    │
│  └── Refresh Token — Secure rotation                         │
│                                                              │
│  Layer 4: Input Security                                     │
│  ├── express-validator / Zod — Schema validation             │
│  ├── express-mongo-sanitize — NoSQL injection prevention     │
│  └── XSS Clean — Script injection prevention                │
│                                                              │
│  Layer 5: Application Security                               │
│  ├── Bcrypt password hashing (salt rounds: 12)               │
│  ├── Parameterized MongoDB queries                           │
│  ├── Error masking in production                             │
│  └── Secure environment variable management                  │
│                                                              │
│  Layer 6: Monitoring                                         │
│  ├── Winston structured logging                              │
│  ├── Sentry error tracking                                   │
│  └── Firebase Crashlytics (mobile)                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Notification Architecture

```text
Backend Cron Job (Daily 8:00 AM)
       │
       ▼
Query users with FCM tokens + pending reminders
       │
       ▼
Firebase Cloud Messaging (FCM)
       │
       ├── Meal reminder: "Time to log breakfast! 🍳"
       ├── Water reminder: "Don't forget to drink water! 💧"
       ├── Goal check:     "You're 200 cal short of your goal! 💪"
       └── Streak alert:   "5-day streak! Keep going! 🔥"
       │
       ▼
User Device Push Notification
```

---

## 8. Offline Architecture

```text
┌─────────────────────────────────────────────────┐
│                  ONLINE MODE                     │
│                                                  │
│  User Action → API Call → Server → MongoDB       │
│                                    │             │
│                                    ▼             │
│                              TanStack Query      │
│                              Cache (in-memory)   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  OFFLINE MODE                    │
│                                                  │
│  User Action → Offline Queue (AsyncStorage)      │
│                     │                            │
│                     ▼                            │
│  Read from TanStack Query persisted cache        │
│                                                  │
│  ── Network restored ──                          │
│                     │                            │
│                     ▼                            │
│  Sync queue → Replay in order → Clear queue      │
│  Invalidate stale queries → Refresh from server  │
└─────────────────────────────────────────────────┘
```

---

## 9. Scalability Strategy

### Backend Scaling

| Strategy           | Implementation                                    |
| ------------------ | ------------------------------------------------- |
| Stateless APIs     | No server-side sessions; JWT-based auth           |
| Horizontal scaling | Multiple Node.js instances behind load balancer   |
| Redis caching      | Cache frequent queries (user goals, food search)  |
| API batching       | Combine related requests to reduce round trips    |
| Connection pooling | Mongoose connection pool (default: 5 connections) |

### Database Scaling

| Strategy           | Implementation                                          |
| ------------------ | ------------------------------------------------------- |
| Indexing           | Compound indexes on hot query paths                     |
| Aggregation        | Pre-computed analytics via MongoDB aggregation pipeline |
| Pagination         | Cursor-based pagination for large datasets              |
| Atlas auto-scaling | M10+ tier with auto-scaling enabled                     |

### Frontend Optimization

| Strategy           | Implementation                                 |
| ------------------ | ---------------------------------------------- |
| Query caching      | TanStack Query with 5-min stale time           |
| Virtualized lists  | FlatList with `windowSize` optimization        |
| Image optimization | Cloudinary auto-format + responsive transforms |
| Lazy loading       | Dynamic imports for heavy screens              |
| Memoization        | `React.memo` + `useMemo` for expensive renders |

---

## 10. DevOps & Deployment

```text
┌──────────────────────────────────────────────────┐
│                  CI/CD PIPELINE                   │
│                                                   │
│  GitHub Repository                                │
│       │                                           │
│       ├── Push to main → Backend auto-deploy      │
│       │   └── Render / Railway                    │
│       │                                           │
│       ├── Push to main → EAS Build trigger        │
│       │   ├── iOS → TestFlight → App Store        │
│       │   └── Android → Internal → Play Store     │
│       │                                           │
│       └── PR → Run lint + tests                   │
│                                                   │
│  Infrastructure                                   │
│  ├── Backend: Render / Railway / AWS EC2          │
│  ├── Database: MongoDB Atlas (M0 → M10)           │
│  ├── Storage: Cloudinary                          │
│  ├── Auth: Firebase                               │
│  └── Monitoring: Sentry + Firebase Crashlytics    │
└──────────────────────────────────────────────────┘
```

---

## 11. MVP Phased Roadmap

| Phase   | Duration | Deliverables                                               |
| ------- | -------- | ---------------------------------------------------------- |
| Phase 1 | 3 weeks  | Auth, Meal tracking, Goal tracking, Dashboard, Spoonacular |
| Phase 2 | 2 weeks  | AI diet generation, AI meal suggestions, Streak system     |
| Phase 3 | 2 weeks  | Barcode scanner, Food image analysis, Google Fit (future)  |
| Phase 4 | 1 week   | Premium features, AdMob, Payment integration               |

---

## 12. Monetization Model

| Tier    | Features                                      | Price      |
| ------- | --------------------------------------------- | ---------- |
| Free    | Basic calorie tracking, meal logging, 3 goals | Free       |
| Premium | AI diet plans, AI coach, advanced analytics,  | ₹199/month |
|         | food image analysis, unlimited saved diets    | ₹1499/year |

**Revenue Streams:** Subscriptions · AdMob · Affiliate fitness products · Premium coaching

---

## 13. Future Vision

```text
Phase 5+: Ecosystem Expansion

  Nutrivora AI
       │
       ├── AI Fitness Coach (workout + nutrition)
       ├── Smart Grocery Planner (auto-generated lists)
       ├── Wearable Integration (Google Fit, Apple Health)
       ├── Community Challenges (streaks, competitions)
       ├── Food Image Recognition (camera → nutrition)
       └── Social Fitness Network (share meals, compete)
```

---

## 14. Documentation Index

| Document                             | Description                            |
| ------------------------------------ | -------------------------------------- |
| [Readme.md](./Readme.md)             | Project overview, features, tech stack |
| [Architecture.md](./Architecture.md) | This document — system architecture    |
| [api.md](./api.md)                   | Complete API endpoint reference        |
| [frontend.md](./frontend.md)         | Frontend architecture & implementation |
| [backend.md](./backend.md)           | Backend architecture & implementation  |

---

_Last updated: 2026-06-01_
