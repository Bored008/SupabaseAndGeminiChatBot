import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ChevronDown,
  Settings,
  Upload,
  LogOut,
  Bot,
  ShieldCheck,
  Check,
  X,
  FileDown,
  Sliders,
} from 'lucide-react';

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
  const [temperature, setTemperature] = useState(0.7);
  const [systemPersona, setSystemPersona] = useState('Default AI Assistant');

  const models = [
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tag: 'Fastest' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', tag: 'Lightweight' },
    { id: 'chatgpt-v4.0', name: 'ChatGPT v4.0', tag: 'Emulated' },
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
    let content = `# ${title}\n\nExported: ${new Date().toLocaleString()}\nUser: ${user?.email || 'User'}\n\n---\n\n`;

    activeConversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
      content += `### ${role} (${time})\n\n${msg.text}\n\n---\n\n`;
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
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#191124] bg-[#09050f]/80 backdrop-blur-xl select-none z-30">
        {/* Left: Model Selector Dropdown Pill (matching Figma 'ChatGPT v4.0 ⌵') */}
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#140e22] hover:bg-[#1f1533] border border-white/10 text-xs text-slate-200 transition cursor-pointer"
          >
            <span className="font-medium">{selectedModel || 'ChatGPT v4.0'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#857b98]" />
          </button>

          {showModelDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#130b21] border border-purple-500/20 rounded-xl p-1.5 shadow-2xl z-50">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.name);
                    setShowModelDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {selectedModel === m.name ? (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                    <span>{m.name}</span>
                  </div>
                  <span className="text-[10px] text-[#857b98] font-mono">{m.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: IDE / Agentic Style Segmented Mode Switcher */}
        <div className="flex items-center p-1 bg-[#130b20] border border-white/10 rounded-full shadow-inner">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Chatbot"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Login Audit Log"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login Audit Log</span>
          </button>
        </div>

        {/* Right: Configuration, Export, and Profile */}
        <div className="flex items-center gap-2.5">
          {/* Configuration Pill */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#140e22] hover:bg-[#1f1533] border border-white/10 text-xs text-slate-200 transition cursor-pointer"
            title="Configuration"
          >
            <span>Configuration</span>
            <Settings className="w-3.5 h-3.5 text-[#857b98]" />
          </button>

          {/* Export Pill */}
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#140e22] hover:bg-[#1f1533] border border-white/10 text-xs text-slate-200 transition cursor-pointer"
            title="Export Conversation"
          >
            <span>Export</span>
            <Upload className="w-3.5 h-3.5 text-[#857b98]" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 bg-[#140e22] border border-white/10 rounded-full py-1 pl-1 pr-2.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-500/30"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-slate-200 hidden md:inline truncate max-w-[100px]">
              {fullName}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#120921] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Assistant Configuration</h3>
                <p className="text-xs text-purple-300">Tune AI parameters and system behavior</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1.5">
                  <span>Creativity (Temperature)</span>
                  <span className="font-mono text-purple-400">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-purple-950/40 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5">System Persona</label>
                <select
                  value={systemPersona}
                  onChange={(e) => setSystemPersona(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#190e2d] border border-purple-500/20 text-slate-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="Default AI Assistant">Default AI Assistant</option>
                  <option value="Senior Full-Stack Engineer">Senior Full-Stack Engineer</option>
                  <option value="Database Architect">Database Architect</option>
                  <option value="Concise Problem Solver">Concise Problem Solver</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-purple-600/30"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </>
  );
}
