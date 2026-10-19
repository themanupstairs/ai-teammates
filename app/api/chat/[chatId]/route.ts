import { anthropic } from "@ai-sdk/anthropic"
import { auth } from "@clerk/nextjs/server"
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai"

import { getChat } from "@/queries/chats"

export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  await auth.protect()

  const { chatId } = await params
  const chat = await getChat(chatId)
  const bot = chat?.members[0]?.bot

  if (!bot) {
    return Response.json({ error: "Chat not found." }, { status: 404 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const messages =
    body && typeof body === "object" && "messages" in body
      ? body.messages
      : undefined
  const validatedMessages = await safeValidateUIMessages({ messages })

  if (!validatedMessages.success) {
    return Response.json({ error: "Invalid messages." }, { status: 400 })
  }

  const result = streamText({
    model: anthropic("claude-haiku-5-5"),
    instructions: [
      `You are ${bot.name}. Your role is ${bot.job}.`,
      bot.instructions?.trim(),
    ]
      .filter(Boolean)
      .join("\n\n"),
    messages: await convertToModelMessages(validatedMessages.data),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
