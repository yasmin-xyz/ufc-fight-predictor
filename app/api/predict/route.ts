import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
  "keyAdvantages": "",
  "biggestRisk": "",
  "fightScript": "",
  "whyWrong": [
    "",
    "",
    ""
  ]
}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fighterA, fighterB, oddsA, oddsB } = body;
    const prompt = buildPrompt(body);

    const [claudeResult, gptResult, geminiResult] = await Promise.allSettled([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),

      openai.responses.create({
        model: "gpt-5.5",
        input: prompt,
      }),

      google.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
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
      gemini = normalizePrediction(
        JSON.parse(cleanJson(geminiResult.value.text || "")),
        fighterA,
        fighterB,
        oddsA,
        oddsB
      );
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

    return NextResponse.json({
      claude,
      gpt,
      gemini,
      consensus: {
        winner: consensusWinner,
        confidence: consensusConfidence,
      },
    });
  } catch (error) {
    console.error("Prediction API error:", error);

    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}