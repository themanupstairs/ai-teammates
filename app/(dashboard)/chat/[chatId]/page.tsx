import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { getSandboxVncUrl } from "@/lib/daytona"
import { getChat } from "@/queries/chats"
import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"
import { ChatResizablePanelGroup } from "@/components/chat-resizable-panel-group"
import { DaytonaVncPreview } from "@/components/daytona-vnc-preview"
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable"

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

  if (!bot?.sandboxId) notFound()

  const vncUrl = await getSandboxVncUrl(bot.sandboxId)

  return (
    <ChatResizablePanelGroup orientation="horizontal" className="h-svh">
      <ResizablePanel id="chat" defaultSize="100%" minSize="40%">
        <main className="flex h-full flex-col overflow-hidden bg-background text-foreground">
          <ChatHeader chat={chat} />
          <Chat
            key={chatId}
            chatId={chatId}
            bot={{ name: bot.name, avatar: bot.avatar, job: bot.job }}
          />
        </main>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        id="desktop"
        defaultSize="0%"
        minSize="20%"
        maxSize="60%"
        collapsible
      >
        <DaytonaVncPreview name={bot.name} url={vncUrl} />
      </ResizablePanel>
    </ChatResizablePanelGroup>
  )
}
