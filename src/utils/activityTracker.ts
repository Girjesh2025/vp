// Activity Tracker Utility for Real-time User Presence & Analytics Tracking

const SESSION_START_KEY = 'paperprofit_session_start';
const LAST_PAGE_KEY = 'paperprofit_last_page';

export const getSessionStartTime = (): number => {
  if (typeof window === 'undefined') return Date.now();
  let start = sessionStorage.getItem(SESSION_START_KEY);
  if (!start) {
    start = String(Date.now());
    sessionStorage.setItem(SESSION_START_KEY, start);
  }
  return parseInt(start, 10) || Date.now();
};

export const getSessionDurationSeconds = (): number => {
  const start = getSessionStartTime();
  return Math.max(1, Math.floor((Date.now() - start) / 1000));
};

export interface TrackUserPayload {
  userId?: string;
  email?: string;
  name?: string;
  page?: string;
  search?: string;
}

export const sendActivityPing = async (payload: TrackUserPayload) => {
  if (typeof window === 'undefined') return;
  const email = payload.email || localStorage.getItem('paperprofit_user_email') || '';
  const userId = payload.userId || localStorage.getItem('paperprofit_user_id') || '';
  const name = payload.name || localStorage.getItem('paperprofit_user_name') || '';

  if (!email && !userId) return;

  const duration = getSessionDurationSeconds();
  const page = payload.page || sessionStorage.getItem(LAST_PAGE_KEY) || 'Dashboard';
  if (payload.page) {
    sessionStorage.setItem(LAST_PAGE_KEY, payload.page);
  }

  try {
    await fetch('/api/analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        name,
        page,
        search: payload.search,
        sessionDuration: duration
      })
    });
  } catch (err) {
    // Non-blocking fail-safe
  }
};

export const trackPageView = (pageName: string, user?: { id?: string; email?: string; name?: string }) => {
  sendActivityPing({
    userId: user?.id,
    email: user?.email,
    name: user?.name,
    page: pageName
  });
};

export const trackStockSearch = (query: string, user?: { id?: string; email?: string; name?: string }) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) return;
  sendActivityPing({
    userId: user?.id,
    email: user?.email,
    name: user?.name,
    search: query.trim()
  });
};

export const startPresenceHeartbeat = (
  getUser: () => { id?: string; email?: string; name?: string } | null,
  getPage: () => string
) => {
  if (typeof window === 'undefined') return () => {};

  const send = () => {
    const user = getUser();
    if (!user || !user.email) return;
    const page = getPage();
    sendActivityPing({
      userId: user.id,
      email: user.email,
      name: user.name,
      page
    });
  };

  // Immediate ping on mount
  send();

  // Ping every 30 seconds
  const interval = setInterval(send, 30000);

  return () => clearInterval(interval);
};
