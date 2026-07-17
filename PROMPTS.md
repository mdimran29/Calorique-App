# Calorique — Per-Task Build Prompts

> One self-contained prompt per unit of work from `IMPLEMENTATION_PLAN.md`. Each prompt is written to be pasted into a **fresh** AI coding session on its own — it repeats the context that task needs and names the exact files, layers, and acceptance criteria. Do them in numeric order (each assumes the ones before it are already merged).

## Shared context (every prompt already assumes this — no need to repeat it)

- **Backend:** Express + TypeScript + Mongoose in `Backend/src/`. Strict layering per feature: `model → repository → service → controller → route`, and register the route in `Backend/src/routes/index.ts`. Use the existing `utils/ApiError.ts`, `utils/ApiResponse.ts`, `utils/asyncHandler.ts`, `middleware/auth.middleware.ts`, and `middleware/validate.middleware.ts`. AI lives in `services/ai.service.ts` + `config/gemini.ts`. Indian-food logic lives in `services/indianFoods.service.ts` + `data/indianFoods.json`.
- **Frontend:** React + Vite in `Frontend/src/`. Flow per feature: `api/` (axios call) → `services/` → TanStack Query hook in `hooks/` → Zustand store slice in `store/` if global → component in `app/components/`. Wrapped in **Capacitor** for native.
- **Rule for every task:** match existing code style, keep the auth middleware on protected routes, and don't break existing endpoints. Show the acceptance check ("Done when") actually passing before you call it complete.

---

## Prompt 0 — Capacitor shell (do this first; blocks Features 1, 2)

```
Wrap the existing Calorique React + Vite web app (in Frontend/) in Capacitor so it can ship as a native Android and iOS app, without changing any existing UI or routes.

Do exactly this:
1. In Frontend/, install and init Capacitor: `npm i @capacitor/core @capacitor/cli` then `npx cap init` — app name "Calorique", a sensible bundle id like com.calorique.app.
2. Configure capacitor.config.ts with webDir: "dist" so it serves the Vite production build.
3. Add the Android platform first: `npx cap add android`. Then add iOS: `npx cap add ios`.
4. Wire the build flow: `npm run build && npx cap sync`. Document these commands in Frontend/README (or a new CAPACITOR.md).
5. Migrate push notifications from Firebase web push to `@capacitor/push-notifications` (native FCM) so the existing meal/water/goal/streak reminders keep working inside the wrapped app. Keep the backend FCM sending code unchanged; only change how the client registers for and receives the token.

Constraints: do NOT modify existing React components, routes, or the API layer beyond the push-registration change. The existing web app must still run with `npm run dev`.

Done when: the existing Calorique app builds and runs unchanged inside the Capacitor Android shell on an emulator/device, and push registration returns a native FCM token.
```

---

## Prompt 1 — Wearable / health-platform sync (Tier 1 · needs Prompt 0)

```
Add wearable/health-platform sync to Calorique: pull steps and active calories from Google Health Connect (Android) and Apple HealthKit (iOS), and write logged calories back so the OS health hub stays in sync. The app is already wrapped in Capacitor.

Native:
- Use `@capacitor-community/health-connect` for Android and a HealthKit Capacitor plugin for iOS.
- Request READ scopes for steps, active energy, and weight; request a WRITE scope for dietary energy.

Backend (Backend/src/, follow model → repository → service → controller → route):
- New Mongoose model `HealthSync` storing per user + per date: { userId, date (YYYY-MM-DD string, same format as Meal.date), steps, activeCalories, source, syncedAt }.
- Add healthSync.repository.ts, healthSync.service.ts, healthSync.controller.ts.
- New route file health.routes.ts with `POST /api/health/sync` (auth-protected, validated) that upserts a day's health data. Register it in routes/index.ts.
- The service must reconcile synced activeCalories against the existing Meal.dailyTotals so the day's energy balance = intake − active calories.

Frontend (Frontend/src/):
- New hook hooks/useHealthSync.ts: request permissions on first app open, sync on app foreground (Capacitor App resume event), and expose today's steps + active kcal.
- Surface "steps today" and "active kcal" on the dashboard.

Done when: steps pulled from the phone appear on the dashboard and adjust the day's net energy balance.
```

---

## Prompt 2 — AI food-photo recognition, single item (Tier 1 · needs Prompt 0)

