"use server"

import { auth } from "@clerk/nextjs/server"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import {
  bots,
  chatMembers,
  chats,
  createBotSchema,
  insertBotSchema,
} from "@/lib/db/schema"

export async function createBot(input: unknown) {
  const { userId } = await auth.protect()
  const parsed = createBotSchema.safeParse(input)

  if (!parsed.success) {
    return { error: "Check the bot's name, face, and job, then try again." }
  }

  const values = insertBotSchema.parse({ ...parsed.data, userId })
  const botId = nanoid()
  const chatId = nanoid()

  try {
    await db.batch([
      db.insert(bots).values({ ...values, id: botId }),
      db.insert(chats).values({ id: chatId, userId, kind: "direct" }),
      db.insert(chatMembers).values({ chatId, botId }),
    ])
  } catch {
    return { error: "Couldn't create your bot. Please try again." }
  }

  revalidatePath("/")
  return { success: true }
}
