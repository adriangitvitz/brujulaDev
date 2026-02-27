import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "REJECTED") {
      return NextResponse.json(
        { error: "Solo se puede rechazar por esta ruta" },
        { status: 400 }
      );
    }

    // Get application with job info for notification
    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: { select: { title: true } } },
    });

    if (!app) {
      return NextResponse.json({ error: "Aplicacion no encontrada" }, { status: 404 });
    }

    await prisma.application.update({
      where: { id },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });

    // Notify freelancer
    await createNotification({
      userId: app.freelancerId,
      type: "APPLICATION_REJECTED",
      title: "Postulacion no seleccionada",
      message: `Tu postulacion para "${app.job.title}" no fue seleccionada`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Error al actualizar la aplicacion" },
      { status: 500 }
    );
  }
}
