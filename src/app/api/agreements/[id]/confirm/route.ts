import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseFundsServerSide } from "@/lib/escrow/release";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { freelancerAddress } = body;

    if (!freelancerAddress) {
      return NextResponse.json(
        { error: "Falta freelancerAddress" },
        { status: 400 }
      );
    }

    // Verify agreement exists, belongs to freelancer, and is approved
    const agreement = await prisma.agreement.findFirst({
      where: { id, freelancerAddress },
    });

    if (!agreement) {
      return NextResponse.json({ error: "Acuerdo no encontrado" }, { status: 404 });
    }

    if (agreement.status !== "EMPLOYER_APPROVED") {
      return NextResponse.json(
        { error: "El acuerdo no esta aprobado por el empleador" },
        { status: 400 }
      );
    }

    // Update freelancer confirmation
    await prisma.agreement.update({
      where: { id },
      data: { freelancerConfirmed: true, freelancerConfirmedAt: new Date() },
    });

    // Release funds server-side
    const txHash = await releaseFundsServerSide(id);

    return NextResponse.json({
      success: true,
      txHash,
    });
  } catch (error) {
    console.error("Error confirming and releasing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al confirmar y liberar fondos",
      },
      { status: 500 }
    );
  }
}
