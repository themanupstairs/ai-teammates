import { MonitorIcon } from "lucide-react"

import type { Chat } from "@/queries/chats"
import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"

export function ChatHeader({ chat }: { chat: Chat }) {
  const bot = chat.members[0]?.bot
  const name = bot?.name ?? chat.name ?? "Untitled chat"

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4">
      {bot ? (
        <BotDialog
          seed={bot.avatar}
          bot={{
            id: bot.id,
            name: bot.name,
            avatar: bot.avatar,
            job: bot.job,
            instructions: bot.instructions ?? "",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 min-w-0 justify-start"
            aria-label={`Edit ${name}`}
          >
            <ChatAvatar seed={bot.avatar} className="size-7 shrink-0" />
            <span className="truncate">{name}</span>
          </Button>
        </BotDialog>
      ) : (
        <h1 className="truncate text-sm font-medium">{name}</h1>
      )}
      <Button type="button" variant="ghost" size="icon" aria-label="Desktop">
        <MonitorIcon />
      </Button>
    </header>
  )
}
