import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Bot, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, activeTab, setActiveTab }) {
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
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-purple-500/10 bg-[#09050f]/80 backdrop-blur-xl select-none z-30">
      {/* Left: Active Model Status Pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#160d26] border border-purple-500/20 text-xs font-medium text-slate-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini 3.5 Flash</span>
        </div>
      </div>

      {/* Center: IDE / Agentic Style Segmented Mode Switcher */}
      <div className="flex items-center p-1 bg-[#120822] border border-purple-500/20 rounded-xl shadow-inner">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Switch to Chatbot"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chatbot</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Switch to Login Audit Log"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Login Audit Log</span>
        </button>
      </div>

      {/* Right: User Profile & Sign Out */}
      <div className="flex items-center gap-3">
        {/* User Pill */}
        <div className="flex items-center gap-2.5 bg-[#160d26] border border-purple-500/20 rounded-full py-1 pl-1 pr-3 shadow-inner">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/40"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
            {fullName}
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-red-400 bg-[#160d26] hover:bg-red-500/10 border border-purple-500/20 hover:border-red-500/30 rounded-full transition cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
