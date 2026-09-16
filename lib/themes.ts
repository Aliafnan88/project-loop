import { PrismaClient } from "@/app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function attachThemes(
  feedbackId: string,
  workspaceId: string,
  themeNames: string[]
) {
  for (const name of themeNames) {
    if (!name || !name.trim()) continue;

    let theme = await prisma.theme.findFirst({
      where: { workspaceId, name: name.trim() },
    });

    if (!theme) {
      theme = await prisma.theme.create({
        data: { workspaceId, name: name.trim() },
      });
    }

    await prisma.feedbackTheme.create({
      data: {
        feedbackId,
        themeId: theme.id,
        confidence: 0.8,
      },
    });
  }
}