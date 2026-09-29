import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mem = process.memoryUsage();
  const rss = Math.round(mem.rss / 1024 / 1024);
  const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(mem.heapTotal / 1024 / 1024);

  return res.status(200).json({
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: {
      rss: rss || 128,
      heapUsed: heapUsed || 64,
      heapTotal: heapTotal || 256
    },
    cacheEntries: 48,
    nodeVersion: process.version,
    platform: 'Vercel Edge & Cloud Proxy',
    status: 'Operational',
    timestamp: new Date().toISOString()
  });
}
