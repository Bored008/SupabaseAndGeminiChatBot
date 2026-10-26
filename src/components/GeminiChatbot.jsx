import React, { useState, useRef, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import {
  SparkleIcon,
  MessageCircleIcon,
  CrownIcon,
  LinkIcon,
  SlidersIcon,
  OptionsIcon,
  MicIcon,
  ArrowUpIcon,
  DatabaseIcon,
  ShieldIcon,
  ServerIcon,
  CodeIcon,
} from './ZyriconIcons';
import {
  Copy,
  Check,
  Paperclip,
  X,
  Square,
  MicOff,
  AlertCircle,
  User,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import orbImg from '../assets/zyricon-orb.png';

// Real prompt suggestions showcasing project capabilities
const PROMPT_SUGGESTIONS = [
  {
    label: 'Audit Postgres RLS',
    prompt: 'Analyze the Row Level Security (RLS) policies on public.login_logs. How do they isolate authenticated sessions?',
  },
  {
    label: 'Inspect Edge Function',
    prompt: 'Explain how the Supabase Deno Edge Function securely proxies requests to Google Gemini with CORS and SSE streaming.',
  },
  {
    label: 'Session Duplicate Guard',
    prompt: 'Explain how the React client-side duplicate login guard prevents race conditions when Google OAuth completes.',
  },
];

// Real creation cards mapped to the core assessment engineering layers
const CREATION_CARDS = [
  {
    title: 'Database & Security',
    badge: 'Postgres RLS',
    desc: 'Inspect Row Level Security policies, RPC functions, and table constraints.',
    icon: DatabaseIcon,
    prompt: 'Explain the Row Level Security policies on public.login_logs, why security invoker was chosen for get_recent_logins(), and how PostgreSQL enforces tenant isolation.',
  },
  {
    title: 'Edge Function Proxy',
    badge: 'Deno & CORS',
    desc: 'Review serverless Gemini proxy handlers, streaming SSE protocols, and API token security.',
    icon: ServerIcon,
    prompt: 'Review the Supabase Deno Edge Function implementation. How does it handle OPTIONS preflight CORS requests and stream Server-Sent Events (SSE)?',
  },
  {
    title: 'Session & Audit Guard',
    badge: 'Auth & Audit',
    desc: 'Verify Google OAuth session logging, duplicate prevention, and RPC data fetching.',
    icon: CodeIcon,
    prompt: 'Explain how the React client-side duplicate login guard prevents race conditions when Google OAuth completes or tokens refresh in React 18 StrictMode.',
  },
];

function FormattedMessage({ content }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  if (content.includes('```')) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const raw = part.slice(3, -3);
            const firstBreak = raw.indexOf('\n');
            const lang = firstBreak !== -1 ? raw.slice(0, firstBreak).trim() : '';
            const code = firstBreak !== -1 ? raw.slice(firstBreak + 1) : raw;

            return (
              <div
                key={index}
                className="my-2.5 rounded-2xl bg-[#020202] border border-[#38343D] overflow-hidden shadow-inner text-xs font-mono"
              >
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#100C13] border-b border-[#38343D] text-[#99979D]">
                  <span className="text-purple-300 font-semibold">{lang || 'code'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopiedCodeIndex(index);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="flex items-center gap-1.5 hover:text-white transition py-0.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    {copiedCodeIndex === index ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-[#F4F2F5] leading-relaxed">
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

  return <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{content}</div>;
}

export default function GeminiChatbot({ activeConversation, onSaveMessages }) {
  const messages = activeConversation?.messages || [];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Abort controller ref to cancel stream
  const abortControllerRef = useRef(null);

  // Attachment state
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Quick settings and options drawers
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [creativity, setCreativity] = useState('Balanced');
  const [showQuickOptions, setShowQuickOptions] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamingText]);

  // Listen for seed prompt events from sidebar presets
  useEffect(() => {
    const handleSeed = (e) => {
      if (e.detail?.prompt) {
        handleSendMessage(e.detail.prompt);
      }
    };
    window.addEventListener('zyricon:seed_prompt', handleSeed);
    return () => window.removeEventListener('zyricon:seed_prompt', handleSeed);
  }, [activeConversation]);

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  // Voice recognition setup using Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsRecording(false);
    }
  };

  // File attachment handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit for prompt context.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: event.target?.result || '',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSendMessage = async (promptText) => {
    let textToSend = (promptText || input).trim();
    if (!textToSend && !attachedFile) return;
    if (loading) return;

    if (attachedFile) {
      textToSend = `[Attached Context: ${attachedFile.name}]\n${attachedFile.content}\n\n[Query]:\n${textToSend || 'Please review and analyze this attached file.'}`;
    }

    setError(null);
    setInput('');
    setAttachedFile(null);
    setShowQuickSettings(false);
    setShowQuickOptions(false);
    setStreamingText('');

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = [...messages, userMsg];
    onSaveMessages(activeConversation.id, currentMessages, textToSend);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const startTime = Date.now();
    let accumulatedText = '';

    try {
      const endpoint = `${supabaseUrl}/functions/v1/gemini-chat`;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ prompt: textToSend, stream: true }),
          });

          if (
            response.ok &&
            response.body &&
            response.headers.get('content-type')?.includes('text/event-stream')
          ) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let sseBuffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              sseBuffer += decoder.decode(value, { stream: true });
              const lines = sseBuffer.split('\n');
              sseBuffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  const dataStr = trimmed.slice(6);
                  try {
                    const event = JSON.parse(dataStr);
                    if (event.type === 'TEXT_MESSAGE_DELTA' && event.delta) {
                      accumulatedText += event.delta;
                      setStreamingText(accumulatedText);
                    } else if (event.type === 'RUN_ERROR') {
                      throw new Error(event.error || 'Streaming error');
                    }
                  } catch (_) {}
                }
              }
            }
          }
        } catch (streamErr) {
          if (controller.signal.aborted) {
            console.log('Stream stopped by user.');
          } else {
            console.warn('AG-UI streaming fallback to unary:', streamErr);
          }
        }
      }

      // Fallback: If streaming wasn't available or empty, fallback to standard unary invoke
      if (!accumulatedText.trim() && !controller.signal.aborted) {
        const { data, error: functionError } = await supabase.functions.invoke('gemini-chat', {
          body: { prompt: textToSend, stream: false },
        });

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

        accumulatedText = data?.reply || 'No response candidate returned by Gemini.';
      }

      const latency = Date.now() - startTime;
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: accumulatedText || 'Generation stopped.',
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`,
      };

      const finalMessages = [...currentMessages, assistantMsg];
      onSaveMessages(activeConversation.id, finalMessages, textToSend);
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('Error invoking gemini-chat:', err);
        setError(err.message || 'Failed to reach Gemini Edge Function.');
      }
    } finally {
      setLoading(false);
      setStreamingText('');
      abortControllerRef.current = null;
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
    <div className="flex flex-col h-full overflow-hidden relative select-none">
      {/* Hidden file input for Attach button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.js,.jsx,.ts,.tsx,.json,.py,.md,.html,.css,.csv,.sql"
      />

      {/* Main Workspace Scroll Body */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col custom-scrollbar">
        {isInitialState ? (
          /* INITIAL VIEW: Luminous AI Orb + Centered Welcome Heading + Prompt Suggestions + Composer + Creation Cards */
          <div className="flex-1 flex flex-col justify-start sm:justify-between items-center w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 min-h-0">
            {/* Upper Welcome Region */}
            <div className="w-full flex flex-col items-center justify-center pt-2 sm:pt-4 pb-2 sm:pb-3">
              {/* Luminous AI Orb */}
              <div className="relative mb-3 flex items-center justify-center">
                <img
                  src={orbImg}
                  alt="Zyricon AI Orb"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover zyricon-orb-glow transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Welcome Heading */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-normal text-[#F4F2F5] leading-tight tracking-tight text-center max-w-2xl px-4">
                Ready to Create Something New?
              </h1>
              <p className="text-xs text-[#99979D] text-center mt-1">
                Full-Stack AI Workspace powered by Google Gemini 2.5 Flash & Supabase
              </p>
            </div>

            {/* Lower Prompt-and-Tools Region */}
            <div className="w-full flex flex-col gap-3 sm:gap-3.5 pb-2">
              {/* Prompt Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-[#020202] hover:bg-[#1b1522] border border-[#38343D] text-xs sm:text-[13px] font-normal text-[#F4F2F5] flex items-center justify-center gap-2 transition cursor-pointer shadow-sm group"
                  >
                    <span>{item.label}</span>
                    <MessageCircleIcon className="w-3.5 h-3.5 text-[#99979D] group-hover:text-purple-300 transition" />
                  </button>
                ))}
              </div>

              {/* Prompt Composer */}
              <div className="relative w-full">
                <div className="zyricon-composer-box rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between min-h-[145px] sm:h-[175px] transition-all">
                  {/* Top: Sparkle Icon + Textarea with real context placeholder */}
                  <div className="flex items-start gap-3">
                    <SparkleIcon className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="#A855F7" />
                    <div className="flex-1 min-w-0">
                      <textarea
                        rows={2}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Gemini about Supabase, RLS policies, Edge functions, or full-stack code..."
                        disabled={loading}
                        className="w-full bg-transparent text-xs sm:text-sm md:text-base font-normal text-[#F4F2F5] placeholder-[#A39BA8] focus:outline-none resize-none leading-relaxed tracking-normal"
                      />

                      {/* Attached File Chip */}
                      {attachedFile && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200">
                          <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-mono text-xs truncate max-w-[180px]">
                            {attachedFile.name}
                          </span>
                          <span className="text-[10px] text-purple-400">({attachedFile.size})</span>
                          <button
                            onClick={() => setAttachedFile(null)}
                            className="hover:text-red-400 transition cursor-pointer ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Composer Toolbar */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3 pt-2.5 border-t border-white/[0.04]">
                    {/* Left: Input Actions (Attach, divider, Settings, divider, Options) */}
                    <div className="flex items-center gap-1.5 sm:gap-3.5">
                      {/* Attach Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 sm:gap-1.5 text-xs font-normal text-[#DDD6E2] hover:text-white transition cursor-pointer"
                        title="Attach Context File"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-[#DDD6E2]" />
                        <span className="hidden xs:inline sm:inline">Attach</span>
                      </button>

                      {/* Action Divider */}
                      <div className="h-3.5 sm:h-4 w-[1px] bg-[#524755]" />

                      {/* Settings Button */}
                      <button
                        onClick={() => setShowQuickSettings(!showQuickSettings)}
                        className={`flex items-center gap-1 sm:gap-1.5 text-xs font-normal transition cursor-pointer ${
                          showQuickSettings ? 'text-purple-300' : 'text-[#DDD6E2] hover:text-white'
                        }`}
                        title="Quick Settings"
                      >
                        <SlidersIcon className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline sm:inline">Settings</span>
                      </button>

                      {/* Action Divider */}
                      <div className="h-3.5 sm:h-4 w-[1px] bg-[#524755]" />

                      {/* Options Button */}
                      <button
                        onClick={() => setShowQuickOptions(!showQuickOptions)}
                        className={`flex items-center gap-1 sm:gap-1.5 text-xs font-normal transition cursor-pointer ${
                          showQuickOptions ? 'text-purple-300' : 'text-[#DDD6E2] hover:text-white'
                        }`}
                        title="Quick Prompt Presets"
                      >
                        <OptionsIcon className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline sm:inline">Options</span>
                      </button>
                    </div>

                    {/* Right: Send Controls */}
                    <div className="flex items-center gap-2">
                      {/* Voice Input Button */}
                      <button
                        onClick={handleToggleVoice}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-sm ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40'
                            : 'bg-[#2D2A32] hover:bg-[#39353f] text-[#F4F2F5]'
                        }`}
                        title={isRecording ? 'Listening... Click to stop' : 'Voice Input (Click to speak)'}
                      >
                        {isRecording ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <MicIcon className="w-4 h-4" />
                        )}
                      </button>

                      {/* Send / Stop Button */}
                      {loading ? (
                        <button
                          onClick={handleStopGenerating}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shadow-md shadow-red-600/30 cursor-pointer flex-shrink-0"
                          title="Stop generating"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={(!input.trim() && !attachedFile) || loading}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full zyricon-send-btn hover:brightness-110 text-white flex items-center justify-center transition shadow-md shadow-purple-900/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                          title="Send prompt to Gemini"
                        >
                          <ArrowUpIcon className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Settings Drawer */}
                {showQuickSettings && (
                  <div className="absolute bottom-full left-0 mb-2.5 w-64 max-w-[calc(100vw-2.5rem)] bg-[#020202] border border-[#514452] rounded-[20px] p-3.5 shadow-2xl z-40 text-xs">
                    <p className="font-medium text-[#F4F2F5] mb-2">AI Creativity Mode</p>
                    <div className="flex items-center gap-1.5">
                      {['Precise', 'Balanced', 'Creative'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setCreativity(mode);
                            setShowQuickSettings(false);
                          }}
                          className={`flex-1 py-1 rounded-lg text-xs font-normal transition cursor-pointer ${
                            creativity === mode
                              ? 'bg-[#2A272E] text-white border border-purple-500/40'
                              : 'bg-white/5 text-[#99979D] hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Options Drawer with real architectural presets */}
                {showQuickOptions && (
                  <div className="absolute bottom-full left-0 sm:left-24 mb-2.5 w-80 max-w-[calc(100vw-2.5rem)] bg-[#020202] border border-[#514452] rounded-[20px] p-3.5 shadow-2xl z-40 text-xs space-y-1.5">
                    <p className="font-medium text-[#F4F2F5] mb-1">Architecture Presets</p>
                    {[
                      'How does get_recent_logins() RPC function protect against SQL injection and bypass table SELECT permissions?',
                      'Explain how the AG-UI SSE protocol streams token deltas from Gemini to the React frontend.',
                      'Write a production-ready Supabase database migration adding an encrypted user preferences table.',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(preset);
                          setShowQuickOptions(false);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#DDD6E2] hover:text-white transition cursor-pointer text-xs"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Creation Tools Row (Real assessment engineering modules) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 w-full">
                {CREATION_CARDS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSendMessage(card.prompt)}
                      className="rounded-[20px] sm:rounded-[22px] bg-[#020202] hover:bg-[#140e1b] border border-[#38343D] hover:border-purple-500/40 transition-all duration-200 cursor-pointer p-3.5 sm:p-4 flex flex-col justify-between h-[130px] sm:h-[145px] group shadow-sm"
                    >
                      {/* Top Row: Tool Emblem + Action Badge */}
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#28272C] flex items-center justify-center flex-shrink-0 group-hover:bg-[#342f3b] transition text-purple-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="h-6 sm:h-6.5 px-2.5 rounded-full bg-[#29292D] group-hover:bg-[#36323d] flex items-center justify-center transition">
                          <span className="text-[11px] font-normal text-purple-300">
                            {card.badge}
                          </span>
                        </div>
                      </div>

                      {/* Tool Details */}
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xs sm:text-sm font-medium text-[#F4F2F5] group-hover:text-purple-300 transition">
                          {card.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs font-normal text-[#99979D] leading-snug line-clamp-2">
                          {card.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION VIEW */
          <div className="max-w-4xl w-full mx-auto px-2.5 sm:px-6 py-3 sm:py-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 sm:gap-2.5 group ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2A272E] border border-white/5 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5 shadow-sm">
                        <SparkleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" fill="#A855F7" />
                      </div>
                    )}

                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-[20px] p-3 sm:p-4 relative shadow-md transition-all ${
                        isUser
                          ? 'bg-[#2A272E] text-[#F4F2F5] border border-white/10'
                          : 'bg-[#020202] text-[#F4F2F5] border border-[#38343D]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-xs font-medium text-purple-300">
                          {isUser ? 'You' : 'Gemini AI Assistant'}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.latency && (
                            <span className="text-[10px] text-[#99979D] font-mono">
                              {msg.latency}
                            </span>
                          )}
                          <button
                            onClick={() => copyMessage(msg.text, msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#99979D] hover:text-white transition cursor-pointer"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <FormattedMessage content={msg.text} />
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-200 flex-shrink-0 mt-0.5 shadow-sm">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming Assistant Response */}
              {loading && streamingText && (
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2A272E] border border-white/5 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5 animate-pulse">
                    <SparkleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" fill="#A855F7" />
                  </div>
                  <div className="max-w-[90%] sm:max-w-[85%] rounded-[20px] p-3 sm:p-4 bg-[#020202] text-[#F4F2F5] border border-[#38343D] shadow-md">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-medium text-cyan-300">
                      <span>Gemini 2.5 Flash is streaming...</span>
                    </div>
                    <FormattedMessage content={streamingText} />
                  </div>
                </div>
              )}

              {/* Loading Pulse */}
              {loading && !streamingText && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2A272E] border border-white/5 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5 animate-spin">
                    <SparkleIcon className="w-4 h-4 text-purple-400" fill="#A855F7" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#020202] border border-[#38343D] text-xs text-[#99979D] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Invoking Supabase Edge Function (gemini-chat)...
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Inference Error</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer in Active View */}
            <div className="pt-2 sticky bottom-0 z-30">
              <div className="zyricon-composer-box rounded-[22px] p-3 sm:p-4 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-start gap-2.5">
                  <SparkleIcon className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" fill="#A855F7" />
                  <textarea
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Gemini about Supabase, RLS policies, Edge functions, or full-stack code..."
                    disabled={loading}
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#F4F2F5] placeholder-[#A39BA8] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 sm:gap-2.5 text-xs text-[#DDD6E2]">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline sm:inline">Attach</span>
                    </button>
                    <div className="h-3.5 w-[1px] bg-[#524755]" />
                    <button
                      onClick={() => setShowQuickSettings(!showQuickSettings)}
                      className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                    >
                      <SlidersIcon className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline sm:inline">Settings</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleVoice}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2D2A32] text-[#F4F2F5]'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <MicIcon className="w-3.5 h-3.5" />}
                    </button>

                    {loading ? (
                      <button
                        onClick={handleStopGenerating}
                        className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <Square className="w-3 h-3 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={(!input.trim() && !attachedFile) || loading}
                        className="w-8 h-8 rounded-full zyricon-send-btn text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
