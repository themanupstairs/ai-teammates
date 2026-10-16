"use client"

import { useId, useState } from "react"
import { UserButton } from "@clerk/nextjs"
import { PlusIcon, UsersIcon } from "lucide-react"
import Link from "next/link"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { ChatSearch } from "@/components/chat-search"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { UserChat } from "@/queries/bots"

export function AppSidebar({
  chats,
}: {
  chats: (UserChat & { lastMessageAge: string })[]
}) {
  const [botDialogOpen, setBotDialogOpen] = useState(false)
  const seed = useId()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
              aria-label="Create"
            >
              <PlusIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
                  <PlusIcon />
                  Create new bot
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UsersIcon />
                  Create group chat
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ChatSearch chats={chats} />
      </SidebarHeader>
      <BotDialog
        seed={seed}
        open={botDialogOpen}
        onOpenChange={setBotDialogOpen}
      />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => {
                const bot = chat.members[0]?.bot

                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      render={<Link href={`/chats/${chat.id}`} />}
                      size="lg"
                      className="h-16 gap-3"
                    >
                      <ChatAvatar
                        seed={bot?.avatar ?? chat.id}
                        className="size-8 shrink-0"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">
                            {chat.name ?? bot?.name ?? "Untitled chat"}
                          </span>
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
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<div />} className="p-0">
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: "size-full min-w-0",
                    userButtonTrigger:
                      "size-full rounded-md px-2 py-1.5 text-inherit shadow-none",
                    userButtonBox: "w-full min-w-0 flex-row-reverse! gap-2",
                    userButtonAvatarBox: "size-6 shrink-0",
                    userButtonOuterIdentifier:
                      "min-w-0 flex-1 truncate p-0 text-left text-sm font-normal group-data-[collapsible=icon]:hidden",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
