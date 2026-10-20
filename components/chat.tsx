"use client"

import { useCallback, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { TriggerChatTransport } from "@trigger.dev/sdk/chat"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import type { UIMessage } from "ai"

import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { ChatAvatar } from "@/components/chat-avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { botChat } from "@/trigger/chat"

export function Chat({
  chatId,
  bot,
}: {
  chatId: string
  bot: { name: string; avatar: string; job: string }
}) {
  const transport = useTriggerChatTransport<typeof botChat>({
    task: "bot-chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId }) => startChatSession({ chatId }),
  })
  const transcript = useLoadTranscript(chatId, loadChatTranscript, {
    transport,
  })

  if (transcript.isLoading) {
    return <div className="min-h-0 flex-1" />
  }

  return (
    <ChatConversation
      chatId={chatId}
      bot={bot}
      initialMessages={transcript.messages}
      transcriptError={transcript.error}
      transport={transport}
    />
  )
}

function ChatConversation({
  chatId,
  bot,
  initialMessages,
  transcriptError,
  transport,
}: {
  chatId: string
  bot: { name: string; avatar: string; job: string }
  initialMessages: UIMessage[]
  transcriptError?: Error
  transport: TriggerChatTransport
}) {
  const [input, setInput] = useState("")
  const {
    messages,
    sendMessage,
    status,
    stop: stopChat,
    error,
  } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  })
  const isGenerating = status === "submitted" || status === "streaming"
  const stop = useCallback(() => {
    stopChat()
    transport.stopGeneration(chatId)
  }, [chatId, stopChat, transport])

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim()

    if (!text || isGenerating) return

    sendMessage({ text })
    setInput("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<ChatAvatar seed={bot.avatar} className="size-12" />}
              title={`Chat with ${bot.name}`}
              description={`${bot.job}. Send a message to get started.`}
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${index}`}>
                        {part.text}
                      </MessageResponse>
                    ) : null
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {(error || transcriptError) && (
            <Alert variant="destructive">
              <AlertTitle>Message failed</AlertTitle>
              <AlertDescription>
                Something went wrong. Please try again.
              </AlertDescription>
            </Alert>
          )}
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder={`Message ${bot.name}`}
                disabled={isGenerating}
              />
            </PromptInputBody>
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                onStop={stop}
                disabled={!isGenerating && !input.trim()}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