```
Add single-item AI food-photo recognition to Calorique, tuned for Indian food. User points the camera at one dish and gets a name + estimated macros pre-filled into the meal logger. The app is wrapped in Capacitor.

Native/Frontend (Frontend/src/):
- Use `@capacitor/camera` to capture a photo from the meal-log flow.
- Add a camera button in the meal-log UI → capture → show preview → call the new backend endpoint → land the result in the existing confirm/edit-macros UI → save as a normal IFoodItem.

Backend (Backend/src/):
- Extend services/ai.service.ts with `recognizeFoodFromImage(imageUrl or buffer)` using Gemini VISION via the already-wired config/gemini.ts.
- Upload the image using the EXISTING middleware/upload.middleware.ts + Cloudinary config (config/cloudinary.ts).
- Prompt Gemini specifically for Indian food identification. IMPORTANT: after the model returns a dish name, cross-reference it against data/indianFoods.json (via services/indianFoods.service.ts) and prefer the dataset's macro values over the model's guessed numbers when there's a match.
- New route `POST /api/ai/recognize-food` in ai.routes.ts (auth-protected). Returns an editable IFoodItem-shaped object.

Constraint: the returned item must match the existing IFoodItem shape (name, quantity, unit, calories, protein, carbs, fats, fiber?) so it drops straight into the current meal logger.

Done when: a photo of dal produces an editable, save-ready food item pre-filled with macros.
```

---

## Prompt 3 — Exercise / workout logging (Tier 1 · no dependency)

```
Add exercise/workout logging to Calorique so workouts and burned calories feed into the daily energy balance.

Backend (Backend/src/, follow model → repository → service → controller → route):
- New Mongoose model `Workout`: { userId, type, durationMin, caloriesBurned, exercises: [{ name, sets?, reps?, durationMin? }], loggedAt, date (YYYY-MM-DD string matching Meal.date) }.
- Add workout.repository.ts, workout.service.ts, workout.controller.ts, and workout.routes.ts with CRUD under `/api/workouts` (auth-protected, validated). Register in routes/index.ts.
- Seed a small exercise library at data/exercises.json with a MET value per exercise.
- New util utils/workoutCalculator.ts (mirror the style of the existing utils/macroCalculator.ts) that estimates caloriesBurned from MET × bodyweight × duration.

Frontend (Frontend/src/):
- A "Log workout" flow (pick exercise from the library or free-form, enter duration) and a workouts card on the dashboard.
- Update the dashboard's net-calories math to: net = intake − BMR-adjusted maintenance − exercise burned.

Note for later: once health sync (Feature 1) exists, prefer the synced active-calories value over this manual estimate when both are present for a day — leave a clear TODO/hook for that, but don't implement the reconciliation here.

Done when: a logged workout reduces the day's net calories on the dashboard.
```

---

## Prompt 4 — Natural-language meal logging (Tier 1 · no dependency; sets up Feature 5)

```
Add natural-language meal logging to Calorique: the user types free text like "2 rotis and dal" and it's parsed into structured food items with macros. This must work on web too (no native dependency).

Backend (Backend/src/):
- Add `parseMealFromText(text)` to services/ai.service.ts using Gemini STRUCTURED OUTPUT so it returns a typed array matching the existing IFoodItem shape (name, quantity, unit, calories, protein, carbs, fats, fiber?).
- Resolution order for each parsed food: first try data/indianFoods.json via services/indianFoods.service.ts; fall back to the existing Spoonacular lookup only if there's no Indian-dataset match. Use the dataset macros when matched, not the model's guessed numbers.
- New route `POST /api/ai/parse-meal` in ai.routes.ts (auth-protected, validated body { text }). Returns IFoodItem[].

Frontend (Frontend/src/):
- Add a text input above the existing food search in the meal-log flow.
- On submit, call the endpoint and drop the parsed items into the SAME review/confirm UI already used elsewhere, so the user can edit before saving.

Design note: keep the unit-interpretation logic in one place — Feature 5 (household measures like katori/roti) will extend exactly this parser, so structure it to be extended, not rewritten.

Done when: typing "2 rotis and dal" produces editable food items ready to save.
```

---

## Prompt 5 — Household-measure logging + regional tagging (Tier 2 · needs Prompt 4)

