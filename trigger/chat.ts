import { anthropic } from "@ai-sdk/anthropic"
import {
  chat,
  defaultStorage,
  type InferChatUIMessageFromTools,
} from "@trigger.dev/sdk/ai"
import { asc, eq } from "drizzle-orm"
import { stepCountIs } from "ai"

import { db } from "@/lib/db/client"
import { chatMembers, chats } from "@/lib/db/schema"
import { createSandboxTools } from "@/trigger/sandbox-tools"

async function getChatBot(chatId: string) {
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
              sandboxId: true,
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

  return bot
}

type SandboxTools = ReturnType<typeof createSandboxTools>
export type BotChatMessage = InferChatUIMessageFromTools<SandboxTools>

export const botChat = chat
  .withUIMessage<BotChatMessage>({
    streamOptions: {
      onError: () => "The sandbox operation failed.",
    },
  })
  .agent({
    id: "bot-chat",
    storage: defaultStorage,
    tools: async ({ chatId }) => {
      const bot = await getChatBot(chatId)

      if (!bot.sandboxId) {
        throw new Error("This bot does not have a sandbox assigned.")
      }

      return createSandboxTools(bot.sandboxId)
    },
    run: async ({ chatId, messages, signal, streamText, tools }) => {
      const bot = await getChatBot(chatId)

      const purpose = bot.instructions?.trim()

      return streamText({
        model: anthropic("claude-haiku-5-5"),
        instructions: [
          `Your name is ${bot.name}.`,
          `Your job is ${bot.job}.`,
          purpose
            ? `Your purpose and working instructions are: ${purpose}`
            : `Your purpose is to assist the user as ${bot.job}.`,
          bot.sandboxId
            ? `Your working environment is a dedicated, isolated Daytona sandbox with the identifier ${bot.sandboxId}.`
            : "You do not currently have a sandbox environment assigned.",
        ].join("\n\n"),
        messages,
        tools,
        abortSignal: signal,
        stopWhen: stepCountIs(20),
      })
    },
  })
