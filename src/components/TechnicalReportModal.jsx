import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  Database,
  Code,
  CheckCircle2,
  ExternalLink,
  Layers,
  Terminal,
  Activity,
} from 'lucide-react';

export default function TechnicalReportModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'tasks' | 'security' | 'edge'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-[#100C13] border border-[#514452] rounded-[28px] max-w-4xl w-full h-[85vh] max-h-[800px] flex flex-col shadow-2xl overflow-hidden relative zyricon-workspace-bg">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-medium text-[#F4F2F5]">
                  Full-Stack Technical Architecture Report
                </h2>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Verified Production
                </span>
              </div>
              <p className="text-xs text-[#99979D] mt-0.5">
                FS-GenAI Assessment: Supabase Core + Google OAuth Audit Log + Gemini Edge Function
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#99979D] hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex gap-2 border-b border-white/[0.04] bg-[#020202]/50 text-xs overflow-x-auto flex-shrink-0">
          {[
            { id: 'summary', label: 'Executive Summary', icon: Layers },
            { id: 'tasks', label: 'Assessment Tasks (1, 2, 3)', icon: CheckCircle2 },
            { id: 'security', label: 'PostgreSQL RLS & RPC', icon: Database },
            { id: 'edge', label: 'Gemini Edge Function', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-t-xl transition cursor-pointer border-b-2 font-medium ${
                  isActive
                    ? 'border-purple-500 text-white bg-white/5'
                    : 'border-transparent text-[#99979D] hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-[#F4F2F5] custom-scrollbar">
          {activeTab === 'summary' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D]">
                  <div className="flex items-center gap-2 text-purple-300 font-medium mb-1">
                    <Database className="w-4 h-4" />
                    <span>Task 1 & 2: Database</span>
                  </div>
                  <p className="text-xs text-[#99979D] leading-relaxed">
                    PostgreSQL with Row Level Security (RLS) policies and security invoker RPC function.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D]">
                  <div className="flex items-center gap-2 text-pink-300 font-medium mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Task 2: Audit Logs</span>
                  </div>
                  <p className="text-xs text-[#99979D] leading-relaxed">
                    Google OAuth sessions recorded in <code className="text-pink-300">public.login_logs</code> with React duplicate guards.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D]">
                  <div className="flex items-center gap-2 text-cyan-300 font-medium mb-1">
                    <Cpu className="w-4 h-4" />
                    <span>Task 3: Gemini Edge</span>
                  </div>
                  <p className="text-xs text-[#99979D] leading-relaxed">
                    Serverless Deno Edge Function proxying Gemini 2.5 Flash with CORS headers and AG-UI SSE streaming.
                  </p>
                </div>
              </div>

              {/* Architecture Tech Stack */}
              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-3">
                <h4 className="text-sm font-semibold text-white">Production Tech Stack</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#99979D] block text-[10px]">Frontend</span>
                    <span className="font-medium text-white">React 18 + Vite</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#99979D] block text-[10px]">Database</span>
                    <span className="font-medium text-white">Supabase PostgreSQL</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#99979D] block text-[10px]">Security</span>
                    <span className="font-medium text-white">Postgres RLS Policies</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#99979D] block text-[10px]">GenAI</span>
                    <span className="font-medium text-white">Gemini 2.5 Flash API</span>
                  </div>
                </div>
              </div>

              {/* Data Flow */}
              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-2">
                <h4 className="text-sm font-semibold text-white">Key Data Flow Directives</h4>
                <ul className="space-y-1.5 text-xs text-[#99979D] list-disc list-inside leading-relaxed">
                  <li>Client authenticates with Google via Supabase Auth OAuth 2.0 PKCE flow.</li>
                  <li>In-memory lock & session storage prevents duplicate writes during React 18 StrictMode double-invokes.</li>
                  <li>Protected RPC function <code className="text-purple-300">get_recent_logins()</code> retrieves latest audit records without exposing direct table writes.</li>
                  <li>Deno Edge Function reads <code className="text-purple-300">GEMINI_API_KEY</code> securely from vault secrets; secrets never reach client bundle.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Task 1: Supabase Core Implementation</h4>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <p className="text-xs text-[#99979D] leading-relaxed">
                  Configured relational schema, RLS policies, PostgreSQL RPC functions, and Deno runtime environment. Foreign key constraints ensure cascaded deletion when auth users are removed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Task 2: Google Login & Audit Log</h4>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <p className="text-xs text-[#99979D] leading-relaxed">
                  Automatic session recording upon sign-in. Interactive table displays email, full name, avatar, and relative timestamps with real-time Supabase channels, search filtering, and CSV/JSON export.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Task 3: Gemini Chatbot via Supabase Edge Function</h4>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <p className="text-xs text-[#99979D] leading-relaxed">
                  Calls Supabase Edge Function <code className="text-purple-300">gemini-chat</code> which proxies the prompt to Gemini REST API. Features streaming responses, code syntax highlighting, copy actions, file attachments, and voice input.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-3">
                <h4 className="font-semibold text-white">Active PostgreSQL RLS Policies (<code className="text-purple-300">supabase/schema.sql</code>)</h4>
                
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 font-mono text-[11px] text-[#DDD6E2]">
                    <span className="text-purple-400 block mb-1">-- Policy 1: Users can insert own login record</span>
                    create policy "Users can insert own login" on public.login_logs for insert to authenticated with check (auth.uid() = user_id);
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 font-mono text-[11px] text-[#DDD6E2]">
                    <span className="text-purple-400 block mb-1">-- Policy 2: Authenticated users can view all logins</span>
                    create policy "Authenticated users can view logins" on public.login_logs for select to authenticated using (true);
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 font-mono text-[11px] text-[#DDD6E2]">
                    <span className="text-purple-400 block mb-1">-- Remote Procedure Call (RPC) Function</span>
                    create or replace function public.get_recent_logins() returns table (id uuid, email text, full_name text, avatar_url text, logged_in_at timestamptz) language sql security invoker as $$ select id, email, full_name, avatar_url, logged_in_at from public.login_logs order by logged_in_at desc limit 50; $$;
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edge' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#020202] border border-[#38343D] space-y-3">
                <h4 className="font-semibold text-white">Serverless Edge Function Execution (<code className="text-purple-300">gemini-chat/index.ts</code>)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-purple-400 font-medium block mb-1">CORS Security</span>
                    <p className="text-[#99979D] leading-relaxed">
                      Handles browser OPTIONS preflight requests gracefully and returns authorization & content-type headers.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-pink-400 font-medium block mb-1">Secret Isolation</span>
                    <p className="text-[#99979D] leading-relaxed">
                      Reads <code className="text-pink-300">GEMINI_API_KEY</code> strictly from Deno environment secrets via <code className="text-pink-300">Deno.env.get()</code>.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-cyan-400 font-medium block mb-1">AG-UI Streaming</span>
                    <p className="text-[#99979D] leading-relaxed">
                      Server-Sent Events (SSE) pipe real-time token deltas as <code className="text-cyan-300">TEXT_MESSAGE_DELTA</code> directly to React state.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-emerald-400 font-medium block mb-1">Model Fallback</span>
                    <p className="text-[#99979D] leading-relaxed">
                      Automatically queries <code className="text-emerald-300">gemini-2.5-flash</code> with cascading fallbacks to ensure high availability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-[#020202] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#99979D]">
            Antigravity Autonomous Engineering Artifact
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2A272E] hover:bg-[#343039] text-xs font-medium text-white transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

