# Zyricon — Unified Full-Stack & GenAI Workspace

> A production-grade Full-Stack web application combining **Google OAuth 2.0**, PostgreSQL **Row Level Security (RLS)**, PostgreSQL **RPC Procedures**, and a serverless **Supabase Deno Edge Function** communicating directly with the **Google Gemini 2.5 Flash REST API**.

[![React 18](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%7C_PostgreSQL_%7C_Edge_Functions-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-REST_v1beta-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Deno](https://img.shields.io/badge/Deno-Edge_Runtime-000000?logo=deno&logoColor=white)](https://deno.land/)

---

## ⚡ Core Highlights & Capabilities

### 1. Google OAuth 2.0 Authentication & Session Management
- Seamless sign-in via Supabase Auth using the standard OAuth 2.0 PKCE flow.
- Integrates Google account metadata (display name, email, avatar).
- Dedicated login landing screen with interactive AI orb branding and configuration diagnostics.

### 2. PostgreSQL Audit Logging with Row Level Security (RLS)
- **Automatic Event Tracking**: Logs sign-ins directly to `public.login_logs` upon successful authentication.
- **Strict RLS Enforcement**: Declarative PostgreSQL policies (`Users can insert own login` using `auth.uid() = user_id`, `Authenticated users can view logins`).
- **Duplicate Prevention Guard**: Dual-layer synchronous in-memory lock (`useRef<Set>`) and browser `sessionStorage` guard, preventing duplicate database writes during React 18 StrictMode double-invocations, tab refocusing, or token refresh cycles.

### 3. PostgreSQL RPC Function (`get_recent_logins`)
- Encapsulated PL/pgSQL function executing with `security invoker` rights to retrieve the 50 most recent verified sessions.
- **Client Search & Telemetry**: Instant client-side filtering by name, email, or date; display of relative timestamps (`2m ago`, `Just now`); and copyable UUIDs.
- **Data Exporting**: Direct export of audit session records to **CSV** spreadsheet or structured **JSON** format.
- **Real-Time Channel**: Silent background Supabase `postgres_changes` listener ensuring the log stays up-to-date across multiple devices.

### 4. Serverless Edge Computing Layer (`gemini-chat`)
- Hosted on Supabase Edge Functions built on the ultra-low latency **Deno runtime**.
- **API Secret Concealment**: `GEMINI_API_KEY` is completely isolated in server-side Deno environment secrets, preventing any browser-side exposure.
- **Google Gemini 2.5 Flash**: Direct integration with the `v1beta` endpoint (`gemini-2.5-flash`), supporting model switching and fallback to `gemini-2.0-flash`.
- **CORS & Resilience**: Full preflight `OPTIONS` handling, permissive headers, and clean error forwarding.

### 5. Premier Dark Studio UI & Ergonomics
- **Centered Highlight Switcher**: Prominent, typography-first view switcher toggle in the workspace header between **Gemini Chat** and **Audit Log**.
- **Collapsible Sidebar**:
  - Independent thread creation and deletion with per-user email `localStorage` persistence.
  - Engineering quick-start context prompts (*RLS & RPC Security*, *Deno Edge & CORS*, *Duplicate Login Guard*).
  - In-app interactive **Technical Report Modal** and **PostgreSQL Schema & RLS viewer**.
  - Dynamic user identity card that auto-resolves Google account avatars or domain logos (with vector Gmail icon fallback) and a full-width logout action.
- **Toolbar Utilities**: Model switcher dropdown, Configuration modal (temperature slider, system persona), and one-click Markdown transcript exporter.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client["React Client (Vite + Tailwind CSS)"]
        UI["Zyricon Workspace (App.jsx)"]
        Auth["Google OAuth (@supabase/supabase-js)"]
        AuditUI["LoginAuditLog View"]
        ChatUI["GeminiChatbot View"]
        Sidebar["Sidebar & Thread Store"]
    end

    subgraph SupabaseCloud["Supabase Cloud Platform"]
        AuthService["Supabase Auth Service"]
        DB[("PostgreSQL Database (login_logs)")]
        RLS["Row Level Security Engine"]
        RPC["RPC Function: get_recent_logins()"]
        EdgeFunc["Deno Edge Function: gemini-chat"]
        Secrets["Encrypted Vault (GEMINI_API_KEY)"]
    end

    subgraph GoogleAPIs["Google APIs"]
        GoogleOAuth["Google OAuth 2.0"]
        GeminiAPI["Google Gemini 2.5 Flash REST API"]
    end

    Auth -->|1. OAuth PKCE Flow| AuthService
    AuthService <-->|2. Token Exchange| GoogleOAuth
    Auth -->|3. Record Verified Login| DB
    DB --- RLS
    AuditUI -->|4. Query Logs via RPC| RPC
    RPC -->|5. Security Invoker Query| DB
    ChatUI -->|6. POST /functions/v1/gemini-chat| EdgeFunc
    EdgeFunc -->|7. Access Secret Key| Secrets
    EdgeFunc -->|8. POST /v1beta/models/...:generateContent| GeminiAPI
    GeminiAPI -->>|9. Return AI Response| EdgeFunc
    EdgeFunc -->>|10. Stream/JSON Response| ChatUI
```

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18.3, Vite 6.1 |
| **Styling & Icons** | Tailwind CSS 3.4, Lucide React, Custom SVG Icons |
| **Database & Auth** | Supabase JS v2, PostgreSQL 15, Row Level Security (RLS) |
| **Backend & Compute** | Supabase Edge Functions (Deno, TypeScript) |
| **Generative AI** | Google Gemini 2.5 Flash (`v1beta` REST API) |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Supabase Account](https://supabase.com/) & Project
- [Google AI Studio](https://aistudio.google.com/) Gemini API Key

### 2. Clone Repository
```bash
git clone https://github.com/Bored008/SupabaseAndGeminiChatBot.git
cd SupabaseAndGeminiChatBot
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root based on [`.env.example`](.env.example):
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Deploy Database Schema & RPC
Open your **Supabase Dashboard** -> **SQL Editor**, and run the SQL migration script from [`supabase/schema.sql`](supabase/schema.sql):

```sql
-- 1. Create Login Logs Table
create table if not exists public.login_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    email text not null,
    full_name text,
    avatar_url text,
    logged_in_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.login_logs enable row level security;

-- 3. Declarative RLS Policies
create policy "Users can insert own login"
    on public.login_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Authenticated users can view logins"
    on public.login_logs
    for select
    to authenticated
    using (true);

-- 4. RPC Procedure
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

### 5. Deploy the Supabase Edge Function
Install the Supabase CLI and deploy the serverless Deno Edge Function:

```bash
# Login and link your remote Supabase project
npx supabase login
npx supabase link --project-ref <your-supabase-project-id>

# Store your Google Gemini API key securely in Supabase Secrets
npx supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>

# Deploy the function
npx supabase functions deploy gemini-chat
```

### 6. Run the Application

```bash
# Start Vite development server
npm run dev

# Or build for production
npm run build
npm run preview
```

Open your browser at **`http://localhost:5173`**.

---

## 📁 Repository Directory Structure

```text
.
├── supabase/
│   ├── schema.sql                     # Table schema, RLS policies & RPC function
│   └── functions/
│       └── gemini-chat/
│           └── index.ts               # Deno Edge Function proxying Gemini 2.5 Flash
├── src/
│   ├── assets/
│   │   └── zyricon-orb.png            # Visual AI orb branding asset
│   ├── components/
│   │   ├── GeminiChatbot.jsx          # AI Chat interface, markdown rendering & telemetry
│   │   ├── LoginAuditLog.jsx          # RPC audit log table with CSV/JSON export & search
│   │   ├── LoginPage.jsx              # Google OAuth 2.0 sign-in landing screen
│   │   ├── Navbar.jsx                 # Workspace toolbar, centered switcher & model pill
│   │   ├── Sidebar.jsx                # Collapsible navigation, threads, and identity card
│   │   ├── TechnicalReportModal.jsx   # In-app architecture & technical documentation modal
│   │   └── ZyriconIcons.jsx           # Crisp vector icons (emblems, Gmail 4-color SVG, etc.)
│   ├── lib/
│   │   └── supabaseClient.js          # Initialized Supabase client with config guards
│   ├── App.jsx                        # Main workspace orchestrator & duplicate login guard
│   ├── index.css                      # Tailwind styling, ambient glows & custom scrollbars
│   └── main.jsx                       # React DOM entrypoint
├── .env.example                       # Environment variable template
├── REPORT.md                          # Full submission technical report
├── SPEC.md                            # Functional specification document
└── package.json                       # Project dependencies and build scripts
```

---

## 🔒 Security Architecture Summary

1. **Authentication (PKCE)**: Uses Supabase Auth PKCE flow to exchange authorization codes securely without exposing tokens in browser history.
2. **Row Level Security (RLS)**: Protects `public.login_logs` directly in PostgreSQL. Even if client-side code is modified by an attacker, the database rejects any `INSERT` where `user_id != auth.uid()`.
3. **RPC Encapsulation**: The procedure `get_recent_logins()` runs with `security invoker` rights, ensuring query execution complies with the calling user's active permissions.
4. **Zero-Secret Client**: The `GEMINI_API_KEY` is never bundled in frontend code or transmitted over client networks; it exists exclusively inside the server-side Deno Edge Function environment.

---

## 📄 Documentation Links
- **Technical Report**: [`REPORT.md`](REPORT.md)
- **Specification Document**: [`SPEC.md`](SPEC.md)

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
