"use client"

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type StatePreservingHost = HTMLDivElement & {
  moveBefore?: (node: Node, child: Node | null) => void
}

export function DaytonaVncPreview({
  name,
  url,
}: {
  name: string
  url: string
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const previewHostRef = useRef<HTMLDivElement>(null)
  const dialogHostRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const moveVncTo = useCallback(
    (host: HTMLDivElement) => {
      let iframe = iframeRef.current

      if (!iframe) {
        iframe = document.createElement("iframe")
        iframe.src = url
        iframe.title = `${name}'s desktop`
        iframe.allow = "clipboard-read; clipboard-write"
        iframe.allowFullscreen = true
        iframe.className = "size-full border-0"
        iframeRef.current = iframe
      }

      if (!iframe.isConnected) {
        host.appendChild(iframe)
      } else if (iframe.parentElement !== host) {
        const statePreservingHost = host as StatePreservingHost

        if (statePreservingHost.moveBefore) {
          statePreservingHost.moveBefore(iframe, null)
        } else {
          host.appendChild(iframe)
        }
      }

      if (isFullscreen) {
        requestAnimationFrame(() => iframe.focus())
      }
    },
    [isFullscreen, name, url]
  )

  useLayoutEffect(() => {
    const host = isFullscreen ? dialogHostRef.current : previewHostRef.current

    if (host) moveVncTo(host)
  }, [isFullscreen, moveVncTo])

  const handleOpenChange: NonNullable<
    ComponentProps<typeof Dialog>["onOpenChange"]
  > = (open, eventDetails) => {
    if (open || eventDetails.reason === "close-press") {
      setIsFullscreen(open)
    }
  }

  return (
    <>
      <div className="flex h-full flex-col items-center gap-3 bg-muted/30 p-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-background">
          <div ref={previewHostRef} className="size-full" />
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-0 size-full"
            aria-label={`Open ${name}'s desktop in fullscreen`}
            onClick={() => setIsFullscreen(true)}
          />
        </div>
        <p className="text-sm text-muted-foreground">{name}&apos;s screen</p>
      </div>

      <Dialog
        open={isFullscreen}
        onOpenChange={handleOpenChange}
        disablePointerDismissal
      >
        <DialogContent
          className="h-svh w-screen max-w-none gap-0 rounded-none p-0 sm:max-w-none"
          initialFocus={false}
        >
          <DialogTitle className="sr-only">{name}&apos;s desktop</DialogTitle>
          <div
            ref={dialogHostRef}
            className="size-full min-h-0 overflow-hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
