import "server-only"

import { Daytona, DaytonaNotFoundError } from "@daytona/sdk"

const daytonaApiUrl =
  process.env.DAYTONA_API_URL || "https://app.daytona.io/api"

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
