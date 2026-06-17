'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Bot,
  User,
  MessageSquare,
  LayoutDashboard,
  Shield,
  Crown,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Clock,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { Customer, ConversationMessage, AgentDecision, ReasoningStep } from '@/lib/agent/types';

/* ------------------------------------------------------------------ */
/*  Types for chat state                                               */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  decision?: AgentDecision;
  reasoningSteps?: ReasoningStep[];
  responseTime?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'vip':
      return 'vip' as const;
    case 'flagged':
      return 'danger' as const;
    case 'new':
      return 'warning' as const;
    case 'suspended':
      return 'destructive' as const;
    case 'active':
    default:
      return 'success' as const;
  }
}

function decisionBadge(status: string) {
  switch (status) {
    case 'approved':
      return { variant: 'success' as const, icon: CheckCircle2, label: 'Approved' };
    case 'denied':
      return { variant: 'danger' as const, icon: XCircle, label: 'Denied' };
    case 'escalated':
      return { variant: 'warning' as const, icon: ArrowUpRight, label: 'Escalated' };
    case 'partial':
      return { variant: 'warning' as const, icon: CreditCard, label: 'Partial Refund' };
    case 'store_credit':
      return { variant: 'vip' as const, icon: CreditCard, label: 'Store Credit' };
    default:
      return { variant: 'secondary' as const, icon: Clock, label: status };
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function ChatPage() {
  /* ---- state ---- */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- fetch customers ---- */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        setCustomers(data.customers ?? []);
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  // Clear backend logs on page refresh for pristine demo sessions
  useEffect(() => {
    fetch('/api/reset', { method: 'POST' }).catch(() => {});
  }, []);

  /* ---- auto-scroll ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ---- select customer ---- */
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      if (selectedCustomer?.id === customer.id) return;
      setSelectedCustomer(customer);
      setMessages([]);
      setConversationId(null);
      setInputValue('');
      // Add welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'agent',
          content: `Hello! I'm the ShopSmart AI Support agent. I can see you're contacting us as **${customer.name}**. How can I help you today? I can assist with refund requests, order inquiries, account questions, and more.`,
          timestamp: new Date(),
        },
      ]);
    },
    [selectedCustomer]
  );

  /* ---- send message ---- */
  const handleSend = useCallback(async (customText?: string | React.MouseEvent | React.KeyboardEvent, autoVoice: boolean = false) => {
    const textStr = typeof customText === 'string' ? customText : inputValue;
    const text = textStr.trim();
    if (!text || isLoading || !selectedCustomer) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId ?? undefined,
          customerId: selectedCustomer.id,
        }),
      });
      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);

      const agentMsgId = `agent-${Date.now()}`;
      const agentContent = data.message ?? 'I apologize, but I encountered an issue processing your request.';

      const agentMsg: ChatMessage = {
        id: agentMsgId,
        role: 'agent',
        content: agentContent,
        timestamp: new Date(),
        decision: data.decision,
        reasoningSteps: data.reasoningSteps,
        responseTime: data.responseTime,
      };
      setMessages((prev) => [...prev, agentMsg]);
      
      // Auto TTS if voice mode
      if (autoVoice) {
         window.dispatchEvent(new CustomEvent('play-tts', { detail: { id: agentMsgId, text: agentContent } }));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'agent',
          content: 'Sorry, I encountered a network error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, selectedCustomer, conversationId]);

  /* ---- voice recording ---- */
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // stop
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // VAD Setup
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.minDecibels = -60;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = Date.now();
      let vadInterval: NodeJS.Timeout;
      let hasSpoken = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        clearInterval(vadInterval);
        audioContext.close().catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const formData = new FormData();
          formData.append('audio', blob);
          const res = await fetch('/api/stt', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.transcript && data.transcript.trim().length > 0) {
            setInputValue(data.transcript);
            handleSend(data.transcript, true);
          }
        } catch {
          /* ignore */
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      // VAD Loop
      vadInterval = setInterval(() => {
        if (recorder.state !== 'recording') return;
        analyser.getByteFrequencyData(dataArray);
        const max = Math.max(...dataArray);
        if (max > 10) { 
          hasSpoken = true;
          silenceStart = Date.now();
        } else {
          if (hasSpoken && Date.now() - silenceStart > 2000) { 
             recorder.stop();
          } else if (!hasSpoken && Date.now() - silenceStart > 10000) {
             recorder.stop(); // Stop if no speech for 10 seconds
          }
        }
      }, 100);

    } catch {
      /* mic not available */
    }
  }, [isRecording, handleSend]);

  /* ---- text to speech ---- */
  const handleTTS = useCallback(
    async (messageId: string, text: string) => {
      if (playingMessageId === messageId) return;
      setPlayingMessageId(messageId);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          setPlayingMessageId(null);
          URL.revokeObjectURL(url);
        };
        await audio.play();
      } catch {
        setPlayingMessageId(null);
      }
    },
    [playingMessageId]
  );

  useEffect(() => {
    const listener = ((e: CustomEvent) => {
       handleTTS(e.detail.id, e.detail.text);
    }) as EventListener;
    window.addEventListener('play-tts', listener);
    return () => window.removeEventListener('play-tts', listener);
  }, [handleTTS]);

  /* ---- keyboard ---- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ---- fraud score color ---- */
  function fraudColor(score: number) {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-emerald-400';
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* ───────── HEADER ───────── */}
      <header className="glass-panel border-b border-border/50 px-6 py-3 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">ShopSmart AI Support</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Intelligent Customer Service</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-2 text-primary" asChild>
            <Link href="/">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>
        </nav>
      </header>

      {/* ───────── BODY ───────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } transition-all duration-300 border-r border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden`}
        >
          <div className="p-4 border-b border-border/30">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" />
              Customers
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-1">{customers.length} available</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {customers.map((c) => (
                <motion.button
                  key={c.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectCustomer(c)}
                  className={`w-full text-left rounded-xl p-3 transition-all duration-200 group ${
                    selectedCustomer?.id === c.id
                      ? 'bg-primary/15 border border-primary/30 shadow-lg shadow-primary/5'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback
                        className={`text-xs font-bold ${
                          selectedCustomer?.id === c.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        {initials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        {c.isVIP && <Crown className="h-3 w-3 text-purple-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={statusBadgeVariant(c.status)} className="text-[10px] px-1.5 py-0">
                          {c.status}
                        </Badge>
                        <span className={`text-[10px] font-mono ${fraudColor(c.fraudScore)}`}>
                          <Shield className="h-2.5 w-2.5 inline mr-0.5" />
                          {c.fraudScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* ── MAIN CHAT ── */}
        <main className="flex-1 flex flex-col min-w-0">
          {!selectedCustomer ? (
            /* ── Empty state ── */
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <MessageSquare className="h-10 w-10 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Select a Customer</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a customer from the sidebar to start a support conversation
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground/60">
                  <Sparkles className="h-3 w-3" />
                  <span>Powered by AI Agent with real-time fraud detection</span>
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              {/* ── Chat header ── */}
              <div className="glass-panel border-b border-border/30 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {initials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{selectedCustomer.name}</span>
                      <Badge variant={statusBadgeVariant(selectedCustomer.status)} className="text-[10px]">
                        {selectedCustomer.status}
                      </Badge>
                      {selectedCustomer.isVIP && (
                        <Badge variant="vip" className="text-[10px]">
                          <Crown className="h-2.5 w-2.5 mr-1" />
                          VIP
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedCustomer.email} · {selectedCustomer.totalOrders} orders · Fraud Score:{' '}
                      <span className={fraudColor(selectedCustomer.fraudScore)}>{selectedCustomer.fraudScore}</span>
                    </p>
                  </div>
                </div>
                {conversationId && (
                  <span className="text-[10px] text-muted-foreground/50 font-mono">ID: {conversationId.slice(0, 8)}</span>
                )}
              </div>

              {/* ── Messages ── */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'agent' && (
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
                        >
                          <div
                            className={
                              msg.role === 'user'
                                ? 'chat-bubble-user rounded-2xl rounded-br-md px-4 py-3 text-sm'
                                : 'chat-bubble-agent rounded-2xl rounded-bl-md px-4 py-3 text-sm'
                            }
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>

                          {/* Decision badge + TTS + time */}
                          <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.decision?.status && (() => {
                              const db = decisionBadge(msg.decision.status);
                              const Icon = db.icon;
                              return (
                                <Badge variant={db.variant} className="text-[10px] gap-1">
                                  <Icon className="h-3 w-3" />
                                  {db.label}
                                  {msg.decision.refundAmount != null && (
                                    <span className="ml-1">${msg.decision.refundAmount.toFixed(2)}</span>
                                  )}
                                </Badge>
                              );
                            })()}

                            {msg.role === 'agent' && msg.id !== 'welcome' && (
                              <button
                                onClick={() => handleTTS(msg.id, msg.content)}
                                className="text-muted-foreground/50 hover:text-primary transition-colors"
                                title="Listen"
                              >
                                <Volume2
                                  className={`h-3.5 w-3.5 ${
                                    playingMessageId === msg.id ? 'text-primary animate-pulse' : ''
                                  }`}
                                />
                              </button>
                            )}

                            <span className="text-[10px] text-muted-foreground/40">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {msg.responseTime != null && (
                              <span className="text-[10px] text-muted-foreground/30">
                                {msg.responseTime}ms
                              </span>
                            )}
                          </div>

                          {/* Reasoning steps (collapsed by default) */}
                          {msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                            <ReasoningDropdown steps={msg.reasoningSteps} />
                          )}
                        </div>

                        {msg.role === 'user' && (
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                              {selectedCustomer ? initials(selectedCustomer.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 justify-start"
                    >
                      <Avatar className="h-8 w-8 shrink-0 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="chat-bubble-agent rounded-2xl rounded-bl-md px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            className="h-2 w-2 rounded-full bg-purple-400"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                            className="h-2 w-2 rounded-full bg-purple-400"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                            className="h-2 w-2 rounded-full bg-purple-400"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* ── Input bar ── */}
              <div className="border-t border-border/30 bg-card/40 backdrop-blur-xl p-4 shrink-0">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                  {/* Voice button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleRecording}
                    className={`shrink-0 rounded-xl transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 ring-2 ring-red-500/30 animate-pulse'
                        : 'hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  {/* Input */}
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        isRecording
                          ? 'Listening...'
                          : selectedCustomer
                          ? `Message as ${selectedCustomer.name}...`
                          : 'Select a customer first...'
                      }
                      disabled={!selectedCustomer || isLoading}
                      className="w-full h-11 rounded-xl border border-border/50 bg-background/60 backdrop-blur px-4 pr-12 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 disabled:opacity-50"
                    />
                    {isRecording && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading || !selectedCustomer}
                    size="icon"
                    className="shrink-0 rounded-xl h-11 w-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/20 disabled:opacity-30 disabled:shadow-none"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reasoning Dropdown                                                  */
/* ------------------------------------------------------------------ */

function ReasoningDropdown({ steps }: { steps: ReasoningStep[] }) {
  const [open, setOpen] = useState(false);

  const toolIcon = (tool: string) => {
    switch (tool) {
      case 'lookup_customer':
        return <User className="h-3 w-3" />;
      case 'validate_refund_policy':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'calculate_fraud_score':
        return <Shield className="h-3 w-3" />;
      case 'escalate_to_human':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-1"
      >
        <Sparkles className="h-3 w-3" />
        {open ? 'Hide' : 'Show'} reasoning ({steps.length} steps)
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {steps.map((step, i) => (
                <div key={i} className="reasoning-step rounded-lg px-3 py-2 text-[11px] border border-border/30 bg-card/40">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {step.tool ? toolIcon(step.tool) : <Sparkles className="h-3 w-3" />}
                    <span className="font-medium text-foreground/80">{step.tool ?? 'Thinking'}</span>
                    {step.duration && (
                      <span className="ml-auto text-muted-foreground/40">{step.duration}ms</span>
                    )}
                  </div>
                  {step.output && (
                    <p className="mt-1 text-muted-foreground/70 truncate">{String(step.output).slice(0, 120)}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
