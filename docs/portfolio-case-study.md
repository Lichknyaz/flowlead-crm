# FlowLead CRM: portfolio case study

## The brief

Build a believable service-business demo that does more than display static CRM screens. A customer should be able to submit a request, and an operations user should be able to triage, plan, and follow up on that work in the same product.

The fictional business, Prague HomeFix, makes the workflow concrete without representing a real service provider.

## What is implemented

### Customer journey

- Responsive landing page with service anchors, smooth in-page navigation, and an accessible return-to-top control.
- Validated repair-request form with a confirmation screen.
- A new request enters the CRM lead list as the newest item.

### CRM operations

- Dashboard metrics, recent leads, pipeline period selection, tasks, and appointments.
- Searchable, filterable, sortable lead table and Kanban view.
- Lead detail workflow: status, priority, assignment, internal notes, estimated and final value, tasks, appointment planning, and history.
- CSV export, in-app notifications, reports, and calendar planning.

### Data, automation, and delivery

- Local demo mode for zero-configuration exploration; changes stay in the current browser.
- Supabase-backed live mode with authenticated workspace access, PostgreSQL persistence, row-level security, and a restricted public request endpoint.
- Telegram notification delivery for new leads with privacy-reduced payloads, idempotent event history, retries, and a manual test action.
- Scheduled checks for response and appointment reminders, backed by Supabase Cron and an auditable execution log.

## Key implementation decisions

| Decision                          | Why it matters                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| One local and one live data mode  | The portfolio can be explored without credentials while the production path remains real and testable.        |
| Privacy-reduced Telegram messages | The external message contains a reference, service type, and urgency only; contact details remain in the CRM. |
| Persistent automation events      | Delivery and retry state can be inspected instead of being implied by a successful deploy.                    |
| Owner-scoped Supabase data        | The live workspace is protected by authenticated access and RLS rather than by client-side hiding.            |
| Playwright workflow checks        | The primary path is guarded against regressions from request submission through CRM follow-up.                |

## Validation evidence

The automated suite covers the public landing page in desktop and mobile Chromium viewports, including navigation, responsive hero content, anchor navigation, and return-to-top behavior.

The CRM workflow test runs in a clean local-demo browser context and verifies this sequence:

1. Submit a fictional repair request.
2. Open the resulting lead in the CRM.
3. Change its status, add an internal note, and save an estimated value.
4. Create a follow-up reminder.
5. Confirm that the task appears on the dashboard.

GitHub Actions runs formatting, lint, TypeScript/Vite build, and the Playwright suite on pull requests. Vercel produces a preview for review before merge.

## Deliberate scope boundaries

This is a portfolio demo, not an unattended production SaaS. The following are intentionally recorded as next steps rather than presented as complete:

- Client confirmation email delivery.
- Multi-user roles and team permissions.
- Public-form bot protection and rate limits.
- Error monitoring, operational alerts, backups, and a production privacy policy.
- A configurable visual workflow builder.

## Demo links

- [Production demo](https://flowlead-crm-eight.vercel.app)
- [Three-minute demo script](demo-script.md)
- [Automation status](automation-status.md)
