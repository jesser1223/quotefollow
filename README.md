# QuoteFollow

SaaS web app for small landscaping and property-maintenance businesses to track outstanding quotes and follow-ups.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Auth + Postgres)

## Setup

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the project dashboard, go to **SQL Editor** and run the contents of `supabase-setup.sql`.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to the login page.

### 4. Create an account
Sign up with an email and password. Confirm the email if Supabase requires it (check Authentication → Providers in the dashboard; you can disable email confirmation for testing).

## Features

- User accounts (email/password via Supabase Auth)
- Each user only sees and manages their own quotes (Row Level Security)
- Dashboard with outstanding value, awaiting responses, follow-ups due today, overdue, recent quotes
- Searchable / filterable quotes table with add, edit, view, delete
- Follow-ups page (overdue / due today / upcoming) with inline date & status updates
- Persistent sidebar (desktop) + mobile navigation
- Data is saved permanently in Supabase

## Statuses

Awaiting response · Follow-up needed · Won · Lost · Follow up later

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

In Supabase, under **Authentication → URL Configuration**, add your Vercel domain to the allowed redirect URLs if needed.

## Project structure

- `src/app/` — pages (Dashboard, Quotes, Follow-ups, Settings, Login)
- `src/components/` — Sidebar
- `src/lib/` — types, Supabase clients, quote context
- `supabase-setup.sql` — table + RLS policies
