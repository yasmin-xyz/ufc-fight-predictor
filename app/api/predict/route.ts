import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

const PREDICTION_VERSION = "v2";

function createFightKey(fighterA: string, fighterB: string) {
  const matchup = [fighterA, fighterB].sort().join(" vs ");
  return `${matchup}::${PREDICTION_VERSION}`;
}

function impliedProbabilityFromAmericanOdds(odds: number | null | undefined) {
  if (!odds) return null;

  if (odds < 0) {
    return Math.round((-odds / (-odds + 100)) * 100);
  }

  return Math.round((100 / (odds + 100)) * 100);
}

function cleanJson(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

function normalizePrediction(analysis: any, fighterA: string, fighterB: string, oddsA: number, oddsB: number) {
  const impliedA = impliedProbabilityFromAmericanOdds(oddsA);
  const impliedB = impliedProbabilityFromAmericanOdds(oddsB);

  const fallbackWinner =
    impliedA === null && impliedB === null
      ? fighterA
      : impliedA === null
      ? fighterB
      : impliedB === null
      ? fighterA
      : impliedA >= impliedB
      ? fighterA
      : fighterB;

  return {
    ...analysis,
    predictedWinner:
      analysis.predictedWinner ||
      analysis.winner ||
      analysis.predicted_winner ||
      analysis.pick ||
      fallbackWinner,
    confidence: analysis.confidence || 50,
  };
}

function buildPrompt({
  fighterA,
  fighterB,
  oddsA,
  oddsB,
  fighterAStats,
  fighterBStats,
  fighterAMetrics,
  fighterBMetrics,
}: any) {
  return `You are an expert UFC analyst.

Analyze this upcoming fight using BOTH the fighter information and the betting market.

Fight:
${fighterA} vs ${fighterB}

Betting Market:
- ${fighterA}: ${oddsA}
- ${fighterB}: ${oddsB}

${fighterA}
- Record: ${fighterAStats?.record || "Unknown"}
- Age: ${fighterAStats?.age || "Unknown"}
- Height: ${fighterAStats?.height || "Unknown"}
- Reach: ${fighterAStats?.reach || "Unknown"}
- Stance: ${fighterAStats?.stance || "Unknown"}
- Style: ${fighterAStats?.style || "Unknown"}

${fighterB}
- Record: ${fighterBStats?.record || "Unknown"}
- Age: ${fighterBStats?.age || "Unknown"}
- Height: ${fighterBStats?.height || "Unknown"}
- Reach: ${fighterBStats?.reach || "Unknown"}
- Stance: ${fighterBStats?.stance || "Unknown"}
- Style: ${fighterBStats?.style || "Unknown"}

Advanced Performance Metrics:

${fighterA}
- SLpM: ${fighterAMetrics?.slpm || "Unknown"}
- Striking Accuracy: ${fighterAMetrics?.strAcc || "Unknown"}
- SApM: ${fighterAMetrics?.sapm || "Unknown"}
- Strike Defense: ${fighterAMetrics?.strDef || "Unknown"}
- TD Avg: ${fighterAMetrics?.tdAvg || "Unknown"}
- TD Accuracy: ${fighterAMetrics?.tdAcc || "Unknown"}
- TD Defense: ${fighterAMetrics?.tdDef || "Unknown"}
- Submission Avg: ${fighterAMetrics?.subAvg || "Unknown"}

${fighterB}
- SLpM: ${fighterBMetrics?.slpm || "Unknown"}
- Striking Accuracy: ${fighterBMetrics?.strAcc || "Unknown"}
- SApM: ${fighterBMetrics?.sapm || "Unknown"}
- Strike Defense: ${fighterBMetrics?.strDef || "Unknown"}
- TD Avg: ${fighterBMetrics?.tdAvg || "Unknown"}
- TD Accuracy: ${fighterBMetrics?.tdAcc || "Unknown"}
- TD Defense: ${fighterBMetrics?.tdDef || "Unknown"}
- Submission Avg: ${fighterBMetrics?.subAvg || "Unknown"}

Consider:
- advanced performance metrics
- styles and matchup dynamics
- reach and physical advantages
- age and experience
- betting market expectations
- finishing ability
- likely path to victory

Return ONLY valid JSON in this format:

{
  "predictedWinner": "",
  "confidence": 72,
  "method": "",
  "round": "",
  "bettingLean": "",
  "keyAdvantages": "Maximum 2 concise sentences. Mention only the most important statistical or stylistic advantages.",
  "biggestRisk": "Maximum 1 concise sentence.",
  "fightScript": "Maximum 2 concise sentences describing the most likely fight flow.",
  "whyWrong": [
    "One concise reason",
    "One concise reason"
  ]
}

Keep the entire response concise. Avoid repeating the same point across multiple fields.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
const { fighterA, fighterB, oddsA, oddsB } = body;

const fightKey = createFightKey(fighterA, fighterB);

const { data: cachedPrediction, error: cacheError } = await supabase
  .from("fight_predictions")
  .select("prediction")
  .eq("fight_key", fightKey)
  .maybeSingle();

if (cacheError) {
  console.error("Supabase cache read error:", cacheError);
}

if (cachedPrediction?.prediction) {
  const cached = cachedPrediction.prediction;
  const isComplete = !!cached.claude && !!cached.gpt && !!cached.gemini;

  if (isComplete) {
    return NextResponse.json(cached);
  }

  console.warn(
    `Cached prediction for "${fightKey}" is missing a model result — regenerating instead of returning it`
  );
}

const prompt = buildPrompt(body);

    const [claudeResult, gptResult, geminiResult] = await Promise.allSettled([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),

      openai.responses.create({
        model: "gpt-5.4-mini",
        input: prompt,
      }),

      google.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }),
    ]);

    let claude = null;
    let gpt = null;
    let gemini = null;

    if (claudeResult.status === "fulfilled") {
      const content = claudeResult.value.content[0];

      if (content.type === "text") {
        claude = normalizePrediction(
          JSON.parse(cleanJson(content.text)),
          fighterA,
          fighterB,
          oddsA,
          oddsB
        );
      }
    }

    if (gptResult.status === "fulfilled") {
      gpt = normalizePrediction(
        JSON.parse(cleanJson(gptResult.value.output_text)),
        fighterA,
        fighterB,
        oddsA,
        oddsB
      );
    }

    if (geminiResult.status === "fulfilled") {
      try {
        gemini = normalizePrediction(
          JSON.parse(cleanJson(geminiResult.value.text ?? "")),
          fighterA,
          fighterB,
          oddsA,
          oddsB
        );
      } catch (error) {
        console.error("Gemini JSON parse error:", geminiResult.value.text);
      }
    } else {
      console.error("Gemini API error:", geminiResult.reason);
    }

    const validPredictions = [claude, gpt, gemini].filter(Boolean);

    const winnerCounts = validPredictions.reduce((acc: any, prediction: any) => {
      acc[prediction.predictedWinner] = (acc[prediction.predictedWinner] || 0) + 1;
      return acc;
    }, {});

    const consensusWinner =
      Object.entries(winnerCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ||
      claude?.predictedWinner ||
      fighterA;

    const consensusConfidence = validPredictions.length
      ? Math.round(
          validPredictions.reduce((sum: number, prediction: any) => sum + prediction.confidence, 0) /
            validPredictions.length
        )
      : 50;

      const finalPrediction = {
        claude,
        gpt,
        gemini,
        consensus: {
          winner: consensusWinner,
          confidence: consensusConfidence,
        },
      };
      
      const { error: upsertError } = await supabase
  .from("fight_predictions")
  .upsert(
    {
      fight_key: fightKey,
      fighter_a: fighterA,
      fighter_b: fighterB,
      prediction: finalPrediction,
    },
    {
      onConflict: "fight_key",
    }
  );
      
      if (upsertError) {
        console.error("Supabase prediction save error:", upsertError);
      } else {
        console.log("Saved prediction to Supabase:", fightKey);
      }
      
      return NextResponse.json(finalPrediction);
  } catch (error) {
    console.error("Prediction API error:", error);

    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}