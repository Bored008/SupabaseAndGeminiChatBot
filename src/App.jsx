import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginAuditLog from './components/LoginAuditLog';
import GeminiChatbot from './components/GeminiChatbot';

import orbImg from './assets/zyricon-orb.png';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'audit'
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshAuditTrigger, setRefreshAuditTrigger] = useState(0);

  // Email-scoped conversation storage state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // In-memory lock to eliminate React 18 StrictMode double-invoke race conditions
  const loggingLockRef = useRef(new Set());

  // Helper function to insert login audit record into public.login_logs with duplicate prevention
  const recordLoginAudit = async (user) => {
    if (!user || !user.id) return;

    const sessionKey = `logged_session_${user.id}`;
    if (sessionStorage.getItem(sessionKey) || loggingLockRef.current.has(user.id)) {
      return;
    }

    loggingLockRef.current.add(user.id);
    sessionStorage.setItem(sessionKey, 'true');

    try {
      const userMetadata = user.user_metadata || {};
      const fullName = userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'User';
      const avatarUrl = userMetadata.avatar_url || userMetadata.picture || null;

      const { error } = await supabase.from('login_logs').insert([
        {
          user_id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      ]);

      if (error) {
        console.error('Failed to insert login audit log:', error);
        loggingLockRef.current.delete(user.id);
        sessionStorage.removeItem(sessionKey);
      } else {
        setRefreshAuditTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Unexpected error recording login audit:', err);
      loggingLockRef.current.delete(user.id);
      sessionStorage.removeItem(sessionKey);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setLoading(false);

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && currentSession?.user) {
        await recordLoginAudit(currentSession.user);
      } else if (event === 'SIGNED_OUT') {
        loggingLockRef.current.clear();
        sessionStorage.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load and sync conversations specifically for the currently logged-in user email
  useEffect(() => {
    const userEmail = session?.user?.email;
    if (!userEmail) {
      setConversations([]);
      setActiveConversationId(null);
      return;
    }

    const storageKey = `zyricon_conversations_${userEmail}`;
    const activeKey = `zyricon_active_thread_${userEmail}`;

    let saved = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse saved conversations', e);
    }

    if (!Array.isArray(saved) || saved.length === 0) {
      const initialChat = {
        id: `conv_${Date.now()}`,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
      };
      saved = [initialChat];
      localStorage.setItem(storageKey, JSON.stringify(saved));
      localStorage.setItem(activeKey, initialChat.id);
      setConversations(saved);
      setActiveConversationId(initialChat.id);
    } else {
      setConversations(saved);
      const savedActive = localStorage.getItem(activeKey);
      const exists = saved.some((c) => c.id === savedActive);
      setActiveConversationId(exists ? savedActive : saved[0].id);
    }
  }, [session?.user?.email]);

  // Create a new blank conversation for this user
  const handleNewChat = () => {
    const userEmail = session?.user?.email;
    if (!userEmail) return;

    const storageKey = `zyricon_conversations_${userEmail}`;
    const activeKey = `zyricon_active_thread_${userEmail}`;

    const newChat = {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };

    const updated = [newChat, ...conversations];
    setConversations(updated);
    setActiveConversationId(newChat.id);
    setActiveTab('chat');
    localStorage.setItem(storageKey, JSON.stringify(updated));
    localStorage.setItem(activeKey, newChat.id);
  };

  // Switch active conversation
  const handleSelectConversation = (id) => {
    const userEmail = session?.user?.email;
    setActiveConversationId(id);
    setActiveTab('chat');
    if (userEmail) {
      localStorage.setItem(`zyricon_active_thread_${userEmail}`, id);
    }
  };

  // Delete a conversation thread
  const handleDeleteConversation = (id) => {
    const userEmail = session?.user?.email;
    if (!userEmail) return;

    const storageKey = `zyricon_conversations_${userEmail}`;
    const activeKey = `zyricon_active_thread_${userEmail}`;

    const remaining = conversations.filter((c) => c.id !== id);

    if (remaining.length === 0) {
      const fallbackChat = {
        id: `conv_${Date.now()}`,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
      };
      setConversations([fallbackChat]);
      setActiveConversationId(fallbackChat.id);
      localStorage.setItem(storageKey, JSON.stringify([fallbackChat]));
      localStorage.setItem(activeKey, fallbackChat.id);
    } else {
      setConversations(remaining);
      localStorage.setItem(storageKey, JSON.stringify(remaining));
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
        localStorage.setItem(activeKey, remaining[0].id);
      }
    }
  };

  // Save updated messages into the active conversation & auto-title
  const handleSaveMessages = (conversationId, newMessages, promptText) => {
    const userEmail = session?.user?.email;
    if (!userEmail) return;

    const storageKey = `zyricon_conversations_${userEmail}`;

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === conversationId) {
          let title = conv.title;
          if ((title === 'New Chat' || !title) && promptText) {
            title = promptText.length > 28 ? promptText.slice(0, 28) + '...' : promptText;
          }
          return {
            ...conv,
            title,
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });

      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] || { id: 'temp', title: 'New Chat', messages: [] };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#030303] text-[#F4F2F5] font-sans">
        <div className="flex flex-col items-center gap-5">
          <img
            src={orbImg}
            alt="Zyricon AI"
            className="w-20 h-20 object-cover rounded-full zyricon-orb-glow animate-pulse"
          />
          <p className="text-sm text-[#99979D] font-normal tracking-wide">
            Loading Zyricon AI Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-screen bg-[#030303] text-[#F4F2F5] font-sans flex items-center justify-center p-0 sm:p-2 md:p-2.5 overflow-hidden select-none">
      {/* Outer Application Shell */}
      <div className="w-full h-full max-w-[2048px] rounded-none sm:rounded-[28px] md:rounded-[36px] border-0 sm:border border-[#A193AA]/40 bg-[#030303] flex overflow-hidden relative shadow-2xl">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          userEmail={session.user.email}
        />

        {/* Creative Workspace */}
        <div className="flex-1 my-0 sm:my-1.5 sm:mr-1.5 rounded-none sm:rounded-[22px] md:rounded-[28px] bg-[#100C13] overflow-hidden flex flex-col relative zyricon-workspace-bg">
          {/* Ambient Glow Radial Overlay */}
          <div className="zyricon-ambient-glow absolute top-0 left-0 right-0 h-[36rem] pointer-events-none z-0" />

          {/* Workspace Toolbar (Figma: Height 112px) */}
          <Navbar
            user={session.user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            activeConversation={activeConversation}
          />

          {/* Main View Switcher Container */}
          <main className="flex-1 min-h-0 overflow-hidden relative z-10">
            {activeTab === 'chat' ? (
              <GeminiChatbot
                key={activeConversation.id}
                activeConversation={activeConversation}
                onSaveMessages={handleSaveMessages}
              />
            ) : (
              <LoginAuditLog
                refreshTrigger={refreshAuditTrigger}
                currentUserEmail={session.user.email}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
