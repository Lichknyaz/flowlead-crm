# FlowLead CRM: three-minute portfolio demo

Use this route to demonstrate the product as a coherent customer-to-operations workflow.
All people, contact details, reviews, and requests shown in the demo are fictional.

## Before you start

- Open the [production site](https://flowlead-crm-eight.vercel.app) in a fresh browser tab.
- Sign in to the CRM workspace beforehand if you want to show live records.
- Keep the presentation focused on the workflow; do not enter real customer data.

## 1. Customer request (about 45 seconds)

1. On the landing page, point out the service categories and the **Request a repair** call to action.
2. Open the request form and show the inline validation.
3. Submit a clearly fictional request.
4. On the confirmation screen, explain that a valid request is written to the live CRM when Supabase is connected.

## 2. CRM triage (about 75 seconds)

1. Open **CRM demo** and go to **Overview**.
2. Show that the newest request appears in **Recent leads** and dashboard metrics update from current lead data.
3. Open **Leads**. Demonstrate search, filters, and sortable columns.
4. Open the new record. Change its status or priority, add a short internal note, and set an expected value or appointment if useful.
5. Return to the dashboard to show the updated pipeline, calendar, and upcoming work context.

## 3. Operations automation (about 45 seconds)

1. Open **Automation** and show the persisted rules and execution history.
2. Explain that new-lead Telegram delivery is active and sends only the lead reference, service type, and urgency; personal contact details remain in the CRM.
3. Point out the manual **Run checks now** fallback and the scheduled response and appointment reminder rules.
4. Clarify the current scope: client confirmation email and configurable workflow building are planned next, rather than presented as completed features.

## Closing line

“FlowLead connects a customer request with a usable operations workflow: validation, persistent CRM data, triage, scheduling, and auditable automation delivery. The demo data is fictional, but the end-to-end flow is live.”

## Reset after a live presentation

- Remove any request created only for the demonstration.
- Do not leave test appointments or reminders enabled.
- Confirm the Automation event log contains no unexpected failed deliveries.
