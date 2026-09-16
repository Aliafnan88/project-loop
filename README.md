# Project LOOP — AI Customer-Feedback Intelligence Platform

A multi-tenant web application that helps companies make sense of customer feedback using AI. Built as part of the Zidio Development Internship — Web Development Track.

**Live App:** https://zidioproject-loop.vercel.app
**GitHub Repo:** https://github.com/Aliafnan88/project-loop

---

## What It Does

LOOP ingests customer feedback from multiple channels (support tickets, app reviews, surveys, sales notes), uses AI to classify sentiment and cluster it into themes, surfaces trends, and lets users ask plain-English questions grounded in the actual feedback data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom CSS |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma |
| Authentication | NextAuth.js (credentials-based) |
| AI | Google Gemini API |
| Charts | Recharts |
| CSV Parsing | Papaparse |
| Deployment | Vercel |

---

## Demo Credentials

Use the following account to log in and explore the app (Admin role):

- **Email:** aliafnan850@gmail.com
- **Password:** ali123

This account can view feedback, invite team members, assign roles, generate reports, and use Ask LOOP.

---

## Core Features

### Authentication & Workspaces
- Sign-up creates a new User + a new Workspace; the creator becomes Admin
- Login / Logout with session handling
- Protected routes — unauthenticated users are redirected to login

### Role-Based Access Control (RBAC)
- Three roles: **Admin**, **Analyst**, **Viewer**
- Admins can invite teammates and assign roles
- Viewers have read-only access (cannot add/edit feedback)
- Every database query is scoped to the user's workspace — no cross-tenant data leakage

### Feedback Ingestion
- **Manual entry** — add feedback one item at a time via a form
- **CSV bulk upload** — import many items at once (columns: `content`, `channel`, `customer_label`)
- **Simulated channel** — one-click import of realistic sample feedback

### Feedback Inbox
- Full-text search over feedback content
- Filter by channel and status
- Server-side pagination
- Inline status workflow: New → Reviewed → Actioned

### Analytics Dashboard
- Volume-over-time line chart
- Status breakdown pie chart
- Top channels bar chart
- Key stat cards (total feedback, new this week, etc.)

### AI Features (powered by Google Gemini)
1. **Auto-classification** — every new feedback item is automatically tagged with sentiment and theme(s) on ingest
2. **Theme Clustering & Trends** — feedback is grouped into themes with counts; click a theme to see the underlying feedback
3. **Ask LOOP** — ask questions in plain English and get answers grounded strictly in the actual feedback data, with citations
4. **Voice-of-Customer Report** — generate a report summarizing top themes, sentiment, verbatim quotes, and recommended actions for the last 30 days

---

## Local Setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. free tier on [Neon](https://neon.tech))
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Aliafnan88/project-loop.git
cd project-loop

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file in the root with:
DATABASE_URL="your_postgresql_connection_string"
NEXTAUTH_SECRET="any_random_32_char_string"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your_gemini_api_key"

# 4. Set up the database
npx prisma generate
npx prisma migrate dev

# 5. Run locally
npm run dev
```

App will be running at `http://localhost:3000`.

---

## Architecture Overview

LOOP follows a standard three-tier architecture:

1. **Browser** — React Server/Client Components render the UI and call API routes
2. **API layer** (Next.js route handlers) — authenticates the session, checks the user's role, and scopes every database query to the caller's workspace
3. **Database** — PostgreSQL via Prisma, with every tenant-owned table carrying a `workspaceId` foreign key

For AI features, the route handler builds a prompt, calls the Gemini API server-side, and returns structured data to the browser. API keys are never exposed to the client.

---

## Project Structure
app/
api/ → API route handlers
auth/ → NextAuth config
feedback/ → Feedback CRUD, CSV upload, simulate, [id] status update
members/ → Member list + invite
themes/ → Theme clustering
ask/ → Ask LOOP (grounded Q&A)
reports/ → Voice-of-Customer report generation
dashboard/ → Dashboard pages (feedback, members, themes, ask, reports)
signup/, login/ → Auth pages
lib/
auth.ts → Session helper (getCurrentUser)
ai.ts → Gemini classification helper
themes.ts → Theme attachment helper
prisma/
schema.prisma → Database schema


---

## Notes

- AI classification runs on every feedback item created via manual entry, CSV upload, or simulated import
- Workspace isolation is enforced at the database query level — every query filters by `workspaceId`
- Role checks are enforced server-side in API routes, not just hidden in the UI