```
Extend Calorique so Indian foods can be logged in household measures ("2 roti + 1 katori dal") instead of grams, and so foods carry a regional cuisine tag. Natural-language parsing (Feature 4) already exists — extend its unit interpretation, don't rewrite it.

Data (Backend/src/data/indianFoods.json):
- Add to each entry: `householdUnits` — a map of common Indian measures (katori, chamach, roti, glass, piece) to gram conversions — and a `region` tag from: Punjabi | Bengali | South Indian | Gujarati | Maharashtrian (allow more as needed).

Backend (Backend/src/):
- In services/indianFoods.service.ts, add resolution: household unit + quantity → grams → macros. The Feature-4 parser (parseMealFromText) must call THIS so "1 katori dal" resolves correctly through the same path as typed logging.

Frontend (Frontend/src/):
- In the meal-log unit dropdown, default to household measures for Indian foods (grams still available).
- Add a region filter in food search.

Done when: logging "1 katori dal" (via search or typed text) produces correct macros without the user ever entering grams.
```

---

## Prompt 6 — Budget grocery list + cost-saving substitutions (Tier 2 · no dependency)

```
Add budget-aware features to Calorique's AI diet plans: turn a generated plan into a costed grocery list, and suggest cheaper macro-equivalent swaps (e.g. "swap paneer → soya chunks, save ₹40/day, same protein").

Data (Backend/src/):
- Add a `costPerUnit` field (in ₹) to food entries in data/indianFoods.json.
- Create a substitution table (e.g. data/substitutions.json) keyed on macro-equivalence — each entry maps a food to cheaper alternatives with similar protein/calories.

Backend (Backend/src/):
- Extend the existing DietPlan model (models/DietPlan.model.ts) with `estimatedCost` (₹ total) and `groceryList` (array of { item, quantity, unit, cost }).
- Add to services/ai.service.ts: `generateGroceryList(dietPlan)` — aggregates plan foods into a shopping list with per-item ₹ cost and a total; and `suggestSubstitutions(dietPlan)` — returns money-saving swaps with the ₹/day delta and the macro it preserves.
- Expose both under `/api/ai` in ai.routes.ts (auth-protected). Reuse the existing DietPlan flow.

Frontend (Frontend/src/):
- A grocery-list view accessible from a generated diet plan, showing the total ₹ cost.
- Inline substitution chips on the plan showing the ₹ delta of each swap.

Done when: a generated diet plan shows a total cost and at least one money-saving substitution with its ₹/day saving.
```

---

## Prompt 7 — Explainable adaptive calorie targets (Tier 2 · needs Prompts 1 and 3)

```
Give Calorique adaptive calorie targets (MacroFactor-style TDEE recalibration) that the AI coach EXPLAINS in plain language — so targets aren't static after onboarding. Health sync (Feature 1) and workout logging (Feature 3) already provide activity data.

Backend (Backend/src/):
- New util utils/adaptiveTdee.ts: weekly recompute of the user's REAL TDEE from (a) logged weight trend in the Progress model, (b) intake from the Meal model, and (c) activity from HealthSync + Workout. Return the updated target calories/macros.
- Add a node-cron job (node-cron is already a dependency) that runs weekly per user, calls adaptiveTdee, and updates the Goal model. Keep a history of previous targets (add a small history array to the Goal model, or a lightweight GoalHistory record) so trends are visible.
- Add `explainTargetChange(oldGoal, newGoal, reason)` to services/ai.service.ts (Gemini) that writes a one-sentence plain-language explanation into the existing ChatMessage model as a coach message, e.g. "Your weight loss slowed this week, so I lowered your target by 80 kcal — here's why."

Frontend (Frontend/src/):
- A "targets updated" coach card that surfaces the explanation when targets change.
- Show the Goal history/trend so users see how targets moved over time.

Done when: after a week of logged data, the user's targets shift automatically AND the AI coach posts a one-sentence explanation of why.
```

---

## Prompt 8 — Thali / multi-item plate segmentation (Tier 3 · needs Prompts 2 and 5)

