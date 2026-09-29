import type { VercelRequest, VercelResponse } from '@vercel/node';

let settingsCache = {
  maintenanceMode: false,
  refreshIntervalSeconds: 15,
  allowRegistrations: true,
  maxPortfoliosPerUser: 10,
  enableRealtimeQuotes: true
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const updates = req.body || {};
    settingsCache = { ...settingsCache, ...updates };
    return res.status(200).json({ success: true, settings: settingsCache, message: 'Settings saved' });
  }

  return res.status(200).json({ settings: settingsCache });
}
