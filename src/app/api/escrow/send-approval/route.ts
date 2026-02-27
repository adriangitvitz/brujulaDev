import { NextResponse } from "next/server";
import { getTrustlessWorkClient } from "@/lib/trustlesswork/client";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedXdr, agreementId, alreadyApproved } = body;

    if (!agreementId) {
      return NextResponse.json(
        { error: "Falta agreementId" },
        { status: 400 }
      );
    }

    const client = getTrustlessWorkClient();

    // Send signed transaction (skip if already approved on-chain)
    let response: { transactionHash?: string } = {};
    if (!alreadyApproved) {
      if (!signedXdr) {
        return NextResponse.json({ error: "Falta signedXdr" }, { status: 400 });
      }
      response = await client.sendTransaction({ signedXdr });
    }

    // Get agreement info
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { job: { select: { title: true, amount: true } } },
    });

    if (!agreement) {
      return NextResponse.json({ error: "Acuerdo no encontrado" }, { status: 404 });
    }

    const txHash = response.transactionHash || `tx_${Date.now()}_${generateId(8)}`;

    // Update agreement and record transaction
    await prisma.$transaction([
      prisma.agreement.update({
        where: { id: agreementId },
        data: {
          employerApproved: true,
          employerApprovedAt: new Date(),
          status: "EMPLOYER_APPROVED",
        },
      }),
      prisma.transaction.create({
        data: {
          agreementId,
          jobId: agreement.jobId,
          type: "MILESTONE_APPROVED",
          amount: agreement.job.amount,
          txHash,
          status: "CONFIRMED",
          fromAddress: agreement.employerAddress,
          toAddress: agreement.freelancerAddress,
          confirmedAt: new Date(),
        },
      }),
    ]);

    // Notify freelancer
    await createNotification({
      userId: agreement.freelancerId,
      type: "WORK_APPROVED",
      title: "Trabajo aprobado",
      message: `El empleador aprobo tu entrega de "${agreement.job.title}". Confirma para recibir el pago.`,
      actionUrl: `/dashboard/freelancer/agreements/${agreementId}/confirm`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending approval:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar aprobacion",
      },
      { status: 500 }
    );
  }
}
