import "server-only"

import { Daytona, DaytonaNotFoundError, SandboxState } from "@daytona/sdk"

const daytonaApiUrl =
  process.env.DAYTONA_API_URL || "https://app.daytona.io/api"
const VNC_PORT = 6080
const VNC_URL_TTL_SECONDS = 60 * 60 * 24

export async function createSandbox() {
  const daytona = new Daytona({ apiUrl: daytonaApiUrl })
  return daytona.create()
}

export async function deleteSandbox(sandboxId: string) {
  const daytona = new Daytona({ apiUrl: daytonaApiUrl })

  try {
    const sandbox = await daytona.get(sandboxId)
    await daytona.delete(sandbox)
  } catch (error) {
    if (!(error instanceof DaytonaNotFoundError)) {
      throw error
    }
  }
}

export async function getSandboxVncUrl(sandboxId: string) {
  const daytona = new Daytona({ apiUrl: daytonaApiUrl })
  const sandbox = await daytona.get(sandboxId)

  if (sandbox.state !== SandboxState.STARTED) {
    await sandbox.start()
  }

  const status = await sandbox.computerUse.getStatus().catch(() => undefined)

  if (status?.status?.toLowerCase() !== "running") {
    await sandbox.computerUse.start()
  }

  const preview = await sandbox.getSignedPreviewUrl(
    VNC_PORT,
    VNC_URL_TTL_SECONDS
  )
  const url = new URL("/vnc.html", preview.url)

  url.searchParams.set("autoconnect", "true")
  url.searchParams.set("resize", "scale")

  return url.toString()
}
