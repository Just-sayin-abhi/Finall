# NIVARANA - Ayurvedic Diet Management Platform

## Overview

NIVARANA is a personalized Ayurvedic diet management platform that combines ancient Ayurvedic wellness principles with modern web technology. Users discover their unique dosha constitution (Vata, Pitta, Kapha) through a 30-question assessment quiz, set health goals, and receive tiered food recommendations personalized to their body type and objectives.

The platform guides users through:
1. Email-based authentication and profile creation
2. Onboarding with health metrics collection (age, gender, height, weight, activity level → BMI and maintenance calorie calculation)
3. A 30-question dosha assessment quiz (10 questions per dosha, 0-4 rating scale)
4. Health goal selection (heart health, gut health, inflammation, immunity, diabetes, skin/hair, weight management, sleep, energy, liver function)
5. Personalized food recommendations organized in tiers based on dosha and health goals
6. An AI-powered Ayurvedic dietician chatbot for meal planning guidance
7. An AI-generated single-day meal plan with macro breakdowns, portion guidance, and dosha-specific reasoning

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, built with Vite

**UI Component Library**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS

**Styling**:
- Tailwind CSS with extensive custom CSS variables supporting light/dark themes
- Earthy, nature-inspired color palette with dosha-specific colors (vata, pitta, kapha) and tier colors
- Typography: Playfair Display (serif) for headings, Inter (sans-serif) for body text
- Custom `ThemeProvider` component with localStorage persistence

**State Management**: TanStack Query (React Query) for all server state. No client-side state management library — local component state with `useState` for UI state.

**Routing**: Wouter (lightweight client-side router). Routes are conditionally rendered based on authentication status — unauthenticated users see the Landing page, authenticated users get Dashboard, Onboarding, Quiz, Results, Health Goals, and Food List pages.

**Key Client Pages** (in `RetailFlowLog/client/src/pages/`):
- `Landing.tsx` — Marketing page with login dialog (email-based auth)
- `Onboarding.tsx` — Multi-step profile form (3 steps: personal info, measurements, activity level)
- `DoshaQuiz.tsx` — 30-question assessment with progress bar
- `DoshaResults.tsx` — Dosha constitution breakdown display
- `HealthGoals.tsx` — Health goal selection interface
- `FoodList.tsx` — Tiered food recommendations with search/filter and chatbot integration
- `WellnessCheckin.tsx` — 8-marker wellness self-rating quiz (1-5 scale per marker + optional notes), used as both baseline and follow-up re-evaluations
- `WellnessProgress.tsx` — Comparison view: baseline vs latest with bar chart, per-marker delta cards, overall score, and trend line for 3+ check-ins

