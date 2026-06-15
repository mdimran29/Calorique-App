# Frontend Architecture — Nutrivora AI (Calorique)

> Complete frontend implementation guide for agents and developers.

---

## Technology Stack

| Layer              | Technology              | Version   | Purpose                          |
| ------------------ | ----------------------- | --------- | -------------------------------- |
| Framework          | React Native            | ^0.73     | Cross-platform mobile UI         |
| Tooling            | Expo SDK                | ^51       | Build, dev server, native APIs   |
| Language           | TypeScript              | ^5.0      | Type safety                      |
| Styling            | NativeWind              | ^4.0      | Tailwind CSS for React Native    |
| State Management   | Zustand                 | ^4.5      | Lightweight global state         |
| Server State       | TanStack Query (v5)     | ^5.0      | API caching, mutations, sync     |
| Navigation         | React Navigation        | ^6.x      | Stack, Tab, Drawer navigation    |
| Forms              | React Hook Form         | ^7.0      | Form state & validation          |
| Validation         | Zod                     | ^3.22     | Schema validation                |
| HTTP Client        | Axios                   | ^1.6      | API requests with interceptors   |
| Charts             | react-native-chart-kit  | ^6.12     | Dashboard visualizations         |
| SVG                | react-native-svg        | ^15.0     | SVG rendering                    |
| Camera/Scanner     | expo-camera             | ^15.0     | Barcode scanning                 |
| Animations         | react-native-reanimated | ^3.6      | Fluid animations                 |
| Icons              | @expo/vector-icons      | ^14.0     | Icon library                     |
| Secure Storage     | expo-secure-store       | ^13.0     | Encrypted token storage          |
| Image Picker       | expo-image-picker       | ^15.0     | Photo capture/selection          |

---

## Architecture Pattern — Feature-Based Scalable Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     APP ENTRY (App.tsx)                   │
│        Providers: QueryClient, Auth, Navigation          │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌───────────────┐
   │ Auth Flow   │ │ Onboard  │ │ Main App      │
   │ (Stack Nav) │ │ (Stack)  │ │ (Tab Nav)     │
   └─────────────┘ └──────────┘ └──────┬────────┘
                                       │
                    ┌──────┬──────┬─────┼──────┐
                    ▼      ▼      ▼     ▼      ▼
                 Home   Meals   Goals  AI    Profile
                 Tab    Tab     Tab    Tab    Tab
                    │      │      │     │      │
                    ▼      ▼      ▼     ▼      ▼
               Screens  Screens  ...   ...   Screens
                    │
            ┌───────┼───────┐
            ▼       ▼       ▼
         Components  Hooks  Store
