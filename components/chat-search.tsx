"use client"

import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import type { UserChat } from "@/queries/bots"

export function ChatSearch({
  chats,
}: {
  chats: (UserChat & { lastMessageAge: string })[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.repeat
      ) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-8 w-full min-w-0 justify-start rounded-lg border border-input bg-transparent px-2.5 py-1 text-base font-normal text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        aria-label="Search chats"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
      >
        <SearchIcon data-icon="inline-start" />
        Search
        <KbdGroup className="ml-auto">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search chats"
        description="Find a chat by its name or recent message."
      >
        <Command>
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chats.map((chat) => {
                const bot = chat.members[0]?.bot
                const name = chat.name ?? bot?.name ?? "Untitled chat"

                return (
                  <CommandItem
                    key={chat.id}
                    value={chat.id}
                    keywords={[
                      name,
                      bot?.name ?? "",
                      chat.lastMessagePreview ?? "",
                    ]}
                    onSelect={() => {
                      setOpen(false)
                      router.push(`/chats/${chat.id}`)
                    }}
                    className="gap-3 py-3"
                  >
                    <ChatAvatar
                      seed={bot?.avatar ?? chat.id}
                      className="size-8 shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{name}</span>
                        <time
                          dateTime={chat.lastMessageAt.toISOString()}
                          className="shrink-0 text-xs text-muted-foreground"
                        >
                          {chat.lastMessageAge}
                        </time>
                      </div>
                      <span className="truncate text-muted-foreground">
                        {chat.lastMessagePreview}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
