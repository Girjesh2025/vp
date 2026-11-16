import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Users, activity and analytics are read by the admin page straight from Supabase under row-level security
// (supabase/migrations/20261116_user_activity.sql). This route only serves server stats and settings, and every
// call must carry the signed-in admin's Supabase access token.

// Public project URL and anon key (both already ship in the browser bundle); the admin check itself runs in the DB.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://drpzizargycsebvrkscf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycHppemFyZ3ljc2VidnJrc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTU2OTEsImV4cCI6MjA3NTA5MTY5MX0.CODBGqklfZ570P--DlWnQNtbDE8_PgQoWsYoGexmDys';

async function isAdminRequest(req: VercelRequest): Promise<boolean> {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc('is_admin');
    return !error && data === true;
  } catch {
    return false;
  }
}

// Per-instance only (serverless instances don't share memory); used for UI preferences, not security.
let settingsCache: Record<string, unknown> = {
  maintenanceMode: false,
  refreshIntervalSeconds: 15,
  allowRegistrations: true,
  maxPortfoliosPerUser: 10,
  enableRealtimeQuotes: true,
};
const ALLOWED_SETTINGS = new Set(Object.keys(settingsCache).concat(['marketDataProvider', 'sessionTimeoutHours', 'currency', 'auditLogging']));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const cleanUrl = (req.url || '').split('?')[0];
  const querySlug = req.query.slug;
  const slugAction = Array.isArray(querySlug) ? querySlug[querySlug.length - 1] : querySlug;
  const action = String(slugAction || cleanUrl.split('/').filter(Boolean).pop() || '').toLowerCase().trim();

  // Old builds still POST presence here; activity now goes to Supabase directly.
  if (action === 'heartbeat') return res.status(204).end();

  if (!(await isAdminRequest(req))) {
    return res.status(401).json({ error: 'Admin sign-in required' });
  }

  if (action === 'system-stats') {
    const mem = process.memoryUsage();
    return res.status(200).json({
      uptimeSeconds: Math.round(process.uptime()),
      memoryMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      platform: 'Vercel serverless',
      status: 'Operational',
      timestamp: new Date().toISOString(),
    });
  }

  if (action === 'flush-cache') {
    return res.status(200).json({
      success: false,
      message: 'Nothing to flush: serverless functions keep no shared cache. CDN entries expire within 30-300 s.',
    });
  }

  if (action === 'settings') {
    if (req.method === 'POST') {
      const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : {};
      const updates = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_SETTINGS.has(k)));
      settingsCache = { ...settingsCache, ...updates };
      return res.status(200).json({ success: true, settings: settingsCache, message: 'Settings saved' });
    }
    return res.status(200).json({ settings: settingsCache });
  }

  return res.status(404).json({ error: `Action ${action} not found` });
}
