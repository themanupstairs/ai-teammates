"use client"

import { useState, type ReactElement } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShuffleIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { createBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createBotSchema } from "@/lib/db/schema"

const presets = [
  {
    name: "Ada",
    job: "Research assistant",
    instructions:
      "Answer briefly, cite sources, and ask before running anything destructive.",
  },
  {
    name: "Linus",
    job: "Code reviewer",
    instructions:
      "Review code for bugs, security issues, and readability. Explain your findings and suggest focused fixes.",
  },
  {
    name: "Nova",
    job: "Writing editor",
    instructions:
      "Improve clarity, grammar, and flow while preserving my voice. Explain significant edits and keep suggestions concise.",
  },
  {
    name: "Sage",
    job: "Tutor",
    instructions:
      "Explain concepts step by step, use examples, and ask questions to check my understanding. Guide me toward the answer.",
  },
]

type BotFormValues = z.infer<typeof createBotSchema>

export function BotDialog({
  children,
  seed,
  open: controlledOpen,
  onOpenChange,
}: {
  children?: ReactElement
  seed: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen

  function setOpen(nextOpen: boolean) {
    setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }
  const [preset, setPreset] = useState<string[]>([])
  const form = useForm<BotFormValues>({
    resolver: zodResolver(createBotSchema),
    defaultValues: { name: "", job: "", instructions: "", avatar: seed },
  })
  const avatar = useWatch({ control: form.control, name: "avatar" })
  const { isSubmitting, errors } = form.formState

  function changeOpen(nextOpen: boolean) {
    if (isSubmitting) return
    setOpen(nextOpen)
    if (!nextOpen) {
      form.reset({ name: "", job: "", instructions: "", avatar: nanoid() })
      setPreset([])
    }
  }

  async function onSubmit(values: BotFormValues) {
    form.clearErrors("root")
    try {
      const result = await createBot(values)
      if (result.error) {
        form.setError("root", { message: result.error })
        return
      }
      setOpen(false)
      form.reset({ name: "", job: "", instructions: "", avatar: nanoid() })
      setPreset([])
      toast.add({
        title: "Bot created",
        description: `${values.name} is ready.`,
      })
    } catch {
      form.setError("root", {
        message: "Couldn't create your bot. Please try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {children && <DialogTrigger render={children} />}
      <DialogContent className="dark max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New bot</DialogTitle>
          <DialogDescription>
            Give it a face, a name, and a job to do.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldSet disabled={isSubmitting} className="gap-5">
            <ToggleGroup
              aria-label="Bot job presets"
              variant="outline"
              size="sm"
              className="flex-wrap"
              value={preset}
              onValueChange={(value) => {
                setPreset(value)
                const selected = presets.find((item) => item.job === value[0])
                if (selected) {
                  form.setValue("name", selected.name, { shouldValidate: true })
                  form.setValue("job", selected.job, { shouldValidate: true })
                  form.setValue("instructions", selected.instructions, {
                    shouldValidate: true,
                  })
                }
              }}
            >
              {presets.map((item) => (
                <ToggleGroupItem
                  key={item.job}
                  value={item.job}
                  className="rounded-full"
                >
                  {item.job}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Field
              orientation="horizontal"
              className="mb-3"
              data-invalid={!!errors.avatar}
            >
              <ChatAvatar seed={avatar ?? seed} className="size-12" />
              <FieldContent>
                <FieldTitle>Face</FieldTitle>
                <FieldDescription>
                  Shuffle until you find one you like.
                </FieldDescription>
                <FieldError errors={[errors.avatar]} />
              </FieldContent>
              <input type="hidden" {...form.register("avatar")} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  form.setValue("avatar", nanoid(), { shouldValidate: true })
                }
              >
                <ShuffleIcon data-icon="inline-start" />
                Shuffle
              </Button>
            </Field>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bot-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="bot-name"
                      placeholder="Ada"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="job"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bot-job">Job</FieldLabel>
                    <Input
                      {...field}
                      id="bot-job"
                      placeholder="Research assistant"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="instructions"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bot-instructions">
                      How it should work
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      id="bot-instructions"
                      className="min-h-24 resize-none"
                      placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldError errors={[errors.root]} />
          </FieldSet>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                />
              }
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {isSubmitting ? "Creating…" : "Create bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
