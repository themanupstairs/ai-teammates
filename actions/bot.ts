"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"

import { createSandbox, deleteSandbox } from "@/lib/daytona"
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

  let sandboxId: string

  try {
    const sandbox = await createSandbox()
    sandboxId = sandbox.id
  } catch {
    return { error: "Couldn't create your bot. Please try again." }
  }

  try {
    await db.batch([
      db.insert(bots).values({ ...values, id: botId, sandboxId }),
      db.insert(chats).values({ id: chatId, userId, kind: "direct" }),
      db.insert(chatMembers).values({ chatId, botId }),
    ])
  } catch {
    try {
      await deleteSandbox(sandboxId)
    } catch {
      // The bot was not created, so cleanup is best-effort.
    }

    return { error: "Couldn't create your bot. Please try again." }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateBot(botId: string, input: unknown) {
  const { userId } = await auth.protect()
  const parsed = createBotSchema.safeParse(input)

  if (!parsed.success) {
    return { error: "Check the bot's name, face, and job, then try again." }
  }

  try {
    const updatedBots = await db
      .update(bots)
      .set(parsed.data)
      .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
      .returning({ id: bots.id })

    if (updatedBots.length === 0) {
      return { error: "Couldn't find that bot." }
    }
  } catch {
    return { error: "Couldn't update your bot. Please try again." }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteBot(botId: string) {
  const { userId } = await auth.protect()

  try {
    const bot = await db.query.bots.findFirst({
      columns: { id: true, sandboxId: true },
      where: and(eq(bots.id, botId), eq(bots.userId, userId)),
    })

    if (!bot) {
      return { error: "Couldn't find that bot." }
    }

    if (bot.sandboxId) {
      try {
        await deleteSandbox(bot.sandboxId)
      } catch {
        return { error: "Couldn't delete your bot. Please try again." }
      }
    }

    const directChatIds = db
      .select({ id: chatMembers.chatId })
      .from(chatMembers)
      .where(eq(chatMembers.botId, botId))

    await db.batch([
      db
        .delete(chats)
        .where(
          and(
            eq(chats.userId, userId),
            eq(chats.kind, "direct"),
            inArray(chats.id, directChatIds)
          )
        ),
      db.delete(bots).where(and(eq(bots.id, botId), eq(bots.userId, userId))),
    ])
  } catch {
    return { error: "Couldn't delete your bot. Please try again." }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
