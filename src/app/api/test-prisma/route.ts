import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Clean up orphaned 'unknown' txHash records
    const deleted = await prisma.transaction.deleteMany({
      where: { txHash: "unknown" },
    });

    // Test basic connection by counting users
    const userCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      message: "Prisma conectado correctamente",
      userCount,
      cleanedUpTransactions: deleted.count,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
