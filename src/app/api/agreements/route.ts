import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerAddress = searchParams.get("freelancerAddress");
    const employerAddress = searchParams.get("employerAddress");

    if (!freelancerAddress && !employerAddress) {
      return NextResponse.json(
        { error: "Se requiere freelancerAddress o employerAddress" },
        { status: 400 }
      );
    }

    const agreements = await prisma.agreement.findMany({
      where: freelancerAddress
        ? { freelancerAddress }
        : { employerAddress: employerAddress! },
      include: {
        job: {
          select: {
            title: true,
            amount: true,
            ...(freelancerAddress ? { deliverables: true } : {}),
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ agreements });
  } catch (error) {
    console.error("Error fetching agreements:", error);
    return NextResponse.json(
      { error: "Error al obtener acuerdos" },
      { status: 500 }
    );
  }
}
