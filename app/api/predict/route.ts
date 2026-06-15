import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { fighterA, fighterB, oddsA, oddsB, impliedA, impliedB } =
      await request.json();

    const prompt = `You are an expert MMA analyst. Analyze this upcoming fight and provide a structured breakdown.

Fight: ${fighterA} vs ${fighterB}

Betting Market Data:
- ${fighterA} American odds: ${oddsA} (implied probability: ${impliedA}%)
- ${fighterB} American odds: ${oddsB} (implied probability: ${impliedB}%)

Provide your analysis in the following JSON format exactly:
{
  "predictedWinner": "fighter name",
  "confidence": 65,
  "keyAdvantages": "2-3 sentences about the predicted winner's key advantages",
  "biggestRisk": "2-3 sentences about the biggest risk or threat to your prediction",
  "fightScript": "3-4 sentences describing how this fight will likely play out",
  "whyWrong": [
    "First reason the prediction could be wrong",
    "Second reason the prediction could be wrong",
    "Third reason the prediction could be wrong"
  ]
}

Return only valid JSON, no other text.`;

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
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Prediction API error:", error);
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}