# SupabaseAndGeminiChatBot

> A production-ready Full-Stack unified web application integrating **Google OAuth**, PostgreSQL **Row Level Security (RLS)**, PostgreSQL **RPC functions**, and a serverless **Supabase Edge Function** communicating directly with the **Google Gemini 3.5 Flash REST API**.

---

## ⚡ Features

1. **Google OAuth Authentication (`@supabase/supabase-js`)**
   - Seamless sign-in with Google OAuth 2.0 PKCE flow.
   - User profile metadata (avatar, name, email) integration.

2. **Database Audit Logging with RLS (Row Level Security)**
   - Automatically logs sign-ins to `public.login_logs`.
   - Protected by granular RLS policies (`Users can insert own login`, `Authenticated users can view logins`).
   - Duplicate prevention guard using synchronous session locking to prevent race-condition duplicates.

3. **PostgreSQL RPC Function (`get_recent_logins`)**
   - Server-side encapsulated procedure with `security invoker` to fetch the 50 most recent logins.
   - Client-side live search and real-time refresh capability.

4. **AI Chatbot Powered by Supabase Edge Function (`gemini-chat`)**
   - High-performance Deno Edge server with full CORS support.
   - Securely isolates `GEMINI_API_KEY` inside Deno environment secrets.
   - High-speed direct REST integration with `gemini-3.5-flash` (`v1beta`).
   - Markdown code formatting with one-click "Copy Code" and latency telemetry.

5. **Premier Dark Dashboard UI**
   - Built with **React 18**, **Vite**, **Tailwind CSS**, and **Lucide Icons**.
   - Ambient glassmorphism, responsive split-column layout, and independent viewport scroll containers.

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Client["React Client (Vite + Tailwind CSS)"]
        UI[App.jsx Dashboard]
        Auth["Google OAuth (@supabase/supabase-js)"]
        AuditUI[LoginAuditLog Component]
        ChatUI[GeminiChatbot Component]
    end

    subgraph Supabase["Supabase Cloud Platform"]
        AuthService[Supabase Auth Service]
        DB[(PostgreSQL Database)]
        RLS[Row Level Security Engine]
        RPC[RPC: get_recent_logins]
        EdgeFunc[Edge Function: gemini-chat]
        Vault[Environment Secrets]
    end

    subgraph Google["Google APIs"]
        GoogleOAuth[Google OAuth 2.0]
        GeminiAPI[Gemini 3.5 Flash REST API]
    end

    Auth -->|OAuth Flow| AuthService
    AuthService <-->|Token Exchange| GoogleOAuth
    Auth -->|Insert Session on Login| DB
    DB --- RLS
    AuditUI -->|Invoke RPC| RPC
    RPC -->|Query with Invoker Security| DB
    ChatUI -->|invoke('gemini-chat')| EdgeFunc
    EdgeFunc -->|Fetch Key| Vault
    EdgeFunc -->|Direct POST /v1beta/models/...| GeminiAPI
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
- **Backend & Auth:** Supabase Auth, PostgreSQL, Row Level Security (RLS), PL/pgSQL RPC
- **Serverless Edge:** Supabase Edge Functions (Deno / TypeScript)
- **AI Model:** Google Gemini 3.5 Flash (v1beta REST API)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Bored008/SupabaseAndGeminiChatBot.git
cd SupabaseAndGeminiChatBot
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Deploy Database Schema & RPC
Go to your **Supabase Dashboard** -> **SQL Editor**, and execute the script in [`supabase/schema.sql`](supabase/schema.sql):
- Creates `public.login_logs`
- Enables Row Level Security (RLS)
- Applies Insert & Select policies
- Creates `public.get_recent_logins()` RPC function

### 4. Deploy the Gemini Edge Function
Make sure you have the Supabase CLI installed, then:
```bash
# Link your Supabase project
npx supabase login
npx supabase link --project-ref <your-project-id>

# Set your Gemini API key in secrets
npx supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>

# Deploy the function
npx supabase functions deploy gemini-chat
```

### 5. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📁 Project Structure

```text
.
├── supabase/
│   ├── schema.sql           # Database table, RLS policies, and RPC function
│   └── functions/
│       └── gemini-chat/
│           └── index.ts     # Deno Edge Function calling Gemini API
├── src/
│   ├── lib/
│   │   └── supabaseClient.js # Supabase client initialization
│   ├── components/
│   │   ├── LoginPage.jsx    # Google Sign-In view
│   │   ├── Navbar.jsx       # Header with profile & status badges
│   │   ├── LoginAuditLog.jsx# Left panel: RPC audit log with search & telemetry
│   │   └── GeminiChatbot.jsx# Right panel: Gemini AI chat interface
│   ├── App.jsx              # Main dashboard layout with duplicate login guard
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS styling & glassmorphism
├── .env.example             # Template environment variables
├── REPORT.md                # Comprehensive technical submission report
├── SPEC.md                  # Master project specification
└── package.json
```

---

## 📄 Documentation & Reports
- Detailed technical report for submission: [`REPORT.md`](REPORT.md)
- Complete master specification: [`SPEC.md`](SPEC.md)

---

## 📜 License
MIT License.
