 import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import Papa from "papaparse";
import { attachThemes } from "@/lib/themes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data as Record<string, string>[];

  let successCount = 0;
  let failCount = 0;

  for (const row of rows) {
    const content = row.content?.trim();
    const channel = row.channel?.trim();
    const customerLabel = row.customer_label?.trim() || null;

    if (!content || !channel) {
      failCount++;
      continue;
    }

         const classification = await classifyFeedback(content);

    const newFeedback = await prisma.feedback.create({
      data: {
        content,
        channel,
        customerLabel,
        workspaceId: currentUser.workspaceId,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
      },
    });

    await attachThemes(newFeedback.id, currentUser.workspaceId, classification.themes || []);

    successCount++;
  }

  return NextResponse.json({
    message: "CSV processed",
    imported: successCount,
    failed: failCount,
  });
}