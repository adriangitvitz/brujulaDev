import { NextResponse } from "next/server";
import { getTrustlessWorkClient } from "@/lib/trustlesswork/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedXdr, jobId } = body;

    if (!signedXdr) {
      return NextResponse.json(
        { error: "Falta signedXdr" },
        { status: 400 }
      );
    }

    const client = getTrustlessWorkClient();

    // Send the signed transaction to Stellar via Trustless Work
    const response = await client.sendTransaction({ signedXdr });

    // If we got a contractId back, save it on the job
    if (response.contractId && jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { escrowContractId: response.contractId, status: "OPEN" },
      });
    }

    return NextResponse.json({
      success: true,
      contractId: response.contractId,
      status: response.status,
    });
  } catch (error) {
    console.error("Error sending transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar transaccion",
      },
      { status: 500 }
    );
  }
}
