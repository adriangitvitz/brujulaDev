import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { deliveryUrl, deliveryNote, freelancerAddress } = body;

    if (!deliveryUrl || !freelancerAddress) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verify agreement exists and belongs to freelancer
    const agreement = await prisma.agreement.findFirst({
      where: { id, freelancerAddress },
      include: { job: { select: { id: true, title: true } } },
    });

    if (!agreement) {
      return NextResponse.json({ error: "Acuerdo no encontrado" }, { status: 404 });
    }

    if (agreement.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Este acuerdo no esta en estado activo" },
        { status: 400 }
      );
    }

    // Update agreement and job status
    await prisma.$transaction([
      prisma.agreement.update({
        where: { id },
        data: {
          deliveryUrl,
          deliveryNote: deliveryNote || null,
          deliveredAt: new Date(),
          status: "WORK_DELIVERED",
        },
      }),
      prisma.job.update({
        where: { id: agreement.job.id },
        data: { status: "IN_REVIEW" },
      }),
    ]);

    // Notify employer
    await createNotification({
      userId: agreement.employerId,
      type: "WORK_DELIVERED",
      title: "Trabajo entregado",
      message: `El freelancer completo "${agreement.job.title}". Revisa la entrega.`,
      actionUrl: `/dashboard/employer/agreements/${id}/review`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error delivering work:", error);
    return NextResponse.json(
      { error: "Error al entregar el trabajo" },
      { status: 500 }
    );
  }
}
