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
    const { feedback } = body;

    if (!feedback) {
      return NextResponse.json({ error: "Se requiere feedback" }, { status: 400 });
    }

    // Get agreement with job info
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      include: { job: { select: { id: true, title: true } } },
    });

    if (!agreement) {
      return NextResponse.json({ error: "Acuerdo no encontrado" }, { status: 404 });
    }

    // Reset agreement and job status
    await prisma.$transaction([
      prisma.agreement.update({
        where: { id },
        data: {
          status: "ACTIVE",
          deliveryUrl: null,
          deliveryNote: null,
          deliveredAt: null,
        },
      }),
      prisma.job.update({
        where: { id: agreement.job.id },
        data: { status: "ASSIGNED" },
      }),
    ]);

    // Notify freelancer
    await createNotification({
      userId: agreement.freelancerId,
      type: "CHANGES_REQUESTED",
      title: "Cambios solicitados",
      message: `El empleador solicito cambios en "${agreement.job.title}": ${feedback.slice(0, 100)}`,
      actionUrl: `/dashboard/freelancer`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error requesting changes:", error);
    return NextResponse.json(
      { error: "Error al solicitar cambios" },
      { status: 500 }
    );
  }
}
