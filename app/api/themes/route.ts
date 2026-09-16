import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const themes = await prisma.theme.findMany({
    where: { workspaceId: currentUser.workspaceId },
    include: {
      feedback: {
        include: { feedback: true },
      },
    },
  });

  const themesWithCounts = themes.map((t) => ({
    id: t.id,
    name: t.name,
    count: t.feedback.length,
    feedbackItems: t.feedback.map((ft) => ({
      id: ft.feedback.id,
      content: ft.feedback.content,
      channel: ft.feedback.channel,
    })),
  }));

  themesWithCounts.sort((a, b) => b.count - a.count);

  return NextResponse.json({ themes: themesWithCounts });
}