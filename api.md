# API Reference — Nutrivora AI (Calorique)

> Complete API documentation for agents and developers. All endpoints are RESTful and follow JSON:API conventions.

---

## Base Configuration

| Property        | Value                              |
| --------------- | ---------------------------------- |
| Base URL        | `https://api.nutrivora.app/api/v1` |
| Protocol        | HTTPS (TLS 1.3)                    |
| Content-Type    | `application/json`                 |
| API Versioning  | URL path prefix `/api/v1`          |
| Rate Limit      | 100 requests/min per user          |
| Max Payload     | 10 MB                              |

---

## Authentication

### Overview

Nutrivora uses a **dual-layer authentication** model:

1. **Firebase Authentication** — Client-side identity provider (Google OAuth, Email/Password).
2. **JWT Access Tokens** — Server-issued tokens for API authorization.

### Auth Flow

```text
Client (React Native)
    │
    ├─► Firebase SDK authenticates user
    │      │
    │      ▼
    │   Firebase ID Token (short-lived)
    │      │
    │      ▼
    ├─► POST /api/v1/auth/login  { firebaseToken }
    │      │
    │      ▼
    │   Backend verifies Firebase token via Admin SDK
    │      │
    │      ▼
    │   Issues JWT access token + refresh token
    │      │
    │      ▼
    └─► All subsequent requests include:
           Authorization: Bearer <jwt_access_token>
```

### Token Specification

| Token          | Lifetime | Storage              | Purpose            |
| -------------- | -------- | -------------------- | ------------------ |
| Firebase Token | 1 hour   | Firebase SDK (auto)  | Identity proof     |
| Access Token   | 15 min   | Secure memory        | API authorization  |
| Refresh Token  | 30 days  | Secure HTTP-only cookie / encrypted storage | Token renewal |

---

## Auth Routes

### `POST /api/v1/auth/register`

Register a new user account after Firebase authentication.

**Request Body:**
```json
{
  "firebaseToken": "string (required) — Firebase ID token",
  "name": "string (required) — User display name, 2-50 chars",
  "email": "string (required) — Valid email address",
  "age": "number (optional) — Age in years, 13-120",
  "gender": "string (optional) — 'male' | 'female' | 'other'",
  "height": "number (optional) — Height in cm",
  "weight": "number (optional) — Weight in kg",
  "activityLevel": "string (optional) — 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'",
  "goal": "string (optional) — 'muscle_gain' | 'fat_loss' | 'maintain' | 'lean_bulk'",
  "foodPreference": "string (optional) — 'veg' | 'non_veg' | 'vegan' | 'eggetarian'",
  "allergies": ["string (optional) — Array of allergy names"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "ObjectId",
      "name": "string",
      "email": "string",
      "profileComplete": false,
      "createdAt": "ISO 8601 timestamp"
    },
    "accessToken": "string — JWT access token",
    "refreshToken": "string — JWT refresh token"
  }
}
```

**Error Responses:**
| Code | Condition                          |
| ---- | ---------------------------------- |
| 400  | Validation error / missing fields  |
| 401  | Invalid Firebase token             |
| 409  | Email already registered           |
| 500  | Internal server error              |

---

### `POST /api/v1/auth/login`

Authenticate an existing user with their Firebase token.

**Request Body:**
```json
{
  "firebaseToken": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "...user object" },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

---

### `POST /api/v1/auth/refresh`

Refresh an expired access token using the refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string — New JWT access token"
  }
}
```

---

## Meal Routes

> All meal routes require `Authorization: Bearer <token>` header.

### `GET /api/v1/meals`

Retrieve meals for the authenticated user. Supports date filtering and pagination.

