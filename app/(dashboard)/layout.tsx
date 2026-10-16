import { formatDistanceToNowStrict } from "date-fns"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getUserChats } from "@/queries/bots"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const chats = await getUserChats()

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats.map((chat) => ({
          ...chat,
          lastMessageAge: formatDistanceToNowStrict(chat.lastMessageAt),
        }))}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </SidebarProvider>
  )
}
