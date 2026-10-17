import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Shield,
  Zap,
  Code2,
  Terminal,
} from 'lucide-react';

const SUGGESTIONS = [
  { text: 'Explain PostgreSQL Row Level Security (RLS)', icon: Shield },
  { text: 'How do Supabase Edge Functions secure API keys?', icon: Zap },
  { text: 'Why use an RPC function instead of client queries?', icon: Code2 },
  { text: 'Write a sample SQL query to inspect login_logs', icon: Terminal },
];

// Helper to format basic markdown (bold, inline code, code blocks, lists)
function FormattedMessage({ content }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  // If text has code blocks ```...```
  if (content.includes('```')) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const rawContent = part.slice(3, -3);
            const firstLineBreak = rawContent.indexOf('\n');
            const language = firstLineBreak !== -1 ? rawContent.slice(0, firstLineBreak).trim() : '';
            const code = firstLineBreak !== -1 ? rawContent.slice(firstLineBreak + 1) : rawContent;

            return (
              <div
                key={index}
                className="my-2 rounded-xl bg-slate-950/90 border border-white/10 overflow-hidden text-xs shadow-inner"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-white/5 text-slate-400">
                  <span className="font-mono text-[11px] text-slate-300">
                    {language || 'code'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopiedCodeIndex(index);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="flex items-center gap-1 hover:text-white transition py-0.5 px-1.5 rounded hover:bg-slate-800"
                    title="Copy code"
                  >
                    {copiedCodeIndex === index ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-slate-200 font-mono leading-relaxed text-[11px]">
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

  return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
}

const ChatMessage = React.memo(({ msg }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copyResponse = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-semibold shadow-md ${
          isUser
            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-indigo-500/20 ring-1 ring-white/20'
            : 'bg-slate-800/90 text-purple-400 border border-purple-500/30'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-600/15'
            : 'bg-slate-900/70 text-slate-100 rounded-tl-none border border-white/5 shadow-inner'
        }`}
      >
        <FormattedMessage content={msg.text} />

        <div
          className={`mt-2 pt-1 border-t flex items-center justify-between text-[10px] font-mono ${
            isUser
              ? 'border-indigo-400/30 text-indigo-200'
              : 'border-white/5 text-slate-400'
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
              {msg.latency && (
                <span className="text-slate-400">⚡ {msg.latency}</span>
              )}
              <button
                onClick={() => copyResponse(msg.text)}
                className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function GeminiChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      text: "Hello! I am your AI assistant powered by Google Gemini 3.5 Flash through a secure Supabase Edge Function.\n\nAsk me anything about Supabase architecture, Row Level Security, or Full-Stack development!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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

      const botReply = data?.reply || 'No response returned from Gemini.';

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: botReply,
        timestamp: new Date(),
        latency: `${latency}ms`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error invoking gemini-chat Edge Function:', err);
      setError(
        err.message ||
          'Failed to connect to the Gemini Edge Function. Please check your Supabase secrets configuration.'
      );
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

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Gemini AI Assistant
              </h2>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                Edge Function: gemini-chat
              </span>
            </div>
            <p className="text-xs text-slate-400">Model: Gemini 3.5 Flash via REST v1beta</p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: `init-${Date.now()}`,
                role: 'assistant',
                text: 'Conversation reset. How can I help you today?',
                timestamp: new Date(),
              },
            ])
          }
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer shadow-sm group"
          title="Clear Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800/90 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900/70 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-300 flex items-center gap-3 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-slate-400 font-medium">
                Gemini is synthesizing response...
              </span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs shadow-inner">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-200">Execution Error</p>
                <p className="mt-1 leading-relaxed text-slate-300">{error}</p>
                <button
                  onClick={() => handleSendMessage()}
                  className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2.5 border-t border-white/5 bg-slate-950/40">
          <p className="text-[11px] text-slate-400 mb-2 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Suggested prompts:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(s.text)}
                  className="flex items-center gap-2 text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/30 text-xs text-slate-300 hover:text-white transition duration-150 cursor-pointer shadow-sm group"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="truncate">{s.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-slate-950/60 border-t border-white/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-2xl p-1.5 pl-3.5 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gemini about Supabase, RLS, Edge Functions..."
            disabled={loading}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-indigo-600/20 group"
            title="Send Message (Enter)"
          >
            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
