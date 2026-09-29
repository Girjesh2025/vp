import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    analytics: {
      totalUsers: 4,
      activeToday: 4,
      totalPageViews: 1240,
      avgSessionMinutes: 28,
      topPages: [
        { path: '/portfolio', name: 'Portfolio', views: 540 },
        { path: '/market-eye', name: 'Market Eye', views: 320 },
        { path: '/admin', name: 'Admin Cockpit', views: 210 },
        { path: '/swing', name: 'Swing Player', views: 170 }
      ],
      topTickers: [
        { symbol: 'RELIANCE', searches: 98 },
        { symbol: 'TCS', searches: 72 },
        { symbol: 'HDFCBANK', searches: 64 },
        { symbol: 'TRENT', searches: 51 }
      ]
    }
  });
}