```

---

## Folder Structure (Detailed)

```bash
src/
│
├── api/                           # API layer — Axios instance + endpoint functions
│   ├── client.ts                  # Axios instance with base URL, interceptors, token refresh
│   ├── auth.api.ts                # login(), register(), refreshToken()
│   ├── meals.api.ts               # getMeals(), createMeal(), updateMeal(), deleteMeal()
│   ├── goals.api.ts               # getGoals(), setGoals()
│   ├── ai.api.ts                  # generateDiet(), getMealSuggestions()
│   ├── nutrition.api.ts           # searchFood(), getBarcode() via Spoonacular/OFF
│   ├── user.api.ts                # getProfile(), updateProfile(), uploadAvatar()
│   └── progress.api.ts            # getProgress(), logWeight()
│
├── assets/                        # Static assets
│   ├── images/                    # App images, illustrations
│   ├── fonts/                     # Custom font files
│   └── animations/                # Lottie animation files
│
├── components/                    # Reusable UI components
│   ├── common/                    # Shared primitives
│   │   ├── Button.tsx             # Primary, secondary, outline variants
│   │   ├── Input.tsx              # Text input with label, error display
│   │   ├── Card.tsx               # Elevated card container
│   │   ├── LoadingSpinner.tsx     # Activity indicator wrapper
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   ├── Toast.tsx              # In-app notification toast
│   │   ├── Modal.tsx              # Reusable modal wrapper
│   │   ├── Avatar.tsx             # User avatar with fallback
│   │   ├── ProgressBar.tsx        # Linear progress indicator
│   │   └── EmptyState.tsx         # Empty list placeholder
│   │
│   ├── charts/                    # Chart components
│   │   ├── CalorieChart.tsx       # Daily calorie intake ring/bar chart
│   │   ├── MacroChart.tsx         # Protein/Carbs/Fats pie chart
│   │   ├── WeeklyTrendChart.tsx   # 7-day calorie trend line chart
│   │   ├── WeightProgressChart.tsx# Weight over time line chart
│   │   └── WaterIntakeChart.tsx   # Water intake progress visual
│   │
│   ├── meals/                     # Meal-specific components
│   │   ├── MealCard.tsx           # Single meal entry display
│   │   ├── FoodItem.tsx           # Individual food item row
│   │   ├── MealTypeSelector.tsx   # Breakfast/Lunch/Dinner/Snack tabs
│   │   ├── FoodSearchBar.tsx      # Autocomplete food search
│   │   ├── NutritionLabel.tsx     # Macro breakdown display
│   │   └── BarcodeScanner.tsx     # Camera barcode scanning UI
│   │
│   ├── dashboard/                 # Dashboard widgets
│   │   ├── CalorieSummary.tsx     # Today's calorie summary ring
│   │   ├── MacroProgress.tsx      # Macro progress bars
│   │   ├── WaterTracker.tsx       # Water intake tracker
│   │   ├── StreakBadge.tsx        # Streak counter display
│   │   ├── QuickLog.tsx          # Quick meal log shortcut
│   │   └── AISuggestionCard.tsx  # AI meal suggestion widget
│   │
│   └── ai/                        # AI-related components
│       ├── DietPlanCard.tsx       # Generated diet plan display
│       ├── MealSuggestion.tsx     # AI meal suggestion item
│       └── AICoachChat.tsx        # AI coach chat interface
│
├── screens/                       # Screen components (one per route)
│   ├── auth/
│   │   ├── LoginScreen.tsx        # Google login + email login
│   │   ├── RegisterScreen.tsx     # Email registration form
│   │   └── ForgotPasswordScreen.tsx
│   │
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx      # App intro slides
│   │   ├── GoalSelectScreen.tsx   # Select fitness goal
│   │   ├── ProfileSetupScreen.tsx # Age, height, weight, preferences
│   │   └── AllergiesScreen.tsx    # Allergy selection
│   │
│   ├── home/
│   │   └── DashboardScreen.tsx    # Main dashboard with all widgets
│   │
│   ├── meals/
│   │   ├── MealListScreen.tsx     # Today's meals list
│   │   ├── AddMealScreen.tsx      # Log new meal form
│   │   ├── FoodSearchScreen.tsx   # Search food database
│   │   ├── BarcodeScanScreen.tsx  # Barcode scanner camera
│   │   └── MealDetailScreen.tsx   # Meal detail + edit
│   │
│   ├── goals/
│   │   ├── GoalOverviewScreen.tsx # Current goals summary
│   │   └── SetGoalScreen.tsx      # Set/update nutrition goals
│   │
│   ├── ai/
│   │   ├── DietGeneratorScreen.tsx# AI diet generation form
│   │   ├── DietResultScreen.tsx   # Generated diet plan display
│   │   └── AICoachScreen.tsx      # Interactive AI coach chat
│   │
│   └── profile/
│       ├── ProfileScreen.tsx      # User profile display
│       ├── EditProfileScreen.tsx  # Edit profile form
│       ├── SettingsScreen.tsx     # App settings
│       └── ProgressScreen.tsx     # Weight/calorie history charts
│
├── navigation/                    # Navigation configuration
│   ├── AppNavigator.tsx           # Root navigator (auth check)
│   ├── AuthNavigator.tsx          # Auth stack (Login → Register)
│   ├── OnboardingNavigator.tsx    # Onboarding flow stack
│   ├── MainTabNavigator.tsx       # Bottom tab navigator (Home, Meals, AI, Goals, Profile)
│   ├── MealStackNavigator.tsx     # Meal screens stack
│   └── types.ts                   # Navigation param type definitions
│
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                 # Authentication state & actions
│   ├── useMeals.ts                # TanStack Query hooks for meals API
│   ├── useGoals.ts                # TanStack Query hooks for goals API
│   ├── useAI.ts                   # TanStack Query mutations for AI endpoints
│   ├── useNutrition.ts            # Food search hooks (Spoonacular)
│   ├── useProgress.ts             # Progress/analytics hooks
│   ├── useDebounce.ts             # Input debounce utility hook
│   └── useNetworkStatus.ts        # Online/offline status
│
├── store/                         # Zustand global state stores
│   ├── authStore.ts               # User session, tokens, login state
│   ├── mealStore.ts               # Current day meal cache for offline
│   ├── settingsStore.ts           # Theme, language, notification preferences
│   └── onboardingStore.ts         # Onboarding completion state
│
├── services/                      # Business logic services
│   ├── authService.ts             # Firebase auth + token management
│   ├── storageService.ts          # SecureStore token read/write
│   ├── notificationService.ts     # FCM token registration + handling
│   └── offlineService.ts          # Offline queue + sync manager
│
├── types/                         # TypeScript type definitions
│   ├── user.types.ts              # User, UserProfile interfaces
│   ├── meal.types.ts              # Meal, FoodItem, MealEntry interfaces
│   ├── goal.types.ts              # Goal interface
│   ├── ai.types.ts                # DietPlan, MealSuggestion interfaces
│   ├── api.types.ts               # ApiResponse, PaginatedResponse generics
│   └── navigation.types.ts        # Navigation param list types
│
├── utils/                         # Utility functions
│   ├── formatters.ts              # Date, number, calorie formatters
│   ├── validators.ts              # Zod schemas for form validation
│   ├── colors.ts                  # Color palette constants
│   ├── constants.ts               # App-wide constants
│   ├── macroUtils.ts              # Macro percentage calculators
│   └── dateUtils.ts               # Date manipulation helpers
│
├── styles/                        # Global styles
│   ├── theme.ts                   # Color tokens, spacing, typography
│   └── global.css                 # NativeWind global styles
│
└── App.tsx                        # App entry — providers, fonts, splash
```

---

## State Management Strategy

### Zustand (Client State)

Used for **synchronous, client-only state** that doesn't come from the server:

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

### TanStack Query (Server State)

Used for **all server data** — meals, goals, progress, AI responses:

```typescript
// hooks/useMeals.ts
export function useTodayMeals() {
  return useQuery({
    queryKey: ['meals', 'today', formatDate(new Date())],
    queryFn: () => mealsApi.getMeals({ date: formatDate(new Date()) }),
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes cache
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mealsApi.createMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}
```

### State Ownership Rules

| Data Type             | Owner          | Rationale                              |
| --------------------- | -------------- | -------------------------------------- |
| User session/tokens   | Zustand        | Auth state is client-side only         |
| Theme/settings        | Zustand        | User preferences, no server sync      |
| Meals list            | TanStack Query | Server data with caching               |
| Goals                 | TanStack Query | Server data, infrequent updates        |
| AI diet plans         | TanStack Query | Server-generated, cacheable            |
| Form inputs           | React Hook Form| Local to form lifecycle                |
| Onboarding progress   | Zustand        | Client-only flow state                 |

---

## Navigation Architecture

```text
AppNavigator (conditional root)
│
├── IF !authenticated:
│   └── AuthNavigator (Stack)
│       ├── LoginScreen
│       ├── RegisterScreen
│       └── ForgotPasswordScreen
│
├── IF authenticated && !onboarded:
│   └── OnboardingNavigator (Stack)
│       ├── WelcomeScreen
│       ├── GoalSelectScreen
│       ├── ProfileSetupScreen
│       └── AllergiesScreen
│
└── IF authenticated && onboarded:
    └── MainTabNavigator (Bottom Tabs)
        ├── Home Tab → DashboardScreen
        ├── Meals Tab → MealStackNavigator
        │   ├── MealListScreen
        │   ├── AddMealScreen
        │   ├── FoodSearchScreen
        │   ├── BarcodeScanScreen
        │   └── MealDetailScreen
        ├── AI Tab → AIStackNavigator
        │   ├── DietGeneratorScreen
        │   ├── DietResultScreen
        │   └── AICoachScreen
        ├── Goals Tab → GoalStackNavigator
        │   ├── GoalOverviewScreen
        │   └── SetGoalScreen
        └── Profile Tab → ProfileStackNavigator
            ├── ProfileScreen
            ├── EditProfileScreen
            ├── SettingsScreen
            └── ProgressScreen
```

---

## API Client Architecture

```typescript
// api/client.ts — Axios instance with automatic token refresh

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const { data } = await axios.post(`${CONFIG.API_BASE_URL}/auth/refresh`, { refreshToken });
      await SecureStore.setItemAsync('accessToken', data.data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

---

## Offline Strategy

```text
User Action (e.g., log meal)
        │
        ├── Online?
        │   ├── YES → Send to API → Update TanStack Query cache
        │   └── NO  → Save to offline queue (AsyncStorage)
        │              │
        │              ▼
        │         App comes online (NetInfo listener)
        │              │
        │              ▼
        │         Sync queue → Replay API calls
        │              │
        │              ▼
        │         Clear queue + refresh cache
```

### Offline-Capable Features
- Meal logging (queued)
- View cached meals/goals
- View cached nutrition data
- Browse saved diet plans

### Online-Only Features
- AI diet generation
- Food search (Spoonacular)
- Barcode scanning (OpenFoodFacts)
- Profile sync

---

## Theming & Design System

```typescript
// utils/colors.ts
export const COLORS = {
  primary:     '#4CAF50',  // Green — health/nutrition theme
  primaryDark: '#388E3C',
  secondary:   '#FF9800',  // Orange — energy/calories
  accent:      '#2196F3',  // Blue — hydration
  background:  '#F5F5F5',
  surface:     '#FFFFFF',
  text:        '#212121',
  textLight:   '#757575',
  error:       '#F44336',
  success:     '#4CAF50',
  warning:     '#FFC107',
  border:      '#E0E0E0',

  // Macro colors
  protein:     '#E91E63',
  carbs:       '#FF9800',
  fats:        '#9C27B0',
  fiber:       '#795548',

  // Dark mode
  darkBg:      '#121212',
  darkSurface: '#1E1E1E',
  darkText:    '#E0E0E0',
};
```

---

## Build & Deployment

| Target     | Tool             | Command                              |
| ---------- | ---------------- | ------------------------------------ |
| Dev Server | Expo CLI         | `npx expo start`                     |
| iOS Build  | EAS Build        | `eas build --platform ios`           |
| Android    | EAS Build        | `eas build --platform android`       |
| Preview    | EAS Update       | `eas update --branch preview`        |
| Production | EAS Submit       | `eas submit --platform all`          |

---

*Last updated: 2026-06-01*
