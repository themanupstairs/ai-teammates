import { anthropic } from "@ai-sdk/anthropic"
import { chat, defaultStorage } from "@trigger.dev/sdk/ai"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db/client"
import { chatMembers, chats } from "@/lib/db/schema"

export const botChat = chat.agent({
  id: "bot-chat",
  storage: defaultStorage,
  run: async ({ chatId, messages, signal, streamText }) => {
    const currentChat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
      with: {
        members: {
          columns: {},
          orderBy: [asc(chatMembers.joinedAt), asc(chatMembers.botId)],
          limit: 1,
          with: {
            bot: {
              columns: {
                name: true,
                job: true,
                instructions: true,
              },
            },
          },
        },
      },
    })
    const bot = currentChat?.members[0]?.bot

    if (!bot) {
      throw new Error("Chat not found.")
    }

    return streamText({
      model: anthropic("claude-haiku-5-5"),
      instructions: [
        `You are ${bot.name}. Your role is ${bot.job}.`,
        bot.instructions?.trim(),
      ]
        .filter(Boolean)
        .join("\n\n"),
      messages,
      abortSignal: signal,
    })
  },
})
