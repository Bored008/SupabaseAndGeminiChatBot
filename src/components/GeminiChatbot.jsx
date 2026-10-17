import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Sparkles,
  ArrowUp,
  Paperclip,
  SlidersHorizontal,
  LayoutGrid,
  Bot,
  User,
  Shield,
  Zap,
  Code2,
  Copy,
  Check,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
} from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Explain RLS', icon: Shield, prompt: 'Explain PostgreSQL Row Level Security (RLS) and why it is essential.' },
  { label: 'Supabase RPC', icon: Database, prompt: 'How does the get_recent_logins() RPC function work in Supabase?' },
  { label: 'Edge Functions', icon: Cpu, prompt: 'How do Supabase Edge Functions secure API keys like GEMINI_API_KEY?' },
];

const BOTTOM_CARDS = [
  {
    title: 'Row Level Security',
    desc: 'Explore PostgreSQL declarative access policies securing multi-tenant databases.',
    badge: 'Security',
    icon: Shield,
    prompt: 'Can you show me how Row Level Security policies prevent unauthorized access in PostgreSQL?',
  },
  {
    title: 'PostgreSQL RPC',
    desc: 'Direct server-side procedure execution with invoker rights and custom pagination.',
    badge: 'Database',
    icon: Database,
    prompt: 'Explain the difference between direct client table queries and PostgreSQL RPC functions.',
  },
  {
    title: 'Gemini 3.5 Edge',
    desc: 'High-speed Deno serverless edge execution calling Google Gemini REST API v1beta.',
    badge: 'GenAI',
    icon: Cpu,
    prompt: 'How does this Gemini Edge Function proxy user prompts to Google Gemini 3.5 Flash?',
  },
];

function FormattedMessage({ content }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  if (content.includes('```')) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const raw = part.slice(3, -3);
            const firstBreak = raw.indexOf('\n');
            const lang = firstBreak !== -1 ? raw.slice(0, firstBreak).trim() : '';
            const code = firstBreak !== -1 ? raw.slice(firstBreak + 1) : raw;

            return (
              <div
                key={index}
                className="my-3 rounded-xl bg-[#0e071a] border border-purple-500/20 overflow-hidden shadow-inner text-xs font-mono"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#170c2a] border-b border-purple-500/10 text-slate-400">
                  <span className="text-purple-300 font-semibold">{lang || 'code'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopiedCodeIndex(index);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="flex items-center gap-1 hover:text-white transition py-0.5 px-2 rounded hover:bg-purple-900/30"
                  >
                    {copiedCodeIndex === index ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }
          return (
            <p key={index} className="whitespace-pre-wrap leading-relaxed">
              {part}
            </p>
          );
        })}
      </div>
    );
  }

  return <div className="whitespace-pre-wrap leading-relaxed text-sm">{content}</div>;
}

export default function GeminiChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (promptText) => {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    setError(null);
    setInput('');

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const startTime = Date.now();
      const { data, error: functionError } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt: textToSend },
      });

      const latency = Date.now() - startTime;

      if (functionError) {
        let detailedError = functionError.message;
        try {
          if (functionError.context && typeof functionError.context.json === 'function') {
            const errorBody = await functionError.context.json();
            if (errorBody?.error) detailedError = errorBody.error;
          }
        } catch (_) {}
        throw new Error(detailedError || 'Edge Function execution failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const botReply = data?.reply || 'No response candidate returned by Gemini.';

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: botReply,
        timestamp: new Date(),
        latency: `${latency}ms`,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error invoking gemini-chat:', err);
      setError(err.message || 'Failed to reach Gemini Edge Function.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isInitialState = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#09050f] text-slate-100 overflow-hidden relative">
      {/* Background radial violet glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col p-4 sm:p-6 lg:p-8">
        {isInitialState ? (
          /* INITIAL VIEW: Glowing Orb + Headline + Cards (Directly matching reference image) */
          <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto w-full py-6">
            {/* Floating 3D Glowing Orb */}
            <div className="zyricon-orb mb-8" />

            {/* Headline */}
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight text-center mb-8">
              Ready to Create Something New?
            </h2>

            {/* Prompt Pills Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {SUGGESTIONS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#180e28] hover:bg-[#23153b] border border-purple-500/20 text-xs font-medium text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <Icon className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                );
              })}
            </div>

            {/* Glowing Input Box */}
            <div className="w-full max-w-2xl mb-10">
              <div className="rounded-2xl bg-[#140b22]/90 border border-purple-500/25 p-4 shadow-[0_0_30px_rgba(147,51,234,0.15)] focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 transition">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 animate-pulse" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Anything..."
                    disabled={loading}
                    className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>Attach</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer">
                      <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                      <span>Options</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition shadow-lg shadow-purple-600/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Feature Cards (Matching the image layout!) */}
            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
              {BOTTOM_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="zyricon-card p-4 rounded-2xl cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/25 px-2 py-0.5 rounded-full">
                          {card.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* CONVERSATION VIEW: Chat history */
          <div className="max-w-4xl mx-auto w-full space-y-5 py-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 group ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-semibold shadow-md ${
                      isUser
                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                        : 'bg-[#180e2a] text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 relative ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/20'
                        : 'bg-[#140b22]/90 border border-purple-500/20 text-slate-100 rounded-tl-none shadow-xl'
                    }`}
                  >
                    <FormattedMessage content={msg.text} />

                    <div
                      className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                        isUser
                          ? 'border-purple-400/30 text-purple-200'
                          : 'border-purple-500/10 text-slate-400'
                      }`}
                    >
                      <span>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>

                      {!isUser && (
                        <div className="flex items-center gap-2">
                          {msg.latency && <span>⚡ {msg.latency}</span>}
                          <button
                            onClick={() => copyMessage(msg.text, msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#180e2a] text-purple-300 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#140b22]/90 border border-purple-500/20 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Gemini is generating response...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Execution Error</p>
                  <p className="mt-1 leading-relaxed text-slate-300">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Pinned Input Bar (When in active conversation) */}
      {!isInitialState && (
        <div className="p-4 bg-[#09050f]/90 border-t border-purple-500/10 backdrop-blur-md">
          <div className="max-w-4xl mx-auto w-full">
            <div className="rounded-2xl bg-[#140b22]/90 border border-purple-500/25 p-3.5 shadow-xl focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 transition">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Gemini anything..."
                  disabled={loading}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
