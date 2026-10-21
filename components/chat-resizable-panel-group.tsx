"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react"
import { MonitorIcon } from "lucide-react"
import { useGroupRef, type Layout } from "react-resizable-panels"

import { Button } from "@/components/ui/button"
import { ResizablePanelGroup } from "@/components/ui/resizable"

const CHAT_PANEL_ID = "chat"
const DESKTOP_PANEL_ID = "desktop"
const DEFAULT_DESKTOP_SIZE = 30

type ChatDesktopPanelContextValue = {
  isDesktopPanelOpen: boolean
  toggleDesktopPanel: () => void
}

const ChatDesktopPanelContext =
  createContext<ChatDesktopPanelContextValue | null>(null)

export function ChatResizablePanelGroup({
  onLayoutChanged,
  ...props
}: ComponentProps<typeof ResizablePanelGroup>) {
  const groupRef = useGroupRef()
  const lastDesktopSizeRef = useRef(DEFAULT_DESKTOP_SIZE)
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState(false)

  const handleLayoutChanged = useCallback(
    (
      layout: Layout,
      meta: Parameters<NonNullable<typeof onLayoutChanged>>[1]
    ) => {
      const desktopSize = layout[DESKTOP_PANEL_ID] ?? 0

      if (desktopSize > 0) {
        lastDesktopSizeRef.current = desktopSize
      }

      setIsDesktopPanelOpen(desktopSize > 0)
      onLayoutChanged?.(layout, meta)
    },
    [onLayoutChanged]
  )

  const toggleDesktopPanel = useCallback(() => {
    const group = groupRef.current

    if (!group) return

    const layout = group.getLayout()
    const desktopSize = layout[DESKTOP_PANEL_ID] ?? 0

    if (desktopSize > 0) {
      lastDesktopSizeRef.current = desktopSize
      group.setLayout({ [CHAT_PANEL_ID]: 100, [DESKTOP_PANEL_ID]: 0 })
      setIsDesktopPanelOpen(false)
      return
    }

    const nextDesktopSize = lastDesktopSizeRef.current
    group.setLayout({
      [CHAT_PANEL_ID]: 100 - nextDesktopSize,
      [DESKTOP_PANEL_ID]: nextDesktopSize,
    })
    setIsDesktopPanelOpen(true)
  }, [groupRef])

  const contextValue = useMemo(
    () => ({ isDesktopPanelOpen, toggleDesktopPanel }),
    [isDesktopPanelOpen, toggleDesktopPanel]
  )

  return (
    <ChatDesktopPanelContext.Provider value={contextValue}>
      <ResizablePanelGroup
        {...props}
        groupRef={groupRef}
        onLayoutChanged={handleLayoutChanged}
      />
    </ChatDesktopPanelContext.Provider>
  )
}

export function useChatDesktopPanel() {
  const context = useContext(ChatDesktopPanelContext)

  if (!context) {
    throw new Error(
      "useChatDesktopPanel must be used within ChatResizablePanelGroup"
    )
  }

  return context
}

export function ChatDesktopPanelToggle() {
  const { isDesktopPanelOpen, toggleDesktopPanel } = useChatDesktopPanel()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        isDesktopPanelOpen ? "Close desktop panel" : "Open desktop panel"
      }
      aria-controls={DESKTOP_PANEL_ID}
      aria-expanded={isDesktopPanelOpen}
      onClick={toggleDesktopPanel}
    >
      <MonitorIcon data-icon="inline-start" />
    </Button>
  )
}
