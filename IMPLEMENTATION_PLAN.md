# Calorique — Implementation Plan (Market-Research Roadmap)

> Derived from `MARKET_RESEARCH.md` (2026-07-17). Sequenced build plan across the 11 recommended features, mapped onto the **actual codebase**: Express + TypeScript + Mongoose (controller → service → repository) backend, React + Vite + TanStack Query + Zustand frontend, wrapped in **Capacitor** for app-store + native health/camera access.

---

## 0. Platform decision (do this first — everything depends on it)

Your Frontend is a **React + Vite web app**, not native. Several Tier-1 features are only cleanly possible natively. Decision: **wrap the existing React app in Capacitor**. This reuses 100% of your UI while unlocking native camera, HealthKit / Health Connect, and real push.

**Phase 0 — Capacitor shell (1 week, blocking prerequisite for Tier 1)**

1. `npm i @capacitor/core @capacitor/cli && npx cap init` in `Frontend/`.
2. Add platforms: `npx cap add android` (start here — Health Connect + your Indian market) then `npx cap add ios`.
3. Wire the Vite `dist/` build into Capacitor (`webDir: "dist"`, `npm run build && npx cap sync`).
4. Verify the existing app runs inside the shell on a device/emulator before touching anything else.
5. Move Firebase web push → `@capacitor/push-notifications` (native FCM) so notifications keep working in the wrapped app.

**Why first:** Health sync (Feature 1), camera (Feature 2), and reliable push all sit on top of Capacitor. Building them against the pure web app would be throwaway work.

---

## Architecture conventions (apply to every feature below)

Every backend feature follows your existing layering. When you add a feature, you add one slice through all layers:

```
model → repository → service → controller → route (register in routes/index.ts)
```

Frontend follows: `api/` (axios call) → `services/` → TanStack Query hook in `hooks/` → Zustand store slice if it's global state → component in `app/components/`.

Keep the AI work in `services/ai.service.ts` + `config/gemini.ts`. Keep Indian-food logic in `services/indianFoods.service.ts` + `data/indianFoods.json`.

---

## The build order at a glance

| # | Feature | Tier | Depends on | Effort |
| - | ------- | ---- | ---------- | ------ |
| 0 | Capacitor shell | Prereq | — | S |
| 1 | Wearable / health-platform sync | 1 | 0 | M |
| 2 | AI food-photo recognition (single item) | 1 | 0 | M |
| 3 | Exercise / workout logging | 1 | — | M |
| 4 | Natural-language meal logging | 1 | — | S–M |
| 5 | Household-measure logging + regional tagging | 2 | 4 | M |
| 6 | Budget-aware grocery list + substitutions | 2 | — | M |
| 7 | Explainable adaptive calorie targets | 2 | 1, 3 | M |
| 8 | Thali / multi-item plate photo segmentation | 3 | 2, 5 | L |
| 9 | Small-group accountability pods | 3 | 3 | L |
| 10 | Festival / fasting-aware diet adjustments | 3 | — | M |
| 11 | Family / household meal-scaling mode | 3 | 5 | M |

**Rule of thumb:** finish everything in Tier 1 before starting Tier 2, and Tier 2 before Tier 3. Within a tier, features with no dependency arrows can be built in parallel by different people.

---

## TIER 1 — Close table-stakes gaps

*Goal: stop feeling "behind." These are features every serious 2026 competitor already ships; their absence reads as "incomplete" to reviewers.*

### Feature 1 — Wearable / health-platform sync
**What:** pull steps, active calories, and (optionally) weight/heart-rate from Google Health Connect (Android) and Apple HealthKit (iOS); write your logged calories back so the OS health hub stays in sync.

- **Native:** `@capacitor-community/health-connect` (Android) + a HealthKit Capacitor plugin (iOS). Request read scopes for steps/active-energy/weight; write scope for dietary energy.
- **Backend:** new `HealthSync` model + repository/service/controller; route `/api/health/sync`. Store daily `steps`, `activeCalories`, `source`, `syncedAt` per user/date. Reconcile against the existing `Meal.dailyTotals`.
- **Frontend:** `hooks/useHealthSync.ts` — request permissions on first open, sync on app foreground, surface "steps today / active kcal" on the dashboard.
- **Done when:** steps from the phone appear on the dashboard and adjust the day's energy balance.

