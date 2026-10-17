import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import LoginAuditLog from './components/LoginAuditLog';
import GeminiChatbot from './components/GeminiChatbot';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
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

    // Immediately claim locks synchronously BEFORE awaiting the network insert
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
        // Release locks if the actual database insert failed so user can retry
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
    // onAuthStateChange handles initial session and all auth events (SIGNED_IN, TOKEN_REFRESHED, etc.)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Initializing Secure Session...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 relative selection:bg-indigo-500/30 overflow-hidden">
      {/* Ambient background glow meshes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <Navbar user={session.user} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 relative z-10 min-h-0 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full min-h-0 flex-1 overflow-hidden">
          {/* Left Column: Login Audit Log (Task 2 + Task 1 RLS/RPC) */}
          <section className="h-full min-h-0 flex flex-col overflow-hidden">
            <LoginAuditLog
              refreshTrigger={refreshAuditTrigger}
              currentUserEmail={session.user.email}
            />
          </section>

          {/* Right Column: Gemini Chatbot (Task 3 + Task 1 Edge Function) */}
          <section className="h-full min-h-0 flex flex-col overflow-hidden">
            <GeminiChatbot />
          </section>
        </div>
      </main>
    </div>
  );
}
