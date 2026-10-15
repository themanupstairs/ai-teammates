<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git

- Never create branches, worktrees, or commits automatically. Only do so when the user explicitly asks for that specific action in the current request.
- Leave changes uncommitted in the working tree on the current branch and let the user decide when and how to commit.

## Database

- Apply schema changes with `npm run db:push` only. Never generate or run database migrations, and do not create migration artifacts.
- Treat the database as disposable development state. For every schema change, prefer a clean slate and data loss: never backfill, migrate, preserve existing rows, or spend effort keeping old data compatible.

## Forms

- Use the installed shadcn skill for form UI, the Neon skills for database writes, and the Clerk skills for authentication. Keep implementations simple and limited to the requested flow.
- Build forms with React Hook Form and Zod through `zodResolver`. Derive insert validation from the Drizzle table with `drizzle-zod`, and derive the editable form schema from that insert schema instead of maintaining duplicate validation rules.
- Share the editable schema between the form and its server action. Trim text and reject blank required fields; preserve optional fields as optional.
- Compose existing shadcn components: `FieldGroup`, `Field`, `FieldLabel`, `FieldError`, `Input`, and `Textarea`. Use `Controller` for controlled fields, `data-invalid` on fields, and `aria-invalid` on inputs. Follow the supplied design and existing component variants.
- For dialog forms, use `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter`. Use the project's Base UI `render` composition for triggers and close buttons.
- Store mutations in `actions/<resource>.ts` with `"use server"`. Authenticate inside every action, derive `userId` from Clerk, validate input again on the server, and allow only editable fields from the client. Generate IDs and timestamps through the table defaults.
- Create records only on explicit form submission. Opening a dialog, refreshing the page, selecting a preset, or shuffling an avatar must not write to the database.
- Use `ToggleGroup` for preset choices. A selected preset should populate all relevant editable fields, including name, job, and instructions. Keep these values editable; use placeholders for examples when fields are empty.
- Disable repeat submissions while saving and show pending, validation, and server-error feedback. Preserve entered values after failure. After success, close and reset the dialog, show confirmation, and revalidate the affected page.

## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + github.com/dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    npm install @dicebear/collection             ->  npm install @dicebear/styles
    npm install @dicebear/lorelei                ->  npm install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.