**Path Aliases**:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets/`

### Backend Architecture

**Framework**: Express.js with TypeScript, run via `tsx`

**Entry Point**: `RetailFlowLog/server/index.ts` — creates Express app with HTTP server

**API Design**: RESTful endpoints under `/api` namespace:
- `POST /api/login` — Email-based authentication (creates/gets user, establishes session)
- `GET /api/auth/user` — Get current authenticated user
- `GET /api/profile` / `POST /api/profile` — User health profile CRUD
- `GET /api/dosha-assessment` / `POST /api/dosha-assessment` — Dosha quiz results
- `POST /api/health-goals` — Save health goal selection
- `GET /api/foods` — Get filtered/tiered food recommendations
- `POST /api/mealplan` — AI-powered 7-day meal plan generation via OpenAI (gpt-5.1); validates profile completeness, builds structured prompts, returns JSON with 7 `DayPlan` objects (5 meals each), macros, portion, dosha rationale, substitutions, hydration, weekly strategy, and optional clinician note
- Chat integration routes under `/api/conversations`
- `GET /api/wellness-checkins` / `POST /api/wellness-checkin` — Wellness re-evaluation check-ins; first one is baseline, subsequent ones are follow-ups for tracking improvement after following the diet plan

**Meal Plan Module** (`RetailFlowLog/server/mealPlanBuilder.ts`): Isolated module with:
- `buildSystemPrompt()` — Expert clinical nutritionist persona with strict JSON output rules
- `buildUserPrompt(ctx)` — Builds context-rich prompt from profile, dosha, and preferences
- `validateProfileCompleteness(ctx)` — Checks required fields before API call
- `callOpenAIForMealPlan(sys, user)` — OpenAI call, temperature 0.3, max 8000 tokens
- `parseMealPlanResponse(raw)` — Strips markdown fences, JSON parses, validates all 7 days × 5 meals

**Authentication**: Simple email-based session authentication (not OAuth). Uses `express-session` with `memorystore` for session storage. No password — email serves as the user identifier. Session lasts 1 week.

**Food Filtering Logic** (`RetailFlowLog/server/foodFilter.ts`): Categorizes ~100+ foods into tiers based on:
- Single dosha: 3 tiers (favourable → neutral → unfavourable)
- Dual dosha: 5 tiers (both favourable → mixed → unfavourable)
- Health goal filtering: Additional tier refinement based on selected health goals

**Data**: Food dataset stored as static JSON (`RetailFlowLog/server/data/food_dataset.json`) with dosha effects and health goal effects per food item.

### Database

**Database**: PostgreSQL via `node-postgres` (`pg` package)

**ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver

**Schema** (defined in `RetailFlowLog/shared/schema.ts`):
- `sessions` — Express session storage (sid, sess JSON, expire)
- `users` — User accounts (id as UUID, email, firstName, lastName, profileImageUrl, timestamps)
- `user_profiles` — Health metrics (age, gender, heightCm, weightKg, bmi, maintenanceCalories, activityLevel, onboardingComplete flag)
- `dosha_assessments` — Quiz results (vata/pitta/kapha scores and percentages, primary/secondary dosha, constitution type, individual responses as JSON)
- `user_health_goals` — Selected health goal per user
- `wellness_checkins` — Re-evaluation check-ins (8 markers scored 1-5: energy, digestion, sleep, mood, mentalClarity, skinHealth, immunity, calmness; plus auto-computed overallScore, checkinNumber, optional notes)
- `conversations` / `messages` — Chat integration tables (from Replit AI integrations)

**Migrations**: Drizzle Kit manages migrations in `RetailFlowLog/migrations/`. Config in `RetailFlowLog/drizzle.config.ts`. Push command: `npm run db:push`.

**Connection**: Requires `DATABASE_URL` environment variable.

### Build System

**Development**: `tsx server/index.ts` with Vite dev server middleware (HMR via `/vite-hmr` path)

**Production Build**: Custom build script (`RetailFlowLog/script/build.ts`) that:
1. Builds client with Vite → `dist/public/`
2. Bundles server with esbuild → `dist/index.cjs`
3. Selectively bundles certain server deps (allowlist) to reduce cold start times

**Important**: The working application code is inside the `RetailFlowLog/` directory. The root `package.json` contains some shared dependencies but the main app package.json is `RetailFlowLog/package.json`. All dev/build commands should be run from the `RetailFlowLog/` directory.

### Replit Integration Files

The `.replit_integration_files/` directory contains pre-built Replit AI integration modules:
- **Chat** — OpenAI-powered chat with conversation persistence (used in the app)
- **Audio** — Voice recording, streaming playback, and speech-to-text capabilities
- **Image** — Image generation via `gpt-image-1`
- **Batch** — Rate-limited batch processing utilities with retry logic

These integrations use `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables.

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Express session secret (falls back to `dev_secret_key`)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key for chat/AI features (via Replit AI integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (via Replit AI integrations)

### Key npm Dependencies
- **Frontend**: React, Wouter, TanStack Query, Radix UI, shadcn/ui, Tailwind CSS, Lucide icons, date-fns, recharts
- **Backend**: Express, express-session, memorystore, node-postgres (pg), Drizzle ORM, dotenv, nanoid
- **Shared**: Zod (validation), drizzle-zod (schema-to-zod bridge)
- **AI**: OpenAI SDK (for chat integration)
- **Build**: Vite, esbuild, tsx, TypeScript

### Third-Party Services
- **PostgreSQL** — Primary data store (Neon serverless driver available as fallback)
- **OpenAI API** — Powers the Ayurvedic dietician chatbot and AI integrations
- **Google Fonts** — Playfair Display and Inter font families loaded from CDN