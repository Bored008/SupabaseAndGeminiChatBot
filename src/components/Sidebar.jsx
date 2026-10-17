import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Archive,
  Library,
  FolderPlus,
  Folder,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Check,
  X,
  Zap,
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  return (
    <>
      <aside
        className={`transition-all duration-300 ease-in-out flex flex-col bg-[#09050f] border-r border-[#191124] h-full select-none z-20 ${
          isCollapsed ? 'w-16' : 'w-60 sm:w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#191124]">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/30">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">Zyricon</span>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer ${
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
            onClick={onNewChat}
            className={`w-full flex items-center justify-start gap-2 py-2 px-3 rounded-xl bg-[#181126] hover:bg-[#231738] border border-white/5 text-[#cfc5e2] hover:text-white transition duration-150 cursor-pointer text-xs font-medium shadow-sm ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Start New Chat"
          >
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
              +
            </div>
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation & Workspace List */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 space-y-4 text-xs">
          {/* Features Section */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-semibold text-[#635b75] uppercase tracking-wider mb-1">
                Features
              </p>
            )}
            <nav className="space-y-0.5">
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer text-xs font-medium ${
                  activeTab === 'chat'
                    ? 'bg-[#1b122c] text-white border border-purple-500/20'
                    : 'text-[#9c91b1] hover:text-white hover:bg-white/5'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title="Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                {!isCollapsed && <span>Chat</span>}
              </button>

              <button
                onClick={() => setShowArchivedModal(true)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer text-xs font-medium text-[#9c91b1] hover:text-white hover:bg-white/5 ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="Archived"
              >
                <Archive className="w-3.5 h-3.5 flex-shrink-0" />
                {!isCollapsed && <span>Archived</span>}
              </button>

              <button
                onClick={() => setShowLibraryModal(true)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer text-xs font-medium text-[#9c91b1] hover:text-white hover:bg-white/5 ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="Library"
              >
                <Library className="w-3.5 h-3.5 flex-shrink-0" />
                {!isCollapsed && <span>Library</span>}
              </button>
            </nav>
          </div>

          {/* Workspaces Section */}
          <div>
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-1">
                <p className="text-[10px] font-semibold text-[#635b75] uppercase tracking-wider">
                  Workspaces
                </p>
                <span className="text-[10px] font-mono text-purple-400">
                  {conversations?.length || 0}
                </span>
              </div>
            )}

            <button
              onClick={onNewChat}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer text-xs font-medium text-[#9c91b1] hover:text-white hover:bg-white/5 mb-1 ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="New Project"
            >
              <FolderPlus className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
              {!isCollapsed && <span>New Project</span>}
            </button>

            {/* Email-scoped conversation threads */}
            {!isCollapsed && (
              <div className="space-y-0.5">
                {(!conversations || conversations.length === 0) ? (
                  <p className="px-3 py-1.5 text-[11px] text-[#635b75] italic">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => {
                    const isActive = activeTab === 'chat' && conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          onSelectConversation(conv.id);
                          setActiveTab('chat');
                        }}
                        className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-[#1b122c] text-white border border-purple-500/20'
                            : 'text-[#9c91b1] hover:text-white hover:bg-white/5'
                        }`}
                        title={conv.title}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Folder className="w-3.5 h-3.5 flex-shrink-0 text-[#857b98] group-hover:text-purple-300 transition" />
                          <span className="truncate">{conv.title || 'Untitled Project'}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#857b98] hover:text-red-400 transition rounded"
                          title="Delete thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade To Premium Card */}
        {!isCollapsed && (
          <div className="p-3">
            <div className="rounded-2xl bg-[#140b20] border border-[#241538] p-3 text-center shadow-lg">
              <div className="w-7 h-7 rounded-full bg-[#201333] border border-purple-500/20 flex items-center justify-center mx-auto mb-2 text-purple-300">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-semibold text-white">Upgrade to premium</h4>
              <p className="text-[10px] text-[#857b98] mt-1 leading-snug">
                Boost productivity with seamless automation and responsive AI, built to adapt to your needs.
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full mt-3 py-1.5 px-3 rounded-xl bg-[#231638] hover:bg-[#2f1e4b] border border-purple-500/20 text-xs font-semibold text-white transition duration-150 cursor-pointer"
              >
                Upgrade
              </button>
            </div>

            {/* Email storage identity badge */}
            <div className="mt-2.5 px-2 py-1 rounded-lg bg-[#0e0717] border border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-[#635b75] truncate">Account:</span>
              <span className="text-purple-300 font-mono truncate ml-1 max-w-[120px]">{userEmail}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#120921] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Zyricon Premium</h3>
                <p className="text-xs text-purple-300">Unlock maximum AI power and storage</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 my-5">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Unlimited Google Gemini 3.5 Flash queries</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Per-account isolated cloud thread backups</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Priority edge function routing with sub-500ms latency</span>
              </li>
            </ul>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-purple-600/30"
            >
              Active Workspace (Granted)
            </button>
          </div>
        </div>
      )}

      {/* Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#120921] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLibraryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Prompt Library</h3>
                <p className="text-xs text-purple-300">Pre-built high performance prompts</p>
              </div>
            </div>
            <div className="space-y-2.5 my-4 max-h-72 overflow-y-auto">
              {[
                { title: 'Code Refactoring', text: 'Analyze this code for performance bottlenecks, edge cases, and modern best practices.' },
                { title: 'Architecture Review', text: 'Design a resilient distributed microservice architecture with caching and security.' },
                { title: 'PostgreSQL Optimization', text: 'Provide indexing strategies and query optimizations for high-throughput tables.' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#190e2d] border border-purple-500/15">
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="text-[11px] text-[#9c91b1] mt-1">{item.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowLibraryModal(false)}
              className="w-full py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-white text-xs font-medium transition cursor-pointer"
            >
              Close Library
            </button>
          </div>
        </div>
      )}

      {/* Archived Modal */}
      {showArchivedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#120921] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowArchivedModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Archived Chats</h3>
                <p className="text-xs text-purple-300">Archived workspaces for {userEmail}</p>
              </div>
            </div>
            <p className="text-xs text-[#857b98] my-4 leading-relaxed">
              No archived conversations. All active threads are synced in your primary workspace list.
            </p>
            <button
              onClick={() => setShowArchivedModal(false)}
              className="w-full py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-white text-xs font-medium transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
