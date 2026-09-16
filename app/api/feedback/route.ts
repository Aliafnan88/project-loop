 import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { attachThemes } from "@/lib/themes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;
  const search = searchParams.get("search") || "";
  const channel = searchParams.get("channel") || "";
  const status = searchParams.get("status") || "";

  const where: any = {
    workspaceId: currentUser.workspaceId,
  };

  if (search) {
    where.content = { contains: search, mode: "insensitive" };
  }

  if (channel) {
    where.channel = channel;
  }

  if (status) {
    where.status = status;
  }

  const [feedback, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({
    feedback,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
   if (currentUser.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewers cannot add feedback" },
      { status: 403 }
    );
  }


  const { content, channel } = await req.json();

  if (!content || !channel) {
    return NextResponse.json(
      { error: "Content and channel are required" },
      { status: 400 }
    );
  }

  const classification = await classifyFeedback(content);

  const feedback = await prisma.feedback.create({
    data: {
      content,
      channel,
      workspaceId: currentUser.workspaceId,
      sentiment: classification.sentiment,
      sentimentScore: classification.sentimentScore,
    },
  });
  await attachThemes(feedback.id, currentUser.workspaceId, classification.themes || []);

  return NextResponse.json({ feedback });
}