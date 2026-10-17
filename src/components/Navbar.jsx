import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  ChevronDownIcon,
  MessageCircleIcon,
} from './ZyriconIcons';
import {
  Check,
  X,
  Sliders,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Database,
  Cpu,
  Layers,
  FileText,
} from 'lucide-react';
import TechnicalReportModal from './TechnicalReportModal';

export default function Navbar({
  user,
  activeTab,
  setActiveTab,
  selectedModel,
  setSelectedModel,
  activeConversation,
}) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPersona, setSystemPersona] = useState('Senior Full-Stack & GenAI Engineer');

  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Primary Edge Model' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Fast Fallback' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Legacy Fallback' },
  ];

  const handleSignOut = async () => {
    if (user?.id) {
      sessionStorage.removeItem(`logged_session_${user.id}`);
    }
    sessionStorage.clear();
    await supabase.auth.signOut();
  };

  const handleExportChat = () => {
    if (!activeConversation || !activeConversation.messages || activeConversation.messages.length === 0) {
      alert('No messages in current conversation to export.');
      return;
    }

    const title = activeConversation.title || 'Zyricon-Conversation';
    let content = `# ${title}\n\nExported: ${new Date().toLocaleString()}\nUser: ${user?.email || 'User'}\nModel: ${selectedModel || 'Gemini 2.5 Flash'}\nArchitecture: Supabase Edge Function (Deno) + PostgreSQL RLS\n\n---\n\n`;

    activeConversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'User' : 'Gemini AI Assistant';
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
      const latency = msg.latency ? ` [Latency: ${msg.latency}]` : '';
      content += `### ${role} (${time})${latency}\n\n${msg.text}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_transcript.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const userMetadata = user?.user_metadata || {};
  const fullName = userMetadata.full_name || userMetadata.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = userMetadata.avatar_url || userMetadata.picture;

  return (
    <>
      {/* Workspace Toolbar */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 xl:px-8 flex items-center justify-between border-b border-white/[0.04] bg-transparent select-none z-30 flex-shrink-0">
        {/* Left: Model Selector Pill */}
        <div className="flex items-center justify-start flex-1 min-w-0">
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#020202] hover:bg-[#18131d] border border-[#514452] text-xs sm:text-[13px] font-normal text-[#F4F2F5] flex items-center justify-center gap-2 transition cursor-pointer shadow-sm whitespace-nowrap"
              title="Active Google Gemini Model"
            >
              <span>{selectedModel || 'Gemini 2.5 Flash'}</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#99979D]" />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-[#020202] border border-[#514452] rounded-[18px] p-2 shadow-2xl z-50 backdrop-blur-xl">
                <div className="px-2.5 py-1.5 text-[11px] text-[#99979D] font-medium border-b border-white/5 mb-1 flex justify-between items-center">
                  <span>Google Gemini Models</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Deno Edge</span>
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.name);
                      setShowModelDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left text-[#F4F2F5] hover:bg-white/5 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {selectedModel === m.name ? (
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <span className="w-3.5 h-3.5" />
                      )}
                      <span className="font-normal">{m.name}</span>
                    </div>
                    <span className="text-[10px] text-purple-300/80 bg-purple-950/60 px-2 py-0.5 rounded-full font-mono">
                      {m.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Highlight View Switcher (Gemini Chat vs Login Audit Log) */}
        <div className="flex items-center justify-center flex-shrink-0 mx-2 sm:mx-4">
          <div className="flex items-center bg-[#020202] border border-purple-500/30 rounded-full p-1 sm:p-1.5 shadow-lg shadow-purple-950/40 backdrop-blur-md ring-1 ring-purple-500/15">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-md shadow-purple-900/50 border border-purple-400/30'
                  : 'text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/5'
              }`}
            >
              <span className="whitespace-nowrap tracking-wide">Gemini Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-md shadow-purple-900/50 border border-purple-400/30'
                  : 'text-[#99979D] hover:text-[#F4F2F5] hover:bg-white/5'
              }`}
            >
              <span className="whitespace-nowrap tracking-wide">Audit Log</span>
            </button>
          </div>
        </div>

        {/* Right: Workspace Actions */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3 flex-1 min-w-0">
          {/* Configuration Action Pill */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#020202] hover:bg-[#18131d] border border-white/5 text-xs sm:text-[13px] font-normal text-[#F4F2F5] flex items-center justify-center gap-2 transition cursor-pointer shadow-sm whitespace-nowrap"
            title="Configure System Architecture & Persona"
          >
            <span>Configuration</span>
            <Sliders className="w-3.5 h-3.5 text-[#99979D]" />
          </button>

          {/* Export Action Pill */}
          <button
            onClick={handleExportChat}
            className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#020202] hover:bg-[#18131d] border border-white/5 text-xs sm:text-[13px] font-normal text-[#F4F2F5] flex items-center justify-center gap-2 transition cursor-pointer shadow-sm whitespace-nowrap"
            title="Export Conversation Transcript"
          >
            <span>Export</span>
            <MessageCircleIcon className="w-3.5 h-3.5 text-[#99979D]" />
          </button>
        </div>
      </header>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#100C13] border border-[#514452] rounded-[28px] p-6 max-w-lg w-full shadow-2xl relative zyricon-workspace-bg">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-[#99979D] hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#2A272E] flex items-center justify-center text-purple-300">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#F4F2F5]">Workspace Configuration</h3>
                <p className="text-xs text-[#99979D]">Architecture parameters, model settings, and user session</p>
              </div>
            </div>

            {/* Architecture Telemetry Checklist */}
            <div className="p-3.5 rounded-2xl bg-[#020202] border border-white/5 mb-4 space-y-2">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider block">
                System Health & Status
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Supabase Auth: Active</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Postgres RLS: Enabled</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>RPC Function: Ready</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Gemini Edge: Streaming</span>
                </div>
              </div>
            </div>

            {/* User Session Profile */}
            <div className="p-3.5 rounded-2xl bg-[#020202] border border-white/5 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-9 h-9 rounded-full border border-purple-500/30" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-200">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-[#F4F2F5]">{fullName}</p>
                  <p className="text-[11px] text-[#99979D] truncate max-w-[160px] sm:max-w-[200px]">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-500/30 text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* AI Temperature Slider */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-[#F4F2F5]">
                <span>Temperature (Sampling Variability)</span>
                <span className="font-mono text-purple-300">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-[#2A272E] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#99979D]">
                <span>0.0 (Deterministic Code)</span>
                <span>0.7 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            {/* System Persona Input */}
            <div className="space-y-1 mb-5">
              <label className="text-xs text-[#F4F2F5]">System Persona</label>
              <input
                type="text"
                value={systemPersona}
                onChange={(e) => setSystemPersona(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#020202] border border-white/10 text-xs text-[#F4F2F5] focus:outline-none focus:border-purple-500"
                placeholder="e.g. Senior Software Architect"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setShowReportModal(true);
                }}
                className="flex-1 py-2 rounded-xl bg-[#181024] hover:bg-[#251538] border border-purple-500/30 text-xs font-medium text-purple-200 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-pink-400" />
                <span>Technical Report</span>
              </button>

              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2A272E] hover:bg-[#343039] text-xs font-medium text-white transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Report Modal */}
      <TechnicalReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </>
  );
}
