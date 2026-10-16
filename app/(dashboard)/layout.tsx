import { formatDistanceToNowStrict } from "date-fns"
import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getUserChats } from "@/queries/bots"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const chats = await getUserChats()
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
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
