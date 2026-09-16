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

  const workspaceId = currentUser.workspaceId;

  const allFeedback = await prisma.feedback.findMany({
    where: { workspaceId },
    select: { channel: true, status: true, createdAt: true },
  });

  const total = allFeedback.length;

  // Channel breakdown
  const channelCounts: Record<string, number> = {};
  for (const f of allFeedback) {
    channelCounts[f.channel] = (channelCounts[f.channel] || 0) + 1;
  }
  const byChannel = Object.entries(channelCounts).map(([channel, count]) => ({
    channel,
    count,
  }));

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const f of allFeedback) {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  }
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Volume over last 7 days
  const last7Days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const count = allFeedback.filter((f) => {
      const fDate = new Date(f.createdAt).toISOString().split("T")[0];
      return fDate === dateStr;
    }).length;

    last7Days.push({ date: dateStr, count });
  }

  const newCount = statusCounts["NEW"] || 0;

  return NextResponse.json({
    total,
    newThisWeek: last7Days.reduce((sum, d) => sum + d.count, 0),
    newCount,
    byChannel,
    byStatus,
    volumeOverTime: last7Days,
  });
}