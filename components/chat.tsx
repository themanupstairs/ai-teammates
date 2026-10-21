"use client"

import { useCallback, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { TriggerChatTransport } from "@trigger.dev/sdk/chat"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import { getToolName, isToolUIPart } from "ai"

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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool"
import { ChatAvatar } from "@/components/chat-avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { BotChatMessage, botChat } from "@/trigger/chat"

const toolTitles: Record<string, string> = {
  bash: "Run command",
  keyboardPress: "Press key",
  keyboardType: "Type text",
  listFiles: "List files",
  mouseClick: "Click mouse",
  mouseMove: "Move mouse",
  mouseScroll: "Scroll",
  readFile: "Read file",
  showScreen: "Show screen",
  viewScreen: "View screen",
  writeFile: "Write file",
}

function isScreenshotOutput(
  output: unknown
): output is { base64: string; mediaType: string } {
  return (
    typeof output === "object" &&
    output !== null &&
    "base64" in output &&
    typeof output.base64 === "string" &&
    "mediaType" in output &&
    typeof output.mediaType === "string"
  )
}

function ChatTool({ part }: { part: ToolPart }) {
  const toolName = getToolName(part)

  if (toolName === "viewScreen") return null

  const output = part.state === "output-available" ? part.output : undefined
  const errorText = part.state === "output-error" ? part.errorText : undefined
  const renderedOutput =
    toolName === "showScreen" && isScreenshotOutput(output) ? (
      // The screenshot is intentionally shown only for the explicit showScreen tool.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt="Sandbox screen"
        className="h-auto w-full rounded-md"
        src={`data:${output.mediaType};base64,${output.base64}`}
      />
    ) : (
      output
    )

  return (
    <Tool
      defaultOpen={toolName === "showScreen" || part.state === "output-error"}
    >
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          type={part.type}
          state={part.state}
          title={toolTitles[toolName] ?? toolName}
          toolName={part.toolName}
        />
      ) : (
        <ToolHeader
          type={part.type}
          state={part.state}
          title={toolTitles[toolName] ?? toolName}
        />
      )}
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput output={renderedOutput} errorText={errorText} />
      </ToolContent>
    </Tool>
  )
}

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
  const transcript = useLoadTranscript<BotChatMessage>(
    chatId,
    loadChatTranscript,
    {
      transport,
    }
  )

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
  initialMessages: BotChatMessage[]
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
  } = useChat<BotChatMessage>({
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
                <MessageContent
                  className={
                    message.role === "assistant" ? "w-full" : undefined
                  }
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={`${message.id}-${index}`}>
                          {part.text}
                        </MessageResponse>
                      )
                    }

                    if (isToolUIPart(part)) {
                      return <ChatTool key={part.toolCallId} part={part} />
                    }

                    return null
                  })}
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
