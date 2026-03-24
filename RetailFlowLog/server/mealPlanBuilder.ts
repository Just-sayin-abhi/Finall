/**
 * mealPlanBuilder.ts
 *
 * Isolated module responsible for:
 *  1. Building the expert system prompt
 *  2. Building the structured user prompt from profile context
 *  3. Calling the OpenAI API with strict JSON output
 *  4. Parsing and validating the structured response
 */

import OpenAI from "openai";

// ---------------------------------------------------------------------------
// OpenAI client — uses the Replit AI integrations env vars
// ---------------------------------------------------------------------------
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MealPlanContext {
  // From user profile
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  maintenanceCalories: number | null;
  activityLevel: string | null;

  // From dosha assessment
  primaryDosha: string;
  secondaryDosha: string | null;
  constitutionType: string;
  vataPercent: number;
  pittaPercent: number;
  kaphaPercent: number;

  // From health goal
  healthGoalLabel: string | null;

  // Recommended foods (tier 1 names only — keeps prompt concise)
  recommendedFoods: string[];

  // Additional preferences collected from the frontend form
  preferences: {
    dietaryRestrictions: string;   // e.g. "vegetarian", "vegan", "no restriction"
    allergies: string;             // free text
    healthConditions: string;      // free text, e.g. "type 2 diabetes, high BP"
    cuisinePreference: string;     // e.g. "South Indian", "North Indian", "Any"
    budget: string;                // e.g. "budget", "moderate", "premium"
    cookingTime: string;           // e.g. "under 30 min", "up to 1 hour", "no limit"
  };
}

export interface MealEntry {
  dish_name: string;
  ingredients: string[];
  portion: string;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
    calories: string;
  };
  why: string;
  substitutions: string[];
}

export interface MealPlanResponse {
  profile_summary: string;
  hydration: string;
  why_this_works: string;
  clinician_note?: string;
  meals: {
    breakfast: MealEntry;
    morning_snack: MealEntry;
    lunch: MealEntry;
    evening_snack: MealEntry;
    dinner: MealEntry;
  };
}

// ---------------------------------------------------------------------------
// 1. System prompt — the expert persona & strict rules
// ---------------------------------------------------------------------------
export function buildSystemPrompt(): string {
  return `You are an expert clinical nutritionist and Ayurvedic diet planner.

Your task is to generate a practical, coherent, and personalized meal plan.
Never return random food lists. Every meal must be intentional, nutritionally balanced, and aligned with the user's profile.

You must use:
- Health profile: age, sex, height, weight, activity level, goals
- Medical context: conditions, allergies, intolerances, medications
- Food preferences: vegetarian/non-vegetarian, cuisine preference, dislikes, budget, cooking time
- Dosha profile: Vata, Pitta, Kapha, or dual dosha with percentages

Rules:
1) Build a realistic full-day plan with breakfast, morning snack, lunch, evening snack, and dinner.
2) For each meal include:
   - dish_name: a real, nameable dish (not "mixed ingredients")
   - ingredients: a realistic ingredient list
   - portion: practical serving size in grams/cups/pieces
   - macros: approximate protein, carbs, fat, and total calories
   - why: 1-2 sentences explaining why this meal fits the user's health + dosha
   - substitutions: 1-2 practical swaps using locally available alternatives
3) Avoid any contradiction with stated allergies, restrictions, or medical conditions.
4) Keep suggestions locally practical and easy to prepare within the stated cooking time budget.
5) Do not include foods that conflict with stated dosha balancing needs.
6) If a severe medical condition is mentioned (e.g. dialysis, cancer, eating disorder), add a short clinician_note advising them to consult a healthcare provider.
7) The profile_summary field should be a single sentence confirming you understood the key profile points.
8) The why_this_works field should be 2-3 sentences explaining the overall strategy for the day.
9) The hydration field should give a daily water intake recommendation with a simple tip.
10) Output MUST be valid JSON matching the schema exactly. No markdown fences, no extra text outside JSON.

Quality bar:
- Plan should read like something a real nutritionist would give.
- Meals must make sense together across the day.
- No random assortment of foods — every choice must be deliberate.
- Macros must be internally consistent and realistic.`;
}

