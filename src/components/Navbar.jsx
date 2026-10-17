import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Sparkles, Shield, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function Navbar({ user }) {
  const handleSignOut = async () => {
    if (user?.id) {
      sessionStorage.removeItem(`logged_session_${user.id}`);
    }
    sessionStorage.clear();
    await supabase.auth.signOut();
  };

  const userMetadata = user?.user_metadata || {};
  const fullName = userMetadata.full_name || userMetadata.name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const avatarUrl = userMetadata.avatar_url || userMetadata.picture;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-sm" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                FS-GenAI Unified App
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full shadow-inner">
                Assessment
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                All Systems Online
              </span>
              <span>•</span>
              <span>Supabase Auth & RLS</span>
              <span>•</span>
              <span>Gemini 3.5 Flash Edge</span>
            </div>
          </div>
        </div>

        {/* Center System Badges (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-white/5 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 text-emerald-300 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            RLS Active
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 text-cyan-300 border border-cyan-500/20">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Postgres RPC
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 text-purple-300 border border-purple-500/20">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            Edge Compute
          </span>
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-full py-1 pl-1 pr-3 shadow-inner">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/20">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left max-w-[120px] sm:max-w-[160px]">
              <p className="text-xs font-semibold text-slate-100 truncate leading-none">{fullName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-none">{email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-red-400 bg-slate-900/80 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-sm group"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
