import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (currentUser.role === "VIEWER") {
  return NextResponse.json({ error: "Forbidden: Viewers cannot change status" }, { status: 403 });
}

  const { id } = await params;
  const { status } = await req.json();

  if (!["NEW", "REVIEWED", "ACTIONED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({ where: { id } });

  if (!feedback || feedback.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ feedback: updated });
}