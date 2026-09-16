import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const allFeedback = await prisma.feedback.findMany({
    where: { workspaceId: currentUser.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, content: true, channel: true, customerLabel: true },
  });

  const contextText = allFeedback
    .map((f, i) => `[${i + 1}] (${f.channel}${f.customerLabel ? ", " + f.customerLabel : ""}): "${f.content}"`)
    .join("\n");

  const prompt = `You are analyzing customer feedback for a company. Answer the question using ONLY the feedback items below. If the answer isn't in the feedback, say so clearly. Cite the item numbers you used (e.g. "[1]", "[3]") in your answer.

Feedback items:
${contextText}

Question: ${question}

Give a concise, helpful answer grounded only in the feedback above.`;

  const model = genAI.getGenerativeModel({ model: "gemini-3.7-flash" });
  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  return NextResponse.json({ answer, usedItemsCount: allFeedback.length });
}