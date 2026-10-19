import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { getChat } from "@/queries/chats"
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

  return (
    <main className="flex min-h-svh flex-col">
      <ChatHeader chat={chat} />
    </main>
  )
}
