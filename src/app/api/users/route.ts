import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stellarAddress = searchParams.get("stellarAddress");

    if (!stellarAddress) {
      return NextResponse.json({ error: "Se requiere stellarAddress" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { stellarAddress },
      select: { id: true },
    });

    return NextResponse.json({ userId: user?.id || null });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}
