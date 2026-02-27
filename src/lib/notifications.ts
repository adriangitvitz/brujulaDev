import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  type,
  title,
  message,
  actionUrl,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, actionUrl },
  });
  return notification.id;
}
