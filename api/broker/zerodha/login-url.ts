import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ error: 'Broker connection is currently disabled in this production environment.' });
}
