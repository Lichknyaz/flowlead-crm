# Automation implementation status

Last updated: 2026-08-19

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
- `202608170006_scheduled_automation_recovery.sql`

## Scheduled operational automations

The scheduler and safe Telegram-recovery baseline are deployed in production.

- Supabase Cron runs `public.run_scheduled_automations()` every five minutes.
- Response and appointment reminders have idempotency keys, so a record is not eligible for the same reminder twice.
- The CRM exposes **Run checks now** as a manual fallback and displays the automatic schedule.
- The **Appointment reminder** rule is available with a 24-hour window and is disabled by default.
- Telegram events that never started can be recovered once; events with an unknown previous delivery result become actionable failures rather than being sent blindly again.

### Production scenario verification

The following synthetic checks passed on 2026-08-19. No real customer data was used.

1. The scheduler job was present and active on `*/5 * * * *`.
2. A synthetic new lead, made overdue with a ten-year reminder window, produced exactly one response-reminder event and one private in-app notification.
3. A synthetic scheduled visit in the next minute produced exactly one appointment-reminder event and one private in-app notification.
4. The test lead and visit were deleted after verification.
5. Rule settings were restored: response reminder disabled at 30 minutes, appointment reminder disabled at 1,440 minutes, and Telegram enabled.

## Next milestone: client confirmation email

- Select a transactional provider and verified sender domain.
- Send a short confirmation containing the request reference and expected next step.
- Do not include internal notes or unnecessary personal data.
- Record pending, success, failure, provider message ID, and retry attempts in `automation_events`.
- Provide a real **Test** action before enabling live delivery.

User input required before this step: email provider, sender domain, sender address, and reply-to address.

## Later stages

- Integration-health card and failure notifications.
- Per-rule templates, delays, conditions, and channel selection.
- Public-form bot protection and rate limiting.
- Multiple staff accounts and role-based ownership.
- Monitoring, retention controls, backups, and a production privacy policy.

## Remaining scheduler follow-up

The core scenarios are verified. A later hardening pass can additionally wait for an unattended Cron tick and run each synthetic condition twice to document the no-duplicate outcome under repeated execution.
