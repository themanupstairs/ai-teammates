import { nanoid } from "nanoid"
import { createInsertSchema } from "drizzle-zod"

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const bots = pgTable(
  "bots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text("job").notNull(),
    instructions: text("instructions"),
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)]
)

export const insertBotSchema = createInsertSchema(bots, {
  userId: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1, "Give your bot a name."),
  avatar: (schema) => schema.trim().min(1, "Choose a face for your bot."),
  job: (schema) => schema.trim().min(1, "Give your bot a job."),
  instructions: (schema) => schema.trim(),
})

export const createBotSchema = insertBotSchema.pick({
  name: true,
  avatar: true,
  job: true,
  instructions: true,
})
