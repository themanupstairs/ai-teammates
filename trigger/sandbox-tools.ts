import { Daytona, SandboxState, type Sandbox } from "@daytona/sdk"
import { tool } from "ai"
import { z } from "zod"

const MAX_COMMAND_OUTPUT_LENGTH = 50_000
const MAX_FILE_CONTENT_LENGTH = 200_000
const MAX_LISTED_FILES = 500
const daytonaApiUrl =
  process.env.DAYTONA_API_URL || "https://app.daytona.io/api"

const pointSchema = {
  x: z.number().int().nonnegative().describe("Horizontal screen coordinate."),
  y: z.number().int().nonnegative().describe("Vertical screen coordinate."),
}

type ScreenshotOutput = {
  base64: string
  mediaType: "image/jpeg"
}

function screenshotToModelOutput({ output }: { output: ScreenshotOutput }) {
  return {
    type: "content" as const,
    value: [
      {
        type: "file" as const,
        mediaType: output.mediaType,
        data: { type: "data" as const, data: output.base64 },
      },
    ],
  }
}

async function startSandbox(sandboxId: string) {
  const daytona = new Daytona({ apiUrl: daytonaApiUrl })
  const sandbox = await daytona.get(sandboxId)

  if (sandbox.state !== SandboxState.STARTED) {
    await sandbox.start()
  }

  return sandbox
}

