import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employer = searchParams.get("employer");
    const status = searchParams.get("status");

    const select = {
      id: true,
      title: true,
      category: true,
      description: true,
      amount: true,
      estimatedDays: true,
      status: true,
      skills: true,
      createdAt: true,
      escrowContractId: true,
    } as const;

    let jobs;

    if (employer) {
      const user = await prisma.user.findUnique({
        where: { stellarAddress: employer },
        select: { id: true },
      });
      jobs = user
        ? await prisma.job.findMany({
            where: { employerId: user.id },
            select,
            orderBy: { createdAt: "desc" },
          })
        : [];
    } else if (status) {
      jobs = await prisma.job.findMany({
        where: { status },
        select,
        orderBy: { createdAt: "desc" },
      });
    } else {
      jobs = await prisma.job.findMany({
        where: { status: { in: ["OPEN", "FUNDED"] } },
        select,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Error al obtener trabajos" },
      { status: 500 }
    );
  }
}
