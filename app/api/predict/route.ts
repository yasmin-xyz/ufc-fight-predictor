import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { normalizeFighterName } from "../../lib/fighterName";

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

// Bumped whenever the prompt, consensus logic, or data-flow changes in a way
// that makes previously-cached rows unreliable. v5 specifically invalidates
// everything cached under the stale-closure metrics bug (see conversation).
const PREDICTION_VERSION = "v5-data-integrity";

function createFightKey(fighterA: string, fighterB: string) {
  const matchup = [fighterA, fighterB].sort().join(" vs ");
  return `${matchup}::${PREDICTION_VERSION}`;
}

// Raw (un-normalized) implied probability as a 0-1 fraction. Two raw
// probabilities from opposite sides of the same market always sum to more
// than 1 (the bookmaker's vig) — see normalizedProbabilities() for the
// de-vigged version used anywhere we display or compare probabilities.
function rawImpliedProbability(odds: number | null | undefined): number | null {
  if (!odds) return null;
  if (odds < 0) return -odds / (-odds + 100);
  return 100 / (odds + 100);
}

function cleanJson(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

function normalizePrediction(analysis: any, fighterA: string, fighterB: string, oddsA: number, oddsB: number) {
  const impliedA = rawImpliedProbability(oddsA);
  const impliedB = rawImpliedProbability(oddsB);

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

// Requires fighterAMetricsSource/fighterBMetricsSource — the exact fighter
// name the client used to fetch each metrics object — so we can catch a
// stale/mismatched payload before it ever reaches an LLM. See the
// stale-closure race bug this replaced.
function validateFighterData(body: any): string[] {
  const errors: string[] = [];
  const { fighterA, fighterB, fighterAMetricsSource, fighterBMetricsSource, fighterAStats, fighterBStats } = body;

  if (!fighterA || typeof fighterA !== "string") errors.push("fighterA is required");
  if (!fighterB || typeof fighterB !== "string") errors.push("fighterB is required");
  if (errors.length > 0) return errors;

  const normA = normalizeFighterName(fighterA);
  const normB = normalizeFighterName(fighterB);

  if (!fighterAMetricsSource || normalizeFighterName(fighterAMetricsSource) !== normA) {
    errors.push(
      `fighterAMetrics source ("${fighterAMetricsSource || "missing"}") does not match fighterA ("${fighterA}")`
    );
  }

  if (!fighterBMetricsSource || normalizeFighterName(fighterBMetricsSource) !== normB) {
    errors.push(
      `fighterBMetrics source ("${fighterBMetricsSource || "missing"}") does not match fighterB ("${fighterB}")`
    );
  }

  if (fighterAStats?.name && normalizeFighterName(fighterAStats.name) !== normA) {
    errors.push(`fighterAStats belongs to "${fighterAStats.name}", not "${fighterA}"`);
  }

  if (fighterBStats?.name && normalizeFighterName(fighterBStats.name) !== normB) {
    errors.push(`fighterBStats belongs to "${fighterBStats.name}", not "${fighterB}"`);
  }

  return errors;
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
  const impliedA = rawImpliedProbability(oddsA);
  const impliedB = rawImpliedProbability(oddsB);
  const sum = (impliedA ?? 0) + (impliedB ?? 0);
  const normA = impliedA !== null && sum > 0 ? Math.round((impliedA / sum) * 100) : null;
  const normB = impliedB !== null && sum > 0 ? Math.round((impliedB / sum) * 100) : null;

  return `You are an expert UFC analyst.

Analyze this upcoming fight using BOTH the fighter information and the betting market.

Fight:
${fighterA} vs ${fighterB}

Betting Market:
- ${fighterA}: ${oddsA} (${normA !== null ? `${normA}% implied win probability` : "no market data"})
- ${fighterB}: ${oddsB} (${normB !== null ? `${normB}% implied win probability` : "no market data"})

Sportsbook markets aggregate a large amount of information — sharp betting activity, insider knowledge, matchup analysis — and are generally well-calibrated. Treat the market price as a meaningful, informative prior. Do not default to picking the favorite; form your own independent judgment from the data below. But if your judgment disagrees with the market, that disagreement must be earned, not incidental.

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
- finishing ability
- likely path to victory

If you pick the fighter the market considers a substantial underdog (implied win probability meaningfully below 50%), you must:
- identify the specific evidence above that supports the upset;
- explain concretely why that evidence outweighs the market's assessment;
- avoid assigning confidence above roughly 65 to a substantial-underdog pick unless the statistical case is unusually strong.

Return ONLY valid JSON in this format:

{
  "predictedWinner": "",
  "confidence": 72,
  "method": "",
  "round": "",
  "bettingLean": "",
  "keyAdvantages": "2 sentences, maximum. The single most important statistical or stylistic advantage, stated plainly.",
  "biggestRisk": "1-2 sentences, maximum. The single biggest risk to this prediction.",
  "fightScript": "2 sentences, maximum. How the fight most likely unfolds and ends.",
  "whyWrong": [
    "One clear sentence — a specific, concrete reason the prediction could be wrong",
    "One clear sentence — a different specific, concrete reason the prediction could be wrong"
  ]
}

Be concise. Readers do not want to read long paragraphs — every sentence must earn its place. State the point directly with no throat-clearing or repetition across fields.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fighterA, fighterB, oddsA, oddsB } = body;

    const validationErrors = validateFighterData(body);

    if (validationErrors.length > 0) {
      console.error(`[predict] data-integrity validation failed: ${validationErrors.join("; ")}`);

      return NextResponse.json(
        {
          error: "Fighter data mismatch detected — refusing to generate a prediction",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

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
        max_tokens: 1000,
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
    } else {
      console.error("Claude API error:", claudeResult.reason);
    }

    if (gptResult.status === "fulfilled") {
      gpt = normalizePrediction(
        JSON.parse(cleanJson(gptResult.value.output_text)),
        fighterA,
        fighterB,
        oddsA,
        oddsB
      );
    } else {
      console.error("GPT API error:", gptResult.reason);
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

    // Consensus winner: majority vote across whichever models succeeded.
    // Consensus confidence: average ONLY the confidence scores from models
    // that actually picked the consensus winner — averaging a confidence
    // attached to the opposing fighter's pick previously inflated/distorted
    // this number.
    const modelResults = [
      { name: "claude", prediction: claude },
      { name: "gpt", prediction: gpt },
      { name: "gemini", prediction: gemini },
    ].filter((m): m is { name: string; prediction: any } => !!m.prediction);

    const totalSuccessfulModels = modelResults.length;

    let consensusWinner: string;
    let agreeingModels: string[];
    let consensusConfidence: number;
    let modelAgreement: string;

    if (totalSuccessfulModels === 0) {
      consensusWinner = fighterA;
      agreeingModels = [];
      consensusConfidence = 50;
      modelAgreement = "No models available";
    } else {
      const winnerCounts: Record<string, number> = {};
      for (const { prediction } of modelResults) {
        winnerCounts[prediction.predictedWinner] = (winnerCounts[prediction.predictedWinner] || 0) + 1;
      }

      const sortedWinners = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1]);
      const topCount = sortedWinners[0][1];
      const tiedWinners = sortedWinners.filter(([, count]) => count === topCount);

      if (tiedWinners.length > 1) {
        // Genuine tie (only reachable when a model failed and the remaining
        // two disagree). Break it with Claude's pick if Claude is one of
        // the tied winners, otherwise take the first.
        const claudeWinner = claude?.predictedWinner;
        consensusWinner =
          claudeWinner && tiedWinners.some(([name]) => name === claudeWinner)
            ? claudeWinner
            : tiedWinners[0][0];
      } else {
        consensusWinner = sortedWinners[0][0];
      }

      const agreeing = modelResults.filter(({ prediction }) => prediction.predictedWinner === consensusWinner);
      agreeingModels = agreeing.map(({ name }) => name);

      consensusConfidence = Math.round(
        agreeing.reduce((sum, { prediction }) => sum + prediction.confidence, 0) / agreeing.length
      );

      modelAgreement =
        agreeingModels.length === totalSuccessfulModels
          ? "Unanimous"
          : tiedWinners.length > 1
          ? "Split"
          : "Majority";
    }

    const finalPrediction = {
      claude,
      gpt,
      gemini,
      consensus: {
        winner: consensusWinner,
        confidence: consensusConfidence,
        agreeingModels,
        totalSuccessfulModels,
        modelAgreement,
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
