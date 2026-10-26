import React, { useState } from 'react';
import {
  SparkleIcon,
  PanelLeftIcon,
  MessageCircleIcon,
  DatabaseIcon,
  ShieldIcon,
  ServerIcon,
  FileTextIcon,
  GmailIcon,
} from './ZyriconIcons';
import { Trash2, ShieldCheck, Layers, ExternalLink, LogOut, Code, Cpu, Mail, X } from 'lucide-react';
import TechnicalReportModal from './TechnicalReportModal';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar({
  activeTab,
  setActiveTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  userEmail,
  user,
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // On mobile drawer, always display full expanded layout when open
  const showExpanded = !isCollapsed || isMobileOpen;

  // Extract email domain to fetch provider logo or fallback to Gmail icon
  const emailDomain = userEmail?.includes('@') ? userEmail.split('@')[1].toLowerCase() : '';
  const isGmail = emailDomain === 'gmail.com' || emailDomain === 'googlemail.com';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const domainLogoUrl = emailDomain ? `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=64` : null;
  const logoSrc = userAvatar || domainLogoUrl;

  const handleSignOut = async () => {
    sessionStorage.clear();
    await supabase.auth.signOut();
  };

  const handleStartPresetChat = (prompt) => {
    onNewChat();
    setIsMobileOpen?.(false);
    // Dispatch custom event to seed prompt if needed
    window.dispatchEvent(new CustomEvent('zyricon:seed_prompt', { detail: { prompt } }));
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-20 transition-all duration-300 ease-in-out flex flex-col bg-[#030303] text-[#F4F2F5] h-full select-none flex-shrink-0 border-r border-white/[0.08] md:border-r-0 ${
          isMobileOpen
            ? 'translate-x-0 w-72 max-w-[85vw] pt-4 px-3.5 pb-3 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed
            ? 'md:w-16 md:px-2 md:py-4'
            : 'md:w-60 sm:md:w-64 lg:md:w-[270px] md:pt-4 md:px-3.5 md:pb-3 sm:md:pt-5 sm:md:px-4 sm:md:pb-4'
        }`}
      >
        {/* Brand Header */}
        <div className="h-10 flex items-center justify-between gap-2.5 mb-3.5 flex-shrink-0">
          {showExpanded ? (
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Circular brand emblem */}
              <div className="w-8 h-8 rounded-full bg-[#292A2D] flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-[#F4F2F5] flex items-center justify-center">
                  <SparkleIcon className="w-3.5 h-3.5 text-[#26102D]" fill="#26102D" />
                </div>
              </div>
              <div>
                <span className="font-medium text-lg sm:text-xl tracking-tight text-[#F4F2F5] block leading-none">
                  Zyricon
                </span>
                <span className="text-[10px] text-purple-400 font-mono tracking-wider">
                  GenAI Workspace
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-full bg-[#292A2D] flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-[#F4F2F5] flex items-center justify-center">
                <SparkleIcon className="w-3.5 h-3.5 text-[#26102D]" fill="#26102D" />
              </div>
            </div>
          )}

          {/* Close button on Mobile */}
          <button
            onClick={() => setIsMobileOpen?.(false)}
            className="md:hidden p-1.5 rounded-lg text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/5 transition cursor-pointer flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sidebar Toggle Icon Button on Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:block p-1.5 rounded-lg text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/5 transition cursor-pointer flex-shrink-0 ${
              isCollapsed ? 'mx-auto mt-1' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar"
          >
            <PanelLeftIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="mb-3.5 flex-shrink-0">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-2.5 py-2 sm:py-2.5 px-3 rounded-[14px] bg-[#2A272E] hover:bg-[#343039] border border-white/[0.04] text-[#F4F2F5] transition duration-150 cursor-pointer text-xs sm:text-sm font-normal shadow-sm ${
              !showExpanded ? 'justify-center px-0' : ''
            }`}
            title="Start New Conversation"
          >
            <MessageCircleIcon className="w-4 h-4 text-[#F4F2F5] flex-shrink-0" />
            {showExpanded && <span className="truncate">New Chat</span>}
          </button>
        </div>

        {/* Navigation & Workspaces Scroll Area */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1 custom-scrollbar">
          {/* Features Group */}
          <div>
            {showExpanded && (
              <p className="px-2.5 text-[10.5px] font-medium text-[#99979D] uppercase tracking-wider mb-1">
                Core Modules
              </p>
            )}
            <nav className="space-y-0.5">
              {/* Chat Item (Task 3) */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition duration-150 cursor-pointer text-xs sm:text-[13px] font-normal ${
                  activeTab === 'chat'
                    ? 'bg-[#181024] text-[#F4F2F5] border border-[#2b193f]'
                    : 'text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/[0.03]'
                } ${!showExpanded ? 'justify-center px-0' : ''}`}
                title="Gemini Edge Chatbot (Task 3)"
              >
                <Cpu className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                {showExpanded && <span className="truncate">Gemini Chatbot</span>}
              </button>

              {/* Login Audit Log Item (Task 2) */}
              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition duration-150 cursor-pointer text-xs sm:text-[13px] font-normal ${
                  activeTab === 'audit'
                    ? 'bg-[#181024] text-[#F4F2F5] border border-[#2b193f]'
                    : 'text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/[0.03]'
                } ${!showExpanded ? 'justify-center px-0' : ''}`}
                title="PostgreSQL Login Audit Log (Task 2)"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                {showExpanded && <span className="truncate">Login Audit Log</span>}
              </button>

              {/* Database & RLS Schema (Task 1) */}
              <button
                onClick={() => {
                  setShowSchemaModal(true);
                  setIsMobileOpen?.(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition duration-150 cursor-pointer text-xs sm:text-[13px] font-normal text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/[0.03] ${
                  !showExpanded ? 'justify-center px-0' : ''
                }`}
                title="Inspect PostgreSQL RLS Policies & RPC (Task 1)"
              >
                <DatabaseIcon className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                {showExpanded && <span className="truncate">PostgreSQL Schema & RLS</span>}
              </button>

              {/* Technical Report Modal */}
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setIsMobileOpen?.(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition duration-150 cursor-pointer text-xs sm:text-[13px] font-normal text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/[0.03] ${
                  !showExpanded ? 'justify-center px-0' : ''
                }`}
                title="View Technical Submission Report"
              >
                <FileTextIcon className="w-4 h-4 flex-shrink-0 text-pink-400" />
                {showExpanded && <span className="truncate">Technical Report</span>}
              </button>
            </nav>

            {/* Subtle Divider */}
            <div className="h-[1px] bg-[#141416] my-2.5" />
          </div>

          {/* Workspaces Group */}
          <div>
            {showExpanded && (
              <p className="px-2.5 text-[10.5px] font-medium text-[#99979D] uppercase tracking-wider mb-1">
                Conversations
              </p>
            )}

            <div className="space-y-0.5">
              {/* Active Conversation Threads */}
              {showExpanded && (
                <div className="space-y-0.5">
                  {conversations && conversations.length > 0 ? (
                    conversations.map((conv) => {
                      const isActive = activeTab === 'chat' && conv.id === activeConversationId;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            onSelectConversation(conv.id);
                            setActiveTab('chat');
                          }}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-normal transition duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-[#181024] text-[#F4F2F5] border border-[#2b193f]'
                              : 'text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/[0.03]'
                          }`}
                          title={conv.title}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageCircleIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#99979D] group-hover:text-purple-300" />
                            <span className="truncate">{conv.title || 'New Chat'}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#99979D] hover:text-red-400 transition rounded"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  ) : null}

                  {/* Real Quick-Start Engineering Context Workspaces */}
                  {[
                    {
                      label: 'RLS & RPC Security',
                      prompt: 'Explain the security model of Row Level Security (RLS) on public.login_logs and how the RPC function get_recent_logins() executes with security invoker.',
                    },
                    {
                      label: 'Deno Edge & CORS',
                      prompt: 'Review the Supabase Deno Edge Function implementation. How does it handle OPTIONS preflight CORS requests and stream Server-Sent Events (SSE)?',
                    },
                    {
                      label: 'Duplicate Login Guard',
                      prompt: 'Explain how the React client-side duplicate login guard prevents race conditions when Google OAuth completes or tokens refresh.',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleStartPresetChat(item.prompt)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-normal text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/[0.03] transition duration-150 cursor-pointer group"
                      title={item.prompt}
                    >
                      <Code className="w-3.5 h-3.5 flex-shrink-0 text-[#99979D] group-hover:text-purple-300 transition" />
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Architecture Panel (Replaces dummy upgrade panel) */}
        {showExpanded && (
          <div className="mt-2 pt-1 flex-shrink-0">
            <div className="zyricon-premium-panel rounded-[20px] border border-white/[0.04] p-3 sm:p-3.5 flex flex-col items-center gap-2 text-center">
              {/* Architecture Emblem */}
              <div className="w-8 h-8 rounded-full bg-[#2B282F] flex items-center justify-center flex-shrink-0 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-purple-300" />
              </div>

              {/* Heading */}
              <h4 className="text-xs sm:text-sm font-medium text-[#F4F2F5] leading-snug">
                Unified Assessment App
              </h4>

              {/* Description */}
              <p className="text-[10px] sm:text-[11px] text-[#99979D] leading-relaxed">
                Supabase Auth + PostgreSQL RLS + Gemini 2.5 Flash Edge Function
              </p>

              {/* View Report Button */}
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setIsMobileOpen?.(false);
                }}
                className="w-full py-1.5 sm:py-2 px-3 rounded-xl bg-[#2A272E] hover:bg-[#343039] border border-white/[0.04] text-xs font-normal text-[#F4F2F5] transition duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Technical Report</span>
                <ExternalLink className="w-3 h-3 text-purple-300" />
              </button>
            </div>

            {/* User Email & Full-Width Logout Action */}
            {userEmail && (
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-col gap-2 w-full px-0.5">
                {/* Row 1: Gmail / Email Provider Logo beside Email */}
                <div className="flex items-center gap-2 min-w-0 w-full" title={userEmail}>
                  <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden p-0.5">
                    {logoSrc && !logoError ? (
                      <img
                        src={logoSrc}
                        alt="email logo"
                        className="w-full h-full object-contain rounded-sm"
                        onError={() => setLogoError(true)}
                      />
                    ) : isGmail ? (
                      <GmailIcon className="w-3.5 h-3.5" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-purple-300" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 truncate font-medium flex-1">
                    {userEmail}
                  </span>
                </div>

                {/* Row 2: Full Sidebar Width Logout Button with margin */}
                <button
                  onClick={handleSignOut}
                  className="w-full py-1.5 sm:py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-500/25 text-xs font-medium transition duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  title="Sign out of Zyricon"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsed Footer Logo & Logout */}
        {!showExpanded && userEmail && (
          <div className="mt-auto pt-2 flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center overflow-hidden p-1"
              title={userEmail}
            >
              {logoSrc && !logoError ? (
                <img
                  src={logoSrc}
                  alt="email logo"
                  className="w-full h-full object-contain rounded-sm"
                  onError={() => setLogoError(true)}
                />
              ) : isGmail ? (
                <GmailIcon className="w-4 h-4" />
              ) : (
                <Mail className="w-4 h-4 text-purple-300" />
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-red-400 hover:bg-red-950/60 hover:text-red-200 border border-transparent hover:border-red-500/30 transition cursor-pointer"
              title={`Logout (${userEmail})`}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Technical Report Modal */}
      <TechnicalReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Database Schema & RLS Modal (Task 1) */}
      {showSchemaModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-[#100C13] border border-[#514452] rounded-[28px] max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden relative zyricon-workspace-bg">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <DatabaseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#F4F2F5]">PostgreSQL Schema & RLS Policies</h3>
                  <p className="text-xs text-[#99979D]">Task 1 Core Database Modeling (<code className="text-emerald-300">supabase/schema.sql</code>)</p>
                </div>
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="p-1.5 text-[#99979D] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono custom-scrollbar">
              <div className="p-3.5 rounded-xl bg-[#020202] border border-[#38343D] space-y-1.5">
                <span className="text-purple-400 font-sans font-medium text-xs block">1. Table Definition (`public.login_logs`)</span>
                <pre className="text-[#DDD6E2] overflow-x-auto">
{`create table if not exists public.login_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  full_name text,
  avatar_url text,
  logged_in_at timestamptz default now() not null
);`}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020202] border border-[#38343D] space-y-1.5">
                <span className="text-purple-400 font-sans font-medium text-xs block">2. Row Level Security Policies</span>
                <pre className="text-[#DDD6E2] overflow-x-auto">
{`-- Enable Row Level Security
alter table public.login_logs enable row level security;

-- Policy 1: Authenticated users can insert their own record
create policy "Users can insert own login"
on public.login_logs for insert to authenticated
with check (auth.uid() = user_id);

-- Policy 2: Authenticated users can view all logins
create policy "Authenticated users can view logins"
on public.login_logs for select to authenticated
using (true);`}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020202] border border-[#38343D] space-y-1.5">
                <span className="text-purple-400 font-sans font-medium text-xs block">3. Invoker RPC Function</span>
                <pre className="text-[#DDD6E2] overflow-x-auto">
{`create or replace function public.get_recent_logins()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  logged_in_at timestamptz
)
language sql security invoker as $$
  select id, email, full_name, avatar_url, logged_in_at
  from public.login_logs
  order by logged_in_at desc limit 50;
$$;`}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-white/[0.06] bg-[#020202] flex justify-end">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2A272E] text-xs font-medium text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