### Feature 2 — AI food-photo recognition (single item, Indian-tuned)
**What:** point camera at one dish → get name + estimated macros, pre-filled into the meal logger.

- **Native:** `@capacitor/camera` for capture. Upload via your existing `upload.middleware.ts` + Cloudinary.
- **Backend:** extend `ai.service.ts` with `recognizeFoodFromImage()` using **Gemini vision** (`config/gemini.ts` already wired). Prompt tuned for Indian food; cross-reference the result against `indianFoods.json` for macro accuracy before trusting the model's numbers. New route `POST /api/ai/recognize-food`.
- **Frontend:** camera button in the meal-log flow → preview → confirm/edit macros → save as a normal `IFoodItem`.
- **Done when:** a photo of e.g. dal produces an editable, save-ready food item.

### Feature 3 — Exercise / workout logging
**What:** log workouts and burned calories; feed them into the daily energy balance.

- **Backend:** new `Workout` model (`type`, `durationMin`, `caloriesBurned`, `exercises[]`, `loggedAt`), plus repository/service/controller and `/api/workouts`. Seed a small exercise library (`data/exercises.json`) with MET-based calorie estimation in a `workoutCalculator.ts` util (mirrors your `macroCalculator.ts`).
- **Frontend:** a "Log workout" flow + a workouts card on the dashboard; net-calories = intake − BMR-adjusted − exercise.
- **Note:** once Feature 1 lands, prefer synced active-calories over manual estimates when both exist.
- **Done when:** a logged workout reduces the day's net calories.

### Feature 4 — Natural-language meal logging
**What:** user types "2 rotis and dal" → parsed into structured food items with macros. No dependency on native — ship it on web too.

- **Backend:** `ai.service.ts` → `parseMealFromText()` using Gemini structured output (return an `IFoodItem[]`). Resolve quantities/units against `indianFoods.json` first, Spoonacular second. New route `POST /api/ai/parse-meal`.
- **Frontend:** a text box above the food search; parsed items drop into the same review/confirm UI as Feature 2.
- **Done when:** free text becomes editable food items ready to save.
- **Sets up Feature 5** — the parser is where household-measure units get interpreted.

---

## TIER 2 — Differentiate (Calorique's moat)

*Goal: lead, don't follow. These lean on assets competitors don't have — your curated Indian dataset, your `budget` param, your AI coach.*

### Feature 5 — Household-measure logging + regional cuisine tagging
**What:** log in "2 roti + 1 katori dal," not grams. Tag foods by region (Punjabi/Bengali/South Indian/Gujarati/Maharashtrian).

- **Data:** extend `indianFoods.json` entries with `householdUnits` (katori/chamach/roti → gram conversions) and a `region` tag.
- **Backend:** `indianFoods.service.ts` resolves household units → grams → macros. The Feature-4 parser reuses this directly.
- **Frontend:** unit dropdowns default to household measures for Indian foods; region filter in food search.
- **Done when:** "1 katori dal" logs correct macros without the user touching grams.

### Feature 6 — Budget-aware grocery list + cost-saving substitutions
**What:** turn an AI diet plan into a costed grocery list + "swap paneer → soya, save ₹40/day, same protein" suggestions. **Nearly unclaimed angle.**

- **Data:** add a `costPerUnit` (₹) field to foods; a substitution table keyed on macro-equivalence.
- **Backend:** `ai.service.ts` → `generateGroceryList()` + `suggestSubstitutions()`; extend the existing `DietPlan` model with `estimatedCost` and `groceryList`. Routes under `/api/ai`.
- **Frontend:** grocery list view off the diet plan; inline substitution chips with the ₹ delta.
- **Done when:** a generated plan shows a total cost and at least one money-saving swap.

