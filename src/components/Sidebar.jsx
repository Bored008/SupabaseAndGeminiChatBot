import React from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Clock,
  Shield,
} from 'lucide-react';

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
  userEmail,
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

      {/* New Chat Primary Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition duration-150 cursor-pointer text-xs font-semibold shadow-md shadow-purple-600/25 ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Start New Chat"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation & Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 space-y-5 text-xs">
        {/* Mode Selector */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Views
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
              title="AI Chatbot"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Chatbot</span>}
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
              {!isCollapsed && <span>Login Audit Log</span>}
            </button>
          </nav>
        </div>

        {/* User-Scoped Conversations History */}
        {!isCollapsed && (
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                Your Conversations
              </p>
              <span className="text-[10px] font-mono text-purple-400">
                {conversations?.length || 0}
              </span>
            </div>

            {(!conversations || conversations.length === 0) ? (
              <p className="px-3 py-2 text-[11px] text-slate-500 italic">
                No saved chats for this account yet.
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => {
                  const isActive = activeTab === 'chat' && conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/25 text-purple-200 border border-purple-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                      title={conv.title}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                        <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition rounded"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Account Scope Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-purple-500/10">
          <div className="px-3 py-2 rounded-xl bg-[#120920] border border-purple-500/15 text-[11px]">
            <p className="text-slate-500 font-medium truncate">Storage Linked to:</p>
            <p className="text-purple-300 font-semibold truncate mt-0.5">{userEmail}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
