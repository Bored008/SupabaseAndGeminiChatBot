import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginAuditLog from './components/LoginAuditLog';
import GeminiChatbot from './components/GeminiChatbot';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'audit'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshAuditTrigger, setRefreshAuditTrigger] = useState(0);

  // In-memory lock to eliminate React 18 StrictMode double-invoke race conditions
  const loggingLockRef = useRef(new Set());

  // Helper function to insert login audit record into public.login_logs with duplicate prevention
  const recordLoginAudit = async (user) => {
    if (!user || !user.id) return;

    const sessionKey = `logged_session_${user.id}`;

    // 1. Synchronous check: sessionStorage flag
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    // 2. Synchronous check: in-memory lock
    if (loggingLockRef.current.has(user.id)) {
      return;
    }

    // Claim locks synchronously BEFORE awaiting the network insert
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#09050f] text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="zyricon-orb" />
          <p className="text-xs text-purple-300 font-medium tracking-wide animate-pulse">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#09050f] text-slate-100 font-sans overflow-hidden select-none">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar with IDE/Agentic Mode Switcher */}
        <Navbar
          user={session.user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* View Switcher Container */}
        <main className="flex-1 min-h-0 overflow-hidden relative">
          {activeTab === 'chat' ? (
            <GeminiChatbot />
          ) : (
            <LoginAuditLog
              refreshTrigger={refreshAuditTrigger}
              currentUserEmail={session.user.email}
            />
          )}
        </main>
      </div>
    </div>
  );
}
