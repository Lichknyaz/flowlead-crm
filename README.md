# FlowLead CRM

FlowLead CRM is an interactive portfolio demo for a fictional Prague home repair company. It connects a credible customer-facing service website and validated request form with a lightweight internal lead-management workspace.

## What the demo proves

- A public service website can feed real form data into an operational dashboard.
- The team can search and filter leads, change status and priority, assign work, and save internal notes.
- Leads can be managed in a table or a drag-and-drop Kanban pipeline.
- Dashboard metrics react to the current lead data.
- Realtime subscriptions keep lead changes and persistent in-app notifications synchronized.
- The same build supports a zero-configuration local demo and an optional production data layer.
- Supabase adds PostgreSQL persistence, protected staff access, row-level security, and a safe public request endpoint.
- A deployed Edge Function delivers privacy-reduced new-lead notifications to Telegram.

Detailed implementation status and the ordered automation plan are tracked in
[`docs/automation-status.md`](docs/automation-status.md).

## Main routes

- `/` — Prague HomeFix landing page
- `/request` — validated service request form
- `/request/success` — confirmation and CRM handoff
- `/demo` — portfolio demo access screen
- `/dashboard` — CRM overview
- `/dashboard/leads` — searchable lead table and Kanban pipeline
- `/dashboard/leads/:id` — status, notes, assignment, timeline, and demo AI summary
- `/dashboard/automation` — persisted workflow rules, tests, due checks, and execution history
- `/dashboard/reports` — pipeline, service, urgency, and workload analytics
- `/dashboard/calendar` — monthly visit planning and upcoming appointments

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
```

Never expose a Supabase service-role key in a `VITE_` variable or commit it to Git.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL Editor and run the files in `supabase/migrations` in filename order. For an existing installation, run only migrations newer than the ones already applied.
3. In Authentication → Users, create the workspace owner email/password account.
4. Copy the project URL and publishable key into `.env.local` and the matching Vercel environment variables.

The migrations create the leads and notifications tables, validation constraints, seed data, status history and notification triggers, realtime publication, row-level security policies, and the public `submit_lead` function. Anonymous visitors can submit requests but cannot read CRM data.

### Telegram notifications

Deploy `supabase/functions/notify-new-lead`, then add these function secrets in Supabase:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `AUTOMATION_WEBHOOK_SECRET` (a long random value used only between the database webhook and Edge Function)

Apply `supabase/migrations/202608170003_telegram_delivery.sql`, `supabase/migrations/202608170004_direct_telegram_dispatch.sql`, and `supabase/migrations/202608170005_service_role_telegram_permissions.sql`. The direct-dispatch migration uses `pg_net`, so it does not depend on the Dashboard Database Webhooks service. The final migration gives the Edge Function's service role only the table access required for Telegram delivery and retries.

Store two database secrets in Supabase Vault:

- `flowlead_project_url`: the project URL, such as `https://your-project-ref.supabase.co`
- `flowlead_webhook_secret`: the same value stored as the Edge Function secret `AUTOMATION_WEBHOOK_SECRET`

Enable the Telegram rule in the Automation workspace and use **Test** to verify delivery. The database trigger invokes `notify-new-lead` asynchronously for new requests and signs every call with the Vault-backed webhook secret.

Telegram receives only the lead reference, service type, and urgency. Names, contact details, addresses, and request text remain in the CRM. New requests are queued idempotently, every attempt is recorded, and failed live deliveries can be retried from the event log.

## Automation roadmap

Automation is being delivered in small, auditable stages:

1. **Foundation — implemented:** owner-scoped workflow rules, persistent execution history, realtime updates, rule testing, new-lead and status-change events, and on-demand response-reminder checks.
2. **External delivery — implemented:** Telegram delivery uses signed `pg_net` dispatch, rule checks, persistent status, idempotent queuing, test delivery, and manual retry. Both a live lead and the CRM **Test** action have been verified in production.
3. **Scheduling — next:** run overdue-response and upcoming-appointment checks automatically with Supabase Cron instead of relying on the manual **Run due checks** action. Add stale-pending reconciliation and bounded retries at the same time.
4. **Client communication:** send a transactional confirmation email after a request is accepted, with delivery status recorded in the same event log.
5. **Appointment reminders:** notify the team and optionally the client before scheduled visits, using Prague-local time and deduplicated delivery.
6. **Workflow builder:** create custom trigger, delay, condition, action, and message-template combinations from the CRM.
7. **Production controls:** rate limits, integration health, failure alerts, retention controls, and monitoring.

Apply `supabase/migrations/202608170002_automation_foundation.sql` before opening the live Automation page. The migration creates rules separately for each authenticated owner and keeps rule and event access scoped to that account.

## Deploy to Vercel

Import `Lichknyaz/flowlead-crm` in Vercel and keep the detected Vite defaults. `vercel.json` provides the single-page-app route fallback and basic security headers.

The site can be deployed immediately as a local demo. Add the two Supabase variables in Vercel when the database is ready; no code change is required.

## Data and privacy

All seeded people, contact information, businesses, testimonials, and events in this repository are fictional. In local mode, submitted requests remain in the current browser. In live mode, the project owner is responsible for the Supabase region, retention policy, access accounts, and privacy notice used for real submissions.

## Remaining production upgrades

For use beyond a portfolio demo, add role-based permissions for multiple staff members, bot protection and rate limiting on the public form, transactional email, monitoring/error reporting, backups, and a real privacy policy. The current schema intentionally provides one authenticated workspace role to keep setup small and auditable.
