import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stellarAddress, ...jobData } = body;

    if (!stellarAddress) {
      return NextResponse.json(
        { error: "Wallet no conectada" },
        { status: 400 }
      );
    }

    // Upsert user by stellarAddress
    const user = await prisma.user.upsert({
      where: { stellarAddress },
      update: { lastSeenAt: new Date() },
      create: {
        stellarAddress,
        displayName: `Usuario ${stellarAddress.slice(0, 6)}...`,
        role: "EMPLOYER",
      },
    });

    // Generate unique engagementId for Trustless Work
    const engagementId = `brujula_${Date.now()}_${generateId(6)}`;

    const skillsText = Array.isArray(jobData.skills)
      ? jobData.skills.join(", ")
      : jobData.skills || "";

    const job = await prisma.job.create({
      data: {
        employerId: user.id,
        employerAddress: stellarAddress,
        title: jobData.title,
        description: jobData.description,
        deliverables: jobData.deliverables?.join(", ") || "",
        requirements: jobData.requirements || "",
        amount: jobData.amount,
        estimatedDays: jobData.estimatedDays,
        deadline: jobData.deadline ? new Date(jobData.deadline) : null,
        status: "OPEN",
        engagementId,
        category: jobData.category || "",
        skills: skillsText,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      engagementId,
    });
  } catch (error) {
    console.error("Error creando job:", error);
    return NextResponse.json(
      { error: "Error al crear el trabajo" },
      { status: 500 }
    );
  }
}
