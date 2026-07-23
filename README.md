# FlowLead CRM

FlowLead CRM is an interactive portfolio demo for a fictional Prague home repair company. It connects a credible customer-facing service website and validated request form with a lightweight internal lead-management workspace.

## What the demo proves

- A public service website can feed real form data into an operational dashboard.
- The team can search and filter leads, change status and priority, assign work, and save internal notes.
- Dashboard metrics react to the current lead data.
- The same build supports a zero-configuration local demo and an optional production data layer.
- Supabase adds PostgreSQL persistence, protected staff access, row-level security, and a safe public request endpoint.
- An optional Edge Function can deliver new-lead notifications to Telegram.

## Main routes

- `/` — Prague HomeFix landing page
- `/request` — validated service request form
- `/request/success` — confirmation and CRM handoff
- `/demo` — portfolio demo access screen
- `/dashboard` — CRM overview
- `/dashboard/leads` — searchable lead table
- `/dashboard/leads/:id` — status, notes, assignment, timeline, and demo AI summary
- `/dashboard/automation` — workflow concept and automation events

## Stack

React 19, TypeScript, Vite, React Router, Zod, Lucide icons, and optional Supabase. Styling is custom CSS with responsive layouts; no UI kit is used.

## Run locally

```bash
npm install
npm run dev
```

Build verification:

```bash
npm run format:check
npm run lint
npm run build
```

GitHub Actions runs all three checks for pushes and pull requests.

## Code formatting

Prettier is configured for TypeScript, React, CSS, JSON, and Markdown files.

```bash
npm run format
npm run format:check
```

## Data modes

With no environment variables, FlowLead starts in local demo mode. Demo data and edits stay in the browser's `localStorage`; no account or external service is needed.

When both Supabase variables are present, FlowLead starts in live mode. Public requests are written through a restricted database function, while the dashboard requires a Supabase email/password account.

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_ENABLE_NOTIFICATIONS=false
```

Never expose a Supabase service-role key in a `VITE_` variable or commit it to Git.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL Editor and run the files in `supabase/migrations` in filename order. For an existing installation, run only migrations newer than the ones already applied.
3. In Authentication → Users, create the workspace owner email/password account.
4. Copy the project URL and publishable key into `.env.local` and the matching Vercel environment variables.

The migration creates the leads table, validation constraints, seed data, status history triggers, row-level security policies, and the public `submit_lead` function. Anonymous visitors can submit requests but cannot read CRM data.

### Optional Telegram notifications

Deploy `supabase/functions/notify-new-lead`, then add these function secrets in Supabase:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Finally set `VITE_ENABLE_NOTIFICATIONS=true`. Leave it false until the function and secrets are ready.

## Deploy to Vercel

Import `Lichknyaz/flowlead-crm` in Vercel and keep the detected Vite defaults. `vercel.json` provides the single-page-app route fallback and basic security headers.

The site can be deployed immediately as a local demo. Add the two Supabase variables in Vercel when the database is ready; no code change is required.

## Data and privacy

All seeded people, contact information, businesses, testimonials, and events in this repository are fictional. In local mode, submitted requests remain in the current browser. In live mode, the project owner is responsible for the Supabase region, retention policy, access accounts, and privacy notice used for real submissions.

## Remaining production upgrades

For use beyond a portfolio demo, add role-based permissions for multiple staff members, bot protection and rate limiting on the public form, transactional email, monitoring/error reporting, backups, and a real privacy policy. The current schema intentionally provides one authenticated workspace role to keep setup small and auditable.
