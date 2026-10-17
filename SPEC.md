# PROJECT SPECIFICATION: FS-GenAI Assessment Unified App

## 1. Role & Execution Directive for AI Agent
You are an autonomous Full-Stack Engineer operating inside Antigravity IDE. Your objective is to scaffold and build a complete, production-ready **React (Vite + Tailwind CSS) + Supabase + Google Gemini API** web application that fulfills three internship assessment tasks inside **one unified application**.

**Do NOT ask me high-level clarifying questions.** Read this entire specification and start scaffolding the codebase immediately following the **Step-by-Step Execution Order** in Section 6. Only pause to ask me when you need me to paste my actual `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, or run manual authentication in the Supabase Dashboard.

---

## 2. Assessment Requirements Mapped to Architecture
We are combining all three assessment tasks into a single dashboard:
* **Task 1 (Supabase Core — Auth, RLS, RPC, Edge Functions):** Integrated directly into Tasks 2 and 3.
* **Task 2 (Google Login & Audit Log):**
  * Users sign in via **Google OAuth** using `@supabase/supabase-js`.
  * Upon sign-in, record the user's login in a PostgreSQL table (`public.login_logs`) protected by **Row Level Security (RLS)**.
  * Fetch and display the list of who logged in and at what timestamps on the React frontend using a PostgreSQL **RPC (Remote Procedure Call)** function (`get_recent_logins`).
* **Task 3 (Gemini Chatbot via Supabase Edge Function):**
  * Build a clean Chatbot UI on the React frontend.
  * When a user sends a message, React calls a **Supabase Edge Function** (`gemini-chat`) via `supabase.functions.invoke('gemini-chat', { body: { prompt } })`.
  * The Edge Function securely reads `GEMINI_API_KEY` from Deno environment secrets, calls the Google Gemini REST API (`v1beta`), and returns the AI response to the React frontend.

---

## 3. Target Directory Structure
Scaffold the project to match this exact structure:
```text
.
├── supabase/
│   ├── schema.sql           # Full SQL for table, RLS policies, and RPC function
│   └── functions/
│       └── gemini-chat/
│           └── index.ts     # Deno Edge Function calling Gemini API with CORS
├── src/
│   ├── lib/
│   │   └── supabaseClient.js # Supabase client initialization
│   ├── components/
│   │   ├── LoginPage.jsx    # Clean Google Sign-In screen
│   │   ├── Navbar.jsx       # Shows current user avatar, email, and Sign Out button
│   │   ├── LoginAuditLog.jsx# Left panel: Calls RPC get_recent_logins() & renders table
│   │   └── GeminiChatbot.jsx# Right panel: Chat UI calling gemini-chat Edge Function
│   ├── App.jsx              # Auth state listener, duplicate-login guard, split layout
│   ├── main.jsx
│   └── index.css            # Tailwind CSS imports
├── .env.example             # Template for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
├── REPORT.md                # Auto-generated technical report for submission
└── package.json
```

---

## 4. Technical Specifications & Guardrails

### A. Database, RLS & RPC (`supabase/schema.sql`)
Generate `supabase/schema.sql` with this exact SQL so I can paste it into the Supabase SQL Editor:
```sql
-- 1. Table for recording user logins (Task 2)
create table if not exists public.login_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  full_name text,
  avatar_url text,
  logged_in_at timestamptz default now() not null
);

-- 2. Enable Row Level Security (Task 1 - RLS)
alter table public.login_logs enable row level security;

-- Policy 1: Authenticated users can insert their own login record
create policy "Users can insert own login"
on public.login_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy 2: Authenticated users can view all login records
create policy "Authenticated users can view logins"
on public.login_logs
for select
to authenticated
using (true);

-- 3. RPC Function to fetch recent logins (Task 1 - RPC)
create or replace function public.get_recent_logins()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  logged_in_at timestamptz
)
language sql
security invoker
as $$
  select id, email, full_name, avatar_url, logged_in_at
  from public.login_logs
  order by logged_in_at desc
  limit 50;