```
Upgrade Calorique's food-photo recognition from single-item to MULTI-item: one photo of a thali should return dal + sabzi + roti + rice as SEPARATE items, each with its own macros. Single-item recognition (Feature 2) and household-measure resolution (Feature 5) already exist.

Backend (Backend/src/):
- Extend the existing `recognizeFoodFromImage()` in services/ai.service.ts (or add a sibling `recognizePlateFromImage()`) so Gemini vision returns an ARRAY of items, each with a rough per-item location/bounding hint and estimated portion.
- Resolve each recognized item against data/indianFoods.json, and use Feature 5's household-measure conversions so portions come out realistic (e.g. "1 katori dal", "2 roti") rather than raw grams.
- New route `POST /api/ai/recognize-plate` in ai.routes.ts (auth-protected). Returns IFoodItem[].

Frontend (Frontend/src/):
- After capture, show all detected items in the confirm/edit UI at once; the user can edit or remove any before saving them together as one meal.

Done when: a photo of a mixed thali yields multiple separate, editable food items in a single pass.
```

---

## Prompt 9 — Small-group accountability pods (Tier 3 · needs Prompt 3)

```
Add small private "accountability pods" to Calorique for retention: 3–5 people (friends/family) sharing streaks and weekly summaries. This is NOT a public social feed — no public posts, no open community, to avoid moderation/spam burden.

Backend (Backend/src/, follow model → repository → service → controller → route):
- New model `Pod`: { name, members: [userId], invites: [{ email/code, status }], createdBy }. Cap membership at 5.
- New model or aggregation `PodSummary`: per-member weekly rollup (streak length, days logged, weight trend direction) — reuse the existing utils/streakCalculator.ts for streaks.
- Routes under `/api/pods` (auth-protected): create pod, invite member, accept invite, list my pods, get a pod's weekly summary. Register in routes/index.ts.
- Sharing is OPT-IN: a user chooses whether their streak/summary is visible to their pod.

Frontend (Frontend/src/):
- A pod screen listing members and their weekly streaks + a weekly digest view.
- Invite flow (share a code/link) and an opt-in toggle for what gets shared.

Done when: a user can create a pod, invite members, and see each member's weekly streak — with sharing off by default until opted in.
```

---

## Prompt 10 — Festival / fasting-aware diet adjustments (Tier 3 · no dependency)

```
Make Calorique's AI diet planning festival- and fasting-aware for Indian users: auto-adjust food suggestions and macros around occasions like Navratri, Ramadan, Ekadashi, and Karva Chauth, with a post-festival calorie correction. Today's date context: this is date-sensitive, so build it against a data-driven calendar, not hardcoded dates.

Data (Backend/src/data/):
- New data/festivals.json: a calendar of festivals/fasting days with, per occasion, the diet rule (e.g. fasting = specific allowed foods + reduced calories; festival = post-day correction guidance) and the date(s) or date-rule.

Backend (Backend/src/):
- In services/ai.service.ts, factor any ACTIVE occasion (from festivals.json, matched to the current date) into diet-plan generation: adjust allowed foods and macro targets for fasting days, and add post-festival calorie correction the day after a feast.
- Keep this composable with the existing diet generator — pass occasion context into the prompt, don't fork the generator.

Frontend (Frontend/src/):
- Surface when a plan has been adjusted for an occasion (a small banner/label: "Adjusted for Navratri fasting").

Done when: on a configured fasting day, the generated plan reflects fasting-appropriate foods and an adjusted macro target, and the day after a feast shows a correction.
```

---

## Prompt 11 — Family / household meal-scaling mode (Tier 3 · needs Prompt 5)

```
Add a household meal-scaling mode to Calorique for families who cook one dish for everyone: log one family dish once, and auto-scale the macros per family member based on each member's portion share and goals. Household-measure logging (Feature 5) already exists.

Backend (Backend/src/):
- Add a `HouseholdMember` sub-document to the User model (models/User.model.ts): { name, portionShare or relative appetite factor, individual goal reference }.
- New util that takes one cooked dish (total macros, using Feature 5's household-measure resolution) and distributes it across selected members by portion share, then writes a separate Meal entry per member with their share of the macros.
- Expose an endpoint (e.g. under /api/meals or a new /api/household route, auth-protected) to log a family dish and fan it out to members.

Frontend (Frontend/src/):
- A "family meal" logging option: pick the dish, pick which members ate, set portion shares (default even), and confirm — creating one meal entry per member.

Done when: logging one family dish produces correct per-member macro entries scaled by each member's portion share.
```

---

## Suggested order recap

`0 → (1 · 2 · 3 · 4) → (5 · 6 · 7) → (8 · 9 · 10 · 11)`

Within a tier, prompts with no cross-dependency (3, 4, 6, 10) can be run in parallel by different people/sessions. Everything else waits on its "needs" prompt being merged first.