export function createSandboxTools(sandboxId: string) {
  let sandboxPromise: Promise<Sandbox> | undefined
  let computerReadyPromise: Promise<Sandbox> | undefined

  const getSandbox = () => {
    sandboxPromise ??= startSandbox(sandboxId)
    return sandboxPromise
  }

  const getComputerSandbox = () => {
    computerReadyPromise ??= getSandbox().then(async (sandbox) => {
      const status = await sandbox.computerUse
        .getStatus()
        .catch(() => undefined)

      if (status?.status?.toLowerCase() !== "running") {
        await sandbox.computerUse.start()
      }

      return sandbox
    })

    return computerReadyPromise
  }

  const takeScreenshot = async (): Promise<ScreenshotOutput> => {
    const sandbox = await getComputerSandbox()
    const response = await sandbox.computerUse.screenshot.takeCompressed({
      format: "jpeg",
      quality: 70,
      scale: 0.65,
      showCursor: true,
    })

    if (!response.screenshot) {
      throw new Error("The sandbox did not return a screenshot.")
    }

    return { base64: response.screenshot, mediaType: "image/jpeg" }
  }

  return {
    bash: tool({
      description:
        "Run a shell command in the isolated sandbox. Use this for terminal tasks and command-line programs.",
      inputSchema: z.object({
        command: z.string().min(1).describe("The shell command to run."),
        cwd: z
          .string()
          .min(1)
          .optional()
          .describe("Optional working directory inside the sandbox."),
        timeoutSeconds: z
          .number()
          .int()
          .min(1)
          .max(120)
          .default(60)
          .describe("Maximum command runtime in seconds."),
      }),
      execute: async ({ command, cwd, timeoutSeconds }) => {
        const sandbox = await getSandbox()
        const result = await sandbox.process.executeCommand(
          command,
          cwd,
          undefined,
          timeoutSeconds
        )
        const truncated = result.result.length > MAX_COMMAND_OUTPUT_LENGTH

        return {
          exitCode: result.exitCode,
          output: result.result.slice(0, MAX_COMMAND_OUTPUT_LENGTH),
          truncated,
        }
      },
    }),
    readFile: tool({
      description: "Read a UTF-8 text file from the isolated sandbox.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Path to the file in the sandbox."),
      }),
      execute: async ({ path }) => {
        const sandbox = await getSandbox()
        const file = await sandbox.fs.downloadFile(path)
        const content = file.toString("utf8")
        const truncated = content.length > MAX_FILE_CONTENT_LENGTH

        return {
          path,
          content: content.slice(0, MAX_FILE_CONTENT_LENGTH),
          truncated,
        }
      },
    }),
    writeFile: tool({
      description:
        "Create or replace a UTF-8 text file in the isolated sandbox.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Destination path in the sandbox."),
        content: z.string().describe("Complete UTF-8 file contents."),
      }),
      execute: async ({ path, content }) => {
        const sandbox = await getSandbox()
        const file = Buffer.from(content, "utf8")
        await sandbox.fs.uploadFile(file, path)

        return { path, bytesWritten: file.byteLength }
      },
    }),
    listFiles: tool({
      description: "List files and directories in the isolated sandbox.",
      inputSchema: z.object({
        path: z
          .string()
          .min(1)
          .default(".")
          .describe("Directory path in the sandbox."),
        depth: z
          .number()
          .int()
          .min(1)
          .max(5)
          .default(1)
          .describe("Number of directory levels to include."),
      }),
      execute: async ({ path, depth }) => {
        const sandbox = await getSandbox()
        const files = await sandbox.fs.listFiles(path, { depth })
        const truncated = files.length > MAX_LISTED_FILES

        return {
          path,
          files: files.slice(0, MAX_LISTED_FILES).map((file) => ({
            path: file.path ?? file.name,
            name: file.name,
            isDirectory: file.isDir,
            size: file.size,
            modifiedAt: file.modifiedAt,
          })),
          truncated,
        }
      },
    }),
    mouseClick: tool({
      description: "Click at screen coordinates in the sandbox desktop.",
      inputSchema: z.object({
        ...pointSchema,
        button: z.enum(["left", "right", "middle"]).default("left"),
        doubleClick: z.boolean().default(false),
      }),
      execute: async ({ x, y, button, doubleClick }) => {
        const sandbox = await getComputerSandbox()
        await sandbox.computerUse.mouse.click(x, y, button, doubleClick)
        return { success: true, x, y, button, doubleClick }
      },
    }),
    mouseMove: tool({
      description:
        "Move the pointer to screen coordinates in the sandbox desktop.",
      inputSchema: z.object(pointSchema),
      execute: async ({ x, y }) => {
        const sandbox = await getComputerSandbox()
        await sandbox.computerUse.mouse.move(x, y)
        return { success: true, x, y }
      },
    }),
    mouseScroll: tool({
      description: "Scroll at screen coordinates in the sandbox desktop.",
      inputSchema: z.object({
        ...pointSchema,
        direction: z.enum(["up", "down", "left", "right"]),
        amount: z.number().int().min(1).max(20).default(3),
      }),
      execute: async ({ x, y, direction, amount }) => {
        const sandbox = await getComputerSandbox()
        await sandbox.computerUse.mouse.scroll(x, y, direction, amount)
        return { success: true, x, y, direction, amount }
      },
    }),
    keyboardType: tool({
      description: "Type text into the focused control in the sandbox desktop.",
      inputSchema: z.object({
        text: z.string().min(1).describe("Text to type."),
        delayMs: z
          .number()
          .int()
          .min(0)
          .max(500)
          .default(0)
          .describe("Delay between characters in milliseconds."),
      }),
      execute: async ({ text, delayMs }) => {
        const sandbox = await getComputerSandbox()
        await sandbox.computerUse.keyboard.type(text, delayMs)
        return { success: true, charactersTyped: text.length }
      },
    }),
    keyboardPress: tool({
      description:
        "Press a keyboard key, optionally with modifier keys, in the sandbox desktop.",
      inputSchema: z.object({
        key: z
          .string()
          .min(1)
          .describe("Key such as enter, escape, tab, or c."),
        modifiers: z
          .array(z.enum(["ctrl", "alt", "shift", "cmd"]))
          .max(4)
          .default([]),
      }),
      execute: async ({ key, modifiers }) => {
        const sandbox = await getComputerSandbox()
        await sandbox.computerUse.keyboard.press(key, modifiers)
        return { success: true, key, modifiers }
      },
    }),
    viewScreen: tool({
      description:
        "Capture the sandbox screen for your own visual inspection. Use this before or after visual interactions. This capture is hidden from the user.",
      inputSchema: z.object({}),
      execute: takeScreenshot,
      toModelOutput: screenshotToModelOutput,
    }),
    showScreen: tool({
      description:
        "Capture and show the sandbox screen to the user. Use only when the user explicitly asks to see what is on the screen.",
      inputSchema: z.object({}),
      execute: takeScreenshot,
      toModelOutput: screenshotToModelOutput,
    }),
  }
}
