# Backend Architecture — Nutrivora AI (Calorique)

> Complete backend implementation guide for agents and developers.

---

## Technology Stack

| Layer              | Technology              | Version   | Purpose                          |
| ------------------ | ----------------------- | --------- | -------------------------------- |
| Runtime            | Node.js                 | ≥ 18 LTS  | JavaScript server runtime        |
| Framework          | Express.js              | ^4.18     | HTTP server & routing            |
| Language           | TypeScript              | ^5.0      | Type safety                      |
| Database           | MongoDB Atlas           | 7.x       | Document store                   |
| ODM                | Mongoose                | ^7.0      | MongoDB object modeling          |
| Authentication     | Firebase Admin SDK      | ^12.0     | Token verification               |
| JWT                | jsonwebtoken            | ^9.0      | Access/refresh token management  |
| Password Hashing   | bcryptjs                | ^2.4      | Password encryption              |
| Validation         | express-validator / Zod | latest    | Input sanitization & validation  |
| File Upload        | Multer                  | ^1.4      | Multipart form handling          |
| Cloud Storage      | Cloudinary              | ^1.41     | Image/file storage               |
| AI Engine          | @google/generative-ai   | latest    | Gemini API SDK                   |
| Security           | Helmet                  | ^7.0      | HTTP security headers            |
| Rate Limiting      | express-rate-limit      | ^7.0      | API throttling                   |
| CORS               | cors                    | ^2.8      | Cross-origin configuration       |
| Logging            | Winston                 | ^3.11     | Structured logging               |
| Scheduler          | node-cron               | ^3.0      | Background cron jobs             |
| Notifications      | firebase-admin (FCM)    | ^12.0     | Push notifications               |

---

## Architecture Pattern — Clean Modular Architecture

The backend follows a **layered architecture** with strict separation of concerns:

```text
┌─────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  MIDDLEWARE LAYER                                    │
│  ┌──────────┐ ┌────────────┐ ┌───────────────────┐  │
│  │ Helmet   │ │ Rate Limit │ │ CORS              │  │
│  └──────────┘ └────────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌────────────┐ ┌───────────────────┐  │
│  │ Auth JWT │ │ Validation │ │ Mongo Sanitize    │  │
│  └──────────┘ └────────────┘ └───────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  ROUTE LAYER                                         │
│  Defines HTTP verb + path → Controller mapping       │
│  /api/v1/auth/*  /api/v1/meals/*  /api/v1/goals/*   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  CONTROLLER LAYER                                    │
│  Handles HTTP request/response                       │
│  Extracts params, calls service, returns JSON        │
│  NO business logic here                              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  SERVICE LAYER                                       │
│  Contains ALL business logic                         │
│  Orchestrates repositories & external APIs           │
│  Handles data transformation                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  REPOSITORY LAYER                                    │
│  Pure database operations (CRUD)                     │
│  Mongoose queries only — no business logic           │
│  Returns raw documents                               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  DATABASE (MongoDB Atlas)                            │
└─────────────────────────────────────────────────────┘
```

### Layer Rules

| Layer        | Allowed Dependencies                | Forbidden                            |
| ------------ | ----------------------------------- | ------------------------------------ |
| Routes       | Controllers                         | Services, Repositories, Models       |
| Controllers  | Services, Validation middleware     | Repositories, Models, DB queries     |
| Services     | Repositories, External APIs, Utils  | req/res objects, HTTP concepts       |
| Repositories | Mongoose Models                     | Services, Controllers, External APIs |

---

## Folder Structure (Detailed)

