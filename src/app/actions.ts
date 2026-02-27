"use server";

import { prisma } from "@/lib/prisma";

export async function getJobs(status?: string) {
  return prisma.job.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({ where: { id } });
}

export async function getUserByAddress(stellarAddress: string) {
  return prisma.user.findUnique({ where: { stellarAddress } });
}

export async function getUserIdByAddress(stellarAddress: string) {
  const user = await prisma.user.findUnique({
    where: { stellarAddress },
    select: { id: true },
  });
  return user?.id || null;
}

export async function getApplicationsByJobId(jobId: string) {
  return prisma.application.findMany({
    where: { jobId },
    orderBy: { appliedAt: "desc" },
  });
}

export async function getApplicationsByFreelancerAddress(address: string) {
  return prisma.application.findMany({
    where: { freelancerAddress: address },
    include: {
      job: { select: { title: true, amount: true, status: true } },
    },
    orderBy: { appliedAt: "desc" },
  });
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getAgreementsByFreelancerAddress(address: string) {
  return prisma.agreement.findMany({
    where: { freelancerAddress: address },
    include: {
      job: { select: { title: true, amount: true, deliverables: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAgreementsByEmployerAddress(address: string) {
  return prisma.agreement.findMany({
    where: { employerAddress: address },
    include: {
      job: { select: { title: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAgreementById(id: string) {
  return prisma.agreement.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          title: true,
          amount: true,
          deliverables: true,
          description: true,
          escrowContractId: true,
          engagementId: true,
        },
      },
    },
  });
}
