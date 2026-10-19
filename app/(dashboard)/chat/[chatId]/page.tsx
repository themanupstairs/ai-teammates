import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { getChat } from "@/queries/chats"
import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  await auth.protect()
  const { chatId } = await params
  const chat = await getChat(chatId)

  if (!chat) notFound()
  const bot = chat.members[0]?.bot

  if (!bot) notFound()

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <ChatHeader chat={chat} />
      <Chat
        key={chatId}
        chatId={chatId}
        bot={{ name: bot.name, avatar: bot.avatar, job: bot.job }}
      />
    </main>
  )
}
