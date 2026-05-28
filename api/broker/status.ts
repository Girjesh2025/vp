import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
  res.status(200).json({ connected: false, disabled: true });
}
