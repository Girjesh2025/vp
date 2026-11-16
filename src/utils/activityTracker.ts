// Real user-activity tracking → Supabase table public.user_activity (see supabase/migrations/20261116_user_activity.sql).
// Rows are written with the signed-in user's own token; row-level security only lets a user insert their own rows
// and only admins read them. Nothing is sent when nobody is signed in.

import { supabase } from '../lib/supabase';

const SESSION_ID_KEY = 'pp_activity_session_id';
const SESSION_LAST_KEY = 'pp_activity_last_at';
const SESSION_IDLE_MS = 30 * 60 * 1000; // a gap longer than 30 min starts a new session
export const PING_INTERVAL_MS = 60 * 1000;

type ActivityEvent = 'session_start' | 'page' | 'search' | 'ping' | 'session_end';

interface TrackUser {
  id?: string;
  email?: string;
  name?: string;
}

const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Per-tab session id; a new one after 30 min of no activity. Returns [id, isNew]. */
const currentSession = (): [string, boolean] => {
  try {
    const now = Date.now();
    const id = sessionStorage.getItem(SESSION_ID_KEY);
    const last = Number(sessionStorage.getItem(SESSION_LAST_KEY) || 0);
    if (id && now - last < SESSION_IDLE_MS) {
      sessionStorage.setItem(SESSION_LAST_KEY, String(now));
      return [id, false];
    }
    const fresh = newId();
    sessionStorage.setItem(SESSION_ID_KEY, fresh);
    sessionStorage.setItem(SESSION_LAST_KEY, String(now));
    return [fresh, true];
  } catch {
    return [newId(), true];
  }
};

const insert = async (user: TrackUser | null | undefined, event: ActivityEvent, extra: { page?: string; query?: string } = {}) => {
  if (typeof window === 'undefined' || !user?.id || !user.email) return;
  const [sessionId, isNew] = currentSession();
  const base = {
    user_id: user.id,
    email: user.email.toLowerCase(),
    session_id: sessionId,
    user_agent: navigator.userAgent.slice(0, 300),
  };
  const rows: Record<string, unknown>[] = [];
  if (isNew && event !== 'session_start') rows.push({ ...base, event: 'session_start', page: extra.page ?? null });
  rows.push({ ...base, event, page: extra.page ?? null, query: extra.query ?? null });
  try {
    await supabase.from('user_activity').insert(rows);
  } catch {
    // tracking must never break the app
  }
};

export const trackPageView = (pageName: string, user?: TrackUser | null) => insert(user, 'page', { page: pageName });

export const trackStockSearch = (query: string, user?: TrackUser | null, page?: string) => {
  const q = typeof query === 'string' ? query.trim().slice(0, 60) : '';
  if (!q) return;
  void insert(user, 'search', { query: q, page });
};

/** Presence: one ping per minute while the tab is visible. */
export const startPresenceHeartbeat = (getUser: () => TrackUser | null, getPage: () => string) => {
  if (typeof window === 'undefined') return () => {};
  const send = () => {
    if (document.visibilityState !== 'visible') return;
    void insert(getUser(), 'ping', { page: getPage() });
  };
  const interval = setInterval(send, PING_INTERVAL_MS);
  return () => clearInterval(interval);
};