**Query Parameters:**
| Param    | Type   | Default | Description                      |
| -------- | ------ | ------- | -------------------------------- |
| date     | string | today   | ISO date `YYYY-MM-DD`           |
| page     | number | 1       | Page number                      |
| limit    | number | 10      | Results per page (max 50)        |
| startDate| string | —       | Range start `YYYY-MM-DD`        |
| endDate  | string | —       | Range end `YYYY-MM-DD`          |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "meals": [
      {
        "_id": "ObjectId",
        "userId": "ObjectId",
        "date": "2026-06-01",
        "meals": [
          {
            "type": "breakfast",
            "foods": [
              {
                "name": "Oats with Banana",
                "quantity": 1,
                "unit": "bowl",
                "calories": 350,
                "protein": 12,
                "carbs": 55,
                "fats": 8,
                "fiber": 6
              }
            ],
            "totalCalories": 350,
            "totalProtein": 12,
            "totalCarbs": 55,
            "totalFats": 8
          }
        ],
        "dailyTotals": {
          "calories": 1850,
          "protein": 120,
          "carbs": 200,
          "fats": 60
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 30,
      "pages": 3
    }
  }
}
```

---

### `POST /api/v1/meals`

Log a new meal entry.

**Request Body:**
```json
{
  "date": "string (optional) — ISO date, defaults to today",
  "type": "string (required) — 'breakfast' | 'lunch' | 'dinner' | 'snack'",
  "foods": [
    {
      "name": "string (required)",
      "quantity": "number (required)",
      "unit": "string (required) — 'g' | 'ml' | 'piece' | 'bowl' | 'cup' | 'plate'",
      "calories": "number (required)",
      "protein": "number (required)",
      "carbs": "number (required)",
      "fats": "number (required)",
      "fiber": "number (optional)",
      "spoonacularId": "number (optional) — If from Spoonacular API"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Meal logged successfully",
  "data": { "meal": { "...meal object" } }
}
```

---

### `PUT /api/v1/meals/:id`

Update an existing meal entry. Only the owner can update.

**URL Params:** `id` — Meal document `_id`

**Request Body:** Same schema as POST (partial updates allowed).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meal updated successfully",
  "data": { "meal": { "...updated meal object" } }
}
```

---

### `DELETE /api/v1/meals/:id`

Delete a meal entry. Only the owner can delete.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meal deleted successfully"
}
```

---

## Goal Routes

### `GET /api/v1/goals`

Retrieve the active nutrition goals for the authenticated user.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "goals": {
      "_id": "ObjectId",
      "userId": "ObjectId",
      "targetCalories": 2200,
      "targetProtein": 150,
      "targetCarbs": 250,
      "targetFats": 65,
      "targetWeight": 75,
      "targetWaterIntake": 3.5,
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp"
    }
  }
}
```

---

### `POST /api/v1/goals`

Create or update nutrition goals. Upserting — if goals exist, they are replaced.

**Request Body:**
```json
{
  "targetCalories": "number (required) — 800-6000",
  "targetProtein": "number (required) — 20-500 grams",
  "targetCarbs": "number (required) — 20-800 grams",
  "targetFats": "number (required) — 10-300 grams",
  "targetWeight": "number (optional) — in kg",
  "targetWaterIntake": "number (optional) — in liters"
}
```

---

## AI Routes

### `POST /api/v1/ai/generate-diet`

Generate a complete personalized AI diet plan using Gemini API.

**Request Body:**
```json
{
  "age": "number (required)",
  "gender": "string (required) — 'male' | 'female' | 'other'",
  "height": "number (required) — cm",
  "weight": "number (required) — kg",
  "goal": "string (required) — 'muscle_gain' | 'fat_loss' | 'maintain' | 'lean_bulk'",
  "activityLevel": "string (required) — 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'",
  "foodPreference": "string (required) — 'veg' | 'non_veg' | 'vegan' | 'eggetarian'",
  "budget": "string (optional) — 'low' | 'medium' | 'high'",
  "allergies": ["string (optional)"],
  "mealsPerDay": "number (optional) — 3-6, default 4"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "dailyCalories": 2200,
      "macros": {
        "protein": 150,
        "carbs": 250,
        "fats": 65
      },
      "waterIntake": "3.5 liters",
      "meals": [
        {
          "type": "breakfast",
          "time": "8:00 AM",
          "foods": [
            {
              "name": "Paneer Paratha",
              "quantity": "2 pieces",
              "calories": 450,
              "protein": 18,
              "carbs": 40,
              "fats": 22
            }
          ],
          "mealCalories": 450
        }
      ],
      "tips": ["string — AI-generated nutrition tips"],
      "supplements": ["string — Recommended supplements"]
    }
  }
}
```

> **Note:** This endpoint has a longer response time (5-15 seconds) due to Gemini API processing.

---

### `POST /api/v1/ai/meal-suggestions`

Get quick AI meal suggestions based on remaining macro targets.

**Request Body:**
```json
{
  "remainingCalories": "number (required)",
  "remainingProtein": "number (required)",
  "remainingCarbs": "number (required)",
  "remainingFats": "number (required)",
  "mealType": "string (required) — 'breakfast' | 'lunch' | 'dinner' | 'snack'",
  "foodPreference": "string (required)"
}
```

---

## Progress Routes (Future — Phase 2)

### `GET /api/v1/progress`

Retrieve weight, calorie, and water history for analytics charts.

### `POST /api/v1/progress/weight`

Log a daily weight entry.

### `GET /api/v1/progress/analytics`

Retrieve aggregated weekly/monthly analytics.

---

## Third-Party API Integration Reference

### Spoonacular API

| Property      | Value                                     |
| ------------- | ----------------------------------------- |
| Base URL      | `https://api.spoonacular.com`             |
| Auth          | API Key via `apiKey` query parameter      |
| Rate Limit    | 150 requests/day (free tier)              |
| Documentation | https://spoonacular.com/food-api/docs     |

**Used Endpoints:**
- `GET /food/ingredients/search` — Search food items
- `GET /food/ingredients/{id}/information` — Get nutrition data
- `GET /recipes/findByNutrients` — Find recipes by macro targets

### OpenFoodFacts API

| Property      | Value                                          |
| ------------- | ---------------------------------------------- |
| Base URL      | `https://world.openfoodfacts.org/api/v2`       |
| Auth          | None (open API)                                |
| Rate Limit    | 100 requests/min                               |
| Documentation | https://world.openfoodfacts.org/data           |

**Used Endpoints:**
- `GET /product/{barcode}.json` — Get product by barcode scan

### Google Gemini API

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Base URL      | `https://generativelanguage.googleapis.com/v1beta` |
| Auth          | API Key via header or query param      |
| Model         | `gemini-1.5-flash` (recommended)       |
| Documentation | https://ai.google.dev/docs             |

---

## Standard Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Error Codes Reference

| HTTP Code | Error Code           | Description                          |
| --------- | -------------------- | ------------------------------------ |
| 400       | VALIDATION_ERROR     | Request body validation failed       |
| 401       | UNAUTHORIZED         | Missing or invalid auth token        |
| 401       | TOKEN_EXPIRED        | JWT access token has expired         |
| 403       | FORBIDDEN            | Insufficient permissions             |
| 404       | NOT_FOUND            | Resource not found                   |
| 409       | CONFLICT             | Duplicate resource                   |
| 429       | RATE_LIMIT_EXCEEDED  | Too many requests                    |
| 500       | INTERNAL_ERROR       | Server error                         |
| 503       | SERVICE_UNAVAILABLE  | Third-party API down                 |

---

## Request Headers Reference

| Header          | Required | Description                        |
| --------------- | -------- | ---------------------------------- |
| Authorization   | Yes*     | `Bearer <jwt_token>` (* except auth routes) |
| Content-Type    | Yes      | `application/json`                 |
| X-Request-ID    | No       | UUID for request tracing           |
| X-Device-Type   | No       | `ios` or `android`                 |
| X-App-Version   | No       | Client app version string          |

---

## Pagination Convention

All list endpoints support cursor/offset pagination:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

*Last updated: 2026-06-01*
