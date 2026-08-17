# Automation implementation status

Last updated: 2026-08-17

## Current state

The first external automation channel is complete and verified in production.

- Automation rules and execution events are stored in Supabase and scoped to the authenticated workspace owner.
- New leads create an idempotent Telegram delivery event.
- PostgreSQL sends the delivery request asynchronously through `pg_net`.
- The request is signed with a dedicated webhook secret stored in Supabase Vault and Edge Function secrets.
- The `notify-new-lead` Edge Function checks the rule state, delivers the message, and persists success or failure details.
- The CRM supports a real Telegram test and manual retry of failed live deliveries.
- Test and retry calls explicitly forward the current authenticated Supabase session.
- Structured Supabase errors are preserved instead of being reduced to `[object Object]`.
- The Edge Function service role has only the required table grants for rules, events, and lead summaries.
- Telegram receives only the lead reference, service type, and urgency. Customer names, contact details, addresses, and request text remain inside the CRM.
- Verify JWT with the legacy secret is disabled because the function applies separate authentication for user actions and signed database dispatches.
- The Telegram bot token was rotated after setup; no secret values are stored in the repository.

## Production verification

The following checks passed on 2026-08-17:

1. A synthetic lead (`FL-1050`, clearly labelled `Telegram Test`) was created without real customer data.
2. The database queued the Telegram automation event.
3. The signed `pg_net` request reached the Edge Function.
4. Telegram returned a successful delivery response.
5. The event changed from `pending` to `success` and appeared as **Telegram notification sent** in the CRM.
6. The CRM **Test** action completed separately and appeared as **Telegram notification test completed**.
7. Repository formatting, lint, build, GitHub CI, and Vercel production deployment passed.

Relevant migrations:

- `202608170002_automation_foundation.sql`
- `202608170003_telegram_delivery.sql`
- `202608170004_direct_telegram_dispatch.sql`
- `202608170005_service_role_telegram_permissions.sql`

## Scheduled operational automations

The scheduler and safe delivery-recovery baseline were deployed and verified on 2026-08-17.

- Supabase Cron runs `public.run_scheduled_automations()` every five minutes.
- The scheduler creates private in-app response and appointment reminders only for enabled rules, with idempotency keys to prevent duplicates.
- The new **Appointment reminder** rule is available in the CRM, set to a 24-hour window, and remains disabled by default.
- Telegram events that never started are recovered once; events with an unknown previous delivery result stop as failed with a manual retry path, avoiding duplicate customer-facing messages.
- The CRM shows the schedule and retains **Run checks now** as a manual fallback.

The production checks confirmed one active `*/5 * * * *` Cron job, one disabled appointment-reminder rule, and a safe manual run with no queued recovery events.

### Completed: schedule due checks

- Run response-reminder checks every five minutes with Supabase Cron.
- Run upcoming-appointment checks in the same five-minute scheduler.
- Store all schedule calculations in UTC and render them in the workspace's Prague time zone.
- Keep the existing **Run due checks** action as a safe manual fallback.

### Completed: add delivery recovery

- Detect Telegram events that remain `pending` beyond a reasonable timeout.
- Retry temporary failures with a small bounded backoff policy.
- Never retry permanent configuration or authentication failures indefinitely.
- Preserve one idempotency key per lead, rule, and delivery window.
- Show the last attempt, attempt count, and actionable error in the CRM.

### 3. Add client confirmation email

- Select a transactional provider and verified sender domain.
- Send a short confirmation containing the request reference and expected next step.
- Do not include internal notes or unnecessary personal data.
- Record pending, success, failure, provider message ID, and retry attempts in `automation_events`.
- Provide a real **Test** action before enabling live delivery.

User input required before this step: email provider, sender domain, sender address, and reply-to address.

### Completed: add appointment reminders

- Notify the service team before the scheduled visit.
- Optionally notify the client after the email channel is verified.
- Deduplicate reminders when an appointment is edited or rescheduled.
- Cancel obsolete reminders when the appointment is cancelled or completed.

## Later stages

- Integration-health card and failure notifications.
- Per-rule templates, delays, conditions, and channel selection.
- Public-form bot protection and rate limiting.
- Multiple staff accounts and role-based ownership.
- Monitoring, retention controls, backups, and a production privacy policy.

## Next milestone: client confirmation email

The next meaningful channel is a transactional confirmation email. It needs a provider, a verified sender domain, sender address, and reply-to address before live delivery can be enabled. The implementation should retain the same guarded model as Telegram: explicit rule activation, test action, event history, bounded retries, and no unnecessary customer data in messages.

## Remaining production scenario checks

Before treating scheduled workflows as fully operational, create an explicitly synthetic overdue lead and an upcoming synthetic appointment, enable their corresponding rules temporarily, and confirm exactly one in-app reminder per item. This needs no real customer data and can be done from the CRM when desired.
