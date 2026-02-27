import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, applicationId, freelancerAddress, contractId } = body;

    if (!jobId || !applicationId || !freelancerAddress || !contractId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Get job data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, employerId: true, employerAddress: true, amount: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
    }

    // Upsert freelancer user
    const user = await prisma.user.upsert({
      where: { stellarAddress: freelancerAddress },
      update: {},
      create: {
        stellarAddress: freelancerAddress,
        displayName: `Usuario ${freelancerAddress.slice(0, 6)}...`,
        role: "FREELANCER",
      },
    });

    // Create agreement, update job, accept/reject applications, record transaction
    const [, , , , agreement] = await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: { escrowContractId: contractId, status: "ASSIGNED" },
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
      prisma.application.updateMany({
        where: { jobId, id: { not: applicationId }, status: "PENDING" },
        data: { status: "REJECTED", rejectedAt: new Date() },
      }),
      prisma.transaction.create({
        data: {
          jobId,
          type: "ESCROW_FUNDED",
          amount: job.amount,
          txHash: contractId,
          status: "CONFIRMED",
          fromAddress: job.employerAddress,
          toAddress: freelancerAddress,
          confirmedAt: new Date(),
        },
      }),
      prisma.agreement.create({
        data: {
          jobId,
          employerId: job.employerId,
          employerAddress: job.employerAddress,
          freelancerId: user.id,
          freelancerAddress,
          escrowContractId: contractId,
          status: "ACTIVE",
        },
      }),
    ]);

    // Notify freelancer
    await createNotification({
      userId: user.id,
      type: "APPLICATION_ACCEPTED",
      title: "Postulacion aceptada",
      message: `Tu postulacion para "${job.title}" fue aceptada. Ya puedes empezar a trabajar.`,
      actionUrl: `/dashboard/freelancer`,
    });

    return NextResponse.json({
      success: true,
      agreementId: agreement.id,
    });
  } catch (error) {
    console.error("Error finalizing accept:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al finalizar la aceptacion",
      },
      { status: 500 }
    );
  }
}