### Feature 7 — Explainable adaptive calorie targets
**What:** MacroFactor's adaptive-TDEE, but the **AI coach explains the change** in plain language. Combines data-rigor + Noom-style transparency — no competitor does both.

- **Backend:** `adaptiveTdee.ts` util — weekly recompute of real TDEE from logged weight trend (`Progress` model) + intake (`Meal`) + activity (Features 1/3). A `node-cron` job (you already depend on `node-cron`) recalculates weekly and updates `Goal`. `ai.service.ts` → `explainTargetChange()` writes the coach message into `ChatMessage`.
- **Frontend:** a "targets updated" coach card explaining the why; keep `Goal` history so users see the trend.
- **Done when:** after a week of data, targets shift and the coach explains why in one sentence.

---

## TIER 3 — Longer-term differentiation & retention

*Goal: category-leading features and the retention layer. Build last — they depend on Tier 1/2 foundations and carry the most complexity.*

### Feature 8 — Thali / multi-item plate photo segmentation
**What:** one photo of a thali → dal + sabzi + roti + rice recognized as **separate** items, each with macros. Leapfrogs HealthifyMe's single-dish limitation.

- Extends Feature 2's `recognizeFoodFromImage()` to return an **array** of items with per-item bounding hints; each resolved against `indianFoods.json` (Feature 5's household units make portions realistic). Route `POST /api/ai/recognize-plate`.
- **Done when:** a thali photo yields multiple editable items in one pass.

### Feature 9 — Small-group accountability pods
**What:** private 3–5 person pods sharing streaks + weekly summaries (not a public feed — avoids moderation/spam cost). Captures Strava/Fittr's proven retention driver.

- **Backend:** `Pod` model (members, invites), `PodSummary` aggregation; `/api/pods`. Reuse `streakCalculator.ts`.
- **Frontend:** pod screen + weekly digest; opt-in sharing of streaks/summaries only.
- **Done when:** a user can create a pod, invite members, and see each member's weekly streak.

### Feature 10 — Festival / fasting-aware diet adjustments
**What:** AI plan auto-adjusts around Navratri / Ramadan / Ekadashi etc. — completely unaddressed in every app reviewed.

- **Data:** a festival/fasting calendar (`data/festivals.json`) with per-occasion diet rules.
- **Backend:** `ai.service.ts` factors active occasions into diet generation; post-festival calorie correction.
- **Done when:** on a fasting day the plan reflects fasting-appropriate food + macro adjustment.

### Feature 11 — Family / household meal-scaling mode
**What:** log one family dish once → auto-scale macros per family member by portion/goal. No reviewed app supports this.

- **Backend:** `HouseholdMember` sub-model on `User`; a scaling util distributes one cooked dish across members by portion share; writes a `Meal` entry per member.
- **Done when:** one logged family dish produces correct per-member macro entries.

---

## Where to start, in one line

**0 → 1/2/3/4 (Tier 1) → 5/6/7 (Tier 2) → 8/9/10/11 (Tier 3).**
Start with the Capacitor shell this week; it's the gate for the two highest-impact catch-up features (health sync + photo logging). Finish natural-language logging (Feature 4) inside Tier 1 because Tier-2 Feature 5 builds directly on its parser. Save the social pods and multi-item plate segmentation for last — highest complexity, and they depend on foundations laid in the earlier tiers.

## Suggested team split (if more than one dev)

- **Dev A (native/platform):** Feature 0 → 1 → 2 → 8.
- **Dev B (backend/data):** Feature 3 → 4 → 5 → 6.
- **Dev C or shared:** Feature 7 → 9 → 10 → 11.

## First concrete tickets

1. `chore: init Capacitor, add Android platform, run existing app in shell`
2. `feat(health): HealthSync model + /api/health/sync + useHealthSync hook`
3. `feat(ai): recognizeFoodFromImage via Gemini vision + /api/ai/recognize-food`
4. `feat(workouts): Workout model + workoutCalculator + /api/workouts`
5. `feat(ai): parseMealFromText + /api/ai/parse-meal`
