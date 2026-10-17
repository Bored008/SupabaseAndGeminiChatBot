import React from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  ShieldCheck,
  FolderGit2,
  Database,
  Cpu,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Layers,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onNewChat,
  isCollapsed,
  setIsCollapsed,
}) {
  return (
    <aside
      className={`transition-all duration-300 ease-in-out flex flex-col bg-[#07040c] border-r border-purple-500/10 h-full select-none z-20 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-purple-500/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Zyricon</span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/40 transition cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => {
            setActiveTab('chat');
            onNewChat?.();
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 border border-purple-500/20 hover:border-purple-500/40 transition duration-150 cursor-pointer text-xs font-semibold shadow-inner ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="New Chat"
        >
          <Plus className="w-4 h-4 text-purple-400" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-5 text-xs">
        {/* Features / Mode Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Features
            </p>
          )}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition duration-150 cursor-pointer font-medium ${
                activeTab === 'chat'
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Chatbot"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Chat</span>}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition duration-150 cursor-pointer font-medium ${
                activeTab === 'audit'
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Login Audit Log"
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Audit Log</span>}
            </button>
          </nav>
        </div>

        {/* Workspaces / System Context */}
        {!isCollapsed && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Workspaces
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 px-3 py-1.5 text-slate-400 hover:text-slate-300 rounded-lg text-xs cursor-default">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Postgres RLS</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1.5 text-slate-400 hover:text-slate-300 rounded-lg text-xs cursor-default">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Edge Functions</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1.5 text-slate-400 hover:text-slate-300 rounded-lg text-xs cursor-default">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google OAuth</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Security Card (Matching Zyricon "Upgrade to premium" style) */}
      {!isCollapsed && (
        <div className="p-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#180e28] to-[#120920] border border-purple-500/20 text-center shadow-lg relative overflow-hidden">
            <div className="w-7 h-7 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 mb-2 border border-purple-500/30">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">RLS Security Shield</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Row-level access policies active with invoker security.
            </p>
            <div className="mt-2.5 inline-block text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              ● All Systems Protected
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