// ---------------------------------------------------------------------------
// 2. User prompt — builds context-rich message from the user's profile data
// ---------------------------------------------------------------------------
export function buildUserPrompt(ctx: MealPlanContext): string {
  const constitution = ctx.constitutionType === 'dual'
    ? `${ctx.primaryDosha}-${ctx.secondaryDosha} (dual dosha)`
    : `${ctx.primaryDosha} (single dosha)`;

  const doshaBreakdown = `Vata ${ctx.vataPercent}% / Pitta ${ctx.pittaPercent}% / Kapha ${ctx.kaphaPercent}%`;

  const profileLines = [
    `Age: ${ctx.age ?? 'unknown'}`,
    `Sex: ${ctx.gender ?? 'unknown'}`,
    `Height: ${ctx.heightCm ? ctx.heightCm + ' cm' : 'unknown'}`,
    `Weight: ${ctx.weightKg ? ctx.weightKg + ' kg' : 'unknown'}`,
    `BMI: ${ctx.bmi ? ctx.bmi.toFixed(1) : 'unknown'}`,
    `Activity level: ${ctx.activityLevel ?? 'unknown'}`,
    `Estimated daily calorie need: ${ctx.maintenanceCalories ? ctx.maintenanceCalories + ' kcal' : 'unknown'}`,
    `Primary health goal: ${ctx.healthGoalLabel ?? 'General wellness'}`,
  ].join('\n');

  const doshaLines = [
    `Dosha constitution: ${constitution}`,
    `Dosha breakdown: ${doshaBreakdown}`,
  ].join('\n');

  const prefLines = [
    `Dietary restrictions: ${ctx.preferences.dietaryRestrictions || 'None stated'}`,
    `Allergies / intolerances: ${ctx.preferences.allergies || 'None stated'}`,
    `Health conditions: ${ctx.preferences.healthConditions || 'None stated'}`,
    `Cuisine preference: ${ctx.preferences.cuisinePreference || 'Indian — any region'}`,
    `Budget: ${ctx.preferences.budget || 'Moderate'}`,
    `Cooking time available: ${ctx.preferences.cookingTime || 'Up to 1 hour'}`,
  ].join('\n');

  const foodList = ctx.recommendedFoods.length > 0
    ? `Preferred Ayurvedic foods for this constitution (use these as priority ingredients):\n${ctx.recommendedFoods.slice(0, 40).join(', ')}`
    : 'No specific food restrictions from Ayurvedic assessment.';

  const schema = `
Respond with ONLY this JSON structure (no extra keys, no markdown):
{
  "profile_summary": "<one sentence confirming you understood key profile points>",
  "hydration": "<daily water intake recommendation + a practical tip>",
  "why_this_works": "<2-3 sentences on the day's overall nutritional strategy>",
  "clinician_note": "<optional: only include if severe medical condition warrants it, otherwise omit>",
  "meals": {
    "breakfast": {
      "dish_name": "<name>",
      "ingredients": ["<ingredient 1>", "<ingredient 2>"],
      "portion": "<e.g. 1 bowl ~300g>",
      "macros": { "protein": "<Xg>", "carbs": "<Xg>", "fat": "<Xg>", "calories": "<X kcal>" },
      "why": "<why this fits dosha + health goal>",
      "substitutions": ["<swap 1>", "<swap 2>"]
    },
    "morning_snack": { <same structure> },
    "lunch": { <same structure> },
    "evening_snack": { <same structure> },
    "dinner": { <same structure> }
  }
}`;

  return `Please generate a single-day personalized Ayurvedic meal plan for the following user:

--- HEALTH PROFILE ---
${profileLines}

--- DOSHA PROFILE ---
${doshaLines}

--- PREFERENCES & RESTRICTIONS ---
${prefLines}

--- AYURVEDIC FOOD GUIDANCE ---
${foodList}

--- OUTPUT SCHEMA ---
${schema}`;
}

// ---------------------------------------------------------------------------
// 3. Validation: check for required profile fields
// ---------------------------------------------------------------------------
export interface ProfileValidationResult {
  valid: boolean;
  missingFields: string[];
}

export function validateProfileCompleteness(ctx: MealPlanContext): ProfileValidationResult {
  const missing: string[] = [];
  if (!ctx.age) missing.push("Age");
  if (!ctx.gender) missing.push("Gender");
  if (!ctx.heightCm) missing.push("Height");
  if (!ctx.weightKg) missing.push("Weight");
  if (!ctx.activityLevel) missing.push("Activity Level");
  if (!ctx.primaryDosha) missing.push("Dosha Assessment");
  return { valid: missing.length === 0, missingFields: missing };
}

// ---------------------------------------------------------------------------
// 4. OpenAI API call — low temperature for deterministic, high-quality output
// ---------------------------------------------------------------------------
export async function callOpenAIForMealPlan(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_completion_tokens: 3000,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }
  return raw;
}

// ---------------------------------------------------------------------------
// 5. Response parser — strips any accidental markdown fences and parses JSON
// ---------------------------------------------------------------------------
export function parseMealPlanResponse(raw: string): MealPlanResponse {
  // Strip markdown code fences if model accidentally adds them
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("OpenAI response was not valid JSON. Raw: " + cleaned.slice(0, 200));
  }

  // Light structural validation
  if (!parsed.meals || typeof parsed.meals !== "object") {
    throw new Error("Response missing 'meals' field.");
  }

  const requiredMeals = ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner"];
  for (const meal of requiredMeals) {
    if (!parsed.meals[meal]) {
      throw new Error(`Response missing meal: ${meal}`);
    }
  }

  return parsed as MealPlanResponse;
}
