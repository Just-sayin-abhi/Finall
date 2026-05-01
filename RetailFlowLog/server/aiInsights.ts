/**
 * aiInsights.ts
 *
 * AI-powered insight generators:
 *  1. Dosha Results Explainer — personalised constitution explanation
 *  2. Wellness Insights — analysis of re-evaluation check-in data
 */

import OpenAI from "openai";

function getOpenAIClient() {
  const key =
    process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  return new OpenAI({
    apiKey: key,
    baseURL:
      process.env.OPENAI_BASE_URL ||
      process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
      undefined,
  });
}

// ---------------------------------------------------------------------------
// 1. Dosha Results Explainer
// ---------------------------------------------------------------------------

export interface DoshaExplainerContext {
  primaryDosha: string;
  secondaryDosha: string | null;
  constitutionType: string;
  vataPercent: number;
  pittaPercent: number;
  kaphaPercent: number;
  age?: number | null;
  gender?: string | null;
}

export async function generateDoshaExplanation(
  ctx: DoshaExplainerContext
): Promise<string> {
  const openai = getOpenAIClient();

  const constitution =
    ctx.constitutionType === "dual"
      ? `${ctx.primaryDosha}-${ctx.secondaryDosha} (dual dosha)`
      : `${ctx.primaryDosha} (single dosha)`;

  const systemPrompt = `You are a warm, knowledgeable Ayurvedic practitioner writing a personalized dosha profile explanation for a user who just completed their constitution assessment.

Write in a warm, encouraging, second-person tone ("You are…", "Your body tends to…").
Keep it concise — around 150-200 words total.
Structure your response with these sections separated by newlines:
1. A brief welcoming sentence about their unique constitution
2. What this means in daily life (energy patterns, digestion tendencies, emotional tendencies)
3. Their natural strengths
4. What to watch out for (imbalance signs)
5. One practical lifestyle tip specific to their dosha

Do NOT use markdown formatting, headers, or bullet points. Write in flowing paragraphs.
Do NOT use overly clinical language. Be approachable and encouraging.`;

  const userPrompt = `Generate a personalized dosha explanation for this user:

Constitution: ${constitution}
Dosha breakdown: Vata ${ctx.vataPercent}% / Pitta ${ctx.pittaPercent}% / Kapha ${ctx.kaphaPercent}%
${ctx.age ? `Age: ${ctx.age}` : ""}
${ctx.gender ? `Gender: ${ctx.gender}` : ""}

Write a warm, personalized explanation of what their dosha constitution means for their daily life, strengths, and what to be mindful of.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 600,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content for dosha explanation.");
  }

  return content.trim();
}

// ---------------------------------------------------------------------------
// 2. Wellness Insights
// ---------------------------------------------------------------------------

export interface WellnessInsightContext {
  primaryDosha: string;
  secondaryDosha: string | null;
  constitutionType: string;
  baseline: Record<string, number>;
  latest: Record<string, number>;
  checkinCount: number;
  overallDelta: number;
}

export async function generateWellnessInsights(
  ctx: WellnessInsightContext
): Promise<string> {
  const openai = getOpenAIClient();

  const markers = [
    "energy",
    "digestion",
    "sleep",
    "mood",
    "mentalClarity",
    "skinHealth",
    "immunity",
    "calmness",
  ];

  const markerLabels: Record<string, string> = {
    energy: "Energy & Vitality",
    digestion: "Digestion & Appetite",
    sleep: "Sleep Quality",
    mood: "Mood & Emotional Balance",
    mentalClarity: "Mental Clarity & Focus",
    skinHealth: "Skin & Hair Health",
    immunity: "Immunity & Resistance",
    calmness: "Calmness & Stress Resilience",
  };

  const changes = markers.map((m) => {
    const delta = (ctx.latest[m] ?? 0) - (ctx.baseline[m] ?? 0);
    const sign = delta > 0 ? "+" : "";
    return `${markerLabels[m]}: ${ctx.baseline[m]} → ${ctx.latest[m]} (${sign}${delta})`;
  });

  const constitution =
    ctx.constitutionType === "dual"
      ? `${ctx.primaryDosha}-${ctx.secondaryDosha}`
      : ctx.primaryDosha;

  const systemPrompt = `You are a compassionate Ayurvedic wellness advisor analyzing a user's wellness re-evaluation results.

The user has a ${constitution} dosha constitution. They've completed ${ctx.checkinCount} check-ins total.
Their overall score changed by ${ctx.overallDelta > 0 ? "+" : ""}${ctx.overallDelta} points.

Your task: Write a concise, actionable, and encouraging wellness insight (150-200 words).
Structure:
1. Acknowledge what improved the most and congratulate them
2. Identify any areas that dipped and explain what that might mean for their dosha
3. Give 2-3 specific, practical Ayurvedic tips to address the weakest areas (e.g., specific foods, routines, herbs)
4. End with an encouraging note

Do NOT use markdown, headers, or bullet points. Write in flowing, warm paragraphs using second person ("You", "Your").
Be specific to their dosha — don't give generic advice.`;

  const userPrompt = `Here are the wellness marker changes (baseline → latest):

${changes.join("\n")}

Overall score: ${Object.values(ctx.baseline).reduce((a, b) => a + b, 0)} → ${Object.values(ctx.latest).reduce((a, b) => a + b, 0)} (${ctx.overallDelta > 0 ? "+" : ""}${ctx.overallDelta})

Provide a personalized Ayurvedic wellness analysis and actionable advice.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 600,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content for wellness insights.");
  }

  return content.trim();
}
