import { getTrustlessWorkClient } from "@/lib/trustlesswork/client";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";

export async function releaseFundsServerSide(agreementId: string): Promise<string> {
  const client = getTrustlessWorkClient();

  // Get agreement with job data
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    include: {
      job: { select: { id: true, title: true, amount: true } },
    },
  });

  if (!agreement) {
    throw new Error("Acuerdo no encontrado");
  }

  let txHash: string;

  try {
    // Step 1: Call Trustless Work to get unsigned XDR for release
    const response = await client.releaseFundsSingleRelease({
      contractId: agreement.escrowContractId,
      releaseSigner: process.env.BRUJULA_STELLAR_PUBLIC_KEY!,
    });

    if (!response.unsignedTransaction) {
      throw new Error("No se recibio unsignedTransaction para release");
    }

    // Step 2: Sign server-side with Brujula's secret key
    const secretKey = process.env.BRUJULA_STELLAR_SECRET_KEY;
    if (!secretKey) {
      throw new Error("BRUJULA_STELLAR_SECRET_KEY no esta configurada");
    }

    const keypair = Keypair.fromSecret(secretKey);
    const transaction = TransactionBuilder.fromXDR(
      response.unsignedTransaction,
      Networks.TESTNET
    );
    transaction.sign(keypair);
    const signedXdr = transaction.toXDR();

    // Step 3: Send signed transaction to Stellar
    const sendResponse = await client.sendTransaction({ signedXdr });
    txHash = sendResponse.transactionHash || sendResponse.contractId || `tx_${Date.now()}_${generateId(8)}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("funds have been released")) {
      // Already released on-chain from a previous attempt
      txHash = `tx_released_${Date.now()}_${generateId(8)}`;
    } else {
      throw err;
    }
  }

  // Step 4: Record transactions and update statuses in a single transaction
  const platformFee = Math.round(agreement.job.amount * 0.02 * 100) / 100;
  const freelancerAmount = agreement.job.amount;

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        agreementId,
        jobId: agreement.job.id,
        type: "RELEASE",
        amount: freelancerAmount,
        txHash,
        status: "CONFIRMED",
        fromAddress: agreement.escrowContractId,
        toAddress: agreement.freelancerAddress,
        confirmedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        agreementId,
        jobId: agreement.job.id,
        type: "PLATFORM_FEE",
        amount: platformFee,
        txHash: `${txHash}_fee`,
        status: "CONFIRMED",
        fromAddress: agreement.escrowContractId,
        toAddress: process.env.BRUJULA_STELLAR_PUBLIC_KEY!,
        confirmedAt: new Date(),
      },
    }),
    prisma.agreement.update({
      where: { id: agreementId },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.job.update({
      where: { id: agreement.job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
  ]);

  // Step 5: Notify employer
  await createNotification({
    userId: agreement.employerId,
    type: "PAYMENT_RELEASED",
    title: "Pago liberado",
    message: `Los fondos de "${agreement.job.title}" ($${freelancerAmount} USDC) fueron liberados al freelancer.`,
    actionUrl: `/dashboard/employer`,
  });

  return txHash;
}
