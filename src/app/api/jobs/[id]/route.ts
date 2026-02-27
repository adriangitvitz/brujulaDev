import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        deliverables: true,
        requirements: true,
        amount: true,
        estimatedDays: true,
        deadline: true,
        status: true,
        engagementId: true,
        escrowContractId: true,
        employerAddress: true,
        category: true,
        skills: true,
        createdAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Error al obtener el trabajo" },
      { status: 500 }
    );
  }
}
