"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { bots, createBotSchema, insertBotSchema } from "@/lib/db/schema"

export async function createBot(input: unknown) {
  const { userId } = await auth.protect()
  const parsed = createBotSchema.safeParse(input)

  if (!parsed.success) {
    return { error: "Check the bot's name, face, and job, then try again." }
  }

  const values = insertBotSchema.parse({ ...parsed.data, userId })

  try {
    await db.insert(bots).values(values)
  } catch {
    return { error: "Couldn't create your bot. Please try again." }
  }

  revalidatePath("/")
  return { success: true }
}