```bash
server/
│
├── config/
│   ├── db.ts                  # MongoDB Atlas connection (Mongoose)
│   ├── firebase.ts            # Firebase Admin SDK initialization
│   ├── cloudinary.ts          # Cloudinary configuration
│   ├── gemini.ts              # Google Gemini AI client setup
│   └── env.ts                 # Environment variable loader & validator
│
├── constants/
│   ├── httpStatus.ts          # HTTP status code constants
│   ├── errorCodes.ts          # Application error code enums
│   ├── mealTypes.ts           # 'breakfast' | 'lunch' | 'dinner' | 'snack'
│   ├── goals.ts               # Goal type constants
│   └── activityLevels.ts      # Activity level enums
│
├── controllers/
│   ├── auth.controller.ts     # register, login, refreshToken
│   ├── meal.controller.ts     # getMeals, createMeal, updateMeal, deleteMeal
│   ├── goal.controller.ts     # getGoals, setGoals
│   ├── ai.controller.ts       # generateDiet, mealSuggestions
│   ├── user.controller.ts     # getProfile, updateProfile, uploadAvatar
│   └── progress.controller.ts # getProgress, logWeight, getAnalytics
│
├── middleware/
│   ├── auth.middleware.ts     # JWT verification & user injection
│   ├── validate.middleware.ts # Request body/params validation runner
│   ├── error.middleware.ts    # Global error handler
│   ├── rateLimiter.middleware.ts # Rate limiting config
│   └── upload.middleware.ts   # Multer file upload config
│
├── models/
│   ├── User.model.ts          # User schema & model
│   ├── Meal.model.ts          # Meal schema & model
│   ├── Goal.model.ts          # Goal schema & model
│   ├── Progress.model.ts      # Progress/weight history schema
│   ├── DietPlan.model.ts      # AI-generated diet plan storage
│   └── RefreshToken.model.ts  # Refresh token storage
│
├── repositories/
│   ├── user.repository.ts     # User CRUD operations
│   ├── meal.repository.ts     # Meal CRUD + date range queries
│   ├── goal.repository.ts     # Goal CRUD + upsert
│   ├── progress.repository.ts # Progress history operations
│   └── dietPlan.repository.ts # Diet plan CRUD
│
├── routes/
│   ├── index.ts               # Route aggregator — mounts all sub-routes
│   ├── auth.routes.ts         # /api/v1/auth/*
│   ├── meal.routes.ts         # /api/v1/meals/*
│   ├── goal.routes.ts         # /api/v1/goals/*
│   ├── ai.routes.ts           # /api/v1/ai/*
│   ├── user.routes.ts         # /api/v1/users/*
│   └── progress.routes.ts     # /api/v1/progress/*
│
├── services/
│   ├── auth.service.ts        # Firebase verify, JWT create, user lookup
│   ├── meal.service.ts        # Meal logging business logic + totals calc
│   ├── goal.service.ts        # Goal management + macro calculations
│   ├── ai.service.ts          # Gemini prompt builder + response parser
│   ├── nutrition.service.ts   # Spoonacular API + OpenFoodFacts integration
│   ├── notification.service.ts# FCM push notification sender
│   └── progress.service.ts    # Analytics aggregation + trend calculations
│
├── validations/
│   ├── auth.validation.ts     # register/login body schemas
│   ├── meal.validation.ts     # meal create/update schemas
│   ├── goal.validation.ts     # goal create schemas
│   ├── ai.validation.ts       # diet generation input schemas
│   └── common.validation.ts   # Shared validators (objectId, pagination)
│
├── jobs/
│   ├── reminder.job.ts        # Daily meal/water reminder cron
│   ├── streak.job.ts          # Streak calculation cron
│   └── cleanup.job.ts         # Expired token cleanup cron
│
├── utils/
│   ├── ApiError.ts            # Custom error class with status codes
│   ├── ApiResponse.ts         # Standardized response helper
│   ├── asyncHandler.ts        # Express async error wrapper
│   ├── logger.ts              # Winston logger setup
│   ├── tokenUtils.ts          # JWT sign/verify helpers
│   └── macroCalculator.ts     # BMR/TDEE/macro calculation utilities
│
├── types/
│   ├── express.d.ts           # Express Request augmentation (req.user)
│   ├── env.d.ts               # process.env type definitions
│   └── api.types.ts           # Shared API type interfaces
│
├── app.ts                     # Express app setup (middleware + routes)
├── server.ts                  # HTTP server entry point
├── .env.example               # Environment variable template
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies & scripts
```

---

## Database Schema Design (Mongoose Models)

### User Model

