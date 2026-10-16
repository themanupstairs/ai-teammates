import "server-only"

import { auth } from "@clerk/nextjs/server"
import { asc, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { chatMembers, chats } from "@/lib/db/schema"

export async function getUserChats() {
  const { userId } = await auth.protect()

  return db.query.chats.findMany({
    columns: {
      id: true,
      name: true,
      lastMessagePreview: true,
      lastMessageAt: true,
    },
    where: eq(chats.userId, userId),
    orderBy: [desc(chats.lastMessageAt), desc(chats.createdAt)],
    with: {
      members: {
        columns: {},
        orderBy: [asc(chatMembers.joinedAt), asc(chatMembers.botId)],
        limit: 1,
        with: {
          bot: {
            columns: { name: true, avatar: true },
          },
        },
      },
    },
  })
}

export type UserChat = Awaited<ReturnType<typeof getUserChats>>[number]
