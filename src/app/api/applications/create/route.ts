import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, freelancerAddress, coverLetter, portfolioUrl, proposedDeliveryDate } = body;

    if (!jobId || !freelancerAddress || !coverLetter || !proposedDeliveryDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check job exists and is OPEN
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, employerId: true, status: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
    }
    if (job.status !== "OPEN") {
      return NextResponse.json({ error: "Este trabajo no esta disponible para postulaciones" }, { status: 400 });
    }

    // Check if already applied
    const existing = await prisma.application.findFirst({
      where: { jobId, freelancerAddress },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya te postulaste a este trabajo" }, { status: 400 });
    }

    // Upsert freelancer user
    const user = await prisma.user.upsert({
      where: { stellarAddress: freelancerAddress },
      update: { lastSeenAt: new Date() },
      create: {
        stellarAddress: freelancerAddress,
        displayName: `Usuario ${freelancerAddress.slice(0, 6)}...`,
        role: "FREELANCER",
      },
    });

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        freelancerId: user.id,
        freelancerAddress,
        coverLetter,
        portfolioUrl: portfolioUrl || null,
        proposedDeliveryDate: new Date(proposedDeliveryDate),
        status: "PENDING",
      },
    });

    // Notify employer
    await createNotification({
      userId: job.employerId,
      type: "NEW_APPLICATION",
      title: "Nueva postulacion",
      message: `Un freelancer se postulo para "${job.title}"`,
      actionUrl: `/dashboard/employer/jobs/${jobId}/applications`,
    });

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Error al crear la postulacion" },
      { status: 500 }
    );
  }
}
