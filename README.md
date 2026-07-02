# SynapseCS — AI-Powered Customer Support Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Gemini_AI-6d28d9?style=flat-square)](https://openrouter.ai/)
[![Resend](https://img.shields.io/badge/Resend-Email_Service-000000?style=flat-square)](https://resend.com/)

**SynapseCS** is a modern customer support management platform that integrates real-time AI to empower support agent productivity. Built with high performance, a premium responsive UI/UX, a secure micro-frontend (reverse proxy) architecture, and industry-standard audit logs.

---

## 🌟 Key Features

1.  **Dashboard Analytics & Statistics**: Real-time visualization of key metrics such as Customer Satisfaction Score (CSAT), ticket statuses (open, pending, closed), and chat sentiment distribution.
2.  **Real-Time Inbox & Chat Room**:
    *   **Smooth Native Scrolling**: Thread navigation optimized for mobile devices.
    *   **Responsive Collapsible Profile**: Customer profiles adapt to a sliding drawer (Sheet) on mobile and tablet viewports.
    *   **Interactive Ticket Claim**: Claim or assign *Unassigned* tickets to the active agent with a single click.
    *   **Interactive Status Dropdown**: Change ticket status (Open, Pending, Resolved) from the chat room, syncing instantly across other agents' dashboards.
3.  **AI Integration (Gemini 2.0 via OpenRouter)**:
    *   **Automated Sentiment Analysis**: Automatically detects customer sentiment (Angry, Neutral, Happy) on incoming messages.
    *   **RAG SOP System (AI Draft)**: AI suggests response drafts based on relevant standard operating procedures (SOPs) matched using Gemini Vector Embeddings (`text-embedding-004`) in PostgreSQL `pgvector`.
    *   **3-Point AI Summary**: Summarize long conversation histories instantly into brief key points.
4.  **Emergency Escalation (Resend Alerts)**: Automated detection of "Angry" sentiment triggers email alerts to the admin mailbox via Resend Email Service.
5.  **Audit Logs & Activity Feed**: Structured tracking of operational actions, logging when agents claim tickets, send replies, update SOPs, or when AI escalations occur.
6.  **Micro-Frontend Ready (Reverse Proxy)**: Pre-configured to run as a sub-project under a subpath of a main domain (e.g., `https://main-domain.com/synapse-cs`) using Next.js `basePath`.

---

## 🛠️ Tech Stack

*   **Frontend / Core**: Next.js 16 (App Router, React Server Actions), TypeScript.
*   **Styling**: Vanilla Tailwind CSS, Lucide Icons, Glassmorphism, Radix/Base UI Dialog Primitives.
*   **Database & Auth**: Supabase (PostgreSQL, Row Level Security, pgvector, Realtime Channels).
*   **Third-Party APIs & Services**:
    *   **OpenRouter API** (Model: `google/gemini-2.0-flash-exp:free` & Gemini Embeddings).
    *   **Resend API** (For email notification routing).
    *   **Upstash Redis** (For API rate-limiting middleware).
    *   **Sentry** (For error monitoring & performance tracking).

---

## 📂 Project Structure

```text
├── src/
│   ├── app/                      # Next.js App Router (Pages, API Routes, Server Actions)
│   │   ├── (dashboard)/          # Dashboard, Inbox, Settings, Customers
│   │   ├── api/                  # API Route Handlers (Simulator & Integrations)
│   │   ├── actions.ts            # Centralized Server Actions (Supabase & Cookie Session Management)
│   │   └── page.tsx              # Login Page
│   ├── components/               # Reusable UI Components
│   │   ├── layout/               # Sidebar and Topbar Layout Components
│   │   └── ui/                   # Primitive UI Components (Buttons, Dropdowns, Sheets, etc.)
│   ├── lib/                      # Helper Utilities & AI Pipeline (OpenRouter, Resend)
│   └── utils/supabase/           # Supabase Server & Client Initializers
├── supabase/                     # Database Schemas & Migrations
│   ├── setup.sql                 # Table definitions, performance indexes, RLS, & triggers
│   └── seed.sql                  # Initial mock conversations and messages
└── next.config.ts                # Next.js configuration (basePath & subpath routing)
```

---

## ⚡ Performance & Security Optimizations (Sprint 1 & 2)

### 1. Performance & Scalability
*   **Data Caching**: Enhanced API fetch performance using Next.js `unstable_cache` with React `cache()` for request-scoped database queries, minimizing duplicate DB hits.
*   **Parallelized Queries**: Parallelized independent queries using `Promise.all` inside Next.js Server Actions, reducing overall page load latency.
*   **Pagination & Virtual Scrolling**: Replaced large list rendering with reverse infinite scrolling using `react-virtuoso` in the chat history, and Intersection Observer on the inbox ticket list.
*   **API Rate Limiting**: Secured backend endpoints and RAG APIs with an Upstash Redis rate-limiting middleware, falling back to a local token-bucket limit in local dev environments.

### 2. Security & Hardening
*   **JWT Claims Validation**: Converted Supabase Row-Level Security (RLS) policies to validate `app_metadata` claims directly from authenticated session JWTs, securing access scopes for admins and agents.
*   **Security Headers**: Configured robust HTTP response security headers in [next.config.ts](file:///E:/_PROJECT/AI%20Customer%20Support%20(synapse-ai)/next.config.ts) including Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and X-DNS-Prefetch-Control.

### 3. Observability & Error Recovery
*   **Error Boundaries**: Implemented granular React Class-based `ErrorBoundary` wrapper around all dashboard route pages to prevent component-level crashes from taking down the app shell.
*   **Global Error Handling**: Integrated `global-error.tsx` at the root layout to catch fatal server/client errors and automatically report them to Sentry.
*   **Sentry Monitoring**: Integrated Sentry NextJS SDK for real-time error logging, transaction tracing, and production issue tracking.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   A [Supabase](https://supabase.com) account
*   An [OpenRouter](https://openrouter.ai) API Key
*   A [Resend](https://resend.com) API Key

### 2. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/DycandX/SynapseCS.git
cd SynapseCS
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file template to `.env.local` in the root of the project:
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in your Supabase credentials, OpenRouter API Key, Resend API Key, and admin email.

### 4. Setup Supabase Database Schema
1.  Go to your **Supabase Dashboard**.
2.  Navigate to **SQL Editor** -> **New Query**.
3.  Copy and run the contents of [supabase/setup.sql](file:///E:/_PROJECT/AI%20Customer%20Support%20(synapse-ai)/supabase/setup.sql). This will create all required tables (`profiles`, `customers`, `conversations`, `messages`, `activity_logs`, `knowledge_embeddings`), enable the `vector` extension, configure Row-Level Security (RLS), and set up profile creation triggers.
4.  (*Optional*) Copy and run the contents of [supabase/seed.sql](file:///E:/_PROJECT/AI%20Customer%20Support%20(synapse-ai)/supabase/seed.sql) to populate initial mock conversations.

### 5. Run the Local Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000/synapse-cs` (if using the configured `basePath`).

---

## ⚙️ Reverse Proxy Configuration (Micro-Frontend)

To host this application under a subpath of your main domain (e.g., `https://zulvikar.is-a.dev/synapse-cs`):

1.  **Next.js Config**: `basePath` is defined as `"/synapse-cs"` inside `next.config.ts`.
2.  **Supabase Redirect URLs**: Add the wildcard redirect URL in your **Supabase Authentication -> URL Configuration -> Redirect URLs**:
    *   `https://zulvikar.is-a.dev/synapse-cs/**`
3.  **Supabase Site URL**: Set the main Site URL to `https://zulvikar.is-a.dev/synapse-cs`.
4.  **NEXT_PUBLIC_APP_URL**: Set this environment variable in your Vercel project configuration to `https://zulvikar.is-a.dev/synapse-cs`.

---

## 🔒 Security & Row-Level Security (RLS)

This application uses `@supabase/ssr` to manage cookies securely on a per-request basis. This architectural pattern eliminates cross-session memory leaks in server-side components (Server Actions and Route Handlers). All read/write database queries are secured with **PostgreSQL Row-Level Security (RLS)**, ensuring only authenticated agents or administrators have access to sensitive support data.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
