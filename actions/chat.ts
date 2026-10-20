"use server"

import { auth as triggerAuth } from "@trigger.dev/sdk"
import { chat, defaultStorage } from "@trigger.dev/sdk/ai"

import { getChat } from "@/queries/chats"
import type { botChat } from "@/trigger/chat"

const startSession = chat.createStartSessionAction<typeof botChat>("bot-chat")
const loadTranscript = chat.createLoadTranscriptAction(defaultStorage)

async function requireChatOwner(chatId: string) {
  const currentChat = await getChat(chatId)

  if (!currentChat) {
    throw new Error("Chat not found.")
  }
}

export async function startChatSession({ chatId }: { chatId: string }) {
  await requireChatOwner(chatId)
  return startSession({ chatId })
}

export async function mintChatAccessToken(chatId: string) {
  await requireChatOwner(chatId)

  return triggerAuth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  })
}

export async function loadChatTranscript(params: {
  chatId: string
  limit?: number
}) {
  await requireChatOwner(params.chatId)
  return loadTranscript(params)
}
