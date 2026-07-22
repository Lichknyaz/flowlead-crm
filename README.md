# FlowLead CRM

FlowLead CRM is an interactive portfolio demo for a fictional Prague home repair company. It connects a credible customer-facing service website and validated request form with a lightweight internal lead-management workspace.

## What the demo proves

- A public service website can feed real form data into an operational dashboard.
- The team can search and filter leads, change status and priority, assign work, and save internal notes.
- Dashboard metrics react to the current lead data.
- Notification, follow-up, and AI-summary concepts are shown without pretending that external services are connected.
- Demo state persists in the browser with `localStorage` and can later be replaced by an API.

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

React 19, TypeScript, Vite, React Router, Zod, and Lucide icons. Styling is custom CSS with responsive layouts; no UI kit is used.

## Run locally

```bash
npm install
npm run dev
```

Build verification:

```bash
npm run build
```

## Code formatting

Prettier is configured for TypeScript, React, CSS, JSON, and Markdown files.

```bash
npm run format
npm run format:check
```

## Data and privacy

All people, contact information, businesses, testimonials, and events in this repository are fictional. Submitted requests remain in the current browser only. No emails or notifications are actually sent.

## Planned full-stack extension

Replace the local context service with API routes, PostgreSQL, and Prisma; add authenticated team roles; connect an n8n or Make.com webhook; and optionally generate summaries through the OpenAI API.
