 import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { attachThemes } from "@/lib/themes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const sampleFeedback = [
  { content: "Onboarding took forever — I couldn't figure out how to invite my team.", channel: "support_ticket", customerLabel: "Acme Corp" },
  { content: "The new dashboard is gorgeous and finally fast. Huge improvement.", channel: "app_store_review", customerLabel: "Bright Labs" },
  { content: "It does the job, but the mobile experience needs work.", channel: "nps_survey", customerLabel: "Nova Inc" },
  { content: "Prospect wants SSO before they'll sign — third time this month.", channel: "sales_call_note", customerLabel: "Vertex Systems" },
  { content: "Love the new export feature, saved me an hour today.", channel: "community_post", customerLabel: "Delta Group" },
  { content: "Billing page keeps timing out when I try to download an invoice.", channel: "support_ticket", customerLabel: "Orbit LLC" },
  { content: "Search is way too slow when I have more than 500 items.", channel: "support_ticket", customerLabel: "Acme Corp" },
  { content: "Would love a dark mode option for the dashboard.", channel: "community_post", customerLabel: "Bright Labs" },
  { content: "Integration with Slack works flawlessly, great job team!", channel: "app_store_review", customerLabel: "Nova Inc" },
  { content: "Customer support response time has been really slow lately.", channel: "nps_survey", customerLabel: "Vertex Systems" },
];

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let count = 0;

   for (const item of sampleFeedback) {
    const classification = await classifyFeedback(item.content);

    const newFeedback = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        customerLabel: item.customerLabel,
        workspaceId: currentUser.workspaceId,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
      },
    });

    await attachThemes(newFeedback.id, currentUser.workspaceId, classification.themes || []);

    count++;
  }

  return NextResponse.json({
    message: "Simulated channel data imported",
    imported: count,
  });
}