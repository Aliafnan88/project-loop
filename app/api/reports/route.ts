import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: { workspaceId: currentUser.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);

  const feedback = await prisma.feedback.findMany({
    where: {
      workspaceId: currentUser.workspaceId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const total = feedback.length;

  const channelCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};
  for (const f of feedback) {
    channelCounts[f.channel] = (channelCounts[f.channel] || 0) + 1;
    const s = f.sentiment || "NEU";
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
  }

  const topChannels = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sampleQuotes = feedback.slice(0, 15).map((f) => f.content);

  const prompt = `You are a product analyst writing a Voice-of-Customer report for the last 30 days.

Stats:
- Total feedback items: ${total}
- Sentiment breakdown: ${JSON.stringify(sentimentCounts)}
- Top channels: ${JSON.stringify(topChannels)}

Sample feedback quotes:
${sampleQuotes.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

Write a concise Voice-of-Customer report with these sections:
1. Executive Summary (2-3 sentences)
2. Top Themes (bullet points, inferred from the quotes)
3. Sentiment Overview (brief, using the stats above)
4. Notable Verbatim Quotes (pick 3-4 impactful ones from the samples)
5. Recommended Actions (3 bullet points)

Keep it professional and data-grounded. Do not invent numbers not given above.`;

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const result = await model.generateContent(prompt);
  const reportText = result.response.text();

  const report = await prisma.report.create({
    data: {
      title: `Voice-of-Customer Report — ${periodEnd.toDateString()}`,
      periodStart,
      periodEnd,
      contentJson: { text: reportText, stats: { total, sentimentCounts, topChannels } },
      workspaceId: currentUser.workspaceId,
      generatedById: currentUser.id,
    },
  });

  return NextResponse.json({ report });
}