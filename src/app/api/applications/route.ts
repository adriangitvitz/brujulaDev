import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const freelancerAddress = searchParams.get("freelancerAddress");

    let applications;

    if (jobId && freelancerAddress) {
      applications = await prisma.application.findMany({
        where: { jobId, freelancerAddress },
        orderBy: { appliedAt: "desc" },
      });
    } else if (jobId) {
      applications = await prisma.application.findMany({
        where: { jobId },
        orderBy: { appliedAt: "desc" },
      });
    } else if (freelancerAddress) {
      applications = await prisma.application.findMany({
        where: { freelancerAddress },
        include: {
          job: { select: { title: true, amount: true } },
        },
        orderBy: { appliedAt: "desc" },
      });
    } else {
      return NextResponse.json(
        { error: "Se requiere jobId o freelancerAddress" },
        { status: 400 }
      );
    }

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Error al obtener aplicaciones" },
      { status: 500 }
    );
  }
}
