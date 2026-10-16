import { auth } from "@clerk/nextjs/server"
import { PlusIcon } from "lucide-react"
import { nanoid } from "nanoid"

import { ChatAvatar } from "@/components/chat-avatar"
import { BotDialog } from "@/components/bot-dialog"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page() {
  await auth.protect()

  return (
    <main className="dark flex min-h-svh bg-background text-foreground">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <ChatAvatar seed={nanoid()} animated />
          </EmptyMedia>
          <EmptyTitle>Meet your first bot</EmptyTitle>
          <EmptyDescription>
            Every bot gets its own personality, memory, and face. Spin one up
            and start the conversation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <BotDialog seed={nanoid()}>
            <Button variant="secondary">
              <PlusIcon data-icon="inline-start" />
              Create a new bot
            </Button>
          </BotDialog>
        </EmptyContent>
      </Empty>
    </main>
  )
}
