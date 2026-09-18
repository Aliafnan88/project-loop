 import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function classifyFeedback(content: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `Classify this piece of customer feedback. Return ONLY valid JSON, no markdown fences, no extra text.

Feedback: "${content}"

Return JSON in this exact shape:
{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": <number between -1 and 1>,
  "themes": [<array of 1-2 short theme names, e.g. "Onboarding", "Pricing", "Performance">],
  "featureArea": "<short feature area label>"
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("AI classification failed:", err);
    return {
      sentiment: "NEU",
      sentimentScore: 0,
      themes: [],
      featureArea: "Unclassified",
    };
  }
}
