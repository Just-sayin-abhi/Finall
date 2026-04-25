# Nivarana

A personalised Ayurvedic nutrition and wellness platform. Nivarana combines ancient Ayurvedic principles with modern AI to deliver dosha-based food guidance, goal-specific meal plans, and longitudinal wellness tracking — all in one place.

---

## Features

### Dosha Assessment
A guided quiz determines the user's Prakriti (constitution) — Vata, Pitta, Kapha, or a dual combination — with percentage breakdowns used to personalise all downstream recommendations.

### Health Goals
Users select from 10 health goals (Heart Health, Gut Health, Weight Management, Immunity, Diabetes Management, etc.). The selected goal filters the food list and shapes AI-generated meal plans.

### Ayurvedic Food List
Foods are ranked into tiers (Highly Recommended → Avoid) based on the user's dosha and health goal. The list is filterable by category, tier, and search query.

### AI Meal Planner
Generates a fully personalised 7-day meal plan via OpenAI GPT-4o-mini. Each day includes breakfast, morning snack, lunch, evening snack, and dinner — each with dish name, ingredients, portion, macros, an Ayurvedic rationale, and substitution options.

- Meal plans are **persisted per user per health goal** — closing the dialog or refreshing the page does not lose the plan.
- Plans can be **downloaded as a formatted PDF** (cover page + one day per page with meal cards).

### Wellness Check-ins
Periodic re-evaluation across 8 markers (Energy, Digestion, Sleep, Mood, Mental Clarity, Skin & Hair, Immunity, Calmness). Scores are stored over time to track progress.

### Wellness Progress
Visual comparison of check-in scores across all sessions to show improvement trends.

### AI Diet Chatbot
An in-app chatbot for follow-up nutrition questions, powered by the server-side chat integration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | Wouter |
| State / Data | TanStack Query v5 |
| Styling | Tailwind CSS v3, shadcn/ui, Framer Motion |
| Backend | Node.js, Express |
| Database | PostgreSQL, Drizzle ORM |
| AI | OpenAI GPT-4o-mini |
| PDF | jsPDF |
| Auth | Session-based (express-session + connect-pg-simple) |
| Runtime | tsx (dev), esbuild (prod) |

---

## Project Structure

```
├── client/
│   └── src/
│       ├── pages/          # Route-level page components
│       ├── components/     # Shared UI components
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities, calculations, question data
├── server/
│   ├── index.ts            # Express entry point, dotenv config
│   ├── routes.ts           # All API routes
│   ├── storage.ts          # Database access layer
│   ├── mealPlanBuilder.ts  # OpenAI prompt construction and parsing
│   └── foodFilter.ts       # Dosha + goal food ranking logic
├── shared/
│   └── schema.ts           # Drizzle table definitions and shared types
└── script/
    └── build.ts            # Production build script (Vite + esbuild)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Install dependencies

```bash
cd RetailFlowLog
npm install
```

### 2. Configure environment

Create a `.env` file in the `RetailFlowLog/` directory:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<dbname>
PGHOST=localhost
PGPORT=5432
PGUSER=<user>
PGPASSWORD=<password>
PGDATABASE=<dbname>
SESSION_SECRET=<a_long_random_string>
NODE_ENV=development
OPENAI_API_KEY=sk-proj-...
```

### 3. Create database tables

Run the migration script to create all application tables:

```bash
npx tsx script/create-meal-plans-table.ts
```

For the other tables (users, profiles, assessments, etc.) use Drizzle:

```bash
npm run db:push
```

### 4. Start the development server

```bash
npm run dev
```

The app runs on [http://localhost:5000](http://localhost:5000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build client (Vite) + server (esbuild) for production |
| `npm run start` | Run the production build |
| `npm run db:push` | Push schema changes to the database |
| `npm run check` | TypeScript type check |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Yes | Individual PG credentials |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies |
| `OPENAI_API_KEY` | Yes | OpenAI API key for meal plan generation |
| `NODE_ENV` | No | `development` or `production` (defaults to development) |

> **Important:** Never commit your `.env` file. Add it to `.gitignore`.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/user` | Get the authenticated user |
| `POST` | `/api/auth/login` | Email / password login |
| `POST` | `/api/auth/signup` | Register a new account |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/profile` | Get the user's health profile |
| `POST` | `/api/profile` | Create or update health profile |
| `GET` | `/api/dosha-assessment` | Get the latest dosha assessment |
| `POST` | `/api/dosha-assessment` | Submit a new dosha assessment |
| `GET` | `/api/health-goal` | Get the user's selected health goal |
| `POST` | `/api/health-goal` | Set or update the health goal |
| `GET` | `/api/foods/filtered` | Get tiered food list for the user's dosha + goal |
| `POST` | `/api/mealplan` | Generate and persist a 7-day AI meal plan |
| `GET` | `/api/mealplan/saved?goal=<goal>` | Retrieve the saved meal plan for a goal |
| `GET` | `/api/wellness-checkins` | List all wellness check-ins |
| `POST` | `/api/wellness-checkin` | Submit a new wellness check-in |