$$;
```

### B. Duplicate Login Prevention in `App.jsx`
* `supabase.auth.onAuthStateChange` fires `SIGNED_IN` on initial sign-in AND sometimes on tab refocus or token refresh.
* **Mandatory Rule:** Use `sessionStorage.getItem('logged_session_' + session.user.id)` before inserting into `public.login_logs`.
* Only insert a new row if that `sessionStorage` flag is not set, then immediately set `sessionStorage.setItem('logged_session_' + session.user.id, 'true')` and trigger a refresh of the `LoginAuditLog` component. Clear `sessionStorage` on Sign Out.

### C. Supabase Edge Function (`supabase/functions/gemini-chat/index.ts`)
* Use native `Deno.serve(async (req) => { ... })`.
* **Mandatory CORS Headers:** Define and return these exact headers on both `OPTIONS` preflight requests and `POST` responses:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```
* Read `const apiKey = Deno.env.get('GEMINI_API_KEY')`.
* Call the Gemini REST API directly via `fetch` (do not use heavy Node SDKs that break Deno bundling):
  * **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  * **Payload:**
```json
{
  "contents": [{
    "parts": [{ "text": prompt }]
  }]
}
```
* Extract `data?.candidates?.[0]?.content?.parts?.[0]?.text` and return `{ reply }` with status `200` and `corsHeaders`. Include clean `try/catch` error handling that still returns `corsHeaders` so errors are visible in the React UI instead of failing with a browser CORS error.

### D. React Frontend UI & Styling
* Use **Tailwind CSS** and `lucide-react` icons for a clean, modern dark/slate dashboard UI.
* **Unauthenticated state:** Render `<LoginPage />` centered on screen with a Google Sign-In button (`supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`).
* **Authenticated state:** Render `<Navbar />` at the top and a responsive 2-column grid below:
  * **Left Column (`<LoginAuditLog />`):** Calls `supabase.rpc('get_recent_logins')`, shows a "Refresh" button, total logins badge, user avatar/initials, full name, email, and formatted local timestamp (`new Date(row.logged_in_at).toLocaleString()`).
  * **Right Column (`<GeminiChatbot />`):** Shows message history (`role: 'user' | 'assistant'`), loading spinner while waiting for the Edge Function, error banner if the Edge Function fails, and an input form at the bottom.

---

## 5. Submission Deliverable: Auto-Generate `REPORT.md`
Once the code is written, generate a clean `REPORT.md` file in the root directory that I can export to PDF for my internship submission. It must include:
1. Architecture Overview & Tech Stack
2. Mermaid.js Diagrams for the Auth/RLS/RPC flow and the Edge Function/Gemini flow
3. Explanation of how RLS, RPC, and Edge Functions were implemented
4. Instructions on how to run the project locally and deploy to Vercel

---

## 6. Step-by-Step Execution Order (Start Immediately)
1. **Step 1 (Scaffold Project):** Initialize the Vite + React project, install `@supabase/supabase-js`, `lucide-react`, and Tailwind CSS, and create `.env.example`.
2. **Step 2 (Generate Backend Files):** Create `supabase/schema.sql` and `supabase/functions/gemini-chat/index.ts`.
3. **Step 3 (Generate Frontend Components):** Create `src/lib/supabaseClient.js`, `LoginPage.jsx`, `Navbar.jsx`, `LoginAuditLog.jsx`, `GeminiChatbot.jsx`, and `App.jsx`.
4. **Step 4 (Generate Report):** Create `REPORT.md`.
5. **Step 5 (Hand-off for Credentials):** Once all files are created, output a short checklist telling me:
   * Where to paste my `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
   * The exact terminal commands to link my Supabase project, set `GEMINI_API_KEY`, and deploy the `gemini-chat` Edge Function.

