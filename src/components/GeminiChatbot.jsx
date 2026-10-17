import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Sparkles,
  ArrowUp,
  Bot,
  User,
  Copy,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Lightbulb,
  FileText,
  Code,
  Paperclip,
  SlidersHorizontal,
  LayoutGrid,
  Mic,
  MicOff,
  X,
  Presentation,
} from 'lucide-react';

// Top action pills above the prompt box (exactly as in Figma screenshot)
const TOP_PILLS = [
  {
    label: 'Create Image',
    icon: ImageIcon,
    prompt: 'Create a vivid, high-resolution generative image prompt describing a futuristic glowing violet cyberpunk city.',
  },
  {
    label: 'Brainstorm',
    icon: Lightbulb,
    prompt: 'Brainstorm 5 innovative, cutting-edge AI features for a modern developer workspace.',
  },
  {
    label: 'Make a plan',
    icon: FileText,
    prompt: 'Create a comprehensive, step-by-step project execution plan for building a real-time full-stack application.',
  },
];

// Bottom 3 feature cards (exactly as in Figma screenshot)
const FEATURE_CARDS = [
  {
    title: 'Image Generator',
    desc: 'Create high-quality images instantly from text.',
    badge: 'Create Image',
    icon: ImageIcon,
    prompt: 'Generate an artistic description and Midjourney/Gemini prompt for a hyper-realistic violet crystal artifact floating in space.',
  },
  {
    title: 'AI Presentation',
    desc: 'Turn ideas into engaging, professional presentations.',
    badge: 'Make Slides',
    icon: Presentation,
    prompt: 'Outline a 5-slide executive presentation explaining the advantages of serverless edge functions and RLS database architecture.',
  },
  {
    title: 'Dev Assistant',
    desc: 'Generate clean, production ready code in seconds.',
    badge: 'Generate Code',
    icon: Code,
    prompt: 'Write clean, production-ready TypeScript code implementing a debounced auto-saving hook with error boundary support.',
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
                    className="flex items-center gap-1 hover:text-white transition py-0.5 px-2 rounded hover:bg-purple-900/30 cursor-pointer"
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

export default function GeminiChatbot({ activeConversation, onSaveMessages }) {
  const messages = activeConversation?.messages || [];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Attachment state
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Quick settings state
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [creativity, setCreativity] = useState('Balanced');

  // Quick options presets
  const [showQuickOptions, setShowQuickOptions] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = [...messages, userMsg];
    onSaveMessages(activeConversation.id, currentMessages, textToSend);
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
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`,
      };

      const finalMessages = [...currentMessages, assistantMsg];
      onSaveMessages(activeConversation.id, finalMessages, textToSend);
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Hidden file input for Attach button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.js,.jsx,.ts,.tsx,.json,.py,.md,.html,.css,.csv,.sql"
      />

      {/* Main Messages or Initial Hero Area */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col p-4 sm:p-6 lg:p-8">
        {isInitialState ? (
          /* INITIAL VIEW: Floating 3D Orb + Headline + Pills + Main Prompt Box + 3 Feature Cards */
          <div className="flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto w-full py-4">
            {/* Floating 3D Glowing Orb */}
            <div className="zyricon-orb mb-6" />

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight text-center mb-6">
              Ready to Create Something New?
            </h2>

            {/* 3 Quick Action Pills (Text on left, icon on right - matching Figma) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
              {TOP_PILLS.map((pill, idx) => {
                const Icon = pill.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(pill.prompt)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#130b21] hover:bg-[#1f1334] border border-[#27173e] text-xs font-medium text-[#d1c8e4] hover:text-white transition duration-150 cursor-pointer shadow-sm"
                  >
                    <span>{pill.label}</span>
                    <Icon className="w-3.5 h-3.5 text-purple-300" />
                  </button>
                );
              })}
            </div>

            {/* Main Prompt Box Container */}
            <div className="w-full mb-8 relative">
              <div className="rounded-2xl bg-[#0d0718] border border-[#522588]/50 hover:border-[#7c3aed]/60 focus-within:border-[#9333ea] focus-within:shadow-[0_0_25px_rgba(147,51,234,0.22)] p-4 sm:p-5 transition-all duration-200">
                {/* Top Input Area with Sparkle */}
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 text-lg leading-none mt-1 select-none">✦</span>
                  <div className="flex-1 min-w-0">
                    <textarea
                      rows={2}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Anything..."
                      disabled={loading}
                      className="w-full bg-transparent text-sm text-slate-100 placeholder-[#63557a] focus:outline-none resize-none leading-relaxed"
                    />

                    {/* Attached file chip */}
                    {attachedFile && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200">
                        <Paperclip className="w-3 h-3 text-purple-400" />
                        <span className="font-mono text-[11px] truncate max-w-[200px]">
                          {attachedFile.name}
                        </span>
                        <span className="text-[10px] text-purple-400">({attachedFile.size})</span>
                        <button
                          onClick={() => setAttachedFile(null)}
                          className="hover:text-red-400 transition cursor-pointer ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-500/10 text-xs">
                  {/* Left Action Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#857b98] hover:text-white hover:bg-white/5 transition cursor-pointer"
                      title="Attach file (.txt, .py, .js, .json, .md)"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Attach</span>
                    </button>

                    <button
                      onClick={() => setShowQuickSettings(!showQuickSettings)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition cursor-pointer ${
                        showQuickSettings
                          ? 'text-purple-300 bg-purple-950/50'
                          : 'text-[#857b98] hover:text-white hover:bg-white/5'
                      }`}
                      title="Quick Settings"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Settings</span>
                    </button>

                    <button
                      onClick={() => setShowQuickOptions(!showQuickOptions)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition cursor-pointer ${
                        showQuickOptions
                          ? 'text-purple-300 bg-purple-950/50'
                          : 'text-[#857b98] hover:text-white hover:bg-white/5'
                      }`}
                      title="Quick Templates"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Options</span>
                    </button>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Voice Recording Button */}
                    <button
                      onClick={handleToggleVoice}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                          : 'text-[#857b98] hover:text-white hover:bg-white/5'
                      }`}
                      title={isRecording ? 'Listening... Click to stop' : 'Voice Input (Click to speak)'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={(!input.trim() && !attachedFile) || loading}
                      className="w-8 h-8 rounded-full bg-[#8234e6] hover:bg-[#9344f6] text-white flex items-center justify-center transition shadow-lg shadow-purple-600/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                      title="Send prompt"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Settings Drawer */}
              {showQuickSettings && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#120921] border border-purple-500/30 rounded-xl p-3 shadow-xl z-20 text-xs">
                  <p className="font-semibold text-white mb-2">Creativity Mode</p>
                  <div className="flex items-center gap-1.5">
                    {['Precise', 'Balanced', 'Creative'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setCreativity(mode);
                          setShowQuickSettings(false);
                        }}
                        className={`flex-1 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          creativity === mode
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-slate-300 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Options Drawer */}
              {showQuickOptions && (
                <div className="absolute top-full left-0 sm:left-24 mt-2 w-80 bg-[#120921] border border-purple-500/30 rounded-xl p-3 shadow-xl z-20 text-xs space-y-2">
                  <p className="font-semibold text-white mb-1">Quick Prompts</p>
                  {[
                    'Explain this concept in simple terms with an example.',
                    'Write a clean, production-ready solution with error handling.',
                    'Audit this architecture for potential vulnerabilities.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(preset);
                        setShowQuickOptions(false);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom 3 Feature Cards (matching Figma screenshot) */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {FEATURE_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-4 rounded-2xl bg-[#0e071a] border border-[#201435] hover:border-[#8234e6]/50 hover:bg-[#140b24] transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      {/* Top Row: Icon on left, Pill button on right */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="w-7 h-7 rounded-lg bg-[#190e2b] border border-purple-500/10 flex items-center justify-center text-[#cfc5e2]">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-medium text-[#b6a7d4] bg-[#1d1231] px-2.5 py-1 rounded-full group-hover:bg-[#2b1a47] transition">
                          {card.badge}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-white group-hover:text-purple-300 transition">
                        {card.title}
                      </h4>

                      {/* Description */}
                      <p className="text-[11px] text-[#7a6f90] mt-1 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION VIEW */
          <div className="max-w-3xl mx-auto w-full space-y-5 py-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 group ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold shadow-sm ${
                      isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#180e2a] text-purple-300 border border-purple-500/20'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 relative ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                        : 'bg-[#120920]/90 border border-purple-500/20 text-slate-100 rounded-tl-none shadow-lg'
                    }`}
                  >
                    <FormattedMessage content={msg.text} />

                    <div
                      className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                        isUser
                          ? 'border-purple-400/30 text-purple-200'
                          : 'border-purple-500/10 text-[#857b98]'
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
                            className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white cursor-pointer"
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
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#180e2a] text-purple-300 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#120920]/90 border border-purple-500/20 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-300 flex items-center gap-2.5">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Generating response...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Execution Error</p>
                  <p className="mt-0.5 leading-relaxed text-slate-300">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Pinned Bottom Input Bar (When in active conversation) */}
      {!isInitialState && (
        <div className="p-4 bg-[#09050f]/90 border-t border-[#191124] backdrop-blur-md">
          <div className="max-w-3xl mx-auto w-full">
            <div className="rounded-2xl bg-[#0d0718] border border-[#522588]/50 hover:border-[#7c3aed]/60 focus-within:border-[#9333ea] focus-within:shadow-[0_0_20px_rgba(147,51,234,0.2)] p-3 transition flex items-center gap-2.5">
              <span className="text-purple-400 text-base leading-none select-none pl-1">✦</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini anything..."
                disabled={loading}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-[#63557a] focus:outline-none disabled:opacity-50"
              />

              {/* Voice button */}
              <button
                onClick={handleToggleVoice}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isRecording ? 'text-red-400 animate-pulse' : 'text-[#857b98] hover:text-white'
                }`}
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full text-[#857b98] hover:text-white transition cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Send button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-full bg-[#8234e6] hover:bg-[#9344f6] text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
