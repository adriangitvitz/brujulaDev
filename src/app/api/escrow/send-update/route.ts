import { NextResponse } from "next/server";
import { getTrustlessWorkClient } from "@/lib/trustlesswork/client";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedXdr, jobId, applicationId, freelancerAddress } = body;

    if (!signedXdr || !jobId || !applicationId || !freelancerAddress) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const client = getTrustlessWorkClient();

    // Send signed transaction to Stellar
    const response = await client.sendTransaction({ signedXdr });

    // Get job and employer info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, employerId: true, employerAddress: true, escrowContractId: true },
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

    // Create agreement, accept/reject applications, update job, record transaction
    const txHash = response.transactionHash || response.contractId || `tx_${Date.now()}_${generateId(8)}`;

    const [agreement] = await prisma.$transaction([
      prisma.agreement.create({
        data: {
          jobId,
          employerId: job.employerId,
          employerAddress: job.employerAddress,
          freelancerId: user.id,
          freelancerAddress,
          escrowContractId: job.escrowContractId!,
          status: "ACTIVE",
        },
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
      prisma.application.updateMany({
        where: { jobId, id: { not: applicationId }, status: "PENDING" },
        data: { status: "REJECTED", rejectedAt: new Date() },
      }),
      prisma.job.update({
        where: { id: jobId },
        data: { status: "ASSIGNED" },
      }),
      prisma.transaction.create({
        data: {
          jobId,
          type: "ESCROW_UPDATE",
          amount: 0,
          txHash,
          status: "CONFIRMED",
          fromAddress: job.employerAddress,
          toAddress: freelancerAddress,
          confirmedAt: new Date(),
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
    console.error("Error sending escrow update:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar actualizacion",
      },
      { status: 500 }
    );
  }
}
