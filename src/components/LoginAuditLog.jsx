import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ShieldCheck,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  Database,
  Search,
  Check,
  Copy,
  Users,
  Activity,
} from 'lucide-react';

function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function LoginAuditLog({ refreshTrigger, currentUserEmail }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Call the PostgreSQL RPC function defined in supabase/schema.sql
      const { data, error: rpcError } = await supabase.rpc('get_recent_logins');

      if (rpcError) throw rpcError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error calling get_recent_logins RPC:', err);
      setError(err.message || 'Failed to fetch login audit logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshTrigger]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (log) =>
        log.email?.toLowerCase().includes(term) ||
        log.full_name?.toLowerCase().includes(term) ||
        new Date(log.logged_in_at).toLocaleDateString().includes(term)
    );
  }, [logs, searchTerm]);

  const uniqueUsersCount = useMemo(() => {
    const emails = new Set(logs.map((l) => l.email));
    return emails.size;
  }, [logs]);

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-slate-900/40 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Login Audit Log
                </h2>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  RPC: get_recent_logins
                </span>
              </div>
              <p className="text-xs text-slate-400">PostgreSQL RLS-Protected Sessions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(true)}
              disabled={loading || refreshing}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl transition duration-150 disabled:opacity-40 cursor-pointer shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Refresh logs from database"
              title="Refresh logs from database"
            >
              <RefreshCw
                className={`w-4 h-4 transition-transform ${
                  refreshing ? 'animate-spin text-emerald-400' : 'group-hover:rotate-45'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Stats & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="audit-search" className="sr-only">Search audit logs</label>
            <input
              id="audit-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-white/5 text-slate-300">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>{logs.length} Logins</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-white/5 text-slate-300">
              <Users className="w-3 h-3 text-cyan-400" />
              <span>{uniqueUsersCount} Unique</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2.5">
        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Executing RPC get_recent_logins()...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Database Error</p>
                <p className="mt-1 leading-relaxed text-slate-300">{error}</p>
                <button
                  onClick={() => fetchLogs(true)}
                  className="mt-3 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg font-medium transition cursor-pointer"
                >
                  Retry Query
                </button>
              </div>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2 text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-slate-500 mb-1">
              <Database className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {searchTerm ? 'No matching logs found' : 'No audit entries yet'}
            </p>
            <p className="text-xs max-w-xs text-slate-400">
              {searchTerm
                ? 'Try searching with a different user name or email address.'
                : 'Login events will automatically appear here once authenticated via Google OAuth.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const displayName = log.full_name || log.email?.split('@')[0] || 'User';
            const isCurrentUser = currentUserEmail && log.email === currentUserEmail;
            const fullTime = new Date(log.logged_in_at).toLocaleString();
            const relativeTime = getRelativeTime(log.logged_in_at);

            return (
              <div
                key={log.id}
                className="group p-3 sm:p-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-850/80 border border-white/5 hover:border-white/10 transition-all duration-200 flex items-center justify-between gap-3 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {log.avatar_url ? (
                      <img
                        src={log.avatar_url}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-emerald-500/40 transition"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold ring-1 ring-white/10">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isCurrentUser && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"
                        title="You (Current Session)"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-300 transition">
                        {displayName}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[9px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="truncate max-w-[150px] sm:max-w-[180px]">{log.email}</span>
                      <button
                        onClick={() => copyToClipboard(log.email, log.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white transition focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded"
                        aria-label="Copy email"
                        title="Copy email"
                      >
                        {copiedId === log.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0 text-right">
                  <span className="text-xs font-medium text-slate-300 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {relativeTime}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5" title={fullTime}>
                    {new Date(log.logged_in_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/60 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Policy: <code className="text-emerald-300 font-mono">Authenticated users can view logins</code>
        </span>
        <span className="text-slate-400 font-mono">Limit 50 entries</span>
      </div>
    </div>
  );
}
