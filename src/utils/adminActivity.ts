// Builds the admin panel's user, session and analytics views from real rows in Supabase:
// public.users, public.user_activity, public.portfolios, public.stocks (admin-readable via RLS, see
// supabase/migrations/20261116_user_activity.sql).

import { supabase } from '../lib/supabase';

export interface ActivityRow {
  user_id: string;
  email: string | null;
  session_id: string;
  event: 'session_start' | 'page' | 'search' | 'ping' | 'session_end';
  page: string | null;
  query: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SessionSummary {
  sessionId: string;
  start: string; // ISO
  end: string; // ISO (last event)
  durationSec: number;
  pages: string[]; // in order of first visit
  searches: string[];
  device: string;
}

export interface UserActivitySummary {
  isOnline: boolean;
  currentPage?: string;
  lastSeenAt?: string;
  lastActiveAgo: string;
  sessionDuration: string; // latest session
  timeOnSite: string; // all sessions in the window
  device?: string;
  pagesVisited: { page: string; count: number; lastVisited: string }[];
  searches: { query: string; timestamp: string }[];
  sessions: SessionSummary[];
}

export const ACTIVITY_WINDOW_DAYS = 7;
const ONLINE_MS = 2.5 * 60 * 1000; // pings come every 60 s while the tab is visible
const PING_GAP_CAP_S = 120; // gaps longer than this (tab hidden) don't count as time on site

export const formatDuration = (sec: number): string => {
  if (!(sec > 0)) return '0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m`;
  return `${Math.round(sec)}s`;
};

export const timeAgo = (iso: string, now = Date.now()): string => {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'Just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return formatIst(iso);
};

export const formatIst = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const deviceFromUserAgent = (ua?: string | null): string => {
  if (!ua) return 'Unknown';
  const os = /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
    : /Windows/i.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
    : /Linux/i.test(ua) ? 'Linux' : 'Other';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${os} • ${browser}`;
};

/** Active seconds in a sorted list of event times: sum of gaps, each capped (hidden-tab time is not counted). */
const activeSeconds = (times: number[]) => {
  let s = 0;
  for (let i = 1; i < times.length; i++) s += Math.min(PING_GAP_CAP_S, (times[i] - times[i - 1]) / 1000);
  return s;
};

export function summarizeUser(rows: ActivityRow[], now = Date.now()): UserActivitySummary {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const bySession = new Map<string, ActivityRow[]>();
  for (const r of sorted) {
    const list = bySession.get(r.session_id) ?? [];
    list.push(r);
    bySession.set(r.session_id, list);
  }

  const sessions: SessionSummary[] = [...bySession.entries()].map(([sessionId, list]) => {
    const times = list.map(r => new Date(r.created_at).getTime());
    const pages: string[] = [];
    for (const r of list) if (r.page && (r.event === 'page' || r.event === 'session_start') && !pages.includes(r.page)) pages.push(r.page);
    return {
      sessionId,
      start: list[0].created_at,
      end: list[list.length - 1].created_at,
      durationSec: activeSeconds(times),
      pages,
      searches: list.filter(r => r.event === 'search' && r.query).map(r => r.query as string),
      device: deviceFromUserAgent(list.find(r => r.user_agent)?.user_agent),
    };
  }).sort((a, b) => b.start.localeCompare(a.start));

  const last = sorted[sorted.length - 1];
  const lastMs = last ? new Date(last.created_at).getTime() : 0;
  const isOnline = !!last && now - lastMs < ONLINE_MS && last.event !== 'session_end';

  const pageMap = new Map<string, { count: number; last: string }>();
  for (const r of sorted) {
    if (r.event !== 'page' || !r.page) continue;
    const e = pageMap.get(r.page) ?? { count: 0, last: r.created_at };
    e.count += 1;
    e.last = r.created_at;
    pageMap.set(r.page, e);
  }

  return {
    isOnline,
    currentPage: last?.page ?? undefined,
    lastSeenAt: last?.created_at,
    lastActiveAgo: last ? (isOnline ? 'Active now' : timeAgo(last.created_at, now)) : 'No activity yet',
    sessionDuration: sessions[0] ? formatDuration(sessions[0].durationSec) : '—',
    timeOnSite: formatDuration(sessions.reduce((s, x) => s + x.durationSec, 0)),
    device: sessions[0]?.device,
    pagesVisited: [...pageMap.entries()]
      .map(([page, e]) => ({ page, count: e.count, lastVisited: timeAgo(e.last, now) }))
      .sort((a, b) => b.count - a.count),
    searches: sorted
      .filter(r => r.event === 'search' && r.query)
      .reverse()
      .map(r => ({ query: r.query as string, timestamp: timeAgo(r.created_at, now) })),
    sessions,
  };
}

const formatInr = (v: number) => {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

export interface PortfolioSummary {
  portfoliosCount: number;
  holdingsCount: number;
  portfolioCapital: string; // invested amount (quantity × average price)
  portfoliosList: { name: string; holdingsCount: number; capital: string }[];
}

export interface AdminData {
  users: any[]; // raw public.users rows
  activityByUser: Map<string, ActivityRow[]>; // keyed by lower-case email
  portfolioByUser: Map<string, PortfolioSummary>; // keyed by user id
  allActivity: ActivityRow[];
  errors: string[];
}

export async function loadAdminData(): Promise<AdminData> {
  const errors: string[] = [];
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86400 * 1000).toISOString();

  const [usersRes, actRes, pfRes, stRes] = await Promise.all([
    supabase.from('users').select('*'),
    supabase
      .from('user_activity')
      .select('user_id,email,session_id,event,page,query,user_agent,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20000),
    supabase.from('portfolios').select('id,user_id,name'),
    supabase.from('stocks').select('portfolio_id,quantity,average_price'),
  ]);
  if (usersRes.error) errors.push(`users: ${usersRes.error.message}`);
  if (actRes.error) errors.push(`activity: ${actRes.error.message}`);
  if (pfRes.error) errors.push(`portfolios: ${pfRes.error.message}`);
  if (stRes.error) errors.push(`stocks: ${stRes.error.message}`);

  const allActivity = (actRes.data ?? []) as ActivityRow[];
  const activityByUser = new Map<string, ActivityRow[]>();
  for (const r of allActivity) {
    const key = (r.email ?? '').toLowerCase();
    if (!key) continue;
    const list = activityByUser.get(key) ?? [];
    list.push(r);
    activityByUser.set(key, list);
  }

  const holdingsByPortfolio = new Map<string, { count: number; invested: number }>();
  for (const s of (stRes.data ?? []) as { portfolio_id: string; quantity: number; average_price: number }[]) {
    const e = holdingsByPortfolio.get(s.portfolio_id) ?? { count: 0, invested: 0 };
    if (Number(s.quantity) > 0) {
      e.count += 1;
      e.invested += Number(s.quantity) * Number(s.average_price || 0);
    }
    holdingsByPortfolio.set(s.portfolio_id, e);
  }
  const portfolioByUser = new Map<string, PortfolioSummary>();
  const investedByUser = new Map<string, number>();
  for (const p of (pfRes.data ?? []) as { id: string; user_id: string; name: string }[]) {
    const h = holdingsByPortfolio.get(p.id) ?? { count: 0, invested: 0 };
    const cur = portfolioByUser.get(p.user_id) ?? { portfoliosCount: 0, holdingsCount: 0, portfolioCapital: '₹0', portfoliosList: [] };
    cur.portfoliosCount += 1;
    cur.holdingsCount += h.count;
    cur.portfoliosList.push({ name: p.name, holdingsCount: h.count, capital: formatInr(h.invested) });
    investedByUser.set(p.user_id, (investedByUser.get(p.user_id) ?? 0) + h.invested);
    cur.portfolioCapital = formatInr(investedByUser.get(p.user_id) ?? 0);
    portfolioByUser.set(p.user_id, cur);
  }

  return { users: usersRes.data ?? [], activityByUser, portfolioByUser, allActivity, errors };
}

/** Platform-wide analytics from the same activity rows (last ACTIVITY_WINDOW_DAYS days). */
export function buildAnalytics(rows: ActivityRow[]) {
  const searches = rows.filter(r => r.event === 'search' && r.query);
  const searchCount = new Map<string, number>();
  for (const r of searches) {
    const q = (r.query as string).toUpperCase();
    searchCount.set(q, (searchCount.get(q) ?? 0) + 1);
  }
  const pageViews = rows.filter(r => r.event === 'page' && r.page);
  const pageCount = new Map<string, number>();
  for (const r of pageViews) pageCount.set(r.page as string, (pageCount.get(r.page as string) ?? 0) + 1);
  const totalViews = pageViews.length;

  // IST hour buckets of all non-ping events
  const slots = [
    { timeSlot: 'Before 09:15', phase: 'Pre-market', from: 0, to: 9 * 60 + 15 },
    { timeSlot: '09:15 – 11:00', phase: 'Opening', from: 9 * 60 + 15, to: 11 * 60 },
    { timeSlot: '11:00 – 13:30', phase: 'Mid-day', from: 11 * 60, to: 13 * 60 + 30 },
    { timeSlot: '13:30 – 15:30', phase: 'Closing', from: 13 * 60 + 30, to: 15 * 60 + 30 },
    { timeSlot: 'After 15:30', phase: 'Post-market', from: 15 * 60 + 30, to: 24 * 60 },
  ];
  const counts = slots.map(() => 0);
  const acts = rows.filter(r => r.event === 'page' || r.event === 'search');
  for (const r of acts) {
    const d = new Date(new Date(r.created_at).getTime() + 19800 * 1000);
    const min = d.getUTCHours() * 60 + d.getUTCMinutes();
    const i = slots.findIndex(s => min >= s.from && min < s.to);
    if (i >= 0) counts[i] += 1;
  }
  const maxSlot = Math.max(1, ...counts);

  return {
    totalQueries: searches.length,
    topSearches: [...searchCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symbol, count]) => ({ symbol, count })),
    toolUsage: [...pageCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tool, views]) => ({ tool, views, share: totalViews ? Math.round((views / totalViews) * 1000) / 10 : 0 })),
    hourlyTraffic: slots.map((s, i) => ({
      timeSlot: s.timeSlot,
      phase: s.phase,
      queries: counts[i],
      pct: Math.round((counts[i] / maxSlot) * 100),
      intensity: counts[i] === maxSlot && counts[i] > 0 ? 'peak' : counts[i] > 0 ? 'medium' : 'low',
    })),
    recentActivity: rows
      .filter(r => r.event !== 'ping')
      .slice(0, 25)
      .map((r, i) => ({
        id: `${r.session_id}-${i}`,
        type: r.event,
        title: r.event === 'search' ? `Searched ${r.query}` : r.event === 'session_start' ? 'Started a session' : `Opened ${r.page}`,
        detail: r.email ?? '',
        time: timeAgo(r.created_at),
        badge: r.event === 'search' ? 'SEARCH' : r.event === 'session_start' ? 'LOGIN' : 'PAGE',
      })),
  };
}