```typescript
// models/User.model.ts
const UserSchema = new Schema({
  firebaseUid:    { type: String, required: true, unique: true, index: true },
  name:           { type: String, required: true, minlength: 2, maxlength: 50 },
  email:          { type: String, required: true, unique: true, lowercase: true },
  avatar:         { type: String, default: null },  // Cloudinary URL
  age:            { type: Number, min: 13, max: 120 },
  gender:         { type: String, enum: ['male', 'female', 'other'] },
  height:         { type: Number },       // cm
  weight:         { type: Number },       // kg
  goal:           { type: String, enum: ['muscle_gain', 'fat_loss', 'maintain', 'lean_bulk'] },
  activityLevel:  { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
  foodPreference: { type: String, enum: ['veg', 'non_veg', 'vegan', 'eggetarian'] },
  allergies:      { type: [String], default: [] },
  targetWeight:   { type: Number },
  budget:         { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  profileComplete:{ type: Boolean, default: false },
  isPremium:      { type: Boolean, default: false },
  fcmToken:       { type: String },       // Firebase Cloud Messaging token
  streak:         { type: Number, default: 0 },
  lastActiveDate: { type: Date },
}, { timestamps: true });

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ firebaseUid: 1 });
```

### Meal Model

```typescript
// models/Meal.model.ts
const FoodItemSchema = new Schema({
  name:           { type: String, required: true },
  quantity:       { type: Number, required: true },
  unit:           { type: String, required: true },
  calories:       { type: Number, required: true },
  protein:        { type: Number, required: true },
  carbs:          { type: Number, required: true },
  fats:           { type: Number, required: true },
  fiber:          { type: Number, default: 0 },
  spoonacularId:  { type: Number },
}, { _id: false });

const MealEntrySchema = new Schema({
  type:           { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  foods:          { type: [FoodItemSchema], required: true },
  totalCalories:  { type: Number, required: true },
  totalProtein:   { type: Number, required: true },
  totalCarbs:     { type: Number, required: true },
  totalFats:      { type: Number, required: true },
  loggedAt:       { type: Date, default: Date.now },
});

const MealSchema = new Schema({
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:           { type: String, required: true },  // 'YYYY-MM-DD' format
  meals:          { type: [MealEntrySchema], default: [] },
  dailyTotals: {
    calories:     { type: Number, default: 0 },
    protein:      { type: Number, default: 0 },
    carbs:        { type: Number, default: 0 },
    fats:         { type: Number, default: 0 },
  },
}, { timestamps: true });

// Compound index for fast user+date queries
MealSchema.index({ userId: 1, date: -1 });
```

### Goal Model

```typescript
// models/Goal.model.ts
const GoalSchema = new Schema({
  userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  targetCalories:   { type: Number, required: true },
  targetProtein:    { type: Number, required: true },
  targetCarbs:      { type: Number, required: true },
  targetFats:       { type: Number, required: true },
  targetWeight:     { type: Number },
  targetWaterIntake:{ type: Number, default: 3 },  // liters
}, { timestamps: true });

GoalSchema.index({ userId: 1 });
```

### Progress Model

```typescript
// models/Progress.model.ts
const WeightEntrySchema = new Schema({
  weight:   { type: Number, required: true },
  date:     { type: String, required: true },
}, { _id: false });

const ProgressSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  weightHistory:   { type: [WeightEntrySchema], default: [] },
  calorieHistory:  [{ date: String, calories: Number }],
  waterHistory:    [{ date: String, liters: Number }],
}, { timestamps: true });

ProgressSchema.index({ userId: 1 });
```

---

## Environment Variables

```bash
# .env.example

# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nutrivora?retryWrites=true&w=majority

# JWT
JWT_ACCESS_SECRET=<random-256-bit-string>
JWT_REFRESH_SECRET=<random-256-bit-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=nutrivora-xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@nutrivora-xxxxx.iam.gserviceaccount.com

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# Spoonacular
SPOONACULAR_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

---

## Key Service Implementations

### AI Service — Gemini Prompt Engineering

```typescript
// services/ai.service.ts — Core prompt builder pattern

class AIService {
  async generateDietPlan(userProfile: UserProfile): Promise<DietPlan> {
    const prompt = this.buildDietPrompt(userProfile);
    const response = await geminiModel.generateContent(prompt);
    return this.parseDietResponse(response);
  }

