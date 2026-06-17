'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Bot,
  MessageSquare,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Brain,
  Gavel,
  Search,
  ClipboardList,
  Phone,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Clock,
  Eye,
  CircleDot,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { DashboardStats, FraudAlert, ReasoningStep, ConversationMessage } from '@/lib/agent/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StatsResponse {
  stats: DashboardStats;
  fraudAlerts: FraudAlert[];
  recentReasoningSteps: ReasoningStep[];
  activeConversations: number;
  conversationSummaries: ConversationSummary[];
}

interface ConversationSummary {
  conversationId: string;
  customerId: string;
  customerName?: string;
  messageCount: number;
  denialCount?: number;
  status: string;
  lastActivity: string;
  messages?: ConversationMessage[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#a855f7', '#6366f1'];
const SEVERITY_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'destructive'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'destructive',
};

/* ------------------------------------------------------------------ */
/*  Tool icon helper                                                   */
/* ------------------------------------------------------------------ */

function toolIcon(tool?: string) {
  switch (tool) {
    case 'lookup_customer':
      return <Search className="h-4 w-4" />;
    case 'validate_refund_policy':
      return <ClipboardList className="h-4 w-4" />;
    case 'calculate_fraud_score':
      return <Shield className="h-4 w-4" />;
    case 'escalate_to_human':
      return <Phone className="h-4 w-4" />;
    case 'thinking':
      return <Brain className="h-4 w-4" />;
    case 'decision':
      return <Gavel className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Metric card component                                              */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  delay?: number;
}

function MetricCard({ title, value, icon, color, trend, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="metric-card glass-panel border-border/50 bg-card/60 backdrop-blur-xl hover:border-border/80 transition-all duration-300 hover:shadow-lg group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
              {trend && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </div>
              )}
            </div>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${color.replace(
                'text-',
                'bg-'
              )}/10 group-hover:scale-110 transition-transform duration-300`}
            >
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip for recharts                                        */
/* ------------------------------------------------------------------ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg border border-border/50 bg-card/90 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground">{label || payload[0]?.name}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Admin Page                                                    */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  /* ── state ── */
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [activeConversations, setActiveConversations] = useState(0);
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data: StatsResponse = await res.json();
      setStats(data.stats);
      setFraudAlerts(data.fraudAlerts ?? []);
      setReasoningSteps(data.recentReasoningSteps ?? []);
      setActiveConversations(data.activeConversations ?? 0);
      setConversationSummaries(data.conversationSummaries ?? []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  /* ── SSE ── */
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          const { event, data } = parsed;
          if (event === 'stats_update') {
            setStats(data);
          }
          if (event === 'fraud_alert' && data) {
            setFraudAlerts((prev) => [data, ...prev].slice(0, 20));
          }
          if (event === 'reasoning_step' && data?.step) {
            setReasoningSteps((prev) => [data.step, ...prev].slice(0, 30));
          }
          if (event === 'new_conversation' || event === 'new_message') {
            fetchStats(); // refresh convos list
          }
        } catch {
          /* ignore parse errors */
        }
      };
    } catch {
      /* SSE not available */
    }
    return () => es?.close();
  }, []);

  /* ── chart data ── */
  const pieData = stats
    ? [
        { name: 'Approved', value: stats.approvedRefunds ?? 0 },
        { name: 'Denied', value: stats.deniedRefunds ?? 0 },
        { name: 'Escalated', value: stats.escalatedCases ?? 0 },
        { name: 'Store Credit', value: (stats as any).storeCreditCount ?? 0 },
      ].filter((d) => d.value > 0)
    : [];

  // Bar chart: use real data or mock if insufficient
  const barData =
    conversationSummaries.length >= 3
      ? conversationSummaries.slice(0, 8).map((c, i) => ({
          name: c.customerName || `Conv ${i + 1}`,
          messages: c.messageCount,
          denials: c.denialCount ?? 0,
        }))
      : [
          { name: 'Mon', messages: 24, denials: 3 },
          { name: 'Tue', messages: 31, denials: 5 },
          { name: 'Wed', messages: 18, denials: 2 },
          { name: 'Thu', messages: 42, denials: 7 },
          { name: 'Fri', messages: 36, denials: 4 },
          { name: 'Sat', messages: 12, denials: 1 },
          { name: 'Sun', messages: 8, denials: 0 },
        ];

  // If no pie data, provide mock
  const finalPieData =
    pieData.length > 0
      ? pieData
      : [
          { name: 'Approved', value: 42 },
          { name: 'Denied', value: 15 },
          { name: 'Escalated', value: 8 },
          { name: 'Store Credit', value: 12 },
        ];

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  /* ── render ── */
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
            <p className="text-[11px] text-muted-foreground -mt-0.5">Admin Dashboard</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-primary" asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              Admin Dashboard
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </Link>
          </Button>
        </nav>
      </header>

      {/* ───────── BODY ───────── */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <MetricCard
              title="Total Conversations"
              value={stats?.totalConversations ?? 0}
              icon={<MessageSquare className="h-5 w-5 text-purple-400" />}
              color="text-purple-400"
              delay={0}
            />
            <MetricCard
              title="Approved Refunds"
              value={stats?.approvedRefunds ?? 0}
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              color="text-emerald-400"
              delay={0.05}
            />
            <MetricCard
              title="Denied Refunds"
              value={stats?.deniedRefunds ?? 0}
              icon={<XCircle className="h-5 w-5 text-red-400" />}
              color="text-red-400"
              delay={0.1}
            />
            <MetricCard
              title="Escalated Cases"
              value={stats?.escalatedCases ?? 0}
              icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
              color="text-amber-400"
              delay={0.15}
            />
            <MetricCard
              title="Avg Confidence"
              value={`${((stats?.avgConfidence ?? 0) * 100).toFixed(0)}%`}
              icon={<Brain className="h-5 w-5 text-indigo-400" />}
              color="text-indigo-400"
              delay={0.2}
            />
            <MetricCard
              title="Fraud Alerts"
              value={stats?.fraudAlerts ?? fraudAlerts.length}
              icon={<ShieldAlert className="h-5 w-5 text-red-400" />}
              color="text-red-400"
              delay={0.25}
            />
            <MetricCard
              title="Total Refund $"
              value={`$${(stats?.totalRefundAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
              color="text-emerald-400"
              delay={0.3}
            />
          </div>

          {/* ── Two‑column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ─── Live Reasoning Trace ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-panel border-border/50 bg-card/60 backdrop-blur-xl h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Live Reasoning Trace</CardTitle>
                        <CardDescription className="text-xs">Real-time agent decision steps</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-muted-foreground">Live</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[380px] pr-3">
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {reasoningSteps.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/50">
                            <Brain className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">No reasoning steps yet</p>
                            <p className="text-xs">Start a conversation to see agent thinking</p>
                          </div>
                        ) : (
                          reasoningSteps.map((step, i) => (
                            <motion.div
                              key={`step-${i}-${step.tool}-${step.timestamp ?? i}`}
                              initial={{ opacity: 0, x: -20, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="reasoning-step rounded-xl p-3 border border-border/30 bg-card/40 hover:bg-card/60 transition-all duration-200 group"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    step.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : step.status === 'running'
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-purple-500/10 text-purple-400'
                                  }`}
                                >
                                  {step.status === 'running' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    toolIcon(step.tool)
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                      {step.tool ?? 'Thinking'}
                                    </span>
                                    {step.status === 'completed' && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    )}
                                    {step.status === 'running' && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                    )}
                                  </div>
                                  {step.input && (
                                    <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                                      Input: {typeof step.input === 'string' ? step.input : JSON.stringify(step.input).slice(0, 80)}
                                    </p>
                                  )}
                                  {step.output && (
                                    <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                                      → {typeof step.output === 'string' ? step.output : JSON.stringify(step.output).slice(0, 100)}
                                    </p>
                                  )}
                                </div>
                                {step.duration != null && (
                                  <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
                                    {step.duration}ms
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Fraud Alerts ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="glass-panel border-border/50 bg-card/60 backdrop-blur-xl h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Fraud Alerts</CardTitle>
                        <CardDescription className="text-xs">Suspicious activity detection</CardDescription>
                      </div>
                    </div>
                    <Badge variant="danger" className="text-[10px]">
                      {fraudAlerts.length} alerts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[380px] pr-3">
                    <div className="space-y-3">
                      {fraudAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/50">
                          <Shield className="h-8 w-8 mb-2 opacity-30" />
                          <p className="text-sm">No fraud alerts</p>
                          <p className="text-xs">System is operating normally</p>
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {fraudAlerts.map((alert, i) => (
                            <motion.div
                              key={`fraud-${i}-${alert.customerId}`}
                              initial={{ opacity: 0, x: 20, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="fraud-alert-card rounded-xl p-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-red-400" />
                                    <span className="text-sm font-semibold text-red-300">
                                      {alert.customerName ?? alert.customerId}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground/80">{alert.reason}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground/60">
                                      Fraud Score:{' '}
                                      <span
                                        className={`font-bold ${
                                          alert.fraudScore >= 70
                                            ? 'text-red-400'
                                            : alert.fraudScore >= 40
                                            ? 'text-amber-400'
                                            : 'text-emerald-400'
                                        }`}
                                      >
                                        {alert.fraudScore}
                                      </span>
                                    </span>
                                    {alert.timestamp && (
                                      <span className="text-[10px] text-muted-foreground/40">
                                        <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                                        {new Date(alert.timestamp).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant={SEVERITY_VARIANTS[alert.severity ?? 'medium'] ?? 'warning'}
                                  className="text-[10px] shrink-0"
                                >
                                  {alert.severity ?? 'medium'}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Bottom grid: Charts + Conversations ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ─── Decision Statistics ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="glass-panel border-border/50 bg-card/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Decision Statistics</CardTitle>
                      <CardDescription className="text-xs">Refund decision distribution</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Pie chart */}
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={finalPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {finalPieData.map((_, idx) => (
                              <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value: string) => (
                              <span className="text-xs text-muted-foreground">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar chart */}
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="messages" name="Messages" fill="#a855f7" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="denials" name="Denials" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Recent Conversations ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="glass-panel border-border/50 bg-card/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Recent Conversations</CardTitle>
                        <CardDescription className="text-xs">
                          {activeConversations} active now
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CircleDot className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">{activeConversations} active</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px] pr-3">
                    <div className="space-y-2">
                      {conversationSummaries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50">
                          <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                          <p className="text-sm">No conversations yet</p>
                          <p className="text-xs">Conversations will appear here in real-time</p>
                        </div>
                      ) : (
                        conversationSummaries.map((conv, i) => (
                          <motion.div
                            key={conv.conversationId ?? i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-lg p-3 border border-border/30 bg-card/30 hover:bg-card/50 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                      {conv.customerName ?? conv.customerId}
                                    </span>
                                    <Badge
                                      variant={
                                        conv.status === 'active'
                                          ? 'success'
                                          : conv.status === 'escalated'
                                          ? 'warning'
                                          : 'secondary'
                                      }
                                      className="text-[9px] shrink-0"
                                    >
                                      {conv.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {conv.messageCount} msgs
                                    </span>
                                    {conv.denialCount != null && conv.denialCount > 0 && (
                                      <span className="text-[10px] text-red-400/60">
                                        {conv.denialCount} denied
                                      </span>
                                    )}
                                    {conv.lastActivity && (
                                      <span className="text-[10px] text-muted-foreground/40">
                                        <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                                        {new Date(conv.lastActivity).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-[10px] text-muted-foreground/30 font-mono shrink-0">
                                  {conv.conversationId?.slice(0, 6)}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary"
                                  onClick={() => setSelectedChat(conv)}
                                >
                                  View Chat
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </ScrollArea>

      {/* ── Chat Modal ── */}
      <AnimatePresence>
        {selectedChat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                <div>
                  <h3 className="font-bold">Chat Logs: {selectedChat.customerName ?? selectedChat.customerId}</h3>
                  <p className="text-xs text-muted-foreground">ID: {selectedChat.conversationId}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}>
                  <XCircle className="h-5 w-5 text-muted-foreground hover:text-red-400 transition-colors" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4 bg-background/50">
                <div className="space-y-4 pb-4">
                  {!selectedChat.messages || selectedChat.messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground mt-10">No messages found.</p>
                  ) : (
                    selectedChat.messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground self-end ml-auto rounded-br-sm'
                            : 'bg-card border border-border/50 self-start mr-auto rounded-bl-sm'
                        }`}
                      >
                        <span className="text-[10px] opacity-70 mb-1 uppercase tracking-wider font-semibold">
                          {msg.role === 'user' ? 'Customer' : 'AI Agent'}
                        </span>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
