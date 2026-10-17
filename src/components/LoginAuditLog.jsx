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
  Shield,
  Layers,
  Download,
  FileJson,
  Wifi,
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
  const [realtimeActive, setRealtimeActive] = useState(false);
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

      const { data, error: rpcError } = await supabase.rpc('get_recent_logins');
      if (rpcError) throw rpcError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error calling get_recent_logins:', err);
      setError(err.message || 'Failed to fetch login audit logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Option A: Supabase Realtime channel subscription + initial fetch
  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('realtime_login_logs_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'login_logs' },
        (payload) => {
          console.log('[Supabase Realtime] New login record detected:', payload);
          fetchLogs(true);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs, refreshTrigger]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Option B: Export audit logs to CSV
  const exportToCSV = () => {
    if (!logs.length) return;
    const headers = ['Session ID', 'Email', 'Full Name', 'Timestamp (UTC)', 'Timestamp (Local)'];
    const rows = logs.map((log) => [
      `"${log.id}"`,
      `"${log.email}"`,
      `"${(log.full_name || '').replace(/"/g, '""')}"`,
      `"${log.logged_in_at}"`,
      `"${new Date(log.logged_in_at).toLocaleString()}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zyricon_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Option B: Export audit logs to JSON
  const exportToJSON = () => {
    if (!logs.length) return;
    const jsonContent = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zyricon_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="flex flex-col h-full bg-transparent text-[#F4F2F5] overflow-hidden relative">

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Login Audit Log
                </h2>
                <span className="text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2.5 py-0.5 rounded-full font-medium">
                  RPC: get_recent_logins
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                PostgreSQL Row Level Security Verified Sessions
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              disabled={loading || logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#160d26] hover:bg-[#201338] border border-purple-500/20 text-xs font-semibold text-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
              title="Export all logs to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>CSV</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={exportToJSON}
              disabled={loading || logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#160d26] hover:bg-[#201338] border border-purple-500/20 text-xs font-semibold text-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
              title="Export all logs to JSON file"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchLogs(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#160d26] hover:bg-[#201338] border border-purple-500/20 text-xs font-semibold text-slate-200 transition cursor-pointer shadow-sm disabled:opacity-40"
              title="Refresh Logs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-purple-400 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>


        {/* Top 3 Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="zyricon-card p-4 sm:p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Total Sessions</p>
              <div className="flex items-center gap-2.5 sm:gap-3 mt-1.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shadow-purple-500/20">
                  <Activity className="w-5.5 h-5.5" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{logs.length}</p>
              </div>
            </div>
          </div>

          <div className="zyricon-card p-4 sm:p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Unique Users</p>
              <div className="flex items-center gap-2.5 sm:gap-3 mt-1.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{uniqueUsersCount}</p>
              </div>
            </div>
          </div>

          <div className="zyricon-card p-4 sm:p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Security Status</p>
              <div className="flex items-center gap-2.5 sm:gap-3 mt-2">
                <p className="text-sm sm:text-base font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  RLS Enforced
                </p>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit records by name, email, or date..."
            className="w-full bg-[#140b22]/90 border border-purple-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
          />
        </div>

        {/* Audit Log List Container */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-1">
          {loading && !refreshing ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">
                Executing RPC get_recent_logins()...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Database Query Error</p>
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
              <div className="w-12 h-12 rounded-2xl bg-[#160d26] border border-purple-500/20 flex items-center justify-center text-slate-500 mb-1">
                <Database className="w-6 h-6 stroke-1" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {searchTerm ? 'No matching logs found' : 'No login records found'}
              </p>
              <p className="text-xs max-w-xs text-slate-400">
                {searchTerm
                  ? 'Try searching with a different user name or email address.'
                  : 'New login sessions will automatically appear here once authenticated via Google OAuth.'}
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
                  className="zyricon-card p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      {log.avatar_url ? (
                        <img
                          src={log.avatar_url}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-500/30 group-hover:ring-purple-400 transition"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-purple-500/30">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isCurrentUser && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#09050f] rounded-full"
                          title="Current Active Account"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition">
                          {displayName}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <span className="truncate">{log.email}</span>
                        <button
                          onClick={() => copyToClipboard(log.email, log.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white transition"
                          title="Copy email"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="text-xs font-medium text-slate-300 font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {relativeTime}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5" title={fullTime}>
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
      </div>
    </div>
  );
}