  private buildDietPrompt(profile: UserProfile): string {
    return `
      You are an expert Indian nutritionist. Generate a detailed daily meal plan.

      User Profile:
      - Age: ${profile.age}, Gender: ${profile.gender}
      - Height: ${profile.height}cm, Weight: ${profile.weight}kg
      - Goal: ${profile.goal}
      - Activity Level: ${profile.activityLevel}
      - Food Preference: ${profile.foodPreference}
      - Budget: ${profile.budget}
      - Allergies: ${profile.allergies.join(', ') || 'None'}

      Requirements:
      1. Calculate TDEE and recommend calorie target
      2. Provide macro split (protein/carbs/fats in grams)
      3. Generate ${profile.mealsPerDay || 4} meals with Indian foods
      4. Include exact calories and macros per food item
      5. Add water intake recommendation
      6. Include supplement suggestions if needed

      Return as structured JSON matching this schema:
      { dailyCalories, macros: { protein, carbs, fats },
        waterIntake, meals: [{ type, time, foods: [{ name, quantity,
        calories, protein, carbs, fats }], mealCalories }],
        tips: [], supplements: [] }
    `;
  }
}
```

### Macro Calculator Utility

```typescript
// utils/macroCalculator.ts

export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2, light: 1.375, moderate: 1.55,
    active: 1.725, very_active: 1.9
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
}

export function calculateMacros(tdee: number, goal: string) {
  const adjustments = {
    muscle_gain:  { calories: tdee + 300,  protein: 0.35, carbs: 0.40, fats: 0.25 },
    fat_loss:     { calories: tdee - 500,  protein: 0.40, carbs: 0.30, fats: 0.30 },
    lean_bulk:    { calories: tdee + 200,  protein: 0.30, carbs: 0.45, fats: 0.25 },
    maintain:     { calories: tdee,        protein: 0.30, carbs: 0.40, fats: 0.30 },
  };
  const adj = adjustments[goal] || adjustments.maintain;
  return {
    calories: adj.calories,
    protein: Math.round((adj.calories * adj.protein) / 4),
    carbs: Math.round((adj.calories * adj.carbs) / 4),
    fats: Math.round((adj.calories * adj.fats) / 9),
  };
}
```

---

## Security Implementation

| Layer              | Implementation                                     |
| ------------------ | -------------------------------------------------- |
| Helmet             | Sets security headers (CSP, X-Frame, HSTS)         |
| Rate Limiting      | 100 req/min per IP via `express-rate-limit`         |
| CORS               | Whitelist mobile app origins                        |
| Input Validation   | Zod / express-validator on every route              |
| Mongo Sanitize     | `express-mongo-sanitize` prevents NoSQL injection   |
| JWT Auth           | RS256 signed tokens with short expiry               |
| Firebase Verify    | Admin SDK verifies Firebase ID tokens server-side   |
| Error Masking      | Production errors return generic messages           |
| Logging            | Winston structured logs with request IDs            |

---

## Background Jobs (Cron)

| Job               | Schedule       | Purpose                                  |
| ----------------- | -------------- | ---------------------------------------- |
| `reminder.job`    | Every day 8AM  | Send meal/water reminder push via FCM    |
| `streak.job`      | Every day 12AM | Calculate and update user streaks        |
| `cleanup.job`     | Every day 3AM  | Remove expired refresh tokens from DB    |

---

## NPM Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src/ --ext .ts",
    "seed": "ts-node src/seeds/index.ts"
  }
}
```

---

## Deployment

| Target            | Service            | Notes                                |
| ----------------- | ------------------ | ------------------------------------ |
| Primary           | Render / Railway   | Auto-deploy from GitHub `main`       |
| Alternative       | AWS EC2 + PM2      | For production scale                 |
| Database          | MongoDB Atlas      | M0 free tier → M10 production       |
| File Storage      | Cloudinary         | Free tier: 25GB bandwidth            |
| Monitoring        | Sentry + Winston   | Error tracking + structured logging  |

---

*Last updated: 2026-06-01*
