import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
function impliedProbabilityFromAmericanOdds(odds: number | null | undefined) {
  if (!odds) return null;

  if (odds < 0) {
    return Math.round((-odds / (-odds + 100)) * 100);
  }

  return Math.round((100 / (odds + 100)) * 100);
}
export async function POST(request: Request) {
  try {
    const {
      fighterA,
      fighterB,
      oddsA,
      oddsB,
      fighterAStats,
      fighterBStats,
      fighterAMetrics,
      fighterBMetrics,
    } = await request.json();

    const prompt = `You are an expert UFC analyst.

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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const cleaned = content.text.replace(/```json\n?|\n?```/g, "").trim();
    const analysis = JSON.parse(cleaned);
    const predictedWinner =
    analysis.predictedWinner ||
    analysis.winner ||
    analysis.predicted_winner ||
    analysis.pick ||
    (() => {
      const impliedA = impliedProbabilityFromAmericanOdds(oddsA);
      const impliedB = impliedProbabilityFromAmericanOdds(oddsB);
    
      if (impliedA === null && impliedB === null) return fighterA;
      if (impliedA === null) return fighterB;
      if (impliedB === null) return fighterA;
    
      return impliedA >= impliedB ? fighterA : fighterB;
    })();
    return NextResponse.json({
      claude: {
        ...analysis,
        predictedWinner,
      },
      gpt: null,
      gemini: null,
      consensus: {
        winner: predictedWinner,
        confidence: analysis.confidence || 50,
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