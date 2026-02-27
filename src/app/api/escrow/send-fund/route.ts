import { NextResponse } from "next/server";
import { getTrustlessWorkClient } from "@/lib/trustlesswork/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedXdr, jobId } = body;

    if (!signedXdr || !jobId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: signedXdr, jobId" },
        { status: 400 }
      );
    }

    const client = getTrustlessWorkClient();

    // Send the signed fund transaction to Stellar
    const response = await client.sendTransaction({ signedXdr });

    // Now the escrow is actually funded - update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "FUNDED" },
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      transactionHash: response.transactionHash,
    });
  } catch (error) {
    console.error("Error sending fund transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar fondeo",
      },
      { status: 500 }
    );
  }
}
